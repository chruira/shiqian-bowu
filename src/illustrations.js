import {albumArt} from './album-art.js?v20261029k';
const file=n=>new URL(`../assets/supplied-latest/16-bit复古RPG寒武纪海底觅食地像素图生成 (${n}).png`,import.meta.url).href;
/* 交接注释 V8
 * 观察与阅读映射，不等于地图透明精灵或收藏日志映射。
 * 角鼻龙、马尔三叶形虫、欧巴宾海蝎使用albumArt已有生态画；地图仍从creature-art.js读取。
 * 交接注释结束 */
export const illustrations={
 cam_anomalocaris:{number:14,url:file(14),label:'加拿大奇虾外观复原参考',note:'用户生成图；物种细节待最终审校，食性不能由这张外观图确定。'},
 cam_olenoides:{number:15,url:file(15),label:'三叶虫类外观参考',note:'未核定为 Olenoides serratus，不用它判定该物种的胸节数或三叶分区。'},
 cam_wiwaxia:{number:17,url:file(17),label:'威瓦西亚虫外观复原参考',note:'背棘与表面骨片可作外观参考。腹面口器在此视角不可见，请在下方结构图观察。'},
 jur_allosaurus:{number:19,url:file(19),label:'异特龙外观复原参考',note:'属级外观参考，颜色与姿态不作证据；损伤椎骨在结构近景中另附。'},
 jur_stegosaurus:{number:20,url:file(20),label:'剑龙外观复原参考',note:'骨板与尾刺的位置可作外观参考，不能仅据复原图确定功能。'},
 jur_diplodocus:{number:21,url:file(21),label:'梁龙外观复原参考',note:'属级外观参考，颈部姿态与颜色不是化石直接证据。'},
 jur_dryosaurus:{number:22,url:file(22),label:'橡树龙外观复原参考',note:'属级外观参考，局部喙与牙齿需要配合结构示意阅读。'},
 jur_ceratosaurus:{url:albumArt.jur_ceratosaurus.url,label:'角鼻龙生态与外貌复原',frame:{x:0,y:0,width:320,height:240},note:'沿用物种档案中的生态插画，配合结构资料阅读。'},
 cam_marrella:{url:albumArt.cam_marrella.url,label:'马尔三叶形虫生态与外貌复原',frame:{x:0,y:0,width:320,height:240},note:'沿用物种档案中的生态插画，配合附肢与触角资料阅读。'},
 cam_opabinia:{url:albumArt.cam_opabinia.url,label:'欧巴宾海蝎生态与外貌复原',frame:{x:0,y:0,width:320,height:240},note:'沿用物种档案中的生态插画，配合长吻与眼的结构资料阅读。'}
};
export const heldIllustrations={16:{candidate:'欧巴宾海蝎',reason:'生成图显示的眼样结构数量与五眼资料不符，暂不用于五眼观察题。'},18:{candidate:'马尔三叶形虫',reason:'图中明显的眼样结构及头部形态仍需核对，暂不作为物种结构证据。'}};
export function referenceMarkup(id){const a=illustrations[id];return a?`<details class="c-reference"><summary>查看已生成的外观复原 <span>${a.number?'图 '+a.number:'生态插画'}</span></summary><img src="${a.url}" alt="${a.label}"><p>${a.note}</p></details>`:'';}
