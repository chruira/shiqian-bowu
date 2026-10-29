import {creatures, eras, knowledge, questById} from './data.js?v20261029k';
import {resumeProgress, evaluate, buildResult} from './core.js?v20261029k';
import {observationFigure, observationHotspots} from './investigation-visuals.js?v20261029k';
import {albumArt} from './album-art.js?v20261029k';
import {environmentFor, environmentMarkup, behaviorFor, comparisonMarkup, relationMarkup, escapeText as e} from './learning-content.js?v20261029k';

/* 交接注释 V8
 * 局部放大采用同一观察图的SVG viewBox裁切；百分比坐标映射320×240。
 * 这是复原插画放大，不会产生额外科学证据或真实标本照片。
 * 交接注释结束 */
function detailFigure(id, hotspot) {
  const figure=observationFigure(id).match(/<svg[\s\S]*?<\/svg>/)?.[0] || '';
  const x=Math.max(0, Math.min(220, hotspot.x/100*320-50));
  const y=Math.max(0, Math.min(165, hotspot.y/100*240-37.5));
  return figure.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} 100 75"`);
}

/* 交接注释 V8
 * V7连续考察控制器。环境页由独立environment标志控制，stage仍是observe/judge/result。
 * 旧存档通过resumeProgress补缺省；有观察或已判定时不强制重播环境。
 * 交接注释结束 */
