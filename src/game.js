import {tutorialMarkup, eraSummaryMarkup} from './learning-content.js?v20261029k';
import {C} from './module.js?v20261029k';
import {createExploration} from './exploration.js?v20261029k'; // V3 exploration installed
import {createMockServices} from './core.js?v20261029k';
import {quests,questById,creatures,knowledge,eras,ecologyLinks,resourceNodes} from './data.js?v20261029k';
import {illustrations} from './illustrations.js?v20261029k';
import {albumArt} from './album-art.js?v20261029k';
import {habitatPlans} from './habitats.js?v20261029k'; // V5 habitat observations
import {diagrams} from './art.js?v20261029k';
import {chapters,chapterById,isChapterUnlocked,nextChapter,movePlayer,findPath,canStand,loadWorld,saveWorld,bookIcon} from './world.js?v20261029k';
import {drawDiver,drawLand} from './game-art.js?v20261029k';
const app=document.querySelector('#app'),services=createMockServices(),world=loadWorld();
world.mode??='story';world.sightings??={};
services.getKnowledge=id=>knowledge[id];services.openKnowledge=args=>C.openKnowledge(args);C.mount(document.querySelector('#c-root'),services);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escape,keys=new Set(),images=new Map();let view='title',scene=null,player={x:210,y:365},route=[],pendingInteraction=false,book=null,overlay=null,investigating=false,animation=0,lastFrame=0,lastSave=0,motion=false;
for(const c of chapters.filter(c=>c.background)){const im=new Image();im.src=c.background;images.set(c.id,im);}
const state=()=>services.getState(),completed=id=>state().completedQuestIds.includes(id),level=()=>state().completedQuestIds.length;
const exploration=createExploration({isGuided:()=>world.mode==='story',openInvestigation:id=>startInvestigation('scene',id),getWorld:()=>world,getPlayer:()=>player,getRoute:()=>route,save:()=>saveWorld(world),isPaused:paused,notify:toast,makeDialog,C,openBook,walkRoute:path=>{route=path;pendingInteraction=false;keys.clear();},stopWalking:()=>{route=[];pendingInteraction=false;keys.clear();}});
const canVisit=index=>world.mode==='free'||isChapterUnlocked(index,state());
function toast(message){const el=document.querySelector('#game-toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4200);}
function persistPosition(){if(!scene)return;world.positions[scene.id]={x:player.x,y:player.y};world.lastChapter=scene.id;saveWorld(world);}
function header(backLabel='时间地图'){return `<header class="game-header"><div class="game-brand"><span class="brand-sigil">✦</span><div>史前博物大冒险<small>FIELD NOTES FROM DEEP TIME</small></div></div><div class="game-header-end"><span class="rank-tag">${level()<3?'见习调查员':level()<6?'生态探索者':'资深记录者'} <b>LV.${level()+1}</b></span><button class="book-toggle" data-action="book" aria-label="打开考察手册">${bookIcon()}<span>考察手册</span>${level()?`<i>${level()}</i>`:''}</button></div></header>`;}
function renderTitle(){view='title';app.innerHTML=`${header()}<main class="title-scene"><div class="ocean-backdrop"></div><div class="title-vignette"></div><div class="title-content"><span class="pixel-eyebrow">一册写给远古世界的考察手记</span><h1>史前博物大冒险</h1><p class="title-english">FIELD NOTES FROM DEEP TIME</p><div class="title-rule">✧</div><p class="title-poem">潮汐退去，古老海床留下痕迹。<br>带上好奇，去寻找生命的线索。</p><button class="pixel-button light large" data-action="begin">${level()?'继续考察旅程':'开始考察旅程'} <span>→</span></button><button class="quiet-button" data-action="free-start">自由漫游世界 ↗</button><button class="quiet-button" data-action="timeline">展开时间地图</button><span class="title-save">无需登录 · 进度自动保存在本机</span></div><span class="scene-version">CAMBRIAN → LATE JURASSIC / 01—06</span><span class="title-corner">观察 · 阅读 · 用证据发现</span></main>`;}
/* 交接注释 V8
 * 首次三卡教学。tutorialMarkup提供图文；tutorialSeen单独保存在世界存档。
 * 只在首次开始主线展示；结束后进入nextChapter选出的未完成场景。
 * 交接注释结束 */
function showTutorial(onStart=()=>{}) {
  if(overlay)return;
  overlay=makeDialog('lesson-dialog tutorial-dialog','三步操作说明');
  overlay.innerHTML=tutorialMarkup();
  const finish=()=>{overlay.close();overlay.remove();overlay=null;world.tutorialSeen=true;saveWorld(world);onStart();};
  overlay.addEventListener('cancel',ev=>{ev.preventDefault();finish();});
  overlay.querySelector('[data-tutorial-start]').addEventListener('click',finish);
  overlay.showModal();overlay.querySelector('h2').tabIndex=-1;overlay.querySelector('h2').focus({preventScroll:true});overlay.scrollTop=0;
}

/* 每张地图进入前先展示手册开场页：本区问题 + 开始观察 */
function showLessonIntro(chapter, onStart){
  const q = questById[chapter.questId];
  const host = document.querySelector('#game-overlays');
  const wrap = document.createElement('div');
  wrap.className = 'lesson-intro-overlay';
  wrap.innerHTML =
    '<div class="lesson-intro-page">' +
      '<span class="pixel-eyebrow">' + (chapter.eraId === 'cambrian' ? '寒武纪海洋' : '侏罗纪晚期陆地') + ' / 第 ' + (chapter.index + 1) + ' 站</span>' +
      '<h1>' + chapter.name + '</h1>' +
      '<p class="lesson-sub">' + (chapter.subtitle || '') + '</p>' +
      '<div class="lesson-question"><span>本次要弄明白</span><strong>' + (q ? q.title : '') + '</strong></div>' +
      '<ul class="lesson-steps">' +
        '<li><b>1</b> 观察环境：看看这里的海床、水层与生物</li>' +
        '<li><b>2</b> 观察生物：走近动物，看清它的结构与动作</li>' +
        '<li><b>3</b> 回答问题：把看到的信息用起来</li>' +
      '</ul>' +
      '<button class="pixel-button light large lesson-start" data-lesson-start>开始观察 <span>→</span></button>' +
      '<small class="lesson-hint">进入地图后自由移动，走近生物按 E 观察</small>' +
    '</div>';
  host.appendChild(wrap);
  const go = function () { wrap.remove(); onStart(); };
  wrap.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-lesson-start]')) go();
  });
}

