/* Hiidenmaa – fishphys.js
   v3.27 KALASTUKSEN FYSIIKKA (käyttäjä 25.11., docs/KALASTUS_SUUNNITELMA.md). Ladataan fishbook.js:n jälkeen; tilakone FS on fish.js:ssä.
   PÄÄTE E (koho tai viehe): FS.E = {x,y,z}, nopeus FS.V. Tilat: charge (virvelin voiman lataus) → fly (ballistinen lento) → wait/bite (koho vedessä)
   tai spin (viehe vedessä) tai land (maassa) → retr (kelaus takaisin kärkeen) / pull + fight (kala siimassa näkyvissä) → hang (kärjessä) → unhook (minipeli).
   HEITTO: lähtönopeus v0 lasketaan niin, että +35° heitto täydellä voimalla lentää vavan enimmäismatkan (onki 16, kuparivapa 20, hiidenvapa 24,
   virveli kelan mukaan 22/30 m). Lineaarinen ilmanvastus FP_DRAG siirtää optimikulman ~35°:een. Tuuli siirtää lentoa ja kohoa kevyesti (FP_WIND_K).
   Tavallinen onki: ei latausta (aina sama voima, kulma ratkaisee). Kela: voima ladataan vasen pohjassa 0,2–1,2 s (palkki).
   MAALLA: koho/viehe kelataan vain takaisin; maata pitkin siima katkeaa FP_LAND_SNAP / m (5 % / 10 m), katkenneen siiman viehe jää maahan.
   VIEHE: vajoaa (TK_SINK), nousee kelatessa (TK_RISE); pohjassa armonaika 0,5 s, sitten 20 % / s kiinni; tärppi pinnalla ×0,95, pohjassa ×0,7.
   Kelataan kärkeen asti (rannalta ilman kautta). KALA: näkyy siimassa jo vedossa (kyljellään, häivytys), taistelee painon ja koon mukaan
   (sivuttaisheilunta), roikkuu kärjessä kunnes otetaan; pois käveleminen tai esineen vaihto pudottaa sen (pomppii, rinteessä vierii, vedessä 0,5 s → ui pois).
   SYVÄ KOUKKU: 3–10 % kalan arvon mukaan → minipeli (mittari täyttyy punaisella alueella; epäonnistuminen = uusi yritys nopeammalla alueella).
   SAALISLAPPU: vasemmalta liukuva lappu (kalan piirros + värilliset tekstit) 6 s, enintään 3 allekkain. */
'use strict';
const FP_G=9.8,FP_DRAG=.38,FP_H0=2,FP_WIND_K=.25,FP_ROD_D={onki:16,kuparivapa:20,hiidenvapa:24},FP_CH=[.2,1.2],FP_PW_MIN=.25,FP_LAND_SNAP=.005,
  FP_TIP_R=1.2,FP_LIFT_R=2.4,FP_RETR_V=6,FP_BOT_GRACE=.5,FP_BOT_SNAG=.2,FP_TOP_K=.95,FP_BOT_K=.7,FP_DEPTH_BAND=.25,FP_WALK_R=3,FP_HOOK_P=[.03,.1],
  FP_FADE_T=.6,FP_SWIM_T=.5,FP_FLOP_T=20,LAPPU_T=6,LAPPU_MAX=3;
/* ---------------- HEITTO ---------------- */
const _fpV0={};
function fpRange(v0,th){let x=0,y=FP_H0,vx=v0*Math.cos(th),vy=v0*Math.sin(th);const dt=1/120;for(let i=0;i<6000;i++){vx-=FP_DRAG*vx*dt;vy+=(-FP_G-FP_DRAG*vy)*dt;x+=vx*dt;y+=vy*dt;if(y<=0)return x;}return x;}
function fpV0(D){if(_fpV0[D])return _fpV0[D];let lo=1,hi=90;const th=35*Math.PI/180;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(fpRange(m,th)<D)lo=m;else hi=m;}return _fpV0[D]=lo;}
const _fpT=new THREE.Vector3();
function fpTip(out){out=out||_fpT;if(typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.tip){heldMesh.updateMatrixWorld(true);heldMesh.userData.tip.getWorldPosition(out);}
  else if(typeof heldMesh!=='undefined'&&heldMesh){heldMesh.updateMatrixWorld(true);out.set(0,0,ROD_LEN-.1);heldMesh.localToWorld(out);}else out.set(P.pos.x,P.pos.y+1.6,P.pos.z);
  if(dist2(out.x,out.z,P.pos.x,P.pos.z)>16||Math.abs(out.y-P.pos.y)>5)out.set(P.pos.x-Math.sin(camYaw)*1.6,P.pos.y+1.9,P.pos.z-Math.cos(camYaw)*1.6);return out;}   // malli ei vielä päivittynyt (siirto/teleport)
