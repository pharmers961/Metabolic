/* ============ METABOLIC METHOD TRACKER — APP CORE (v2) ============ */
/* Program data lives in program.js (PROGRAM, WAVE, PHASE_INFO, LIFTS). */

/* ------------------------------ utils ------------------------------ */
const $=(s,el)=>(el||document).querySelector(s);
const $$=(s,el)=>[...(el||document).querySelectorAll(s)];
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phaseById=(id)=>PROGRAM.find(p=>p.id===id)||PROGRAM[0];
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const BYDAY=['SU','MO','TU','WE','TH','FR','SA'];
const dkey=(d)=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const mondayOf=(d)=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const fmtRest=(s)=>s>=60?(s%60?`${Math.floor(s/60)}m${s%60}s`:`${s/60} min`):`${s} sec`;
const fmtClock=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const fmtVol=(v)=>v>=10000?`${(v/1000).toFixed(1)}k`:v.toLocaleString();
const announce=(m)=>{const l=$('#live');if(l)l.textContent=m};
const haptic=(pat)=>{if(S.prefs.haptic&&navigator.vibrate)navigator.vibrate(pat||30)};
const firstNum=(s)=>{const m=String(s??'').match(/\d+(\.\d+)?/);return m?+m[0]:null};
const plateStep=()=>S.unit==='kg'?2.5:5;
const roundPlate=(w)=>Math.round(w/plateStep())*plateStep();

/* ------------------------------ storage ------------------------------ */
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open('mm-db',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('kv');
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function idbGet(k){try{const db=await openDB();return await new Promise(res=>{
  const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(undefined)})}
  catch(e){return undefined}}
async function idbSet(k,v){try{const db=await openDB();await new Promise(res=>{
  const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=res})}catch(e){}}
async function idbClear(){try{const db=await openDB();await new Promise(res=>{
  const t=db.transaction('kv','readwrite');t.objectStore('kv').clear();t.oncomplete=res;t.onerror=res})}catch(e){}}

let S=null, saveT=null;
function defaults(){return{
  v:2, unit:'lb',
  pos:{phase:1,week:1,day:0},
  active:null, sessions:[],
  lifts:{}, subs:{}, restOverrides:{},
  prefs:{restAuto:true,sound:true,haptic:true,notify:false},
  schedule:{'1':0,'2':1,'3':2,'4':3,'5':4,'0':-1,'6':-1}, schedTime:'17:00',
  plans:{}, onboarded:false,
  fitbit:{clientId:'',token:null},
  google:{clientId:'',token:null,fileId:null,calIds:[],planIds:{},logWorkouts:false},
  lastBackup:0
}}
function normalize(st){
  const d=defaults(), out=Object.assign(d,st||{});
  out.pos=Object.assign({phase:1,week:1,day:0},st&&st.pos||{});
  out.prefs=Object.assign(d.prefs,st&&st.prefs||{});
  out.schedule=Object.assign(d.schedule,st&&st.schedule||{});
  out.fitbit=Object.assign({clientId:'',token:null},st&&st.fitbit||{});
  out.google=Object.assign({clientId:'',token:null,fileId:null,calIds:[],planIds:{},logWorkouts:false},st&&st.google||{});
  out.lifts=st&&st.lifts||{}; out.subs=st&&st.subs||{}; out.restOverrides=st&&st.restOverrides||{};
  out.plans=st&&st.plans||{};
  out.onboarded=!!(st&&st.onboarded)||!!(st&&st.sessions&&st.sessions.length); // existing users skip onboarding
  (out.sessions||[]).forEach(s=>{if(!s.id)s.id=s.date});
  return out;
}
function migrateV1(){
  const g=(k,dv)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):dv}catch(e){return dv}};
  if(localStorage.getItem('mm_sessions')===null&&localStorage.getItem('mm_phase')===null)return null;
  return normalize({
    pos:{phase:g('mm_phase',1),week:g('mm_week',1),day:0},
    unit:g('mm_unit','lb'), active:g('mm_active',null),
    sessions:g('mm_sessions',[]), fitbit:g('mm_fitbit',{clientId:'',token:null})
  });
}
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(()=>{
    const snap=JSON.parse(JSON.stringify(S));
    try{localStorage.setItem('mm_state',JSON.stringify(snap))}catch(e){}
    idbSet('state',snap);
  },350);
}

/* ------------------------------ export / import ------------------------------ */
function exportData(){
  const snap=JSON.parse(JSON.stringify(S)); delete snap.fitbit; delete snap.google; // no tokens in backups
  return {app:'metabolic-method-tracker',version:2,exported:new Date().toISOString(),state:snap};
}
async function doExport(){
  const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'});
  const file=new File([blob],'metabolic-method-backup.json',{type:'application/json'});
  S.lastBackup=Date.now();save();
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'Metabolic Method backup'});return}catch(e){/* fall through */}
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='metabolic-method-backup.json';a.click();
}
function mergeImport(d){
  let sessions=null, incoming=null;
  if(d&&d.state&&Array.isArray(d.state.sessions)){incoming=d.state;sessions=d.state.sessions}
  else if(d&&Array.isArray(d.sessions)){sessions=d.sessions}
  if(!sessions)throw new Error('That file doesn’t look like a backup from this app.');
  sessions.forEach(s=>{if(!s.id)s.id=s.date});
  const have=new Set(S.sessions.map(s=>s.id));
  let added=0;
  sessions.forEach(s=>{if(!have.has(s.id)){S.sessions.push(s);added++}});
  S.sessions.sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(incoming&&incoming.lifts){
    for(const k in incoming.lifts){
      const mine=S.lifts[k]=S.lifts[k]||{prs:[]};
      const seen=new Set(mine.prs.map(p=>p.date+':'+p.e));
      (incoming.lifts[k].prs||[]).forEach(p=>{if(!seen.has(p.date+':'+p.e))mine.prs.push(p)});
      mine.prs.sort((a,b)=>new Date(a.date)-new Date(b.date));
    }
  }
  if(incoming&&incoming.subs)S.subs=Object.assign({},incoming.subs,S.subs);
  save();
  return added;
}

/* ------------------------------ sheets & toasts ------------------------------ */
let sheetOnClose=null;
function sheet(html,onClose){
  sheetOnClose=onClose||null;
  $('#sheet').innerHTML=html;
  $('#sheetWrap').classList.add('on');
  const f=$('#sheet').querySelector('button,input,select,textarea');if(f)f.focus();
}
function closeSheet(){$('#sheetWrap').classList.remove('on');$('#sheet').innerHTML='';
  if(sheetOnClose){const f=sheetOnClose;sheetOnClose=null;f()}}
function confirmSheet(title,body,okLabel,onOk,danger){
  sheet(`<h2>${esc(title)}</h2><div class="sub" style="font-size:14px">${esc(body)}</div>
  <div class="row" style="margin-top:16px">
    <button class="btn ghost" id="shNo">Cancel</button>
    <button class="btn ${danger?'danger':''}" id="shYes" style="${danger?'':''}">${esc(okLabel)}</button></div>`);
  $('#shNo').onclick=closeSheet;
  $('#shYes').onclick=()=>{closeSheet();onOk()};
}
function toast(msg,opts={}){
  const t=document.createElement('div');t.className='toast'+(opts.gold?' gold':'');
  t.innerHTML=`<span class="grow">${esc(msg)}</span>`;
  if(opts.action){const b=document.createElement('button');b.className='act';b.textContent=opts.action;
    b.onclick=()=>{t.remove();opts.onAction&&opts.onAction()};t.appendChild(b)}
  const x=document.createElement('button');x.className='act';x.textContent='✕';x.setAttribute('aria-label','Dismiss');
  x.style.color='var(--muted)';x.onclick=()=>{t.remove();opts.onClose&&opts.onClose(false)};t.appendChild(x);
  $('#toasts').appendChild(t);
  setTimeout(()=>{if(t.parentNode){t.remove();opts.onClose&&opts.onClose(true)}},opts.ms||5000);
}

/* ------------------------------ program helpers ------------------------------ */
function target(entry,phase,week){
  let s=entry.s,r=entry.r;
  if(phase.weekly&&entry.wk){const w=entry.wk[Math.min(week,4)-1];s=w[0];r=w[1]}
  if(phase.wave&&entry.wave){const w=WAVE[Math.min(week,4)-1];s=w.s;r=w.r}
  return {s,r};
}
function perSetTargets(reps,n){ // '12/10/8' -> per-set; otherwise same target each set
  const parts=String(reps??'').split('/');
  if(parts.length>1)return Array.from({length:n},(_,i)=>parts[Math.min(i,parts.length-1)].trim());
  return Array.from({length:n},()=>String(reps??''));
}
function dispName(orig){return S.subs[orig]||orig}
function sessionVolume(sess){
  return Object.values(sess.log||{}).filter(x=>x.sets).flatMap(x=>x.sets)
    .filter(x=>x.done).reduce((a,x)=>a+((+x.w||0)*(+x.r||0)),0);
}
function lastSets(name){ // most recent done sets for a display name
  for(let i=S.sessions.length-1;i>=0;i--){
    const sess=S.sessions[i];
    for(const k in sess.log){
      const e=sess.log[k];
      if(e.name===name&&e.sets&&e.sets.some(x=>x.done))
        return {date:sess.date,sets:e.sets.filter(x=>x.done)};
    }
  }
  return null;
}
function exerciseHistory(name){ // [{date, sets, best, e1}]
  const out=[];
  S.sessions.forEach(sess=>{
    for(const k in sess.log){
      const e=sess.log[k];
      if(e.name===name&&e.sets&&e.sets.some(x=>x.done)){
        const done=e.sets.filter(x=>x.done&&+x.w&&+x.r);
        const e1=done.length?Math.max(...done.map(x=>epley(+x.w,+x.r))):null;
        out.push({date:sess.date,sets:e.sets.filter(x=>x.done),e1});
      }
    }
  });
  return out;
}

/* ------------------------------ 1RM / lifts ------------------------------ */
const epley=(w,r)=>r<=1?w:w*(1+Math.min(r,12)/30);
function liftBest(k){const l=S.lifts[k];if(!l||!l.prs.length)return null;
  return l.prs.reduce((a,p)=>p.e>a.e?p:a,l.prs[0])}
function savePR(k,e,w,r){
  const l=S.lifts[k]=S.lifts[k]||{prs:[]};
  l.prs.push({date:new Date().toISOString(),e:Math.round(e),w:w??null,r:r??null});
  save();
}
function maybePR(slotName,w,r){ // auto-saves and returns the PR (or null) — caller shows the celebration
  const k=liftKeyFor(slotName);if(!k||!(+w)||!(+r))return null;
  const e=epley(+w,+r), best=liftBest(k);
  if(e<(S.unit==='kg'?20:45))return null; // ignore empty-bar/warm-up weights
  if(!best||e>best.e+0.4){
    savePR(k,e,+w,+r);
    sessionPRs[k]=Math.round(e);
    return {k,e:Math.round(e),prev:best?best.e:null,prevDate:best?best.date:null};
  }
  return null;
}

/* ---- celebration overlay (#52, #55) ---- */
let celebThen=null,celebUndo=null;
function celebrate(o,then){
  celebThen=then||null;celebUndo=o.undo||null;
  $('#prPre').textContent=o.pre;$('#prTitle').textContent=o.title;
  $('#prBig').innerHTML=o.big;$('#prBeats').textContent=o.beats||'';
  $('#prUndo').hidden=!o.undo;
  $('#prOverlay').classList.add('on');
  $('#prClose').focus();
  announce(`${o.pre}: ${o.title} ${$('#prBig').textContent}`);
  haptic([80,40,80,40,200]);
  if(S.prefs.sound)chime();
  confettiBurst();
}
function closeCelebrate(){
  $('#prOverlay').classList.remove('on');
  const t=celebThen;celebThen=null;celebUndo=null;
  if(t)t();
}
function celebratePR(pr,then){
  celebrate({pre:'NEW PR',title:LIFTS[pr.k].label,
    big:`${pr.e} <span class="u">${esc(S.unit)}</span>`,
    beats:pr.prev?`Beats ${pr.prev} from ${new Date(pr.prevDate).toLocaleDateString(undefined,{month:'short',day:'numeric'})} — estimated 1RM, saved to your trophy wall.`:
      'First saved max — the baseline is set. Now beat it.',
    undo:()=>{const prs=S.lifts[pr.k].prs;prs.pop();delete sessionPRs[pr.k];save();}},then);
}
function confettiBurst(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=$('#confettiC');if(!c)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  c.width=c.offsetWidth*dpr;c.height=c.offsetHeight*dpr;
  const ctx=c.getContext('2d');
  const colors=['#F2C230','#C9A426','#EDE8DA','#57C288'];
  const ps=Array.from({length:70},()=>({x:c.width/2,y:c.height*.42,
    vx:(Math.random()-.5)*14*dpr,vy:(-4-Math.random()*9)*dpr,
    s:(3+Math.random()*5)*dpr,r:Math.random()*6.3,vr:(Math.random()-.5)*.4,
    col:colors[Math.floor(Math.random()*colors.length)]}));
  const t0=performance.now();
  (function tick(t){
    const dt=(t-t0)/1000;
    ctx.clearRect(0,0,c.width,c.height);
    ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.45*dpr;p.r+=p.vr;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.col;
      ctx.globalAlpha=Math.max(0,1-dt/1.6);
      ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);ctx.restore()});
    if(dt<1.6&&$('#prOverlay').classList.contains('on'))requestAnimationFrame(tick);
    else ctx.clearRect(0,0,c.width,c.height);
  })(t0);
}
function suggestedLoad(entry,phase,week){
  if(!(phase.wave&&entry.wave))return null;
  const k=liftKeyFor(entry.n);if(!k)return null;
  const best=liftBest(k);if(!best)return null;
  return roundPlate(best.e*WAVE[Math.min(week,4)-1].pct);
}

