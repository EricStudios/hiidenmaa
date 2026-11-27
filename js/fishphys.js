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
  FP_FADE_T=.6,FP_SWIM_T=.5,FP_FLOP_T=20,LAPPU_T=6,LAPPU_MAX=3,FP_TETHER_MIN=1.2,FP_LIFT_GAIN=2.2,FP_FLOP_K=1.5,FP_HANG_K=2,FP_FULL_T=[10,30];
/* ---------------- HEITTO ---------------- */
const _fpV0={};
function fpRange(v0,th){let x=0,y=FP_H0,vx=v0*Math.cos(th),vy=v0*Math.sin(th);const dt=1/120;for(let i=0;i<6000;i++){vx-=FP_DRAG*vx*dt;vy+=(-FP_G-FP_DRAG*vy)*dt;x+=vx*dt;y+=vy*dt;if(y<=0)return x;}return x;}
function fpV0(D){if(_fpV0[D])return _fpV0[D];let lo=1,hi=90;const th=35*Math.PI/180;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(fpRange(m,th)<D)lo=m;else hi=m;}return _fpV0[D]=lo;}
const _fpT=new THREE.Vector3();
// v3.29 optimointi: kärki lasketaan kerran ruudussa (updateMatrixWorld rekursiivisesti vain kerran); Low/Medium-ulkoasu FISH_LQ (settings.js applyGfx → fishLQSet)
let FISH_LQ=false;const _fpTC={t:-1,v:new THREE.Vector3()};
function fishLQSet(pi){FISH_LQ=pi>=0&&pi<=4;}
function fpTip(out){out=out||_fpT;if(_fpTC.t===playTime&&_fpTC.h===(typeof heldMesh!=='undefined'?heldMesh:null)&&_fpTC.px===P.pos.x&&_fpTC.pz===P.pos.z&&playTime>0)return out.copy(_fpTC.v);fpTip0(out);_fpTC.t=playTime;_fpTC.h=typeof heldMesh!=='undefined'?heldMesh:null;_fpTC.px=P.pos.x;_fpTC.pz=P.pos.z;_fpTC.v.copy(out);return out;}   // v3.34: avaimena myös pelaajan paikka (siirron jälkeen ei vanhaa kärkeä – KORJAUKSET 106)
function fpTip0(out){if(typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.tip){heldMesh.updateMatrixWorld(true);heldMesh.userData.tip.getWorldPosition(out);}
  else if(typeof heldMesh!=='undefined'&&heldMesh){heldMesh.updateMatrixWorld(true);out.set(0,0,ROD_LEN-.1);heldMesh.localToWorld(out);}else out.set(P.pos.x,P.pos.y+1.6,P.pos.z);
  if(dist2(out.x,out.z,P.pos.x,P.pos.z)>16||Math.abs(out.y-P.pos.y)>5)out.set(P.pos.x-Math.sin(camYaw)*1.6,P.pos.y+1.9,P.pos.z-Math.cos(camYaw)*1.6);return out;}   // malli ei vielä päivittynyt (siirto/teleport)
function fpWind(){const k=FP_WIND_K*(WIND.spd||0);return {x:(WIND.x||0)*k,z:(WIND.z||0)*k};}
function fpChargeStart(){FS.st='charge';FS.ch=0;FS.t=0;FS.ox=P.pos.x;FS.oz=P.pos.z;FS.slot=equipped('weapon');FS.rod=rodDef();fishHud();}
function fpChargeTick(dt){if(mouseL&&locked&&state==='play'){FS.ch=Math.min(FP_CH[1]+.3,FS.ch+dt);return;}
  const k=clamp((FS.ch-FP_CH[0])/(FP_CH[1]-FP_CH[0]),0,1),pw=FP_PW_MIN+(1-FP_PW_MIN)*k;FS.st='idle';fishCast(pw);}
function fpChargeK(){return clamp((FS.ch-FP_CH[0])/(FP_CH[1]-FP_CH[0]),0,1);}
/* ---------------- LENTO ---------------- */
function fpFly(dt){const E=FS.E,V=FS.V,w=fpWind(),wy=water.position.y,ns=Math.max(2,Math.ceil(dt*240));for(let s=0;s<ns;s++){const h=dt/ns;   /* v3.32: välivaihe ≤ 1/240 s → heiton pituus sama kaikilla FPS:illä */
    V.x+=-FP_DRAG*(V.x-w.x)*h;V.y+=(-FP_G-FP_DRAG*V.y)*h;V.z+=-FP_DRAG*(V.z-w.z)*h;E.x+=V.x*h;E.y+=V.y*h;E.z+=V.z*h;
    const th=terrainH(E.x,E.z);
    if(th<wy-.05&&E.y<=wy){E.y=wy;fpSplash();return;}
    if(E.y<=th+.03){E.y=th+.03;FS.where='land';FS.st='land';FS.landM=0;FS.Lf=fpLineNow();tkSnd('viehe_maahan')||plSnd('kaytto','poiminta',{v:.3,p:.7});return;}}
  if(FS.t>8){FS.where='land';FS.st='land';}}