export async function openGuidedInvestigation({args, services, panel, log, openKnowledge, knowledgeBody}) {
  const q=services.getQuest?.(args.questId) || questById[args.questId];
  if(!q) throw new Error('未知任务编号：'+args.questId);
  if(args.creatureId && !q.creatureIds.includes(args.creatureId)) throw new Error('生物与任务不匹配');
  if(args.sceneId && args.sceneId!==q.sceneId) throw new Error('区域与任务不匹配');
  const p=panel(q.title, '考察手册 / '+eras[q.eraId].name);
  p.investigation=true;
  p.dialog.classList.add('guided-book');
  let progress=resumeProgress(services.getState().questProgress?.[q.id]);
  progress.observed=progress.observed.filter(id=>q.observationHotspots.some(h=>h.evidenceId===id));
  progress.judgmentPassed=progress.judgmentPassed && evaluate(q, progress).ok;
  if(progress.stage==='result' && !progress.judgmentPassed) progress.stage='observe';
  let environment=!(progress.environmentReviewed || progress.observed.length || progress.judgmentPassed);
  let activeCreature=args.creatureId || q.creatureIds.find(id=>q.observationHotspots.some(h=>h.creatureId===id && q.completionConditions.requiredEvidence.includes(h.evidenceId) && !progress.observed.includes(h.evidenceId))) || q.creatureIds[0];
  let message='';
  const save=()=>services.dispatch({type:'INVESTIGATION_PROGRESS_SAVED', payload:{questId:q.id, progress}});
  p.onClose=()=>{save();log('investigation_closed',{questId:q.id});p.finish({status:'closed',questId:q.id,returnPoint:args.returnPoint??null});};
  const required=()=>q.completionConditions.requiredEvidence.filter(id=>!progress.observed.includes(id));
  const allObserved=()=>required().length===0;
  const figureHotspots=()=>observationHotspots(activeCreature,q.observationHotspots.filter(h=>h.creatureId===activeCreature));
  const sourceKnowledge=id=>services.getKnowledge?.(id) || knowledge[id];

/* 交接注释 V8
 * 判断正确后先读资料卡：插画、短导读、证据限度、关系和完整来源入口。
 * 最后complete才构造完成结果，不因打开知识或关闭窗口发奖励。
 * 交接注释结束 */
  function resultMarkup() {
    const explanation=q.template==='reconstruct' ? progress.order.map(id=>q.reconstruction.find(x=>x.id===id)?.text).join(' → ') : q.options.find(o=>o.id===progress.selectedOption)?.text;
    return `<section class="lesson-result"><span class="lesson-success">✓ 判断有依据</span><h3>把刚才的发现，连成一张资料卡</h3><div class="answer-explanation"><b>你的解释</b><p>${e(explanation)}</p><b>采用的依据</b><p>${e(q.observationHotspots.find(h=>h.evidenceId===progress.selectedEvidence)?.text)}</p></div>${q.creatureIds.map(id=>{const c=creatures[id], k=sourceKnowledge(c.knowledgeId), art=albumArt[id];return `<article class="lesson-species-card"><div class="species-portrait">${art?`<img src="${e(art.url)}" alt="${e(c.name)}外貌复原">`:observationFigure(id)}</div><div><span class="lesson-kicker">${e(c.role)}</span><h4>${e(c.name)}</h4><p class="species-latin">${e(c.scientificName)}</p>${k.childReading.map(text=>`<p>${e(text)}</p>`).join('')}<p class="knowledge-limit"><b>证据的限度：</b>${e(c.uncertainty)}</p><button class="c-text-button" data-action="read" data-id="${c.knowledgeId}">术语、完整资料与来源 ↗</button></div></article>`;}).join('')}${q.knowledgeIds.includes('knowledge_cam_preservation')?`<article class="preservation-card"><h4>从遗骸到化石，信息怎样留下？</h4><img src="${new URL('../assets/evidence/burial-sequence.svg',import.meta.url).href}" alt="死亡、埋藏与岩层暴露的保存过程示意"><p>${e(knowledge.knowledge_cam_preservation.summary)}</p><button class="c-text-button" data-action="read" data-id="knowledge_cam_preservation">展开保存过程与来源 ↗</button></article>`:''}${q.ecologyLinkIds.length?`<h3>和环境、其他生物怎样相连？</h3><div class="lesson-relations">${relationMarkup(q)}</div>`:''}<footer class="c-actionbar"><button data-action="back">回看圈注与比较</button><button class="c-primary" data-action="complete">结束本区考察，继续旅程 →</button></footer></section>`;
  }

/* 交接注释 V8
 * 观察页将编号圈、部位按钮、局部图、术语和环境思考放在同一处。
 * 已观察两种后出现比较表；重点证据来自completionConditions.requiredEvidence，不能随意加无关门槛。
 * 交接注释结束 */
  function observeMarkup() {
    const c=creatures[activeCreature], hotspots=figureHotspots(), selected=hotspots.find(h=>h.evidenceId===progress.activeEvidence), behavior=behaviorFor(q, activeCreature), index=q.creatureIds.indexOf(activeCreature);
    const missing=required(), nextId=q.creatureIds.slice(index+1).find(id=>missing.some(eid=>q.observationHotspots.find(h=>h.evidenceId===eid)?.creatureId===id)) || q.creatureIds.find(id=>id!==activeCreature && missing.some(eid=>q.observationHotspots.find(h=>h.evidenceId===eid)?.creatureId===id));
    const missingHere=missing.some(id=>hotspots.some(h=>h.evidenceId===id));
    return `<nav class="c-creature-tabs" aria-label="比较观察对象">${q.creatureIds.map((id,i)=>`<button data-action="creature" data-id="${id}" aria-pressed="${activeCreature===id}"><span>${i+1}</span> ${e(creatures[id].name)}</button>`).join('')}</nav><div class="observation-context"><b>${index?'接着比较':'先看这一只'}：${e(c.name)}</b><span>${e(index ? '沿用刚才的方法，比较结构和资源利用有什么区别。' : environmentFor(q).thinking)}</span></div><div class="c-invest-grid"><section class="c-observe"><div class="c-figure ${q.eraId==='jurassic_late'?'land':''}">${observationFigure(activeCreature)}${hotspots.map((h,i)=>`<button class="c-hotspot ${progress.observed.includes(h.evidenceId)?'seen':''} ${selected?.evidenceId===h.evidenceId?'active':''}" style="left:${h.x}%;top:${h.y}%" data-action="observe" data-id="${h.evidenceId}" aria-label="观察${e(h.label)}" aria-pressed="${selected?.evidenceId===h.evidenceId}">${progress.observed.includes(h.evidenceId)?'✓':i+1}</button>`).join('')}</div><p class="c-figure-caption">外貌复原与结构示意 · 点击编号圆圈查看局部</p><div class="c-hotspot-list">${hotspots.map((h,i)=>`<button data-action="observe" data-id="${h.evidenceId}" aria-pressed="${selected?.evidenceId===h.evidenceId}" class="${progress.observed.includes(h.evidenceId)?'is-seen':''}">${progress.observed.includes(h.evidenceId)?'✓':i+1} ${e(h.label)}${q.completionConditions.requiredEvidence.includes(h.evidenceId)?'<small>重点</small>':''}</button>`).join('')}</div>${behavior?`<aside class="behavior-explanation"><span class="behavior-motion" aria-hidden="true">↔</span><div><b>场景里，它在做什么？</b><p>${e(behavior.summary)}</p><small>动作是复原演示；作判断时请结合结构资料。</small>${args.onWatchBehavior&&args.watchCreatureIds?.includes(activeCreature)?'<button class="c-text-button" data-action="watch-behavior">回场景看动作 →</button>':''}</div></aside>`:''}</section><section class="c-evidence-card" aria-live="polite"><span class="lesson-kicker">${selected?'局部放大 / 信息已收进手册':'按圈注观察 / 信息自动保存'}</span>${selected?`<div class="structure-zoom">${detailFigure(activeCreature,selected)}<span>局部放大示意</span></div><h3>${e(selected.label)}</h3><p class="c-lead">${e(selected.text)}</p><div class="evidence-connection"><b>结合环境想一想</b><p>${e(environmentFor(q).thinking)}</p></div><details><summary>读懂一个词：${e(c.term[0])}</summary><p>${e(c.term[1])}</p></details>`:`<div class="observe-empty" aria-hidden="true">◎</div><h3>从圈出的部位开始</h3><p>点图中的编号，或点下方部位名称。这里会出现局部放大和解释。</p>`}<div class="c-required"><strong>本次判断要用的信息</strong>${q.completionConditions.requiredEvidence.map(id=>{const h=q.observationHotspots.find(h=>h.evidenceId===id);return `<button class="required-evidence ${progress.observed.includes(id)?'checked':''}" data-action="locate-evidence" data-id="${id}">${progress.observed.includes(id)?'✓':'○'} ${e(creatures[h.creatureId].name)} · ${e(h.label)}</button>`;}).join('')}</div></section></div>${comparisonMarkup(q,progress.observed)}${q.id==='quest_cam_burial_03'?'<button class="c-text-button" data-action="read" data-id="knowledge_cam_preservation">图解：保存条件与信息丢失 ↗</button>':''}<footer class="c-actionbar"><button data-action="environment">回看环境</button>${allObserved()?'<button class="c-primary" data-action="judge">用这些信息回答问题 →</button>':nextId&&!missingHere?`<button class="c-primary" data-action="creature" data-id="${nextId}">接着观察：${e(creatures[nextId].name)} →</button>`:`<button class="c-primary" data-action="next-evidence">查看下一处重点 →</button>`}</footer>`;
  }

/* 交接注释 V8
 * 解释/排序与相关证据共同作答；错误反馈有review-feedback直达相关结构。
 * 不清空已观察信息，保留firstChoice和attempts区分首次与最终答案。
 * 交接注释结束 */
  function judgeMarkup() {
    return `<div class="c-judge-grid"><section><span class="lesson-kicker">${q.template==='reconstruct'?'把过程按顺序排列':'选择有依据的解释'}</span>${q.template==='reconstruct'?`<p>${e(q.reconstructionNote)}</p><div class="c-order-pool">${[...q.reconstruction].reverse().map(item=>`<button data-action="order" data-id="${item.id}" ${progress.order.includes(item.id)?'disabled':''}>＋ ${e(item.text)}</button>`).join('')}</div><ol class="c-order-result">${progress.order.map(id=>`<li>${e(q.reconstruction.find(item=>item.id===id)?.text)}</li>`).join('')}</ol><button class="c-text-button" data-action="clear-order">重新排列</button>`:`<div class="c-options" role="group" aria-label="判断选项">${q.options.map((option,i)=>`<button data-action="option" data-id="${option.id}" aria-pressed="${progress.selectedOption===option.id}"><span>${'ABC'[i]}</span>${e(option.text)}</button>`).join('')}</div>`}</section><section class="c-evidence-choices"><span class="lesson-kicker">手册中收集的信息，可直接回看</span><h3>哪条观察支持你的判断？</h3>${q.observationHotspots.filter(h=>progress.observed.includes(h.evidenceId)).map(h=>`<button data-action="evidence" data-id="${h.evidenceId}" aria-pressed="${progress.selectedEvidence===h.evidenceId}">${e(creatures[h.creatureId].name)} · ${e(h.label)}<small>${e(h.text)}</small></button>`).join('')}</section></div><div class="c-feedback" role="status">${e(message || '选择解释和相关依据。需要时，随时回看圈注。')}${message?'<button class="c-text-button" data-action="review-feedback">回看相关部位 →</button>':''}</div><footer class="c-actionbar"><button data-action="back">← 回看圈注与比较</button><button class="c-primary" data-action="check">确认判断，查看资料卡 →</button></footer>`;
  }

  function render(focusKey, resetScroll=false) {
    const step=environment?0:progress.stage==='observe'?1:progress.stage==='judge'?2:3;
    p.body.innerHTML=`<ol class="c-stepper">${['环境','观察与比较','回答问题','资料卡'].map((label,i)=>`<li class="${i===step?'current':i<step?'done':''}" ${i===step?'aria-current="step"':''}><span>${i<step?'✓':i+1}</span>${label}</li>`).join('')}</ol><div class="c-question"><span class="lesson-kicker">本次考察要弄明白</span><h3>${e(q.question)}</h3></div>${environment?environmentMarkup(q)+`<footer class="c-actionbar"><p>先认识环境，再带着问题观察。</p><button class="c-primary" data-action="start-observe">${progress.observed.length?'继续观察':'开始观察'}：${e(creatures[activeCreature].name)} →</button></footer>`:progress.stage==='observe'?observeMarkup():progress.stage==='judge'?judgeMarkup():resultMarkup()}`;
    if(resetScroll) p.dialog.scrollTop=0;
    if(focusKey) [...p.body.querySelectorAll('button')].find(b=>b.dataset.action===focusKey.action && b.dataset.id===focusKey.id)?.focus({preventScroll:true});
  }

/* 交接注释 V8
 * 统一事件分发。observe保存证据，judge需allObserved，check调用core.evaluate。
 * complete调用buildResult并返回；关闭保存进度而返回closed。宿主负责唯一结果应用。
 * 交接注释结束 */
  p.body.addEventListener('click', async event=>{
    const b=event.target.closest('button[data-action]');
    if(!b || b.disabled) return;
    const a=b.dataset.action, id=b.dataset.id, key={action:a,id};
    if(a==='start-observe'){environment=false;progress.environmentReviewed=true;save();render(null,true);}
    else if(a==='environment'){environment=true;render(null,true);}
    else if(a==='creature'){activeCreature=id;progress.activeEvidence=null;render(null,true);}
    else if(a==='observe'){
      progress.observed=[...new Set([...progress.observed,id])];progress.activeEvidence=id;
      log('observation_opened',{questId:q.id,evidenceId:id});save();args.onObserve?.(activeCreature);render(key);
      if(matchMedia('(max-width:760px)').matches) p.body.querySelector('.c-evidence-card')?.scrollIntoView({block:'start',behavior:'instant'});
    }
    else if(a==='locate-evidence' || a==='next-evidence'){
      const target=id || required()[0];
      const h=q.observationHotspots.find(h=>h.evidenceId===target);
      if(h){activeCreature=h.creatureId;progress.activeEvidence=progress.observed.includes(target)?target:null;render(null,true);p.body.querySelector(`.c-hotspot[data-id="${target}"]`)?.focus({preventScroll:true});}
    }
    else if(a==='read') await openKnowledge({knowledgeId:id,source:'investigation'});
    else if(a==='watch-behavior'){save();p.finish({status:'closed',questId:q.id,watchCreatureId:activeCreature,returnPoint:args.returnPoint??null});}
    else if(a==='judge' && allObserved()){progress.stage='judge';save();render(null,true);}
    else if(a==='back' || a==='review-feedback'){progress.stage='observe';environment=false;if(a==='review-feedback'){const h=q.observationHotspots.find(h=>h.evidenceId===q.correctEvidenceId);activeCreature=h.creatureId;progress.activeEvidence=h.evidenceId;}message='';save();render(null,true);}
    else if(a==='option' || a==='evidence'){progress[a==='option'?'selectedOption':'selectedEvidence']=id;progress.judgmentPassed=false;message='';save();render(key);}
    else if(a==='order'){if(!progress.order.includes(id))progress.order.push(id);progress.judgmentPassed=false;save();render();}
    else if(a==='clear-order'){progress.order=[];progress.judgmentPassed=false;save();render();}
    else if(a==='check'){
      const choice={optionId:progress.selectedOption,evidenceId:progress.selectedEvidence,order:[...progress.order]};
      if(progress.firstChoice===null)progress.firstChoice=structuredClone(choice);
      const result=evaluate(q,progress);progress.attempts.push({...choice,correct:result.ok});progress.judgmentPassed=result.ok;message=result.message;
      if(result.ok)progress.stage='result';
      log('judgment_submitted',{questId:q.id,choice,correct:result.ok,attempt:progress.attempts.length});save();render(null,result.ok);
      if(!result.ok)p.body.querySelector('.c-feedback')?.scrollIntoView({block:'nearest'});
    }
    else if(a==='complete'){const result=buildResult(q,progress,args);log('investigation_completed',{questId:q.id,resultId:result.resultId});save();p.finish(result);}
  });
  p.body.addEventListener('toggle', event=>{if(event.target.open) log('reading_expanded',{questId:q.id});},true);
  log('investigation_opened',{questId:q.id});render();return p.promise;
}
