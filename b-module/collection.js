/* ============================================================
 * B 模块 · 收藏 / 详情 / 出战选择
 * 依据：B任务交接文档 §3.1 / §3.2 / §3.3
 * ============================================================ */
(function (B) {
  'use strict';

  var el, currentEra = 'cambrian';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function h(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

  function spriteHTML(c, size) {
    size = size || 64;
    if (c && c.sprite && c.spriteReady) {
      return '<img src="' + esc(c.sprite) + '" alt="" style="width:' + size + 'px;height:' + size + 'px">';
    }
    return '<div class="silhouette" style="width:' + size + 'px;height:' + size + 'px"></div>';
  }

  var ERA_LABEL = { cambrian: '寒武纪海洋', jurassic_late: '侏罗纪晚期陆地' };

  function realCount(era) {
    return B.Creatures.byEra(era).filter(function (c) { return !c.slot; }).length;
  }
  function unlockedCount(era) {
    var s = B.Adapter.read();
    return B.Creatures.byEra(era).filter(function (c) {
      return !c.slot && s.unlocked.indexOf(c.id) >= 0;
    }).length;
  }

  function render(container) {
    el = container;
    var s = B.Adapter.read();
    var list = B.Creatures.byEra(currentEra);
    var html = '' +
'<div class="col-head">' +
'  <div class="era-tabs">' +
Object.keys(ERA_LABEL).map(function (era) {
  return '<button class="era-tab' + (era === currentEra ? ' on' : '') + '" data-era="' + era + '">' +
    ERA_LABEL[era] + '</button>';
}).join('') +
'  </div>' +
'  <div class="col-progress">本时期已解锁 ' + unlockedCount(currentEra) + ' / 5　（本时期正式生物 5 种）</div>' +
'</div>' +
'<div class="grid">' +
list.map(function (c) {
  var unlocked = s.unlocked.indexOf(c.id) >= 0;
  var selected = s.selectedCreatureId === c.id;
  var cls = 'card' + (c.slot ? ' locked' : (unlocked ? '' : ' locked')) + (selected ? ' selected' : '');
  return '<div class="' + cls + '" data-id="' + c.id + '">' +
    '<span class="no">' + String(c.slotIndex).padStart(2, '0') + '</span>' +
    (selected ? '<span class="pick">出战</span>' : '') +
    '<div class="thumb">' + spriteHTML(c, 64) + '</div>' +
    '<div class="nm">' + esc(c.name) + '</div>' +
    '<div class="ms">' + (c.slot ? '待补充' : (unlocked ? '已解锁' : '未解锁')) + '</div>' +
    '</div>';
}).join('') +
'</div>';
    el.innerHTML = html;

    el.querySelectorAll('.era-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        currentEra = b.getAttribute('data-era');
        render(el);
      });
    });
    el.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('click', function () { openDetail(card.getAttribute('data-id')); });
    });
  }

  /* ---------------- 详情 ---------------- */
  function openDetail(id) {
    var c = B.Creatures.byId[id];
    if (!c) return;
    var s = B.Adapter.read();
    var unlocked = s.unlocked.indexOf(id) >= 0;
    var basic = B.Actions[c.basicActionId], sig = B.Actions[c.signatureActionId], trait = B.Traits[c.traitId];
    var wrap = h('' +
'<div class="detail-wrap on"><div class="detail-bg"></div>' +
'<div class="detail pxbox">' +
'  <div>' +
'    <div class="sprite">' + spriteHTML(c, 128) + '</div>' +
'    <div style="text-align:center;margin-top:12px;font-size:12px;color:#7b8a7d">' +
       (c.slot ? '内容待 C 核查' : (unlocked ? '已解锁' : '未解锁')) + '</div>' +
'  </div>' +
'  <div>' +
'    <h2>' + esc(c.name) + '</h2>' +
'    <div class="sci">' + esc(c.scientificName || '（待核查）') + '　·　' + ERA_LABEL[c.eraId] +
       (c.sizeNote ? '　·　' + esc(c.sizeNote) : '') + '</div>' +
    (c.slot
      ? '<p style="color:#7b8a7d;line-height:1.9">该位置暂无正式生物。交接文档要求正式版本不得用重复动物冒充，因此保留占位。</p>'
      : '<div class="kv"><span class="k">生态角色</span><span class="v">' + esc(c.ecologyRole) + '</span></div>' +
        '<div class="kv"><span class="k">模拟 HP</span><span class="v">' + c.stats.maxHp + '</span></div>' +
        '<div class="kv"><span class="k">模拟 攻击</span><span class="v">' + c.stats.attack + '</span></div>' +
        '<div class="kv"><span class="k">模拟 防御</span><span class="v">' + c.stats.defense + '</span></div>' +
        '<div class="kv"><span class="k">模拟 速度</span><span class="v">' + c.stats.speed + '</span></div>' +
        '<div class="kv"><span class="k">模拟战力</span><span class="v">' + c.displayPower + '（游戏评分）</span></div>' +
        '<div class="tagrow">' + (c.habitatTags || []).map(function (t) { return '<span class="tag2">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="sect"><h3>本作规则</h3>' +
          (basic ? '<p><b>' + esc(basic.name) + '</b>（消耗 ' + basic.cost + '）：' + esc(basic.desc) + '</p>' : '') +
          (sig ? '<p style="margin-top:6px"><b>' + esc(sig.name) + '</b>（消耗 ' + sig.cost + '）：' + esc(sig.desc) + '</p>' : '') +
          (trait ? '<p style="margin-top:6px"><b>特性 · ' + esc(trait.name) + '</b>：' + esc(trait.desc) + '</p>' : '') +
        '</div>' +
        (trait ? '<div class="sect"><h3>阅读依据</h3><p>' + esc(trait.science || '') +
          '<span style="color:#8a978a">（' + esc((trait.source && trait.source.page) || '') + '）</span></p></div>' : '') +
        '<div class="detail-actions">' +
          '<button class="pxbtn gold" data-do="select" ' + (unlocked ? '' : 'disabled') + '>选择出战</button>' +
          '<button class="pxbtn" data-do="read">查看阅读资料</button>' +
          '<button class="pxbtn" data-do="close">返回收藏</button>' +
        '</div>'
    ) +
'  </div>' +
'</div></div>');
    document.getElementById('b-root').appendChild(wrap);

    wrap.querySelector('.detail-bg').addEventListener('click', function () { wrap.remove(); });
    wrap.querySelectorAll('[data-do]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = b.getAttribute('data-do');
        if (d === 'close') return wrap.remove();
        if (d === 'read') {
          var kid = (c.knowledgeIds || [])[0];
          var k = B.Creatures.knowledge[kid];
          if (k) alert(k.title + '（' + k.page + '）\n\n' + k.body);
          else alert('该生物的知识条目尚未接入（由 C 提供）。');
          return;
        }
        if (d === 'select') {
          var r = B.Adapter.selectCreature(id);
          wrap.remove();
          if (r.ok) { render(el); if (window.__onSelectChanged) window.__onSelectChanged(id); }
          else alert(r.why);
        }
      });
    });
  }

  B.Collection = {
    render: render,
    openDetail: openDetail,
    setEra: function (e) { currentEra = e; },
    currentEra: function () { return currentEra; }
  };
})(window.B = window.B || {});
