/* ============================================================
 * B 模块 · 对战界面 v3
 * 字体：Fusion Pixel 12px（真点阵中文字库，整数倍放大不糊）
 * 布局：宝可梦式 —— 敌方右上/血条在脚下，我方左下/血条在头顶
 * 依赖：B.Engine（纯逻辑）、B.Adapter（存档）
 * ============================================================ */
(function (B) {
  'use strict';

  var root, el, state, cfg, playing = false;

  var INTENT_TEXT = { attack: '准备进攻', guard: '准备防御', skill: '准备使用特色技能' };

  var FX_KIND = {
    basic_attack: 'slash', guard: 'guard',
    anomalocaris_grip: 'grip', trilobite_curl: 'curl', opabinia_probe: 'probe',
    wiwaxia_spines: 'spikes', marrella_dash: 'dash',
    allosaurus_bite: 'bite', stegosaurus_tail: 'tail',
    diplodocus_tail: 'tail', dryosaurus_dash: 'dash'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function creatureOf(id) { return B.Creatures.byId[id]; }
  function nameOf(id) { var a = B.Actions[id]; return a ? a.name : id; }

  function spriteHTML(c, cls) {
    if (c && c.sprite && c.spriteReady) {
      return '<img class="' + cls + '" src="' + esc(c.sprite) + '" alt="">';
    }
    return '<div class="' + cls + '"><div class="ph">?</div></div>';
  }

  /* ================= 模板 ================= */
  function template() {
    var ch = B.Challenges.byId[cfg.challengeId];
    var pC = creatureOf(state.player.creatureId);
    var eC = creatureOf(state.enemy.creatureId);
    var eraName = ch.eraId === 'cambrian' ? '寒武纪' : '侏罗纪晚期';

    return '' +
'<div class="bt">' +
'  <div class="bt-bg" style="background-image:url(assets/battle_bg_cave.png)"></div>' +
'  <div class="bt-scan"></div>' +

'  <div class="bt-top">' +
'    <div class="t1"><span class="chip">' + eraName + '</span>' +
'      <span class="ttl">' + esc(ch.name) + '</span></div>' +
'    <div class="t1"><span class="dim">第</span><span class="turn" id="bt-turn">' + state.turn + '</span>' +
'      <span class="dim">回合</span></div>' +
'  </div>' +

'  <div class="bt-stage">' +
'    <canvas id="bt-fx" class="bt-fx"></canvas>' +
'    <div class="intent" id="bt-intent"></div>' +

'    <div class="foe-wrap">' +
'      <div class="plateau foe-plateau"></div>' +
      spriteHTML(eC, 'foe-spr') +
'    </div>' +
'    <div class="hpbox foe">' +
'      <div class="line1"><span class="nm">' + esc(eC.name) + '</span><span class="dim">对手</span></div>' +
'      <div class="row2"><span class="hplabel">HP</span><span class="hpbar" id="bt-foe-bar"><i></i></span></div>' +
'      <div class="row3"><span class="pips" id="bt-foe-pips"></span>' +
'        <span class="hpnum" id="bt-foe-num"></span></div>' +
'    </div>' +

'    <div class="ally-wrap">' +
'      <div class="plateau ally-plateau"></div>' +
      spriteHTML(pC, 'ally-spr') +
'    </div>' +
'    <div class="hpbox ally">' +
'      <div class="line1"><span class="nm">' + esc(pC.name) + '</span><span class="dim">我方</span></div>' +
'      <div class="row2"><span class="hplabel">HP</span><span class="hpbar" id="bt-ally-bar"><i></i></span></div>' +
'      <div class="row3"><span class="pips" id="bt-ally-pips"></span>' +
'        <span class="hpnum" id="bt-ally-num"></span></div>' +
'    </div>' +
'  </div>' +

'  <div class="bt-bottom">' +
'    <div class="moves" id="bt-moves"></div>' +
'    <div class="statusbox">' +
'      <div class="feedback" id="bt-feedback"></div>' +
'      <div class="miniops">' +
'        <button class="pxbtn2" id="bt-logbtn">战斗记录</button>' +
'        <button class="pxbtn2" id="bt-exitbtn">退 出</button>' +
'      </div>' +
'    </div>' +
'  </div>' +
'</div>' +

'<div class="bsp" data-panel-log><div class="inner pxbox">' +
'  <button class="pxbtn2 closebtn" data-close="log">关闭</button>' +
'  <h3>战斗记录</h3><div data-logbody class="bspbody"></div></div></div>' +
'<div class="bsp" data-panel-know><div class="inner pxbox">' +
'  <button class="pxbtn2 closebtn" data-close="know">关闭</button>' +
'  <h3>观察资料</h3><div data-knowbody class="bspbody"></div></div></div>';
  }

  /* ================= HUD ================= */
  function setBar(side, ratio) {
    var box = el.querySelector(side === 'player' ? '.hpbox.ally' : '.hpbox.foe');
    var bar = box.querySelector('.hpbar');
    bar.querySelector('i').style.width = Math.max(0, ratio * 100) + '%';
    bar.classList.toggle('mid', ratio <= 0.5 && ratio > 0.22);
    bar.classList.toggle('low', ratio <= 0.22);
    var u = B.Engine.unit(state, side);
    box.querySelector('.hpnum').textContent = u.hp + ' / ' + u.maxHp;
    var s = '';
    for (var i = 0; i < u.maxEnergy; i++) s += '<i class="' + (i < u.energy ? 'on' : '') + '"></i>';
    box.querySelector('.pips').innerHTML = s;
  }
  function refreshHUD() {
    setBar('player', state.player.hp / state.player.maxHp);
    setBar('enemy', state.enemy.hp / state.enemy.maxHp);
    var t = el.querySelector('#bt-turn');
    if (t) t.textContent = state.turn;
    var it = el.querySelector('#bt-intent');
    if (it) {
      it.textContent = state.phase === 'select'
        ? '对手意图：' + (INTENT_TEXT[state.intent.category] || '') : '';
    }
  }

  /* ================= 技能块 ================= */
  function renderMoves(disabled) {
    var box = el.querySelector('#bt-moves');
    var list = B.Engine.availableActions(state, 'player');
    box.innerHTML = '';

    function mk(entry, special) {
      if (!entry) return;
      var a = entry.action;
      var b = document.createElement('button');
      b.className = 'move' + (special ? ' special' : '');
      b.disabled = !!disabled || !entry.usable;
      b.setAttribute('data-act', a.id);
      b.innerHTML = '<span class="cur">▶</span>' +
        '<span class="mtop"><span class="mname">' + esc(a.name) + '</span>' +
        '<span class="cost">能量 ' + a.cost + '</span></span>' +
        '<span class="mdesc">' + esc(entry.usable ? (a.desc || '') : (entry.why || '')) + '</span>';
      b.addEventListener('click', function () {
        if (b.disabled || playing || state.phase !== 'select') return;
        submit(a.id);
      });
      box.appendChild(b);
    }
    mk(list[0], false);
    mk(list[1], false);
    mk(list[2], true);

    var b4 = document.createElement('button');
    b4.className = 'move';
    b4.disabled = !!disabled;
    b4.innerHTML = '<span class="cur">▶</span>' +
      '<span class="mtop"><span class="mname">观察资料</span><span class="cost">不消耗回合</span></span>' +
      '<span class="mdesc">查看技能规则与科学依据</span>';
    b4.addEventListener('click', function () { if (!playing) openKnowledge(); });
    box.appendChild(b4);
  }

  /* ================= 反馈 ================= */
  function setFeedback(lines) {
    var box = el.querySelector('#bt-feedback');
    var arr = (Array.isArray(lines) ? lines : [lines]).slice(0, 3);
    box.innerHTML = arr.map(function (t) { return '<span class="fline">' + esc(t) + '</span>'; }).join('');
  }

  function spriteCenter(side) {
    var stage = el.querySelector('.bt-stage');
    var spr = el.querySelector(side === 'player' ? '.ally-spr' : '.foe-spr');
    if (!stage || !spr) return { x: 0, y: 0 };
    var s = stage.getBoundingClientRect(), r = spr.getBoundingClientRect();
    var k = (stage.clientWidth || 1280) / (s.width || 1280);
    /* 用立绘内容框（alpha bbox）算真实身体中心，避免特效飘在头顶 */
    var c = creatureOf(side === 'player' ? state.player.creatureId : state.enemy.creatureId);
    var box = (c && c.sprBox) || { t: 0.35, b: 0.97 };
    var mid = (box.t + box.b) / 2;
    return {
      x: (r.left - s.left + r.width / 2) * k,
      y: (r.top - s.top + r.height * mid) * k
    };
  }

  function showBanner(text, color) {
    var b = document.createElement('div');
    b.className = 'skill-banner';
    if (color) b.style.borderColor = color;
    b.textContent = text + '！';
    (el.querySelector('.bt') || el).appendChild(b);
    setTimeout(function () { b.remove(); }, 720);
  }

  function shake() {
    var stage = el.querySelector('.bt-stage');
    if (!stage) return;
    stage.style.animation = 'btShake .26s';
    setTimeout(function () { stage.style.animation = ''; }, 280);
  }

  /* ================= 事件播放 ================= */
  async function play(events) {
    playing = true;
    refreshHUD();
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.type === 'locked') {
        setFeedback(['行动锁定：' + nameOf(e.playerActionId) + ' / ' + nameOf(e.enemyActionId)]);
        await sleep(140);
      } else if (e.type === 'order') {
        setFeedback(['先手：' + e.order.map(function (s) { return s === 'player' ? '我方' : '对手'; }).join(' → ')]);
        await sleep(120);
      } else if (e.type === 'action') {
        var sp = el.querySelector(e.side === 'player' ? '.ally-spr' : '.foe-spr');
        if (sp) { sp.classList.add('atk'); setTimeout(function () { sp.classList.remove('atk'); }, 340); }
        setFeedback([(e.side === 'player' ? '我方 ' : '对手 ') + e.actionName + '（基础 ' + e.baseDamage + '）']);
        var from = spriteCenter(e.side === 'player' ? 'player' : 'enemy');
        var to = spriteCenter(e.side === 'player' ? 'enemy' : 'player');
        showBanner(e.actionName, e.side === 'player' ? '#ffe066' : '#ff9b8a');
        if (B.FX) {
          if (e.actionId === 'guard') {
            await B.FX.play('guard', { from: from, to: from, dur: 470 });
          } else {
            await B.FX.play(FX_KIND[e.actionId] || 'slash', { from: from, to: to });
          }
        } else {
          await sleep(420);
        }
      } else if (e.type === 'trait') {
        setFeedback([(e.side === 'player' ? '我方' : '对手') + '特性「' + e.name + '」：' +
          (e.delta > 0 ? '+' : '') + e.delta + ' → ' + e.value]);
        await sleep(200);
      } else if (e.type === 'guard') {
        setFeedback(['防御减免 ' + e.absorb + ' → 剩余 ' + e.value]);
        if (B.FX) B.FX.play('guard', { from: spriteCenter(e.side === 'player' ? 'player' : 'enemy'),
          to: spriteCenter(e.side === 'player' ? 'player' : 'enemy'), dur: 420 });
        await sleep(200);
      } else if (e.type === 'damage') {
        var tgt = el.querySelector(e.targetSide === 'player' ? '.ally-spr' : '.foe-spr');
        if (tgt) { tgt.classList.add('hit'); setTimeout(function () { tgt.classList.remove('hit'); }, 430); }
        shake();
        if (B.FX) {
          var hp = spriteCenter(e.targetSide === 'player' ? 'player' : 'enemy');
          B.FX.play('hit', { from: hp, to: hp, dur: 240, stopMs: 0 });
        }
        floatNum(e.targetSide, '-' + e.final);
        setFeedback([(e.targetSide === 'player' ? '我方' : '对手') + '实际受到 ' + e.final + ' 点伤害' +
          (e.absorbed ? '（防御抵消 ' + e.absorb + '）' : '')]);
        refreshHUD();
        await sleep(180);
      } else if (e.type === 'energy') {
        refreshHUD();
      } else if (e.type === 'end') {
        refreshHUD();
        showKO(e);
        await sleep(e.outcome === 'aborted' ? 0 : 400);
      }
    }
    playing = false;
  }

  function showKO(e) {
    if (e.outcome === 'aborted') return;
    var txt = e.outcome === 'win' ? '对手失去战斗能力'
      : (e.outcome === 'lose' ? '我方失去战斗能力' : '回合上限 · 平局');
    var b = document.createElement('div');
    b.className = 'ko-banner on';
    b.innerHTML = '<span>' + txt + '</span>';
    (el.querySelector('.bt') || el).appendChild(b);
  }

  function floatNum(side, text) {
    var host = el.querySelector(side === 'player' ? '.ally-spr' : '.foe-spr');
    if (!host) return;
    var f = document.createElement('div');
    f.className = 'bt-float';
    f.textContent = text;
    host.appendChild(f);
    setTimeout(function () { f.remove(); }, 1000);
  }

  /* ================= 提交 ================= */
  async function submit(actionId) {
    if (playing || state.phase !== 'select') return;
    renderMoves(true);
    var events = B.Engine.resolveTurn(state, actionId);
    await play(events);
    if (state.phase === 'over') finish();
    else { refreshHUD(); renderMoves(false); }
  }

  /* ================= 面板 ================= */
  function openKnowledge() {
    var pC = creatureOf(state.player.creatureId);
    var eC = creatureOf(state.enemy.creatureId);
    var body = el.querySelector('[data-knowbody]');
    var html = '';

    function know(c) {
      var s = '';
      (c.knowledgeIds || []).forEach(function (kid) {
        var k = B.Creatures.knowledge[kid];
        if (!k) return;
        s += '<div class="logline"><b>' + esc(k.title) + '</b>（' + esc(k.page) + '）<br>' + esc(k.body) + '</div>';
      });
      return s;
    }
    function traitOf(c) {
      var tr = B.Traits[c.traitId];
      if (!tr) return '';
      return '<div class="logline"><b>特性 · ' + esc(tr.name) + '</b>：' + esc(tr.desc) +
        (tr.science ? '<br><span class="rid">科学依据：' + esc(tr.science) +
          '（' + esc(tr.source && tr.source.page || '') + '）</span>' : '') + '</div>';
    }

    html += '<div class="ksec">对手 · ' + esc(eC.name) +
      (eC.scientificName ? '（<i>' + esc(eC.scientificName) + '</i>）' : '') + '</div>';
    html += '<div class="logline">' + esc(eC.ecologyRole || '') +
      (eC.sizeNote ? '<br>体型：' + esc(eC.sizeNote) : '') +
      '<br>模拟属性：HP ' + eC.stats.maxHp + '　攻击 ' + eC.stats.attack +
      '　防御 ' + eC.stats.defense + '　速度 ' + eC.stats.speed +
      '<span class="rid">（游戏数值，非科学结论）</span></div>';
    html += traitOf(eC) + know(eC);

    html += '<div class="ksec" style="margin-top:14px">我方 · ' + esc(pC.name) + '</div>';
    [B.Actions[pC.basicActionId], B.Actions.guard, B.Actions[pC.signatureActionId]].forEach(function (a) {
      if (!a) return;
      html += '<div class="logline"><b>' + esc(a.name) + '</b>（消耗 ' + a.cost + ' 能量）：' + esc(a.desc) + '</div>';
    });
    html += traitOf(pC);

    if (window.__B_EMBED) {
      html += '<div class="know-more"><button class="pxbtn2" id="bt-open-c">打开完整知识条目（阅读模块）</button></div>';
    }
    body.innerHTML = html;
    var cbtn = el.querySelector('#bt-open-c');
    if (cbtn) {
      cbtn.addEventListener('click', function () {
        try {
          parent.postMessage({ source: 'b-module', type: 'open_knowledge',
            knowledgeId: 'knowledge_' + eC.id }, '*');
        } catch (err) {}
      });
    }
    el.querySelector('[data-panel-know]').classList.add('on');
  }

  function openLog() {
    var body = el.querySelector('[data-logbody]');
    body.innerHTML = state.log.map(function (e) {
      var t = 'T' + (e.turn || '');
      var txt = '';
      switch (e.type) {
        case 'battle_start': txt = '战斗开始'; break;
        case 'intent': txt = '对手意图公开'; break;
        case 'locked': txt = '行动锁定'; break;
        case 'order': txt = '出手顺序：' + e.order.join(' → '); break;
        case 'action': txt = (e.side === 'player' ? '我方' : '对手') + '使用 ' + e.actionName + '（基础伤害 ' + e.baseDamage + '）'; break;
        case 'trait': txt = '特性 ' + e.name + ' 触发（' + (e.delta > 0 ? '+' : '') + e.delta + ' → ' + e.value + '）'; break;
        case 'guard_set': txt = (e.side === 'player' ? '我方' : '对手') + '进入防御（减免 ' + e.absorb + '）'; break;
        case 'guard': txt = '防御减免 ' + e.absorb + ' → 剩余 ' + e.value; break;
        case 'damage': txt = (e.targetSide === 'player' ? '我方' : '对手') + '受到 ' + e.final + ' 点伤害（HP ' + e.hpAfter + '）'; break;
        case 'energy': txt = (e.side === 'player' ? '我方' : '对手') + '能量 ' + (e.delta > 0 ? '+' : '') + e.delta + ' → ' + e.after; break;
        case 'turn_start': txt = '第 ' + e.turn + ' 回合开始'; break;
        case 'end': txt = '战斗结束：' + e.outcome; break;
        default: txt = e.type;
      }
      return '<div class="logline"><span class="t">' + t + '</span>' + esc(txt) +
        ' <span class="rid">[' + esc(e.reasonId || '') + ']</span></div>';
    }).join('');
    el.querySelector('[data-panel-log]').classList.add('on');
  }

  /* ================= 结算 ================= */
  function finish() {
    el.querySelectorAll('.ko-banner').forEach(function (n) { n.remove(); });

    var pC = creatureOf(state.player.creatureId);
    var eC = creatureOf(state.enemy.creatureId);
    var ch = B.Challenges.byId[cfg.challengeId];
    var pRatio = state.player.hp / state.player.maxHp;
    var eRatio = state.enemy.hp / state.enemy.maxHp;

    var keyEvent = null;
    for (var i = state.log.length - 1; i >= 0; i--) {
      var e = state.log[i];
      if (e.type === 'guard' && e.absorb > 0) {
        keyEvent = '第 ' + e.turn + ' 回合，防御减免了 ' + e.absorb + ' 点伤害。'; break;
      }
      if (e.type === 'trait') {
        keyEvent = '第 ' + e.turn + ' 回合，特性「' + e.name + '」触发，伤害修正 ' + e.delta + ' 点。'; break;
      }
    }
    if (!keyEvent) keyEvent = '本局共 ' + state.turn + ' 回合，双方剩余 HP 为 ' +
      Math.round(pRatio * 100) + '% / ' + Math.round(eRatio * 100) + '%。';

    var rec = B.Adapter.recordBattle({
      battleId: state.battleId, challengeId: ch.id, eraId: ch.eraId,
      playerCreatureId: state.player.creatureId, opponentId: state.enemy.creatureId,
      outcome: state.outcome, turnCount: state.turn,
      playerHpRatio: +pRatio.toFixed(3), opponentHpRatio: +eRatio.toFixed(3),
      date: new Date().toLocaleString('zh-CN')
    });

    var label = { win: '胜 利', lose: '失 败', draw: '平 局', aborted: '已 退 出' }[state.outcome];
    var reward = state.outcome === 'aborted'
      ? '退出不计胜负，不发放通关奖励。'
      : (rec.firstClear ? '首次通关：研究点 +2' : '已完成过该挑战，本次不重复发放奖励。');

    var box = document.createElement('div');
    box.className = 'result on';
    box.innerHTML =
      '<div class="card-r">' +
      '  <div class="verdict ' + state.outcome + '">' + label + '</div>' +
      '  <div class="sub">' + esc(ch.name) + ' · ' + esc(pC.name) + ' 对 ' + esc(eC.name) + '</div>' +
      '  <div class="stats">' +
      '    <div class="stat"><b>' + state.turn + '</b><span>回合</span></div>' +
      '    <div class="stat"><b>' + Math.round(pRatio * 100) + '%</b><span>我方剩余</span></div>' +
      '    <div class="stat"><b>' + Math.round(eRatio * 100) + '%</b><span>对手剩余</span></div>' +
      '    <div class="stat"><b>' + state.player.stat.dealt + '</b><span>累计输出</span></div>' +
      '  </div>' +
      '  <div class="key">关键事件：' + esc(keyEvent) + '</div>' +
      '  <div class="key">奖励：' + esc(reward) + '</div>' +
      '  <div class="ops">' +
      '    <button class="pxbtn gold" data-r="retry">再 战</button>' +
      '    <button class="pxbtn" data-r="collection">调整生物</button>' +
      '    <button class="pxbtn" data-r="map">返回地图</button>' +
      '    <button class="pxbtn" data-r="log">查看记录</button>' +
      '  </div>' +
      '</div>';
    (el.querySelector('.bt') || el).appendChild(box);

    var payload = {
      status: 'finished',
      resultId: 'battle_' + state.battleId,
      battleId: state.battleId,
      challengeId: ch.id,
      eraId: ch.eraId,
      creatureId: state.player.creatureId,
      opponentId: state.enemy.creatureId,
      outcome: state.outcome,
      turnCount: state.turn,
      playerHpRatio: +pRatio.toFixed(3),
      opponentHpRatio: +eRatio.toFixed(3),
      logId: state.battleId + '_log',
      returnPoint: ch.returnLocation
    };

    box.querySelectorAll('[data-r]').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.getAttribute('data-r');
        if (r === 'log') { box.remove(); openLog(); return; }
        box.remove();
        if (cfg.onFinish) cfg.onFinish(payload, r);
      });
    });
    if (cfg.onFinish) cfg.onFinish(payload, 'result_shown');
  }

  /* ================= 挂载 ================= */
  function mount(container, options) {
    root = container;
    cfg = options || {};
    state = B.Engine.createBattle({
      challengeId: cfg.challengeId,
      playerCreatureId: cfg.playerCreatureId
    });
    el = document.createElement('div');
    el.style.cssText = 'position:absolute;inset:0';
    el.innerHTML = template();
    root.appendChild(el);

    el.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        el.querySelector('[data-panel-' + b.getAttribute('data-close') + ']').classList.remove('on');
      });
    });
    el.querySelector('#bt-logbtn').addEventListener('click', function () { if (!playing) openLog(); });
    el.querySelector('#bt-exitbtn').addEventListener('click', function () {
      if (playing) return;
      B.Engine.abort(state);
      finish();
    });

    var fxCanvas = el.querySelector('#bt-fx');
    if (fxCanvas && B.FX) {
      var stage = el.querySelector('.bt-stage');
      B.FX.init(fxCanvas);
      B.FX.resize(stage.clientWidth || 1280, stage.clientHeight || 416);
    }

    refreshHUD();
    renderMoves(false);
    setFeedback(['请选择行动']);
  }

  function unmount() {
    if (B.FX) B.FX.clear();
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null; state = null; playing = false;
  }
  function getState() { return state; }

  B.BattleView = { mount: mount, unmount: unmount, state: getState };
})(window.B = window.B || {});