/* ------------------------------ charts (single gold series) ------------------------------ */
function sparkSVG(pts,w=320,h=90){ // pts: [{d:label,y:number}]
  if(pts.length<2){return `<div class="sub">Log this a couple of times to see a trend.</div>`}
  const pad={l:6,r:44,t:12,b:14};
  const ys=pts.map(p=>p.y),min=Math.min(...ys),max=Math.max(...ys),span=(max-min)||1;
  const X=i=>pad.l+i*(w-pad.l-pad.r)/(pts.length-1);
  const Y=v=>pad.t+(h-pad.t-pad.b)*(1-(v-min)/span);
  const line=pts.map((p,i)=>`${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const last=pts[pts.length-1];
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Trend from ${pts[0].y} to ${last.y}">
    <line x1="${pad.l}" y1="${Y(min)}" x2="${w-pad.r}" y2="${Y(min)}" stroke="var(--line)" stroke-width="1"/>
    <polyline points="${line}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(pts.length-1)}" cy="${Y(last.y)}" r="4" fill="var(--gold)" stroke="var(--bg)" stroke-width="2"/>
    <text class="axis" x="${w-pad.r+8}" y="${Y(last.y)+3}">${Math.round(last.y)}</text>
    <text class="axis" x="${pad.l}" y="${h-2}">${esc(pts[0].d)}</text>
    <text class="axis" x="${w-pad.r+8}" y="${h-2}">now</text>
  </svg>`;
}
function barsSVG(items,unitLbl){ // items: [{label,v}] weekly volume
  const w=320,h=120,pad={l:6,r:6,t:16,b:16};
  const max=Math.max(...items.map(i=>i.v),1);
  const bw=(w-pad.l-pad.r)/items.length;
  const bars=items.map((it,i)=>{
    const bh=Math.max(2,(h-pad.t-pad.b)*it.v/max);
    const x=pad.l+i*bw+1,y=h-pad.b-bh;
    const cur=i===items.length-1;
    return `<g><title>${esc(it.label)}: ${it.v.toLocaleString()} ${esc(unitLbl)}</title>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw-2).toFixed(1)}" height="${bh.toFixed(1)}" rx="3"
        fill="var(--gold)" opacity="${cur?1:.45}"/>
      ${it.v===max||cur?`<text class="axis" x="${(x+(bw-2)/2).toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle">${fmtVol(it.v)}</text>`:''}
      <text class="axis" x="${(x+(bw-2)/2).toFixed(1)}" y="${h-4}" text-anchor="middle">${esc(it.label)}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Weekly volume">
    <line x1="${pad.l}" y1="${h-pad.b}" x2="${w-pad.r}" y2="${h-pad.b}" stroke="var(--line)" stroke-width="1"/>${bars}</svg>`;
}

/* ------------------------------ nav ------------------------------ */
let cur='today';
function bindNav(){
  $$('nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav)));
}
function go(which,sub){
  cur=which;
  $$('nav button').forEach(x=>{const on=x.dataset.nav===which;x.classList.toggle('on',on);
    if(on)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});
  $$('.screen').forEach(sc=>sc.classList.remove('on'));
  $('#scr-'+which).classList.add('on');
  if(which==='stats'&&sub)statsState.tab=sub;
  render(which);
  window.scrollTo(0,0);
}
function render(which){
  ({today:renderToday,train:renderTrain,program:renderProgram,stats:renderStats,settings:renderSettings})[which]();
  renderBanner();
}
function renderBanner(){
  const b=$('#banner');
  const showing=S.active&&!(cur==='train');
  b.classList.toggle('on',!!showing);
  if(showing){
    const phase=phaseById(S.active.phase),day=phase.days[S.active.day];
    const mins=Math.round((Date.now()-S.active.started)/60000);
    b.innerHTML=`<div class="row"><div class="grow" style="font-size:13.5px"><b>Workout in progress</b>
      <span class="sub" style="display:inline">· ${esc(day.name)} · ${mins} min</span></div>
      <button class="btn small" id="bnResume">Resume</button></div>`;
    $('#bnResume').onclick=()=>go('train');
  }
}

/* ------------------------------ position / schedule ------------------------------ */
function clampPos(){
  const p=S.pos;p.phase=Math.min(6,Math.max(1,p.phase||1));p.week=Math.min(4,Math.max(1,p.week||1));
  p.day=Math.min(phaseById(p.phase).days.length-1,Math.max(0,p.day||0));
}
function advancePos(){
  const p=S.pos,phase=phaseById(p.phase);
  const roll={week:0,phase:0};
  p.day++;
  if(p.day>=phase.days.length){p.day=0;p.week++;roll.week=p.week-1;
    if(p.week>4){p.week=1;roll.phase=p.phase;p.phase=Math.min(6,p.phase+1)}}
  save();
  return roll;
}
function weekSessions(ref){ // sessions in the week of ref date, keyed by weekday
  const mon=mondayOf(ref||new Date()),end=new Date(mon);end.setDate(end.getDate()+7);
  const out={};
  S.sessions.forEach((s,i)=>{const d=new Date(s.date);
    if(d>=mon&&d<end){(out[d.getDay()]=out[d.getDay()]||[]).push(i)}});
  return out;
}

/* ---- weekly plans: concrete dates → program day, prefilled from the usual pattern ---- */
const weekKeyOf=(d)=>dkey(mondayOf(d));
function weekDates(monKey){const out=[];for(let i=0;i<7;i++){const d=new Date(monKey+'T12:00');d.setDate(d.getDate()+i);out.push(d)}return out}
function templateFor(dateObj){const v=S.schedule[String(dateObj.getDay())];return v==null?-1:v}
function effectiveDayFor(dateObj){ // planned program-day index for a concrete date (-1 = rest)
  const plan=S.plans[weekKeyOf(dateObj)];
  if(plan)return plan[dkey(dateObj)]??-1;
  return templateFor(dateObj);
}
function weeklyTarget(monKey){
  const plan=S.plans[monKey];
  if(plan)return Math.max(1,Object.values(plan).filter(v=>v>=0).length);
  const n=Object.values(S.schedule).filter(v=>v!=null&&v>=0).length;
  return Math.max(1,n||5);
}
function weekDoneCount(monKey){
  return S.sessions.filter(s=>weekKeyOf(new Date(s.date))===monKey).length;
}
function adherenceStreak(){ // consecutive weeks hitting the planned target; one light week forgiven per streak
  let streak=0,grace=1;
  const thisWk=weekKeyOf(new Date());
  if(weekDoneCount(thisWk)>=weeklyTarget(thisWk))streak++;
  let wk=mondayOf(new Date());wk.setDate(wk.getDate()-7);
  const first=S.sessions.length?mondayOf(new Date(S.sessions[0].date)):null;
  while(first&&wk>=first){
    const k=dkey(wk),done=weekDoneCount(k),T=weeklyTarget(k);
    if(done>=T)streak++;
    else if(done>=T-1&&done>0&&grace>0){grace--;streak++}
    else break;
    wk.setDate(wk.getDate()-7);
  }
  return streak;
}
function streakAtRisk(){ // true when the days left this week can't cover the remaining target
  const wk=weekKeyOf(new Date()),T=weeklyTarget(wk),done=weekDoneCount(wk);
  if(done>=T)return false;
  const today=new Date();today.setHours(0,0,0,0);
  const end=mondayOf(new Date());end.setDate(end.getDate()+7);
  const daysLeft=Math.round((end-today)/86400000); // incl. today
  return (T-done)>=daysLeft;
}
function missedInfo(){ // most recent planned-but-missed date in the last 3 days
  const today=new Date();today.setHours(0,0,0,0);
  if(!S.sessions.length)return null;
  const didDates=new Set(S.sessions.map(s=>dkey(new Date(s.date))));
  for(let back=1;back<=3;back++){
    const d=new Date(today);d.setDate(d.getDate()-back);
    if(S.sessions.length&&d<new Date(S.sessions[0].date))break;
    const di=effectiveDayFor(d);
    if(di>=0&&!didDates.has(dkey(d)))return {date:d,di};
  }
  return null;
}
function ensurePlan(monKey){ // materialize a week's plan from the usual pattern so it can be edited
  if(!S.plans[monKey]){
    const plan={};
    weekDates(monKey).forEach(d=>{const v=templateFor(d);if(v>=0)plan[dkey(d)]=v});
    S.plans[monKey]=plan;
  }
  return S.plans[monKey];
}
function planWeekSheet(monKey,onDone){
  const plan=Object.assign({},S.plans[monKey]||null);
  const hasPlan=!!S.plans[monKey];
  const phase=phaseById(S.pos.phase);
  const todayK=dkey(new Date());
  const rows=weekDates(monKey).map(d=>{
    const k=dkey(d),v=hasPlan?(plan[k]??-1):templateFor(d);
    return `<div class="planrow ${k===todayK?'today':''}">
      <div class="pd"><b>${DOW[d.getDay()]}</b>${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div>
      <select data-k="${k}" class="grow" aria-label="Workout for ${DOW[d.getDay()]}">
        <option value="-1" ${v<0?'selected':''}>Rest</option>
        ${phase.days.map((dd,di)=>`<option value="${di}" ${v===di?'selected':''}>Day ${di+1} — ${esc(dd.name)}</option>`).join('')}
      </select></div>`;
  }).join('');
  const mon=new Date(monKey+'T12:00');
  sheet(`<h2>Plan the week</h2>
  <div class="sub">Week of ${mon.toLocaleDateString(undefined,{month:'long',day:'numeric'})} — pick real dates; the calendar, streak and reminders follow this plan.</div>
  ${rows}
  <div class="row" style="margin-top:16px"><button class="btn ghost" id="plCancel">Cancel</button>
  <button class="btn" id="plSave">Save plan</button></div>`);
  $('#plCancel').onclick=closeSheet;
  $('#plSave').onclick=()=>{
    const p={};
    $$('#sheet select[data-k]').forEach(s=>{if(+s.value>=0)p[s.dataset.k]=+s.value});
    S.plans[monKey]=p;save();closeSheet();
    toast(`Week planned — ${Object.keys(p).length} workout${Object.keys(p).length===1?'':'s'}.`,{gold:true});
    if(S.google&&S.google.token)gcalSyncPlan(monKey).catch(()=>{});
    if(onDone)onDone();else render(cur);
  };
}
function rescheduleSheet(missed){
  const phase=phaseById(S.pos.phase);
  const dayName=phase.days[Math.min(missed.di,phase.days.length-1)].name;
  const didDates=new Set(S.sessions.map(s=>dkey(new Date(s.date))));
  const today=new Date();today.setHours(0,0,0,0);
  const opts=[];
  for(let f=0;f<10;f++){
    const d=new Date(today);d.setDate(d.getDate()+f);
    const k=dkey(d),cur=effectiveDayFor(d);
    if(didDates.has(k))continue;
    opts.push(`<option value="${k}">${f===0?'Today':f===1?'Tomorrow':DOW[d.getDay()]} · ${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}${cur>=0?` (replaces Day ${cur+1})`:''}</option>`);
  }
  sheet(`<h2>Missed: ${esc(dayName)}</h2>
  <div class="sub">Planned for ${missed.date.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}. Move it — don't lose it.</div>
  <label class="f">New date</label><select id="rsDate">${opts.join('')}</select>
  <div class="row" style="margin-top:16px">
    <button class="btn ghost" id="rsSkip">Skip it</button>
    <button class="btn" id="rsMove">Reschedule</button></div>`);
  const clearMissed=()=>{ // remove the missed entry so it stops nagging
    const wk=weekKeyOf(missed.date);ensurePlan(wk);
    delete S.plans[wk][dkey(missed.date)];save();
  };
  $('#rsSkip').onclick=()=>{clearMissed();closeSheet();render(cur);
    toast('Skipped. The streak grace covers one light week — don’t make it two.')};
  $('#rsMove').onclick=()=>{
    const k=$('#rsDate').value;
    clearMissed();
    const wk=weekKeyOf(new Date(k+'T12:00'));ensurePlan(wk);
    S.plans[wk][k]=missed.di;save();closeSheet();render(cur);
    toast(`Rescheduled to ${new Date(k+'T12:00').toLocaleDateString(undefined,{weekday:'long'})}.`,{gold:true});
    if(S.google&&S.google.token)gcalSyncPlan(wk).catch(()=>{});
  };
}

/* ---- progress narrative ---- */
function bestProgress(){ // biggest lift improvement since first PR
  let best=null;
  for(const k in S.lifts){
    const prs=S.lifts[k].prs;
    if(prs&&prs.length>=2){
      const d=prs[prs.length-1].e-prs[0].e;
      if(d>0&&(!best||d>best.delta))best={k,delta:d,from:prs[0],to:prs[prs.length-1]};
    }
  }
  return best;
}

/* ------------------------------ TODAY ------------------------------ */
function commitRingSVG(done,T){
  const R=30,C=2*Math.PI*R,frac=Math.min(1,T?done/T:0);
  return `<svg class="cring" viewBox="0 0 78 78" role="img" aria-label="${done} of ${T} workouts this week">
    <circle cx="39" cy="39" r="${R}" stroke="var(--surface2)" stroke-width="7" fill="none"/>
    <circle cx="39" cy="39" r="${R}" stroke="${frac>=1?'var(--green)':'var(--gold)'}" stroke-width="7" fill="none"
      stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 39 39)"/>
    <text x="39" y="45" text-anchor="middle">${done}/${T}</text></svg>`;
}
function journeyHTML(){
  const byPW={};
  S.sessions.forEach(s=>{byPW[`${s.phase}-${s.week}`]=(byPW[`${s.phase}-${s.week}`]||0)+1});
  const segs=PROGRAM.map(p=>{
    const ticks=[1,2,3,4].map(w=>{
      const n=byPW[`${p.id}-${w}`]||0;
      const full=n>=3||(p.id<S.pos.phase)||(p.id===S.pos.phase&&w<S.pos.week);
      const half=!full&&n>0;
      return `<div class="jtick ${full?'done':half?'half':''}"></div>`;
    }).join('');
    return `<div class="jseg">${ticks}</div>`;
  }).join('');
  const lbls=PROGRAM.map(p=>`<span class="${p.id===S.pos.phase?'cur':''}">P${p.id}</span>`).join('');
  return `<div class="journey">${segs}</div><div class="jlbl">${lbls}</div>`;
}
function renderToday(){
  clampPos();
  const el=$('#scr-today'),phase=phaseById(S.pos.phase);
  const now=new Date(),todayWd=now.getDay(),wk=weekKeyOf(now);
  const wsess=weekSessions();
  const wkCount=weekDoneCount(wk);
  const wkVol=Object.values(wsess).flat().reduce((a,i)=>a+sessionVolume(S.sessions[i]),0);
  const T=weeklyTarget(wk);
  const streak=adherenceStreak();
  const atRisk=streakAtRisk()&&wkCount>0;
  const stale=S.sessions.length>0&&(Date.now()-(S.lastBackup||0))>7*86400000&&!(S.google&&S.google.token);
  const planExists=!!S.plans[wk];
  const missed=missedInfo();
  const todayDi=effectiveDayFor(now);
  const heroDi=todayDi>=0?todayDi:S.pos.day;
  const heroDay=phase.days[Math.min(heroDi,phase.days.length-1)];
  const doneToday=S.sessions.some(s=>dkey(new Date(s.date))===dkey(now));

  let hero;
  if(S.active){
    const aphase=phaseById(S.active.phase),aday=aphase.days[S.active.day];
    const mins=Math.round((Date.now()-S.active.started)/60000);
    hero=`<div class="hero"><div class="h-eyebrow">WORKOUT IN PROGRESS · ${mins} MIN</div>
      <h2>${esc(aday.name)}</h2><button class="btn" id="heroGo">Resume workout</button></div>`;
  }else if(doneToday){
    hero=`<div class="hero"><div class="h-eyebrow">DONE FOR TODAY ✓</div>
      <h2>${esc(lastWorkoutName())}</h2>
      <div class="sub" style="margin-bottom:10px">${wkCount>=T?'Week target hit — anything more is a bonus.':`${T-wkCount} more this week keeps the streak alive.`}</div>
      <button class="btn ghost" id="heroPick">Start another anyway</button></div>`;
  }else{
    hero=`<div class="hero"><div class="h-eyebrow">${todayDi>=0?'PLANNED FOR TODAY':'UP NEXT'} · PHASE ${phase.id} · WEEK ${S.pos.week} · DAY ${heroDi+1}</div>
      <h2>${esc(heroDay.name)}</h2>
      ${todayDi<0?`<div class="sub" style="margin-bottom:10px">No workout planned today — bank one early and buy yourself a rest day later.</div>`:''}
      <button class="btn" id="heroGo">Start workout</button>
      <button class="btn ghost" id="heroPick" style="margin-top:8px">Pick a different day</button></div>`;
  }

  const strip=[1,2,3,4,5,6,0].map(wd=>{
    const did=(wsess[wd]||[]).length>0;
    const d=new Date(mondayOf(now));d.setDate(d.getDate()+((wd+6)%7));
    const hasPlan=effectiveDayFor(d)>=0;
    return `<div class="wd ${wd===todayWd?'today':''}"><span class="lbl">${DOW[wd][0]}</span>
      <div class="dot ${did?'did':hasPlan?'plan':''}">${did?'✓':hasPlan?'·':''}</div></div>`;
  }).join('');

  const prog=bestProgress();
  const need=Math.max(0,T-wkCount);
  el.innerHTML=`
  <div class="pagehead"><span class="eyebrow">The Metabolic Method</span><h1>Today</h1>
    <div class="sub">${now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})} · Month ${phase.id} of 6</div></div>
  ${missed&&!S.active?`<div class="card" style="border-color:var(--red)"><div class="row">
    <div class="grow"><b style="font-size:14px">Missed: ${esc(phase.days[Math.min(missed.di,phase.days.length-1)].name)}</b>
    <div class="sub">Planned ${missed.date.toLocaleDateString(undefined,{weekday:'long'})}. Move it, don't lose it.</div></div>
    <button class="btn small" id="msFix">Reschedule</button></div></div>`:''}
  ${hero}
  <div class="card"><div class="ringwrap">${commitRingSVG(wkCount,T)}
    <div class="grow"><b style="font-size:15px">${wkCount>=T?'Week target hit 💪':need===1?'One more workout this week':`${need} more workouts this week`}</b>
      <div class="sub">${atRisk?'<span style="color:var(--red)">Streak at risk — the remaining days just cover it. No skips.</span>':
        wkCount>=T?`${fmtVol(wkVol)} ${esc(S.unit)} lifted this week.`:
        streak>0?`Keep the ${streak}-week streak alive.`:'Hit the target and the streak starts counting.'}</div></div>
    <div style="text-align:center;flex:0 0 auto"><div class="v" style="font-family:var(--mono);font-size:22px;color:${streak>0?'var(--gold)':'var(--muted)'}">${streak>0?'🔥'+streak:'—'}</div>
      <div class="l" style="font-size:10.5px;color:var(--muted);text-transform:uppercase;font-weight:600">wk streak</div></div>
  </div></div>
  ${!planExists&&!S.active?`<div class="card" style="border-color:var(--gold-dim)"><div class="row">
    <div class="grow"><b style="font-size:14px">This week isn't planned yet</b>
    <div class="sub">Put your ${T} workouts on real dates — planned workouts happen, vague ones don't.</div></div>
    <button class="btn small" id="plWeek">Plan week</button></div></div>`:''}
  <div class="card"><div class="weekstrip">${strip}</div>
    ${planExists?`<button class="btn small ghost" id="plEdit" style="margin-top:10px">Adjust this week's plan</button>`:''}</div>
  ${prog?`<div class="card" style="border-color:var(--gold-dim)"><b style="font-size:14px">📈 ${esc(LIFTS[prog.k].label)} est. 1RM up ${Math.round(prog.delta)} ${esc(S.unit)}</b>
    <div class="sub">${prog.from.e} → ${prog.to.e} since ${new Date(prog.from.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})}. That's the program working — don't interrupt it.</div></div>`:
    S.sessions.length>=2?(()=>{
      let single=null;for(const k in S.lifts){if((S.lifts[k].prs||[]).length===1)single={k,e:S.lifts[k].prs[0].e}}
      return `<div class="card"><b style="font-size:14px">📈 ${single?'The trend starts at your next PR':'No strength trend yet'}</b>
      <div class="sub">${single?`${esc(LIFTS[single.k].label)} baseline is ${single.e} ${esc(S.unit)} — beat it once and this card starts charting the climb.`:
      'Save a 1RM (Stats → Lifts) and this card starts tracking how much stronger you’re getting.'}</div></div>`})():''}
  <div class="card"><label class="f" style="margin-top:0">The 6-month journey</label>${journeyHTML()}</div>
  ${stale?`<div class="card" style="border-color:var(--gold-dim)"><div class="row">
    <div class="grow"><b style="font-size:14px">Back up your training log</b>
    <div class="sub">Last backup ${S.lastBackup?Math.round((Date.now()-S.lastBackup)/86400000)+' days ago':'never'} — everything lives on this phone.</div></div>
    <button class="btn small" id="bkNow">Export</button></div></div>`:''}`;
  const hg=$('#heroGo');if(hg)hg.onclick=()=>{if(!S.active)startSession(S.pos.phase,heroDi>=0?heroDi:S.pos.day,S.pos.week);go('train')};
  const hp=$('#heroPick');if(hp)hp.onclick=()=>go('train');
  const bk=$('#bkNow');if(bk)bk.onclick=doExport;
  const pw=$('#plWeek');if(pw)pw.onclick=()=>planWeekSheet(wk);
  const pe=$('#plEdit');if(pe)pe.onclick=()=>planWeekSheet(wk);
  const ms=$('#msFix');if(ms)ms.onclick=()=>rescheduleSheet(missed);
}
function lastWorkoutName(){
  const s=S.sessions[S.sessions.length-1];if(!s)return'';
  return phaseById(s.phase).days[s.day].name;
}

/* ------------------------------ TRAIN (day picker + session) ------------------------------ */
function renderTrain(){
  const el=$('#scr-train');
  if(S.active){renderSession(el);return}
  clampPos();
  const phase=phaseById(S.pos.phase);
  const wsess=weekSessions();
  const doneDays=new Set();
  Object.values(wsess).flat().forEach(i=>{const s=S.sessions[i];
    if(s.phase===S.pos.phase)doneDays.add(s.day)});
  el.innerHTML=`
  <div class="pagehead"><span class="eyebrow">The Metabolic Method</span>
    <h1>Start a workout</h1>
    <div class="sub">${esc(phase.name)}</div></div>
  <div class="pills" id="phasePills" role="tablist">${PROGRAM.map(p=>
    `<button class="pill ${p.id===S.pos.phase?'on':''}" data-p="${p.id}">Phase ${p.id}</button>`).join('')}</div>
  <div class="pills" style="margin-top:8px" id="weekPills">
    ${[1,2,3,4].map(w=>`<button class="pill ${w===S.pos.week?'on':''}" data-w="${w}">Week ${w}${phase.wave?' · '+WAVE[w-1].s+'×'+WAVE[w-1].r:''}</button>`).join('')}
  </div>
  <div class="note">${phase.wave?'Strength phase — main lifts follow the wave (3×8 → 4×6 → 5×5 → 4×4). Save a 1RM in Stats → Lifts and the app suggests your working weights.':
    phase.weekly?'Phase 1 progresses week to week — targets update automatically.':
    'Targets don’t change by week in this phase — the week selector just tracks where you are in the month.'}</div>
  <div style="margin-top:14px">
    ${phase.days.map((d,i)=>{
      const isNext=i===S.pos.day&&phase.id===S.pos.phase,done=doneDays.has(i);
      return `<button class="daycard ${isNext?'next':''} ${d.recovery?'recovery':''}" data-d="${i}">
      ${done?`<span class="badge done">✓ Done</span>`:isNext?`<span class="badge">Up next</span>`:''}
      <div class="dnum">DAY ${i+1}${d.recovery?' · RECOVERY':''}</div><div class="dname">${esc(d.name)}</div>
      <div class="dmeta">${d.items.filter(x=>x.t!=='wu').length} movements · ${d.items.filter(x=>x.t==='wu').length} warm-ups</div>
    </button>`}).join('')}
  </div>`;
  $$('#phasePills .pill',el).forEach(b=>b.onclick=()=>{S.pos.phase=+b.dataset.p;clampPos();save();renderTrain()});
  $$('#weekPills .pill',el).forEach(b=>b.onclick=()=>{S.pos.week=+b.dataset.w;save();renderTrain()});
  $$('.daycard',el).forEach(b=>b.onclick=()=>{startSession(S.pos.phase,+b.dataset.d,S.pos.week);renderTrain()});
}

const entryKey=(di,ii)=>`d${di}i${ii}`;
let sessionPRs={}, foldState={}, cardBuilders={}, cardEls={};

function startSession(phaseId,dayIdx,week){
  const phase=phaseById(phaseId),day=phase.days[dayIdx],log={};
  day.items.forEach((it,ii)=>{
    const key=entryKey(dayIdx,ii);
    if(it.t==='wu'){log[key]={name:it.n,wu:true,done:false}}
    else if(it.t==='ex'){
      const t=target(it,phase,week);
      const prev=lastSets(dispName(it.n));
      log[key]={name:dispName(it.n),slot:it.n,
        sets:Array.from({length:t.s},(_,si)=>{
          const pw=prev&&(prev.sets[si]||prev.sets[prev.sets.length-1]);
          return {w:pw&&pw.w?pw.w:'',r:'',done:false};
        })};
    }else{
      it.items.forEach((sub,si)=>{
        const prev=lastSets(dispName(sub.n));
        log[key+'s'+si]={name:dispName(sub.n),slot:sub.n,ss:key,
          sets:Array.from({length:it.s},(_,ri)=>{
            const pw=prev&&(prev.sets[ri]||prev.sets[prev.sets.length-1]);
            return {w:pw&&pw.w?pw.w:'',r:'',done:false};
          })};
      });
    }
  });
  S.active={phase:phaseId,day:dayIdx,week,started:Date.now(),log,notes:{}};
  sessionPRs={};foldState={};
  save();acquireWakeLock();
}

function sessionCounts(){
  const log=S.active.log;
  const allSets=Object.values(log).filter(x=>x.sets).flatMap(x=>x.sets);
  const done=allSets.filter(x=>x.done).length;
  const exKeys=cardOrder().filter(c=>c.type!=='wu');
  const exDone=exKeys.filter(c=>cardComplete(c)).length;
  return {sets:allSets.length,done,ex:exKeys.length,exDone};
}
function cardOrder(){ // descriptors for the active day
  const phase=phaseById(S.active.phase),day=phase.days[S.active.day],out=[];
  const wuIdx=[];day.items.forEach((it,ii)=>{if(it.t==='wu')wuIdx.push(ii)});
  if(wuIdx.length)out.push({id:'wu',type:'wu',items:wuIdx.map(ii=>({it:day.items[ii],key:entryKey(S.active.day,ii)}))});
  day.items.forEach((it,ii)=>{
    const key=entryKey(S.active.day,ii);
    if(it.t==='ex')out.push({id:key,type:'ex',it,key});
    else if(it.t==='ss')out.push({id:key,type:'ss',it,key});
  });
  return out;
}
function cardComplete(c){
  const log=S.active.log;
  if(c.type==='wu')return c.items.every(x=>log[x.key].done);
  if(c.type==='ex')return log[c.key].sets.every(s=>s.done);
  return c.it.items.every((_,si)=>log[c.key+'s'+si].sets.every(s=>s.done));
}
function currentCardId(){
  for(const c of cardOrder()){if(!cardComplete(c))return c.id}
  return null;
}

function renderSession(el){
  const phase=phaseById(S.active.phase),day=phase.days[S.active.day];
  const c=sessionCounts();
  el.innerHTML=`
  <div class="progress"><div class="row" style="margin-bottom:6px">
    <div class="grow"><span class="eyebrow">Phase ${phase.id} · Week ${S.active.week}</span>
      <h1 style="font-size:22px">${esc(day.name)}</h1>
      <div class="sessmeta" id="sessMeta"></div></div>
    <div class="menuwrap"><button class="btn small ghost" id="sessMenuBtn" aria-haspopup="true" aria-label="Workout options">⋯</button>
      <div class="menu" id="sessMenu" hidden>
        <button id="mFinishLater">Finish later</button>
        <button id="mSound">${S.prefs.sound?'Mute':'Unmute'} timer sound</button>
        <button id="mDiscard" class="dngr">Discard workout…</button>
      </div></div></div>
    <div class="pbar"><div id="pfill"></div></div>
  </div>
  <div id="sessBody" class="twocol"></div>
  <button class="btn" id="finish" style="margin-top:14px">Finish workout</button>`;

  const body=$('#sessBody',el);
  cardBuilders={};cardEls={};
  cardOrder().forEach(c=>{
    const build=()=>c.type==='wu'?buildWuCard(c):c.type==='ex'?buildExCard(c):buildSsCard(c);
    cardBuilders[c.id]=build;
    const node=build();cardEls[c.id]=node;body.appendChild(node);
  });
  refreshFocus();updateBar();
  $('#finish',el).onclick=finishSheet;
  const mb=$('#sessMenuBtn',el),menu=$('#sessMenu',el);
  mb.onclick=(e)=>{e.stopPropagation();menu.hidden=!menu.hidden};
  document.addEventListener('click',()=>{if(menu)menu.hidden=true},{once:true});
  $('#mFinishLater').onclick=()=>{menu.hidden=true;go('today');toast('Workout paused — resume any time from the banner.')};
  $('#mSound').onclick=()=>{S.prefs.sound=!S.prefs.sound;save();renderSession(el)};
  $('#mDiscard').onclick=()=>{menu.hidden=true;
    confirmSheet('Discard this workout?','Nothing from this session will be saved.','Discard',()=>{
      S.active=null;save();stopRest();renderTrain()},true)};
}
function rebuildCard(id){
  if(!cardBuilders[id]||!cardEls[id])return;
  const fresh=cardBuilders[id]();
  cardEls[id].replaceWith(fresh);cardEls[id]=fresh;
}
function refreshFocus(){
  const curId=currentCardId();
  cardOrder().forEach(c=>{
    const el=cardEls[c.id];if(!el)return;
    el.classList.toggle('current',c.id===curId);
  });
}
function updateBar(){
  const c=sessionCounts();
  const fill=$('#pfill');if(fill)fill.style.width=(c.sets?Math.round(c.done/c.sets*100):0)+'%';
  const m=$('#sessMeta');if(m)m.textContent=`${c.exDone}/${c.ex} exercises · ${c.done}/${c.sets} sets`;
}
function afterChange(cardId){
  save();
  const c=cardOrder().find(x=>x.id===cardId);
  if(c&&cardComplete(c)&&foldState[cardId]!=='open')rebuildCard(cardId);
  updateBar();refreshFocus();
}

/* --- card builders --- */
function foldWrap(id,complete,summaryHTML,bodyEl,extraClass){
  const div=document.createElement('div');
  const folded=complete&&foldState[id]!=='open';
  div.className=`card excard ${folded?'folded':''} ${extraClass||''}`;
  if(folded){
    const b=document.createElement('button');b.className='foldsum';
    b.innerHTML=summaryHTML;b.setAttribute('aria-expanded','false');
    b.onclick=()=>{foldState[id]='open';rebuildCard(id);refreshFocus()};
    div.appendChild(b);
  }else{
    div.appendChild(bodyEl);
    if(complete){
      const b=document.createElement('button');b.className='btn small ghost';b.style.marginTop='10px';
      b.textContent='Collapse';b.onclick=()=>{foldState[id]='folded';rebuildCard(id);refreshFocus()};
      div.appendChild(b);
    }
  }
  return div;
}
function buildWuCard(c){
  const log=S.active.log,complete=c.items.every(x=>log[x.key].done);
  const body=document.createElement('div');
  body.innerHTML=`<div class="ssflag">Warm-up</div>`;
  c.items.forEach(({it,key})=>{
    const e=log[key];
    const row=document.createElement('div');row.className='wu'+(e.done?' done':'');
    row.innerHTML=`<div class="wbox">✓</div><div class="grow wt"><div class="exname">${esc(it.n)}</div>
      ${it.d?`<div class="sub">${esc(it.d)}</div>`:''}</div>`;
    row.setAttribute('role','button');row.tabIndex=0;
    const tog=()=>{e.done=!e.done;haptic();afterChange('wu');if(!cardComplete(c)||foldState['wu']==='open')rebuildCard('wu')};
    row.onclick=tog;row.onkeydown=(ev)=>{if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();tog()}};
    body.appendChild(row);
  });
  const doneN=c.items.filter(x=>log[x.key].done).length;
  return foldWrap('wu',complete,
    `<span class="ok">✓</span><span class="grow exname">Warm-up</span><span class="best">${doneN}/${c.items.length}</span>`,body);
}
function bestSetLabel(sets){
  const done=sets.filter(s=>s.done&&+s.w&&+s.r);
  if(!done.length)return sets.filter(s=>s.done).length?'done':'';
  const b=done.reduce((a,s)=>(+s.w*+s.r>+a.w*+a.r)?s:a,done[0]);
  return `${b.w}×${b.r}`;
}
function buildExCard(c){
  const phase=phaseById(S.active.phase),e=S.active.log[c.key];
  const t=target(c.it,phase,S.active.week);
  const sugg=suggestedLoad(c.it,phase,S.active.week);
  const restSec=S.restOverrides[c.it.n]??c.it.rest;
  const meta=`${t.s} × ${t.r}${sugg?` · <span class="sugg">try ${sugg} ${esc(S.unit)}</span>`:''}${restSec?` · rest ${fmtRest(restSec)}`:''}`;
  const body=exBlock(c,e,meta,t,restSec,phase.wave&&c.it.wave);
  const complete=e.sets.every(s=>s.done);
  return foldWrap(c.key,complete,
    `<span class="ok">✓</span><span class="grow exname">${esc(e.name)}</span><span class="best">${esc(bestSetLabel(e.sets))}</span>`,body);
}
function exBlock(c,e,metaHTML,t,restSec,showRpe){
  const frag=document.createElement('div');
  const targets=perSetTargets(t.r,e.sets.length);
  const prev=lastSets(e.name);
  frag.innerHTML=`<button class="exname" data-ex>${esc(e.name)}</button><div class="exmeta">${metaHTML}</div>
    ${prev?`<div class="lastlog">Last (${new Date(prev.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})}): ${esc(prev.sets.map(x=>`${x.w||'—'}×${x.r||'—'}`).join(', '))}</div>`:''}
    <div class="colhead ${showRpe?'rpe':''}"><span>Set</span><span></span><span>${esc(S.unit)}</span><span></span><span>Reps</span>${showRpe?'<span>RPE</span>':''}<span>✓</span></div>`;
  $('[data-ex]',frag).onclick=()=>exerciseSheet(e.slot,e.name);
  e.sets.forEach((st,si)=>{
    frag.appendChild(setRow(c.id,e,st,si,targets[si],restSec,showRpe,()=>nextAfter(c)));
  });
  const foot=document.createElement('div');foot.className='row';foot.style.marginTop='10px';
  const add=document.createElement('button');add.className='btn small ghost';add.textContent='+ Add set';
  add.onclick=()=>{ // insert the row in place — no re-render, no scroll jump
    const st={w:e.sets[e.sets.length-1]?.w||'',r:'',done:false};
    e.sets.push(st);save();
    const row=setRow(c.id,e,st,e.sets.length-1,targets[targets.length-1]||'',restSec,showRpe,()=>nextAfter(c));
    foot.parentNode.insertBefore(row,foot);
    updateBar();
  };
  foot.appendChild(add);
  const note=document.createElement('button');note.className='btn small ghost';
  note.textContent=S.active.notes[c.id]?'Edit note':'+ Note';
  note.onclick=()=>noteSheet(c.id);
  foot.appendChild(note);
  frag.appendChild(foot);
  if(S.active.notes[c.id]){
    const nb=document.createElement('div');nb.className='note';nb.textContent=S.active.notes[c.id];frag.appendChild(nb);
  }
  return frag;
}
function setRow(cardId,e,st,si,targetReps,restSec,showRpe,nextName){
  const row=document.createElement('div');row.className='setrow'+(showRpe?' rpe':'');
  const ph=firstNum(targetReps);
  row.innerHTML=`<span class="sn">${si+1}</span>
    <button class="step" aria-label="Decrease weight">−</button>
    <input type="number" inputmode="decimal" step="any" placeholder="${esc(S.unit)}" value="${esc(st.w)}" aria-label="Set ${si+1} weight">
    <button class="step" aria-label="Increase weight">+</button>
    <input type="number" inputmode="numeric" placeholder="${esc(targetReps||'reps')}" value="${esc(st.r)}" aria-label="Set ${si+1} reps, target ${esc(targetReps||'')}">
    ${showRpe?`<input type="number" inputmode="decimal" step="0.5" min="5" max="10" class="rpein" placeholder="RPE" value="${esc(st.rpe??'')}" aria-label="Set ${si+1} RPE">`:''}
    <button class="tick ${st.done?'done':''}" aria-pressed="${st.done}" aria-label="Mark set ${si+1} of ${esc(e.name)} done">✓</button>`;
  const [minus,plus]=$$('.step',row);
  const inputs=$$('input',row),wi=inputs[0],ri=inputs[1],rpein=showRpe?inputs[2]:null;
  wi.oninput=()=>{st.w=wi.value;save()};
  ri.oninput=()=>{st.r=ri.value;save()};
  if(rpein)rpein.oninput=()=>{st.rpe=rpein.value;save()};
  wi.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();ri.focus()}});
  ri.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();$('.tick',row).click()}});
  minus.onclick=()=>{st.w=String(Math.max(0,(+st.w||0)-plateStep()));wi.value=st.w;save()};
  plus.onclick=()=>{st.w=String((+st.w||0)+plateStep());wi.value=st.w;save()};
  $('.tick',row).onclick=(ev)=>{
    st.done=!st.done;
    let pr=null;
    if(st.done){
      if(!st.w&&si>0){st.w=e.sets[si-1].w;wi.value=st.w}
      if(!st.r&&ph!=null){st.r=String(ph);ri.value=st.r}
      haptic();
      pr=maybePR(e.slot,st.w,st.r);
    }
    ev.target.classList.toggle('done',st.done);
    ev.target.setAttribute('aria-pressed',String(st.done));
    afterChange(cardId);
    if(st.done){
      const goRest=()=>{
        const nx=nextName();
        if(restSec>0)startRest(restSec,nx,{exName:e.slot,beat:beatLine(e,si)});
      };
      if(pr)celebratePR(pr,goRest);else goRest();
    }
  };
  return row;
}
function beatLine(e,si){ // what to chase during the rest (#56)
  if(si+1>=e.sets.length)return '';
  const prev=lastSets(e.name);
  const p=prev&&prev.sets[si+1];
  if(p&&p.w&&p.r)return `Next: set ${si+2} — beat ${p.w}×${p.r} from last time`;
  return `Next: set ${si+2} of ${e.sets.length}`;
}
function nextAfter(c){ // name of what follows this card
  const order=cardOrder();
  const i=order.findIndex(x=>x.id===c.id);
  if(!cardComplete(c))return c.type==='ss'?'next round':S.active.log[c.key].name;
  for(let j=i+1;j<order.length;j++){
    const n=order[j];
    if(!cardComplete(n))return n.type==='wu'?'Warm-up':n.type==='ex'?S.active.log[n.key].name:(n.it.label||'Superset');
  }
  return 'Finish — last one!';
}
function buildSsCard(c){
  const log=S.active.log,it=c.it;
  const subs=it.items.map((sub,si)=>log[c.key+'s'+si]);
  const complete=subs.every(s=>s.sets.every(x=>x.done));
  const letters='ABCDE';
  const body=document.createElement('div');
  const doneRounds=Array.from({length:it.s},(_,ri)=>subs.every(s=>s.sets[ri].done)).filter(Boolean).length;
  body.innerHTML=`<div class="ssflag">${esc(it.label)} · round ${Math.min(doneRounds+1,it.s)}/${it.s}</div>
    ${it.items.map((sub,si)=>`<div class="sub" style="margin-top:2px"><b style="color:var(--bone)">${letters[si]}</b> — <button class="exname" style="font-size:13.5px;font-weight:500" data-si="${si}">${esc(subs[si].name)}</button> <span class="exmeta" style="display:inline">${esc(sub.r)}</span></div>`).join('')}`;
  $$('[data-si]',body).forEach(b=>b.onclick=()=>exerciseSheet(it.items[+b.dataset.si].n,subs[+b.dataset.si].name));
  for(let ri=0;ri<it.s;ri++){
    const rl=document.createElement('div');rl.className='roundlbl';rl.textContent=`ROUND ${ri+1}`;
    body.appendChild(rl);
    it.items.forEach((sub,si)=>{
      const e=subs[si],st=e.sets[ri];
      const row=document.createElement('div');row.className='setrow';
      const ph=firstNum(sub.r);
      row.innerHTML=`<span class="sn">${letters[si]}</span>
        <button class="step" aria-label="Decrease weight">−</button>
        <input type="number" inputmode="decimal" step="any" placeholder="${esc(S.unit)}" value="${esc(st.w)}" aria-label="${esc(e.name)} round ${ri+1} weight">
        <button class="step" aria-label="Increase weight">+</button>
        <input type="number" inputmode="numeric" placeholder="${esc(sub.r)}" value="${esc(st.r)}" aria-label="${esc(e.name)} round ${ri+1} reps">
        <button class="tick ${st.done?'done':''}" aria-pressed="${st.done}" aria-label="Mark ${esc(e.name)} round ${ri+1} done">✓</button>`;
      const [minus,plus]=$$('.step',row);
      const [wi,rin]=$$('input',row);
      wi.oninput=()=>{st.w=wi.value;save()};
      rin.oninput=()=>{st.r=rin.value;save()};
      minus.onclick=()=>{st.w=String(Math.max(0,(+st.w||0)-plateStep()));wi.value=st.w;save()};
      plus.onclick=()=>{st.w=String((+st.w||0)+plateStep());wi.value=st.w;save()};
      $('.tick',row).onclick=(ev)=>{
        st.done=!st.done;
        let pr=null;
        if(st.done){
          if(!st.w&&ri>0){st.w=e.sets[ri-1].w;wi.value=st.w}
          if(!st.r&&ph!=null){st.r=String(ph);rin.value=st.r}
          haptic();pr=maybePR(e.slot,st.w,st.r);
        }
        ev.target.classList.toggle('done',st.done);
        ev.target.setAttribute('aria-pressed',String(st.done));
        afterChange(c.key);
        if(st.done){
          const goRest=()=>{
            const roundDone=subs.every(s=>s.sets[ri].done);
            if(roundDone){
              const last=ri===it.s-1;
              const nx=last?nextAfter(c):`Round ${ri+2}: ${subs[0].name}`;
              if(it.rest>0)startRest(it.rest,nx,{exName:it.items[si].n,
                beat:last?'':`Round ${ri+2} of ${it.s} — match round ${ri+1}`});
              if(foldState[c.key]!=='open')rebuildCard(c.key); // refresh round counter
            }else{
              const restBetween=sub.rest??0;
              const nextSub=subs.find((s,sj)=>sj!==si&&!s.sets[ri].done);
              if(restBetween>0&&nextSub)startRest(restBetween,nextSub.name,{exName:it.items[si].n,quick:true});
            }
          };
          if(pr)celebratePR(pr,goRest);else goRest();
        }
      };
      body.appendChild(row);
    });
  }
  const foot=document.createElement('div');foot.className='row';foot.style.marginTop='10px';
  const note=document.createElement('button');note.className='btn small ghost';
  note.textContent=S.active.notes[c.key]?'Edit note':'+ Note';
  note.onclick=()=>noteSheet(c.key);
  foot.appendChild(note);body.appendChild(foot);
  if(S.active.notes[c.key]){const nb=document.createElement('div');nb.className='note';nb.textContent=S.active.notes[c.key];body.appendChild(nb)}
  return foldWrap(c.key,complete,
    `<span class="ok">✓</span><span class="grow exname">${esc(it.label)}</span><span class="best">${it.s} rounds</span>`,body);
}
function noteSheet(cardId){
  sheet(`<h2>Note</h2><textarea id="noteTxt" placeholder="e.g. felt heavy, left knee niggle, try 5 lb more next time">${esc(S.active.notes[cardId]||'')}</textarea>
  <div class="row" style="margin-top:14px"><button class="btn ghost" id="ntCancel">Cancel</button><button class="btn" id="ntSave">Save note</button></div>`);
  $('#ntCancel').onclick=closeSheet;
  $('#ntSave').onclick=()=>{S.active.notes[cardId]=$('#noteTxt').value.trim();save();closeSheet();
    if(cardEls[cardId])rebuildCard(cardId)};
}
/* exercise sheet: rename (substitution), rest override, history */
function exerciseSheet(slot,name){
  const hist=exerciseHistory(name);
  const restO=S.restOverrides[slot];
  sheet(`<h2 style="font-size:19px">${esc(name)}</h2>
  ${slot!==name?`<div class="sub">Program slot: ${esc(slot)}</div>`:''}
  <label class="f">Your movement for this slot</label>
  <input id="exRename" value="${esc(S.subs[slot]||'')}" placeholder="${esc(slot)} — e.g. High-Bar Back Squat">
  <div class="sub" style="margin-top:4px">The guide leaves variations up to you — name yours and history and 1RMs track it consistently.</div>
  <label class="f">Rest override (seconds)</label>
  <input id="exRest" type="number" inputmode="numeric" value="${esc(restO??'')}" placeholder="program default">
  ${hist.length?`<label class="f">History — best est. 1RM per session</label>
  <div class="chart">${sparkSVG(hist.filter(h=>h.e1).map(h=>({d:new Date(h.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}),y:h.e1})))}</div>
  <div style="margin-top:8px">${hist.slice(-5).reverse().map(h=>`<div class="stat"><span class="sub" style="margin:0">${new Date(h.date).toLocaleDateString()}</span>
    <span style="font-family:var(--mono);font-size:13px">${esc(h.sets.map(x=>`${x.w||'—'}×${x.r||'—'}`).join('  '))}</span></div>`).join('')}</div>`:''}
  <div class="row" style="margin-top:14px"><button class="btn ghost" id="exCancel">Close</button><button class="btn" id="exSave">Save</button></div>`);
  $('#exCancel').onclick=closeSheet;
  $('#exSave').onclick=()=>{
    const rn=$('#exRename').value.trim();
    if(rn)S.subs[slot]=rn;else delete S.subs[slot];
    const rv=$('#exRest').value.trim();
    if(rv&&+rv>0)S.restOverrides[slot]=+rv;else delete S.restOverrides[slot];
    if(S.active)Object.values(S.active.log).forEach(x=>{if(x.slot===slot)x.name=dispName(slot)});
    save();closeSheet();
    if(S.active&&cur==='train')renderSession($('#scr-train'));
  };
}

/* --- finish flow --- */
function compareToLast(a){ // this session vs the last time you did the same program day (#54)
  const prev=[...S.sessions].reverse().find(s=>s.phase===a.phase&&s.day===a.day);
  const vol=Object.values(a.log).filter(x=>x.sets).flatMap(x=>x.sets).filter(x=>x.done)
    .reduce((s,x)=>s+((+x.w||0)*(+x.r||0)),0);
  const out={vol,dVol:null,beat:0,tried:0};
  if(!prev)return out;
  out.dVol=vol-sessionVolume(prev);
  const prevBest={};
  Object.values(prev.log).forEach(x=>{
    if(x.sets){const top=Math.max(0,...x.sets.filter(t=>t.done).map(t=>+t.w||0));if(top)prevBest[x.name]=top}
  });
  Object.values(a.log).forEach(x=>{
    if(x.sets&&prevBest[x.name]){
      const top=Math.max(0,...x.sets.filter(t=>t.done).map(t=>+t.w||0));
      if(top){out.tried++;if(top>prevBest[x.name])out.beat++}
    }
  });
  return out;
}
function finishSheet(){
  const a=S.active;
  const c=sessionCounts();
  const anyDone=c.done>0||Object.values(a.log).some(x=>x.wu&&x.done);
  const cmp=compareToLast(a);
  const elapsed=Math.round((Date.now()-a.started)/60000);
  const durGuess=Math.max(1,Math.min(elapsed,240));
  const wk=weekKeyOf(new Date()),nth=weekDoneCount(wk)+1,T=weeklyTarget(wk);
  const phaseSessions=S.sessions.filter(s=>s.phase===a.phase).length+1;
  const phaseTotal=phaseById(a.phase).days.filter(d=>!d.recovery).length*4;
  const prHtml=Object.keys(sessionPRs).length?
    `<div class="note" style="border:1px solid var(--gold);background:var(--surface2)">🏆 New estimated 1RM${Object.keys(sessionPRs).length>1?'s':''}: ${Object.keys(sessionPRs).map(k=>`${esc(LIFTS[k].label)} ${sessionPRs[k]} ${esc(S.unit)}`).join(' · ')}</div>`:'';
  const winLines=[];
  if(cmp.dVol!=null)winLines.push(cmp.dVol>=0?`+${fmtVol(cmp.dVol)} ${S.unit} vs last ${phaseById(a.phase).days[a.day].name} day`:`${fmtVol(cmp.dVol)} ${S.unit} vs last time — lighter days happen; showing up is the win`);
  if(cmp.beat>0)winLines.push(`Beat last time on ${cmp.beat} of ${cmp.tried} exercises`);
  winLines.push(`Workout ${nth} of ${T} this week · Phase ${a.phase} ${Math.min(100,Math.round(phaseSessions/phaseTotal*100))}% done`);
  sheet(`<h2>Finish workout</h2>
  ${anyDone?'':'<div class="note" style="border-color:var(--red)">No sets are marked done yet.</div>'}
  <div class="statrow" style="margin-top:10px">
    <div class="tile"><div class="v">${c.done}</div><div class="l">Sets</div></div>
    <div class="tile"><div class="v">${fmtVol(cmp.vol)}</div><div class="l">${esc(S.unit)} volume</div></div>
    <div class="tile"><div class="v">${c.exDone}/${c.ex}</div><div class="l">Exercises</div></div>
  </div>
  ${prHtml}
  <div class="note">${winLines.map(esc).join('<br>')}</div>
  <label class="f">Duration (minutes)${elapsed>240?' — timer ran long, adjust if needed':''}</label>
  <input id="durIn" type="number" inputmode="numeric" value="${durGuess}">
  <div class="row" style="margin-top:14px">
    <button class="btn ghost" id="fnBack">Keep training</button>
    <button class="btn" id="fnSave">Save workout</button></div>
  <button class="btn ghost" id="fnShare" style="margin-top:8px">Share a workout card</button>`);
  $('#fnBack').onclick=closeSheet;
  $('#fnShare').onclick=()=>shareCard({
    title:phaseById(a.phase).days[a.day].name,
    lines:[`${c.done} sets · ${fmtVol(cmp.vol)} ${S.unit}`,
      ...(Object.keys(sessionPRs).length?[`PR: ${Object.keys(sessionPRs).map(k=>`${LIFTS[k].label} ${sessionPRs[k]} ${S.unit}`).join(' · ')}`]:[]),
      `Phase ${a.phase} · Week ${a.week} · workout ${nth}/${T} this week`]});
  $('#fnSave').onclick=()=>{
    const dur=Math.max(1,Math.min(600,+$('#durIn').value||durGuess));
    saveSession(dur);closeSheet();
  };
}
function saveSession(dur){
  const a=S.active;
  const sess={id:new Date().toISOString(),date:new Date().toISOString(),
    phase:a.phase,day:a.day,week:a.week,dur,log:a.log,notes:a.notes};
  S.sessions.push(sess);
  const prs=Object.keys(sessionPRs);
  S.active=null;stopRest();
  let roll={week:0,phase:0};
  if(a.phase===S.pos.phase&&a.day===S.pos.day&&a.week===S.pos.week)roll=advancePos();else save();
  go('today');
  if(roll.phase){
    celebrate({pre:'PHASE COMPLETE',title:`Phase ${roll.phase} is done`,
      big:`${roll.phase}<span class="u"> / 6</span>`,
      beats:roll.phase<6?`A month of work banked. ${phaseById(roll.phase+1).name.replace(/^Phase \d+ — /,'')} starts next — new stimulus, same habit.`:
        'Six months. The whole program. You are a different lifter than the one who started.'});
  }else if(roll.week){
    const p=phaseById(S.pos.phase);
    toast(`Week ${roll.week} complete${p.wave?` — the wave moves to ${WAVE[S.pos.week-1].s}×${WAVE[S.pos.week-1].r}`:''}. 💪`,{gold:true,ms:7000});
  }else{
    toast(prs.length?`Saved — with ${prs.length} PR${prs.length>1?'s':''}! 🏆`:'Workout saved.',{gold:prs.length>0});
  }
  if(S.google&&S.google.token){
    driveBackup(true).catch(()=>toast('Auto-backup needs Google re-connect (Settings).'));
    if(S.google.logWorkouts)gcalLogDone(sess).catch(()=>{});
  }
}

/* ---- share card (#58) ---- */
async function shareCard(o){
  const W=1080,H=1350;
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d');
  try{await document.fonts.load('80px Anton');await document.fonts.load('600 44px "IBM Plex Mono"')}catch(e){}
  x.fillStyle='#0C0C0A';x.fillRect(0,0,W,H);
  x.strokeStyle='#2B2919';x.lineWidth=2;x.strokeRect(40,40,W-80,H-80);
  x.fillStyle='#F2C230';x.font='600 34px "IBM Plex Mono", monospace';x.textAlign='left';
  x.fillText('THE METABOLIC METHOD',80,150);
  x.fillStyle='#EDE8DA';x.font='110px Anton, sans-serif';
  const words=(o.title||'').toUpperCase().split(' ');
  let line='',ly=290;
  words.forEach(w=>{
    if(x.measureText(line+' '+w).width>W-160&&line){x.fillText(line,80,ly);ly+=118;line=w}
    else line=line?line+' '+w:w;
  });
  x.fillText(line,80,ly);ly+=80;
  x.fillStyle='#9A9480';x.font='600 40px "IBM Plex Mono", monospace';
  x.fillText(new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}),80,ly);ly+=110;
  x.strokeStyle='#F2C230';x.lineWidth=6;x.beginPath();x.moveTo(80,ly-40);x.lineTo(320,ly-40);x.stroke();
  (o.lines||[]).forEach(l=>{
    x.fillStyle='#EDE8DA';x.font='600 52px "IBM Plex Mono", monospace';
    x.fillText(l,80,ly+40);ly+=110;
  });
  const streak=adherenceStreak();
  if(streak>0){x.fillStyle='#F2C230';x.font='600 44px "IBM Plex Mono", monospace';
    x.fillText(`🔥 ${streak}-week streak`,80,H-140)}
  x.fillStyle='#9A9480';x.font='600 30px "IBM Plex Mono", monospace';
  x.fillText('MM TRACKER',W-300,H-140);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const file=new File([blob],'workout.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'Workout'});return}catch(e){}
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='workout.png';a.click();
}

/* ------------------------------ REST TIMER ------------------------------ */
let rest=null,restT=null,miniT=null,wakeLock=null;
const RING=2*Math.PI*46;
async function acquireWakeLock(){
  if('wakeLock' in navigator){try{wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}
}
function startRest(sec,nextName,opts={}){
  if(!S.prefs.restAuto)return;
  const dur=S.restOverrides[opts.exName]??sec;
  if(!dur||dur<=0)return;
  clearInterval(restT);clearTimeout(miniT);
  rest={end:Date.now()+dur*1000,total:dur,next:nextName||'',beat:opts.beat||'',paused:false,quick:!!opts.quick||dur<=15};
  if(rest.quick){showPill()}
  else{
    $('#restOverlay').classList.add('on');
    $('#restPill').classList.remove('on');
    $('#restNext').innerHTML=`then <b>${esc(rest.next)}</b>`;
    $('#restBeat').textContent=rest.beat;
    $('#restPause').textContent='Pause';
    miniT=setTimeout(()=>{if(rest&&!rest.paused)showPill()},6000);
  }
  tickRest();
  restT=setInterval(tickRest,250);
  announce(`Rest ${fmtRest(dur)}, then ${rest.next}`);
}
function restLeft(){return rest.paused?rest.leftPause:Math.max(0,Math.ceil((rest.end-Date.now())/1000))}
function tickRest(){
  if(!rest)return;
  const left=restLeft();
  $('#restTime').textContent=fmtClock(left);
  $('#pillTime').textContent=fmtClock(left);
  $('#pillOpen').textContent=`then ${rest.next}`;
  const ring=$('#ring');
  ring.setAttribute('stroke-dasharray',RING);
  ring.setAttribute('stroke-dashoffset',RING*(1-left/rest.total));
  if(left===10)announce('10 seconds of rest left');
  if(left<=0&&!rest.paused)endRest(true);
}
function showPill(){
  $('#restOverlay').classList.remove('on');
  if(rest)$('#restPill').classList.add('on');
}
function showOverlay(){
  if(!rest)return;
  $('#restPill').classList.remove('on');
  $('#restOverlay').classList.add('on');
  $('#restNext').innerHTML=`then <b>${esc(rest.next)}</b>`;
  $('#restBeat').textContent=rest.beat||'';
}
function stopRest(){clearInterval(restT);clearTimeout(miniT);rest=null;
  $('#restOverlay').classList.remove('on');$('#restPill').classList.remove('on')}
function endRest(alarm){
  const nxt=rest?rest.next:'';
  stopRest();
  if(!alarm)return;
  announce(`Rest over — ${nxt}`);
  if(S.prefs.haptic&&navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
  if(S.prefs.sound)chime();
  if(S.prefs.notify&&'Notification' in window&&Notification.permission==='granted'&&document.hidden){
    navigator.serviceWorker?.ready.then(reg=>reg.showNotification('Rest over',{
      body:nxt?`Back to ${nxt}`:'Back to work',icon:'icon-192.png',vibrate:[200,100,200],tag:'mm-rest'})).catch(()=>{});
  }
}
function chime(){
  try{const ac=new (window.AudioContext||window.webkitAudioContext)();
    [0,.2,.4].forEach(t=>{const o=ac.createOscillator(),g=ac.createGain();
      o.connect(g);g.connect(ac.destination);o.frequency.value=880;
      g.gain.setValueAtTime(.25,ac.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+t+.15);
      o.start(ac.currentTime+t);o.stop(ac.currentTime+t+.16)})}catch(e){}
}
function bindRest(){
  $('#restPlus').onclick=()=>{if(!rest)return;
    if(rest.paused)rest.leftPause+=30;else rest.end+=30000;
    rest.total=Math.max(rest.total,restLeft());tickRest()};
  $('#restMinus').onclick=()=>{if(!rest)return;
    if(rest.paused)rest.leftPause=Math.max(1,rest.leftPause-15);else rest.end-=15000;tickRest()};
  $('#restPause').onclick=()=>{if(!rest)return;
    if(rest.paused){rest.end=Date.now()+rest.leftPause*1000;rest.paused=false;$('#restPause').textContent='Pause'}
    else{rest.leftPause=restLeft();rest.paused=true;$('#restPause').textContent='Resume'}
    tickRest()};
  $('#restSkip').onclick=()=>endRest(false);
  $('#pillSkip').onclick=()=>endRest(false);
  $('#restMini').onclick=showPill;
  $('#pillOpen').onclick=showOverlay;
  $('#prClose').onclick=closeCelebrate;
  $('#prUndo').onclick=()=>{if(celebUndo)celebUndo();closeCelebrate();toast('PR removed.')};
  // focus trap in overlay
  $('#restOverlay').addEventListener('keydown',(ev)=>{
    if(ev.key==='Escape'){showPill();return}
    if(ev.key!=='Tab')return;
    const f=$$('#restOverlay button');
    const first=f[0],last=f[f.length-1];
    if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}
    else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}
  });
}
function onVisibility(){
  if(document.visibilityState==='visible'){
    if(S&&S.active)acquireWakeLock();
    if(rest&&!rest.paused&&Date.now()>rest.end)endRest(true);
    else if(rest)tickRest();
  }
}

/* ------------------------------ PROGRAM tab ------------------------------ */
let progState={view:'list',phase:null,day:null,q:''};
function programIndex(){
  const out=[];
  PROGRAM.forEach(p=>p.days.forEach((d,di)=>d.items.forEach(it=>{
    if(it.t==='ex')out.push({name:it.n,phase:p.id,dayIdx:di,dayName:d.name});
    else if(it.t==='ss')it.items.forEach(sub=>out.push({name:sub.n,phase:p.id,dayIdx:di,dayName:d.name}));
  })));
  return out;
}
function renderProgram(){
  const el=$('#scr-program');
  const head=`<div class="pagehead"><span class="eyebrow">Reference</span><h1>The Program</h1>
    <div class="sub">6-month plan from the Metabolic Method guide.</div></div>
  <div class="searchbox"><input id="progQ" type="search" placeholder="Search exercises — e.g. Face Pulls" value="${esc(progState.q)}" aria-label="Search exercises"></div>`;
  if(progState.q){
    const q=progState.q.toLowerCase();
    const hits=programIndex().filter(x=>x.name.toLowerCase().includes(q));
    const seen=new Set();
    el.innerHTML=head+`<div class="card plist">${hits.length?hits.filter(h=>{
      const k=h.name+h.phase+h.dayIdx;if(seen.has(k))return false;seen.add(k);return true;
    }).map(h=>`<button class="prow" data-p="${h.phase}" data-d="${h.dayIdx}">${esc(dispName(h.name))}
      <div class="prsub">Phase ${h.phase} · Day ${h.dayIdx+1} — ${esc(h.dayName)}</div></button>`).join(''):
      `<div class="sub">No exercise matches “${esc(progState.q)}”.</div>`}</div>`;
  }
  else if(progState.view==='phase'){
    const p=phaseById(progState.phase);
    el.innerHTML=head+`<button class="backlink" id="pBack">← All phases</button>
    <div class="pagehead" style="margin-top:2px"><h2 style="font-size:22px">${esc(p.name)}</h2></div>
    <div class="note">${esc(PHASE_INFO[p.id]||'')}</div>
    <div style="margin-top:12px">${p.days.map((d,i)=>`<button class="daycard ${d.recovery?'recovery':''}" data-d="${i}">
      <div class="dnum">DAY ${i+1}${d.recovery?' · RECOVERY':''}</div><div class="dname">${esc(d.name)}</div>
      <div class="dmeta">${d.items.filter(x=>x.t!=='wu').length} movements · ${d.items.filter(x=>x.t==='wu').length} warm-ups</div>
    </button>`).join('')}</div>`;
    $('#pBack').onclick=()=>{progState={view:'list',q:''};renderProgram()};
    $$('.daycard',el).forEach(b=>b.onclick=()=>{progState.view='day';progState.day=+b.dataset.d;renderProgram()});
  }
  else if(progState.view==='day'){
    const p=phaseById(progState.phase),d=p.days[progState.day];
    const wk=progState.wk||1;
    el.innerHTML=head+`<button class="backlink" id="pBack">← ${esc(p.name)}</button>
    <div class="pagehead" style="margin-top:2px"><span class="eyebrow">Day ${progState.day+1}</span>
      <h2 style="font-size:22px">${esc(d.name)}</h2></div>
    ${(p.weekly||p.wave)?`<div class="pills">${[1,2,3,4].map(w=>`<button class="pill ${w===wk?'on':''}" data-w="${w}">Week ${w}</button>`).join('')}</div>`:''}
    <div class="card">${d.items.map(it=>{
      if(it.t==='wu')return `<div class="wu"><div class="wbox" style="border-style:dashed"></div><div class="grow"><div class="exname" style="font-weight:500;color:var(--muted)">${esc(it.n)}</div>${it.d?`<div class="sub">${esc(it.d)}</div>`:''}</div></div>`;
      if(it.t==='ex'){const t=target(it,p,wk);
        return `<div style="padding:9px 0;border-bottom:1px dashed var(--line)"><span class="exname">${esc(dispName(it.n))}</span>
        <div class="exmeta">${t.s} × ${esc(t.r)}${it.rest?' · rest '+fmtRest(it.rest):''}</div></div>`}
      return `<div style="padding:9px 0;border-bottom:1px dashed var(--line)"><span class="ssflag">${esc(it.label)} × ${it.s}</span>
        ${it.items.map(x=>`<div class="exmeta" style="color:var(--bone);font-family:var(--body)">${esc(dispName(x.n))} <span style="color:var(--gold-dim);font-family:var(--mono)">${esc(x.r)}</span></div>`).join('')}</div>`;
    }).join('')}</div>
    <button class="btn" id="pStart">Start this workout</button>`;
    $('#pBack').onclick=()=>{progState.view='phase';renderProgram()};
    $$('.pills .pill',el).forEach(b=>b.onclick=()=>{progState.wk=+b.dataset.w;renderProgram()});
    $('#pStart').onclick=()=>{
      if(S.active){toast('Finish or discard the current workout first.');return}
      startSession(p.id,progState.day,progState.wk||1);go('train');
    };
  }
  else{
    el.innerHTML=head+PROGRAM.map(p=>`<button class="daycard ${p.id===S.pos.phase?'next':''}" data-p="${p.id}">
      ${p.id===S.pos.phase?'<span class="badge">You are here</span>':''}
      <div class="dnum">MONTH ${p.id}</div><div class="dname">${esc(p.name.replace(/^Phase \d+ — /,''))}</div>
      <div class="dmeta">${esc((PHASE_INFO[p.id]||'').split('.')[0])}.</div></button>`).join('');
    $$('.daycard',el).forEach(b=>b.onclick=()=>{progState={view:'phase',phase:+b.dataset.p,q:''};renderProgram()});
  }
  const qin=$('#progQ');
  qin.oninput=()=>{progState.q=qin.value.trim();renderProgram();$('#progQ').focus();
    const v=$('#progQ');v.setSelectionRange(v.value.length,v.value.length)};
  $$('.plist .prow',el).forEach(b=>b.onclick=()=>{
    progState={view:'day',phase:+b.dataset.p,day:+b.dataset.d,q:''};renderProgram()});
}

/* ------------------------------ STATS tab ------------------------------ */
let statsState={tab:'calendar',month:null,exq:''};
function renderStats(){
  const el=$('#scr-stats');
  const tabs=[['calendar','Calendar'],['history','History'],['lifts','Lifts'],['exercises','Exercises'],['trends','Trends'],['recovery','Recovery']];
  el.innerHTML=`<div class="pagehead"><span class="eyebrow">Logbook & progress</span><h1>Stats</h1></div>
  <div class="pills" role="tablist">${tabs.map(([k,l])=>`<button class="pill ${statsState.tab===k?'on':''}" role="tab" aria-selected="${statsState.tab===k}" data-t="${k}">${l}</button>`).join('')}</div>
  <div id="statsBody" style="margin-top:12px"></div>`;
  $$('.pills .pill',el).forEach(b=>b.onclick=()=>{statsState.tab=b.dataset.t;renderStats()});
  const body=$('#statsBody',el);
  ({calendar:renderCalendar,history:renderHistory,lifts:renderLifts,exercises:renderExercises,trends:renderTrends,recovery:renderRecovery})[statsState.tab](body);
}

/* --- calendar --- */
function renderCalendar(body){
  if(!statsState.month)statsState.month=new Date();
  const m=statsState.month, y=m.getFullYear(), mo=m.getMonth();
  const byDay={};
  S.sessions.forEach((s,i)=>{(byDay[dkey(new Date(s.date))]=byDay[dkey(new Date(s.date))]||[]).push(i)});
  const first=new Date(y,mo,1), startPad=(first.getDay()+6)%7;
  const daysIn=new Date(y,mo+1,0).getDate();
  const today=dkey(new Date());
  const phase=phaseById(S.pos.phase);
  const firstLogged=S.sessions.length?new Date(S.sessions[0].date):null; // only flag misses after tracking began
  let cells='';
  for(let i=0;i<startPad;i++)cells+='<div></div>';
  for(let d=1;d<=daysIn;d++){
    const dt=new Date(y,mo,d),k=dkey(dt),did=byDay[k];
    const di=effectiveDayFor(dt),hasPlan=di>=0;
    const past=dt<new Date(new Date().setHours(0,0,0,0));
    const missed=past&&hasPlan&&!did&&firstLogged&&dt>firstLogged;
    cells+=`<button class="calcell inmonth ${did?'did':''} ${k===today?'today':''} ${!did&&hasPlan&&!past?'plan':''} ${missed?'missed':''}"
      data-k="${k}" data-past="${past?1:0}" aria-label="${dt.toDateString()}${did?', workout logged':hasPlan?`, planned Day ${di+1}`:''}">${d}</button>`;
  }
  const monthSessions=Object.keys(byDay).filter(k=>k.startsWith(`${y}-${String(mo+1).padStart(2,'0')}`));
  const monthVol=monthSessions.flatMap(k=>byDay[k]).reduce((a,i)=>a+sessionVolume(S.sessions[i]),0);
  body.innerHTML=`
  <div class="card"><div class="row"><div class="grow"><b style="font-size:14px">Program position</b>
    <div class="sub">Month ${S.pos.phase} of 6 · Week ${S.pos.week} · next up Day ${S.pos.day+1} — ${esc(phase.days[S.pos.day].name)}</div></div></div></div>
  <div class="card cal">
    <div class="calhead"><button id="calPrev" aria-label="Previous month">←</button>
      <span class="m">${m.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</span>
      <button id="calNext" aria-label="Next month">→</button></div>
    <div class="calgrid">${['M','T','W','T','F','S','S'].map(d=>`<div class="dow">${d}</div>`).join('')}${cells}</div>
    <div class="sub" style="margin-top:10px">● gold = trained · dot = planned · red = planned but missed. Tap a future day to adjust that week's plan.</div>
  </div>
  <div class="statrow">
    <div class="tile"><div class="v">${monthSessions.flatMap(k=>byDay[k]).length}</div><div class="l">Workouts</div></div>
    <div class="tile"><div class="v">${fmtVol(monthVol)}</div><div class="l">${esc(S.unit)} volume</div></div>
    <div class="tile"><div class="v">${adherenceStreak()}</div><div class="l">Week streak</div></div>
  </div>`;
  $('#calPrev').onclick=()=>{statsState.month=new Date(y,mo-1,1);renderStats()};
  $('#calNext').onclick=()=>{statsState.month=new Date(y,mo+1,1);renderStats()};
  $$('.calcell',body).forEach(b=>b.onclick=()=>{
    const idxs=byDay[b.dataset.k];
    if(idxs){ // day with logged workouts → open them
      sheet(`<h2>${new Date(b.dataset.k+'T12:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h2>
        ${idxs.map(i=>sessionDetailHTML(S.sessions[i],i)).join('')}
        <button class="btn ghost" id="shClose" style="margin-top:12px">Close</button>`);
      bindSessionDetail();
      $('#shClose').onclick=closeSheet;
    }else if(b.dataset.past!=='1'){ // future/today → plan that week
      planWeekSheet(weekKeyOf(new Date(b.dataset.k+'T12:00')),()=>renderStats());
    }
  });
}

/* --- history --- */
function sessionDetailHTML(s,idx){
  const phase=phaseById(s.phase),day=phase.days[s.day];
  const sets=Object.values(s.log).filter(x=>x.sets).flatMap(x=>x.sets).filter(x=>x.done);
  const vol=sessionVolume(s);
  return `<div class="hsession"><details><summary>
    <span style="font-family:var(--mono);font-size:12px;color:var(--muted)">${new Date(s.date).toLocaleDateString()}</span><br>
    Phase ${s.phase} · ${esc(day.name)} <span class="sub" style="display:inline">· ${sets.length} sets · ${s.dur} min${vol?` · ${vol.toLocaleString()} ${esc(S.unit)}`:''}</span></summary>
    ${Object.entries(s.log).filter(([,x])=>x.sets&&x.sets.some(t=>t.done)).map(([k,x])=>
      `<div class="sub" style="margin-top:6px"><button class="exname" style="color:var(--bone);font-size:13.5px" data-exh="${esc(x.name)}">${esc(x.name)}</button><br>
      <span style="font-family:var(--mono)">${x.sets.filter(t=>t.done).map(t=>`${t.w||'—'}×${t.r||'—'}${t.rpe?`@${t.rpe}`:''}`).join('  ')}</span>
      ${s.notes&&s.notes[k.replace(/s\d+$/,'')]?``:''}</div>`).join('')}
    ${s.notes&&Object.keys(s.notes).length?`<div class="note">${Object.values(s.notes).map(n=>esc(n)).join(' · ')}</div>`:''}
    <div class="row" style="margin-top:10px">
      <button class="btn small ghost" data-edit="${idx}">Edit</button>
      <button class="btn small ghost" data-share="${idx}">Share</button>
      <button class="btn small danger" data-del="${idx}">Delete</button></div>
  </details></div>`;
}
function bindSessionDetail(scope){
  $$('[data-exh]',scope).forEach(b=>b.onclick=()=>exHistorySheet(b.dataset.exh));
  $$('[data-del]',scope).forEach(b=>b.onclick=()=>{
    const idx=+b.dataset.del,s=S.sessions[idx];
    S.sessions.splice(idx,1);save();closeSheet();
    if(cur==='stats')renderStats();
    toast('Workout deleted.',{action:'Undo',ms:6000,onAction:()=>{
      S.sessions.splice(idx,0,s);save();if(cur==='stats')renderStats()}});
  });
  $$('[data-edit]',scope).forEach(b=>b.onclick=()=>editSessionSheet(+b.dataset.edit));
  $$('[data-share]',scope).forEach(b=>b.onclick=()=>{
    const s=S.sessions[+b.dataset.share],day=phaseById(s.phase).days[s.day];
    const sets=Object.values(s.log).filter(x=>x.sets).flatMap(x=>x.sets).filter(x=>x.done);
    shareCard({title:day.name,lines:[`${sets.length} sets · ${fmtVol(sessionVolume(s))} ${S.unit}`,
      `${s.dur} min · Phase ${s.phase} · Week ${s.week}`,
      new Date(s.date).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})]});
  });
}
function editSessionSheet(idx){
  const s=S.sessions[idx];
  const entries=Object.entries(s.log).filter(([,x])=>x.sets&&x.sets.some(t=>t.done));
  sheet(`<h2>Edit workout</h2>
  <div class="sub">${new Date(s.date).toLocaleDateString()} — fix typos in weights and reps.</div>
  <label class="f">Duration (minutes)</label><input id="edDur" type="number" value="${s.dur||''}">
  ${entries.map(([k,x],ei)=>`<label class="f">${esc(x.name)}</label>
    ${x.sets.map((t,si)=>t.done?`<div class="row" style="margin-top:6px">
      <input type="number" step="any" data-e="${ei}" data-s="${si}" data-f="w" value="${esc(t.w)}" aria-label="weight">
      <span class="sub">×</span>
      <input type="number" data-e="${ei}" data-s="${si}" data-f="r" value="${esc(t.r)}" aria-label="reps"></div>`:'').join('')}`).join('')}
  <div class="row" style="margin-top:14px"><button class="btn ghost" id="edCancel">Cancel</button><button class="btn" id="edSave">Save changes</button></div>`);
  $('#edCancel').onclick=closeSheet;
  $('#edSave').onclick=()=>{
    $$('#sheet input[data-e]').forEach(inp=>{
      const x=entries[+inp.dataset.e][1];
      x.sets[+inp.dataset.s][inp.dataset.f]=inp.value;
    });
    s.dur=Math.max(1,Math.min(600,+$('#edDur').value||s.dur));
    save();closeSheet();renderStats();toast('Workout updated.');
  };
}
function renderHistory(body){
  const rows=[...S.sessions].map((s,i)=>({s,i})).reverse();
  if(!rows.length){
    body.innerHTML=`<div class="card"><div class="sub">No workouts yet.</div>
      <button class="btn" style="margin-top:12px" id="hGo">Start your first workout</button></div>`;
    $('#hGo').onclick=()=>go('today');return;
  }
  const groups=[];let lastWk=null;
  rows.forEach(r=>{
    const wk=dkey(mondayOf(new Date(r.s.date)));
    if(wk!==lastWk){groups.push({wk,items:[]});lastWk=wk}
    groups[groups.length-1].items.push(r);
  });
  body.innerHTML=groups.map(g=>{
    const vol=g.items.reduce((a,r)=>a+sessionVolume(r.s),0);
    return `<div class="wkhead">WEEK OF ${new Date(g.wk+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}).toUpperCase()}
      <span class="wsub">· ${g.items.length} workout${g.items.length>1?'s':''} · ${fmtVol(vol)} ${esc(S.unit)}</span></div>
    <div class="card">${g.items.map(r=>sessionDetailHTML(r.s,r.i)).join('')}</div>`;
  }).join('');
  bindSessionDetail(body);
}

/* --- lifts (1RM) --- */
function renderLifts(body){
  const wave=WAVE[Math.min(S.pos.week,4)-1];
  const allPRs=[];
  for(const k in S.lifts)(S.lifts[k].prs||[]).forEach(p=>allPRs.push({k,...p}));
  allPRs.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const trophies=allPRs.slice(0,8).map(p=>`<div class="tcard"><div class="tv">${p.e}</div>
    <div class="tl">${esc(LIFTS[p.k].label)}</div>
    <div class="td">${new Date(p.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div></div>`).join('');
  body.innerHTML=`${allPRs.length?`<div class="card" style="border-color:var(--gold-dim)">
    <label class="f" style="margin-top:0">🏆 Trophy wall — ${allPRs.length} PR${allPRs.length>1?'s':''}</label>
    <div class="trophy">${trophies}</div></div>`:
    `<div class="card" style="border-color:var(--gold-dim)"><b style="font-size:14px">🏆 Your trophy wall is empty</b>
    <div class="sub">Save one 1RM below and every strength workout auto-fills your working weights — and every heavy set becomes a chance to put a number on this wall.</div></div>`}
  <div class="note">Estimated 1RMs power the suggested loads in strength phases (3–5).
    This week's wave: <b>${wave.s}×${wave.r} @ ~${Math.round(wave.pct*100)}%</b> of 1RM. The app spots new PRs automatically when you log a heavy set.</div>
  ${Object.keys(LIFTS).map(k=>{
    const best=liftBest(k),l=S.lifts[k];
    const pts=(l?l.prs:[]).map(p=>({d:new Date(p.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}),y:p.e}));
    return `<div class="card"><div class="row">
      <div class="grow"><b>${esc(LIFTS[k].label)}</b>
        <div class="sub">${best?`Best est. 1RM <b style="color:var(--gold);font-family:var(--mono)">${best.e} ${esc(S.unit)}</b> · ${new Date(best.date).toLocaleDateString()}`:'No 1RM saved yet.'}</div>
        ${best?`<div class="sub">Wave loads: ${WAVE.map((w,i)=>`W${i+1} ${roundPlate(best.e*w.pct)}`).join(' · ')} ${esc(S.unit)}</div>`:''}</div>
      <button class="btn small ghost" data-add="${k}">Add</button></div>
      ${pts.length>1?`<div class="chart spark">${sparkSVG(pts)}</div>`:''}
      ${l&&l.prs.length?`<details style="margin-top:6px"><summary class="sub" style="padding:2px 0">PR history (${l.prs.length})</summary>
        ${[...l.prs].reverse().slice(0,8).map((p,ri)=>`<div class="stat"><span class="sub" style="margin:0">${new Date(p.date).toLocaleDateString()}${p.w?` · ${p.w}×${p.r}`:''}</span>
        <span><span class="v" style="font-size:15px">${p.e}</span><span class="u">${esc(S.unit)}</span>
        <button class="act" style="color:var(--red);font-size:12px;padding:2px 6px" data-delpr="${k}:${l.prs.length-1-ri}" aria-label="Delete PR">✕</button></span></div>`).join('')}</details>`:''}
    </div>`}).join('')}`;
  $$('[data-add]',body).forEach(b=>b.onclick=()=>{
    const k=b.dataset.add;
    sheet(`<h2>${esc(LIFTS[k].label)} 1RM</h2>
    <div class="sub">Enter a tested 1RM directly, or a heavy set and the app estimates it (Epley).</div>
    <label class="f">Weight (${esc(S.unit)})</label><input id="prW" type="number" inputmode="decimal">
    <label class="f">Reps (1 = tested max)</label><input id="prR" type="number" inputmode="numeric" value="1">
    <div class="row" style="margin-top:14px"><button class="btn ghost" id="prCancel">Cancel</button><button class="btn" id="prSave">Save</button></div>`);
    $('#prCancel').onclick=closeSheet;
    $('#prSave').onclick=()=>{
      const w=+$('#prW').value,r=+$('#prR').value||1;
      if(!w){toast('Enter a weight.');return}
      savePR(k,epley(w,r),w,r);closeSheet();renderStats();
      toast(`${LIFTS[k].label} 1RM saved: ${Math.round(epley(w,r))} ${S.unit}.`,{gold:true});
    };
  });
  $$('[data-delpr]',body).forEach(b=>b.onclick=()=>{
    const [k,i]=b.dataset.delpr.split(':');
    const pr=S.lifts[k].prs.splice(+i,1)[0];save();renderStats();
    toast('PR removed.',{action:'Undo',onAction:()=>{S.lifts[k].prs.splice(+i,0,pr);save();renderStats()}});
  });
}

/* --- exercises --- */
function renderExercises(body){
  const names=new Set();
  S.sessions.forEach(s=>Object.values(s.log).forEach(x=>{if(x.sets&&x.sets.some(t=>t.done))names.add(x.name)}));
  const list=[...names].sort();
  const q=(statsState.exq||'').toLowerCase();
  const hits=q?list.filter(n=>n.toLowerCase().includes(q)):list;
  body.innerHTML=`<div class="searchbox"><input id="exQ" type="search" placeholder="Find a logged exercise" value="${esc(statsState.exq||'')}"></div>
  <div class="card plist">${hits.length?hits.map(n=>{
    const h=exerciseHistory(n),last=h[h.length-1];
    return `<button class="prow" data-n="${esc(n)}">${esc(n)}
      <div class="prsub">${h.length} session${h.length>1?'s':''} · last ${new Date(last.date).toLocaleDateString()}</div></button>`;
  }).join(''):`<div class="sub">${list.length?'No match.':'Exercises appear here once you’ve logged workouts.'}</div>`}</div>`;
  const qin=$('#exQ',body);
  qin.oninput=()=>{statsState.exq=qin.value;renderStats();const v=$('#exQ');v.focus();v.setSelectionRange(v.value.length,v.value.length)};
  $$('.prow',body).forEach(b=>b.onclick=()=>exHistorySheet(b.dataset.n));
}
function exHistorySheet(name){
  const h=exerciseHistory(name);
  const pts=h.filter(x=>x.e1).map(x=>({d:new Date(x.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}),y:x.e1}));
  sheet(`<h2 style="font-size:19px">${esc(name)}</h2>
  <div class="sub">${h.length} logged session${h.length>1?'s':''} · best est. 1RM over time</div>
  <div class="chart">${sparkSVG(pts)}</div>
  ${[...h].reverse().map(x=>`<div class="stat"><span class="sub" style="margin:0">${new Date(x.date).toLocaleDateString()}</span>
    <span style="font-family:var(--mono);font-size:13px">${esc(x.sets.map(t=>`${t.w||'—'}×${t.r||'—'}`).join('  '))}</span></div>`).join('')}
  <button class="btn ghost" style="margin-top:12px" id="shClose">Close</button>`);
  $('#shClose').onclick=closeSheet;
}

/* --- trends --- */
function renderTrends(body){
  if(!S.sessions.length){
    body.innerHTML=`<div class="card"><b style="font-size:14px">Your trends start with workout #1</b>
      <div class="sub">Weekly volume, adherence vs plan, and phase progress all appear here — one logged session is enough to draw the first bar.</div>
      <button class="btn" style="margin-top:12px" id="trGo">Start today's workout</button></div>`;
    $('#trGo').onclick=()=>go('today');return}
  const weeks=[];const now=mondayOf(new Date());
  for(let i=7;i>=0;i--){const wk=new Date(now);wk.setDate(wk.getDate()-7*i);weeks.push({key:dkey(wk),label:wk.toLocaleDateString(undefined,{month:'numeric',day:'numeric'}),v:0,n:0})}
  S.sessions.forEach(s=>{
    const k=dkey(mondayOf(new Date(s.date)));
    const w=weeks.find(x=>x.key===k);if(w){w.v+=sessionVolume(s);w.n++}});
  const planned=Object.values(S.schedule).filter(v=>v!=null&&v>=0).length;
  const thisWk=weeks[weeks.length-1];
  const phaseSessions=S.sessions.filter(s=>s.phase===S.pos.phase).length;
  const phaseTotal=phaseById(S.pos.phase).days.filter(d=>!d.recovery).length*4;
  body.innerHTML=`
  <div class="card"><b style="font-size:14px">Weekly volume (${esc(S.unit)})</b>
    <div class="chart">${barsSVG(weeks.map(w=>({label:w.label,v:w.v})),S.unit)}</div></div>
  <div class="statrow">
    <div class="tile"><div class="v">${thisWk.n}/${planned||5}</div><div class="l">This week vs plan</div></div>
    <div class="tile"><div class="v">${Math.min(100,Math.round(phaseSessions/phaseTotal*100))}%</div><div class="l">Phase ${S.pos.phase} progress</div></div>
    <div class="tile"><div class="v">${S.sessions.length}</div><div class="l">All-time workouts</div></div>
  </div>
  <div class="card"><b style="font-size:14px">Duration</b>
    <div class="sub">Average ${Math.round(S.sessions.reduce((a,s)=>a+(s.dur||0),0)/S.sessions.length)} min per workout.</div></div>
  <button class="btn ghost" id="trShare">Share this month's report card</button>`;
  $('#trShare').onclick=()=>{
    const now=new Date(),mk=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthSess=S.sessions.filter(s=>dkey(new Date(s.date)).startsWith(mk));
    const mVol=monthSess.reduce((a,s)=>a+sessionVolume(s),0);
    const mPRs=[];for(const k in S.lifts)(S.lifts[k].prs||[]).forEach(p=>{if(p.date.startsWith(mk))mPRs.push(`${LIFTS[k].label} ${p.e}`)});
    shareCard({title:now.toLocaleDateString(undefined,{month:'long'})+' report',
      lines:[`${monthSess.length} workouts · ${fmtVol(mVol)} ${S.unit} lifted`,
        ...(mPRs.length?[`PRs: ${mPRs.join(' · ')}`]:[]),
        `Phase ${S.pos.phase} of 6 · Week ${S.pos.week}`]});
  };
}

/* --- recovery (Fitbit) --- */
function renderRecovery(body){
  const connected=!!S.fitbit.token;
  body.innerHTML=`
  <div class="card" id="fbStats">${connected?'<div class="sub">Loading…</div>':'<div class="sub">Connect Fitbit to see steps, calories, resting HR and zone minutes next to your training.</div>'}</div>
  <button class="btn ${connected?'ghost':''}" id="fbBtn">${connected?'Refresh data':'Connect Fitbit'}</button>
  ${connected?'<button class="btn danger" id="fbOut" style="margin-top:8px">Disconnect</button>':''}
  ${!connected?`<div class="note">Setup: register a free app at dev.fitbit.com (type: <b>Personal</b>, OAuth type <b>Client</b>), set the redirect URL to
  <code>${esc(redirectUri())}</code>, then paste the Client ID in Settings → Fitbit.</div>`:''}`;
  $('#fbBtn').onclick=connected?loadFitbitStats:fitbitConnect;
  const out=$('#fbOut');if(out)out.onclick=()=>{S.fitbit.token=null;save();renderStats()};
  if(connected)loadFitbitStats();
}

/* ------------------------------ FITBIT ------------------------------ */
const FB_SCOPES='activity heartrate profile';
function b64url(buf){return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function pkce(){
  const v=b64url(crypto.getRandomValues(new Uint8Array(32)));
  const c=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
  return {v,c};
}
function redirectUri(){return location.origin+location.pathname}
async function fitbitConnect(){
  if(!S.fitbit.clientId){toast('Add your Fitbit Client ID in Settings first.');go('settings');return}
  const {v,c}=await pkce();
  sessionStorage.setItem('fb_verifier',v);
  location.href=`https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(S.fitbit.clientId)}`+
    `&scope=${encodeURIComponent(FB_SCOPES)}&code_challenge=${c}&code_challenge_method=S256&redirect_uri=${encodeURIComponent(redirectUri())}`;
}
async function fitbitToken(body){
  const res=await fetch('https://api.fitbit.com/oauth2/token',{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
  if(!res.ok)throw new Error('Token request failed ('+res.status+')');
  return res.json();
}
async function handleFitbitRedirect(){
  const code=new URLSearchParams(location.search).get('code');
  if(!code)return;
  history.replaceState({},'',redirectUri());
  try{
    const tok=await fitbitToken({client_id:S.fitbit.clientId,grant_type:'authorization_code',
      code,code_verifier:sessionStorage.getItem('fb_verifier'),redirect_uri:redirectUri()});
    S.fitbit.token={access:tok.access_token,refresh:tok.refresh_token,exp:Date.now()+tok.expires_in*1000};
    save();go('stats','recovery');
  }catch(e){toast('Fitbit connection failed: '+e.message)}
}
async function fbFetch(path){
  let t=S.fitbit.token;
  if(!t)throw new Error('Not connected');
  if(Date.now()>t.exp-60000){
    try{
      const tok=await fitbitToken({client_id:S.fitbit.clientId,grant_type:'refresh_token',refresh_token:t.refresh});
      t=S.fitbit.token={access:tok.access_token,refresh:tok.refresh_token,exp:Date.now()+tok.expires_in*1000};save();
    }catch(e){S.fitbit.token=null;save();throw new Error('Session expired — reconnect Fitbit')}
  }
  const res=await fetch('https://api.fitbit.com'+path,{headers:{Authorization:'Bearer '+t.access}});
  if(!res.ok)throw new Error('Fitbit API '+res.status);
  return res.json();
}
async function loadFitbitStats(){
  const box=$('#fbStats');if(!box)return;box.innerHTML='<div class="sub">Loading…</div>';
  try{
    const [act,hr]=await Promise.all([
      fbFetch('/1/user/-/activities/date/today.json'),
      fbFetch('/1/user/-/activities/heart/date/today/1d.json')
    ]);
    const sum=act.summary||{};
    const hday=(hr['activities-heart']&&hr['activities-heart'][0]&&hr['activities-heart'][0].value)||{};
    const zones=(hday.heartRateZones||[]).map(z=>`<div class="stat"><span>${esc(z.name)} zone</span>
      <span><span class="v">${z.minutes??0}</span><span class="u">min</span></span></div>`).join('');
    box.innerHTML=`
      <div class="stat"><span>Steps today</span><span><span class="v">${(sum.steps||0).toLocaleString()}</span></span></div>
      <div class="stat"><span>Calories out</span><span><span class="v">${(sum.caloriesOut||0).toLocaleString()}</span><span class="u">kcal</span></span></div>
      <div class="stat"><span>Resting heart rate</span><span><span class="v">${hday.restingHeartRate??'—'}</span><span class="u">bpm</span></span></div>
      ${zones}`;
  }catch(e){
    box.innerHTML=`<div class="sub" style="color:var(--red)">Couldn't load: ${esc(e.message)}.</div>
      <button class="btn small ghost" id="fbRetry" style="margin-top:10px">Try again</button>`;
    const r=$('#fbRetry');if(r)r.onclick=()=>S.fitbit.token?loadFitbitStats():renderStats();
  }
}

/* ------------------------------ GOOGLE (Calendar + Drive backup) ------------------------------ */
const GSCOPES='https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.events';
let gsiLoading=null;
function loadGSI(){
  if(window.google&&google.accounts)return Promise.resolve();
  gsiLoading=gsiLoading||new Promise((res,rej)=>{
    const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';
    s.onload=res;s.onerror=()=>rej(new Error('Couldn’t load Google sign-in (offline?)'));
    document.head.appendChild(s);
  });
  return gsiLoading;
}
async function googleToken(interactive){
  const g=S.google;
  if(!g.clientId)throw new Error('Add your Google Client ID in Settings first.');
  if(g.token&&Date.now()<g.token.exp-60000)return g.token.access;
  await loadGSI();
  return new Promise((res,rej)=>{
    const tc=google.accounts.oauth2.initTokenClient({client_id:g.clientId,scope:GSCOPES,
      callback:(t)=>{
        if(t.error){rej(new Error(t.error));return}
        g.token={access:t.access_token,exp:Date.now()+(+t.expires_in)*1000};save();
        res(t.access_token);
      },error_callback:(e)=>rej(new Error(e.type||'Google sign-in cancelled'))});
    tc.requestAccessToken({prompt:interactive?'':undefined});
  });
}
async function gFetch(url,opts={},silent){
  const tok=await googleToken(!silent);
  opts.headers=Object.assign({Authorization:'Bearer '+tok},opts.headers||{});
  const res=await fetch(url,opts);
  if(!res.ok)throw new Error('Google API '+res.status);
  return res.status===204?null:res.json();
}
async function driveBackup(silent){
  const data=JSON.stringify(exportData());
  let id=S.google.fileId;
  if(!id){
    const q=await gFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent("name='mm-backup.json'")}&fields=files(id)`,{},silent);
    id=q.files&&q.files[0]&&q.files[0].id||null;
  }
  if(id){
    await gFetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,
      {method:'PATCH',headers:{'Content-Type':'application/json'},body:data},silent);
  }else{
    const boundary='mmb'+Date.now();
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`+
      JSON.stringify({name:'mm-backup.json',parents:['appDataFolder']})+
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${data}\r\n--${boundary}--`;
    const created=await gFetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
      {method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body},silent);
    id=created.id;
  }
  S.google.fileId=id;S.lastBackup=Date.now();save();
  return id;
}
async function driveRestore(){
  const q=await gFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent("name='mm-backup.json'")}&fields=files(id,modifiedTime)`);
  const f=q.files&&q.files[0];
  if(!f)throw new Error('No backup found in your Google Drive yet.');
  const data=await gFetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`);
  const added=mergeImport(data);
  S.google.fileId=f.id;save();
  return added;
}
/* schedule → calendar */
function scheduleEntries(){
  return Object.entries(S.schedule).map(([wd,di])=>({wd:+wd,di}))
    .filter(x=>x.di!=null&&x.di>=0).sort((a,b)=>((a.wd+6)%7)-((b.wd+6)%7));
}
function nextDateFor(wd){
  const d=new Date();d.setHours(0,0,0,0);
  while(d.getDay()!==wd)d.setDate(d.getDate()+1);
  return d;
}
function eventTimes(wd){
  const [h,m]=(S.schedTime||'17:00').split(':').map(Number);
  const st=nextDateFor(wd);st.setHours(h,m,0,0);
  const en=new Date(st.getTime()+75*60000);
  return {st,en};
}
const icsStamp=(d)=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
function icsDownload(){
  const phase=phaseById(S.pos.phase);
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Metabolic Method Tracker//EN'];
  scheduleEntries().forEach(({wd,di})=>{
    const day=phase.days[Math.min(di,phase.days.length-1)];
    const {st,en}=eventTimes(wd);
    lines.push('BEGIN:VEVENT',`UID:mm-day-${wd}@metabolic-method`,`DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(st)}`,`DTEND:${icsStamp(en)}`,`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[wd]}`,
      `SUMMARY:Workout — Day ${di+1}: ${day.name}`,
      'DESCRIPTION:The Metabolic Method — logged in the MM Tracker app.','END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob=new Blob([lines.join('\r\n')],{type:'text/calendar'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='metabolic-method-schedule.ics';a.click();
}
function gcalTemplateSheet(){
  const phase=phaseById(S.pos.phase);
  const links=scheduleEntries().map(({wd,di})=>{
    const day=phase.days[Math.min(di,phase.days.length-1)];
    const {st,en}=eventTimes(wd);
    const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Workout — Day ${di+1}: ${day.name}`)}`+
      `&dates=${icsStamp(st)}/${icsStamp(en)}&recur=${encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY='+BYDAY[wd])}`+
      `&details=${encodeURIComponent('The Metabolic Method — logged in the MM Tracker app.')}`;
    return `<a href="${url}" target="_blank" rel="noopener" class="btn ghost" style="display:block;margin-top:8px;text-decoration:none">${DOW[wd]} — Day ${di+1}: ${esc(day.name)}</a>`;
  });
  sheet(`<h2>Add to Google Calendar</h2>
  <div class="sub">Each link opens Google Calendar with a weekly recurring workout pre-filled — no sign-in needed inside this app. Or download the .ics to import all at once (works with Apple/Outlook too).</div>
  ${links.join('')||'<div class="note">Set your training days in Settings → Schedule first.</div>'}
  <button class="btn ghost" style="margin-top:10px" id="icsBtn">Download .ics (all days)</button>
  <button class="btn ghost" style="margin-top:8px" id="shClose">Close</button>`);
  $('#icsBtn').onclick=icsDownload;
  $('#shClose').onclick=closeSheet;
}
async function gcalSyncSchedule(){
  const phase=phaseById(S.pos.phase);
  // remove previously synced events
  for(const id of (S.google.calIds||[])){
    try{await gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,{method:'DELETE'})}catch(e){}
  }
  S.google.calIds=[];
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  for(const {wd,di} of scheduleEntries()){
    const day=phase.days[Math.min(di,phase.days.length-1)];
    const {st,en}=eventTimes(wd);
    const ev=await gFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({summary:`Workout — Day ${di+1}: ${day.name}`,
        description:'The Metabolic Method — logged in the MM Tracker app.',
        start:{dateTime:st.toISOString(),timeZone:tz},end:{dateTime:en.toISOString(),timeZone:tz},
        recurrence:[`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[wd]}`],
        reminders:{useDefault:false,overrides:[{method:'popup',minutes:60}]}})});
    S.google.calIds.push(ev.id);
  }
  save();
}
async function gcalSyncPlan(monKey){ // one-off events for a specific week's plan
  const plan=S.plans[monKey];if(!plan)return;
  for(const id of (S.google.planIds[monKey]||[])){
    try{await gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,{method:'DELETE'},true)}catch(e){}
  }
  const ids=[];
  const phase=phaseById(S.pos.phase);
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [h,m]=(S.schedTime||'17:00').split(':').map(Number);
  for(const k in plan){
    const di=plan[k];if(di<0)continue;
    const st=new Date(k+'T12:00');st.setHours(h,m,0,0);
    if(st<new Date())continue; // don't create events in the past
    const en=new Date(st.getTime()+75*60000);
    const day=phase.days[Math.min(di,phase.days.length-1)];
    const ev=await gFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({summary:`Workout — Day ${di+1}: ${day.name}`,
        description:'The Metabolic Method — planned in the MM Tracker app.',
        start:{dateTime:st.toISOString(),timeZone:tz},end:{dateTime:en.toISOString(),timeZone:tz},
        reminders:{useDefault:false,overrides:[{method:'popup',minutes:60}]}})},true);
    ids.push(ev.id);
  }
  S.google.planIds[monKey]=ids;save();
}
async function gcalLogDone(sess){
  const phase=phaseById(sess.phase),day=phase.days[sess.day];
  const en=new Date(sess.date),st=new Date(en.getTime()-(sess.dur||60)*60000);
  const vol=sessionVolume(sess);
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  await gFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({summary:`✓ ${day.name} — done`,
      description:`Phase ${sess.phase} · Week ${sess.week} · ${sess.dur} min · ${vol.toLocaleString()} ${S.unit} volume`,
      start:{dateTime:st.toISOString(),timeZone:tz},end:{dateTime:en.toISOString(),timeZone:tz}})},true);
}

