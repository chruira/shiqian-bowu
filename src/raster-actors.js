import {creatureArt, actorImage, preloadActorArt} from './creature-art.js?v20261029k';
import {drawArticulated,drawActorReaction} from './behavior-art.js?v20261029k';

preloadActorArt();

export function drawActor(ctx, actor, time, highlight = false) {
  time=(actor.animationTime||0)*1000;
  const art = creatureArt[actor.creatureId];
  const image = actorImage(actor.creatureId);
  if (!art || !image?.complete || !image.naturalWidth) return;
  const width = art.width;
  const height = width * image.naturalHeight / image.naturalWidth;
  const aquatic = actor.creatureId.startsWith('cam_');
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const bob = !reducedMotion && actor.moving ? Math.sin(time / (aquatic ? 330 : 160) + actor.phase) * (aquatic ? 2 : 1.1) : 0;
  const base = aquatic ? height * .42 : height - 8;
  ctx.save();
  ctx.translate(actor.x, actor.y);
  ctx.fillStyle = aquatic ? '#06253228' : '#112a224a';
  ctx.beginPath();
  ctx.ellipse(0, 9, width * .32, aquatic ? 5 : 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (highlight) {
    ctx.strokeStyle = '#e5e4a5';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 10, width * .42, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.scale(actor.facing, 1);
  // Preserve fine shading instead of reducing the source illustrations to pixel blocks.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(-width/2,-base+bob);
  drawArticulated(ctx,image,actor,width,height,time);
  ctx.restore();
  drawActorReaction(ctx,actor,time);
}