function fpSplash(){const E=FS.E,wy=water.position.y,th=terrainH(E.x,E.z);FS.where='water';FS.Lf=fpLineNow();FS.body=wbAt(E.x,E.z);FS.bx=E.x;FS.bz=E.z;
  plSnd('onkiminen','loiskahdus',{v:.7,pos:{x:E.x,y:wy,z:E.z}});if(typeof burst==='function')burst(E.x,wy+.05,E.z,0xcfe8f0,5,1.4);
  if(FS.spin){FS.st='spin';FS.ld=0;FS.reelT=0;FS.botT=0;return;}
  FS.st='wait';FS.noFish=!FS.body;if(FS.noFish){FS.biteAt=1e12;FS.nibAt=1e12;}else fishWaitPlan(true);   /* v3.27 kohon syvyys 0–2 m → myös matala vesi käy */
  const bd=fpBaitDepth();FS.bot=bd.bot;if(bd.bot&&!FS.noFish)tkSnd('viehe_pohjaan');}
// v3.27 ongen syötti pohjassa: nostettaessa koukku voi tarttua (TK_ONKI_SNAG, paljon harvemmin kuin virvelin viehe) → koukku ja syötti menetetään, siima lyhenee
function fpOnkiSnag(){if(FS.spin||!FS.bot||Math.random()>=TK_ONKI_SNAG)return false;const r=tkRig();let t='Koukku tarttui pohjaan ja siima katkesi';
  if(r){if(r.hook){t+=` – ${ITEMS[r.hook].n.toLowerCase()} jäi pohjaan (varalla luukoukku)`;r.hook=null;}r.bait=0;FS.bait=false;if(r.line){r.line=null;r.lw=1;t+='. Solmi uusi siima repusta (E)';}invDirty=true;updateGear();}
  plSnd('onkiminen','siima_katkeaa',{v:.8});fishReset(t+'.','warn');return true;}
/* ---------------- KOHO VEDESSÄ: syötin syvyys (kohon korkeus, pöytä) ---------------- */
// syötin syvyys ja onko se pohjassa: koho → rig.fd (pöydällä säädetty) tai vesi on matalampi → pohjassa; viehe → FS.ld
function fpBaitDepth(){const E=FS.E||{x:FS.bx,z:FS.bz},deep=water.position.y-terrainH(E.x,E.z);if(FS.spin){const d=Math.min(FS.ld||0,deep);return {d,bot:d>=deep-FP_DEPTH_BAND,deep};}
  const r=FS.slot&&FS.slot.rig,fd=r&&r.fd!=null?r.fd:TK_FD_DEF,d=Math.min(fd,Math.max(0,deep-.05));return {d,bot:fd>=deep-.1,deep};}
function fpWaitDrift(dt){const E=FS.E;if(!E)return;const w=fpWind(),k=.03;FS.drift=(FS.drift||0);if(FS.drift>2.5)return;const nx=E.x+w.x*k*dt,nz=E.z+w.z*k*dt;
  if(terrainH(nx,nz)<water.position.y-.4){FS.drift+=Math.hypot(nx-E.x,nz-E.z);E.x=nx;E.z=nz;FS.bx=nx;FS.bz=nz;}}
/* v3.33 käyttäjä: KIINTEÄ SIIMA MYÖS ENNEN TÄRPPIÄ. Siiman pituus FS.Lf = kärki → koho/viehe laskeutuessa (virvelillä kelaus lyhentää). Kun pelaaja
   kävelee (maalla tai vedessä) kauemmas, koho/viehe raahautuu perässä – ei kelausta eikä ilmoitusta. Maalle raahattu koho siirtyy tilaan land;
   maata pitkin raahatessa siima voi katketa vain pienellä todennäköisyydellä FP_LAND_SNAP / m (kuten kelatessa). */
// koho/viehe palaa veteen (raahaus maalta): sama kuin laskeutuminen ilman loiskausta – uusi tärppiaikataulu, vesistö ja syvyys
function fpReenter(){const E=FS.E,wy=water.position.y;FS.where='water';FS.body=wbAt(E.x,E.z);FS.bx=E.x;FS.bz=E.z;FS.drift=0;
  if(FS.spin){FS.st='spin';FS.ld=0;FS.reelT=0;FS.botT=0;E.y=wy-.05;}else{E.y=wy;FS.st='wait';FS.noFish=!FS.body;if(FS.noFish){FS.biteAt=1e12;FS.nibAt=1e12;}else fishWaitPlan(true);const bd=fpBaitDepth();FS.bot=bd.bot;}
  if(typeof fishHud==='function')fishHud();}
