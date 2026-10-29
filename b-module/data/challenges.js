/* ============================================================
 * B 模块 · 关卡（挑战）配置
 * 字段依据：B任务交接文档 §9
 *   至少包含 id / eraId / opponentId / 兼容标签 / environmentId /
 *   目标 / 回合上限 / 返回位置 / 知识入口 / 奖励配置
 * ============================================================ */
(function (B) {
  'use strict';

  var CHALLENGES = [
    {
      id: 'challenge_cambrian_01',
      eraId: 'cambrian',
      name: '寒武纪 · 海底浅滩',
      opponentId: 'cam_olenoides',
      allowedTags: ['cambrian_sea'],
      environmentId: 'env_cambrian_sea',
      environment: {
        name: '寒武纪海底',
        desc: '海底软泥与微生物席铺满视野，四周漂浮着细小的颗粒。',
        note: '本关为模拟挑战，数值为游戏设定，不代表真实捕食关系。'
      },
      goal: { type: 'defeat', desc: '在 6 回合内将对手 HP 降至 0' },
      turnLimit: 6,
      returnLocation: { sceneId: 'cambrian_sea', spawnId: 'arena_exit' },
      knowledgeIds: ['k_trilobite_01', 'k_anomalocaris_01'],
      reward: { firstClearResearch: 2, badge: 'badge_cambrian_01' }
    },
    {
      id: 'challenge_jurassic_01',
      eraId: 'jurassic_late',
      name: '侏罗纪 · 苏铁林地',
      opponentId: 'jur_stegosaurus',
      allowedTags: ['jurassic_land'],
      environmentId: 'env_jurassic_land',
      environment: {
        name: '侏罗纪晚期苏铁林地',
        desc: '高大的蕨类与苏铁遮蔽了视线，地面是松软的腐殖土。',
        note: '本关为模拟挑战，数值为游戏设定，不代表真实捕食关系。'
      },
      goal: { type: 'defeat', desc: '在 6 回合内将对手 HP 降至 0' },
      turnLimit: 6,
      returnLocation: { sceneId: 'jurassic_land', spawnId: 'arena_exit' },
      knowledgeIds: ['k_stegosaurus_01', 'k_allosaurus_01'],
      reward: { firstClearResearch: 2, badge: 'badge_jurassic_01' }
    }
  ];

  var byId = {};
  CHALLENGES.forEach(function (c) { byId[c.id] = c; });

  B.Challenges = {
    list: CHALLENGES,
    byId: byId,
    byEra: function (eraId) {
      return CHALLENGES.filter(function (c) { return c.eraId === eraId; });
    }
  };
})(window.B = window.B || {});
