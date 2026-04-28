// ── COUNTDOWN ──
function tick(){
  const now=new Date();
  const ev=new Date('2025-06-07T14:00:00+03:00');
  let diff=Math.max(0,ev-now);
  const d=Math.floor(diff/864e5); diff-=d*864e5;
  const h=Math.floor(diff/36e5); diff-=h*36e5;
  const m=Math.floor(diff/6e4); diff-=m*6e4;
  const s=Math.floor(diff/1e3);
  const pad=n=>String(n).padStart(2,'0');
  document.getElementById('cd-d').textContent=pad(d);
  document.getElementById('cd-h').textContent=pad(h);
  document.getElementById('cd-m').textContent=pad(m);
  document.getElementById('cd-s').textContent=pad(s);
  if(diff<=0){
    document.querySelector('.countdown-wrap').innerHTML='<div style="font-family:var(--cormorant,serif);font-style:italic;color:var(--gold-l);font-size:1.4rem">The experience has begun.</div>';
    return;
  }
}
tick(); setInterval(tick,1000);

// ── NAV ──
window.addEventListener('scroll',()=>{
  document.getElementById('nav').classList.toggle('scrolled',window.scrollY>40);
},{ passive:true });

const ham=document.getElementById('ham');
const drawer=document.getElementById('drawer');
ham.addEventListener('click',()=>{
  const open=drawer.classList.toggle('open');
  ham.classList.toggle('open',open);
  ham.setAttribute('aria-expanded',open);
  document.body.style.overflow=open?'hidden':'';
});
function closeNav(){
  drawer.classList.remove('open');
  ham.classList.remove('open');
  ham.setAttribute('aria-expanded','false');
  document.body.style.overflow='';
}
// close on outside click
document.addEventListener('click',e=>{
  if(!ham.contains(e.target)&&!drawer.contains(e.target)){closeNav();}
});

// ── SCROLL FADE-IN ──
const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')});},{threshold:.08});
document.querySelectorAll('.fi').forEach(el=>obs.observe(el));
setTimeout(()=>document.querySelectorAll('.hero .fi').forEach(el=>el.classList.add('vis')),120);

// ── FORM STATE ──
let fd={name:'',phone:'',email:'',type:'',attend:'',area:'',church:'',songs:'',notes:''};

function showStep(n){
  document.querySelectorAll('.step').forEach(s=>s.classList.remove('on'));
  document.getElementById('s'+n).classList.add('on');
  for(let i=1;i<=4;i++){
    const d=document.getElementById('d'+i);
    d.className='dot'+(i<n?' done':i===n?' on':'');
  }
  const sec=document.getElementById('register');
  setTimeout(()=>sec.scrollIntoView({behavior:'smooth',block:'start'}),50);
}

function next(from){
  if(from===1){
    const n=document.getElementById('inp-name').value.trim();
    const p=document.getElementById('inp-phone').value.trim();
    let ok=true;
    const fn=document.getElementById('f-name'), fp=document.getElementById('f-phone');
    if(!n){fn.classList.add('err');ok=false}else fn.classList.remove('err');
    if(!p){fp.classList.add('err');ok=false}else fp.classList.remove('err');
    if(!ok)return;
    fd.name=n;fd.phone=p;fd.email=document.getElementById('inp-email').value.trim();
  }
  if(from===2){
    if(!fd.type)return;
    if(fd.type==='Minister'){
      fd.area=document.getElementById('inp-area').value;
      fd.church=document.getElementById('inp-church').value.trim();
      fd.songs=document.getElementById('inp-songs').value.trim();
    }
  }
  if(from===3){if(!fd.attend)return;}
  if(from===3)buildSum();
  showStep(from+1);
}
function back(from){showStep(from-1);}

function selType(card,val){
  document.querySelectorAll('#type-grp .rc').forEach(c=>c.classList.remove('on'));
  card.classList.add('on');fd.type=val;
  document.getElementById('minsec').classList.toggle('on',val==='Minister');
}
function selAttend(card,val){
  document.querySelectorAll('#attend-grp .rc').forEach(c=>c.classList.remove('on'));
  card.classList.add('on');fd.attend=val;
}

function buildSum(){
  const ac=fd.attend==='Yes'?'#6abf8a':fd.attend==='Maybe'?'#E8B96A':'#C96B4C';
  document.getElementById('sum-body').innerHTML=
    `<span style="color:var(--text);font-weight:500">${fd.name}</span><br>`+
    `${fd.phone}${fd.email?' · '+fd.email:''}<br>`+
    `<span style="color:var(--gold)">${fd.type}</span>${fd.type==='Minister'&&fd.area?' · '+fd.area:''}<br>`+
    `Attending: <span style="color:${ac};font-weight:500">${fd.attend}</span>`;
}

async function doSubmit(){
  const btn=document.getElementById('sub-btn');
  fd.notes=document.getElementById('inp-notes').value.trim();
  btn.disabled=true;
  btn.innerHTML='<span class="ld"></span>Submitting…';
  const FORM_ID='https://formspree.io/f/xwvaydon'; // replace with Formspree ID
  const payload={name:fd.name,phone:fd.phone,email:fd.email||'(not provided)',type:fd.type,'ministry-area':fd.area,church:fd.church,songs:fd.songs,attending:fd.attend,notes:fd.notes,_subject:`EKB Registration: ${fd.name} (${fd.type} — ${fd.attend})`};
  try{
    if(FORM_ID!=='https://formspree.io/f/xwvaydon'){
      const r=await fetch(FORM_ID,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error();
    }
    if(fd.email)sendConfDraft(fd.name,fd.email,fd.type).catch(()=>{});
    document.getElementById('form-wrap').classList.add('gone');
    document.getElementById('dots').style.display='none';
    document.getElementById('success-state').classList.add('on');
  }catch(e){
    const b=document.getElementById('err-banner');
    b.textContent='Something went wrong. Please try again or WhatsApp us: +254 795 582 978';
    b.style.display='block';
    btn.disabled=false;btn.textContent='Complete Registration →';
  }
}

async function sendConfDraft(name,email,type){
  await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',max_tokens:400,
      system:'Create a Gmail draft immediately using the create_draft tool. No explanation.',
      messages:[{role:'user',content:`Gmail draft. To: ${email}. Subject: You're registered — EVERY KNEE BOW (07 June). Body: Hi ${name},

Your registration is confirmed for Every Knee Bow (2nd Edition).

DATE: Saturday, 07 June 2026 | TIME: 2:00 PM | LOCATION: Nairobi (venue shared prior)

Come expectant. Come Ready. See you on the 7th.

— The EKB Team
📞 +254 795 582 978 | Partner via M-Pesa Till: 311112`}],
      mcp_servers:[{type:'url',url:'https://gmailmcp.googleapis.com/mcp/v1',name:'gmail'}]
    })
  });
}

function waShare(){
  const t=`*Every Knee Bow – Worship Experience (2nd Edition)*\n🗓 Sunday, 07 June 2026 · 2:00 PM\n📍 Nairobi, Kenya\n\n_Register FREE:_ ${window.location.href}\n\n_Every knee shall bow. Every tongue shall confess._ `;
  window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');
}
function copyLink(){
  navigator.clipboard.writeText(window.location.href).then(()=>{
    const b=document.querySelector('.sbtn');
    const orig=b.textContent;b.textContent='Copied!';
    setTimeout(()=>b.textContent=orig,2000);
  });
}