function fpWind(){const k=FP_WIND_K*(WIND.spd||0);return {x:(WIND.x||0)*k,z:(WIND.z||0)*k};}
function fpChargeStart(){FS.st='charge';FS.ch=0;FS.t=0;FS.ox=P.pos.x;FS.oz=P.pos.z;FS.slot=equipped('weapon');FS.rod=rodDef();fishHud();}
function fpChargeTick(dt){if(mouseL&&locked&&state==='play'){FS.ch=Math.min(FP_CH[1]+.3,FS.ch+dt);return;}
  const k=clamp((FS.ch-FP_CH[0])/(FP_CH[1]-FP_CH[0]),0,1),pw=FP_PW_MIN+(1-FP_PW_MIN)*k;FS.st='idle';fishCast(pw);}
function fpChargeK(){return clamp((FS.ch-FP_CH[0])/(FP_CH[1]-FP_CH[0]),0,1);}
/* ---------------- LENTO ---------------- */
function fpFly(dt){const E=FS.E,V=FS.V,w=fpWind(),wy=water.position.y;for(let s=0;s<2;s++){const h=dt/2;
    V.x+=-FP_DRAG*(V.x-w.x)*h;V.y+=(-FP_G-FP_DRAG*V.y)*h;V.z+=-FP_DRAG*(V.z-w.z)*h;E.x+=V.x*h;E.y+=V.y*h;E.z+=V.z*h;
    const th=terrainH(E.x,E.z);
    if(th<wy-.05&&E.y<=wy){E.y=wy;fpSplash();return;}
    if(E.y<=th+.03){E.y=th+.03;FS.where='land';FS.st='land';FS.landM=0;tkSnd('viehe_maahan')||plSnd('kaytto','poiminta',{v:.3,p:.7});return;}}
  if(FS.t>8){FS.where='land';FS.st='land';}}
function fpSplash(){const E=FS.E,wy=water.position.y,th=terrainH(E.x,E.z);FS.where='water';FS.body=wbAt(E.x,E.z);FS.bx=E.x;FS.bz=E.z;
  plSnd('onkiminen','loiskahdus',{v:.7,pos:{x:E.x,y:wy,z:E.z}});if(typeof burst==='function')burst(E.x,wy+.05,E.z,0xcfe8f0,5,1.4);
  if(FS.spin){FS.st='spin';FS.ld=0;FS.reelT=0;FS.botT=0;return;}
  FS.st='wait';FS.noFish=!FS.body;if(FS.noFish){FS.biteAt=1e12;FS.nibAt=1e12;}else fishWaitPlan(true);   /* v3.27 kohon syvyys 0–2 m → myös matala vesi käy */
  const bd=fpBaitDepth();FS.bot=bd.bot;if(bd.bot&&!FS.noFish)tkSnd('viehe_pohjaan');}
// v3.27 ongen syötti pohjassa: nostettaessa koukku voi tarttua (TK_ONKI_SNAG, paljon harvemmin kuin virvelin viehe) → koukku ja syötti menetetään, siima lyhenee
function fpOnkiSnag(){if(FS.spin||!FS.bot||Math.random()>=TK_ONKI_SNAG)return false;const r=tkRig();let t='Koukku tarttui pohjaan ja siima katkesi';
  if(r){if(r.hook){t+=` – ${ITEMS[r.hook].n.toLowerCase()} jäi pohjaan (varalla luukoukku)`;r.hook=null;}r.bait=0;FS.bait=false;if(r.line){r.lw=(r.lw??1)-.3;if(r.lw<=0){r.line=null;r.lw=1;t+='. Siima on nyt liian lyhyt – vaihda uusi';}else t+='. Solmit siiman uudelleen (siima lyheni)';}invDirty=true;updateGear();}
  plSnd('onkiminen','siima_katkeaa',{v:.8});fishReset(t+'.','warn');return true;}
/* ---------------- KOHO VEDESSÄ: syötin syvyys (kohon korkeus, pöytä) ---------------- */
// syötin syvyys ja onko se pohjassa: koho → rig.fd (pöydällä säädetty) tai vesi on matalampi → pohjassa; viehe → FS.ld
function fpBaitDepth(){const E=FS.E||{x:FS.bx,z:FS.bz},deep=water.position.y-terrainH(E.x,E.z);if(FS.spin){const d=Math.min(FS.ld||0,deep);return {d,bot:d>=deep-FP_DEPTH_BAND,deep};}
  const r=FS.slot&&FS.slot.rig,fd=r&&r.fd!=null?r.fd:TK_FD_DEF,d=Math.min(fd,Math.max(0,deep-.05));return {d,bot:fd>=deep-.1,deep};}
