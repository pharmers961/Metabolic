/* ============ THE METABOLIC METHOD — 5 DAY ROUTINE, PHASES 1–6 ============ */
/* Encoded from the Workout Template Guide V2 PDF. Week 1 targets are the
   defaults; Phase 1 carries the PDF's week-by-week variations (wk array =
   [W1,W2,W3,W4]). Phases 3–5 main lifts follow the strength wave:
   Week 1 3x8, Week 2 4x6, Week 3 5x5, Week 4 4x4 (flagged wave:true). */

const WAVE = [{s:3,r:'8'},{s:4,r:'6'},{s:5,r:'5'},{s:4,r:'4'}];

const ex = (n,s,r,rest,extra)=>Object.assign({t:'ex',n,s,r,rest:rest||0},extra||{});
const wu = (n,d)=>({t:'wu',n,d:d||''});
const ss = (sets,items,rest,label)=>({t:'ss',s:sets,items,rest:rest||60,label:label||'Superset'});

const PROGRAM = [
{ id:1, name:'Phase 1 — Technique & Mind-Muscle Control', weekly:true, days:[
  {name:'Squat / Legs', items:[
    wu('Foam Roll Top 3+ (Lower Body)','10 reps per exercise (50 total)'),
    wu('Corrective Exercise Top 3+ (Squat)','10 reps per exercise (50 total)'),
    ex('Squat Variation — AML Progression',3,'10',180,{wk:[[3,'10'],[3,'12'],[2,'15'],[4,'10']]}),
    ex('Support Squat Variation',3,'5',90,{wk:[[3,'5'],[3,'8'],[3,'10'],[3,'12']]}),
    ex('Walking Lunges — AML Style',2,'20',120,{wk:[[2,'20'],[3,'20'],[2,'24'],[3,'24']]}),
    ex('Lateral Step Ups',2,'10',90,{wk:[[2,'10'],[3,'12'],[2,'15'],[4,'10']]}),
    ex('Leg Finisher — Weak Point Solution',2,'15',90,{wk:[[2,'15'],[3,'15'],[3,'20'],[4,'20']]}),
    ex('Stretch / Foam Roll / Cardio (optional)',1,'10 min Zone 3',0)
  ]},
  {name:'Bench / Chest / Rear Delts', items:[
    wu('Foam Roll Top 3+'), wu('Top 3+ Stretches for Upper Body'),
    ex('Bench Press Variation & Progression',3,'10',180,{wk:[[3,'10'],[3,'12'],[2,'12'],[4,'10-15']]}),
    ss(2,[{n:'Secondary Bench Press Variation',r:'10'},{n:'Face Pulls — AML Style',r:'10'}],90),
    ss(2,[{n:'Dumbbell Incline Bench Press',r:'12-15'},{n:'Rear Delt Row',r:'12-15'}],90),
    ss(2,[{n:'Chest Flyes',r:'12-15'},{n:'Rear Delt Cable Flyes',r:'12-15'}],90),
    ss(2,[{n:'Finisher: Push Up Variation',r:'10'},{n:'Finisher: Swimmers',r:'10'}],60)
  ]},
  {name:'Active Recovery / Mobility', items:[
    wu('Mobility work','Per the course calendar: light active-recovery day'),
    ex('Zone 2–3 Cardio (walk, bike, swim)',1,'20-40 min',0),
    ex('Full-body stretch & foam roll',1,'10-15 min',0)
  ]},
  {name:'Deadlifts / Back', items:[
    wu('Foam Roll Top 5 (Deadlift)'), wu('Corrective Exercise Top 5 for Deadlift'),
    ex('Deadlift Variation (& Progression)',2,'10',180,{wk:[[2,'10'],[4,'10'],[2,'15'],[3,'15']]}),
    ex('Pull Up (Regular / Assisted / Weighted)',4,'6',120,{wk:[[4,'6'],[3,'8'],[2,'10'],[2,'12']]}),
    ex('Dumbbell Rows or Chest Supported Rows',2,'15',90,{wk:[[2,'15'],[3,'10'],[3,'12'],[4,'8']]}),
    ex('Lat Pulldown — AML Style',2,'10',90,{wk:[[2,'10'],[2,'12'],[3,'12'],[3,'10']]}),
    ex('Cable Row',2,'10',90,{wk:[[2,'10'],[2,'12'],[3,'12'],[3,'10']]}),
    ex('Finisher: Pullover Variation',2,'10',60,{wk:[[2,'10'],[2,'15'],[3,'12'],[3,'10']]})
  ]},
  {name:'Shoulders & Arms', items:[
    wu('Foam Roll Top 5 (Overhead Press)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ex('Rear Delt Row — Ultimate Shoulder Builder',3,'10',90,{wk:[[3,'10'],[2,'15'],[3,'12'],[3,'15']]}),
    ex('Overhead Press Variation & Progression',2,'10',180,{wk:[[2,'10'],[3,'10'],[4,'12'],[3,'15']]}),
    ex('Rear Delt Row (2nd round)',2,'10',90,{wk:[[2,'10'],[2,'12'],[2,'15'],[3,'10']]}),
    ex('Shoulder Saver Side Raise',5,'10-20',60,{wk:[[5,'10-20'],[4,'10-20'],[5,'10-20'],[5,'10-20']]}),
    ss(3,[{n:'Tricep Rope Pushdown — AML Style',r:'15'},{n:'Cable Curl',r:'10'}],60),
    ss(3,[{n:'Spiderman Tricep Ext / Kickbacks',r:'15'},{n:'Barbell Curl',r:'10'}],60),
    ss(2,[{n:'Finisher: Scorpion Walk',r:'15'},{n:'Finisher: Cable Curl or TRX Curl',r:'10-15'}],60)
  ]}
]},
{ id:2, name:'Phase 2 — Mind-Muscle Connection (Short Rests)', days:[
  {name:'Squats / Legs', items:[
    wu('Foam Roll Top 3+ (Lower Body)','10 reps each (50 total)'),
    wu('Corrective Exercise Top 3+ (Squat)','10 reps each (50 total)'),
    ex('Squat Variation — AML Progression',2,'12',120),
    ex('Front Squat — AML Style',2,'12',120),
    ex('Barbell (or DB) Stiff Leg Deadlift',2,'12',120),
    ex('Outer Quad Activator / BURN',2,'10',90),
    ex('Barbell Walking Lunge',2,'16',90),
    ex('Leg Finisher — Weak Point Solution',1,'20',60),
    ex('Stretch / Foam Roll / Cardio (optional)',1,'10 min Zone 3',0)
  ]},
  {name:'Bench / Chest / Rear Delts', items:[
    wu('Foam Roll Top 3+'), wu('Top 3+ Stretches for Upper Body'),
    ex('Rear Delt Row — Ultimate Shoulder Builder',3,'15',60),
    ex('Overhead Press Variation & Progression',3,'15',90),
    ex('Rear Delt Row (2nd round)',3,'10',60),
    ex('Shoulder Saver Side Raise',5,'10-20',60),
    ss(3,[{n:'Tricep Rope Pushdown',r:'12'},{n:'Cable Curl',r:'12'}],60),
    ss(4,[{n:'Spiderman Tricep Ext / Kickbacks',r:'12'},{n:'Barbell Curl',r:'15'}],60),
    ss(2,[{n:'Finisher: Scorpion Walk',r:'15'},{n:'Finisher: Cable/TRX Curl',r:'10-15'}],60)
  ]},
  {name:'Active Recovery / Mobility', items:[
    wu('Mobility work','Light active-recovery day'),
    ex('Zone 2–3 Cardio',1,'20-40 min',0),
    ex('Full-body stretch & foam roll',1,'10-15 min',0)
  ]},
  {name:'Deadlifts / Back', items:[
    wu('Foam Roll Top 5 (Deadlift)'), wu('Corrective Exercise Top 5 for Deadlift'),
    ex('AML Cable Pullover',2,'15',60),
    ex('Pull Up',3,'12',90),
    ex('Deadlift Variation (& Progression)',2,'10',120),
    ex('AML DB Rows',2,'15',120),
    ex('Lat Pulldown — AML Style',2,'12',60),
    ex('Cable Row',2,'12',60),
    ex('DB Pullover — AML Style',2,'10',120)
  ]},
  {name:'Shoulders / Arms', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ss(3,[{n:'Rear Delt Row',r:'10',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ex('Shoulder Saver Side Raise',3,'12',90),
    ss(3,[{n:'Face Pulls — AML Style',r:'12',rest:10},{n:'Arnold Press — AML Style',r:'10',rest:10}],10,'Superset · 10s rests'),
    ss(2,[{n:'Rear Delt Row',r:'10',rest:10},{n:'Shoulder Saver Side Raise',r:'10',rest:10},{n:'Plate Halo',r:'60 sec',rest:10}],10,'Tri-set · 10s rests'),
    ss(2,[{n:'Barbell Curl',r:'10',rest:60},{n:'Tricep Rope Pushdown',r:'15',rest:60}],60),
    ss(2,[{n:'Incline Curl — AML Style',r:'10',rest:10},{n:'The Ultimate Tricep Killer',r:'15',rest:10}],10,'Superset · 10s rests'),
    ss(2,[{n:'Narcissist Curls',r:'15',rest:10},{n:'AML Tricep Rope Kickback',r:'15',rest:10}],10,'Superset · 10s rests')
  ]}
]},
{ id:3, name:'Phase 3 — Strength · Last Set Best Set', wave:true, days:[
  {name:'Squats / Legs', items:[
    wu('Foam Roll Top 3+ (Lower Body)'), wu('Corrective Exercise Top 3+ (Squat)'),
    ex('Squat Variation — AML Progression',3,'8',180,{wave:true}),
    ex('Front Squat — AML Style',3,'5',180),
    ex('Barbell (or DB) Stiff Leg Deadlift',2,'15',120),
    ex('Barbell Walking Lunge',2,'24',90),
    ex('Lateral Step Ups',2,'10',90),
    ex('AML Bulgarian Split Squat',2,'15',90),
    ex('Stretch / Foam Roll / Cardio (optional)',1,'10 min Zone 3',0)
  ]},
  {name:'Bench / Chest / Rear Delts', items:[
    wu('Foam Roll Top 3+'), wu('Top 3+ Stretches for Upper Body'),
    ex('Bench Press Variation & Progression',3,'8',180,{wave:true}),
    ss(2,[{n:'Secondary Bench Press Variation',r:'10',rest:120},{n:'Face Pulls — AML Style',r:'15',rest:90}],90),
    ss(2,[{n:'Dumbbell Incline Bench Press',r:'12',rest:120},{n:'Rear Delt Row',r:'15',rest:120}],120),
    ss(2,[{n:'Chest Flyes',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ss(2,[{n:'Finisher: Push Up Variation',r:'15',rest:10},{n:'Finisher: Swimmers',r:'15',rest:10}],10,'Superset · 10s rests')
  ]},
  {name:'Active Recovery / Mobility', items:[
    wu('Mobility work','Light active-recovery day'),
    ex('Zone 2–3 Cardio',1,'20-40 min',0)
  ]},
  {name:'Deadlifts / Back', items:[
    wu('Foam Roll Top 5 (Deadlift)'), wu('Corrective Exercise Top 5 for Deadlift'),
    ex('Deadlift Variation (& Progression)',3,'5',180,{wave:true}),
    ex('Pull Up',4,'6',180),
    ex('AML DB Rows',2,'15',120),
    ex('Lat Pulldown — AML Style',2,'15',60),
    ex('Cable Row',2,'15',60),
    ex('DB Pullover — AML Style',2,'10',120)
  ]},
  {name:'Shoulders / Arms', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ss(2,[{n:'Rear Delt Row',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ex('Overhead Press — Level 3 AML Progression',3,'8',180,{wave:true}),
    ex('Face Pulls — AML Style',3,'15',60),
    ex('Shoulder Saver Side Raise',5,'15',90),
    ex('Tricep Rope Pushdown — AML Style',3,'15',90),
    ex('Barbell Curl',3,'12',120),
    ex('The Ultimate Tricep Killer',3,'12-15',90),
    ex('Cable Curl',3,'12-15',90),
    ex('AML Tricep Rope Kickback',4,'15',60),
    ex('Finisher: Cable Curl or TRX Curl',2,'10-15',60)
  ]}
]},
{ id:4, name:'Phase 4 — Strength · Top Set Drop Set', wave:true, days:[
  {name:'Squats / Legs', items:[
    wu('Foam Roll Top 3+ (Lower Body)'), wu('Corrective Exercise Top 3+ (Squat)'),
    ex('Squat Variation — AML Progression',3,'8',180,{wave:true}),
    ex('Front Squat — AML Style',2,'6',180),
    ex('Barbell (or DB) Stiff Leg Deadlift',2,'15',120),
    ex('Barbell Walking Lunge',2,'15',90),
    ex('Lateral Step Ups',2,'24',90),
    ex('Walking Lunges — AML Style',2,'24',90),
    ex('Calf Press',2,'20',60),
    ex('Stretch / Foam Roll / Cardio (optional)',1,'10 min Zone 3',0)
  ]},
  {name:'Bench / Chest / Rear Delts', items:[
    wu('Foam Roll Top 3+'), wu('Top 3+ Stretches for Upper Body'),
    ex('Bench Press Variation & Progression',3,'8',180,{wave:true}),
    ss(2,[{n:'Secondary Bench Press Variation',r:'12',rest:120},{n:'Rear Delt Row',r:'15',rest:60}],60),
    ss(3,[{n:'Chest Flyes',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'20',rest:10}],10,'Superset · 10s rests'),
    ss(3,[{n:'Face Pulls — AML Style',r:'15',rest:60},{n:'Shoulder Saver Side Raise',r:'15',rest:60}],60),
    ex('Barbell Curl',3,'12',90),
    ex('Stretch / Foam Roll / Cardio (optional)',3,'—',0)
  ]},
  {name:'Active Recovery / Mobility', items:[
    wu('Mobility work','Light active-recovery day'),
    ex('Zone 2–3 Cardio',1,'20-40 min',0)
  ]},
  {name:'Deadlifts / Back', items:[
    wu('Foam Roll Top 5 (Deadlift)'), wu('Corrective Exercise Top 5 for Deadlift'),
    ex('Deadlift Variation (& Progression)',2,'6',180,{wave:true}),
    ex('AML Snatch Grip Deadlift',3,'6',180),
    ex('Pull Up',2,'15',180),
    ex('AML DB Rows',2,'15',120),
    ex('Lat Pulldown — AML Style',2,'10',120),
    ex('Cable Row',2,'12',120),
    ex('DB Pullover — AML Style',2,'15',120)
  ]},
  {name:'Shoulders / Arms', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ss(3,[{n:'Rear Delt Row',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ex('Overhead Press — Level 3 AML Progression',3,'8',180,{wave:true}),
    ss(3,[{n:'Face Pulls — AML Style',r:'15',rest:90},{n:'Shoulder Saver Side Raise',r:'15',rest:90}],90),
    ex('Tricep Rope Pushdown — AML Style',2,'15',60),
    ex('Barbell Curl',2,'12',120),
    ex('The Ultimate Tricep Killer',3,'12-15',90),
    ex('AML Hammer Curl',3,'12-15',90),
    ex('AML Tricep Rope Kickback',2,'20',60),
    ex('AML Reverse Curl',2,'20',90)
  ]}
]},
{ id:5, name:'Phase 5 — Strength · Low Volume Max RPE', wave:true, days:[
  {name:'Squat & Deadlift', items:[
    wu('Foam Roll Top 3+ (Lower Body)'), wu('Corrective Exercise Top 3+ (Squat)'),
    ex('Squat Variation — AML Progression',4,'8',180,{wave:true}),
    ex('Front Squat — AML Style',2,'8',180),
    ex('Deadlift Variation (& Progression)',2,'6',180,{wave:true}),
    ex('AML Snatch Grip Deadlift',2,'6',180),
    ex('Lateral Step Ups',2,'10',90),
    ex('Walking Lunges — AML Style',2,'20',90),
    ex('Calf Press',2,'20',60),
    ex('Stretch / Foam Roll / Cardio (optional)',1,'10 min Zone 3',0)
  ]},
  {name:'Shoulders & Light Arms', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ss(4,[{n:'Rear Delt Row',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ex('Overhead Press — Level 3 AML Progression',4,'8',180,{wave:true}),
    ss(4,[{n:'Face Pulls — AML Style',r:'15'},{n:'Shoulder Saver Side Raise',r:'10',rest:90}],90),
    ss(3,[{n:'Shoulder Saver Side Raise',r:'15-20'},{n:'Rear Delt Row',r:'15'},{n:'Plate Halo',r:'30-60 sec'}],60,'Tri-set'),
    ss(4,[{n:'AML Tricep Rope Kickback',r:'15'},{n:'Zottman Curls — AML Style',r:'15'}],60)
  ]},
  {name:'High Volume Back', items:[
    wu('Foam Roll Top 5 (Deadlift)'), wu('Corrective Exercise Top 5 for Deadlift'),
    ex('Pull Up',4,'8',120),
    ex('AML DB Rows',4,'15',90),
    ex('Lat Pulldown — AML Style',5,'10',90),
    ex('Cable Row',5,'12',90),
    ss(3,[{n:'DB Pullover — AML Style',r:'10'},{n:'AML Cable Pullover',r:'10'}],60)
  ]},
  {name:'Bench / Chest / Rear Delts', items:[
    wu('Foam Roll Top 3+'), wu('Top 3+ Stretches for Upper Body'),
    ex('Bench Press Variation & Progression',4,'8',180,{wave:true}),
    ss(4,[{n:'Secondary Bench Press Variation',r:'12',rest:120},{n:'Rear Delt Row',r:'12',rest:60}],60),
    ss(2,[{n:'Chest Flyes',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ex('Finisher: Push Up Variation',2,'20',60),
    ex('Stretch / Foam Roll / Cardio (optional)',3,'—',0)
  ]},
  {name:'Light Back & Shoulders', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ss(5,[{n:'Lat Pulldown — AML Style',r:'15'},{n:'Rear Delt Row',r:'15'},{n:'Rear Delt Cable Flyes',r:'15'},
          {n:'Face Pulls — AML Style',r:'15'},{n:'Shoulder Saver Side Raise',r:'15-20',rest:90}],90,'Giant set'),
    ex('Plate Halo',1,'30 sec',0)
  ]}
]},
{ id:6, name:'Phase 6 — PowerBuilding', days:[
  {name:'Arms', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ex('Secondary Bench Press Variation',5,'15/12/10/12/15',90),
    ex('Barbell Curl',3,'12',90),
    ex('Tricep Rope Pushdown — AML Style',3,'15',60),
    ex('Zottman Curls — AML Style',3,'20-24',60),
    ex('The Ultimate Tricep Killer',3,'15',60),
    ex('Cable Curl',3,'15',60),
    ex('AML Tricep Rope Kickback',3,'15-20',60),
    ex('AML Reverse Curl',2,'20',60),
    ex('AML Hammer Curl',2,'15',60),
    ex('Narcissist Curls',2,'20',60)
  ]},
  {name:'Squat / Legs', items:[
    wu('Foam Roll Top 3+ (Lower Body)'), wu('Corrective Exercise Top 3+ (Squat)'),
    ex('Squat Variation — AML Progression',3,'12/10/8',180),
    ex('Front Squat — AML Style',3,'8-12',180),
    ex('AML Deadlift',2,'6',180),
    ex('AML Snatch Grip Deadlift',2,'8',180),
    ex('Lateral Step Ups',2,'10',90),
    ex('Walking Lunges — AML Style',2,'10',90),
    ex('Calf Press',2,'30',60),
    ex('Stretch / Foam Roll / Cardio (optional)',1,'10 min Zone 3',0)
  ]},
  {name:'Shoulders', items:[
    wu('Foam Roll Top 5 (OHP)'), wu('Correctives & Stretches Top 3 (OHP)'),
    ss(4,[{n:'Rear Delt Row',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'15',rest:10}],10,'Superset · 10s rests'),
    ex('Overhead Press — Level 3 AML Progression',4,'8',180),
    ss(5,[{n:'Face Pulls — AML Style',r:'15'},{n:'Shoulder Saver Side Raise',r:'12',rest:90}],90),
    ss(5,[{n:'Shoulder Saver Side Raise',r:'15-20'},{n:'Rear Delt Row',r:'15'},{n:'Plate Halo',r:'30-60 sec'}],60,'Tri-set')
  ]},
  {name:'High Volume Back', items:[
    wu('Foam Roll Top 5 (Deadlift)'), wu('Corrective Exercise Top 5 for Deadlift'),
    ex('Pull Up',4,'8',120),
    ex('AML DB Rows',4,'15',90),
    ex('Lat Pulldown — AML Style',5,'10',90),
    ex('Cable Row',5,'12',90),
    ss(3,[{n:'DB Pullover — AML Style',r:'10'},{n:'AML Cable Pullover',r:'10'}],60)
  ]},
  {name:'Bench / Chest / Rear Delts', items:[
    wu('Foam Roll Top 3+'), wu('Top 3+ Stretches for Upper Body'),
    ss(3,[{n:'Secondary Bench Press Variation',r:'8',rest:120},{n:'Rear Delt Row',r:'15',rest:60}],60),
    ss(3,[{n:'DB Incline — AML Style',r:'12'},{n:'Rear Delt Row',r:'12'}],60),
    ss(3,[{n:'Chest Flyes',r:'15',rest:10},{n:'Rear Delt Cable Flyes',r:'25',rest:10}],10,'Superset · 10s rests'),
    ex('Finisher: Push Up Variation',2,'25',60),
    ex('Stretch / Foam Roll / Cardio (optional)',3,'—',0)
  ]}
]}
];

/* ============================== STATE ============================== */
const store = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};
let S = {
  phase: store.get('mm_phase',1),
  week: store.get('mm_week',1),
  unit: store.get('mm_unit','lb'),
  active: store.get('mm_active',null), // {phase,day,week,started,log:{key:{sets:[{w,r,done}],wudone}}}
  sessions: store.get('mm_sessions',[]),
  fitbit: store.get('mm_fitbit',{clientId:'',token:null})
};
const save=()=>{store.set('mm_phase',S.phase);store.set('mm_week',S.week);store.set('mm_unit',S.unit);
  store.set('mm_active',S.active);store.set('mm_sessions',S.sessions);store.set('mm_fitbit',S.fitbit)};

const $=(s,el)=>(el||document).querySelector(s);
const $$=(s,el)=>[...(el||document).querySelectorAll(s)];
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phaseById=(id)=>PROGRAM.find(p=>p.id===id);

/* target for an entry given phase settings */
function target(entry,phase){
  let s=entry.s, r=entry.r;
  if(phase.weekly && entry.wk){ const w=entry.wk[Math.min(S.week,4)-1]; s=w[0]; r=w[1]; }
  if(phase.wave && entry.wave){ const w=WAVE[Math.min(S.week,4)-1]; s=w.s; r=w.r; }
  return {s,r};
}
/* last logged sets for an exercise name */
function lastLog(name){
  for(let i=S.sessions.length-1;i>=0;i--){
    const sess=S.sessions[i];
    for(const k in sess.log){
      if(sess.log[k].name===name && sess.log[k].sets && sess.log[k].sets.some(x=>x.done)){
        const done=sess.log[k].sets.filter(x=>x.done);
        return done.map(x=>`${x.w||'—'}×${x.r||'—'}`).join(', ');
      }
    }
  }
  return null;
}

/* ============================== NAV ============================== */
$$('nav button').forEach(b=>b.addEventListener('click',()=>{
  $$('nav button').forEach(x=>x.classList.toggle('on',x===b));
  $$('.screen').forEach(sc=>sc.classList.remove('on'));
  $('#scr-'+b.dataset.nav).classList.add('on');
  render(b.dataset.nav);
}));
function render(which){
  ({train:renderTrain,program:renderProgram,history:renderHistory,fitbit:renderFitbit,settings:renderSettings})[which]();
}

/* ============================== TRAIN ============================== */
function renderTrain(){
  const el=$('#scr-train');
  if(S.active){ renderSession(el); return; }
  const phase=phaseById(S.phase);
  el.innerHTML=`
  <div class="pagehead"><span class="eyebrow">The Metabolic Method</span>
    <h1>Start a workout</h1>
    <div class="sub">${esc(phase.name)}</div></div>
  <div class="pills" id="phasePills">${PROGRAM.map(p=>
    `<button class="pill ${p.id===S.phase?'on':''}" data-p="${p.id}">Phase ${p.id}</button>`).join('')}</div>
  ${(phase.weekly||phase.wave)?`
  <div class="pills" style="margin-top:8px" id="weekPills">
    ${[1,2,3,4].map(w=>`<button class="pill ${w===S.week?'on':''}" data-w="${w}">Week ${w}${phase.wave?' · '+WAVE[w-1].s+'×'+WAVE[w-1].r:''}</button>`).join('')}
  </div>
  <div class="note">${phase.wave?'Strength phase — main lifts follow the wave (3×8 → 4×6 → 5×5 → 4×4). Use the Strength Calculator from the course for loads.':'Phase 1 progresses week to week — targets update automatically.'}</div>`:''}
  <div style="margin-top:14px">
    ${phase.days.map((d,i)=>`<button class="daycard" data-d="${i}">
      <div class="dnum">DAY ${i+1}</div><div class="dname">${esc(d.name)}</div>
      <div class="dmeta">${d.items.filter(x=>x.t!=='wu').length} movements · ${d.items.filter(x=>x.t==='wu').length} warm-ups</div>
    </button>`).join('')}
  </div>`;
  $$('#phasePills .pill',el).forEach(b=>b.onclick=()=>{S.phase=+b.dataset.p;S.week=1;save();renderTrain();});
  const wp=$('#weekPills',el); if(wp)$$('.pill',wp).forEach(b=>b.onclick=()=>{S.week=+b.dataset.w;save();renderTrain();});
  $$('.daycard',el).forEach(b=>b.onclick=()=>startSession(+b.dataset.d));
}

function entryKey(di,ii){return `d${di}i${ii}`}

function startSession(dayIdx){
  const phase=phaseById(S.phase), day=phase.days[dayIdx], log={};
  day.items.forEach((it,ii)=>{
    const key=entryKey(dayIdx,ii);
    if(it.t==='wu'){ log[key]={name:it.n,wu:true,done:false}; }
    else if(it.t==='ex'){
      const t=target(it,phase);
      log[key]={name:it.n,sets:Array.from({length:t.s},()=>({w:'',r:'',done:false}))};
    } else { // superset: sets rounds × items
      it.items.forEach((sub,si)=>{
        log[key+'s'+si]={name:sub.n,ss:key,sets:Array.from({length:it.s},()=>({w:'',r:'',done:false}))};
      });
    }
  });
  S.active={phase:S.phase,day:dayIdx,week:S.week,started:Date.now(),log};
  save(); renderTrain();
  if('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(()=>{});
}

function renderSession(el){
  const phase=phaseById(S.active.phase), day=phase.days[S.active.day], log=S.active.log;
  const allSets=Object.values(log).filter(x=>x.sets).flatMap(x=>x.sets);
  const doneN=allSets.filter(x=>x.done).length;
  el.innerHTML=`
  <div class="progress"><div class="row" style="margin-bottom:6px">
    <div class="grow"><span class="eyebrow">Phase ${phase.id}${(phase.weekly||phase.wave)?' · Week '+S.active.week:''}</span>
      <h1 style="font-size:22px">${esc(day.name)}</h1></div>
    <button class="btn small ghost" id="abandon">Discard</button></div>
    <div class="pbar"><div style="width:${allSets.length?Math.round(doneN/allSets.length*100):0}%"></div></div>
  </div>
  <div id="sessBody"></div>
  <button class="btn" id="finish" style="margin-top:14px">Finish workout</button>`;

  const body=$('#sessBody',el);
  day.items.forEach((it,ii)=>{
    const key=entryKey(S.active.day,ii);
    if(it.t==='wu'){
      const e=log[key];
      const div=document.createElement('div');
      div.className='card';
      div.innerHTML=`<div class="wu ${e.done?'done':''}" data-k="${key}">
        <div class="wbox">✓</div><div class="grow wt"><div class="exname">${esc(it.n)}</div>
        ${it.d?`<div class="sub">${esc(it.d)}</div>`:''}</div></div>`;
      $('.wu',div).onclick=()=>{e.done=!e.done;save();renderSession(el)};
      body.appendChild(div);
    }
    else if(it.t==='ex'){ body.appendChild(exCard(it,log[key],key,it.rest)); }
    else {
      const wrap=document.createElement('div'); wrap.className='card';
      wrap.innerHTML=`<div class="ssflag">${esc(it.label)} · ${it.s} rounds</div>`;
      it.items.forEach((sub,si)=>{
        const k=key+'s'+si;
        wrap.appendChild(exBlock(sub.n,sub.r,log[k],k,sub.rest!=null?sub.rest:it.rest));
      });
      body.appendChild(wrap);
    }
  });
  $('#finish',el).onclick=finishSession;
  $('#abandon',el).onclick=()=>{if(confirm('Discard this workout? Nothing will be saved.')){S.active=null;save();renderTrain();}};
}

function exCard(it,e,key,rest){
  const phase=phaseById(S.active.phase), t=target(it,phase);
  const div=document.createElement('div'); div.className='card';
  div.appendChild(exBlockInner(it.n,`${t.s} × ${t.r}${rest?` · rest ${fmtRest(rest)}`:''}`,e,key,rest));
  return div;
}
function exBlock(name,reps,e,key,rest){
  const d=document.createElement('div'); d.style.marginTop='10px';
  d.appendChild(exBlockInner(name,`target ${reps}${rest?` · rest ${fmtRest(rest)}`:''}`,e,key,rest));
  return d;
}
function exBlockInner(name,meta,e,key,rest){
  const frag=document.createElement('div');
  const last=lastLog(name);
  frag.innerHTML=`<div class="exname">${esc(name)}</div><div class="exmeta">${esc(meta)}</div>
    ${last?`<div class="lastlog">Last: ${esc(last)}</div>`:''}
    <div class="colhead"><span>Set</span><span>${S.unit}</span><span>Reps</span><span>✓</span></div>`;
  e.sets.forEach((st,si)=>{
    const row=document.createElement('div'); row.className='setrow';
    row.innerHTML=`<span class="sn">${si+1}</span>
      <input type="number" inputmode="decimal" placeholder="—" value="${st.w}">
      <input type="number" inputmode="numeric" placeholder="—" value="${st.r}">
      <button class="tick ${st.done?'done':''}">✓</button>`;
    const [wi,ri]=$$('input',row);
    wi.oninput=()=>{st.w=wi.value;save()};
    ri.oninput=()=>{st.r=ri.value;save()};
    $('.tick',row).onclick=(ev)=>{
      st.done=!st.done;
      if(st.done && !st.w && si>0) st.w=e.sets[si-1].w, wi.value=st.w;
      save();
      ev.target.classList.toggle('done',st.done);
      updateBar();
      if(st.done && rest>0) startRest(rest,name);
    };
    frag.appendChild(row);
  });
  const add=document.createElement('button'); add.className='btn small ghost'; add.style.marginTop='10px';
  add.textContent='+ Add set';
  add.onclick=()=>{e.sets.push({w:'',r:'',done:false});save();render('train')};
  frag.appendChild(add);
  return frag;
}
function updateBar(){
  const allSets=Object.values(S.active.log).filter(x=>x.sets).flatMap(x=>x.sets);
  const pct=allSets.length?Math.round(allSets.filter(x=>x.done).length/allSets.length*100):0;
  const bar=$('.pbar>div'); if(bar)bar.style.width=pct+'%';
}
function fmtRest(s){return s>=60?(s%60?`${Math.floor(s/60)}m${s%60}s`:`${s/60} min`):`${s} sec`}

function finishSession(){
  const a=S.active;
  const anyDone=Object.values(a.log).some(x=>(x.sets&&x.sets.some(s=>s.done))||(x.wu&&x.done));
  if(!anyDone && !confirm('No sets are marked done. Save anyway?'))return;
  S.sessions.push({date:new Date().toISOString(),phase:a.phase,day:a.day,week:a.week,
    dur:Math.round((Date.now()-a.started)/60000),log:a.log});
  S.active=null; save(); renderTrain();
}

/* ======================= REST TIMER (signature) ======================= */
let restT=null, restTotal=0, restLeft=0;
const RING=2*Math.PI*46;
function startRest(sec,nextName){
  clearInterval(restT); restTotal=sec; restLeft=sec;
  $('#restNext').innerHTML=`then back to <b>${esc(nextName)}</b>`;
  $('#restOverlay').classList.add('on'); tickRest();
  restT=setInterval(()=>{restLeft--; if(restLeft<=0){endRest(true)} else tickRest();},1000);
}
function tickRest(){
  $('#restTime').textContent=`${Math.floor(restLeft/60)}:${String(restLeft%60).padStart(2,'0')}`;
  $('#ring').setAttribute('stroke-dasharray',RING);
  $('#ring').setAttribute('stroke-dashoffset',RING*(1-restLeft/restTotal));
}
function endRest(alarm){
  clearInterval(restT); $('#restOverlay').classList.remove('on');
  if(alarm){
    if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
    try{const ac=new (window.AudioContext||window.webkitAudioContext)();
      [0,.2,.4].forEach(t=>{const o=ac.createOscillator(),g=ac.createGain();
        o.connect(g);g.connect(ac.destination);o.frequency.value=880;
        g.gain.setValueAtTime(.25,ac.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+t+.15);
        o.start(ac.currentTime+t);o.stop(ac.currentTime+t+.16);});}catch(e){}
  }
}
$('#restPlus').onclick=()=>{restLeft+=30;restTotal=Math.max(restTotal,restLeft);tickRest()};
$('#restSkip').onclick=()=>endRest(false);

/* ============================== PROGRAM ============================== */
function renderProgram(){
  const el=$('#scr-program');
  el.innerHTML=`<div class="pagehead"><span class="eyebrow">Reference</span><h1>The Program</h1>
  <div class="sub">6-month plan from the Metabolic Method guide. Strength phases (3–5) wave: W1 3×8 · W2 4×6 · W3 5×5 · W4 4×4.</div></div>
  ${PROGRAM.map(p=>`<div class="card"><details ${p.id===S.phase?'open':''}>
    <summary>${esc(p.name)}</summary>
    ${p.days.map((d,i)=>`<div style="margin-top:10px"><div class="dnum" style="font-family:var(--mono);font-size:11px;color:var(--gold)">DAY ${i+1} — ${esc(d.name.toUpperCase())}</div>
      ${d.items.map(it=>{
        if(it.t==='wu')return `<div class="sub">· ${esc(it.n)}</div>`;
        if(it.t==='ex')return `<div class="sub" style="color:var(--bone)">${esc(it.n)} <span style="color:var(--gold-dim);font-family:var(--mono)">${it.s}×${esc(it.r)}${it.rest?' · '+fmtRest(it.rest):''}</span></div>`;
        return `<div class="sub" style="color:var(--bone)">${esc(it.label)} ×${it.s}: ${it.items.map(x=>esc(x.n)+' '+esc(x.r)).join(' + ')}</div>`;
      }).join('')}</div>`).join('')}
  </details></div>`).join('')}`;
}

/* ============================== HISTORY ============================== */
function renderHistory(){
  const el=$('#scr-history');
  const rows=[...S.sessions].reverse();
  el.innerHTML=`<div class="pagehead"><span class="eyebrow">Logbook</span><h1>History</h1>
  <div class="sub">${S.sessions.length} workouts logged</div></div>
  <div class="card">${rows.length?rows.map((s,i)=>{
    const phase=phaseById(s.phase), day=phase.days[s.day];
    const sets=Object.values(s.log).filter(x=>x.sets).flatMap(x=>x.sets).filter(x=>x.done);
    const vol=sets.reduce((a,x)=>a+((+x.w||0)*(+x.r||0)),0);
    return `<div class="hsession"><details><summary>
      <span style="font-family:var(--mono);font-size:12px;color:var(--muted)">${new Date(s.date).toLocaleDateString()}</span><br>
      Phase ${s.phase} · ${esc(day.name)} <span style="color:var(--muted);font-size:12px">· ${sets.length} sets · ${s.dur} min${vol?` · ${vol.toLocaleString()} ${S.unit} volume`:''}</span></summary>
      ${Object.values(s.log).filter(x=>x.sets&&x.sets.some(t=>t.done)).map(x=>
        `<div class="sub" style="margin-top:6px"><b style="color:var(--bone)">${esc(x.name)}</b><br>
        <span style="font-family:var(--mono)">${x.sets.filter(t=>t.done).map(t=>`${t.w||'—'}×${t.r||'—'}`).join('  ')}</span></div>`).join('')}
      <button class="btn small danger" data-del="${S.sessions.length-1-i}" style="margin-top:10px">Delete</button>
    </details></div>`;
  }).join(''):'<div class="sub">No workouts yet. Start one from the Train tab.</div>'}</div>`;
  $$('[data-del]',el).forEach(b=>b.onclick=()=>{
    if(confirm('Delete this workout permanently?')){S.sessions.splice(+b.dataset.del,1);save();renderHistory();}
  });
}

/* ============================== FITBIT ============================== */
const FB_SCOPES='activity heartrate profile';
function b64url(buf){return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function pkce(){
  const v=b64url(crypto.getRandomValues(new Uint8Array(32)));
  const c=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
  return {v,c};
}
function redirectUri(){return location.origin+location.pathname}

async function fitbitConnect(){
  if(!S.fitbit.clientId){alert('Add your Fitbit Client ID in Settings first.');return}
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
    save();
    $$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.nav==='fitbit'));
    $$('.screen').forEach(sc=>sc.classList.remove('on')); $('#scr-fitbit').classList.add('on');
    renderFitbit();
  }catch(e){alert('Fitbit connection failed: '+e.message)}
}
async function fbFetch(path){
  let t=S.fitbit.token;
  if(!t)throw new Error('Not connected');
  if(Date.now()>t.exp-60000){
    const tok=await fitbitToken({client_id:S.fitbit.clientId,grant_type:'refresh_token',refresh_token:t.refresh});
    t=S.fitbit.token={access:tok.access_token,refresh:tok.refresh_token,exp:Date.now()+tok.expires_in*1000};save();
  }
  const res=await fetch('https://api.fitbit.com'+path,{headers:{Authorization:'Bearer '+t.access}});
  if(!res.ok)throw new Error('Fitbit API '+res.status);
  return res.json();
}
async function renderFitbit(){
  const el=$('#scr-fitbit');
  const connected=!!S.fitbit.token;
  el.innerHTML=`<div class="pagehead"><span class="eyebrow">Recovery & activity</span><h1>Fitbit</h1>
    <div class="sub">${connected?'Connected — pull today\u2019s numbers below.':'Connect to pull steps and heart rate into the app.'}</div></div>
  <div class="card" id="fbStats">${connected?'<div class="sub">Loading…</div>':
    '<div class="sub">Not connected yet.</div>'}</div>
  <button class="btn ${connected?'ghost':''}" id="fbBtn">${connected?'Refresh data':'Connect Fitbit'}</button>
  ${connected?'<button class="btn danger" id="fbOut" style="margin-top:8px">Disconnect</button>':''}
  <div class="note">Setup: register a free app at dev.fitbit.com (type: <b>Personal</b>), set the redirect URL to
  <code>${esc(redirectUri())}</code>, then paste the Client ID in Settings.</div>`;
  $('#fbBtn').onclick=connected?loadFitbitStats:fitbitConnect;
  const out=$('#fbOut'); if(out)out.onclick=()=>{S.fitbit.token=null;save();renderFitbit();};
  if(connected)loadFitbitStats();
}
async function loadFitbitStats(){
  const box=$('#fbStats'); box.innerHTML='<div class="sub">Loading…</div>';
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
  }catch(e){box.innerHTML=`<div class="sub" style="color:var(--red)">Couldn't load: ${esc(e.message)}. Try reconnecting.</div>`}
}

/* ============================== SETTINGS ============================== */
function renderSettings(){
  const el=$('#scr-settings');
  el.innerHTML=`<div class="pagehead"><span class="eyebrow">Setup</span><h1>Settings</h1></div>
  <div class="card">
    <label class="f">Weight unit</label>
    <select id="unitSel"><option value="lb" ${S.unit==='lb'?'selected':''}>Pounds (lb)</option>
    <option value="kg" ${S.unit==='kg'?'selected':''}>Kilograms (kg)</option></select>
    <label class="f">Fitbit Client ID</label>
    <input id="cid" value="${esc(S.fitbit.clientId)}" placeholder="e.g. 23ABCD" autocapitalize="off">
    <div class="note">From dev.fitbit.com → Register an app → OAuth 2.0 Application Type: <b>Client</b>, app type <b>Personal</b>, Redirect URL: <code>${esc(redirectUri())}</code></div>
  </div>
  <div class="card">
    <label class="f">Your data</label>
    <div class="row"><button class="btn ghost" id="expBtn">Export JSON</button>
    <button class="btn ghost" id="impBtn">Import</button></div>
    <input type="file" id="impFile" accept=".json" style="display:none">
    <button class="btn danger" id="wipe" style="margin-top:10px">Erase all data</button>
  </div>`;
  $('#unitSel').onchange=(e)=>{S.unit=e.target.value;save()};
  $('#cid').oninput=(e)=>{S.fitbit.clientId=e.target.value.trim();save()};
  $('#expBtn').onclick=()=>{
    const blob=new Blob([JSON.stringify({sessions:S.sessions},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='metabolic-method-log.json';a.click();
  };
  $('#impBtn').onclick=()=>$('#impFile').click();
  $('#impFile').onchange=(e)=>{
    const f=e.target.files[0]; if(!f)return;
    f.text().then(t=>{const d=JSON.parse(t);
      if(Array.isArray(d.sessions)){S.sessions=d.sessions;save();alert('Imported '+d.sessions.length+' workouts.')}
      else alert('That file doesn\u2019t look like an export from this app.');
    }).catch(()=>alert('Couldn\u2019t read that file.'));
  };
  $('#wipe').onclick=()=>{if(confirm('Erase ALL workouts and settings? This can\u2019t be undone.')){localStorage.clear();location.reload();}};
}

/* ============================== BOOT ============================== */
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
handleFitbitRedirect();
renderTrain();