function enterChapterWithIntro(id){
  const ch = chapterById[id];
  if(!ch){ renderScene(id); return; }
  showLessonIntro(ch, ()=>renderScene(id));
}

function beginJourney(){world.mode='story';saveWorld(world);const begin=()=>enterChapterWithIntro(nextChapter(state()).id);world.tutorialSeen?begin():showTutorial(begin);}

function renderTimeline(){exploration.clearTravel();view='timeline';persistPosition();scene=null;route=[];keys.clear();const current=world.mode==='free'?(chapterById[world.lastChapter]||chapters[0]):nextChapter(state()),done=level();app.innerHTML=`${header()}<main class="time-map"><div class="map-header"><div><span class="pixel-eyebrow">THE DEEP TIME TRAIL</span><h1>${world.mode==='free'?'世界很大，随心走走。':'沿着时间，寻找生命。'}</h1><p>${world.mode==='free'?'每个区域都有不同的生物，点击即可观察、阅读或拍照。':'每一个发现，都会点亮下一段旅程。'}</p></div><div class="journey-count"><strong>${String(done).padStart(2,'0')}</strong><span>/ 06<br>考察站已记录</span></div></div><div class="exploration-mode-switch" aria-label="游玩模式"><button data-mode="free" aria-pressed="${world.mode==='free'}">◉ 自由探索 <small>六个区域随心前往</small></button><button data-mode="story" aria-pressed="${world.mode!=='free'}">✦ 调查主线 <small>沿着证据逐站解锁</small></button></div><section class="parchment-map" aria-label="六个考察区域"><div class="map-texture"></div><svg class="trail-lines" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true"><path class="trail-shadow" d="M168 396C70 290 230 230 360 204S450 290 540 402S650 290 732 210S830 240 912 390S1040 320 1080 186"/><path class="trail-dashes" d="M168 396C70 290 230 230 360 204S450 290 540 402S650 290 732 210S830 240 912 390S1040 320 1080 186"/></svg><div class="era-inscription cambrian"><span>CHAPTER I</span><strong>寒武纪海洋</strong><small>约 5.05 亿年前</small></div><div class="era-inscription jurassic"><span>CHAPTER II</span><strong>侏罗纪晚期</strong><small>约 1.5 亿年前</small></div>${chapters.map((c,i)=>{const unlocked=canVisit(i),done=completed(c.questId),active=current.id===c.id;return `<button class="map-stop ${done?'complete':unlocked?'available':'locked'} ${active?'current':''}" data-enter="${c.id}" style="--stop-x:${c.x}%;--stop-y:${c.y}%" ${unlocked?'':'disabled'} aria-label="第 ${i+1} 站 ${c.name}${done?' 已完成':unlocked?' 可进入':' 完成上一站后解锁'}"><span class="stop-illustration"><img src="assets/scene-thumbnails/${c.id}-v4.webp" alt="${e(c.name)}地貌预览" loading="eager"></span><span class="stop-orb">${done?'✓':unlocked?i+1:'⌑'}</span><span class="stop-name">${c.name}</span><small>${world.mode==='free'?habitatPlans[c.id].residents.map(r=>creatures[r.id].name.replace('三叶虫 Olenoides serratus','三叶虫')).join(' · '):done?'已留下发现':unlocked?'进入考察 →':'等待前一站点亮'}</small></button>`;}).join('')}<div class="compass-rose"><span>N</span><i>✧</i></div><div class="map-legend"><span>● 已开放</span><span>✓ 已记录</span><span>⌑ 尚未抵达</span></div><span class="map-time-arrow">更古老 ← 时间向前 → 更接近今天</span></section><footer class="timeline-footer"><button class="pixel-button light" data-enter="${current.id}">${done===6?'重访最后一站':'继续旅程'} <span>→</span></button><p>${world.mode==='free'?'不必完成主线，也能自由走进每一个区域。':'完成观察与证据判断，再前往下一站。'}<small>${world.mode==='free'?'点击生物观察 · 随时打开手册 · F 拍照':'两个可游玩的时期 · 六个相连的考察区域'}</small></p><button class="quiet-button" data-action="help">操作说明 ?</button></footer></main>`;}
/* 交接注释 V8
 * 主线场景入口。story模式且本关未完成时自动打开考察页，删除了找信标交卷步骤。
 * 自由模式保留六区访问；地图生物和当前问题通过exploration与journey-dock联动。
 * 交接注释结束 */
