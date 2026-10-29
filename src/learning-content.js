import {creatures, ecologyLinks, resourceNodes} from './data.js?v20261029k';
import {habitatPlans, behaviors} from './habitats.js?v20261029k';

export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeText;
const thumbnail = id => new URL(`../assets/scene-thumbnails/${id}-v4.webp`, import.meta.url).href;

const contexts = {
  cam_feeding: ['泥质觅食地', '海床表面的食物，从哪里来？', '留意贴近海床的动物、表面的微生物席，以及身体上直接参与取食的部位。', '海床 · 微生物席', '比较腹面的口器与背部长棘：哪一个与获取食物更直接相关？'],
  cam_water: ['海床上方水层', '离开海床，怎样移动和获取食物？', '把水层与海床分开看。侧叶、前附肢和长吻，提供的是不同线索。', '开阔水层 · 近海床', '能抓取，就一定能夹碎硬壳吗？先看结构，再比较解释。'],
  cam_cliff: ['海崖沉积区', '今天看到的生命，怎样成为明天的化石？', '留意沉积物、身体附肢与坚硬外骨骼。保存下来的信息可能并不完整。', '崖脚 · 沉积物', '柔软结构和坚硬结构，留下记录的机会一样吗？'],
  jur_fern: ['蕨地与林缘', '醒目的尖刺，都有同一种作用吗？', '先认出植物与林缘，再比较剑龙骨板、尾刺和另一种动物留下的损伤线索。', '低矮植物 · 林缘', '一种结构的外形，足以证明它每次都能防御成功吗？'],
  jur_river: ['河岸取食区', '怎样从结构判断食物来源？', '水源和植物提供不同资源。观察牙齿、喙与鼻角，挑出直接参与取食的结构。', '河岸 · 植物资源', '同样生活在河岸，获取食物的方式就一定相同吗？'],
  jur_forest: ['林地与古河道', '怎样把一个说法变成有依据的解释？', '把环境记录与结构证据放在一起。沿用前两站的方法，检查哪些信息支持你的解释。', '林地 · 古河道', '哪些是看见的结构，哪些是推测，还有哪些仍然不知道？']
};

/* 交接注释 V8
 * 三类环境信息：氧气与介质、空间与资源、本次对象。
 * 数值没有可靠依据时不编造；环境扫描是古环境复原的教学呈现，不是实时测量。
 * 交接注释结束 */
export function environmentFor(q) {
  const sea = q.eraId === 'cambrian';
  const [name, title, description, space, thinking] = contexts[q.sceneId];
  return {name, title, description, thinking, image: thumbnail(q.sceneId), cards: [
    {icon:'O₂', label:'氧气与介质', value:sea ? '海水中的溶解氧' : '陆地上的空气', text:sea ? '先区分水体与海床。古代具体含氧量不能从复原画面读出。' : '先区分陆地与河水。体型大小不能单独用来推断当时的氧气含量。'},
    {icon:sea ? '≈' : '⌁', label:'空间与资源', value:space, text:description},
    {icon:'◉', label:'本次观察对象', value:q.creatureIds.map(id => creatures[id].name.replace('三叶虫 Olenoides serratus','三叶虫')).join(' · '), text:sea ? '对照海床与水层，留意结构怎样帮助动物利用不同资源。' : '对照植被与水源，留意取食、移动和防御所依靠的不同结构。'}
  ], source:sea ? {label:'皇家安大略博物馆 · 古环境复原', url:'https://burgess-shale.rom.on.ca/science/the-burgess-shale/geological-background/palaeoenvironmental-setting/'} : {label:'美国国家公园管理局 · 莫里森古环境', url:'https://www.nps.gov/dino/learn/nature/morrisonformationutah.htm'}};
}

