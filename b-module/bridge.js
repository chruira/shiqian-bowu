/* ============================================================
 * B 模块 · 嵌入桥接（被宿主用 iframe 嵌入时启用）
 * 只在 ?embed=1 时生效；独立演示不受影响
 * ============================================================ */
(function () {
  'use strict';
  var EMBED = /(\?|&)embed=1(&|$)/.test(location.search);
  window.__B_EMBED = EMBED;
  if (!EMBED) return;

  function post(msg) {
    msg.source = 'b-module';
    try { parent.postMessage(msg, '*'); } catch (e) {}
  }

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || d.source !== 'deep-time') return;
    var B = window.B;
    if (!B) return;

    if (d.type === 'init') {
      if (Array.isArray(d.unlocks)) {
        /* 集成模式：宿主是唯一真源，清掉模块自带的演示解锁 */
        B.Adapter.demoStore.reset();
      }
      (d.unlocks || []).forEach(function (id) {
        var c = B.Creatures.byId[id];
        if (!c || c.slot) return;
        B.Adapter.unlockCreature(id, c.knowledgeIds, 'host_unlock_' + id);
      });
      if (d.eraId) B.Collection.setEra(d.eraId);
      if (d.selectedId && B.Creatures.byId[d.selectedId]) B.Adapter.selectCreature(d.selectedId);
      if (window.__onSelectChanged) window.__onSelectChanged();
      if (window.__refreshScreens) window.__refreshScreens();
      var sub = document.getElementById('t-sub');
      if (sub) sub.textContent = '档案与对战';
      /* 隐藏独立演示用的调试按钮 */
      ['btn-unlock-all', 'btn-reset'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    }
    if (d.type === 'close') {
      if (window.disposeBModule) window.disposeBModule();
    }
  });

  /* 把战斗结果与退出动作交给宿主 */
  window.__bPostResult = function (payload, action) {
    post({ type: 'battle_completed', payload: payload, action: action });
  };
  window.__bPostClose = function () { post({ type: 'close_requested' }); };

  post({ type: 'ready' });
})();
