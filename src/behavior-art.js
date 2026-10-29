import {behaviors} from './habitats.js?v20261029k';

const polygon=(ctx,points,w,h)=>{ctx.moveTo(points[0][0]*w,points[0][1]*h);for(const [x,y]of points.slice(1))ctx.lineTo(x*w,y*h);ctx.closePath();};
const rectangle=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const rigs={
  jur_stegosaurus:{head:{points:[[.76,.39],[1,.39],[1,.76],[.76,.72]],pivot:[.77,.61]},tail:{points:[[0,.38],[.34,.38],[.34,.68],[0,.68]],pivot:[.33,.56]},legs:[{points:rectangle(.37,.67,.18,.33),pivot:[.46,.69]},{points:rectangle(.63,.67,.17,.33),pivot:[.69,.69]}]},
  jur_diplodocus:{head:{points:[[.63,.60],[.67,.40],[.84,0],[1,0],[1,.28],[.79,.60],[.70,.70]],pivot:[.65,.62]},tail:{points:[[0,.58],[.39,.58],[.39,.79],[0,.79]],pivot:[.38,.69]},legs:[{points:rectangle(.43,.65,.13,.35),pivot:[.49,.67]},{points:rectangle(.64,.65,.14,.35),pivot:[.70,.67]}]},
  jur_allosaurus:{head:{points:[[.64,.29],[.68,0],[1,0],[1,.45],[.74,.49]],pivot:[.68,.35]},tail:{points:[[0,.33],[.40,.33],[.40,.59],[0,.59]],pivot:[.39,.46]},legs:[{points:rectangle(.46,.58,.17,.42),pivot:[.54,.61]},{points:rectangle(.63,.65,.14,.35),pivot:[.68,.66]}]},
  jur_ceratosaurus:{head:{points:[[.65,.33],[.68,0],[1,0],[1,.46],[.74,.50]],pivot:[.69,.38]},tail:{points:[[0,.34],[.42,.34],[.42,.59],[0,.59]],pivot:[.40,.49]},legs:[{points:rectangle(.47,.58,.16,.42),pivot:[.54,.61]},{points:rectangle(.64,.65,.13,.35),pivot:[.69,.66]}]},
  jur_dryosaurus:{head:{points:[[.66,.35],[.71,0],[1,0],[1,.35],[.78,.48]],pivot:[.70,.38]},tail:{points:[[0,.30],[.43,.30],[.43,.52],[0,.52]],pivot:[.42,.43]},legs:[{points:rectangle(.45,.59,.18,.41),pivot:[.53,.61]},{points:rectangle(.65,.62,.13,.38),pivot:[.70,.65]}]}
};

function segment(ctx,image,shape,w,h,angle=0,dx=0,dy=0){ctx.save();ctx.translate(shape.pivot[0]*w,shape.pivot[1]*h);ctx.rotate(angle);ctx.translate(-shape.pivot[0]*w+dx,-shape.pivot[1]*h+dy);ctx.beginPath();polygon(ctx,shape.points,w,h);ctx.clip();ctx.drawImage(image,0,0,w,h);ctx.restore();}

export function drawArticulated(ctx,image,actor,width,height,time){
  const rig=rigs[actor.creatureId],pose=actor.pose||{},walk=actor.moving?Math.sin(time/95+actor.phase)*.07:0;
  if(rig){
    const parts=[rig.head,rig.tail,...rig.legs];
    ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);for(const part of parts)polygon(ctx,part.points,width,height);ctx.clip('evenodd');ctx.drawImage(image,0,0,width,height);ctx.restore();
    segment(ctx,image,rig.tail,width,height,pose.tail||0);
    rig.legs.forEach((part,i)=>segment(ctx,image,part,width,height,(walk+(pose.limbs||0)*.07)*(i%2?-1:1)));
    segment(ctx,image,rig.head,width,height,pose.head||0);
    return;
  }
  if(actor.activity?.id==='probe'){
    const head={points:rectangle(.59,0,.41,.72),pivot:[.60,.52]};
    ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);polygon(ctx,head.points,width,height);ctx.clip('evenodd');ctx.drawImage(image,0,0,width,height);ctx.restore();
    segment(ctx,image,head,width,height,pose.head||0,(Math.sin(actor.activity.elapsed*4)+1)*3,0);
    return;
  }
  // Deform narrow strips of the actual illustration: side lobes/appendages move
  // while all original color and anatomical detail remain in the source image.
  const animated=actor.moving||actor.activity;
  if(animated){const count=12;for(let i=0;i<count;i++){const sx=i*image.naturalWidth/count,sw=Math.min(image.naturalWidth-sx,image.naturalWidth/count+1),wave=Math.sin(time/150+i*.8+actor.phase)*(actor.activity?.id==='swim'?2.3:actor.activity?1.3:.7);ctx.drawImage(image,sx,0,sw,image.naturalHeight,i*width/count,wave,width/count+1,height);}}
  else ctx.drawImage(image,0,0,width,height);
}

