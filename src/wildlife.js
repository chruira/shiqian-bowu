import {canStand,findPath,chapterById} from './world.js?v20261029k';
import {creatures} from './data.js?v20261029k';
import {habitatPlans,behaviors,residentFor} from './habitats.js?v20261029k';

const species={cam_wiwaxia:{type:'wiwaxia',speed:12,radius:65},cam_olenoides:{type:'trilobite',speed:19,radius:75},cam_marrella:{type:'marrella',speed:27,radius:85},cam_opabinia:{type:'opabinia',speed:32,radius:85},cam_anomalocaris:{type:'anomalocaris',speed:43,radius:125},jur_stegosaurus:{type:'stegosaurus',speed:16,radius:75},jur_allosaurus:{type:'allosaurus',speed:29,radius:95},jur_ceratosaurus:{type:'ceratosaurus',speed:26,radius:85},jur_diplodocus:{type:'diplodocus',speed:12,radius:55},jur_dryosaurus:{type:'dryosaurus',speed:36,radius:90}};
export const FOLLOW_SECONDS=6;
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function validSpot(p,chapter){return canStand(p,chapter)&&Math.hypot(p.x-chapter.exit.x,p.y-chapter.exit.y)>48;}
function nearestValid(p,chapter){if(validSpot(p,chapter))return p;for(let r=12;r<220;r+=12)for(let n=0;n<16;n++){const q={x:p.x+Math.cos(n*Math.PI/8)*r,y:p.y+Math.sin(n*Math.PI/8)*r};if(validSpot(q,chapter))return q;}return {...chapter.spawn};}
function chooseRoute(n,chapter){for(let i=0;i<18;i++){const end={x:n.home.x+(n.random()-.5)*n.radius*2,y:n.home.y+(n.random()-.5)*n.radius*2};if(!validSpot(end,chapter))continue;const route=findPath(n,end,chapter);if(route.length&&route.every(p=>canStand(p,chapter))){n.route=route;n.behavior='moving';return;}}n.route=[];n.behavior='resting';n.wait=.6;}
function moveAlong(n,chapter,delta,speed=n.speed){if(!n.route.length)return false;const p=n.route[0],dx=p.x-n.x,dy=p.y-n.y,distance=Math.hypot(dx,dy);if(distance<2){n.route.shift();return n.route.length>0;}const step=Math.min(distance,speed*delta),next={x:n.x+dx/distance*step,y:n.y+dy/distance*step};if(!canStand(next,chapter)){n.route=[];return false;}n.facing=dx<-.05?-1:dx>.05?1:n.facing;n.x=next.x;n.y=next.y;n.moving=true;return true;}

export function createActors(chapter){return habitatPlans[chapter.id].residents.map((r,index)=>{const home=nearestValid(r,chapter),n={id:chapter.id+'_npc_'+index,creatureId:r.id,name:creatures[r.id].name,kind:'creature',...species[r.id],x:home.x,y:home.y,home:{x:home.x,y:home.y},random:rng((chapter.index??chapterById[chapter.id].index)*99+index*37+9),route:[],wait:0,behavior:'moving',facing:index%2?1:-1,moving:false,phase:index*1.3,activity:null,ambientIn:5+index*3,reaction:0,pose:{head:0,tail:0,limbs:0,body:0},lastActivity:null};chooseRoute(n,chapter);return n;});}

export function beginBehavior(actor,chapter,id,{observed=false}={}){
  const resident=residentFor(chapter.id,actor.creatureId),definition=behaviors[id];
  if(!resident||resident.action!==id||!definition)return false;
  const resource=habitatPlans[chapter.id].resources.find(r=>r.id===definition.resource);
  const offset=id==='drink'?{x:65,y:27}:{x:48,y:3};
  const target=resource?nearestValid({x:resource.x-offset.x,y:resource.y-offset.y},chapter):{x:actor.x,y:actor.y};
  actor.route=findPath(actor,target,chapter);
  actor.wait=0;actor.activity={id,observed,resource,stage:actor.route.length?'approach':'perform',elapsed:0,approachTime:0,duration:definition.duration,travel:0,emitted:false};
  actor.behavior=id;actor.pose={head:0,tail:0,limbs:0,body:0};
  return true;
}

