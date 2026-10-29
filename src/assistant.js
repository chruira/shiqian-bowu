/* ============================================================
 * 博物小助手 · 基于书籍知识库的检索式问答
 * ------------------------------------------------------------
 * 数据：data/assistant.json（60 条问答，均整理自《DK史前博物大百科》）
 * 纯本地检索，不联网、不需要 API Key
 * ============================================================ */

const DATA_URL = 'data/assistant.json';
let DATA = null;
let wrapEl = null;

/* ---------------- 匹配 ---------------- */
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[，。？！、,.?!！?；;：:"'（）()《》\s]/g, '');
}

function score(entry, q) {
  const nq = normalize(q);
  if (!nq) return 0;
  let s = 0;
  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (k && nq.includes(k)) s += k.length * 3;
  }
  // 与问题文本的字符重合度（兜底）
  const qn = normalize(entry.q);
  let hit = 0;
  for (const ch of new Set(nq)) if (qn.includes(ch)) hit++;
  s += hit * 0.6;
  return s;
}

function search(q) {
  if (!DATA) return { best: null, related: [] };
  const scored = DATA.entries
    .map(e => ({ e, s: score(e, q) }))
    .sort((a, b) => b.s - a.s);
  const best = scored[0] && scored[0].s >= 6 ? scored[0].e : null;
  const related = scored.slice(1, 4).filter(x => x.s >= 3).map(x => x.e.q);
  return { best, related };
}

/* ---------------- UI ---------------- */
function ensureButton() {
  if (document.getElementById('assistant-entry')) return;
  const btn = document.createElement('button');
  btn.id = 'assistant-entry';
  btn.type = 'button';
  btn.title = '向博物小助手提问';
  btn.innerHTML = '<span class="ta-ico">✎</span><span class="ta-txt">问一问</span>';
  btn.addEventListener('click', openPanel);
  document.body.appendChild(btn);

  // 贴到「模拟对战」左边
  const anchor = document.getElementById('team-b-entry');
  const place = () => {
    const w = anchor ? anchor.offsetWidth : 118;
    btn.style.right = (18 + w + 10) + 'px';
    btn.style.top = (anchor ? anchor.style.top || '76px' : '76px');
    btn.style.display = (anchor && getComputedStyle(anchor).display === 'none') ? 'none' : 'flex';
  };
  place();
  setInterval(place, 400);
}

async function loadData() {
  if (DATA) return DATA;
  const res = await fetch(DATA_URL);
  DATA = await res.json();
  return DATA;
}

async function openPanel() {
  if (wrapEl) return;
  try { await loadData(); } catch (e) {
    console.warn('assistant data failed', e);
  }

  wrapEl = document.createElement('div');
  wrapEl.className = 'assistant-overlay';
  wrapEl.innerHTML = `
    <div class="assistant-panel">
      <header class="assistant-head">
        <span class="assistant-title">博物小助手</span>
        <span class="assistant-sub">答案整理自《DK史前博物大百科》</span>
        <button class="assistant-close" data-asst-close aria-label="关闭">×</button>
      </header>
      <div class="assistant-body">
        <div class="assistant-said" id="asst-said">
          <p>你好，我是博物小助手。书里关于古生物的问题，都可以问我。</p>
        </div>
        <div class="assistant-chips" id="asst-chips"></div>
      </div>
      <form class="assistant-input" id="asst-form">
        <input id="asst-q" type="text" autocomplete="off" placeholder="例如：剑龙背上的板有什么用？" maxlength="40">
        <button type="submit">提问</button>
      </form>
    </div>`;
  document.body.appendChild(wrapEl);

  // 推荐问题
  const chips = wrapEl.querySelector('#asst-chips');
  (DATA?.suggestions || []).forEach(q => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = q;
    b.addEventListener('click', () => ask(q));
    chips.appendChild(b);
  });

  wrapEl.querySelector('[data-asst-close]').addEventListener('click', closePanel);
  wrapEl.addEventListener('click', ev => { if (ev.target === wrapEl) closePanel(); });
  wrapEl.querySelector('#asst-form').addEventListener('submit', ev => {
    ev.preventDefault();
    const input = wrapEl.querySelector('#asst-q');
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    ask(v);
  });
  wrapEl.querySelector('#asst-q').focus();
}

function closePanel() {
  if (!wrapEl) return;
  wrapEl.remove();
  wrapEl = null;
}

function bubble(html, cls) {
  const said = wrapEl && wrapEl.querySelector('#asst-said');
  if (!said) return;
  const div = document.createElement('div');
  div.className = 'asst-msg ' + (cls || '');
  div.innerHTML = html;
  said.appendChild(div);
  said.scrollTop = said.scrollHeight;
}

