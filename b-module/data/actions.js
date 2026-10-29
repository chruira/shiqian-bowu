/* ============================================================
 * B 模块 · 行动与特性数据
 * 规则依据：B任务交接文档 §5 / §9
 * 通用效果只有四种：damage / guard / energy / conditionalModifier
 * ============================================================ */
(function (B) {
  'use strict';

  /* ---------------- 基础行动 ---------------- */
  var ACTIONS = {
    basic_attack: {
      id: 'basic_attack',
      name: '基础攻击',
      kind: 'attack',
      cost: 0,
      power: 6,
      desc: '造成「攻击 + 威力 − 目标防御」的伤害。',
      effects: [{ type: 'damage' }]
    },
    guard: {
      id: 'guard',
      name: '防御',
      kind: 'guard',
      cost: 0,
      absorb: 8,
      desc: '本回合不攻击，抵消本回合下一次受到的 8 点伤害（最低实际伤害为 0）。',
      effects: [{ type: 'guard' }]
    },

    /* ---------------- 寒武纪 · 特色技能 ---------------- */
    anomalocaris_grip: {
      id: 'anomalocaris_grip',
      name: '分节附肢擒抱',
      kind: 'attack',
      cost: 2,
      power: 16,
      desc: '用前端一对分节大附肢抓握目标，造成较高伤害。',
      effects: [{ type: 'damage' }]
    },
    trilobite_curl: {
      id: 'trilobite_curl',
      name: '卷曲防御',
      kind: 'attack',
      cost: 2,
      power: 8,
      desc: '卷起身体护住腹部，进攻的同时减免本回合受到的 6 点伤害。',
      effects: [{ type: 'damage' }, { type: 'guard', absorb: 6 }]
    },

    /* ---------------- 侏罗纪 · 特色技能 ---------------- */
    allosaurus_bite: {
      id: 'allosaurus_bite',
      name: '锯齿撕咬',
      kind: 'attack',
      cost: 2,
      power: 18,
      desc: '张开大嘴撕扯目标，造成高额伤害。',
      effects: [{ type: 'damage' }]
    },
    stegosaurus_tail: {
      id: 'stegosaurus_tail',
      name: '尾刺横扫',
      kind: 'attack',
      cost: 2,
      power: 15,
      desc: '挥动尾部两对长刺，造成伤害并使目标本回合攻击下降。',
      effects: [
        { type: 'damage' },
        { type: 'conditionalModifier', target: 'enemyAttack', delta: -3, duration: 'thisTurn' }
      ]
    },
    /* ---------------- 新增：寒武纪 ---------------- */
    opabinia_probe: {
      id: 'opabinia_probe',
      name: '长吻探取',
      kind: 'attack',
      cost: 2,
      power: 14,
      desc: '用带刺的长吻探刺目标，并使其本回合攻击下降 2 点。',
      effects: [
        { type: 'damage' },
        { type: 'conditionalModifier', target: 'enemyAttack', delta: -2, duration: 'thisTurn' }
      ]
    },
    wiwaxia_spines: {
      id: 'wiwaxia_spines',
      name: '硬鳞棘刺',
      kind: 'attack',
      cost: 2,
      power: 6,
      desc: '缩紧身体让背刺外张，进攻的同时减免本回合受到的 8 点伤害。',
      effects: [{ type: 'damage' }, { type: 'guard', absorb: 8 }]
    },
    marrella_dash: {
      id: 'marrella_dash',
      name: '急转突袭',
      kind: 'attack',
      cost: 2,
      power: 12,
      desc: '靠细长的步足急速变向突袭，进攻的同时减免 4 点伤害。',
      effects: [{ type: 'damage' }, { type: 'guard', absorb: 4 }]
    },

    /* ---------------- 新增：侏罗纪 ---------------- */
    diplodocus_tail: {
      id: 'diplodocus_tail',
      name: '鞭尾横扫',
      kind: 'attack',
      cost: 2,
      power: 17,
      desc: '甩动鞭状长尾横扫目标，造成较高伤害。',
      effects: [{ type: 'damage' }]
    },
    dryosaurus_dash: {
      id: 'dryosaurus_dash',
      name: '疾跑冲撞',
      kind: 'attack',
      cost: 2,
      power: 13,
      desc: '靠长后肢加速冲撞，并在回合结束时多恢复 1 点能量。',
      effects: [{ type: 'damage' }, { type: 'energy', amount: 1 }]
    },
    ceratosaurus_horn: {
      id: 'ceratosaurus_horn',
      name: '鼻角冲撞',
      kind: 'attack',
      cost: 2,
      power: 16,
      desc: '低头用鼻部骨质突起撞击目标，造成较高伤害。',
      effects: [{ type: 'damage' }]
    }
  };

  /* ---------------- 特性 ---------------- */
  /* 第一版特性只用「每回合一次、单次行动生效」这类容易核对的条件 */
  var TRAITS = {
    anomalocaris_eyes: {
      id: 'anomalocaris_eyes',
      name: '复眼锁定',
      trigger: 'once_per_turn',
      desc: '每回合第一次攻击额外造成 3 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'ownDamage', delta: 3, oncePerTurn: true }],
      science: '奇虾头部有一对突出的复眼，能帮助它在浑浊海水中锁定猎物。',
      source: { page: 'p.77', knowledgeId: 'k_anomalocaris_01' }
    },
    trilobite_shell: {
      id: 'trilobite_shell',
      name: '钙质背甲',
      trigger: 'passive',
      desc: '每回合第一次受到的攻击减少 2 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'incomingDamage', delta: -2, oncePerTurn: true }],
      science: '三叶虫的背甲由钙质构成，分为头甲、胸甲和尾甲，能提供基础防护。',
      source: { page: 'p.76', knowledgeId: 'k_trilobite_01' }
    },
    allosaurus_jaw: {
      id: 'allosaurus_jaw',
      name: '强力颌骨',
      trigger: 'once_per_turn',
      desc: '每回合第一次攻击额外造成 2 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'ownDamage', delta: 2, oncePerTurn: true }],
      science: '异特龙长有大而厚实的头骨，强有力的颌上长有锋利的锯齿状牙齿。',
      source: { page: 'p.261', knowledgeId: 'k_allosaurus_01' }
    },
    stegosaurus_plates: {
      id: 'stegosaurus_plates',
      name: '骨板缓冲',
      trigger: 'passive',
      desc: '每回合第一次受到的攻击减少 3 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'incomingDamage', delta: -3, oncePerTurn: true }],
      science: '剑龙背部有一排交错排列的菱形骨板。',
      source: { page: 'p.272', knowledgeId: 'k_stegosaurus_01' }
    },
    opabinia_eyes: {
      id: 'opabinia_eyes',
      name: '五眼视野',
      trigger: 'once_per_turn',
      desc: '每回合第一次攻击额外造成 2 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'ownDamage', delta: 2, oncePerTurn: true }],
      science: '欧巴宾海蝎头部长有 5 只眼睛，可同时察觉多个方向。',
      source: { page: 'p.73', knowledgeId: 'k_opabinia_01' }
    },
    wiwaxia_armor: {
      id: 'wiwaxia_armor',
      name: '背部硬鳞',
      trigger: 'passive',
      desc: '每回合第一次受到的攻击减少 3 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'incomingDamage', delta: -3, oncePerTurn: true }],
      science: '威瓦西亚虫背面覆盖成排硬鳞，鳞间还长有细刺。',
      source: { page: 'p.72', knowledgeId: 'k_wiwaxia_01' }
    },
    marrella_agile: {
      id: 'marrella_agile',
      name: '轻甲疾行',
      trigger: 'passive',
      desc: '每回合第一次受到的攻击减少 1 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'incomingDamage', delta: -1, oncePerTurn: true }],
      science: '马尔三叶形虫体型小、步足细长，行动灵活。',
      source: { page: 'p.74', knowledgeId: 'k_marrella_01' }
    },
    diplodocus_bulk: {
      id: 'diplodocus_bulk',
      name: '巨型身躯',
      trigger: 'passive',
      desc: '每回合第一次受到的攻击减少 2 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'incomingDamage', delta: -2, oncePerTurn: true }],
      science: '梁龙体长可达 25 米，是体型最大的恐龙之一。',
      source: { page: 'p.268', knowledgeId: 'k_diplodocus_01' }
    },
    dryosaurus_agile: {
      id: 'dryosaurus_agile',
      name: '奔跑加速',
      trigger: 'once_per_turn',
      desc: '每回合第一次攻击额外造成 3 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'ownDamage', delta: 3, oncePerTurn: true }],
      science: '橡树龙后肢长、身体轻，是善于奔跑的小型植食恐龙。',
      source: { page: 'p.278', knowledgeId: 'k_dryosaurus_01' }
    },
    ceratosaurus_horn_trait: {
      id: 'ceratosaurus_horn_trait',
      name: '鼻部骨突',
      trigger: 'once_per_turn',
      desc: '每回合第一次攻击额外造成 2 点伤害。',
      effects: [{ type: 'conditionalModifier', target: 'ownDamage', delta: 2, oncePerTurn: true }],
      science: '角鼻龙鼻部有骨质突起，可能与同类展示或辅助取食有关。',
      source: { page: 'p.260', knowledgeId: 'k_ceratosaurus_01' }
    }
  };


  B.Actions = ACTIONS;
  B.Traits = TRAITS;
})(window.B = window.B || {});