export function environmentMarkup(q) {
  const env = environmentFor(q);
  return `<section class="environment-scan"><div class="scan-heading"><span class="scan-instrument" aria-hidden="true">◎</span><div><span class="lesson-kicker">环境探测仪 / 古环境复原</span><h3>${e(env.title)}</h3><p>${e(env.description)}</p></div></div><div class="scan-landscape"><img src="${env.image}" alt="${e(env.name)}环境复原"><span class="scan-sweep" aria-hidden="true"></span><span class="scan-region region-one">① ${q.eraId==='cambrian'?'水层':'植被与林缘'}</span><span class="scan-region region-two">② ${q.eraId==='cambrian'?'海床与沉积物':'地面与水源'}</span><span class="scan-caption">观察范围示意 · 非现场测量</span></div><div class="environment-cards">${env.cards.map((card,i) => `<article class="environment-card"><span class="metric-icon" aria-hidden="true">${card.icon}</span><span class="lesson-kicker">${i+1} / ${e(card.label)}</span><h4>${e(card.value)}</h4><p>${e(card.text)}</p></article>`).join('')}</div><p class="thinking-prompt"><b>带着这个问题看：</b>${e(env.thinking)}</p><a class="lesson-source" href="${env.source.url}" target="_blank" rel="noopener noreferrer">环境资料：${env.source.label} ↗</a></section>`;
}

export function behaviorFor(q, id) {
  const resident = habitatPlans[q.sceneId]?.residents.find(r => r.id === id);
  const fallback = Object.values(habitatPlans).flatMap(p => p.residents).find(r => r.id === id);
  return behaviors[(resident || fallback)?.action];
}

/* 交接注释 V8
 * 只比较已观察的动物，至少两种才出现表格；结构线索与资源利用并列。
 * 交接注释结束 */
export function comparisonMarkup(q, observed) {
  const known = q.creatureIds.filter(id => q.observationHotspots.some(h => h.creatureId===id && observed.includes(h.evidenceId)));
  if (known.length < 2) return '';
  return `<section class="lesson-comparison"><span class="lesson-kicker">把信息放在一起看</span><h3>同样的问题，不同的线索</h3><div class="comparison-scroll"><table><thead><tr><th scope="col">观察对象</th><th scope="col">外貌与结构</th><th scope="col">与环境的联系</th></tr></thead><tbody>${known.map(id => {const c=creatures[id], facts=q.observationHotspots.filter(h=>h.creatureId===id&&observed.includes(h.evidenceId));return `<tr><th scope="row">${e(c.name)}</th><td>${e(facts.map(h=>h.label).join('、'))}</td><td>${e(c.summary)}</td></tr>`;}).join('')}</tbody></table></div></section>`;
}

export function relationMarkup(q) {
  const name=id=>creatures[id]?.name || resourceNodes[id] || id;
  return ecologyLinks.filter(l=>q.ecologyLinkIds.includes(l.id)).map(l=>`<article class="lesson-relation"><div><b>${e(name(l.from))}</b><span aria-hidden="true">${l.type==='structure_function'?'—':'⇢'}</span><b>${e(name(l.to))}</b></div><p>${e(l.description)}</p></article>`).join('');
}

/* 交接注释 V8
 * 两时期分别总结三站发现，再和今天做同维度对照。
 * 结论限于展示地区与生物，不把海陆差异全归因于年代。
 * 交接注释结束 */
export const eraSummaries = {
  cambrian: {name:'寒武纪海洋', title:'一片海床，许多种生活方式', subtitle:'你已经完成三处海洋考察。把环境、结构与留下的证据连起来。', image:'cam_water', discoveries:['口器、附肢和长吻，为讨论取食提供了不同线索。','动物利用海床与上方水层；资源来源和活动方式并不相同。','沉积与保存条件影响我们今天能看到哪些化石信息。'], comparisons:[['活动空间','海床与海床上方水层','今天的海洋仍有这些不同活动空间。'],['代表生物','威瓦西亚虫、加拿大奇虾、三叶虫等','今天海洋中的具体物种组成已经不同。'],['认识生命的方式','从化石结构重建，保留不确定性','今天还能直接观察活体，但古代行为仍需证据。']], next:'穿越时间，前往侏罗纪'},
  jurassic_late: {name:'侏罗纪晚期', title:'从河岸与林缘，读懂结构的作用', subtitle:'你已经完成三处陆地考察。回看哪些结论有依据，哪些解释仍需检验。', image:'jur_river', discoveries:['河流、植物与陆地空间，为不同动物提供资源。','牙齿、喙、尾刺与骨板，帮助回答不同类型的问题。','结构支持有范围的解释，不能推出固定天敌或每次交锋的胜负。'], comparisons:[['环境景观','展示以蕨类、针叶植物与河流为线索','今天的河岸与林地依然有资源分区，植物组成有所不同。'],['动物组成','梁龙、剑龙与其他晚侏罗世动物','这些非鸟恐龙已消失，今天的陆地动物组成不同。'],['生态联系','从取食结构讨论资源，从损伤讨论互动','今天与古代都要区分观察事实和推断。']], next:'完成旅程，回到时间地图'}
};