/* v3.36 käyttäjä ("onki taas kelaa"): siima mitattiin heiluvasta vavan kärjestä → jokainen kääntyminen/heilahdus veti kohoa lähemmäs eikä se palannut
   (räikkä) ja koho tuntui kelautuvan sisään. Nyt pituus FS.Lf mitataan vaakasuoraan pelaajan vartalosta (+ FP_SLACK löysää), joten paikallaan
   seistessä ja kääntyessä koho ei liiku lainkaan; vain poispäin käveleminen raahaa sitä. */
const FP_SLACK=.6;
function fpLineNow(){const E=FS.E;return E?Math.max(FP_TETHER_MIN,Math.hypot(E.x-P.pos.x,E.z-P.pos.z)+FP_SLACK):FP_TETHER_MIN;}
function fpFreeTether(dt){const E=FS.E;if(!E)return false;const wy=water.position.y,hx=E.x-P.pos.x,hz=E.z-P.pos.z,hd=Math.hypot(hx,hz)||1e-4;
  if(!(FS.Lf>0))FS.Lf=fpLineNow();
  if(FS.st==='spin'&&mouseL&&locked&&state==='play')FS.Lf=Math.max(FP_TETHER_MIN,Math.min(FS.Lf,hd+FP_SLACK));   // virvelin kelaus lyhentää siimaa
  if(hd<=FS.Lf)return false;
  const Lh=FS.Lf,nx=P.pos.x+hx/hd*Lh,nz=P.pos.z+hz/hd*Lh,mv=hd-Lh,th=terrainH(nx,nz),wet=th<wy-.05;E.x=nx;E.z=nz;FS.bx=nx;FS.bz=nz;
  if(wet){if(FS.st==='land')fpReenter();else if(FS.st!=='spin')E.y=wy;return false;}   // v3.34 käyttäjä: maalta veteen raahattu koho/viehe kalastaa taas
  E.y=th+.03;if(FS.st!=='land'){FS.st='land';FS.where='land';FS.landM=FS.landM||0;fishHud();}
  FS.landM=(FS.landM||0)+mv;while(FS.landM>=1){FS.landM-=1;if(Math.random()<FP_LAND_SNAP){fpLandSnap();return true;}}
  return false;}
/* ---------------- KELAUS TAKAISIN (ilman kalaa) ---------------- */
/* v3.39 käyttäjä: "onki kelaantuu vaikka ei ole kelaa" – ongella (ei kelaa) vasen NOSTAA vavan: koho/syötti lennähtää kaarena ilman kautta käteen (FP_LIFT_T), ei liu'u pintaa pitkin */
const FP_LIFT_T=.55;
function fpRetrStart(){FS.st='retr';FS.landM=FS.landM||0;FS.fin=0;FS.arc=null;
  if(!(FS.rod&&FS.rod.reel)&&FS.E){FS.arc={t:0,x:FS.E.x,y:FS.E.y,z:FS.E.z};plSnd('onkiminen','heitto',{v:.35,p:1.15});}}
function fpReelV(){const K=FS.rod&&FS.rod.reel;return K?TK_REEL_V*K.spd*1.6:FP_RETR_V;}
function fpRetr(dt){const E=FS.E,tip=fpTip(),wy=water.position.y;const auto=!(FS.rod&&FS.rod.reel),hold=mouseL&&locked&&state==='play';
  if(FS.arc){const A=FS.arc;A.t+=dt;const k=Math.min(1,A.t/FP_LIFT_T),e=k*k*(3-2*k),hgt=Math.sin(Math.PI*k)*(1.2+Math.hypot(tip.x-A.x,tip.z-A.z)*.12);
    E.x=lerp(A.x,tip.x,e);E.z=lerp(A.z,tip.z,e);E.y=lerp(A.y,tip.y-.4,e)+hgt;FS.bx=E.x;FS.bz=E.z;if(k>=1){FS.arc=null;fishReset();}return;}   // nosto: kaari ilman kautta, ei maahan tarttumista
  if(!auto&&!hold&&!FS.fin)return;
  const dx=tip.x-E.x,dz=tip.z-E.z,d=Math.hypot(dx,dz);
  if(FS.fin||d<FP_TIP_R){FS.fin=(FS.fin||0)+dt;const k=Math.min(1,FS.fin/.25);E.x=lerp(E.x,tip.x,k);E.y=lerp(E.y,tip.y-.4,k);E.z=lerp(E.z,tip.z,k);if(k>=1){fishReset();}return;}
  const v=fpReelV()*dt,mv=Math.min(v,d);E.x+=dx/d*mv;E.z+=dz/d*mv;FS.bx=E.x;FS.bz=E.z;const th=terrainH(E.x,E.z);
  if(th<wy-.05){E.y=FS.spin?wy-.05:wy;FS.where='water';}else{E.y=th+.03;FS.where='land';FS.landM+=mv;while(FS.landM>=1){FS.landM-=1;if(Math.random()<FP_LAND_SNAP){fpLandSnap();return;}}}
  if(!auto){FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.5;tkSnd('veivaus')||tkSnd('virveli_kelaus')||plSnd('onkiminen','kelaus',{v:.35});}}}
