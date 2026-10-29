import {questById,creatures,ecologyLinks} from './data.js?v20261029k';
export const STORAGE_KEY='aic.c.ecology.demo.v1';
export const blankState=()=>({schemaVersion:1,currentEraId:'cambrian',sceneId:'cam_feeding',playerPosition:{x:0,y:0},unlockedCreatureIds:[],completedQuestIds:[],questProgress:{},discoveredKnowledgeIds:[],notebookEntries:[],ecologyLinkIds:[],selectedCreatureByEra:{},challengeRecords:[],processedResultIds:[],readingLog:[]});
export const initialProgress=()=>({observed:[],activeEvidence:null,stage:'observe',selectedOption:null,selectedEvidence:null,order:[],firstChoice:null,attempts:[],judgmentPassed:false});
export const resumeProgress=value=>{const p={...initialProgress(),...(value||{})};return {...p,observed:Array.isArray(p.observed)?p.observed:[],attempts:Array.isArray(p.attempts)?p.attempts:[],order:Array.isArray(p.order)?p.order:[]};};
/* 交接注释 V8
 * 完成前校验链：必须证据已观察→正确解释或排序→正确相关证据。
 * 选对答案但证据不对仍不完成；不要为跳关移除这些条件。
 * 交接注释结束 */
export function evaluate(quest,p){const missing=quest.completionConditions.requiredEvidence.filter(id=>!p.observed.includes(id));if(missing.length)return {ok:false,message:'先观察标记的关键部位，再回来选择依据。'};if(quest.template==='reconstruct'){if(p.order.join('|')!==quest.reconstruction.map(x=>x.id).join('|'))return {ok:false,message:'这个顺序还需要调整。回看线索，想一想哪些条件发生在前。'};}else if(!quest.options.find(o=>o.id===p.selectedOption)?.correct)return {ok:false,message:quest.options.find(o=>o.id===p.selectedOption)?.feedback||'先选择一个解释。'};if(p.selectedEvidence!==quest.correctEvidenceId)return {ok:false,message:'解释还需要相关证据支持。请重新选择能直接回答问题的线索。'};return {ok:true,message:quest.template==='reconstruct'?'顺序与依据都成立。请保留说明中的时间跨度与不确定性。':quest.options.find(o=>o.id===p.selectedOption).feedback};}
/* 交接注释 V8
 * 只从任务配置构造规范结果；resultId稳定为investigation_加任务ID。
 * 必须已通过判断，不能仅凭弹窗关闭生成奖励。
 * 交接注释结束 */
export function buildResult(quest,p,args={}){if(!p.judgmentPassed||!evaluate(quest,p).ok)throw new Error('调查尚未满足完成条件');return {status:'completed',resultId:'investigation_'+quest.id,questId:quest.id,sceneId:args.sceneId||quest.sceneId,unlockCreatureIds:[...quest.unlockCreatureIds],discoveredKnowledgeIds:[...quest.knowledgeIds],notebookEntries:[{id:quest.noteId,questId:quest.id,knowledgeId:quest.knowledgeIds[0],knowledgeIds:quest.knowledgeIds,creatureIds:quest.creatureIds,evidenceIds:[...p.observed],judgmentId:p.selectedOption||'reconstruction',selectedEvidenceId:p.selectedEvidence,sourceIds:[...new Set(quest.creatureIds.flatMap(id=>creatures[id].sourceIds))],summary:quest.notebookSummary,status:'completed'}],ecologyLinkIds:[...quest.ecologyLinkIds],returnPoint:args.returnPoint??null};}
const union=(a,b)=>[...new Set([...a,...b])];
/* 交接注释 V8
 * 宿主集中白名单与幂等检查。重放同resultId不重复领奖；不接受任务外解锁。
 * 从已保存有效判断重新构造规范笔记，避免UI任意文本进入存档。
 * 交接注释结束 */
