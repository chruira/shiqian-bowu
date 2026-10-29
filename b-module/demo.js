/* ============================================================
 * B 模块 · 独立演示入口与对外接口
 * 依据：B任务交接文档 §10「B向A提供的最小操作」
 * ============================================================ */
(function (B) {
  'use strict';

  var host = document.getElementById('battle-host');
  var screens = {
    collection: document.getElementById('screen-collection'),
    challenge: document.getElementById('screen-challenge'),
    rank: document.getElementById('screen-rank')
  };
  var current = 'collection';
  var battleMounted = false;

  function toast(t) {
    var el = document.getElementById('toast');
    el.textContent = t; el.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('on'); }, 1900);
  }

  function refreshChips() {
    var s = B.Adapter.read();
    document.getElementById('chip-unlocked').textContent = '已解锁 ' + s.unlocked.length;
    document.getElementById('chip-research').textContent = '研究点 ' + s.researchPoints;
    var sel = s.selectedCreatureId ? B.Creatures.byId[s.selectedCreatureId] : null;
    document.getElementById('nav-hint').textContent = sel ? ('当前出战：' + sel.name) : '尚未选择出战生物';
  }

  function show(which) {
    current = which;
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('on', k === which);
    });
    if (which === 'collection') B.Collection.render(screens.collection);
    if (which === 'challenge') renderChallenges();
    if (which === 'rank') B.Rankings.render(screens.rank);
    refreshChips();
  }

  /* ---------------- 挑战列表 ---------------- */
  function renderChallenges() {
    var s = B.Adapter.read();
    var sel = s.selectedCreatureId ? B.Creatures.byId[s.selectedCreatureId] : null;
    var html = '<div class="chal-list">';
    B.Challenges.list.forEach(function (ch) {
      var opp = B.Creatures.byId[ch.opponentId];
      var compatible = sel && sel.eraId === ch.eraId &&
        ch.allowedTags.some(function (t) { return (sel.habitatTags || []).indexOf(t) >= 0; });
      html += '<div class="chal">' +
        '<div class="art">' + spriteMini(opp) + '</div>' +
        '<div class="info">' +
          '<h3>' + ch.name + '</h3>' +
          '<p>对手：' + opp.name + '　·　环境：' + ch.environment.name + '<br>' +
          ch.environment.desc + '<br>' +
          '<span style="color:#a3492f">' + ch.goal.desc + '（回合上限 ' + ch.turnLimit + '）</span></p>' +
          '<p style="color:#8a978a;font-size:12px;margin-top:4px">' + ch.environment.note + '</p>' +
        '</div>' +
        '<div class="side">' +
          '<div class="sel">出战：' + (compatible ? sel.name : (sel ? '时期不匹配' : '未选择')) + '</div>' +
          '<button class="pxbtn gold" data-ch="' + ch.id + '" ' + (compatible ? '' : 'disabled') + '>开始挑战</button>' +
        '</div>' +
      '</div>';
    });
    html += '<p style="font-size:12px;color:#8fb8c2;letter-spacing:.06em">' +
      '说明：本模块的数值与胜负均为游戏模拟，不代表真实古生物之间的强弱或捕食关系。' +
      '科学内容由 C 核查后接入。</p>';
    html += '</div>';
    screens.challenge.innerHTML = html;

    screens.challenge.querySelectorAll('[data-ch]').forEach(function (b) {
      b.addEventListener('click', function () {
        startChallenge({ challengeId: b.getAttribute('data-ch') });
      });
    });
  }

  function spriteMini(c) {
    if (c && c.sprite && c.spriteReady) return '<img src="' + c.sprite + '" alt="" style="width:72px;height:72px">';
    return '<div style="width:56px;height:56px;border-radius:50%;background:#2b4a58"></div>';
  }

  /* ---------------- 启动挑战 ---------------- */
  function startChallenge(opts) {
    if (battleMounted) return;
    var s = B.Adapter.read();
    var playerId = opts.playerCreatureId || s.selectedCreatureId;
    if (!playerId) { toast('请先在档案里选择出战的生物'); return; }
    var ch = B.Challenges.byId[opts.challengeId];
    if (!ch) { toast('未知挑战'); return; }

    Object.keys(screens).forEach(function (k) { screens[k].classList.remove('on'); });
    document.getElementById('nav').style.display = 'none';
    var topbar = document.querySelector('.b-top');
    if (topbar && topbar.parentNode) { window.__topbarHTML = topbar.outerHTML; topbar.parentNode.removeChild(topbar); }
    host.style.display = 'block';
    host.innerHTML = '';
    battleMounted = true;
    /* 强制重绘：避免隐藏层残影 */
    var rEl = document.getElementById('b-root');
    rEl.style.opacity='0.999';
    void rEl.offsetHeight;
    requestAnimationFrame(function(){ rEl.style.opacity=''; });

    B.BattleView.mount(host, {
      challengeId: ch.id,
      playerCreatureId: playerId,
      onFinish: function (payload, action) {
        /* result_shown 只是对外通知（给 A 模块），不能销毁战斗界面 */
        if (action === 'result_shown') {
          if (window.__bPostResult) window.__bPostResult(payload, 'result_shown');
          return;
        }
        battleMounted = false;
        host.style.display = 'none';
        host.innerHTML = '';
        B.BattleView.unmount();
        document.getElementById('nav').style.display = 'flex';
        if (window.__B_EMBED) {
          if (window.__bPostResult) window.__bPostResult(payload, action);
          if (action === 'map' && window.__bPostClose) window.__bPostClose();
        }
        if (window.__topbarHTML && !document.querySelector('.b-top')) {
          document.getElementById('b-root').insertAdjacentHTML('afterbegin', window.__topbarHTML);
        }
        if (action === 'retry') {
          startChallenge({ challengeId: ch.id, playerCreatureId: playerId });
        } else if (action === 'collection') {
          show('collection');
        } else if (action === 'map') {
          toast('已请求返回地图（由 A 模块接管返回位置）');
          show('challenge');
        } else {
          show('challenge');
        }
      }
    });
  }

  /* ---------------- 演示用：模拟 C 的解锁事件 ---------------- */
  function simulateUnlockAll() {
    var ids = B.Creatures.real().map(function (c) { return c.id; });
    var changed = [];
    ids.forEach(function (id, i) {
      var c = B.Creatures.byId[id];
      var r = B.Adapter.unlockCreature(id, c.knowledgeIds, 'demo_unlock_' + id);
      if (r.changed) changed.push(c.name);
    });
    // 演示便利：若无出战选择，自动选中当前时期的第一个正式生物
    var st = B.Adapter.read();
    if (!st.selectedCreatureId) {
      var era = B.Collection.currentEra();
      var first = B.Creatures.byEra(era).filter(function (c) { return !c.slot; })[0];
      if (first) B.Adapter.selectCreature(first.id);
    }
    refreshChips();
    toast(changed.length ? ('模拟调查完成：解锁 ' + changed.length + ' 种生物') : '已全部解锁');
    show(current);
  }

  /* ---------------- 对 A 的接口（§10） ---------------- */
  window.mountBModule = function (container, adapters) {
    B.Adapter.setAdapters(adapters || {});
    if (container) {
      container.appendChild(document.getElementById('b-root'));
    }
    show('collection');
  };
  window.openCollection = function (opts) {
    if (opts && opts.eraId) B.Collection.setEra(opts.eraId);
    show('collection');
  };
  window.openCreature = function (opts) {
    show('collection');
    if (opts && opts.creatureId) B.Collection.openDetail(opts.creatureId);
  };
  window.startChallenge = startChallenge;
  window.disposeBModule = function () {
    if (battleMounted) { B.BattleView.unmount(); battleMounted = false; }
    host.style.display = 'none';
  };

  /* ---------------- 事件绑定 ---------------- */
  document.querySelectorAll('[data-nav]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-nav')); });
  });
  document.getElementById('btn-unlock-all').addEventListener('click', simulateUnlockAll);
  document.getElementById('btn-reset').addEventListener('click', function () {
    if (!confirm('清空本次演示的全部存档（解锁、选择、战绩）？')) return;
    B.Adapter.resetDemo();
    refreshChips(); show(current);
    toast('演示存档已清空');
  });

  window.__onSelectChanged = function () { refreshChips(); };
  window.__refreshScreens = function () { show(current); };

  /* ---------------- 自适应 ---------------- */
  var root = document.getElementById('b-root');
  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 704);
    /* 整数倍缩放：避免非整数缩放把像素字/像素图糊掉 */
    if (s >= 2) s = 2; else if (s >= 1) s = 1;
    root.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit); fit();

  if (window.__B_EMBED) {
    ['btn-unlock-all', 'btn-reset'].forEach(function (id) {
      var b = document.getElementById(id); if (b) b.style.display = 'none';
    });
  }

  /* ---------------- 首次进入 ---------------- */
  show('collection');
})(window.B = window.B || {});