// siima katkeaa maata pitkin vedettäessä: viehe jää maahan poimittavaksi
function fpLandSnap(){const r=tkRig(),E=FS.E;let t='Siima tarttui maastoon ja katkesi.';
  if(r){if(r.lure){spawnDrop(r.lure,1,E.x,E.y+.15,E.z);t+=` ${ITEMS[r.lure].n} jäi maahan – poimi se.`;r.lure=null;}
    if(r.line){r.line=null;r.lw=1;t+=' Solmi uusi siima repusta (E).';}invDirty=true;updateGear();}
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
function fpPullStart(){const E=FS.E||{x:FS.bx,y:water.position.y,z:FS.bz};FS.E=E;FS.H0={x:E.x,z:E.z};FS.pt=0;FS.loose=0;FS.S=fpStr();FS.ph=Math.random()*6;FS.lift=0;
  {const t=fpTip();FS.L=Math.max(FP_TETHER_MIN,Math.hypot(E.x-t.x,E.y-t.y,E.z-t.z));}   // v3.29 siiman pituus koukkuun tarttuessa (kiinteä; virvelillä kelaus lyhentää)
  if(FISH_B[FS.sp]){fpFishDrop();const L=fpFishLen(FS.sp,FS.kg),m=tkFishMesh(FS.sp,L);fpFadeMats(m,0);scene.add(m);FS.fm=m;FS.fa=0;if(FS.bob)FS.bob.visible=false;}}
function fpFishLen(sp,kg){return Math.min(.95,.16+Math.cbrt(Math.max(.02,kg))*.24);}
function fpFadeMats(g,a){g.traverse(o=>{if(!o.isMesh)return;if(!o.userData.fpm){o.material=o.material.clone();o.userData.fpm=o.material.opacity;}o.material.transparent=a<.999||o.userData.fpm<1;o.material.opacity=o.userData.fpm*a;});}
function fpFishDrop(){if(FS.fm){scene.remove(FS.fm);FS.fm.traverse(o=>{if(o.isMesh){if(o.geometry)o.geometry.dispose();if(o.userData.fpm!=null)o.material.dispose();}});FS.fm=null;}}
/* v3.29 käyttäjä: KIINTEÄ SIIMA. Kala on siiman päässä (FS.L, kärjestä mitattuna). Onki ei kelaa: vapa nousee ylös (FS.lift → siima lyhenee vavan nostolla
   FP_LIFT_GAIN m) ja kalan voi raahata kävelemällä taaksepäin – se seuraa maata pitkin, eikä siima katkea. Virveli kelaa (siima lyhenee) ja raahaus toimii myös.
   Kala nousee kärkeen (fishLift), kun se on kärjen alla (alle 1,4 m vaakaan) tai siima on niin lyhyt, että kala irtoaa maasta/vedestä. Vasen ongella: maalla
   olevan kalan nosto, kun se on alle 4 m päässä. Kala irtoaa vain, jos käsiesine vaihtuu (fpLoseOnLine). */
function fpPull(dt){const E=FS.E,tip=fpTip(),hold=mouseL&&locked&&state==='play',S=FS.S,wy=water.position.y;FS.pt+=dt;
  if(FS.spin){if(hold){FS.L=Math.max(FP_TETHER_MIN,FS.L-TK_REEL_V*FS.rod.reel.spd*1.4*(1-.35*S)*dt);FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.45;tkSnd('veivaus')||plSnd('onkiminen','kelaus',{v:.45});}}}
  else FS.lift=Math.min(1,FS.lift+dt*(hold?2.2:1.2));
  const wet0=terrainH(E.x,E.z)<wy-.08;if(wet0){const ax=E.x-tip.x,az=E.z-tip.z,al=Math.hypot(ax,az)||1,sw=(.35+1.1*S)*Math.max(.15,1-FS.pt/25);E.x+=ax/al*sw*dt;E.z+=az/al*sw*dt;}   // kala yrittää uida pois (väsyy)
  fpFishY();const Le=Math.max(.5,FS.L-(FS.spin?0:FS.lift*FP_LIFT_GAIN)),dy=Math.max(0,tip.y-E.y),Lh=Math.sqrt(Math.max(.04,Le*Le-dy*dy)),hx=E.x-tip.x,hz=E.z-tip.z,hd=Math.hypot(hx,hz)||1e-4;
  if(hd>Lh){E.x=tip.x+hx/hd*Lh;E.z=tip.z+hz/hd*Lh;fpFishY();}FS.bx=E.x;FS.bz=E.z;FS.tight=hd>=Lh-.05;
  const h2=Math.hypot(E.x-tip.x,E.z-tip.z),wet=terrainH(E.x,E.z)<wy-.08;
  if(h2<1.4||Le<=dy+.35||(!FS.spin&&!wet&&hold&&FS.pt>.6&&h2<4))fishLift();}
