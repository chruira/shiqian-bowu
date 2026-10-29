import {creatures,eras,questById} from './data.js?v20261029k';
import {chapterById,findPath} from './world.js?v20261029k';
import {createActors,tickActors,nearestActor,rememberSighting,rememberBehavior,sceneDiscoveries,hasSceneBehavior,beginBehavior,cancelBehavior,reactToPhoto,behaviorText,FOLLOW_SECONDS} from './wildlife.js?v20261029k';
import {habitatPlans,behaviors,residentFor} from './habitats.js?v20261029k';
import {drawActor} from './raster-actors.js?v20261029k';
import {drawHabitatResources} from './behavior-art.js?v20261029k';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function createExploration(api){
  let actors=[],chapter=null,arrival=null,following=null,lastRoute=0,dialog=null,followProgress=0,observation=null,targetId=null,lastResult=null;
  const world=()=>api.getWorld(),save=()=>api.save();
  const plan=()=>habitatPlans[chapter?.id];

  function clearTravel(){
    arrival=null;following=null;followProgress=0;
    if(observation){cancelBehavior(actors.find(n=>n.id===observation.actorId));observation=null;}
    lastResult=null;
  }
  function setRouteTo(n){const path=findPath(api.getPlayer(),n,chapter);api.walkRoute(path);lastRoute=0;return path.length>0;}
  function closeDialog(){if(!dialog)return;dialog.close();dialog.remove();dialog=null;document.querySelector('#world-canvas')?.focus({preventScroll:true});}
  function record(n,kind='observe',photo=null){rememberSighting(world(),n,chapter,kind,photo);save();}
  function photograph(n=nearestActor(actors,api.getPlayer(),{range:145})){
    if(!n){api.notify('先走近一只生物，再按 F 拍游戏照片。');return;}
    const source=document.querySelector('#world-canvas'),photo=document.createElement('canvas');photo.width=200;photo.height=125;
    const ctx=photo.getContext('2d');ctx.imageSmoothingEnabled=true;
    try{const sx=Math.max(0,Math.min(source.width-180,n.x-90)),sy=Math.max(0,Math.min(source.height-115,n.y-85));ctx.drawImage(source,sx,sy,180,115,0,0,200,125);record(n,'photo',photo.toDataURL('image/png'));reactToPhoto(n);const flash=document.createElement('div');flash.className='camera-flash';document.querySelector('.world-viewport').append(flash);setTimeout(()=>flash.remove(),500);api.notify(`已拍下${n.name}；它抬头察看，照片已收进「发现」。`);if(dialog)renderCreature(n);}catch{api.notify('照片未保存，请靠近后再试。');}
  }
  function startFollow(n){closeDialog();clearTravel();following=n.id;targetId=n.id;lastRoute=0;api.notify('跟随观察已开始。保持靠近；移动可以取消。');}
  function startObservation(n,actionId){
    closeDialog();clearTravel();api.stopWalking();
    if(!beginBehavior(n,chapter,actionId,{observed:true}))return;
    observation={actorId:n.id,actionId};targetId=n.id;
    document.querySelector('#habitat-guide')?.classList.remove('open');
    api.notify(`开始观察${n.name}：${behaviors[actionId].label}。动作完成后才会写入习性记录。`);
  }
  function renderCreature(n){
    if(!dialog)return;
    const c=creatures[n.creatureId],recorded=world().sightings?.[c.id],resident=residentFor(chapter.id,c.id),action=behaviors[resident.action],done=hasSceneBehavior(world(),chapter.id,c.id);
    dialog.innerHTML=`<header class="npc-dialog-head"><span class="npc-dialog-icon">◉</span><div><span class="pixel-eyebrow">${esc(chapter.name)} / 本区重点生物</span><h2>${esc(c.name)}</h2><small>${esc(c.scientificName)}</small></div><button data-npc-action="close" aria-label="关闭生物观察">×</button></header><div class="npc-dialog-body"><span class="npc-behavior">${esc(behaviorText(n))} · 行为模拟</span><p class="behavior-goal">本次看什么：${esc(resident.goal)}</p><p class="npc-observation-note">选择下方习性观察后，面板会关闭。回到场景看动作，完成后自动记下本次过程。</p><div class="npc-achievements"><span class="${recorded?.observed?'has':''}">${recorded?.observed?'✓':'○'} 外观</span><span class="${done?'has':''}">${done?'✓':'○'} 本区习性</span><span class="${recorded?.photo?'has':''}">${recorded?.photo?'✓':'○'} 照片</span></div><div class="npc-actions"><button class="pixel-button light behavior-start" data-behavior-action="${resident.action}">${done?'播放动画：'+action.label:action.button} →</button><button class="pixel-button" data-npc-action="record">记录外观 ✦</button><button class="pixel-button" data-npc-action="photo">拍张游戏照片 <kbd>F</kbd></button><button class="pixel-button" data-npc-action="read">翻阅结构与资料 ↗</button><button class="pixel-button light" data-npc-action="observe">开始观察 · 进入考察手册 →</button></div></div>`;
  }
  function openActor(n){
    if(!n||dialog)return;
    
    clearTravel();targetId=n.id;api.stopWalking();dialog=api.makeDialog('npc-dialog','观察'+n.name);
    dialog.addEventListener('cancel',ev=>{ev.preventDefault();closeDialog();});
    dialog.addEventListener('click',async ev=>{
      const behavior=ev.target.closest('[data-behavior-action]');if(behavior){startObservation(n,behavior.dataset.behaviorAction);return;}
      const b=ev.target.closest('[data-npc-action]');if(!b||b.disabled)return;
      const action=b.dataset.npcAction;
      if(action==='close')closeDialog();
      if(action==='record'){record(n);renderCreature(n);api.notify('外观已记下。要记录习性，请选择上方动作观察。');}
      if(action==='photo')photograph(n);
      if(action==='follow')startFollow(n);
      if(action==='observe'){closeDialog();api.openInvestigation(n.creatureId);return;}
      if(action==='battle'){const unlocked=(window.game?.services?.getState().unlockedCreatureIds)||[];if(!unlocked.includes(n.creatureId)){api.notify('先在考察手册完成本区调查，解锁这只生物后再来对战。');return;}closeDialog();if(window.openTeamBattle)window.openTeamBattle({creatureId:n.creatureId,sceneId:chapter.id,eraId:chapter.eraId});else api.notify('对战模块尚未加载。');}
      if(action==='read')await api.C.openKnowledge({knowledgeId:creatures[n.creatureId].knowledgeId,source:'wildlife'});
    });
    renderCreature(n);dialog.showModal();
  }
  function approach(id){
    if(api.isPaused())return;
    const n=actors.find(n=>n.id===id);if(!n)return;
    
    clearTravel();targetId=id;document.querySelector('#habitat-guide')?.classList.remove('open');
    if(distance(n,api.getPlayer())<100){openActor(n);return;}
    arrival=id;setRouteTo(n);api.notify('沿标记路线走近'+n.name+'……');
  }
  function enterScene(c){
    closeDialog();clearTravel();chapter=c;actors=createActors(c);targetId=actors[0]?.id;
    const viewport=document.querySelector('.world-viewport'),layer=document.createElement('div');layer.className='npc-layer';
    layer.innerHTML=actors.map(n=>`<button class="npc-marker creature" data-npc="${n.id}" aria-label="观察 ${esc(n.name)}"><span class="npc-target-ring"></span><span class="npc-activity"></span><span class="npc-name">${esc(n.name.replace('三叶虫 Olenoides serratus','三叶虫'))}</span></button>`).join('');
    layer.addEventListener('click',ev=>{const b=ev.target.closest('[data-npc]');if(b)approach(b.dataset.npc);});viewport.append(layer);
    const actions=document.createElement('div');actions.className='field-actions';actions.innerHTML='<button data-field="photo" aria-label="给附近生物拍游戏照片">▣ <span>拍照</span><kbd>F</kbd></button><button data-field="journal" aria-label="查看自由探索发现">◉ <span>发现</span></button>';viewport.append(actions);
    const follow=document.createElement('div');follow.className='follow-status';follow.id='follow-status';viewport.append(follow);
    const watch=document.createElement('section');watch.className='behavior-watch';watch.id='behavior-watch';watch.setAttribute('aria-live','polite');viewport.append(watch);
    const pointer=document.createElement('button');pointer.className='habitat-pointer';pointer.id='habitat-pointer';pointer.setAttribute('aria-label','寻找当前观察目标');viewport.append(pointer);
    viewport.addEventListener('click',ev=>{
      const locate=ev.target.closest('[data-locate]');if(locate){approach(locate.dataset.locate);return;}
      if(ev.target.closest('#habitat-pointer')){approach(targetId);return;}
      if(ev.target.closest('[data-observation-photo]')){photograph(actors.find(n=>n.id===observation?.actorId));return;}
      if(ev.target.closest('[data-observation-cancel]')){clearTravel();api.stopWalking();api.notify('本次习性观察已取消，不写入未完成记录。');return;}
      if(ev.target.closest('[data-observation-journal]')){lastResult=null;api.openBook('quests',chapter.eraId);return;}
      const b=ev.target.closest('[data-field]');if(!b||api.isPaused())return;
      if(b.dataset.field==='photo')photograph();
      else if(b.dataset.field==='journal')api.openBook('quests',chapter.eraId);
      
    });
    
  }
  function updateWatch(){
    const el=document.querySelector('#behavior-watch');if(!el)return;
    el.classList.toggle('visible',!!observation||!!lastResult);
    if(observation){const n=actors.find(n=>n.id===observation.actorId),a=n?.activity;if(!a)return;const definition=behaviors[observation.actionId],perform=a.stage==='perform',progress=perform?Math.min(1,a.elapsed/a.duration):0;
      if(el.dataset.mode!=='watch'){el.dataset.mode='watch';el.innerHTML='<header><span class="watch-title"></span><button data-observation-photo aria-label="拍下正在发生的动作">▣</button><button data-observation-cancel aria-label="取消本次观察">×</button></header><strong class="watch-stage"></strong><div class="watch-track"><i></i></div><p class="watch-description"></p><small>看完动作后记录 · 手动移动可取消</small>';}
      el.querySelector('.watch-title').textContent=n.name+' · '+definition.label;
      el.querySelector('.watch-stage').textContent=perform?'正在观察动作 '+Math.ceil(a.elapsed)+' / '+a.duration+' 秒':'正在靠近'+(a.resource?.label||'观察位置')+'……';
      el.querySelector('.watch-track i').style.width=progress*100+'%';
      el.querySelector('.watch-description').textContent=residentFor(chapter.id,n.creatureId).goal;
    }else if(lastResult&&el.dataset.mode!=='result'){
      el.dataset.mode='result';el.innerHTML=`<header><span>✓ 习性记录已写入</span><button data-observation-cancel aria-label="关闭观察结果">×</button></header><strong>${esc(lastResult.name)} · ${esc(behaviors[lastResult.actionId].label)}</strong><p>${esc(behaviors[lastResult.actionId].summary)}</p><button class="watch-journal" data-observation-journal>翻看观察手册 →</button><small>本次所见为游戏行为模拟</small>`;
    }
  }
  function updateAndDraw(ctx,time,delta,camera){
    if(!chapter)return;
    const pause=api.isPaused(),p=api.getPlayer();
    if(!pause){
      const finished=tickActors(actors,chapter,delta);
      for(const event of finished)if(observation?.actorId===event.actor.id&&observation.actionId===event.actionId){
        rememberBehavior(world(),event.actor,chapter,event.actionId);save();lastResult=null;observation=null;api.notify('观察完成，正在打开观察手册…');setTimeout(()=>{try{api.openInvestigation();}catch(e){try{api.openBook('quests',chapter.eraId);}catch(e2){}}},420);
      }
      lastRoute+=delta;
      const n=actors.find(n=>n.id===(arrival||following));
      if(n&&arrival){if(distance(p,n)<95){arrival=null;api.notify('已靠近 '+n.name+'，按 E 或点它开始观察');}else if(lastRoute>.8||!api.getRoute().length){setRouteTo(n);lastRoute=0;}}
      if(n&&following){if(distance(p,n)<130)followProgress+=delta;if(distance(p,n)>62&&(lastRoute>.7||!api.getRoute().length)){setRouteTo(n);lastRoute=0;}if(followProgress>=FOLLOW_SECONDS){record(n,'follow');following=null;api.stopWalking();api.notify('跟随移动记录完成；习性动作可在生物面板单独观察。');}}
    }
    updateWatch();
    const nearby=nearestActor(actors,p),followBox=document.querySelector('#follow-status');
    if(followBox){followBox.classList.toggle('visible',!!following);if(following){const n=actors.find(n=>n.id===following);followBox.innerHTML=`跟随移动 · ${esc(n?.name)}<div><i style="width:${Math.min(100,followProgress/FOLLOW_SECONDS*100)}%"></i></div><small>${Math.min(FOLLOW_SECONDS,Math.floor(followProgress))} / ${FOLLOW_SECONDS} 秒 · 移动可取消</small>`;}}
    drawHabitatResources(ctx,plan(),time,actors);
    for(const n of [...actors].sort((a,b)=>a.y-b.y)){
      drawActor(ctx,n,time,n.id===nearby?.id||n.id===targetId||n.id===observation?.actorId);
      const el=document.querySelector(`[data-npc="${n.id}"]`);if(el){el.style.left=(n.x/960*camera.width-camera.offset)+'px';el.style.top=(n.y/540*camera.height)+'px';el.classList.toggle('nearby',nearby?.id===n.id);el.classList.toggle('known',!!world().sightings?.[n.creatureId]);el.classList.toggle('observing',n.id===observation?.actorId);const text=el.querySelector('.npc-activity');text.textContent=n.activity?behaviorText(n):'';}
    }
    const target=actors.find(n=>n.id===targetId),pointer=document.querySelector('#habitat-pointer');
    if(pointer&&target){const x=target.x/960*camera.width-camera.offset,off=x<45||x>document.querySelector('.world-viewport').clientWidth-45;pointer.classList.toggle('visible',off&&!pause&&!observation);pointer.textContent=(x<45?'← ':'→ ')+target.name;pointer.style.left=x<45?'8px':'auto';pointer.style.right=x<45?'auto':'8px';}
  }
  function nearest(){return nearestActor(actors,api.getPlayer());}
  function recordCreature(id){const n=actors.find(n=>n.creatureId===id);if(n)record(n);}
  function watchCreature(id){const n=actors.find(n=>n.creatureId===id);if(!n)return;startObservation(n,residentFor(chapter.id,id).action);}
  function journal(eraId){
    const records=Object.values(world().sightings||{}).filter(r=>creatures[r.creatureId]?.eraId===eraId),habitCount=records.reduce((sum,r)=>sum+(r.behaviorRecords?.length||0),0);
    return `<span class="ink-kicker">我的野外发现 / 可见过程</span><h2>记下它做了什么。</h2><p class="book-intro">遇见 ${records.length} 种生物 · ${habitCount} 条习性观察 · ${records.filter(r=>r.photo).length} 张游戏照片</p>${records.length?`<div class="discovery-grid">${records.map(r=>{const c=creatures[r.creatureId],photo=typeof r.photo==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(r.photo)?r.photo:null;return `<article class="discovery-card">${photo?`<img src="${esc(photo)}" alt="${esc(c.name)}的游戏观察截图">`:'<div class="no-photo">◉<small>按 F 留下游戏照片</small></div>'}<h3>${esc(c.name)}</h3><small>✓ 外观${r.followed?' · 已跟随移动':''}${photo?' · 已拍照':''}</small>${r.behaviorRecords?.length?`<ul class="habit-records">${r.behaviorRecords.map(b=>`<li><strong>✓ ${esc(b.label)} · ${esc(chapterById[b.sceneId]?.name||b.sceneId)}</strong><p>${esc(b.summary)}</p></li>`).join('')}</ul>`:'<p>还没有习性过程记录。回到场景，选择动作观察。</p>'}<p>${r.sceneIds.map(id=>esc(chapterById[id]?.name||id)).join('、')}</p><button class="ink-button" data-book-read="${c.knowledgeId}">阅读结构与资料 ↗</button></article>`;}).join('')}</div>`:'<div class="empty-paper">◉<p>点击生物，或打开当前考察页。<br>选择“回场景看动作”，<br>看完后会自动记下过程。</p></div>'}<p class="book-small">照片与动作是游戏复原；食性和结构判断仍需结合资料中的证据。</p>`;
  }
  return {enterScene,updateAndDraw,approach,openActor,nearest,photograph,journal,clearTravel,recordCreature,watchCreature,
    get actors(){return actors.map(n=>({id:n.id,creatureId:n.creatureId,kind:n.kind,name:n.name,x:n.x,y:n.y,behavior:n.behavior,moving:n.moving,pose:{...n.pose},activity:n.activity?{id:n.activity.id,stage:n.activity.stage,elapsed:n.activity.elapsed,duration:n.activity.duration}:null,reaction:n.reaction}));},
    get focus(){return observation?actors.find(n=>n.id===observation.actorId):null;},
    get observation(){return observation?{...observation}:null;},get following(){return following;},get progress(){return followProgress;}
  };
}
