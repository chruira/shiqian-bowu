import {quests} from './data.js?v20261029k';
// These are guided game encounters, not claims of exclusive fossil habitats.
export const habitatPlans = {
  cam_feeding: {
    title:'看海床上的取食线索', hint:'先找微生物席旁的威瓦西亚虫，再比较三叶虫怎样翻动沉积物。',
    residents:[{id:'cam_wiwaxia',x:365,y:365,action:'scrape',goal:'看它贴近微生物席刮取'},{id:'cam_olenoides',x:680,y:250,action:'sift',goal:'看附肢拨动海床颗粒'}],
    resources:[{id:'mat',x:420,y:365,kind:'mat',label:'微生物席'},{id:'sediment',x:730,y:270,kind:'sediment',label:'松软沉积物'}]
  },
  cam_water: {
    title:'观察水层中的游动与探查', hint:'开阔水层找加拿大奇虾，近海床留意欧巴宾海蝎的长吻。',
    residents:[{id:'cam_anomalocaris',x:365,y:240,action:'swim',goal:'看身体侧叶与转向游动'},{id:'cam_opabinia',x:650,y:365,action:'probe',goal:'看长吻伸向海床探查'}],
    resources:[{id:'water',x:530,y:230,kind:'current',label:'开阔水层'},{id:'seabed',x:730,y:380,kind:'sediment',label:'近海床探查点'}]
  },
  cam_cliff: {
    title:'沿沉积区寻找细小生命', hint:'留意崖脚的碎屑颗粒；这里重点比较小型生物的附肢与移动。',
    residents:[{id:'cam_marrella',x:370,y:300,action:'gather',goal:'看细附肢收集悬浮颗粒'},{id:'cam_olenoides',x:710,y:350,action:'crawl',goal:'看贴着沉积坡缓慢爬行'}],
    resources:[{id:'particles',x:430,y:315,kind:'particles',label:'悬浮有机颗粒'},{id:'slope',x:765,y:385,kind:'sediment',label:'崖脚沉积坡'}]
  },
  jur_fern: {
    title:'观察低矮植物旁的植食动物', hint:'从蕨丛旁的剑龙开始。橡树龙更轻巧，留意它停步、抬头和移动的变化。',
    residents:[{id:'jur_stegosaurus',x:365,y:345,action:'graze',goal:'看剑龙靠近蕨丛、低头取食'},{id:'jur_dryosaurus',x:755,y:365,action:'alert',goal:'看橡树龙抬头、转向并退开'}],
    resources:[{id:'ferns',x:415,y:350,kind:'fern',label:'低矮蕨丛'},{id:'edge',x:785,y:350,kind:'cover',label:'林缘观察点'}]
  },
  jur_river: {
    title:'留意水边的停留与探查', hint:'梁龙在岸边停留，角鼻龙沿泥地巡视。保持距离，让动作完整发生。',
    residents:[{id:'jur_diplodocus',x:350,y:355,action:'drink',goal:'看梁龙伸颈低头，水面泛起涟漪'},{id:'jur_ceratosaurus',x:735,y:255,action:'inspect',goal:'看角鼻龙低首探查、转向巡视'}],
    resources:[{id:'shore',x:425,y:416,kind:'water',label:'浅水岸线'},{id:'mud',x:780,y:295,kind:'tracks',label:'湿泥巡视点'}]
  },
  jur_forest: {
    title:'追踪古河道旁的移动', hint:'沿古河道追踪异特龙，再留意橡树龙抬头、转身与退开的变化。',
    residents:[{id:'jur_allosaurus',x:440,y:335,action:'patrol',goal:'看异特龙停步、察看并继续巡视'},{id:'jur_dryosaurus',x:735,y:350,action:'alert',goal:'看橡树龙警觉转身、退入林缘'}],
    resources:[{id:'channel',x:560,y:370,kind:'tracks',label:'古河道巡视路线'},{id:'forest',x:780,y:345,kind:'cover',label:'林地边缘'}]
  }
};

export function residentFor(chapterId, creatureId) {
  return habitatPlans[chapterId]?.residents.find(r=>r.id===creatureId);
}

export const behaviors = {
  scrape:{label:'贴地刮取',button:'观察并记录刮取',resource:'mat',duration:5,visual:'scrape',summary:'它贴近微生物席，前端小幅下探，海床细粒随动作扬起。'},
  sift:{label:'翻动沉积物',button:'观察并记录翻动',resource:'sediment',duration:5,visual:'sift',summary:'它停在松软沉积物旁，附肢交替摆动，周围出现细小沉积颗粒。'},
  swim:{label:'转向游动',button:'观察并记录游动',resource:'water',duration:6,visual:'swim',summary:'它沿水层前进并转向，侧叶起伏，身体周围的水流随之变化。'},
  probe:{label:'长吻探查',button:'观察并记录探查',resource:'seabed',duration:5,visual:'probe',summary:'它在近海床停留，长吻前伸、下探，再抬回原位。'},
  gather:{label:'附肢收集颗粒',button:'观察并记录收集',resource:'particles',duration:5,visual:'gather',summary:'它在碎屑颗粒旁停留，头部与细附肢摆动，悬浮颗粒随水流漂过。'},
  crawl:{label:'贴地爬行',button:'观察并记录爬行',resource:'slope',duration:6,visual:'crawl',summary:'它贴着沉积物缓慢前进，腹侧附肢交替活动。'},
  graze:{label:'低头取食',button:'观察并记录取食',resource:'ferns',duration:5,visual:'graze',summary:'剑龙先靠近低矮植物，再反复低头、轻动头部，抬头后结束本次观察。'},
  drink:{label:'伸颈低头饮水',button:'观察并记录饮水',resource:'shore',duration:6,visual:'drink',summary:'梁龙在岸上停下，长颈向前下方转动，头部靠近水面，涟漪扩散后抬起。'},
  inspect:{label:'低首探查',button:'观察并记录探查',resource:'mud',duration:5,visual:'inspect',summary:'角鼻龙在泥地边低头察看，停顿、转向，再向另一处移动。'},
  patrol:{label:'停步巡视',button:'观察并记录巡视',resource:'channel',duration:6,visual:'patrol',summary:'异特龙沿古河道前进，停步抬头察看，然后转向继续巡视。'},
  alert:{label:'警觉退开',button:'观察并记录警觉',resource:null,duration:5,visual:'alert',summary:'橡树龙先抬头停顿，再转身退开一段距离，尾部随动作摆动。'}
};

// Every animal used in the current investigation must also be available in
// its scene. Retain the original encounters and their animation resources.
const referenceEncounters = Object.values(habitatPlans).flatMap(plan =>
  plan.residents.map(resident => ({resident, resources:plan.resources}))
);
for (const quest of quests) {
  const plan=habitatPlans[quest.sceneId];
  for (const id of quest.creatureIds) {
    if (plan.residents.some(r=>r.id===id)) continue;
    const reference=referenceEncounters.find(item=>item.resident.id===id);
    const slot=plan.residents.length;
    plan.residents.push({...reference.resident,x:slot%2?720:540,y:slot%2?320:240});
    const resourceId=behaviors[reference.resident.action].resource;
    const resource=reference.resources.find(r=>r.id===resourceId);
    if(resource&&!plan.resources.some(r=>r.id===resourceId))plan.resources.push({...resource});
  }
}

export function availableBehaviors(chapterId, creatureId) {
  const r=residentFor(chapterId,creatureId);
  return r ? [r.action] : [];
}