// kala irtoaa siimasta (käsiesine vaihtui, kuolema, uinti): maalla se jää sätkimään, vedessä ui pois
function fpLoseOnLine(){const E=FS.E,sp=FS.sp;if(E&&FISH_B[sp]){const wet=terrainH(E.x,E.z)<water.position.y-.08;if(!wet&&!P.dead)fpFlop(sp,FS.kg,FS.cm||fbLen(sp,FS.kg,.5),E.x,E.y+.1,E.z,0,.8,0);fishReset(wet?`Kala pääsi karkuun: ${ITEMS[sp].n} irtosi siimasta.`:null,wet?'warn':null);return;}fishReset();}
function fpFightPos(){const E=FS.E,k=clamp(FS.prog,0,1)*.6;E.x=lerp(FS.H0.x,P.pos.x,k);E.z=lerp(FS.H0.z,P.pos.z,k);FS.bx=E.x;FS.bz=E.z;fpFishY();}
function fpFishY(){const E=FS.E,wy=water.position.y,th=terrainH(E.x,E.z);E.y=th<wy-.08?wy-.04-(FS.st==='fight'&&FS.pullOn?.12:0):th+.05;}
// kalan 3D: kyljellään (pää kohti pelaajaa), sivuttaisheilunta painon ja koon mukaan, häivytys näkyviin
const _fpX=new THREE.Vector3(),_fpY=new THREE.Vector3(),_fpZ=new THREE.Vector3(0,1,0),_fpM=new THREE.Matrix4();
function fpFishUpd(dt){const m=FS.fm;if(!m)return;const E=FS.E,dx=P.pos.x-E.x,dz=P.pos.z-E.z,d=Math.hypot(dx,dz)||1,wet=terrainH(E.x,E.z)<water.position.y-.08,S=FS.S||.3,t=FS.t;
  if(!(FS.fa>=1&&m.userData.faded)){FS.fa=Math.min(1,(FS.fa||0)+dt/FP_FADE_T);fpFadeMats(m,FS.fa);if(FS.fa>=1)m.userData.faded=1;}   // v3.29 häivytys vain kunnes valmis
  const A=wet?(.12+1.5*S)*(FS.st==='fight'&&FS.pullOn?1.6:1):.06,sw=Math.sin(t*(2.2-S)+FS.ph)*A+Math.sin(t*5.3+FS.ph*2)*A*.25;
  const px=-dz/d,pz=dx/d;m.position.set(E.x+px*sw,E.y,E.z+pz*sw);
  const yaw=Math.cos(t*(2.2-S)+FS.ph)*.5*(wet?1:.3);_fpY.set(dx/d,0,dz/d).applyAxisAngle(_fpZ,yaw);_fpX.crossVectors(_fpY,_fpZ);_fpM.makeBasis(_fpX,_fpY,_fpZ);m.quaternion.setFromRotationMatrix(_fpM);
  const tl=m.userData.tail;if(tl)tl.rotation.x=Math.sin(t*(wet?14:22))*.6;
  if(wet&&Math.random()<dt*(1+S*3)*(FISH_LQ?.5:1)&&typeof burst==='function')burst(m.position.x,water.position.y+.03,m.position.z,0xcfe8f0,2,.8+S);}
/* ---------------- KÄRJESSÄ ROIKKUVA KALA PUTOAA (pois käveleminen / esineen vaihto) ---------------- */
const FLOPS=[],_fpE=new THREE.Euler();
function fpHangCheck(dt){const rod=rodDef();if(!rod||(FS.slot&&equipped('weapon')!==FS.slot)||P.dead||P.swim||state==='dead'){fpHangDrop();return true;}   // v3.29 käveleminen ei pudota
  if(FS.fullT>0&&dt){FS.fullT-=dt;if(FS.fullT<=0){FS.fullT=0;msg(`${ITEMS[FS.sp].n} rimpuili irti koukusta – reppu oli täynnä.`,'warn');fpHangDrop(2.4);return true;}}return false;}