/* ------------------------------ SETTINGS ------------------------------ */
function renderSettings(){
  const el=$('#scr-settings');
  const g=S.google,gConnected=!!g.token;
  el.innerHTML=`<div class="pagehead"><span class="eyebrow">Setup</span><h1>Settings</h1></div>

  <div class="card">
    <label class="f" style="margin-top:0">Weight unit</label>
    <select id="unitSel"><option value="lb" ${S.unit==='lb'?'selected':''}>Pounds (lb)</option>
    <option value="kg" ${S.unit==='kg'?'selected':''}>Kilograms (kg)</option></select>
    <div class="togglerow" style="margin-top:10px"><div><div class="tl">Auto-start rest timer</div><div class="td">Starts when you check a set</div></div>
      <input type="checkbox" id="tgAuto" ${S.prefs.restAuto?'checked':''}></div>
    <div class="togglerow"><div><div class="tl">Timer sound</div></div>
      <input type="checkbox" id="tgSound" ${S.prefs.sound?'checked':''}></div>
    <div class="togglerow"><div><div class="tl">Vibration</div></div>
      <input type="checkbox" id="tgHaptic" ${S.prefs.haptic?'checked':''}></div>
    <div class="togglerow"><div><div class="tl">Notify when rest ends</div><div class="td">Useful when the screen is off or you're in another app</div></div>
      <input type="checkbox" id="tgNotify" ${S.prefs.notify?'checked':''}></div>
  </div>

  <div class="card">
    <label class="f" style="margin-top:0">Usual training pattern</label>
    <div class="sub">Your default week — each real week is planned from this (Today → "Plan week"), and any workout can be rescheduled to a different date without changing the pattern.</div>
    ${[1,2,3,4,5,6,0].map(wd=>`<div class="row" style="margin-top:8px">
      <span style="width:44px;font-size:13px;color:var(--muted)">${DOW[wd]}</span>
      <select data-wd="${wd}" class="grow">
        <option value="-1" ${S.schedule[String(wd)]===-1||S.schedule[String(wd)]==null?'selected':''}>Rest</option>
        ${[0,1,2,3,4].map(di=>`<option value="${di}" ${S.schedule[String(wd)]===di?'selected':''}>Day ${di+1}</option>`).join('')}
      </select></div>`).join('')}
    <label class="f">Usual start time</label>
    <input id="schedTime" type="time" value="${esc(S.schedTime||'17:00')}">
    <div class="row" style="margin-top:12px">
      <button class="btn ghost" id="gcalTpl">Add to calendar…</button>
      ${gConnected?`<button class="btn ghost" id="gcalSync">Sync to Google</button>`:''}
    </div>
  </div>

  <div class="card">
    <label class="f" style="margin-top:0">Google — calendar sync & cloud backup</label>
    <div class="sub">${gConnected?'Connected. Your log backs up to Google Drive automatically after each workout.':'Connect to back up your log to Google Drive after every workout and sync workouts to Google Calendar.'}</div>
    <label class="f">Google OAuth Client ID</label>
    <input id="gcid" value="${esc(g.clientId)}" placeholder="xxxxx.apps.googleusercontent.com" autocapitalize="off">
    <div class="row" style="margin-top:10px">
      ${gConnected?`<button class="btn ghost" id="gBackup">Back up now</button>
        <button class="btn ghost" id="gRestore">Restore</button>`:
        `<button class="btn" id="gConnect">Connect Google</button>`}
    </div>
    ${gConnected?`<div class="togglerow" style="margin-top:6px"><div><div class="tl">Log finished workouts to Calendar</div></div>
      <input type="checkbox" id="tgGlog" ${g.logWorkouts?'checked':''}></div>
      <button class="btn danger" id="gOut" style="margin-top:8px">Disconnect Google</button>`:''}
    <details style="margin-top:10px"><summary class="sub" style="padding:2px 0">How to get a Client ID (one-time, ~3 min)</summary>
      <div class="note">console.cloud.google.com → new project → “APIs & Services” → enable <b>Google Drive API</b> and <b>Google Calendar API</b> → OAuth consent screen (External, add yourself as test user) → Credentials → Create OAuth Client ID → type <b>Web application</b> → add JavaScript origin <code>${esc(location.origin)}</code> → copy the Client ID here.</div></details>
  </div>

  <div class="card">
    <details><summary>Fitbit setup</summary>
      <label class="f">Fitbit Client ID</label>
      <input id="cid" value="${esc(S.fitbit.clientId)}" placeholder="e.g. 23ABCD" autocapitalize="off">
      <div class="note">From dev.fitbit.com → Register an app → OAuth 2.0 Application Type: <b>Client</b>, app type <b>Personal</b>, Redirect URL: <code>${esc(redirectUri())}</code>. Connect from Stats → Recovery.</div>
    </details>
  </div>

  <div class="card">
    <label class="f" style="margin-top:0">Your data</label>
    <div class="sub">Last backup: ${S.lastBackup?new Date(S.lastBackup).toLocaleString():'never'}</div>
    <div class="row" style="margin-top:10px"><button class="btn ghost" id="expBtn">Export / share</button>
    <button class="btn ghost" id="impBtn">Import</button></div>
    <input type="file" id="impFile" accept=".json,application/json" style="display:none">
    <button class="btn danger" id="wipe" style="margin-top:10px">Erase all data…</button>
  </div>`;

  $('#unitSel').onchange=(e)=>{S.unit=e.target.value;save()};
  $('#tgAuto').onchange=(e)=>{S.prefs.restAuto=e.target.checked;save()};
  $('#tgSound').onchange=(e)=>{S.prefs.sound=e.target.checked;save()};
  $('#tgHaptic').onchange=(e)=>{S.prefs.haptic=e.target.checked;save()};
  $('#tgNotify').onchange=async(e)=>{
    if(e.target.checked&&'Notification' in window){
      const p=await Notification.requestPermission();
      if(p!=='granted'){e.target.checked=false;toast('Notifications are blocked for this site in your browser settings.');return}
    }
    S.prefs.notify=e.target.checked;save();
  };
  $$('select[data-wd]',el).forEach(s=>s.onchange=()=>{S.schedule[s.dataset.wd]=+s.value;save()});
  $('#schedTime').onchange=(e)=>{S.schedTime=e.target.value;save()};
  $('#gcalTpl').onclick=gcalTemplateSheet;
  const gs=$('#gcalSync');if(gs)gs.onclick=async()=>{
    gs.disabled=true;
    try{await gcalSyncSchedule();toast('Weekly workouts synced to Google Calendar.',{gold:true})}
    catch(e){toast('Calendar sync failed: '+e.message)}
    gs.disabled=false;
  };
  $('#gcid').oninput=(e)=>{S.google.clientId=e.target.value.trim();save()};
  const gc=$('#gConnect');if(gc)gc.onclick=async()=>{
    try{await googleToken(false);renderSettings();toast('Google connected — backups now run automatically.',{gold:true})}
    catch(e){toast(e.message)}
  };
  const gb=$('#gBackup');if(gb)gb.onclick=async()=>{
    gb.disabled=true;
    try{await driveBackup(false);toast('Backed up to Google Drive.',{gold:true});renderSettings()}
    catch(e){toast('Backup failed: '+e.message)}
  };
  const gr=$('#gRestore');if(gr)gr.onclick=async()=>{
    try{const n=await driveRestore();toast(n?`Restored — ${n} workout${n>1?'s':''} added.`:'Backup found — nothing new to merge.');render(cur)}
    catch(e){toast(e.message)}
  };
  const glog=$('#tgGlog');if(glog)glog.onchange=(e)=>{S.google.logWorkouts=e.target.checked;save()};
  const gout=$('#gOut');if(gout)gout.onclick=()=>{S.google.token=null;save();renderSettings()};
  $('#cid').oninput=(e)=>{S.fitbit.clientId=e.target.value.trim();save()};
  $('#expBtn').onclick=()=>{doExport();setTimeout(renderSettings,300)};
  $('#impBtn').onclick=()=>$('#impFile').click();
  $('#impFile').onchange=(e)=>{
    const f=e.target.files[0];if(!f)return;
    f.text().then(t=>{
      const n=mergeImport(JSON.parse(t));
      toast(n?`Imported — ${n} new workout${n>1?'s':''} merged in.`:'Nothing new to merge — your log already has all of it.');
      render(cur);
    }).catch(err=>toast(err.message||'Couldn’t read that file.'));
    e.target.value='';
  };
  $('#wipe').onclick=()=>confirmSheet('Erase ALL data?','Every workout, PR and setting on this phone will be deleted. This can’t be undone. Export first if unsure.','Erase everything',async()=>{
    localStorage.clear();await idbClear();location.reload();
  },true);
}