function fpWaitDrift(dt){const E=FS.E;if(!E)return;const w=fpWind(),k=.03;FS.drift=(FS.drift||0);if(FS.drift>2.5)return;const nx=E.x+w.x*k*dt,nz=E.z+w.z*k*dt;
  if(terrainH(nx,nz)<water.position.y-.4){FS.drift+=Math.hypot(nx-E.x,nz-E.z);E.x=nx;E.z=nz;FS.bx=nx;FS.bz=nz;}}
/* ---------------- KELAUS TAKAISIN (ilman kalaa) ---------------- */
function fpRetrStart(){FS.st='retr';FS.landM=FS.landM||0;FS.fin=0;}
function fpReelV(){const K=FS.rod&&FS.rod.reel;return K?TK_REEL_V*K.spd*1.6:FP_RETR_V;}
function fpRetr(dt){const E=FS.E,tip=fpTip(),wy=water.position.y;const auto=!(FS.rod&&FS.rod.reel),hold=mouseL&&locked&&state==='play';
  if(!auto&&!hold&&!FS.fin)return;
  const dx=tip.x-E.x,dz=tip.z-E.z,d=Math.hypot(dx,dz);
  if(FS.fin||d<FP_TIP_R){FS.fin=(FS.fin||0)+dt;const k=Math.min(1,FS.fin/.25);E.x=lerp(E.x,tip.x,k);E.y=lerp(E.y,tip.y-.4,k);E.z=lerp(E.z,tip.z,k);if(k>=1){fishReset();}return;}
  const v=fpReelV()*dt,mv=Math.min(v,d);E.x+=dx/d*mv;E.z+=dz/d*mv;FS.bx=E.x;FS.bz=E.z;const th=terrainH(E.x,E.z);
  if(th<wy-.05){E.y=FS.spin?wy-.05:wy;FS.where='water';}else{E.y=th+.03;FS.where='land';FS.landM+=mv;while(FS.landM>=1){FS.landM-=1;if(Math.random()<FP_LAND_SNAP){fpLandSnap();return;}}}
  if(!auto){FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.5;tkSnd('veivaus')||tkSnd('virveli_kelaus')||plSnd('onkiminen','kelaus',{v:.35});}}}
// siima katkeaa maata pitkin vedettäessä: viehe jää maahan poimittavaksi
function fpLandSnap(){const r=tkRig(),E=FS.E;let t='Siima tarttui maastoon ja katkesi.';
  if(r){if(r.lure){spawnDrop(r.lure,1,E.x,E.y+.15,E.z);t+=` ${ITEMS[r.lure].n} jäi maahan – poimi se.`;r.lure=null;}
    if(r.line){r.lw=(r.lw??1)-.3;if(r.lw<=0){r.line=null;r.lw=1;t+=' Siima on nyt liian lyhyt – vaihda uusi.';}else t+=' Solmit siiman uudelleen (siima lyheni).';}invDirty=true;updateGear();}
  plSnd('onkiminen','siima_katkeaa',{v:.8});fishReset(t,'warn');}