function renderScene(id,{autoOpen=false}={}) {
  const chapter=chapterById[id];
  if(!chapter||!canVisit(chapter.index)){toast('请先完成前一站的考察。');return;}
  exploration.clearTravel();persistPosition();view='scene';scene=chapter;services.setEra(chapter.eraId);
  player={...(world.positions[id]||chapter.spawn)};if(!canStand(player,chapter))player={...chapter.spawn};
  route=[];pendingInteraction=false;keys.clear();world.lastChapter=id;saveWorld(world);
  app.innerHTML=`<main class="scene-game"><header class="scene-topbar"><div class="scene-heading"><button class="pixel-button back-button" data-action="timeline">← 时间地图</button><div><span>${chapter.time}</span><h1>${chapter.name}</h1></div></div><div class="scene-top-controls"><button class="book-toggle" data-action="library" aria-label="翻阅已收集的手册资料">${bookIcon()}<span>资料收藏</span></button><button class="fullscreen-button" data-action="fullscreen" aria-label="切换全屏">⛶</button></div></header><section class="world-viewport" aria-label="${chapter.name} 可探索游戏场景"><canvas id="world-canvas" width="960" height="540" tabindex="0" aria-label="点击生物直接观察；WASD移动，J打开当前考察页"></canvas><div class="scene-grain" aria-hidden="true"></div><span class="world-region-label">${eras[chapter.eraId].name} / ${chapter.name}</span><span class="world-status" id="world-status"></span><div class="interaction-prompt" id="interaction-prompt"><kbd>E</kbd><span>观察生物</span><button data-action="interact">观察 →</button></div><div class="world-control-hint">点击动物直接观察 · 手册 <kbd>J</kbd><small>WASD / 方向键移动 · F 拍照</small></div><div class="touch-pad" aria-label="移动方向"><button data-move="ArrowUp" aria-label="向上移动">▲</button><button data-move="ArrowLeft" aria-label="向左移动">◀</button><button data-move="ArrowDown" aria-label="向下移动">▼</button><button data-move="ArrowRight" aria-label="向右移动">▶</button></div></section><section class="journey-dock" aria-label="当前考察手册"><div><small id="journey-stage"></small><strong id="objective-text"></strong><small class="dock-steps">环境 → 观察与比较 → 回答问题 → 资料卡 → 下一站</small></div><button data-action="continue-lesson" id="journey-continue"></button></section><footer class="scene-footer"><span>点击生物或打开手册即可继续</span><span>环境与动作均为复原演示</span></footer></main>`;
  exploration.enterScene(scene);
  const canvas=document.querySelector('#world-canvas');
  canvas.addEventListener('pointerdown',ev=>{if(paused())return;exploration.clearTravel();const r=canvas.getBoundingClientRect(),point={x:(ev.clientX-r.left)/r.width*960,y:(ev.clientY-r.top)/r.height*540};route=findPath(player,point,scene);canvas.focus({preventScroll:true});});
  updateHud();canvas.focus({preventScroll:true});lastFrame=performance.now();if(!animation)animation=requestAnimationFrame(frame);

}

