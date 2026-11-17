/* Hiidenmaa – camera.js
   Kolmannen persoonan kamera */
'use strict';

/* ---------------- CAMERA ---------------- */
let shakeAmt=0;function shake(a){shakeAmt=Math.max(shakeAmt,a);}
let camD=null,camTY=null; // pehmennetty kameraetäisyys ja kohteen korkeus
const _camDir=new V3();   // v2.41: uudelleenkäytettävä suunta (ei uutta oliota joka ruutu)
/* v2.73 KUOLINKAMERA: kaatumisen ajan (0,9 s) kamera pysyy paikallaan ja kääntyy kohti kehoa, sitten nousee hitaasti yläviistoon (3,2 m, 3,6 m
   ylös; luolastossa matalammalle) ja kiertää 0,1 rad/s – keho ja leviävä verilammikko näkyvät. Este → kamera lähemmäs. Tyhjyydessä kamera jää paikalleen. */
const _dcL=new THREE.Vector3();
function deathCam(dt){const D=pDeath,c=D.c;
  if(!D.cam){D.cam={a:Math.atan2(camera.position.x-c.x,camera.position.z-c.z),hd:Math.max(1.6,Math.hypot(camera.position.x-c.x,camera.position.z-c.z)),h:camera.position.y-c.y};_dcL.set(c.x,c.y,c.z);}
  if(D.void){camera.lookAt(_dcL);return;}
  const t=D.t,k=sstep(.9,4.5,t),C=D.cam,a=C.a+Math.max(0,t-.9)*.1;let hd=lerp(C.hd,3.2,k),h=lerp(C.h,P.inDun?2.2:3.6,k);
  for(let i=0;i<10;i++){const x=c.x+Math.sin(a)*hd,y=c.y+h,z=c.z+Math.cos(a)*hd;if(!pointBlocked(x,y,z)&&(P.inDun||y>terrainH(x,z)+.4))break;hd=Math.max(.8,hd*.8);h=Math.max(.6,h*.85);}
  camera.position.set(c.x+Math.sin(a)*hd,c.y+h,c.z+Math.cos(a)*hd);
  if(!P.inDun){const th=terrainH(camera.position.x,camera.position.z)+.35;if(camera.position.y<th)camera.position.y=th;}
  _dcL.lerp(_tmpV.set(c.x,c.y,c.z),Math.min(1,dt*4));camera.lookAt(_dcL);
  camera.fov=lerp(camera.fov,65,dt*4);camera.updateProjectionMatrix();if(!D.ash||!D.pile)fig.g.visible=!(D.void&&t>1);}