/* ---------------- VIEHE VEDESSÄ (virveli) ---------------- */
function fpSpin(dt){const hold=mouseL&&locked&&state==='play',E=FS.E,R=FS.rod,U=R.lure,wy=water.position.y,dx=P.pos.x-E.x,dz=P.pos.z-E.z,d=Math.hypot(dx,dz)||1;
  if(hold){const v=TK_REEL_V*R.reel.spd;E.x+=dx/d*v*dt;E.z+=dz/d*v*dt;FS.reelT+=dt;FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.5;tkSnd('veivaus')||tkSnd('virveli_kelaus')||plSnd('onkiminen','kelaus',{v:.35});}}
  FS.bx=E.x;FS.bz=E.z;const deep=wy-terrainH(E.x,E.z);
  if(!U.top){if(hold)FS.ld=Math.max(TK_LURE_MIN,(FS.ld||0)-TK_RISE*dt);else FS.ld=(FS.ld||0)+TK_SINK*(U.sh==='jig'?2:1)*dt;}else FS.ld=.05;
  if(deep<TK_SHORE||d<2.6){fpRetrStart();return true;}   // rannassa viehe nousee vedestä ja kelataan kärkeen asti
  // pohja: armonaika, sitten 20 % / s kiinni
  if(FS.ld>=deep-.04){FS.ld=deep-.04;if(!FS.botT)tkSnd('viehe_pohjaan')||plSnd('onkiminen','nykaisy',{v:.35,pos:{x:E.x,y:wy,z:E.z}});FS.botT=(FS.botT||0)+dt;
    if(FS.botT>FP_BOT_GRACE&&Math.random()<1-Math.pow(1-FP_BOT_SNAG,dt)){tkSnag();return true;}}else FS.botT=0;
  E.y=wy-Math.min(FS.ld,deep-.04);
  if(hold){const wb=FS.body;if(wb){let tot=0,fit=0;const bd=fpBaitDepth();for(const sp in FISH_B){const w=fishW(sp,wb);if(!w)continue;tot+=w;fit+=w*tkSpK(sp,R,wb)*fishDepthK(sp,bd.d,bd.bot);}
      const zk=FS.ld<FP_DEPTH_BAND?FP_TOP_K:FS.ld>=deep-FP_DEPTH_BAND?FP_BOT_K:1;
      const rate=fishActivity(wb)*(tot?fit/tot:1)*lureCond(U,wb)*zk/(TK_SPIN_T*R.k)*(DEV&&typeof DEVF!=='undefined'&&DEVF.fishFast?30:1);
      if(FS.reelT>1.2&&Math.random()<dt*rate){FS.dip=1;plSnd('onkiminen','tarppays',{v:.9,pos:{x:E.x,y:wy,z:E.z}});
        if(Math.random()<R.hk){fishHook(true);return true;}msg('Kala kävi vieheessä, mutta ei tarttunut.');FS.reelT=0;}}}
  return false;}
/* ---------------- KALA SIIMASSA (veto ja taistelu) ---------------- */
function fpStr(){const B=FISH_B[FS.sp];if(!B)return .2;const kq=clamp((FS.kg-B.kg[0])/(B.kg[1]-B.kg[0]),0,1);return clamp(.15*FISH_DEF[FS.sp].k+.55*kq+(B.big?.15:0),0,1);}
function fpPullStart(){const E=FS.E||{x:FS.bx,y:water.position.y,z:FS.bz};FS.E=E;FS.H0={x:E.x,z:E.z};FS.pt=0;FS.loose=0;FS.S=fpStr();FS.ph=Math.random()*6;
  if(FISH_B[FS.sp]){fpFishDrop();const L=fpFishLen(FS.sp,FS.kg),m=tkFishMesh(FS.sp,L);fpFadeMats(m,0);scene.add(m);FS.fm=m;FS.fa=0;if(FS.bob)FS.bob.visible=false;}}
function fpFishLen(sp,kg){return Math.min(.95,.16+Math.cbrt(Math.max(.02,kg))*.24);}
function fpFadeMats(g,a){g.traverse(o=>{if(!o.isMesh)return;if(!o.userData.fpm){o.material=o.material.clone();o.userData.fpm=o.material.opacity;}o.material.transparent=a<.999||o.userData.fpm<1;o.material.opacity=o.userData.fpm*a;});}
function fpFishDrop(){if(FS.fm){scene.remove(FS.fm);FS.fm.traverse(o=>{if(o.isMesh){if(o.geometry)o.geometry.dispose();if(o.userData.fpm!=null)o.material.dispose();}});FS.fm=null;}}
function fpPull(dt){const E=FS.E,auto=!FS.spin,hold=mouseL&&locked&&state==='play',S=FS.S,dx=P.pos.x-E.x,dz=P.pos.z-E.z,d=Math.hypot(dx,dz)||1;FS.pt+=dt;
  let v=0;if(auto||hold){v=auto?3.2*(1-.45*S):TK_REEL_V*FS.rod.reel.spd*1.4*(1-.35*S);FS.loose=0;if(!auto){FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.45;tkSnd('veivaus')||plSnd('onkiminen','kelaus',{v:.45});}}}
  else{FS.loose+=dt;v=-.35;if(FS.loose>4){fpFishDrop();fishLoseBait(.5);fishReset('Kala irtosi koukusta – kelaa, kun kala on siimassa.','warn');return;}}
  E.x+=dx/d*v*dt;E.z+=dz/d*v*dt;FS.bx=E.x;FS.bz=E.z;fpFishY();if(d<FP_LIFT_R)fishLift();}
