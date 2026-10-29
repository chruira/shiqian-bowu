// Moving actors and commissioned album paintings deliberately have separate assets.
const asset = id => new URL(`../assets/actors/${id}-cutout-v4.png`, import.meta.url).href;
export const creatureArt = {
  cam_wiwaxia: {url: asset('cam_wiwaxia'), width: 86},
  cam_olenoides: {url: asset('cam_olenoides'), width: 88},
  cam_marrella: {url: asset('cam_marrella'), width: 82},
  cam_opabinia: {url: asset('cam_opabinia'), width: 108},
  cam_anomalocaris: {url: asset('cam_anomalocaris'), width: 132},
  jur_stegosaurus: {url: asset('jur_stegosaurus'), width: 137},
  jur_allosaurus: {url: asset('jur_allosaurus'), width: 127},
  jur_ceratosaurus: {url: asset('jur_ceratosaurus'), width: 116},
  jur_diplodocus: {url: asset('jur_diplodocus'), width: 155},
  jur_dryosaurus: {url: asset('jur_dryosaurus'), width: 96}
};

const loaded = new Map();
export function actorImage(id) {
  if (!creatureArt[id]) return null;
  if (!loaded.has(id)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = creatureArt[id].url;
    loaded.set(id, image);
  }
  return loaded.get(id);
}
export function preloadActorArt() { Object.keys(creatureArt).forEach(actorImage); }
