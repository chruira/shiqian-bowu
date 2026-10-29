// User-designated ALIC ecological illustration archive; map actors stay separate.
const file=id=>new URL(`../assets/album/${id}-ecology-v6.webp`,import.meta.url).href;
export const albumArt={
  jur_stegosaurus:{url:file("jur_stegosaurus"),label:"剑龙：蕨丛觅食与警戒",sourceId:"jur_stegosaurus"},
  jur_allosaurus:{url:file("jur_allosaurus"),label:"异特龙：河岸伏击",sourceId:"jur_allosaurus"},
  jur_diplodocus:{url:file("jur_diplodocus"),label:"拟梁龙：晨雾河岸饮水",sourceId:"jur_diplodocus"},
  jur_ceratosaurus:{url:file("jur_ceratosaurus"),label:"拟角鼻龙：雨后林间休息",sourceId:"jur_ceratosaurus"},
  jur_dryosaurus:{url:file("jur_dryosaurus"),label:"拟橡树龙：林缘觅食",sourceId:"jur_dryosaurus"},
  cam_anomalocaris:{url:file("cam_anomalocaris"),label:"拟加拿大奇虾：水层追猎",sourceId:"cam_anomalocaris"},
  cam_opabinia:{url:file("cam_opabinia"),label:"欧巴宾海蝎：长吻探查泥沙",sourceId:"cam_opabinia"},
  cam_wiwaxia:{url:file("cam_wiwaxia"),label:"威瓦西亚虫：微生物席寻食",sourceId:"cam_wiwaxia"},
  cam_olenoides:{url:file("cam_olenoides"),label:"三叶虫：岩荫停歇",sourceId:"cam_trilobite"},
  cam_marrella:{url:file("cam_marrella"),label:"拟马尔三叶形虫：颗粒间寻食",sourceId:"cam_marrella"}
};
