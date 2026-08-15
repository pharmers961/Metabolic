/* ============ THE METABOLIC METHOD — PROGRAM DATA ============ */
/* Encoded from the Workout Template Guide V2 PDF. Week 1 targets are the
   defaults; Phase 1 carries the PDF's week-by-week variations (wk array =
   [W1,W2,W3,W4]). Phases 3–5 main lifts follow the strength wave:
   Week 1 3x8, Week 2 4x6, Week 3 5x5, Week 4 4x4 (flagged wave:true). */

const WAVE = [{s:3,r:'8',pct:.72},{s:4,r:'6',pct:.80},{s:5,r:'5',pct:.85},{s:4,r:'4',pct:.88}];

/* What each phase is for, in the guide's terms — shown as an info sheet. */
const PHASE_INFO = {
  1:'Light-to-moderate loads with strict form. The goal is learning each movement and building the mind-muscle connection — leave 2–3 reps in the tank. Targets shift every week (the app updates them automatically).',
  2:'Same movement patterns, much shorter rests (many supersets with only 10-second breathers). The goal is muscle connection and a pump, not maximal weight. Expect to lower the loads.',
  3:'First strength month. Main lifts follow the wave (3×8 → 4×6 → 5×5 → 4×4): work up so your LAST set is your BEST set. Loads come from your 1RM — the app suggests them once a 1RM is saved.',
  4:'Strength, top-set-drop-set style: your heaviest set comes FIRST while you are fresh, then drop the weight for the remaining sets. Same wave and 1RM-based loading.',
  5:'Lowest volume, highest intensity: few sets taken close to failure. Log RPE on the main lifts (9 ≈ one rep left). Same wave — this is the peak of the strength block.',
  6:'PowerBuilding: strength work plus higher-volume pumping, with pyramid rep schemes (e.g. 12/10/8 — each set has its own target). Sets the base for the next cycle.'
};

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
  {name:'Active Recovery / Mobility', recovery:true, items:[
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
  {name:'Active Recovery / Mobility', recovery:true, items:[
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
  {name:'Active Recovery / Mobility', recovery:true, items:[
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
  {name:'Active Recovery / Mobility', recovery:true, items:[
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

/* Which stored 1RM a program slot maps to. */
const LIFTS = {
  squat:{label:'Squat', re:/^(Squat Variation)/i},
  bench:{label:'Bench Press', re:/^(Bench Press Variation)/i},
  deadlift:{label:'Deadlift', re:/^(Deadlift Variation|AML Deadlift$)/i},
  ohp:{label:'Overhead Press', re:/^(Overhead Press)/i}
};
function liftKeyFor(name){
  for(const k in LIFTS){ if(LIFTS[k].re.test(name)) return k; }
  return null;
}