export function drawHabitatResources(ctx,plan,time,actors){
  for(const r of plan.resources){const actor=actors.find(n=>n.activity?.resource?.id===r.id),active=!!actor&&actor.activity.stage==='perform',phase=actor?.activity?.elapsed||time/1000;
    ctx.save();ctx.translate(r.x,r.y);ctx.lineWidth=1.5;
    if(r.kind==='fern'||r.kind==='cover'){
      ctx.strokeStyle='#6d9d59';ctx.fillStyle='#92b467';
      for(let i=-3;i<=3;i++){const bend=active?Math.sin(phase*6+i)*3:0;ctx.beginPath();ctx.moveTo(0,4);ctx.quadraticCurveTo(i*5+bend,-15,i*7+bend,-19+Math.abs(i)*3);ctx.stroke();for(let j=1;j<=3;j++){ctx.fillRect(i*j*2+bend,-j*4,5,2);}}
    }else if(r.kind==='water'){
      ctx.strokeStyle=active?'#d5eeceaa':'#9cbdbd55';
      for(let i=0;i<3;i++){const pulse=(phase*.7+i/3)%1;ctx.globalAlpha=active?(1-pulse)*.8:.2;ctx.beginPath();ctx.ellipse(0,0,8+pulse*28,3+pulse*8,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    }else if(r.kind==='mat'){
      ctx.fillStyle='#71946d77';ctx.beginPath();ctx.ellipse(0,3,24,9,0,0,Math.PI*2);ctx.fill();
    }else if(r.kind==='current'){
      ctx.strokeStyle=active?'#b3d9cb99':'#86b6bd44';for(let j=0;j<3;j++){const x=((phase*12+j*20)%65)-33;ctx.beginPath();ctx.moveTo(x,j*6-8);ctx.quadraticCurveTo(x+10,j*6-12,x+20,j*6-8);ctx.stroke();}
    }else{
      ctx.fillStyle='#bba57f88';for(let j=0;j<10;j++)ctx.fillRect(Math.sin(j*5.1)*20,Math.cos(j*3.7)*7,2,2);
    }
    if(active){ctx.strokeStyle='#e6dfab88';ctx.setLineDash([2,4]);ctx.beginPath();ctx.ellipse(0,3,33,14,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      if(['graze','scrape','sift','gather','probe','inspect'].includes(actor.activity.id)){for(let i=0;i<9;i++){const p=(phase*.7+i/9)%1;ctx.globalAlpha=(1-p)*.7;ctx.fillStyle=actor.activity.id==='graze'?'#9cbe76':'#c5b891';ctx.fillRect(Math.sin(i*3.1)*18+p*9,-p*24+6,2,2);}ctx.globalAlpha=1;}
      ctx.font='10px "Deep Time Pixel",monospace';ctx.textAlign='center';ctx.fillStyle='#e4dfb0';ctx.fillText(r.label,0,25);
    }
    ctx.restore();
  }
}

export function drawActorReaction(ctx,actor,time){
  const activity=actor.activity;
  if(activity?.stage==='perform'&&['patrol','alert','crawl','swim'].includes(activity.id)){
    ctx.save();ctx.strokeStyle=activity.id==='swim'?'#c3e5d180':'#dfcea260';ctx.lineWidth=1;
    for(let i=1;i<=3;i++){ctx.globalAlpha=(4-i)/4;const x=actor.x-actor.facing*i*14,y=actor.y+12+(i%2)*4;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x,y+3);ctx.lineTo(x+3,y);ctx.stroke();}ctx.restore();
  }
  if(actor.reaction>0){ctx.save();ctx.font='18px "Deep Time Pixel",monospace';ctx.textAlign='center';ctx.fillStyle='#f0d89d';ctx.fillText('!',actor.x,actor.y-72-Math.sin(time/100)*2);ctx.restore();}
}