/* v2.88 kameran rako esteisiin (ennen 0,1 m) ja sivutarkistuksen säde; korkeuden seurannan nopeus */
const CAM_GAP=.22,CAM_R=.2,CAM_TY_K=12.6,CAM_MIN=.1;let camSO=null;   // CAM_MIN: lähin etäisyys, kun seinä on aivan takana (hahmo piilossa alle 1,2 m)
function updateCamera(dt){
  if(typeof pDeath!=='undefined'&&pDeath&&!pDeath.water&&pDeath.c){deathCam(dt);return;}   // v2.73
  /* v2.18: kun pelaaja on kokonaan veden alla (P.subm), kamera liukuu pehmeästi lähimpään zoomiin (2,2 m) ja palaa, kun pää nousee pinnalle */
  P.uwZoomK=lerp(P.uwZoomK||0,P.subm&&!P.inDun?1:0,Math.min(1,dt*2.2));
  const aim=P.drawing;const dist=lerp(aim?2.4:camDist,2.2,P.uwZoomK);
  const ty=P.pos.y+1.65-.45*P.crouchK;camTY=camTY===null||Math.abs(ty-camTY)>3?ty:lerp(camTY,ty,Math.min(1,dt*CAM_TY_K));   // v2.88 14 → 12,6 (10 % pehmeämpi pintojen vaihtuessa)
  const tgt=_tmpV.set(P.pos.x,camTY,P.pos.z);
  const right=_tmpV2.set(Math.cos(camYaw),0,-Math.sin(camYaw));
  /* v2.88 olkasiirtymä lyhenee seinän kohdalla (ennen kohdepiste meni seinän sisään, kun pelaaja seisoi kylki seinää vasten → kamera seinän sisällä) */
  {const so0=aim?.75:.55;let so=0;for(let s=.05;s<=so0+1e-6;s+=.05){if(pointBlocked(tgt.x+right.x*(s+CAM_R),tgt.y,tgt.z+right.z*(s+CAM_R)))break;so=s;}
   camSO=camSO===null?so:lerp(camSO,so,Math.min(1,dt*(so<camSO?22:4)));tgt.addScaledVector(right,Math.min(camSO,so+.02));}
  const dir=_camDir.set(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
  // Esteen etäisyys tiheällä näytteistyksellä; kamera tulee lähemmäs nopeasti ja palaa hitaasti (ei nykimistä seinien vieressä).
  let dh=dist;for(let i=1;i<=30;i++){const t=dist*i/30;const x=tgt.x+dir.x*t,y=tgt.y+dir.y*t,z=tgt.z+dir.z*t;if(pointBlocked(x,y,z)||(!P.inDun&&y<terrainH(x,z)+.3)){dh=Math.max(.6,t-dist/30-CAM_GAP);break;}}
  /* v2.88 kameran "pallo": lähitaso on 0,1 m ja n. 0,23 m leveä – jos kameran sivulla tai ylä/alapuolella on seinä, kamera tulee lähemmäs (ei läpinäkyvää seinää) */
  for(let n=0;n<16&&dh>CAM_MIN;n++){const x=tgt.x+dir.x*dh,y=tgt.y+dir.y*dh,z=tgt.z+dir.z*dh;let hit=false;for(const [ox,oy,oz] of [[0,0,0],[right.x,0,right.z],[-right.x,0,-right.z],[0,1,0],[0,-1,0]])if(pointBlocked(x+ox*CAM_R,y+oy*CAM_R,z+oz*CAM_R)){hit=true;break;}if(!hit)break;dh=Math.max(CAM_MIN,dh-.12);}
  camD=camD===null?dh:lerp(camD,dh,Math.min(1,dt*(dh<camD?22:3.5)));const d=camD;
  camera.position.copy(tgt).addScaledVector(dir,d);
  if(!P.inDun){const th=terrainH(camera.position.x,camera.position.z)+.35;if(camera.position.y<th)camera.position.y=th;}
  camera.lookAt(tgt.x-dir.x,tgt.y-dir.y,tgt.z-dir.z);
  if(shakeAmt>0){camera.position.x+=(Math.random()-.5)*shakeAmt;camera.position.y+=(Math.random()-.5)*shakeAmt;shakeAmt=Math.max(0,shakeAmt-dt*1.5);}
  camera.fov=lerp(camera.fov,aim?52:65,dt*8);camera.updateProjectionMatrix();
  fig.g.visible=d>1.2;
  // v2.18: kamera menee pinnan läpi; veden alla sumu tihenee ja tummuu syvemmällä (ja yöllä), CAM_UW = syvyys (effects.js updateWaterFx)
  {const cy=camera.position.y,s=P.inDun?-1e9:water.position.y+waveAt(camera.position.x,camera.position.z);CAM_UW=cy<s?s-cy:0;
   if(CAM_UW>0){const k=sstep(0,28,CAM_UW),l=.25+.75*(typeof lightK==='number'?lightK:1);scene.fog.color.setRGB(lerp(.11,.01,k)*l,lerp(.33,.04,k)*l,lerp(.37,.06,k)*l);
     scene.fog.near=0;scene.fog.far=lerp(30,9,k);scene.background.copy(scene.fog.color);
     for(const o of [skyDome,stars,moon,sunDisc,sunGlow,cloudDeck,rain,snow])o.visible=false;for(const c of CLOUDS)c.visible=false;}}   // taivas ei näy pinnan läpi (environment palauttaa joka ruutu)
}