/* 交接注释 V8
 * 固定手册入口。由当前任务进度计算阶段和按钮文字，避免玩家不知道下一步。
 * environmentReviewed/observed/stage决定“先环境—观察—答题—资料卡”；这里只展示状态，不发奖励。
 * 交接注释结束 */
function updateHud(){
  if(!scene||view!=='scene'||!document.querySelector('#world-status'))return;
  const q=questById[scene.questId],done=completed(q.id),progress=state().questProgress[q.id];
  const remaining=q.completionConditions.requiredEvidence.filter(id=>!progress?.observed?.includes(id)).length;
  document.querySelector('#world-status').textContent=done?'✓ 本区考察完成':'考察手册 · 随时继续';
  document.querySelector('#objective-text').textContent=q.question;
  const unlocked=isChapterUnlocked(scene.index,state());
  document.querySelector('#journey-stage').textContent=done?'考察已记录':!unlocked?'自由漫游 / 主线需从上一站继续':progress?.stage==='result'?'判断已通过 / 阅读资料卡':progress?.stage==='judge'||remaining===0?'信息已收集 / 回答问题':progress?.environmentReviewed?'观察与比较 / 圈注信息自动保存':'本次考察 / 先认识环境';
  document.querySelector('#journey-continue').textContent=done?(scene.index===2||scene.index===5?'查看时期总结 →':'前往下一场景 →'):!unlocked?'返回主线考察 →':remaining===0?'手册回答 →':'先走近生物观察 →';
  
}

/* 交接注释 V8
 * 模态与输入边界。调查或dialog打开时暂停地图；动作HUD非模态时仍推进世界。
 * 不要用“弹窗存在”当调查完成，也不要让阅读面板关闭后残留移动按键。
 * 交接注释结束 */
function paused(){return investigating||!!document.querySelector('dialog[open]')||view!=='scene';}
function frame(time){animation=requestAnimationFrame(frame);const delta=Math.min((time-lastFrame)/1000,.05);lastFrame=time;if(view!=='scene'||!scene)return;const ctx=document.querySelector('#world-canvas')?.getContext('2d');if(!ctx)return;const viewport=document.querySelector('.world-viewport'),canvas=ctx.canvas,vw=viewport.clientWidth,vh=viewport.clientHeight,portrait=vw/vh<1.1;const focus=exploration.focus||player;const cw=portrait?vh*16/9:vw,camera=portrait?Math.max(0,Math.min(cw-vw,focus.x/960*cw-vw/2)):0;canvas.style.width=cw+'px';canvas.style.height=vh+'px';canvas.style.left='0px';canvas.style.transform=`translateX(${-camera}px)`;ctx.imageSmoothingEnabled=false;const backdrop=images.get(scene.id);if(scene.eraId==='cambrian'||backdrop?.complete&&backdrop.naturalWidth){ctx.fillStyle='#143e4e';ctx.fillRect(0,0,960,540);if(backdrop?.complete&&backdrop.naturalWidth)ctx.drawImage(backdrop,0,0,960,540);ctx.fillStyle='#082c3830';ctx.fillRect(0,0,960,540);}else drawLand(ctx,scene);
motion=false;if(!paused()){let dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),dy=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);if(dx||dy){exploration.clearTravel();route=[];pendingInteraction=false;const length=Math.hypot(dx,dy);player=movePlayer(player,{x:dx/length*145*delta,y:dy/length*145*delta},scene);motion=true;}else if(route.length){const target=route[0],dist=Math.hypot(target.x-player.x,target.y-player.y);if(dist<4)route.shift();else{const step=Math.min(dist,145*delta),next=movePlayer(player,{x:(target.x-player.x)/dist*step,y:(target.y-player.y)/dist*step},scene);motion=Math.hypot(next.x-player.x,next.y-player.y)>.1;if(!motion)route=[];player=next;}}if(time-lastSave>1500){persistPosition();lastSave=time;}}
if(route.length&&!paused()){ctx.fillStyle='#d2e4b055';for(let i=0;i<route.length;i+=2)ctx.fillRect(route[i].x-2,route[i].y-2,4,4);}exploration.updateAndDraw(ctx,time,delta,{width:cw,offset:camera,height:vh});drawDiver(ctx,player,time,scene.eraId!=='cambrian',motion);ctx.save();ctx.font='10px "Deep Time Pixel",monospace';ctx.textAlign='center';ctx.fillStyle='#e1e3b7';ctx.fillText('观察员 · 你',player.x,player.y+25);ctx.restore();const prompt=document.querySelector('#interaction-prompt');if(prompt){const target=exploration.nearest();prompt.classList.toggle('visible',!!target&&!paused());prompt.querySelector('span').textContent=target?('观察 '+target.name):'打开手册继续观察';}}
function interactNearby(){if(paused()||!scene)return;const n=exploration.nearest();if(n)exploration.openActor(n);else startInvestigation('scene');}

