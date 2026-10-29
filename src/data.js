export const eras={cambrian:{name:'寒武纪海洋',time:'约 5.05 亿年前',subtitle:'一片海床，藏着怎样的生活？',scene:'cam_feeding',color:'#97cfba'},jurassic_late:{name:'侏罗纪晚期',time:'约 1.5 亿年前',subtitle:'从结构出发，读懂远古陆地。',scene:'jur_fern',color:'#d1c48b'}};
export const sources={
 dk:{id:'dk',title:'DK《史前博物大百科》中文版',url:null,accessed:'2026-10-27',license:'用户提供赛事文件；本模块不再分发书籍原图，仅记录页码并作短文改写。'},
 wiw:{id:'wiw',title:'ROM · Wiwaxia corrugata',url:'https://burgess-shale.rom.on.ca/fossils/wiwaxia-corrugata/'},
 smith:{id:'smith',title:'Smith 2012 · Wiwaxia 口器研究',url:'https://pubmed.ncbi.nlm.nih.gov/22915671/'},
 olen:{id:'olen',title:'ROM · Olenoides serratus',url:'https://burgess-shale.rom.on.ca/fossils/olenoides-serratus/'},
 opa:{id:'opa',title:'ROM · Opabinia regalis',url:'https://burgess-shale.rom.on.ca/fossils/opabinia-regalis/'},
 mar:{id:'mar',title:'ROM · Marrella splendens',url:'https://burgess-shale.rom.on.ca/fossils/marrella-splendens/'},
 ano:{id:'ano',title:'AMNH · 加拿大奇虾食性研究更新（2023）',url:'https://www.amnh.org/explore/news-blogs/apex-predator-soft-diet'},
 ste:{id:'ste',title:'NHM · Stegosaurus',url:'https://www.nhm.ac.uk/discover/dino-directory/stegosaurus.html'},
 injury:{id:'injury',title:'犹他州自然历史博物馆 · 化石损伤与防御',url:'https://nhmu.utah.edu/articles/dinosaur-damage-and-defense-nhmus-collections'},
 dip:{id:'dip',title:'NHM · Diplodocus',url:'https://www.nhm.ac.uk/discover/dino-directory/diplodocus.html'},
 nps:{id:'nps',title:'NPS · Dinosaur National Monument 恐龙记录',url:'https://home.nps.gov/dino/learn/nature/dinosaurs-of-dinosaur.htm'}
};
const cam='cambrian',jur='jurassic_late';
const obs=(id,label,x,y,text)=>({id,label,x,y,text});
const rows=[
 ['cam_wiwaxia','威瓦西亚虫','Wiwaxia corrugata',cam,'加拿大，不列颠哥伦比亚；布尔吉斯页岩','底栖刮食者（推断）',72,['wiw','smith'],'嘴里的结构能告诉我们什么？',[
 obs('mouth','腹面口器',28,70,'腹面的齿列与获取食物有关；研究者据此推测它可能刮取海床表面食物。'),obs('spines','背部长棘',56,27,'长棘在背部。它们可能帮助防御，却不能单独证明吃什么。'),obs('mat','微生物席',77,84,'海床表面的微生物群落可能提供食物；这是一种有依据、仍需谨慎的解释。')],
 ['腹面口器留下了取食方式的线索。把它和背部的长棘分开看。','微生物席可能是食物来源。这里展示的是科学解释，并非亲眼看到的古代行为。'],['齿列','排成行的牙齿样结构，用来讨论如何获取食物。'],'可能刮食微生物席；长棘不是捕食证明。','食物种类与取食动作均属复原解释。'],
 ['cam_anomalocaris','加拿大奇虾','Anomalocaris canadensis',cam,'加拿大，不列颠哥伦比亚；布尔吉斯页岩','游泳捕食者（食性推断）',77,['ano'],'有刺的附肢一定能夹碎硬壳吗？',[
 obs('limb','前附肢',26,59,'前附肢参与抓取。2023年研究认为它更适于捕捉柔软的猎物。'),obs('eye','眼与游泳叶',64,44,'眼和身体侧叶有助于理解感知与游泳，但不能确定每一种猎物。')],
 ['前附肢会抓取，不表示它一定能粉碎硬壳。研究也会检验结构能承受多大的力。','较新的研究支持柔软猎物的解释。不要把所有三叶虫都画成它固定的食物。'],['生物力学','用力与运动的知识，研究生物结构能怎样工作。'],'研究更新支持柔软猎物，不能认定专吃硬壳三叶虫。','原书为奇虾属介绍；物种食性以新版研究补充。'],
 ['cam_olenoides','三叶虫 Olenoides serratus','Olenoides serratus',cam,'加拿大，不列颠哥伦比亚；布尔吉斯页岩','海床活动者；可能捕食或食腐',null,['olen'],'三叶虫的“三叶”是从哪里分的？',[
 obs('axis','中央轴叶',50,45,'中央的一条轴叶与两侧肋叶，构成从左到右的三叶。'),obs('shell','外骨骼',72,61,'硬的背部外骨骼较容易留下化石；腹面的附肢也可能在特殊条件下保存。')],
 ['“三叶”说的是横向分区。它和从前到后的头、胸、尾不是同一组划分。','这种三叶虫有保留附肢的标本，帮助我们看见硬壳之外的线索。'],['外骨骼','身体外面的支撑与保护结构。'],'中央轴叶加两侧肋叶；不能把三叶当成头胸尾。','原书未定位该物种，不能用书中其他三叶虫冒名替代。'],
 ['cam_opabinia','欧巴宾海蝎','Opabinia regalis',cam,'加拿大，不列颠哥伦比亚；布尔吉斯页岩','近海床取食者（推断）',73,['opa'],'长吻能怎样帮助获取食物？',[
 obs('nozzle','长吻末端',20,65,'长吻末端的夹状结构可能帮助拾取或抓住食物，再送向腹面的口。'),obs('eyes','五只眼',54,36,'五只眼是特别的结构线索，却不能据此列出确定的食谱。')],
 ['长吻和口的位置，可以一起帮助重建取食过程。取食动作仍是研究者的解释。','外形古怪不是证据强弱的标准。要问：哪一处结构支持了这个判断？'],['复原','根据留下的证据，重建已经消失的形态或过程。'],'长吻夹状末端可能参与取食；具体猎物未定。','保留“可能”，不指定它捕食某个展示物种。'],
 ['cam_marrella','马尔三叶形虫','Marrella splendens',cam,'加拿大，不列颠哥伦比亚；布尔吉斯页岩','有机颗粒取食者（推断）',74,['mar'],'小动物也能参与海床的物质循环吗？',[
 obs('antenna','头部触角',29,31,'触角可能帮助感知周围；不能把头部棘直接当成捕猎武器。'),obs('legs','身体附肢',61,63,'附肢结构支持游动与收集颗粒的解释，颗粒可能来自水中或沉积物。')],
 ['海床上不只有大型捕食者。小小的有机颗粒，也可能成为动物的食物。','“三叶形虫”不是说它就是三叶虫。观察结构，再核对正式名称。'],['有机碎屑','生物遗留、分解形成的碎小物质。'],'可能从水中或沉积物摄取有机颗粒。','具体食物与动作仍属生态解释。'],
 ['jur_stegosaurus','剑龙','Stegosaurus（属级）',jur,'北美，莫里森组等晚侏罗世地层','植食者',272,['ste','injury'],'骨板与尾刺的作用一样吗？',[
 obs('plates','背部骨板',47,30,'骨板的作用仍有争论，展示、识别和体温调节等解释需分别检验。'),obs('tail','尾部尖刺',83,59,'尾刺与防御有关的解释得到部分损伤化石支持，不能由此推断每次交锋的胜负。')],
 ['骨板和尾刺形状、位置不同。不要仅因为都很尖，就认定作用完全相同。','尾刺的防御解释有损伤线索支持。骨板的功能仍有多个待检验的解释。'],['假说','提出一个可用证据检验的解释；它并不等于已经确定的事实。'],'尾刺可能用于防御，骨板功能仍有争论。','目前按属级内容使用，不把某物种特征套到全属。'],
 ['jur_allosaurus','异特龙','Allosaurus（属级）',jur,'北美，莫里森组等晚侏罗世地层','肉食者',261,['nps','injury'],'受伤骨骼能证明发生过什么？',[
 obs('teeth','颌与牙齿',24,34,'颌和牙齿支持肉食生活的解释，不能说明它每次捕食的对象。'),obs('vertebra','损伤线索',66,60,'博物馆讨论的某件异特龙椎骨有损伤，可能与剑龙尾刺有关；并非每个个体都有。')],
 ['损伤的形状和位置能帮助研究互动。还要比较别的原因，保留解释的限度。','同层出土不是直接捕食证据。某件标本也不能代表所有同类的经历。'],['标本','供观察和研究的一件实物，例如一块保存下来的骨骼。'],'损伤可能支持一次防御互动，不能宣布固定胜负。','损伤热点是另附标本结构示意，不是活体自带伤口。'],
 ['jur_diplodocus','梁龙','Diplodocus（属级）',jur,'北美，莫里森组等晚侏罗世地层','植食者',268,['dip','nps'],'牙齿能提供怎样的取食线索？',[
 obs('teeth','头部与牙齿',18,36,'梁龙前部较细的牙齿，支持取下植物材料的解释，而不是像臼齿那样充分咀嚼。'),obs('neck','长颈',40,47,'长颈增加可接触的范围，但姿势与取食高度不能仅凭脖子长就确定。')],
 ['看牙齿怎样排列，再讨论怎样取下食物。体型大并不代表能吃任何植物。','长颈是结构线索，具体姿势还需要骨骼与运动研究支持。'],['植食','以植物作为主要食物来源。'],'牙齿支持获取植物材料，不直接证明只吃某一种树。','原书属级叙述；植物连线只到资源类，不指定植物物种。'],
 ['jur_ceratosaurus','角鼻龙','Ceratosaurus（属级）',jur,'北美莫里森组；属级记录也见于葡萄牙','肉食者',260,['nps'],'鼻角能单独告诉我们它吃什么吗？',[
 obs('horn','鼻部角状结构',27,27,'鼻角是识别形态的线索。单看鼻角，不能判断具体食物。'),obs('teeth','颌与牙齿',24,39,'应把颌、牙齿和其他证据一起考虑；展示中不指定它捕食某个植食者。')],
 ['鼻角很醒目，醒目却不等于最相关。讨论食性，要寻找参与获取食物的结构。','它在莫里森组有记录，不代表所有同层动物都曾与它直接交锋。'],['地层','按形成过程堆积起来的岩层，可以保存不同时间的信息。'],'判断食性应找相关结构，不能只看鼻角。','只讨论属级记录；不承诺所有展示动物在同一地点共存。'],
 ['jur_dryosaurus','橡树龙','Dryosaurus（属级）',jur,'北美，莫里森组等晚侏罗世地层','植食者',278,['nps'],'喙与后肢能回答同一个问题吗？',[
 obs('beak','头部喙',18,33,'喙与牙齿是讨论植物取食的线索，不足以确定只吃哪一种植物。'),obs('legs','后肢',55,72,'后肢是讨论行动的线索，不能直接当作食性的证据。')],
 ['头部结构适合讨论取食，后肢结构适合讨论运动。先想清问题，再挑线索。','这里按属级介绍橡树龙。不同物种与地点的记录不能随意合并。'],['证据相关性','一条线索是否真的能帮助回答眼前的问题。'],'喙和牙齿对应取食问题，后肢更多对应行动问题。','原书属级内容；不指定 Dryosaurus altus 或 elderae。']
];
export const creatures=Object.fromEntries(rows.map(r=>{const [id,name,scientificName,eraId,region,role,page,sourceIds,question,observations,reading,term,summary,uncertainty]=r;return [id,{id,name,scientificName,taxonRank:scientificName.includes('属级')?'genus':'species',eraId,environment:eraId===cam?'海洋海床及近海床水层':'陆地河岸、林缘及季节性河道（展示环境）',region,role,knowledgeId:'knowledge_'+id,question,observations,summary,uncertainty,bookPrintPage:page,reviewStatus:page?'book_and_external_checked':'external_checked_book_unlocated',reading,term,sourceIds:['dk',...sourceIds],imageType:'程序绘制的结构示意；颜色与比例不作事实证据'}];}));
export const knowledge=Object.fromEntries(Object.values(creatures).map(c=>[c.knowledgeId,{id:c.knowledgeId,title:c.name+' · 结构与证据',childReading:c.reading,terms:[{term:c.term[0],definition:c.term[1]}],reviewStatus:c.reviewStatus,bookPrintPage:c.bookPrintPage,bookPdfPage:c.bookPrintPage,sourceIds:c.sourceIds,imageType:c.imageType,imageSource:'本模块 SVG 结构示意，未使用馆藏照片',applicableCreatureIds:[c.id],uncertainty:c.uncertainty,summary:c.summary,detail:c.observations.map(o=>o.text).join(' ')}]));
knowledge.knowledge_cam_wiwaxia_feeding=knowledge.knowledge_cam_wiwaxia;
knowledge.knowledge_cam_preservation={id:'knowledge_cam_preservation',title:'海床怎样保存线索',childReading:['生物死后，身体可能腐败、散开或被其他动物取食，一些信息从此丢失。','适当的埋藏条件可能保留部分线索。后来经历地质变化，化石才有机会被发现。'],terms:[{term:'埋藏过程',definition:'生物遗骸从死亡、埋藏到保存所经历的变化，往往伴随信息丢失。'}],reviewStatus:'book_checked',bookPrintPage:36,bookPdfPage:36,sourceIds:['dk'],imageType:'保存过程概念示意；非等比例时间线',imageSource:'本模块程序绘制，不复制原书鱼类插画',applicableCreatureIds:['cam_marrella','cam_olenoides'],uncertainty:'原书本页以鱼类说明一般保存过程；不能据此断言布尔吉斯页岩所有软体化石经历了相同矿化机制。',summary:'保存条件会选择性留下部分信息，并非每个死去的动物都会形成化石。',detail:'死亡、分解、搬运和埋藏可能交叠发生；快速埋藏能减少某些破坏，仍不保证形成化石。埋藏后还会经历长期变化。示意图只帮助理解信息丢失与条件选择，不按真实时长缩放。'};
const link=(id,from,to,type,label,description,sourceIds,status='supported_interpretation')=>({id,from,to,type,label,description,sourceIds,reviewStatus:status});
export const ecologyLinks=[
 link('link_cam_mat_wiwaxia','resource_microbial_mat','cam_wiwaxia','food_source','可能的食物来源','口器结构与对比支持刮食微生物席的解释，不是直接观察到的行为。',['wiw','smith']),
 link('link_cam_detritus_marrella','resource_detritus','cam_marrella','food_source','可能摄取颗粒','可能从水中或沉积物摄取有机颗粒。',['mar']),
 link('link_cam_soft_anomalocaris','resource_soft_prey','cam_anomalocaris','predation_inferred','可能的捕食来源','2023年结构与力学研究支持柔软猎物；不指定三叶虫物种。',['ano']),
 link('link_cam_opabinia_structure','cam_opabinia','structure_proboscis','structure_function','可能的取食工具','夹状末端可能用于获取食物；没有指定猎物。',['opa']),
 link('link_cam_olenoides_shell','cam_olenoides','structure_exoskeleton','structure_function','外骨骼结构','背部外骨骼与腹面附肢是不同结构。',['olen'],'checked'),
 link('link_jur_plants_stegosaurus','resource_plants','jur_stegosaurus','food_source','植物资源','属级植食关系，未指定植物物种。',['ste'],'checked'),
 link('link_jur_stegosaurus_defense','jur_stegosaurus','jur_allosaurus','defense_interpretation','可能的防御互动','某件异特龙椎骨损伤与尾刺有关的解释；不代表固定天敌或胜负。',['injury']),
 link('link_jur_plants_diplodocus','resource_plants','jur_diplodocus','food_source','植物资源','属级植食关系；不指定高度或植物物种。',['dip'],'checked'),
 link('link_jur_plants_dryosaurus','resource_plants','jur_dryosaurus','food_source','植物资源','属级植食关系，不能与后肢形态混为同一条证据。',['nps'],'checked'),
 link('link_jur_ceratosaurus_teeth','jur_ceratosaurus','structure_carnivorous_jaw','structure_function','颌与牙齿线索','支持肉食生活；不列出具体猎物。',['dk','nps'],'checked')
];
export const resourceNodes={resource_microbial_mat:'微生物席 · 可能的生产基础',resource_detritus:'有机碎屑',resource_soft_prey:'未定柔软猎物',resource_plants:'植物资源',structure_proboscis:'长吻夹状末端',structure_exoskeleton:'背部外骨骼',structure_carnivorous_jaw:'颌与牙齿'};
export const ecosystemContext={cambrian:['微生物等生产基础','动物摄取资源','遗留物进入碎屑','微生物分解与物质循环'],jurassic_late:['植物生产基础','植食与其他食物来源','遗留物进入土壤','分解与物质循环'],note:'这是生态循环的概念背景，不是全部物种与关系均已核实的完整食物网。'};
const option=(id,text,correct,feedback)=>({id,text,correct,feedback});
const q=(id,eraId,sceneId,creatureIds,title,question,template,requiredEvidence,options,linkIds,prerequisiteIds=[])=>({id,eraId,sceneId,creatureIds,title,question,template,stages:['observe','judge','result'],observationHotspots:creatureIds.flatMap(id=>creatures[id].observations.map(o=>({...o,creatureId:id,evidenceId:id+':'+o.id}))),options,knowledgeIds:creatureIds.map(id=>creatures[id].knowledgeId),completionConditions:{requiredEvidence,correctJudgment:true,correctEvidence:true},unlockCreatureIds:creatureIds,ecologyLinkIds:linkIds,prerequisiteIds,noteId:'note_'+id});
export const quests=[
 q('quest_cam_feeding_01',cam,'cam_feeding',['cam_wiwaxia','cam_marrella'],'威瓦西亚虫的食物来自哪里','哪条线索更能帮助判断威瓦西亚虫获取食物的方式？','observe',['cam_wiwaxia:mouth','cam_wiwaxia:spines','cam_wiwaxia:mat'],[
 option('mouth','腹面口器的齿列',true,'口器直接参与取食，因此比背棘更相关。它支持可能刮食微生物席的解释。'),option('spines','背部长棘很尖',false,'长棘可能与防御有关。回到腹面口器，寻找与取食直接有关的线索。'),option('size','它的颜色和体型',false,'示意图颜色不是化石证据；体型也不能单独说明取食方式。')],['link_cam_mat_wiwaxia','link_cam_detritus_marrella']),
 q('quest_cam_compare_02',cam,'cam_water',['cam_anomalocaris','cam_olenoides','cam_opabinia'],'有刺，就能夹碎硬壳吗','对照前附肢、三叶虫外骨骼与长吻，哪一种解释更谨慎？','compare',['cam_anomalocaris:limb','cam_olenoides:shell','cam_opabinia:nozzle'],[
 option('soft','结构研究支持加拿大奇虾可能捕捉柔软猎物',true,'有刺不等于能夹碎硬壳；欧巴宾海蝎的长吻也不能证明它吃哪一种三叶虫。'),option('fixed','这些动物肯定是固定天敌',false,'共处一个时期不证明直接捕食。请查看前附肢研究更新。'),option('all','所有奇虾类都吃相同食物',false,'这里核对的是加拿大奇虾，不能推广到整个类群。')],['link_cam_soft_anomalocaris','link_cam_opabinia_structure','link_cam_olenoides_shell'],['quest_cam_feeding_01']),
 q('quest_cam_burial_03',cam,'cam_cliff',['cam_marrella','cam_olenoides'],'海床如何留下线索','从死亡到化石被发现，怎样重建这个过程？','reconstruct',['cam_marrella:legs','cam_olenoides:shell'],[],[],['quest_cam_compare_02']),
 q('quest_jur_structure_01',jur,'jur_fern',['jur_stegosaurus','jur_allosaurus'],'骨板与尾刺，一样吗','哪种说法正确区分了结构和证据的限度？','compare',['jur_stegosaurus:plates','jur_stegosaurus:tail','jur_allosaurus:vertebra'],[
 option('different','尾刺可能防御；骨板功能仍有争论',true,'尾刺的防御解释有部分损伤线索。骨板有多个解释，不能给一次交锋判胜负。'),option('armor','骨板和尾刺都是已经证实的盾牌',false,'骨板功能尚未确定。请比较背部骨板和尾部尖刺。'),option('win','有尾刺，所以剑龙每次都能获胜',false,'结构线索不能确定每一次互动的结果。')],['link_jur_plants_stegosaurus','link_jur_stegosaurus_defense']),
 q('quest_jur_feeding_02',jur,'jur_river',['jur_diplodocus','jur_dryosaurus','jur_ceratosaurus'],'牙齿、喙与鼻角','判断怎样获取食物，哪组结构更相关？','observe',['jur_diplodocus:teeth','jur_dryosaurus:beak','jur_ceratosaurus:teeth'],[
 option('jaw','比较牙齿与喙，再结合其他资料',true,'这些结构直接参与获取或处理食物；仍不能确定具体植物或猎物。'),option('horn','只看鼻角和腿的长度',false,'鼻角与后肢不能单独回答食性问题。回看颌与牙齿。'),option('same','同层出土就说明互相捕食',false,'地层记录与直接取食证据不同，不能直接画捕食线。')],['link_jur_plants_diplodocus','link_jur_plants_dryosaurus','link_jur_ceratosaurus_teeth'],['quest_jur_structure_01']),
 q('quest_jur_rebuild_03',jur,'jur_forest',['jur_stegosaurus','jur_diplodocus','jur_dryosaurus'],'把解释交给证据','怎样把一个有关生态的说法变成谨慎的科学解释？','reconstruct',['jur_stegosaurus:plates','jur_diplodocus:teeth','jur_dryosaurus:beak'],[],[],['quest_jur_feeding_02'])
];
// Comparing Marrella is available as further reading; it is not a gate for Wiwaxia's feeding question.
for(const quest of quests){quest.correctEvidenceId=quest.completionConditions.requiredEvidence[0];quest.notebookSummary=quest.creatureIds.map(id=>creatures[id].summary).join(' ');}
quests[1].correctEvidenceId='cam_anomalocaris:limb';quests[3].correctEvidenceId='jur_stegosaurus:tail';
quests[2].reconstruction=[{id:'death',text:'生物死亡，软组织开始腐败，信息逐渐丢失。'},{id:'burial',text:'在适当条件下被沉积物覆盖，部分信息得以保存。'},{id:'rock',text:'经历漫长的地质变化，后来岩层暴露，化石被发现。'}];
quests[2].reconstructionNote='简化的保存过程示意，不按比例表示时间；快速埋藏可在死亡后早期发生，不保证一定形成化石。';
quests[2].knowledgeIds.push('knowledge_cam_preservation');
quests[5].reconstruction=[{id:'observe',text:'记录观察到的结构，并核对物种、时代和地点。'},{id:'compare',text:'对照相关资料，比较支持或反对解释的证据。'},{id:'limit',text:'提出有依据的解释，同时注明还不知道什么。'}];
quests[5].reconstructionNote='科学推理的教学步骤，可以返回前一步修正，不是古生物行为模拟。';
export const questById=Object.fromEntries(quests.map(q=>[q.id,q]));
export const roster={targetTotal:20,targetPerEra:10,configuredTotal:10,remainingUnconfirmed:10,creatures:Object.keys(creatures),draftSlots:Array.from({length:10},(_,i)=>({id:'draft_slot_'+(i+1),eraId:i<5?cam:jur,status:'draft',name:null,countedAsCompleted:false}))};