function ask(q) {
  bubble(escapeHtml(q), 'me');
  const { best, related } = search(q);
  setTimeout(() => {
    if (best) {
      bubble(
        '<p class="asst-a">' + escapeHtml(best.answer) + '</p>' +
        '<p class="asst-src">《DK史前博物大百科》' + escapeHtml(best.page) + '</p>' +
        '<p class="asst-note">若与书中原文有出入，以书中为准。</p>',
        'bot'
      );
    } else {
      let h = '<p class="asst-a">这本书里我没有找到直接对应的内容。你可以换个问法，或者试试下面的问题：</p>';
      const list = (related && related.length ? related : (DATA?.suggestions || []).slice(0, 3));
      h += '<div class="asst-sug">' + list.map(x => '<button type="button" data-sug="' + escapeHtml(x) + '">' + escapeHtml(x) + '</button>').join('') + '</div>';
      bubble(h, 'bot');
      wrapEl.querySelectorAll('[data-sug]').forEach(b => {
        b.addEventListener('click', () => ask(b.getAttribute('data-sug')));
      });
    }
  }, 260);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------- 样式 ---------------- */
const css = `
#assistant-entry{
  position:fixed;right:146px;top:76px;z-index:9000;display:none;align-items:center;gap:8px;
  padding:10px 16px;cursor:pointer;font-family:"Deep Time Pixel",monospace;
  background:#f2eddc;color:#12232b;border:3px solid #12232b;border-radius:4px;
  box-shadow:inset 0 0 0 2px #fffdf3,0 6px 0 rgba(0,0,0,.45);font-size:15px;letter-spacing:.08em;
}
#assistant-entry:hover{background:#fffdf3}
#assistant-entry:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px #fffdf3,0 2px 0 rgba(0,0,0,.45)}

.assistant-overlay{position:fixed;inset:0;z-index:9700;display:flex;align-items:center;justify-content:center;
  background:#04121acc;backdrop-filter:blur(2px);padding:20px}
.assistant-panel{width:min(680px,96vw);max-height:88dvh;display:flex;flex-direction:column;
  background:#f3e8c3;border:4px solid #6d4639;border-radius:6px 14px 5px 6px;
  box-shadow:0 11px 0 -3px #a87052,0 26px 60px #000b;color:#3d3423;overflow:hidden}
.assistant-head{display:flex;align-items:baseline;gap:10px;padding:14px 18px 10px;
  border-bottom:2px dashed #c3ab7c;position:relative}
.assistant-title{font-family:"Deep Time Pixel",monospace;font-size:21px;color:#2f2a1a}
.assistant-sub{font-size:12px;color:#8a7442;letter-spacing:.04em}
.assistant-close{margin-left:auto;width:30px;height:30px;line-height:1;
  background:#e7d9b4;border:2px solid #6d4639;border-radius:3px;color:#3d3423;
  font-size:18px;cursor:pointer}
.assistant-body{padding:14px 18px;overflow:auto;flex:1}
.assistant-said{display:flex;flex-direction:column;gap:10px;max-height:46dvh;overflow:auto;padding-right:4px}
.asst-msg{max-width:88%;padding:10px 13px;border-radius:5px;font-size:15px;line-height:1.75}
.asst-msg.bot{background:#fffdf0;border:2px solid #c3ab7c;align-self:flex-start}
.asst-msg.me{background:#24594b;color:#fffdf5;align-self:flex-end}
.asst-a{margin:0 0 6px}
.asst-src{margin:0;font-size:13px;color:#8a7442}
.asst-note{margin:6px 0 0;font-size:12px;color:#a08b5c}
.asst-sug{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.asst-sug button{background:#e7d9b4;border:2px solid #6d4639;border-radius:3px;
  padding:5px 10px;font-size:13px;color:#3d3423;cursor:pointer}
.asst-sug button:hover{background:#f6ecd0}
.assistant-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.assistant-chips button{background:#fffdf0;border:2px solid #b7a074;border-radius:3px;
  padding:7px 12px;font-size:14px;color:#3d3423;cursor:pointer}
.assistant-chips button:hover{background:#f6ecd0}
.assistant-input{display:flex;gap:8px;padding:12px 18px 16px;border-top:2px dashed #c3ab7c}
.assistant-input input{flex:1;padding:10px 12px;font-size:15px;color:#3d3423;
  background:#fffdf0;border:2px solid #6d4639;border-radius:3px;font-family:inherit}
.assistant-input button{padding:10px 20px;font-size:15px;cursor:pointer;
  background:#24594b;color:#fffdf5;border:2px solid #123a30;border-radius:3px;
  font-family:"Deep Time Pixel",monospace}
@media (max-width:760px){
  #assistant-entry{font-size:13px;padding:8px 11px}
  .assistant-panel{width:96vw}
}
`;
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

/* ---------------- 启动 ---------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureButton);
} else {
  ensureButton();
}
setTimeout(ensureButton, 800);