export function cancelBehavior(actor){if(!actor)return;actor.activity=null;actor.pose={head:0,tail:0,limbs:0,body:0};actor.route=[];actor.wait=.5;actor.behavior='resting';}
export function reactToPhoto(actor){actor.reaction=1.2;}
export function tickActors(actors,chapter,delta){const completed=[];for(const n of actors){
  n.animationTime=(n.animationTime||0)+delta;
  n.moving=false;n.reaction=Math.max(0,n.reaction-delta);
  const a=n.activity;
  if(a){
    if(a.stage==='approach'){
      a.approachTime+=delta;moveAlong(n,chapter,delta,Math.max(n.speed,65));
      if(!n.route.length||a.approachTime>=8){n.route=[];a.stage='perform';a.elapsed=0;n.facing=1;}
      continue;
    }
    a.elapsed+=delta;const p=Math.min(1,a.elapsed/a.duration),envelope=Math.sin(Math.PI*p),cycle=Math.sin(a.elapsed*5.5),kind=behaviors[a.id].visual;
    n.pose={head:0,tail:0,limbs:0,body:0};
    if(['graze','drink','inspect'].includes(kind)){n.facing=1;n.pose.head=envelope*(kind==='drink'?1.55:kind==='graze'?.4:.28)+cycle*.035*envelope;}
    if(['scrape','sift','gather','probe'].includes(kind)){n.facing=1;n.pose.head=envelope*(kind==='probe'?.22:.10);n.pose.limbs=cycle*envelope;n.pose.body=Math.sin(a.elapsed*3)*envelope;}
    if(['swim','crawl','patrol','alert'].includes(kind)){
      const moving=kind==='alert'?p>.25&&p<.8:kind==='patrol'?(p<.38||p>.68):true;
      if(moving){if(!n.route.length){const step=kind==='alert'?80:kind==='swim'?100:50,direction=kind==='alert'?-1:p>.65?-1:1,target=nearestValid({x:n.x+step*direction,y:n.y+(kind==='swim'?Math.sin(a.elapsed)*24:8)},chapter);n.route=findPath(n,target,chapter);}const before={x:n.x,y:n.y};moveAlong(n,chapter,delta,kind==='alert'?45:kind==='swim'?50:kind==='crawl'?16:30);a.travel+=Math.hypot(n.x-before.x,n.y-before.y);}else{n.pose.head=-.12*envelope;n.route=[];}
      n.pose.tail=Math.sin(a.elapsed*5)*envelope*(kind==='alert'?.23:.08);n.pose.limbs=Math.sin(a.elapsed*10)*envelope;n.pose.body=kind==='swim'?a.elapsed*7:0;
    }
    if(p>=1){n.lastActivity={id:a.id,observed:a.observed,travel:a.travel,elapsed:a.elapsed};if(a.observed&&!a.emitted){completed.push({actor:n,actionId:a.id});a.emitted=true;}n.activity=null;n.pose={head:0,tail:0,limbs:0,body:0};n.route=[];n.wait=1;n.ambientIn=7+n.random()*5;n.behavior='resting';}
    continue;
  }
  n.ambientIn-=delta;
  if(n.ambientIn<=0){beginBehavior(n,chapter,residentFor(chapter.id,n.creatureId).action);continue;}
  if(n.wait>0){n.wait-=delta;continue;}
  if(!n.route.length){chooseRoute(n,chapter);if(!n.route.length)continue;}
  moveAlong(n,chapter,delta);
  if(!n.route.length){n.behavior='resting';n.wait=.8+n.random()*2.5;}
}return completed;}

export function nearestActor(actors,p,{creaturesOnly=false,range=110}={}){return actors.filter(n=>(!creaturesOnly||n.kind==='creature')&&Math.hypot(n.x-p.x,n.y-p.y)<=range).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;}
export function rememberSighting(world,actor,chapter,kind='observe',photo=null){if(!actor.creatureId||!creatures[actor.creatureId])return false;world.sightings??={};const old=world.sightings[actor.creatureId],entry=old||{creatureId:actor.creatureId,firstSeenAt:new Date().toISOString(),sceneIds:[],observed:false,followed:false,photo:null};entry.sceneIds=[...new Set([...entry.sceneIds,chapter.id])];entry.observed=true;entry.behaviorRecords??=[];if(kind==='follow')entry.followed=true;if(photo)entry.photo=photo;world.sightings[actor.creatureId]=entry;return !old;}
export function rememberBehavior(world,actor,chapter,actionId){const last=actor.lastActivity;if(!last?.observed||last.id!==actionId||last.elapsed<behaviors[actionId]?.duration)return false;rememberSighting(world,actor,chapter);const records=world.sightings[actor.creatureId].behaviorRecords;if(records.some(r=>r.sceneId===chapter.id&&r.actionId===actionId))return false;records.push({sceneId:chapter.id,actionId,label:behaviors[actionId].label,summary:behaviors[actionId].summary,recordedAt:new Date().toISOString()});return true;}
export function sceneDiscoveries(world,sceneId){const ids=new Set(habitatPlans[sceneId]?.residents.map(r=>r.id)||[]);return Object.values(world.sightings||{}).filter(r=>ids.has(r.creatureId)&&r.sceneIds?.includes(sceneId));}
export function hasSceneBehavior(world,sceneId,creatureId){const r=residentFor(sceneId,creatureId);return !!world.sightings?.[creatureId]?.behaviorRecords?.some(b=>b.sceneId===sceneId&&b.actionId===r?.action);}
export function behaviorText(actor){const a=actor.activity;if(a)return a.stage==='approach'?'正在靠近观察点':behaviors[a.id].label;return actor.reaction?'抬头察看周围':actor.moving?'正在移动':'停步休息';}
