/* ============================================================
 * B 模块 · 排行榜（模拟战力榜 + 本机挑战成绩）
 * 依据：B任务交接文档 §8
 * ------------------------------------------------------------
 * 明确标注：模拟战力是游戏评分，不是科学结论；
 * 本机成绩只存在本地，不做账号/服务器/全球排行。
 * ============================================================ */
(function (B) {
  'use strict';

  var el, tab = 'power', era = 'cambrian';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function spriteHTML(c, size) {
    size = size || 48;
    if (c && c.sprite && c.spriteReady) return '<img src="' + esc(c.sprite) + '" alt="" style="width:' + size + 'px;height:' + size + 'px">';
    return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:#2b4a58"></div>';
  }

  function render(container) {
    el = container;
    var html = '<div class="rank-wrap">' +
'<div class="era-tabs" style="margin-bottom:12px">' +
  ['cambrian', 'jurassic_late'].map(function (e) {
    return '<button class="era-tab' + (e === era ? ' on' : '') + '" data-era="' + e + '">' +
      (e === 'cambrian' ? '寒武纪海洋' : '侏罗纪晚期') + '</button>';
  }).join('') +
'</div>' +
'<div class="rank-tabs">' +
  ['power', 'attack', 'defense', 'speed', 'score'].map(function (t) {
    var label = { power: '模拟战力', attack: '攻击', defense: '防御', speed: '速度', score: '本机挑战成绩' }[t];
    return '<button class="era-tab' + (t === tab ? ' on' : '') + '" data-tab="' + t + '">' + label + '</button>';
  }).join('') +
'</div>';

    if (tab === 'score') {
      html += renderScores();
    } else {
      html += renderPower(tab);
    }
    html += '</div>';
    el.innerHTML = html;

    el.querySelectorAll('[data-era]').forEach(function (b) {
      b.addEventListener('click', function () { era = b.getAttribute('data-era'); render(el); });
    });
    el.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.getAttribute('data-tab'); render(el); });
    });
    el.querySelectorAll('.rank-row[data-id]').forEach(function (row) {
      row.addEventListener('click', function () { B.Collection.openDetail(row.getAttribute('data-id')); });
    });
  }

  function renderPower(key) {
    var s = B.Adapter.read();
    var list = B.Creatures.byEra(era).filter(function (c) { return !c.slot; });
    var map = { power: 'displayPower', attack: 'stats.attack', defense: 'stats.defense', speed: 'stats.speed' };
    function val(c) {
      if (key === 'power') return c.displayPower;
      return c.stats ? c.stats[key] : 0;
    }
    list.sort(function (a, b) { return val(b) - val(a); });
    var max = list.length ? val(list[0]) : 1;
    if (!list.length) return '<p style="color:#9fc4ce">该时期暂无已录入生物。</p>';
    return list.map(function (c, i) {
      var unlocked = s.unlocked.indexOf(c.id) >= 0;
      return '<div class="rank-row' + (unlocked ? '' : '') + '" data-id="' + c.id + '" style="cursor:pointer">' +
        '<div class="rank-no ' + (i === 0 ? 'top' : '') + '">' + (i + 1) + '</div>' +
        spriteHTML(c, 48) +
        '<div><div class="rn">' + esc(c.name) + (unlocked ? '' : ' <span style="font-size:11px;color:#8fb8c2">未解锁</span>') + '</div>' +
        '<div class="rs">' + esc(c.ecologyRole || '') + '</div></div>' +
        '<div><div class="bar2"><i style="width:' + Math.round(val(c) / max * 100) + '%"></i></div>' +
        '<div class="rs" style="margin-top:3px">模拟数值，非科学结论</div></div>' +
        '<div class="rv">' + val(c) + '</div>' +
      '</div>';
    }).join('');
  }

  function renderScores() {
    var s = B.Adapter.read();
    var recs = (s.records || []).filter(function (r) { return r.eraId === era; });
    if (!recs.length) return '<p style="color:#9fc4ce">本时期还没有挑战成绩。</p>';
    /* 排序规则：胜利优先 → 回合少优先 → 剩余血量高优先 */
    var order = { win: 0, draw: 1, lose: 2, aborted: 3 };
    recs.sort(function (a, b) {
      if (order[a.outcome] !== order[b.outcome]) return order[a.outcome] - order[b.outcome];
      if (a.turnCount !== b.turnCount) return a.turnCount - b.turnCount;
      return b.playerHpRatio - a.playerHpRatio;
    });
    return recs.slice(0, 20).map(function (r, i) {
      var pc = B.Creatures.byId[r.playerCreatureId] || { name: '?' };
      var oc = B.Creatures.byId[r.opponentId] || { name: '?' };
      var label = { win: '胜', draw: '平', lose: '负', aborted: '退出' }[r.outcome] || r.outcome;
      return '<div class="rank-row">' +
        '<div class="rank-no ' + (i === 0 ? 'top' : '') + '">' + (i + 1) + '</div>' +
        spriteHTML(pc, 48) +
        '<div><div class="rn">' + esc(pc.name) + ' vs ' + esc(oc.name) + '</div>' +
        '<div class="rs">' + esc(r.date || '') + '</div></div>' +
        '<div class="rs">结果：' + label + '　回合：' + r.turnCount + '　剩余：' +
          Math.round((r.playerHpRatio || 0) * 100) + '%</div>' +
        '<div class="rv">' + label + '</div>' +
      '</div>';
    }).join('');
  }

  B.Rankings = { render: render };
})(window.B = window.B || {});