function fpFightPos(){const E=FS.E,k=clamp(FS.prog,0,1)*.93;E.x=lerp(FS.H0.x,P.pos.x,k);E.z=lerp(FS.H0.z,P.pos.z,k);FS.bx=E.x;FS.bz=E.z;fpFishY();}
function fpFishY(){const E=FS.E,wy=water.position.y,th=terrainH(E.x,E.z);E.y=th<wy-.08?wy-.04-(FS.st==='fight'&&FS.pullOn?.12:0):th+.05;}
// kalan 3D: kyljellään (pää kohti pelaajaa), sivuttaisheilunta painon ja koon mukaan, häivytys näkyviin
const _fpX=new THREE.Vector3(),_fpY=new THREE.Vector3(),_fpZ=new THREE.Vector3(0,1,0),_fpM=new THREE.Matrix4();
function fpFishUpd(dt){const m=FS.fm;if(!m)return;const E=FS.E,dx=P.pos.x-E.x,dz=P.pos.z-E.z,d=Math.hypot(dx,dz)||1,wet=terrainH(E.x,E.z)<water.position.y-.08,S=FS.S||.3,t=FS.t;
  FS.fa=Math.min(1,(FS.fa||0)+dt/FP_FADE_T);fpFadeMats(m,FS.fa);
  const A=wet?(.12+1.5*S)*(FS.st==='fight'&&FS.pullOn?1.6:1):.06,sw=Math.sin(t*(2.2-S)+FS.ph)*A+Math.sin(t*5.3+FS.ph*2)*A*.25;
  const px=-dz/d,pz=dx/d;m.position.set(E.x+px*sw,E.y,E.z+pz*sw);
  const yaw=Math.cos(t*(2.2-S)+FS.ph)*.5*(wet?1:.3);_fpY.set(dx/d,0,dz/d).applyAxisAngle(_fpZ,yaw);_fpX.crossVectors(_fpY,_fpZ);_fpM.makeBasis(_fpX,_fpY,_fpZ);m.quaternion.setFromRotationMatrix(_fpM);
  const tl=m.userData.tail;if(tl)tl.rotation.x=Math.sin(t*(wet?14:22))*.6;
  if(wet&&Math.random()<dt*(1+S*3)&&typeof burst==='function')burst(m.position.x,water.position.y+.03,m.position.z,0xcfe8f0,2,.8+S);}
/* ---------------- KÄRJESSÄ ROIKKUVA KALA PUTOAA (pois käveleminen / esineen vaihto) ---------------- */
const FLOPS=[],_fpE=new THREE.Euler();
function fpHangCheck(){const rod=rodDef();if(!rod||(FS.slot&&equipped('weapon')!==FS.slot)||P.dead||P.swim||state==='dead'||dist2(P.pos.x,P.pos.z,FS.hx??P.pos.x,FS.hz??P.pos.z)>FP_WALK_R*FP_WALK_R){fpHangDrop();return true;}return false;}
function fpHangDrop(){const D=FS.dg,sp=FS.sp,kg=FS.kg,cm=FS.cm||(typeof fbLen==='function'?fbLen(sp,kg,Math.random()):0);let x=P.pos.x,y=P.pos.y+1.2,z=P.pos.z;
  if(D){D.piv.updateMatrixWorld(true);x=D.piv.position.x;y=D.piv.position.y-.2;z=D.piv.position.z;D.hold=false;D.t=1e9;FS.dg=null;}
  fpFlop(sp,kg,cm,x,y,z,(Math.random()-.5)*1.5,.5,(Math.random()-.5)*1.5);fishReset();}
function fpFlop(sp,kg,cm,x,y,z,vx,vy,vz){const L=fpFishLen(sp,kg),m=tkFishMesh(sp,L);scene.add(m);const F={sp,kg,cm,m,x,y,z,vx,vy,vz,age:0,hop:.4,wt:0,swim:0,ry:Math.random()*TAU,L};
  F.it={x,y,z,r:1.7,flop:F,label:()=>`${ITEMS[sp].n} sätkii maassa – E: poimi`,use:()=>fpFlopPick(F),off:()=>P.inDun||F.swim>0};interactables.push(F.it);FLOPS.push(F);return F;}