function fpHangDrop(jump){const D=FS.dg,sp=FS.sp,kg=FS.kg,cm=FS.cm||(typeof fbLen==='function'?fbLen(sp,kg,Math.random()):0);let x=P.pos.x,y=P.pos.y+1.2,z=P.pos.z;
  if(D){D.piv.updateMatrixWorld(true);x=D.piv.position.x;y=D.piv.position.y-.2;z=D.piv.position.z;D.hold=false;D.t=1e9;FS.dg=null;}
  const a=Math.random()*TAU,j=jump||0;fpFlop(sp,kg,cm,x,y,z,(Math.random()-.5)*1.5+Math.sin(a)*j,.5+j,(Math.random()-.5)*1.5+Math.cos(a)*j);fishReset();}
function fpFlop(sp,kg,cm,x,y,z,vx,vy,vz){const L=fpFishLen(sp,kg),m=tkFishMesh(sp,L);scene.add(m);const F={sp,kg,cm,m,x,y,z,vx,vy,vz,age:0,hop:.4,wt:0,swim:0,ry:Math.random()*TAU,L};
  F.it={x,y,z,r:1.7,flop:F,label:()=>`${ITEMS[sp].n} sätkii maassa – E: poimi`,use:()=>fpFlopPick(F),off:()=>P.inDun||F.swim>0};interactables.push(F.it);FLOPS.push(F);return F;}
function fpFlopKill(F){scene.remove(F.m);F.m.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose();});const i=interactables.indexOf(F.it);if(i>=0)interactables.splice(i,1);const j=FLOPS.indexOf(F);if(j>=0)FLOPS.splice(j,1);}
function fpFlopPick(F){if(F.swim>0)return;if(!fishCanFit(F.sp,F.kg,F.cm)){msg('Reppu on täynnä.','warn');return;}fpFlopKill(F);fishGive(F.sp,F.kg,F.cm);sfx('pickup');msg(`Poimit kalan: ${ITEMS[F.sp].n}.`);}   // v3.29 täysi reppu: kala jää maahan
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
        F.hop-=dt;if(F.hop<=0&&F.age<FP_FLOP_T){F.hop=(.45+Math.random()*.8)/FP_FLOP_K;const a=Math.random()*TAU,s=(.4+Math.random()*.9*(1-F.age/FP_FLOP_T))*1.2;F.vy=(1.4+Math.random()*1.4*(1-F.age/FP_FLOP_T))*Math.sqrt(FP_FLOP_K);   /* v3.29 1,5× rimpuilu */F.vx+=Math.sin(a)*s;F.vz+=Math.cos(a)*s;tkSnd('kala_rimpuilee');}}}
    if(!inW&&F.age>FP_FLOP_T+3&&F.vy===0&&Math.hypot(F.vx,F.vz)<.05){fpFlopKill(F);spawnDrop(F.sp,1,F.x,F.y+.1,F.z);drops[drops.length-1].ex={fl:[{kg:F.kg,cm:F.cm,t:fishNow()}]};continue;}   // rauhoittui → tavallinen pudonnut esine
    const ag=Math.max(0,1-F.age/FP_FLOP_T);F.ry+=Math.sin(F.age*9)*dt*3*ag;F.m.position.set(F.x,F.y,F.z);F.m.quaternion.setFromEuler(_fpE.set(Math.PI/2,F.ry,Math.sin(F.age*14)*.35*ag,'YXZ'));   /* kyljellään */
    const tl=F.m.userData.tail;if(tl)tl.rotation.x=Math.sin(F.age*20)*.8*ag;F.it.x=F.x;F.it.y=F.y+.2;F.it.z=F.z;}}
function fpSwimDir(F){let best=Math.random()*TAU,bd=-1e9;for(let i=0;i<12;i++){const a=i/12*TAU,s=water.position.y-terrainH(F.x+Math.sin(a)*5,F.z+Math.cos(a)*5);if(s>bd){bd=s;best=a;}}return best;}
/* ---------------- SYVÄLLE NIELTY KOUKKU: minipeli ---------------- */
/* v3.35 käyttäjä: alue ei nopeudu ollenkaan (ennen +0,07 / yritys ja kapeni) – nopeus vaihtelee pehmeästi ±16 % (HG_SPV) perusnopeuden HG_SP0 ympärillä,
   suunta kääntyy pehmeästi (nopeus lähestyy tavoitetta kExp). Ilmoitus: koukku/uistin jäi kiduksiin. Ohjeena hiiren kuva, joka liikkuu sivuttain silmukassa;
   häipyy kun hiirtä liikutetaan; näytetään 10 ensimmäisellä kerralla (localStorage hiidenmaa_hgHint). */