export function applyResult(state,result){if(result.status!=='completed')return state;const q=questById[result.questId];if(!q)throw new Error('未知任务');const p=state.questProgress[q.id];if(!p||!p.judgmentPassed||!evaluate(q,p).ok)throw new Error('宿主拒绝：没有已保存的有效判断');if(result.resultId!=='investigation_'+q.id)throw new Error('结果编号不匹配');if(state.processedResultIds.includes(result.resultId))return state;
for(const [key,allowed] of [['unlockCreatureIds',q.unlockCreatureIds],['discoveredKnowledgeIds',q.knowledgeIds],['ecologyLinkIds',q.ecologyLinkIds]]){if(result[key].length!==allowed.length||result[key].some(id=>!allowed.includes(id)))throw new Error('结果超出任务白名单：'+key);}
const canonical=buildResult(q,p,{sceneId:result.sceneId,returnPoint:result.returnPoint});return {...state,processedResultIds:union(state.processedResultIds,[canonical.resultId]),completedQuestIds:union(state.completedQuestIds,[q.id]),unlockedCreatureIds:union(state.unlockedCreatureIds,canonical.unlockCreatureIds),discoveredKnowledgeIds:union(state.discoveredKnowledgeIds,canonical.discoveredKnowledgeIds),ecologyLinkIds:union(state.ecologyLinkIds,canonical.ecologyLinkIds),notebookEntries:[...state.notebookEntries.filter(n=>n.id!==q.noteId),...canonical.notebookEntries]};}
/* 交接注释 V8
 * 独立站演示状态服务；主线键aic.c.ecology.demo.v1，世界存档由world.js另管。
 * 团队集成应替换为宿主适配器，避免两份服务各发奖励。
 * 交接注释结束 */
export function createMockServices(storage=globalThis.localStorage){let state;let storageError=null;try{const raw=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');state=raw?.schemaVersion===1?{...blankState(),...raw}:blankState();}catch{state=blankState();storageError='无法读取旧存档，已使用新的演示状态。';}const listeners=new Set();const save=()=>{try{storage?.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageError='浏览器阻止了持久化，当前进度仅保留在本次会话。';}for(const fn of listeners)fn(structuredClone(state));};return {getState:()=>structuredClone(state),subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getCreature:id=>creatures[id],getQuest:id=>questById[id],getStorageError:()=>storageError,dispatch(event){if(event.type==='INVESTIGATION_PROGRESS_SAVED'){const {questId,progress}=event.payload||event;if(!questById[questId])throw new Error('未知任务');state={...state,questProgress:{...state.questProgress,[questId]:structuredClone(progress)}};}else if(event.type==='BATTLE_COMPLETED'){
      const bp=event.payload||{};
      if(!bp.resultId)throw new Error('战斗结果缺少 resultId');
      if((state.processedResultIds||[]).includes(bp.resultId))return this.getState();
      state={...state,
        challengeRecords:[...(state.challengeRecords||[]),{challengeId:bp.challengeId,creatureId:bp.creatureId,opponentId:bp.opponentId,outcome:bp.outcome,turnCount:bp.turnCount,recordedAt:new Date().toISOString()}].slice(-200),
        processedResultIds:[...(state.processedResultIds||[]),bp.resultId]};
    }else if(event.type==='READING_EVENT'){state={...state,readingLog:[...state.readingLog,{...event.payload,sequence:state.readingLog.length+1}].slice(-3000)};}else throw new Error('不支持的 mock 事件：'+event.type);save();},applyInvestigationResult(result){state=applyResult(state,result);save();return this.getState();},reset(){state=blankState();save();},setEra(eraId){if(!['cambrian','jurassic_late'].includes(eraId))return;state={...state,currentEraId:eraId};save();},exportSnapshot(){return {kind:'development_demo_data',notLearningOutcome:true,exportedAt:new Date().toISOString(),...this.getState()};}};}
export function allowedLinks(ids){return ecologyLinks.filter(l=>ids.includes(l.id));}