function fpFlopKill(F){scene.remove(F.m);F.m.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose();});const i=interactables.indexOf(F.it);if(i>=0)interactables.splice(i,1);const j=FLOPS.indexOf(F);if(j>=0)FLOPS.splice(j,1);}
function fpFlopPick(F){if(F.swim>0)return;fpFlopKill(F);if(fishGive(F.sp,F.kg,F.cm)>0)msg('Reppu on täynnä – kala jäi maahan.','warn');else{sfx('pickup');msg(`Poimit kalan: ${ITEMS[F.sp].n}.`);}}
function fpFlopTick(dt){const wy=water.position.y;for(let i=FLOPS.length-1;i>=0;i--){const F=FLOPS[i];F.age+=dt;
    if(F.swim>0){F.swim+=dt;const k=Math.min(1,F.swim/FP_SWIM_T),sp=k*3.2;F.ry=lerpAngle(F.ry,F.sdir,kExp(5,dt));F.x+=Math.sin(F.ry)*sp*dt;F.z+=Math.cos(F.ry)*sp*dt;F.y=lerp(F.y,wy-.35,kExp(1.5,dt));
      fpFadeMats(F.m,Math.max(0,1-(F.swim-FP_SWIM_T)/1.5));F.m.position.set(F.x,F.y,F.z);F.m.quaternion.setFromEuler(_fpE.set(0,F.ry+Math.PI/2,Math.PI/2,'YXZ'));   /* uintiasento: selkä ylös, pää uintisuuntaan */
      const tl=F.m.userData.tail;if(tl)tl.rotation.x=Math.sin(F.age*16)*.7;if(F.swim>FP_SWIM_T+1.6)fpFlopKill(F);continue;}
    const th=terrainH(F.x,F.z),inW=th<wy-.05;F.vy-=FP_G*dt;F.x+=F.vx*dt;F.y+=F.vy*dt;F.z+=F.vz*dt;
    if(inW&&F.y<=wy){F.y=wy-.04;F.vy=0;F.vx*=.9;F.vz*=.9;F.wt+=dt;if(F.wt>=FP_SWIM_T){F.swim=1e-4;F.sdir=fpSwimDir(F);fpFadeMats(F.m,1);
        plSnd('onkiminen','loiskahdus',{v:.6,pos:{x:F.x,y:wy,z:F.z}});tkSnd('kala_karkuun');msg(`Kala pääsi karkuun: ${ITEMS[F.sp].n} ui takaisin veteen.`,'warn');const j=interactables.indexOf(F.it);if(j>=0)interactables.splice(j,1);}}
    else{F.wt=0;const g=F.L*.12;if(F.y<=th+g){F.y=th+g;if(F.vy<-1.2){F.vy=-F.vy*.35;F.vx*=.6;F.vz*=.6;tkSnd('kala_pomppii');}else F.vy=0;
        const e=.25,gx=(terrainH(F.x+e,F.z)-terrainH(F.x-e,F.z))/(2*e),gz=(terrainH(F.x,F.z+e)-terrainH(F.x,F.z-e))/(2*e),sl=Math.hypot(gx,gz);   // rinteessä vierii alas
        if(sl>.12){F.vx-=gx*FP_G*.45*dt;F.vz-=gz*FP_G*.45*dt;}const fr=Math.max(0,1-(sl>.12?1.2:4)*dt);F.vx*=fr;F.vz*=fr;
        F.hop-=dt;if(F.hop<=0&&F.age<FP_FLOP_T){F.hop=.45+Math.random()*.8;const a=Math.random()*TAU,s=.4+Math.random()*.9*(1-F.age/FP_FLOP_T);F.vy=1.4+Math.random()*1.4*(1-F.age/FP_FLOP_T);F.vx+=Math.sin(a)*s;F.vz+=Math.cos(a)*s;tkSnd('kala_rimpuilee');}}}
    if(!inW&&F.age>FP_FLOP_T+3&&F.vy===0&&Math.hypot(F.vx,F.vz)<.05){fpFlopKill(F);spawnDrop(F.sp,1,F.x,F.y+.1,F.z);drops[drops.length-1].ex={fl:[{kg:F.kg,cm:F.cm,t:fishNow()}]};continue;}   // rauhoittui → tavallinen pudonnut esine
    const ag=Math.max(0,1-F.age/FP_FLOP_T);F.ry+=Math.sin(F.age*9)*dt*3*ag;F.m.position.set(F.x,F.y,F.z);F.m.quaternion.setFromEuler(_fpE.set(Math.PI/2,F.ry,Math.sin(F.age*14)*.35*ag,'YXZ'));   /* kyljellään */
    const tl=F.m.userData.tail;if(tl)tl.rotation.x=Math.sin(F.age*20)*.8*ag;F.it.x=F.x;F.it.y=F.y+.2;F.it.z=F.z;}}