function makeDialog(className,label){const d=document.createElement('dialog');d.className=className;d.setAttribute('aria-label',label);document.querySelector('#game-overlays').append(d);keys.clear();route=[];return d;}
function closeBook(){if(!book)return;book.close();book.remove();book=null;document.querySelector('[data-action="book"]')?.focus({preventScroll:true});}
function illustration(id){const painting=albumArt[id];if(painting)return `<div class="book-illustration album-painting"><img src="${e(painting.url)}" alt="${e(painting.label)}"></div>`;const art=illustrations[id];return art?`<div class="book-illustration"><img src="${art.url}" alt="${e(art.label)}"></div>`:`<div class="book-illustration schematic">${diagrams[id]||''}<small>结构示意</small></div>`;}
function openBook(tab='quests',eraId=scene?.eraId||world.bookEra||'cambrian'){if(book)closeBook();if(investigating||overlay)return;world.bookEra=eraId;saveWorld(world);book=makeDialog('field-book','考察手册');book.addEventListener('cancel',ev=>{ev.preventDefault();closeBook();});let pageIndex=0;const render=()=>{const s=state(),eraChapters=chapters.filter(c=>c.eraId===eraId),line=quests.filter(q=>q.eraId===eraId),notes=s.notebookEntries.filter(n=>questById[n.questId]?.eraId===eraId),activeQ=scene&&scene.eraId===eraId?questById[scene.questId]:line.find(q=>!completed(q.id))||line[0],activeCreature=activeQ.creatureIds[0],links=ecologyLinks.filter(l=>s.ecologyLinkIds.includes(l.id)&&line.some(q=>q.ecologyLinkIds.includes(l.id))),pages=tab==='archive'?Object.values(creatures).filter(c=>c.eraId===eraId):tab==='notes'?notes:tab==='ecology'?links:line,selected=pages[Math.min(pageIndex,Math.max(0,pages.length-1))];pageIndex=Math.min(pageIndex,Math.max(0,pages.length-1));const leftId=tab==='archive'?selected?.id:tab==='notes'?selected?.creatureIds[0]:activeCreature;
let right='';if(tab==='quests'){right=`<span class="ink-kicker">本次考察 / ${eraChapters.filter(c=>completed(c.questId)).length} / 3</span><h2>带着问题出发</h2><p class="book-intro">把你找到的线索，慢慢写进这本手册。</p><div class="book-quest-list">${line.map(q=>{const chapter=chapters.find(c=>c.questId===q.id),unlocked=isChapterUnlocked(chapterById[chapter.id].index,s),done=completed(q.id),observed=s.questProgress[q.id]?.observed?.length||0;return `<article class="book-quest ${done?'done':''}"><span class="quest-number">${chapterById[chapter.id].index+1<10?'0':''}${chapterById[chapter.id].index+1}</span><div><small>${chapter.name} · ${done?'✓ 已记录':unlocked?'可调查':'未抵达'}</small><h3>${q.title}</h3><p>${q.question}</p>${unlocked?`<button class="ink-button" data-book-quest="${q.id}">${done?'回看证据':observed?'继续调查':'打开调查'} →</button>`:'<span class="ink-lock">⌑ 完成前一站后点亮</span>'}</div></article>`;}).join('')}</div>`;}else if(tab==='notes'){right=selected?`<span class="ink-kicker">调查笔记 / 已完成</span><h2>${e(questById[selected.questId].title)}</h2><p class="hand-note">${e(selected.summary)}</p><div class="ink-stamp">已归档</div><h3 class="book-section-title">我找到的依据</h3><ul class="evidence-notes">${selected.evidenceIds.map(id=>{const h=questById[selected.questId].observationHotspots.find(h=>h.evidenceId===id);return `<li><b>${e(h?.label)}</b><span>${e(h?.text)}</span></li>`;}).join('')}</ul><button class="ink-button" data-book-read="${selected.knowledgeId}">翻阅资料与来源 ↗</button>`:`<div class="empty-paper">✧<h2>这一页，等你写下。</h2><p>完成一次观察和判断，<br>你的证据与发现会自动记在这里。</p><button class="ink-button" data-book-tab="quests">去看调查任务 →</button></div>`;}else if(tab==='ecology'){right=selected?`<span class="ink-kicker">有依据的生态联系</span><h2>${e(selected.label)}</h2><div class="ink-ecology"><strong>${e(creatures[selected.from]?.name||resourceNodes[selected.from]||selected.from)}</strong><span>${selected.type==='defense_interpretation'?'⇢':selected.type==='structure_function'?'—':'→'}</span><strong>${e(creatures[selected.to]?.name||resourceNodes[selected.to]||selected.to)}</strong></div><p class="hand-note">${e(selected.description)}</p><div class="paper-note"><strong>线条也有不同含义</strong><p>→ 资源或食物来源<br>⇢ 可能的防御互动<br>— 结构与功能的联系</p></div><p class="book-small">这些关系保留证据中的不确定性；不代表固定天敌、必胜或完整生物圈。</p>`:`<div class="empty-paper">⌘<h2>生命之间，怎样相连？</h2><p>调查完成后，<br>带依据的生态联系会出现在这里。</p></div>`;}else if(tab==='discoveries'){right=exploration.journal(eraId);}else if(tab==='archive'){right=`<span class="ink-kicker">生物档案 / ${s.discoveredKnowledgeIds.includes(selected.knowledgeId)?'已发现':'尚待调查'}</span><h2>${e(selected.name)}</h2><p class="book-latin">${e(selected.scientificName)}</p><p class="hand-note">${e(selected.summary)}</p><dl class="creature-record"><dt>生活环境</dt><dd>${e(selected.environment)}</dd><dt>地域记录</dt><dd>${e(selected.region)}</dd><dt>需要留意</dt><dd>${e(selected.uncertainty)}</dd></dl><button class="ink-button" data-book-read="${selected.knowledgeId}">展开阅读与来源 ↗</button><p class="album-art-note"><a href="art-prompts.html#${selected.id}" target="_blank" rel="noopener">收集册写实插画 · 查看这只生物的创作提示词 ↗</a></p>`;}else{right=`<span class="ink-kicker">旅途中的小贴士</span><h2>怎样游玩</h2><div class="book-controls"><p><kbd>W A S D</kbd> 或方向键移动</p><p><kbd>E</kbd> 观察生物；没有附近目标时打开当前考察页</p><p><kbd>F</kbd> 给附近的生物拍游戏照片</p><p>先阅读环境提示，再点圈注收集信息、比较生物。答题后阅读资料卡，直接前往下一站。</p><p><kbd>J</kbd> 翻开考察手册</p><p>也可以点击地面，或使用屏幕方向键。</p><p>打开手册和调查时暂停；习性观察时场景持续活动。手动移动可取消未完成观察，已完成记录自动保存。</p></div><div class="book-utility"><button class="ink-button" data-book-action="timeline">展开时间地图 →</button><a class="ink-button" href="art-prompts.html" target="_blank" rel="noopener">收集册插画 · 10 条完整提示词 ↗</a><a class="ink-button" href="recordings.html" target="_blank" rel="noopener">查看流程录屏 ↗</a><button class="ink-button" data-book-action="export">导出我的考察记录 ↓</button><button class="ink-button subtle" data-book-action="reset">重新开始旅程</button></div>`;}
book.innerHTML=`<nav class="book-tabs" aria-label="手册书签">${[['quests','✦','任务'],['discoveries','◉','发现'],['notes','▤','笔记'],['ecology','⌘','关系'],['archive','◇','档案'],['settings','?','说明']].map(([id,icon,label])=>`<button data-book-tab="${id}" aria-pressed="${tab===id}"><span>${icon}</span>${label}</button>`).join('')}</nav><button class="book-close" data-book-action="close" aria-label="合上考察手册">×</button><button class="book-battle" data-book-action="battle">⚔ 模拟对战</button><div class="book-spread"><section class="book-page book-left"><span class="ink-kicker">FIELD NOTES / 考察手册</span><h1>${eras[eraId].name}</h1><div class="book-era-switch" role="group" aria-label="手册时期"><button data-book-era="cambrian" aria-pressed="${eraId==='cambrian'}">寒武纪</button><button data-book-era="jurassic_late" aria-pressed="${eraId==='jurassic_late'}">侏罗纪</button></div>${illustration(leftId)}<p class="book-left-caption">${e(creatures[leftId]?.name||'我的考察记录')}</p><div class="book-progress"><span>本站旅程</span><strong>${eraChapters.filter(c=>completed(c.questId)).length} / 3</strong></div><span class="page-number">${eraId==='cambrian'?'CAMBRIAN':'LATE JURASSIC'} / ${String(pageIndex*2+1).padStart(2,'0')}</span></section><section class="book-page book-right"><div class="book-era-switch book-mobile-era"><button data-book-era="cambrian" aria-pressed="${eraId==='cambrian'}">寒武纪</button><button data-book-era="jurassic_late" aria-pressed="${eraId==='jurassic_late'}">侏罗纪</button></div>${right}<footer class="book-pager"><button data-book-page="-1" aria-label="上一页" ${pageIndex===0||['quests','settings','discoveries'].includes(tab)?'disabled':''}>← 上一页</button><span>${tab==='quests'?'调查目录':tab==='settings'?'旅途指南':tab==='discoveries'?'自由发现':pages.length?`${pageIndex+1} / ${pages.length}`:'尚无记录'}</span><button data-book-page="1" aria-label="下一页" ${pageIndex>=pages.length-1||['quests','settings','discoveries'].includes(tab)?'disabled':''}>下一页 →</button></footer></section></div>`;};
book.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;if(b.dataset.bookTab){tab=b.dataset.bookTab;pageIndex=0;render();return;}if(b.dataset.bookEra){eraId=b.dataset.bookEra;world.bookEra=eraId;saveWorld(world);pageIndex=0;render();return;}if(b.dataset.bookPage){pageIndex+=Number(b.dataset.bookPage);render();return;}if(b.dataset.bookRead){await C.openKnowledge({knowledgeId:b.dataset.bookRead,source:'notebook'});return;}if(b.dataset.bookQuest){const q=questById[b.dataset.bookQuest],chapter=chapters.find(c=>c.questId===q.id);closeBook();if(scene?.id!==chapter.id)renderScene(chapter.id,{autoOpen:false});await startInvestigation('book');return;}const a=b.dataset.bookAction;if(a==='close')closeBook();if(a==='timeline'){closeBook();renderTimeline();}if(a==='export'){const blob=new Blob([JSON.stringify({...services.exportSnapshot(),exploration:world},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='考察记录.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}if(a==='reset'&&confirm('清除这台浏览器中的调查和旅程记录，重新开始？')){closeBook();services.reset();world.positions={};world.sightings={};world.guideRequests={};world.mode='story';world.lastChapter=null;world.introSeen=false;world.tutorialSeen=false;world.eraSummariesSeen={};exploration.clearTravel();saveWorld(world);scene=null;renderTitle();}});render();book.showModal();}
/* 交接注释 V8
 * 宿主集中调度调查。传入当前任务、场景、对象、返回点和动作回调。
 * 只有completed应用一次结果并推进章节；closed仅保留进度；watchCreatureId切回真实场景动作。
 * 交接注释结束 */
async function startInvestigation(from='scene',creatureId=null){
  if(investigating||!scene||overlay)return;
  if(!isChapterUnlocked(scene.index,state())){toast('返回主线考察，完成前一站后即可在这里答题。');return;}
  exploration.clearTravel();const chapter=scene,q=questById[chapter.questId];closeBook();keys.clear();route=[];persistPosition();investigating=true;
  let result;
  try {
    result=await C.openInvestigation({questId:q.id,sceneId:q.sceneId,creatureId:creatureId&&q.creatureIds.includes(creatureId)?creatureId:undefined,returnPoint:{sceneId:chapter.id,position:{...player}},watchCreatureIds:exploration.actors.map(n=>n.creatureId),onWatchBehavior:true,onObserve:id=>exploration.recordCreature(id)});
    if(result.status==='completed')services.applyInvestigationResult(result);
  } catch(error){toast(error.message);} finally{investigating=false;keys.clear();updateHud();}
  if(result?.status==='completed'){advanceChapter(chapter);showBattlePrompt(chapter);}
  else if(result?.watchCreatureId)exploration.watchCreature(result.watchCreatureId);
}

/* 交接注释 V8
 * 每个时期三站结束后展示总结和当代环境对照。
 * 这里使用learning-content.js的eraSummaryMarkup；确认后才切换下一世界或回时间地图。
 * 交接注释结束 */
function showEraSummary(chapter){
  if(overlay)return;
  overlay=makeDialog('lesson-dialog era-summary','时期总结 · '+eras[chapter.eraId].name);
  overlay.innerHTML=eraSummaryMarkup(chapter.eraId);
  const dismiss=()=>{overlay.close();overlay.remove();overlay=null;};
  overlay.addEventListener('cancel',ev=>{ev.preventDefault();dismiss();});
  overlay.querySelector('[data-era-next]').addEventListener('click',()=>{world.eraSummariesSeen??={};world.eraSummariesSeen[chapter.eraId]=true;saveWorld(world);dismiss();const next=chapters[chapter.index+1];next?renderScene(next.id):renderTimeline();});
  overlay.showModal();overlay.querySelector('h2').tabIndex=-1;overlay.querySelector('h2').focus({preventScroll:true});overlay.scrollTop=0;
}
/* 交接注释 V8
 * 取消“回原地图找提交点”。同一时期直接下一站，跨时期先总结。
 * 奖励已在startInvestigation中集中应用，此处不得再追加笔记或解锁。
 * 交接注释结束 */
function advanceChapter(chapter){
  const next=chapters[chapter.index+1];
  if(!next||next.eraId!==chapter.eraId)showEraSummary(chapter);
  else enterChapterWithIntro(next.id);
}
function continueLesson(){
  if(!scene||paused())return;
  if(!isChapterUnlocked(scene.index,state())){world.mode='story';saveWorld(world);renderScene(nextChapter(state()).id);return;}
  completed(scene.questId)?advanceChapter(scene):toast('先走近一只生物，按 E 观察后，再翻开手册答题。');
}

function tryExit(){continueLesson();}
app.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;if(b.dataset.mode){world.mode=b.dataset.mode==='free'?'free':'story';saveWorld(world);renderTimeline();return;}if(b.dataset.enter){enterChapterWithIntro(b.dataset.enter);return;}const a=b.dataset.action;if(a==='free-start'){world.mode='free';saveWorld(world);renderTimeline();}if(a==='begin')beginJourney();if(a==='timeline'){renderTimeline();}if(a==='book')openBook();if(a==='library')openBook('notes');if(a==='continue-lesson')continueLesson();if(a==='interact')interactNearby();if(a==='exit')tryExit();if(a==='help')showTutorial();if(a==='fullscreen'){if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>toast('可以使用浏览器的全屏模式。'));}});
document.addEventListener('keydown',ev=>{if(ev.target.matches('input,textarea,select'))return;if(document.querySelector('dialog[open]'))return;const key=ev.key.length===1?ev.key.toLowerCase():ev.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)&&view==='scene'){ev.preventDefault();keys.add(key);}if((key==='j'||key==='b')&&!ev.repeat){ev.preventDefault();if(scene)startInvestigation('scene');else openBook();}if(key==='e'&&!ev.repeat&&scene){ev.preventDefault();interactNearby();}if(key==='f'&&!ev.repeat&&scene){ev.preventDefault();exploration.photograph();}if(key==='Escape'&&view==='scene'){ev.preventDefault();renderTimeline();}});
document.addEventListener('keyup',ev=>keys.delete(ev.key.length===1?ev.key.toLowerCase():ev.key));window.addEventListener('blur',()=>{keys.clear();persistPosition();});document.addEventListener('visibilitychange',()=>{keys.clear();persistPosition();});window.addEventListener('pagehide',persistPosition);
document.addEventListener('pointerdown',ev=>{const b=ev.target.closest('[data-move]');if(b&&!paused()){ev.preventDefault();b.setPointerCapture(ev.pointerId);keys.add(b.dataset.move);exploration.clearTravel();route=[];}});for(const event of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(event,ev=>{const b=ev.target.closest?.('[data-move]');if(b)keys.delete(b.dataset.move);});
services.subscribe(()=>updateHud());window.C=C;window.game={services,exploration,get view(){return view;},get scene(){return scene;},get player(){return {...player};},get paused(){return paused();},get world(){return structuredClone(world);},openBook,openLesson:startInvestigation,showTutorial,showTimeline:renderTimeline,enterChapter:renderScene};
renderTitle();
