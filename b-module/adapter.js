/* ============================================================
 * B 模块 · 适配层
 * 依据：B任务交接文档 §10 / §11
 * ------------------------------------------------------------
 * 独立演示时使用 localStorage 的 demo 存档；
 * 集成时把 adapters 换成 A 提供的共享存档即可，B 内部不改代码。
 * ============================================================ */
(function (B) {
  'use strict';

  var DEMO_KEY = 'prehistoric-b-module-demo-v1';

  var DEFAULT = {
    schemaVersion: 1,
    unlocked: [],           // 已解锁的生物 id
    discoveredKnowledge: [],
    selectedCreatureId: null,
    selectedEraId: 'cambrian',
    clearedChallenges: [],
    records: [],            // 挑战成绩
    researchPoints: 0,
    devMode: true
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------------- demo 存档实现 ---------------- */
  var demoStore = (function () {
    var mem = null;
    function load() {
      if (mem) return mem;
      try {
        var raw = localStorage.getItem(DEMO_KEY);
        mem = raw ? JSON.parse(raw) : clone(DEFAULT);
      } catch (e) { mem = clone(DEFAULT); }
      Object.keys(DEFAULT).forEach(function (k) { if (mem[k] === undefined) mem[k] = clone(DEFAULT[k]); });
      return mem;
    }
    function save() {
      try { localStorage.setItem(DEMO_KEY, JSON.stringify(mem)); } catch (e) {}
    }
    return {
      read: function () { return clone(load()); },
      write: function (patch) { var s = load(); Object.assign(s, patch); save(); return clone(s); },
      reset: function () { mem = clone(DEFAULT); save(); return clone(mem); }
    };
  })();

  /* ---------------- 适配器（集成时由 A 注入） ---------------- */
  var adapters = {
    store: demoStore,
    /* A → B：解锁结果通知（C 通过共享系统触发） */
    onCreatureUnlocked: null,
    /* B → C：打开阅读面板 */
    openKnowledge: function (knowledgeId) {
      var k = B.Creatures.knowledge[knowledgeId];
      return k || null;
    },
    /* B → A：返回地图 */
    returnToMap: function (location) {
      // 独立演示时无地图，返回收藏
      return location || null;
    },
    currentEraId: 'cambrian'
  };

  function setAdapters(next) {
    Object.assign(adapters, next || {});
  }

  /* ---------------- 业务方法 ---------------- */
  function isUnlocked(id) { return adapters.store.read().unlocked.indexOf(id) >= 0; }

  function unlockCreature(id, knowledgeIds, eventId) {
    var s = adapters.store.read();
    if (s.unlocked.indexOf(id) >= 0) return { changed: false, state: s };   // 幂等
    var unlocked = s.unlocked.concat([id]);
    var kn = s.discoveredKnowledge.slice();
    (knowledgeIds || []).forEach(function (k) { if (kn.indexOf(k) < 0) kn.push(k); });
    var st = adapters.store.write({ unlocked: unlocked, discoveredKnowledge: kn, lastUnlockEventId: eventId });
    if (adapters.onCreatureUnlocked) adapters.onCreatureUnlocked(id, st);
    return { changed: true, state: st };
  }

  function selectCreature(id) {
    var c = B.Creatures.byId[id];
    if (!c || c.slot) return { ok: false, why: '该位置暂无正式生物' };
    if (!isUnlocked(id)) return { ok: false, why: '尚未解锁' };
    adapters.store.write({ selectedCreatureId: id, selectedEraId: c.eraId });
    return { ok: true };
  }

  function recordBattle(result) {
    var s = adapters.store.read();
    var records = s.records.slice();
    records.unshift(result);
    records = records.slice(0, 30);
    var cleared = s.clearedChallenges.slice();
    var firstClear = false;
    if (result.outcome === 'win' && cleared.indexOf(result.challengeId) < 0) {
      cleared.push(result.challengeId);
      firstClear = true;
    }
    adapters.store.write({
      records: records,
      clearedChallenges: cleared,
      researchPoints: s.researchPoints + (firstClear ? 2 : 0)
    });
    return { firstClear: firstClear };
  }

  function resetDemo() { return demoStore.reset(); }

  /* ---------------- 对 A 的接口（文档 §10） ---------------- */
  B.Adapter = {
    setAdapters: setAdapters,
    adapters: adapters,
    demoStore: demoStore,
    isUnlocked: isUnlocked,
    unlockCreature: unlockCreature,
    selectCreature: selectCreature,
    recordBattle: recordBattle,
    read: function () { return adapters.store.read(); },
    resetDemo: resetDemo
  };
})(window.B = window.B || {});