function fpSwimDir(F){let best=Math.random()*TAU,bd=-1e9;for(let i=0;i<12;i++){const a=i/12*TAU,s=water.position.y-terrainH(F.x+Math.sin(a)*5,F.z+Math.cos(a)*5);if(s>bd){bd=s;best=a;}}return best;}
/* ---------------- SYVÄLLE NIELTY KOUKKU: minipeli ---------------- */
const HG={on:false,el:null,c:.5,cv:.15,zw:.2,mk:.5,fill:.35,tries:0,t:0};
function fpHookP(){const V=typeof fishValue==='function'?fishValue(FS.sp,FS.kg,FS.cm||fbLen(FS.sp,FS.kg,.5)):null;return lerp(FP_HOOK_P[0],FP_HOOK_P[1],V?clamp(V.pct,0,1):.3);}
function fpUnhookStart(){Object.assign(HG,{on:true,c:.5,cv:(Math.random()<.5?-1:1)*.14,zw:.2,mk:.5,fill:.35,tries:0,t:0});FS.st='unhook';
  let el=document.getElementById('hookG');if(!el){el=document.createElement('div');el.id='hookG';el.innerHTML='<div class="hgT">Koukku on syvällä kalan kurkussa!</div><div class="hgBar"><i class="hgZ"></i><i class="hgM"></i></div><div class="hgF"><i></i></div><div class="hgH">Liikuta hiirtä – pidä viiva punaisella alueella</div>';document.getElementById('hud').appendChild(el);}
  el.hidden=false;HG.el=el;tkSnd('koukku_syvalla');}
function fpUnhookMove(dx){if(!HG.on)return false;HG.mk=clamp(HG.mk+dx*.0026,0,1);return true;}
function fpUnhookTick(dt){if(!HG.on)return;if(fpHangCheck()){fpUnhookEnd();return;}HG.t+=dt;const sp=.14+.07*HG.tries;
  if(Math.random()<dt*.9)HG.cv=(Math.random()<.5?-1:1)*sp*(.6+Math.random()*.8);HG.c+=HG.cv*dt;if(HG.c<HG.zw/2){HG.c=HG.zw/2;HG.cv=Math.abs(HG.cv);}if(HG.c>1-HG.zw/2){HG.c=1-HG.zw/2;HG.cv=-Math.abs(HG.cv);}
  const inZ=Math.abs(HG.mk-HG.c)<=HG.zw/2;HG.fill=clamp(HG.fill+(inZ?.42:-.28)*dt,0,1);
  const el=HG.el;el.querySelector('.hgZ').style.cssText=`left:${(HG.c-HG.zw/2)*100}%;width:${HG.zw*100}%`;el.querySelector('.hgM').style.left=`${HG.mk*100}%`;el.querySelector('.hgF i').style.width=`${HG.fill*100}%`;el.classList.toggle('in',inZ);
  if(HG.fill>=1){fpUnhookEnd();tkSnd('koukun_irrotus');fishTake(false,true);return;}
  if(HG.fill<=0){HG.tries++;HG.fill=.35;HG.zw=Math.max(.12,HG.zw-.02);el.querySelector('.hgT').textContent=`Uusi yritys (${HG.tries + 1}) – koukku ei vielä irronnut`;tkSnd('koukku_syvalla');}}
function fpUnhookEnd(){HG.on=false;if(HG.el)HG.el.hidden=true;}
/* ---------------- SAALISLAPPU (vasemmalta) ---------------- */
function lappu(img,html,o){o=o||{};let box=document.getElementById('lappuBox');if(!box){box=document.createElement('div');box.id='lappuBox';document.getElementById('hud').appendChild(box);}
  const el=document.createElement('div');el.className='lappu'+(o.cls?' '+o.cls:'');el.innerHTML=`${img?`<img src="${img}" alt="">`:''}<div class="lpT">${html}</div>`;box.prepend(el);
  while(box.children.length>LAPPU_MAX){const x=box.lastElementChild;x.remove();}
  requestAnimationFrame(()=>el.classList.add('on'));tkSnd('lappu_liuku');const T=(o.t||LAPPU_T)*1000;
  setTimeout(()=>{el.classList.remove('on');el.classList.add('off');setTimeout(()=>el.remove(),450);},T);return el;}
// ennätyskalan teema (music/raw/tapahtumat/ennatyskala; main.js musicCtx 'rec' soi kerran loppuun) – ei pomotaistelun aikana
function fpRecordMusic(){const M=window.__mus;if(!M||!M.has||!M.has('mu/tapahtumat/ennatyskala_'))return;if(typeof BB!=='undefined'&&BB.m&&!BB.m.dead)return;MUS_FB.rec={t:playTime,seen:false};}
/* ---------------- VIRVELIN ASENTO (player.js kutsuu bookPosen jälkeen) ----------------
   Vapa vasemmassa kädessä (state.js virvHeld), vavan suunta maailmassa: katseen suunta, kallistus 26° ylös; latauksessa vapa kallistuu taakse,
   heitossa piiskaa eteen. Oikea käsi tarttuu kelan kammen nuppiin (IK) ja pyörittää sitä kelatessa; kampi pyörii käden mukana. */
