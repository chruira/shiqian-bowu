/* ============================================================
 * 博物大冒险 × B 战斗模块 · 集成桥
 * ------------------------------------------------------------
 * 宿主站（地图/调查/手册）保持不变，战斗模块以全屏 iframe 覆盖层接入。
 * 两套样式/字体/全局选择器差异大，同页加载会互相污染；
 * 集成文档也把「iframe 嵌入」列为可接受的隔离方式。
 * 通信：postMessage，宿主下发解锁列表，B 回传对战结果。
 * ============================================================ */

const ENTRY_ID = 'team-b-entry';
const OVERLAY_ID = 'team-b-overlay';

/* 只在场景内显示入口 */
function syncEntryVisibility() {
  const btn = document.getElementById(ENTRY_ID);
  if (!btn) return;
  const view = (window.game && window.game.view) || '';
  btn.style.display = (view === 'scene') ? 'flex' : 'none';
}
window.__syncTeamBEntry = syncEntryVisibility;

function ready() {
  if (document.getElementById(ENTRY_ID)) return;

  const btn = document.createElement('button');
  btn.id = ENTRY_ID;
  btn.type = 'button';
  btn.title = '打开模拟对战';
  btn.innerHTML = '<span class="tb-ico">⚔</span><span class="tb-txt">模拟对战</span>';
  btn.addEventListener('click', () => openBattle({}));
  document.body.appendChild(btn);

  window.addEventListener('message', onMessage);
  setInterval(syncEntryVisibility, 300);
  syncEntryVisibility();
}

/* 宿主状态 → B 需要的形状 */
function hostSnapshot() {
  const g = window.game;
  if (!g || !g.services) return { unlocks: [], eraId: 'cambrian', selectedId: null };
  const s = g.services.getState();
  const scene = g.scene;
  return {
    unlocks: s.unlockedCreatureIds || [],
    eraId: (scene && scene.eraId) || s.currentEraId || 'cambrian',
    selectedId: null
  };
}

/* 由场景内生物弹窗调用 */
window.openTeamBattle = function (opts) {
  openBattle(opts || {});
};

function openBattle(opts) {
  opts = opts || {};
  if (document.getElementById(OVERLAY_ID)) return;

  const wrap = document.createElement('div');
  wrap.id = OVERLAY_ID;
  wrap.innerHTML =
    '<div class="tb-bar">' +
    '  <span class="tb-title">模拟对战</span>' +
    '  <button type="button" class="tb-close" data-tb-close>返回探索</button>' +
    '</div>' +
    '<iframe class="tb-frame" src="b-module/demo.html?embed=1" title="模拟对战"></iframe>';
  document.body.appendChild(wrap);

  const preset = opts.creatureId ? Object.assign({}, opts, { selectedId: opts.creatureId }) : {};
  const frame = wrap.querySelector('.tb-frame');
  frame.addEventListener('load', function () {
    frame.contentWindow.postMessage(
      Object.assign({ source: 'deep-time', type: 'init' }, hostSnapshot(), preset), '*');
  });
  wrap.querySelector('[data-tb-close]').addEventListener('click', closeBattle);
  toast('对战模块加载中…');
}

function closeBattle() {
  const wrap = document.getElementById(OVERLAY_ID);
  if (!wrap) return;
  const frame = wrap.querySelector('.tb-frame');
  try { frame.contentWindow.postMessage({ source: 'deep-time', type: 'close' }, '*'); } catch (e) {}
  wrap.remove();
}

function onMessage(ev) {
  const d = ev.data;
  if (!d || d.source !== 'b-module') return;

  if (d.type === 'ready') {
    const wrap = document.getElementById(OVERLAY_ID);
    if (wrap) {
      wrap.querySelector('.tb-frame').contentWindow.postMessage(
        Object.assign({ source: 'deep-time', type: 'init' }, hostSnapshot()), '*');
    }
  }

  if (d.type === 'battle_completed') {
    const p = d.payload || {};
    const label = { win: '胜利', lose: '失败', draw: '平局', aborted: '退出' }[p.outcome] || p.outcome;
    toast('对战结束：' + label + ' · ' + p.turnCount + ' 回合');
    recordToHost(p);
  }

  if (d.type === 'open_knowledge') {
    const C = window.C;
    if (!C || !C.openKnowledge) { toast('阅读模块未就绪'); return; }
    closeBattle();
    Promise.resolve(C.openKnowledge({ knowledgeId: d.knowledgeId, source: 'battle' })).catch(function () {});
  }

  if (d.type === 'close_requested') closeBattle();
}

/* 把结果写回宿主存档（幂等，宿主按 resultId 去重） */
function recordToHost(payload) {
  const g = window.game;
  if (!g || !g.services || !payload || !payload.resultId) return;
  try {
    g.services.dispatch({ type: 'BATTLE_COMPLETED', payload });
  } catch (e) {
    /* 宿主不认这个事件时静默忽略 */
  }
}

function toast(msg) {
  const el = document.querySelector('#game-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(function () { el.classList.remove('show'); }, 3800);
}

/* game.js 是 module，执行完才挂 window.game；这里等它 */
if (window.game) ready();
else {
  let tries = 0;
  const timer = setInterval(function () {
    if (window.game || ++tries > 120) { clearInterval(timer); ready(); }
  }, 100);
}

/* ---------------- 样式 ---------------- */
const css = [
  '#team-b-entry{position:fixed;right:18px;top:76px;z-index:9000;display:none;align-items:center;gap:8px;',
  '  padding:10px 16px;cursor:pointer;font-family:"Deep Time Pixel","Fusion Pixel",monospace;',
  '  background:#f2eddc;color:#12232b;border:3px solid #12232b;border-radius:4px;',
  '  box-shadow:inset 0 0 0 2px #fffdf3,0 6px 0 rgba(0,0,0,.45);font-size:15px;letter-spacing:.08em}',
  '#team-b-entry:hover{background:#fffdf3}',
  '#team-b-entry:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px #fffdf3,0 2px 0 rgba(0,0,0,.45)}',
  '#team-b-overlay{position:fixed;inset:0;z-index:9500;background:#06141b;display:flex;flex-direction:column}',
  '#team-b-overlay .tb-bar{display:flex;align-items:center;justify-content:space-between;',
  '  padding:8px 16px;background:#0c2029;border-bottom:2px solid #1e3a45;',
  '  font-family:"Deep Time Pixel","Fusion Pixel",monospace;color:#cfe6df;font-size:15px;letter-spacing:.1em}',
  '#team-b-overlay .tb-close{cursor:pointer;padding:6px 14px;background:#f2eddc;color:#12232b;',
  '  border:2px solid #12232b;border-radius:3px;font-family:inherit;font-size:14px}',
  '#team-b-overlay .tb-close:hover{background:#fffdf3}',
  '#team-b-overlay .tb-frame{flex:1;width:100%;border:0;background:#06141b}'
].join('\n');
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