/* 交接注释 V8
 * V8三张真实成图：observe/collect/reason-v8.webp。文字由HTML绘制，图内无烧录文字。
 * 原始PNG和完整生成/剑龙定向编辑提示词在交接包04；手机版使用整宽3:2图。
 * 交接注释结束 */
export function tutorialMarkup() {
  return `<span class="lesson-kicker">出发前 · 三步就会玩</span><h2>带上手册，走进远古世界</h2><p class="tutorial-intro">每一站都从一个问题开始。你找到的信息，会自动留在手册里。</p><div class="tutorial-cards"><article><div class="tutorial-graphic graphic-observe"><img src="${new URL('../assets/onboarding/observe-v8.webp',import.meta.url).href}" alt="环境探测仪照亮寒武纪海床上的威瓦西亚虫与三叶虫" decoding="async"></div><span class="lesson-kicker">01 / 观察</span><h3>先看环境，再看动物</h3><p>仪器提示环境要素。点击动物，按圈注查看外貌、结构与动作。</p></article><article><div class="tutorial-graphic graphic-collect"><img src="${new URL('../assets/onboarding/collect-v8.webp',import.meta.url).href}" alt="考察手册、化石与放大镜帮助收集结构信息" decoding="async"></div><span class="lesson-kicker">02 / 收集信息</span><h3>图像和说明一起读</h3><p>点亮重点部位，查看局部放大和解释，再比较另一只动物。</p></article><article><div class="tutorial-graphic graphic-answer"><img src="${new URL('../assets/onboarding/reason-v8.webp',import.meta.url).href}" alt="剑龙图解与骨板、尾刺和环境资料卡连成证据" decoding="async"></div><span class="lesson-kicker">03 / 判断</span><h3>用线索回答问题</h3><p>带着依据作答，阅读资料卡，然后直接进入下一站。</p></article></div><p class="tutorial-controls">点击即可观察 · WASD / 方向键自由移动 · J 打开手册 · F 拍照</p><button class="lesson-primary" data-tutorial-start>开始考察 →</button>`;
}

export function eraSummaryMarkup(eraId) {
  const s=eraSummaries[eraId];
  return `<span class="lesson-kicker">时期考察完成 / ${e(s.name)}</span><h2>${e(s.title)}</h2><p>${e(s.subtitle)}</p><div class="era-recap-art"><img src="${thumbnail(s.image)}" alt="${e(s.name)}环境回顾"><div class="era-recap-nodes"><span>环境</span><i>→</i><span>结构</span><i>→</i><span>有依据的解释</span></div></div><ol class="era-discoveries">${s.discoveries.map(t=>`<li>${e(t)}</li>`).join('')}</ol><h3>和今天的环境对照</h3><div class="comparison-scroll"><table><thead><tr><th scope="col">比较维度</th><th scope="col">刚才的时期</th><th scope="col">今天</th></tr></thead><tbody>${s.comparisons.map(row=>`<tr>${row.map((t,i)=>i?`<td>${e(t)}</td>`:`<th scope="row">${e(t)}</th>`).join('')}</tr>`).join('')}</tbody></table></div><p class="lesson-footnote">回顾本次展示地区与生物，不代表同一时期全球环境完全相同。</p><button class="lesson-primary" data-era-next>${e(s.next)} →</button>`;
}