const VIRV={crank:0,side:0,key:null},_vq=new THREE.Quaternion(),_vq2=new THREE.Quaternion(),_vX=new THREE.Vector3(),_vY=new THREE.Vector3(),_vZ=new THREE.Vector3(),_vM=new THREE.Matrix4(),_vK=new THREE.Vector3(),_vS=new THREE.Vector3(),_vPole=new THREE.Vector3(-.4,-1,-.3);
function virvReeling(){if(!(mouseL&&locked&&state==='play'))return false;const st=FS.st;return st==='spin'||st==='pull'||st==='fight'||st==='retr'||(st==='land'&&FS.rod&&FS.rod.reel);}
function virvPose(dt){const hm=typeof heldMesh!=='undefined'?heldMesh:null;const on=!!(hm&&hm.userData.virv&&hm.parent===fig.handL&&!P.dead&&!P.insp);
  P.virvK=lerp(P.virvK||0,on?1:0,kExp(10,dt));if(!on||P.virvK<.02)return;const k=P.virvK;
  // vasen käsi eteen (vavan kahva), kyynärvarsi vaakaan
  fig.g.updateMatrixWorld(true);fig.armL.getWorldPosition(_vS);fig.armR.getWorldPosition(_vK);const lx=_vS.x-_vK.x,lz=_vS.z-_vK.z,ll=Math.hypot(lx,lz)||1;   // vasen käsi rinnan eteen (molemmat kädet ylettyvät kelalle)
  _vX.set((_vS.x+_vK.x)/2+Math.sin(P.yaw)*.34+lx/ll*.07,(_vS.y+_vK.y)/2-.2,(_vS.z+_vK.z)/2+Math.cos(P.yaw)*.34+lz/ll*.07);armIK(fig.armL,fig.elbowL,_vX,k,_poleBowL);
  // vavan suunta: kallistus (rad) heiton vaiheen mukaan
  let pa=.45;if(FS.st==='charge')pa=.45+1.05*sstep(0,1,fpChargeK());else if(FS.st==='fly'&&FS.t<.45)pa=FS.t<.12?lerp(1.5,-.05,FS.t/.12):lerp(-.05,.45,(FS.t-.12)/.33);
  else if(FS.st==='fight')pa=.75+(FS.pullOn?.25:0);else if(FS.st==='pull')pa=.6;else if(FS.st==='hang'||FS.st==='unhook')pa=.85;
  VIRV.pa=lerp(VIRV.pa??pa,pa,kExp(FS.st==='fly'?40:9,dt));const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw),cp=Math.cos(VIRV.pa);
  _vZ.set(fx*cp,Math.sin(VIRV.pa),fz*cp).normalize();_vX.set(0,1,0).cross(_vZ).normalize();_vY.crossVectors(_vZ,_vX);_vM.makeBasis(_vX,_vY,_vZ);_vq.setFromRotationMatrix(_vM);
  fig.g.updateMatrixWorld(true);hm.parent.getWorldQuaternion(_vq2);_vq.premultiply(_vq2.invert());hm.quaternion.slerp(_vq,k);hm.position.set(0,0,-.2*k).applyQuaternion(hm.quaternion);   /* ote kelan yläpuolelta */
  // kampi: oikealle puolelle (lähemmäs oikeaa olkaa) – tarkistetaan kerran per malli
  const cr=hm.userData.crank,kn=hm.userData.knob;if(!cr||!kn)return;if(VIRV.key!==hm.uuid){VIRV.key=hm.uuid;hm.updateMatrixWorld(true);kn.getWorldPosition(_vK);fig.armR.getWorldPosition(_vS);const d1=_vK.distanceTo(_vS);
      cr.position.x=-cr.position.x;hm.updateMatrixWorld(true);kn.getWorldPosition(_vK);const d2=_vK.distanceTo(_vS);if(d2>d1){cr.position.x=-cr.position.x;}VIRV.side=Math.sign(cr.position.x);kn.position.x=Math.abs(kn.position.x)*VIRV.side;}
  if(virvReeling()){const K=FS.rod&&FS.rod.reel;VIRV.crank+=dt*TAU*2.2*(K?K.spd:1);}cr.rotation.x=VIRV.crank;
  hm.updateMatrixWorld(true);kn.getWorldPosition(_vK);if(!P.atk||FS.st!=='idle')armIK(fig.armR,fig.elbowR,_vK,k,_vPole);}
/* ---------------- PÄÄSILMUKKA (fish.js fishTick kutsuu) ---------------- */
function fpTick(dt){fpFlopTick(dt);if(FS.fm&&(FS.st==='pull'||FS.st==='fight'))fpFishUpd(dt);else if(FS.fm&&FS.st!=='pull'&&FS.st!=='fight')fpFishDrop();}