const HG_SP0=.16,HG_SPV=.16,HG_ZW=.2,HG_HINT_N=10;
const HG={on:false,el:null,c:.5,cv:0,dir:1,zw:HG_ZW,mk:.5,fill:.35,tries:0,t:0,ph:[0,0],hint:false,moved:0};
function fpHookP(){const V=typeof fishValue==='function'?fishValue(FS.sp,FS.kg,FS.cm||fbLen(FS.sp,FS.kg,.5)):null;return lerp(FP_HOOK_P[0],FP_HOOK_P[1],V?clamp(V.pct,0,1):.3);}
function hgHintN(v){try{if(v!=null)localStorage.setItem('hiidenmaa_hgHint',String(v));return +(localStorage.getItem('hiidenmaa_hgHint')||0);}catch(e){return 0;}}
const HG_MOUSE='<svg viewBox="0 0 40 46" width="40" height="46"><path d="M4 23h-3m3 0l3-3m-3 3l3 3M36 23h3m-3 0l-3-3m3 3l-3 3" stroke="#f3e6c4" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/><rect x="11" y="6" width="18" height="30" rx="9" fill="rgba(20,16,12,.55)" stroke="#f3e6c4" stroke-width="2"/><line x1="20" y1="6" x2="20" y2="17" stroke="#f3e6c4" stroke-width="1.6"/><rect x="18.6" y="10" width="2.8" height="5" rx="1.4" fill="#e8a44a"/></svg>';
function fpUnhookStart(){const lure=!!(FS.spin&&FS.rod&&FS.rod.lureId),thing=lure?'Uistin':'Koukku';
  Object.assign(HG,{on:true,c:.5,cv:0,dir:Math.random()<.5?-1:1,zw:HG_ZW,mk:.5,fill:.35,tries:0,t:0,ph:[Math.random()*6,Math.random()*6],moved:0});FS.st='unhook';
  let el=document.getElementById('hookG');if(!el){el=document.createElement('div');el.id='hookG';el.innerHTML='<div class="hgT"></div><div class="hgBar"><i class="hgZ"></i><i class="hgM"></i></div><div class="hgF"><i></i></div><div class="hgMouse">'+HG_MOUSE+'</div><div class="hgH">Liikuta hiirtä sivuttain – pidä viiva punaisella alueella</div>';document.getElementById('hud').appendChild(el);}
  el.querySelector('.hgT').textContent=`${thing} jäi pahasti kiinni – kiduksiin!`;msg(`${thing} jäi kalan kiduksiin kiinni – irrota varovasti.`,'warn');
  const n=hgHintN();HG.hint=n<HG_HINT_N;el.querySelector('.hgMouse').classList.toggle('off',!HG.hint);el.querySelector('.hgMouse').style.display=HG.hint?'':'none';if(HG.hint)hgHintN(n+1);
  el.hidden=false;HG.el=el;tkSnd('koukku_syvalla');}