/* ------------------------------ onboarding (#57) ------------------------------ */
function onboardingSheet(){
  const defaultOn=[1,2,3,4,5];
  sheet(`<h2>Let's set you up</h2>
  <div class="sub">Two questions, then the app plans your first week.</div>
  <label class="f">Weights in</label>
  <div class="pills"><button class="pill on" data-u="lb">Pounds (lb)</button><button class="pill" data-u="kg">Kilograms (kg)</button></div>
  <label class="f">Which days can you usually train?</label>
  ${[1,2,3,4,5,6,0].map(wd=>`<div class="togglerow"><div class="tl">${DOW[wd]}day</div>
    <input type="checkbox" data-obwd="${wd}" ${defaultOn.includes(wd)?'checked':''}></div>`).join('')}
  <div class="sub" style="margin-top:8px">The 5-day routine fits best with 5 days, but the plan adapts — you can reschedule any workout later.</div>
  <button class="btn" id="obGo" style="margin-top:14px">Plan my first week</button>`,()=>{S.onboarded=true;save()});
  $$('#sheet .pill').forEach(b=>b.onclick=()=>{
    $$('#sheet .pill').forEach(x=>x.classList.toggle('on',x===b));
    S.unit=b.dataset.u;save();
  });
  $('#obGo').onclick=()=>{
    const days=$$('#sheet input[data-obwd]').filter(c=>c.checked).map(c=>+c.dataset.obwd);
    const sched={};[0,1,2,3,4,5,6].forEach(wd=>sched[String(wd)]=-1);
    days.slice(0,5).forEach((wd,i)=>sched[String(wd)]=i);
    S.schedule=sched;S.onboarded=true;save();
    closeSheet();
    ensurePlan(weekKeyOf(new Date()));save();
    renderToday();
    toast(`Set — ${Math.min(5,days.length)} training days a week. First up: Day 1.`,{gold:true});
  };
}

/* ------------------------------ service worker / boot ------------------------------ */
function registerSW(){
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller){
          toast('A new version is ready.',{action:'Refresh',ms:15000,onAction:()=>nw.postMessage('SKIP_WAITING')});
        }
      });
    });
  }).catch(()=>{});
  let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloaded)return;reloaded=true;location.reload();
  });
}

(async function boot(){
  let st=await idbGet('state');
  if(!st){try{st=JSON.parse(localStorage.getItem('mm_state')||'null')}catch(e){}}
  if(!st)st=migrateV1();
  S=normalize(st||{});
  save();
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  bindNav();bindRest();
  $('#sheetBack').onclick=closeSheet;
  document.addEventListener('visibilitychange',onVisibility);
  registerSW();
  await handleFitbitRedirect();
  if(S.active)go('train');else render('today');
  if(!S.onboarded&&!S.sessions.length)onboardingSheet();
})();
