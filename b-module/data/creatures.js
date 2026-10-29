/* ============================================================
 * B 模块 · 生物数据
 * 字段依据：B任务交接文档 §9
 * ------------------------------------------------------------
 * 1. scienceStatus：draft = 待 C 核查；verified = 已核查
 * 2. slot:true 是「20 个位置」的占位，不计入已完成数量
 * 3. 立绘：64×64 透明底 PNG，侧面朝右
 * 4. stats 是游戏模拟数值，不是科学结论
 * ============================================================ */
(function (B) {
  'use strict';

  var CREATURES = [
    /* ================= 寒武纪海洋 ================= */
    {
      id: 'cam_anomalocaris', eraId: 'cambrian', slotIndex: 1,
      name: '加拿大奇虾', scientificName: 'Anomalocaris canadensis',
      scienceStatus: 'draft',
      sprite: 'assets/px/cam_anomalocaris.png', spriteReady: true, sprBox: { t: 0.453, b: 0.969 },
      sizeNote: '体长可达 1 米',
      ecologyRole: '寒武纪海洋中体型最大的捕食者之一',
      habitatTags: ['cambrian_sea'],
      stats: { maxHp: 108, attack: 22, defense: 6, speed: 12, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'anomalocaris_grip',
      traitId: 'anomalocaris_eyes', knowledgeIds: ['k_anomalocaris_01'],
      displayPower: 118
    },
    {
      id: 'cam_olenoides', eraId: 'cambrian', slotIndex: 2,
      name: '三叶虫', scientificName: 'Olenoides serratus',
      scienceStatus: 'draft',
      sprite: 'assets/px/cam_olenoides.png', spriteReady: true, sprBox: { t: 0.625, b: 0.969 },
      sizeNote: '体长约 2～7 厘米',
      ecologyRole: '寒武纪海底常见的底栖节肢动物',
      habitatTags: ['cambrian_sea'],
      stats: { maxHp: 126, attack: 16, defense: 12, speed: 7, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'trilobite_curl',
      traitId: 'trilobite_shell', knowledgeIds: ['k_trilobite_01'],
      displayPower: 96
    },
    {
      id: 'cam_opabinia', eraId: 'cambrian', slotIndex: 3,
      name: '欧巴宾海蝎', scientificName: 'Opabinia regalis',
      scienceStatus: 'draft',
      sprite: 'assets/px/cam_opabinia.png', spriteReady: true, sprBox: { t: 0.531, b: 0.969 },
      sizeNote: '体长约 4～7 厘米',
      ecologyRole: '寒武纪海底的小型底栖动物，长吻可能用于探取食物',
      habitatTags: ['cambrian_sea'],
      stats: { maxHp: 96, attack: 15, defense: 8, speed: 10, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'opabinia_probe',
      traitId: 'opabinia_eyes', knowledgeIds: ['k_opabinia_01'],
      displayPower: 90
    },
    {
      id: 'cam_wiwaxia', eraId: 'cambrian', slotIndex: 4,
      name: '威瓦西亚虫', scientificName: 'Wiwaxia corrugata',
      scienceStatus: 'draft',
      sprite: 'assets/px/cam_wiwaxia.png', spriteReady: true, sprBox: { t: 0.578, b: 0.969 },
      sizeNote: '体长约 3～5 厘米',
      ecologyRole: '寒武纪海底身披硬鳞的底栖动物',
      habitatTags: ['cambrian_sea'],
      stats: { maxHp: 118, attack: 14, defense: 14, speed: 5, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'wiwaxia_spines',
      traitId: 'wiwaxia_armor', knowledgeIds: ['k_wiwaxia_01'],
      displayPower: 88
    },
    {
      id: 'cam_marrella', eraId: 'cambrian', slotIndex: 5,
      name: '马尔三叶形虫', scientificName: 'Marrella splendens',
      scienceStatus: 'draft',
      sprite: 'assets/px/cam_marrella.png', spriteReady: true, sprBox: { t: 0.328, b: 0.969 },
      sizeNote: '体长约 2 厘米',
      ecologyRole: '寒武纪海底数量众多的小型节肢动物',
      habitatTags: ['cambrian_sea'],
      stats: { maxHp: 92, attack: 14, defense: 7, speed: 14, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'marrella_dash',
      traitId: 'marrella_agile', knowledgeIds: ['k_marrella_01'],
      displayPower: 84
    },

    /* ================= 侏罗纪晚期陆地 ================= */
    {
      id: 'jur_allosaurus', eraId: 'jurassic_late', slotIndex: 1,
      name: '异特龙', scientificName: 'Allosaurus',
      scienceStatus: 'draft',
      sprite: 'assets/px/jur_allosaurus.png', spriteReady: true, sprBox: { t: 0.453, b: 0.969 },
      sizeNote: '体长约 8.5 米',
      ecologyRole: '侏罗纪晚期数量众多的兽脚类掠食者',
      habitatTags: ['jurassic_land'],
      stats: { maxHp: 100, attack: 26, defense: 7, speed: 11, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'allosaurus_bite',
      traitId: 'allosaurus_jaw', knowledgeIds: ['k_allosaurus_01'],
      displayPower: 124
    },
    {
      id: 'jur_stegosaurus', eraId: 'jurassic_late', slotIndex: 2,
      name: '剑龙', scientificName: 'Stegosaurus',
      scienceStatus: 'draft',
      sprite: 'assets/px/jur_stegosaurus.png', spriteReady: true, sprBox: { t: 0.484, b: 0.969 },
      sizeNote: '体长约 9 米',
      ecologyRole: '侏罗纪晚期的大型植食性鸟臀类恐龙',
      habitatTags: ['jurassic_land'],
      stats: { maxHp: 132, attack: 18, defense: 14, speed: 6, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'stegosaurus_tail',
      traitId: 'stegosaurus_plates', knowledgeIds: ['k_stegosaurus_01'],
      displayPower: 104
    },
    {
      id: 'jur_diplodocus', eraId: 'jurassic_late', slotIndex: 3,
      name: '梁龙', scientificName: 'Diplodocus',
      scienceStatus: 'draft',
      sprite: 'assets/px/jur_diplodocus.png', spriteReady: true, sprBox: { t: 0.562, b: 0.969 },
      sizeNote: '体长约 25 米',
      ecologyRole: '侏罗纪晚期的大型植食性蜥脚类恐龙',
      habitatTags: ['jurassic_land'],
      stats: { maxHp: 148, attack: 20, defense: 10, speed: 5, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'diplodocus_tail',
      traitId: 'diplodocus_bulk', knowledgeIds: ['k_diplodocus_01'],
      displayPower: 112
    },
    {
      id: 'jur_dryosaurus', eraId: 'jurassic_late', slotIndex: 4,
      name: '橡树龙', scientificName: 'Dryosaurus',
      scienceStatus: 'draft',
      sprite: 'assets/px/jur_dryosaurus.png', spriteReady: true, sprBox: { t: 0.422, b: 0.969 },
      sizeNote: '体长约 3 米',
      ecologyRole: '侏罗纪晚期的小型植食性鸟脚类恐龙',
      habitatTags: ['jurassic_land'],
      stats: { maxHp: 96, attack: 16, defense: 8, speed: 13, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'dryosaurus_dash',
      traitId: 'dryosaurus_agile', knowledgeIds: ['k_dryosaurus_01'],
      displayPower: 86
    },
    {
      id: 'jur_ceratosaurus', eraId: 'jurassic_late', slotIndex: 5,
      name: '角鼻龙', scientificName: 'Ceratosaurus',
      scienceStatus: 'draft',
      sprite: 'assets/px/jur_ceratosaurus.png', spriteReady: true, sprBox: { t: 0.391, b: 0.969 },
      sizeNote: '体长约 6 米',
      ecologyRole: '侏罗纪晚期中型兽脚类掠食者，鼻部有骨质突起',
      habitatTags: ['jurassic_land'],
      stats: { maxHp: 104, attack: 24, defense: 8, speed: 10, maxEnergy: 3 },
      basicActionId: 'basic_attack', signatureActionId: 'ceratosaurus_horn',
      traitId: 'ceratosaurus_horn_trait', knowledgeIds: ['k_ceratosaurus_01'],
      displayPower: 106
    }
  ];

  /* 名单已定稿：两个时期各 5 种，共 10 种正式生物，不再生成占位。 */

  /* ---------------- 知识条目（内容由 C 提供并核查） ---------------- */
  var KNOWLEDGE = {
    k_anomalocaris_01: {
      id: 'k_anomalocaris_01', title: '分节附肢与复眼',
      body: '奇虾头前有一对向下弯曲的分节大附肢，每一节下侧都长有刺状突起；头部还有一对突出的复眼。',
      page: 'p.77', source: '《DK史前博物大百科》'
    },
    k_trilobite_01: {
      id: 'k_trilobite_01', title: '三叶虫的背甲',
      body: '三叶虫的背甲分为头甲、胸甲和尾甲，头部两侧长着一对月牙形复眼，胸部由多节组成。',
      page: 'p.76', source: '《DK史前博物大百科》'
    },
    k_opabinia_01: {
      id: 'k_opabinia_01', title: '五只眼与长吻',
      body: '欧巴宾海蝎身体前端有一根细长的管状吻，末端带刺；头部长有 5 只眼睛，其中 2 只长在眼柄上。',
      page: 'p.73', source: '《DK史前博物大百科》'
    },
    k_wiwaxia_01: {
      id: 'k_wiwaxia_01', title: '背部硬鳞',
      body: '威瓦西亚虫身体背面覆盖着成排的硬鳞，鳞片之间还长有细长的刺，腹面柔软。',
      page: 'p.72', source: '《DK史前博物大百科》'
    },
    k_marrella_01: {
      id: 'k_marrella_01', title: '头部的四根长刺',
      body: '马尔三叶形虫头甲向后伸出四根长刺，身体小、步足细长，在寒武纪海底十分常见。',
      page: 'p.74', source: '《DK史前博物大百科》'
    },
    k_allosaurus_01: {
      id: 'k_allosaurus_01', title: '异特龙的头骨与牙齿',
      body: '异特龙长有大而厚实的头骨，强有力的颌上长有锋利的锯齿状牙齿，前肢有三根较大的利爪。',
      page: 'p.261', source: '《DK史前博物大百科》'
    },
    k_stegosaurus_01: {
      id: 'k_stegosaurus_01', title: '剑龙的骨板与尾刺',
      body: '剑龙背部有一排交错排列的菱形骨板，尾部末端有两对长刺，每根长达 1 米。',
      page: 'p.272', source: '《DK史前博物大百科》'
    },
    k_diplodocus_01: {
      id: 'k_diplodocus_01', title: '长颈与鞭状尾',
      body: '梁龙有很长的颈部和鞭状的长尾，四肢粗壮，以植物为食。',
      page: 'p.268', source: '《DK史前博物大百科》'
    },
    k_dryosaurus_01: {
      id: 'k_dryosaurus_01', title: '轻巧的鸟脚类',
      body: '橡树龙是小型鸟脚类恐龙，后肢长、善于奔跑，前肢较短，以植物为食。',
      page: 'p.278', source: '《DK史前博物大百科》'
    },
    k_ceratosaurus_01: {
      id: 'k_ceratosaurus_01', title: '鼻部的骨质突起',
      body: '角鼻龙鼻部上方有隆起的骨质突起，头骨较大，颌上长有弯曲的牙齿，前肢较短。',
      page: 'p.260', source: '《DK史前博物大百科》'
    }
  };

  var byId = {};
  CREATURES.forEach(function (c) { byId[c.id] = c; });

  B.Creatures = {
    list: CREATURES,
    byId: byId,
    knowledge: KNOWLEDGE,
    real: function () { return CREATURES.filter(function (c) { return !c.slot; }); },
    byEra: function (eraId) {
      return CREATURES.filter(function (c) { return c.eraId === eraId; })
        .sort(function (a, b) { return a.slotIndex - b.slotIndex; });
    },
    eraLabel: function (eraId) {
      return eraId === 'cambrian' ? '寒武纪海洋'
        : (eraId === 'jurassic_late' ? '侏罗纪晚期陆地' : eraId);
    }
  };
})(window.B = window.B || {});