function fpUnhookMove(dx){if(!HG.on)return false;HG.mk=clamp(HG.mk+dx*.0026,0,1);HG.moved+=Math.abs(dx);if(HG.hint&&HG.moved>40){HG.hint=false;HG.el&&HG.el.querySelector('.hgMouse').classList.add('off');}return true;}
// nopeus: perus × (1 ± 16 %) pehmeästi (kaksi hidasta siniaaltoa), ei kasva yrityksistä
function hgSpeed(t){return HG_SP0*(1+HG_SPV*(.6*Math.sin(t*.9+HG.ph[0])+.4*Math.sin(t*1.7+HG.ph[1])));}
function fpUnhookTick(dt){if(!HG.on)return;if(fpHangCheck(dt)){fpUnhookEnd();return;}HG.t+=dt;
  if(Math.random()<dt*.35)HG.dir=-HG.dir;if(HG.c<=HG.zw/2+.02)HG.dir=1;else if(HG.c>=1-HG.zw/2-.02)HG.dir=-1;
  HG.cv+=(HG.dir*hgSpeed(HG.t)-HG.cv)*kExp(3,dt);HG.c=clamp(HG.c+HG.cv*dt,HG.zw/2,1-HG.zw/2);
  const inZ=Math.abs(HG.mk-HG.c)<=HG.zw/2;HG.fill=clamp(HG.fill+(inZ?.42:-.28)*dt,0,1);
  const el=HG.el;el.querySelector('.hgZ').style.cssText=`left:${(HG.c-HG.zw/2)*100}%;width:${HG.zw*100}%`;el.querySelector('.hgM').style.left=`${HG.mk*100}%`;el.querySelector('.hgF i').style.width=`${HG.fill*100}%`;el.classList.toggle('in',inZ);
  if(HG.fill>=1){fpUnhookEnd();tkSnd('koukun_irrotus');fishTake(false,true);return;}
  if(HG.fill<=0){HG.tries++;HG.fill=.35;el.querySelector('.hgT').textContent=`Uusi yritys (${HG.tries + 1}) – ${FS.spin?'uistin':'koukku'} on yhä kiduksissa`;tkSnd('koukku_syvalla');}}
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
  // lataus nostaa kädet ylös ja taakse, heitto heilauttaa ne eteen (0,15 s) ja takaisin
  const ck=FS.st==='charge'?sstep(0,1,fpChargeK()):0,ct=playTime-(P.castT??-9),sw=FS.rod&&FS.rod.reel&&ct<.5?(ct<.12?ct/.12:1-(ct-.12)/.38):0;VIRV.up=lerp(VIRV.up||0,ck,kExp(FS.st==='charge'?8:30,dt));
  const up=VIRV.up*.3-sw*.08,fw=.34-VIRV.up*.16+sw*.16;
  _vX.set((_vS.x+_vK.x)/2+Math.sin(P.yaw)*fw+lx/ll*.07,(_vS.y+_vK.y)/2-.2+up,(_vS.z+_vK.z)/2+Math.cos(P.yaw)*fw+lz/ll*.07);armIK(fig.armL,fig.elbowL,_vX,k,_poleBowL);
  if(FS.st==='charge'||sw>0)P.yaw=lerpAngle(P.yaw,camYaw+Math.PI,kExp(18,dt));
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
/* ONGEN HEITTO (ei latausta): nopea kiskaisu – käsi nousee taakse yläviistoon (0,08 s), piiskaa eteen (0,14 s) ja palautuu (0,3 s); vapa kallistuu taakse
   nousun ajan. Oikean käden lisäkulma, joten yleinen asento pysyy pohjana. */
function rodCastPose(dt){const hm=typeof heldMesh!=='undefined'?heldMesh:null;if(!hm||hm.userData.virv||!hm.userData.bend||hm.parent!==fig.hand||P.dead||P.insp){P.rodHoldK=0;return;}
  if(!hm.userData.q0)hm.userData.q0=hm.quaternion.clone();hm.quaternion.copy(hm.userData.q0);
  // kalastusasento: kun siima on vedessä, käsi pysyy edessä ja vapa osoittaa veteen (26° ylös)
  const fishing=FS.st!=='idle'&&FS.st!=='charge';P.rodHoldK=lerp(P.rodHoldK||0,fishing?1:0,kExp(6,dt));
  const t=playTime-(P.castT??-9),c=t>=0&&t<=.52;let a=0,pa=FS.st==='hang'||FS.st==='unhook'?.9:FS.st==='fight'?.8:FS.st==='pull'?.6+(FS.lift||0)*.6:.45;
  if(c){a=t<.08?-1.7*sstep(0,1,t/.08):t<.22?lerp(-1.7,.35,sstep(0,1,(t-.08)/.14)):lerp(.35,0,sstep(0,1,(t-.22)/.3));pa=t<.08?lerp(.45,1.85,sstep(0,1,t/.08)):t<.22?lerp(1.85,-.15,sstep(0,1,(t-.08)/.14)):lerp(-.15,.45,sstep(0,1,(t-.22)/.3));P.yaw=lerpAngle(P.yaw,camYaw+Math.PI,kExp(25,dt));}
  const h=P.rodHoldK,w=c?1:h;a+=-.85*h;P._cOff=[a,Math.min(0,a+.85*h)*.35-.35*h];fig.armR.rotation.x+=P._cOff[0];fig.elbowR.rotation.x+=P._cOff[1];
  if(w<.01)return;fig.g.updateMatrixWorld(true);const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw),cp=Math.cos(pa);_vZ.set(fx*cp,Math.sin(pa),fz*cp).normalize();_vX.set(0,1,0).cross(_vZ).normalize();_vY.crossVectors(_vZ,_vX);
  _vM.makeBasis(_vX,_vY,_vZ);_vq.setFromRotationMatrix(_vM);hm.parent.getWorldQuaternion(_vq2);_vq.premultiply(_vq2.invert());hm.quaternion.slerp(_vq,w);}
/* ---------------- PÄÄSILMUKKA (fish.js fishTick kutsuu) ---------------- */
function fpTick(dt){fpFlopTick(dt);fishSpoilTick(dt);nauPlaqueTick();if(FS.fm&&(FS.st==='pull'||FS.st==='fight'))fpFishUpd(dt);else if(FS.fm&&FS.st!=='pull'&&FS.st!=='fight')fpFishDrop();}
