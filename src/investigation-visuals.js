import {diagrams} from './art.js?v20261029k';
import {illustrations} from './illustrations.js?v20261029k';
/* 交接注释 V8
 * 观察图坐标按百分比覆盖320×240框；热点位置随具体图片校准。
 * V8补齐角鼻龙、马尔三叶形虫、欧巴宾海蝎；数据中的evidenceId保持不变。
 * 交接注释结束 */
const points={cam_wiwaxia:{mouth:[16,83],spines:[51,33],mat:[83,83]},cam_anomalocaris:{limb:[76,66],eye:[66,41]},cam_olenoides:{axis:[81,27],shell:[48,61]},jur_stegosaurus:{plates:[52,31],tail:[19,56]},jur_allosaurus:{teeth:[83,32],vertebra:[82,81]},jur_diplodocus:{teeth:[84,28],neck:[72,42]},jur_dryosaurus:{beak:[81,34],legs:[53,70]}};
Object.assign(points,{jur_ceratosaurus:{horn:[44,29],teeth:[40,39]},cam_marrella:{antenna:[79,40],legs:[53,64]},cam_opabinia:{nozzle:[66,81],eyes:[50,42]}});
const toothInset='<rect x="10" y="174" width="92" height="49" rx="2" fill="#eee4c5" stroke="#9e8b60" stroke-width="1.5"/><path d="M20 195H91M20 207H91" stroke="#a18f66" stroke-width="2"/>'+Array.from({length:7},(_,i)=>`<path d="M${24+i*9} 195l3 -8l3 8M${24+i*9} 207l3 -8l3 8" fill="#b3aa88" stroke="#786c50" stroke-width="1"/>`).join('');
const mat='<path d="M228 192l17 -10 22 4 14 -6 23 15 -5 25 -60 4 -18 -18Z" fill="#9ca67c" stroke="#7a8262" stroke-width="1.5"/><path d="M238 202l16 -5 16 6 21 -3M235 211l18 -6 24 7" fill="none" stroke="#7e8a62" stroke-width="3"/>';
const axisInset='<rect x="224" y="14" width="71" height="82" fill="#ece3c4" stroke="#a18c60" stroke-width="1.5"/><ellipse cx="259" cy="54" rx="22" ry="32" fill="#aaa98a" stroke="#7c795b"/><path d="M251 27V82M267 27V82M237 43H280M238 56H280M242 69H277" stroke="#726e51" fill="none" stroke-width="1.5"/>';
const damageInset='<rect x="226" y="170" width="78" height="52" fill="#eee4c5" stroke="#a28c5c" stroke-width="1.5"/><path d="M241 190l12 -8 22 5 11 -2 7 15 -13 9 -25 -3 -13 3Z" fill="#c4b799" stroke="#8c7854" stroke-width="2"/><ellipse cx="263" cy="196" rx="7" ry="5" fill="#827250"/>';
/* 交接注释 V8
 * 统一出图。frame控制SVG image放置，热点和detailFigure必须与此一致。
 * V8补图用0,0,320,240保留生态画；缺省旧方图为0,-40,320,320。附加小图是结构示意。
 * 交接注释结束 */
export function observationFigure(id){const a=illustrations[id];if(!a)return diagrams[id]||'';const frame=a.frame||{x:0,y:-40,width:320,height:320};const inset=id==='cam_wiwaxia'?toothInset+mat:id==='cam_olenoides'?axisInset:id==='jur_allosaurus'?damageInset:'';return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="外观复原与结构近景，颜色不是科学依据"><image href="${a.url}" x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" style="mix-blend-mode:multiply"/>${inset}</svg>${id==='cam_wiwaxia'?'<span class="figure-inset-label mouth-inset-label">腹面口器 · 放大示意</span>':id==='cam_olenoides'?'<span class="figure-inset-label axis-inset-label">三叶分区示意</span>':id==='jur_allosaurus'?'<span class="figure-inset-label damage-inset-label">损伤椎骨示意</span>':''}`;}
export function observationHotspots(id,hotspots){return hotspots.map(h=>points[id]?.[h.id]?{...h,x:points[id][h.id][0],y:points[id][h.id][1]}:h);}
