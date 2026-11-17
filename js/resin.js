'use strict';
/* v2.91 PUUKKO JA PIHKANKERÄYS (käyttäjän suunnitelma ja vastaukset).
   - Pihkapuu: 3 % männyistä ja kuusista (koko ≥ RESIN_MIN_S), maailman seedin mukaan (resinHash). Jokaisessa maailmassa vähintään yksi
     aloituspaikan lähellä (flags.resinG). Ainoa tuntomerkki: runko kellertää hieman (pienet pihkavalumat). Ei ilmoituksia; E-ohje vasta
     aivan rungon vieressä (RESIN_REACH) ja vain, kun kädessä on puukko, kulho tai naru.
   - Kaiverrus: puukko kädessä E → kalanruotokuvio pelaajan korkeudelle (CARVE_T 10 s animaatio). Kävele pois tai vaihda käsi → keskeytyy,
     jatkuu samasta kohdasta. Puukon taso 3: 20 % nopeampi kaiverrus ja pihkan valuminen (taso 2: 10 %).
   - Kulho: tyhjä kulho kädessä + naru toisessa kädessä, E → kulho sidotaan kuvion alareunaan. Pihkaa kertyy puun koon mukaan resinCap (10–50, v2.95) RESIN_T
     sekunnissa (1 h oikeaa aikaa, vain pelin ollessa käynnissä, pelaajan ei tarvitse olla paikalla). E irrottaa kulhon: kulho, naru ja pihkat
     reppuun. Kun puu on tyhjä, kuvio hiipuu pois (RESIN_FADE). Kaatunut puu (myrsky, kirves): kulho, naru ja pihkat putoavat maahan + ilmoitus.
   - Vesikulho: hiiren vasen kulho kädessä veden ääressä → vesikulho. Vesikulho: juo (vatsakipu kuluu 5× nopeammin kunnes ohi) tai palaessa
     kaada päälle (tuli sammuu). Tila tallentuu flags.resin[n.id] (n.id = solmun pysyvä järjestysnumero). */
/* v2.95 pihkan määrä puun koon mukaan: pienin pihkapuu RESIN_CAP_MIN, suurin (koko RESIN_S_MAX) RESIN_CAP_MAX; kaikki valuvat RESIN_T:ssä (1 h).
   RESIN_MAX = vanhojen tallennusten oletus (e.cap puuttuu). */
const RESIN_CAP_MIN=10,RESIN_CAP_MAX=50,RESIN_S_MAX=2.0;
const RESIN_P=.03,RESIN_MIN_S=.75,RESIN_MAX=20,RESIN_T=3600,RESIN_FADE=120,CARVE_T=10,RESIN_G_R=80,RESIN_VIS_R=40;
const RES={vis:new Map(),flagsRef:null,t:0,near:[],sndT:0};
function resinHash(id){let h=Math.imul((id|0)+1,2654435761)^Math.imul(((typeof SEED==='number'?SEED:0)|0)+7,40503);h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;return (h>>>0)/4294967296;}
function resinKind(n){return !!n&&n.def&&n.def.kind==='tree'&&(n.type==='manty'||n.type==='kuusi')&&!n.isLog&&!n.dun;}
function resinEligible(n){return resinKind(n)&&n.s>=RESIN_MIN_S;}
function resinStore(){if(!flags.resin)flags.resin={};return flags.resin;}
function resinState(n){return n&&flags.resin?flags.resin[n.id]:null;}
// pihkapuu (ei tyhjentynyt): 3 % tai maailman taattu puu
function isResinTree(n){if(!resinEligible(n)||!n.alive)return false;const e=resinState(n);if(e&&e.done)return false;return resinHash(n.id)<RESIN_P||n.id===flags.resinG;}
// rungon puolileveys (laatikkorunko: kuusi 0,4 m, mänty 0,36 m) ja tyven korkeus (puu upotetaan rinteeseen kuten setNodeMatrix)
function resinHW(n){return (n.type==='kuusi'?.2:.18)*n.s;}
function resinTrunkH(n){return (n.type==='kuusi'?2.2:2.6)*n.s;}
function resinBase(n){const [gx,gz]=groundSlope(n.x,n.z),sl=Math.hypot(gx,gz);return n.y-.05-Math.min(.6,sl*(n.def.r||.3)*n.s*1.3);}
const RESIN_REACH=n=>resinHW(n)+.95;
function resinCap(n){return Math.round(RESIN_CAP_MIN+(RESIN_CAP_MAX-RESIN_CAP_MIN)*clamp((n.s-RESIN_MIN_S)/(RESIN_S_MAX-RESIN_MIN_S),0,1));}
function eCap(e){return e.cap||RESIN_MAX;}
function resinFlowK(q){return q>=3?1.2:q===2?1.1:1;}
// maailman taattu pihkapuu aloituspaikan lähelle, jos 3 % ei osu yhteenkään (kerran maailmaa kohti)
function resinEnsureG(){if(flags.resinG!==undefined||!nodes.length||!LOC.spawn)return;const sx=LOC.spawn.x,sz=LOC.spawn.z;let best=null,bd=1e9;
  for(const n of nodes){if(!resinEligible(n)||!n.alive)continue;const d=Math.hypot(n.x-sx,n.z-sz);if(d<RESIN_G_R&&resinHash(n.id)<RESIN_P){flags.resinG=-1;return;}if(d<bd&&d>6){bd=d;best=n;}}
  flags.resinG=best?best.id:-1;}
let _resNodeMap=null;
function resinNode(id){if(!_resNodeMap||_resNodeMap.size!==nodes.length){_resNodeMap=new Map();for(const n of nodes)_resNodeMap.set(n.id,n);}return _resNodeMap.get(+id)||null;}

/* ---------- vesikulho ---------- */
function nearWater(){if(P.inDun)return false;if(P.inWater)return true;const wl=water.position.y;
  for(let a=0;a<8;a++){const dx=Math.sin(a*TAU/8),dz=Math.cos(a*TAU/8);for(const r of [.8,1.6,2.4])if(terrainH(P.pos.x+dx*r,P.pos.z+dz*r)<wl-.05)return true;}return false;}
function heldBowl(){const w=equipped('weapon');return w&&ITEMS[w.id].cat==='bowl'?w:null;}
function bowlUse(){const s=heldBowl();if(!s||P.dead)return;
  if(s.id==='kulho'){if(nearWater()){s.id='vesikulho';invDirty=true;updateGear();msg('Täytit kulhon vedellä – nyt se on vesikulho.','loot');plSnd('kaytto','kulho_taytto');sfx('pickup');}
    else msg('Mene veden ääreen täyttääksesi kulhon (hiiren vasen kulho kädessä).','warn');return;}
  if(s.id==='vesikulho'){s.id='kulho';invDirty=true;updateGear();
    if(P.burnT>0){P.burnT=0;P.igniteCd=playTime+FIRE_CD;if(P.fireFx){fig.g.remove(P.fireFx);P.fireFx=null;}burst(P.pos.x,P.pos.y+1.4,P.pos.z,0x8fc8ff,14,3);smokePuff(P.pos.x,P.pos.y+1.5,P.pos.z,1,.3);plSnd('kaytto','vesi_kaato');msg('Kaadoit veden päällesi – tuli sammui. Kulho on taas tyhjä.','loot');return;}
    plSnd('kaytto','juominen');
    if(P.buffs.vatsakipu){P.vatsaFast=true;msg('Joit kulhollisen vettä – vatsakipu helpottaa nyt viisi kertaa nopeammin.','loot');}
    else msg('Joit kulhollisen raikasta vettä. Kulho on taas tyhjä.');return;}}

/* ---------- vuorovaikutus ---------- */
function resinHeldIds(){const w=equipped('weapon'),o=equipped('offhand');return {w:w?w.id:null,o:o?o.id:null,wq:w?(w.q||1):1};}
// findInteract: pihkapuu aivan vieressä (ja jo aloitetut puut aina, jos kulho on kiinni)
function resinConsider(consider){if(P.inDun)return;for(const n of nodesNear(P.pos.x,P.pos.z,2,_resNl)){if(!resinKind(n))continue;const e=resinState(n),l=resinLabel(n,e);if(!l)continue;
    const by=resinBase(n);consider(n.x,by+1.1,n.z,{kind:'resin',n,label:l},RESIN_REACH(n),false);}}
const _resNl=[];
function resinLabel(n,e){const h=resinHeldIds(),pk=h.w==='puukko',tool=pk||h.w==='kulho'||h.w==='vesikulho'||h.o==='naru';
  if(e&&e.b)return `Irrota kulho (pihkaa ${Math.floor(e.acc||0)})`;
  if(!isResinTree(n))return null;
  const c=e?e.c||0:0;
  if(c<1){if(pk)return c>0?`Jatka pihkakuvion kaiverrusta (${Math.floor(c*100)} %)`:'Kaiverra pihkakuvio';if(c>0||tool)return 'Kaiverra ensin pihkakuvio puukolla';return null;}
  if((e.tot||0)>=eCap(e))return null;
  return 'Kiinnitä kulho narulla';}
function resinInteract(n){const st=resinStore(),h=resinHeldIds();let e=st[n.id];
  if(e&&e.b){resinDetach(n,e);return;}
  if(!isResinTree(n))return;
  const c=e?e.c||0:0;
  if(c<1){if(h.w!=='puukko'){msg('Tarvitset puukon kädessä kaivertaaksesi pihkakuvion. Puukon voi takoa ahjolla (rautaa ja puuta).','warn');return;}
    if(!e){e=st[n.id]={c:0,acc:0,tot:0,q:h.wq,a:resinFace(n),cap:resinCap(n)};}
    P.carve={id:n.id,last:c};msg(c>0?`Jatkat kaiverrusta (${Math.floor(c*100)} %). Pysy puun vieressä.`:'Kaiverrat pihkakuviota… pysy puun vieressä (noin 10 s).');return;}
  if((e.tot||0)>=eCap(e)){msg('Tästä puusta on valunut jo kaikki pihka.','warn');return;}
  if(h.w==='vesikulho'){msg('Kulhossa on vettä – juo tai kaada se ensin, niin kulho on tyhjä.','warn');return;}
  if(h.w!=='kulho'&&h.o!=='naru'){msg('Kiinnittääksesi kulhon tarvitset tyhjän kulhon kädessä ja narun toisessa kädessä.','warn');return;}
  if(h.w!=='kulho'){msg('Ota tyhjä kulho käteen (pikapaikka) – naru on jo toisessa kädessä.','warn');return;}
  if(h.o!=='naru'){msg(invCount('naru')>0?'Varusta naru toiseen käteen (napsauta sitä repussa).':'Tarvitset narun toiseen käteen (työpenkki: 10 nahkaa).','warn');return;}
  const w=equipped('weapon'),o=equipped('offhand');resinTake(w);resinTake(o);updateGear();invDirty=true;
  e.b=1;e.acc=e.acc||0;plSnd('kaytto','kulho_kiinni');sfx('build');
  msg(`Kulho sidottu pihkakuvion alle. Tästä puusta valuu noin ${eCap(e)} pihkaa tunnin aikana (vain pelin ollessa käynnissä) – voit lähteä muualle.`,'loot');}
function resinTake(s){if(!s)return;s.n--;if(s.n<=0){const i=inv.indexOf(s);if(i>=0)inv[i]=null;}}
function resinDetach(n,e){const k=Math.floor(e.acc||0);giveOrDrop('kulho',1,n.x,resinBase(n)+.6,n.z);giveOrDrop('naru',1,n.x,resinBase(n)+.6,n.z);
  if(k>0){giveOrDrop('pihka',k,n.x,resinBase(n)+.6,n.z);e.acc-=k;bump('resin',k);addXp(k*4,'Pihkankeräys');}
  e.b=0;plSnd('kaytto','kulho_kiinni');msg(k>0?`Irrotit kulhon: ${k} pihkaa.`:'Irrotit kulhon – pihkaa ei ollut vielä kertynyt.','loot');}
// E ilman kohdetta: puukko kädessä aivan muun puun vieressä → selvä ilmoitus
function resinNoTarget(){const h=resinHeldIds();if(h.w!=='puukko'&&h.w!=='kulho'&&h.o!=='naru')return;
  for(const n of nodesNear(P.pos.x,P.pos.z,1.6,_resNl)){if(n.def.kind!=='tree'||n.isLog)continue;const hw=n.type==='kuusi'||n.type==='manty'?resinHW(n):(n.def.r||.3)*n.s;if(Math.hypot(n.x-P.pos.x,n.z-P.pos.z)>hw+.95)continue;
    if(!resinKind(n)){msg('Pihkaa valutetaan vain männyistä ja kuusista.','warn');return;}
    if(n.s<RESIN_MIN_S){msg('Puu on liian nuori pihkankeräykseen.','warn');return;}
    const e=resinState(n);msg(e&&e.done?'Tästä puusta on valunut jo kaikki pihka.':'Tästä puusta ei valu tarpeeksi pihkaa. Etsi runko, joka kellertää.','warn');return;}}
// kaiverruspinta: rungon sivu, joka on lähimpänä pelaajaa (laatikkorungon sivut n.rot + k·90°)
function resinFace(n){const a=Math.atan2(P.pos.x-n.x,P.pos.z-n.z);let best=0,bd=9;for(let k=0;k<4;k++){const f=(n.rot||0)+k*Math.PI/2,d=Math.abs(Math.atan2(Math.sin(a-f),Math.cos(a-f)));if(d<bd){bd=d;best=f;}}return best;}

/* ---------- kaiverrus (animaatio player.js: carvePose) ---------- */
function carveStop(txt){if(!P.carve)return;P.carve=null;if(txt)msg(txt,'warn');}
function carveTick(dt){const C=P.carve;if(!C)return;const n=resinNode(C.id),e=n&&resinState(n);
  if(!n||!e||!n.alive){carveStop();return;}
  const h=resinHeldIds(),far=Math.hypot(n.x-P.pos.x,n.z-P.pos.z)>RESIN_REACH(n)+.35;
  if(far||h.w!=='puukko'||P.dead||P.atk||P.swim){carveStop(`Kaiverrus keskeytyi (${Math.floor(e.c*100)} %). Jatka painamalla E puukko kädessä puun vieressä.`);return;}
  P.yaw=Math.atan2(n.x-P.pos.x,n.z-P.pos.z);e.q=Math.max(1,h.wq);
  e.c=Math.min(1,e.c+dt*resinFlowK(h.wq)/CARVE_T);RES.sndT-=dt;if(RES.sndT<=0){RES.sndT=.55;plSnd('kaytto','kaiverrus',{pos:{x:n.x,y:resinBase(n)+1.1,z:n.z}});if(Math.random()<.6)burst(n.x+Math.sin(e.a)*(resinHW(n)+.05),resinBase(n)+.6+(1-e.c)*.9,n.z+Math.cos(e.a)*(resinHW(n)+.05),0xc89a5a,3,1.2);}
  if(e.c>=1){P.carve=null;e.q=Math.max(1,h.wq);addXp(25,'Pihkakuvio');msg('Pihkakuvio valmis! Sido kuvion alle kulho: tyhjä kulho kädessä, naru toisessa kädessä, E.','loot');sfx('craft');}}
// oikea käsi vetää puukkoa kuvion uria pitkin, vasen tukee runkoa
function carvePose(){if(!P.carve)return;const t=playTime*8.5,s=Math.sin(t);
  fig.armR.rotation.x=-1.12+.2*s;fig.armR.rotation.z=.18+.08*Math.sin(t*.5);fig.elbowR.rotation.x=-.75+.3*Math.sin(t+1);
  fig.armL.rotation.x=-1.25;fig.armL.rotation.z=-.1;fig.elbowL.rotation.x=-.35;}

/* ---------- kertyminen, kaatuminen ja hiipuminen ---------- */
function resinTick(dt,td=dt){   // td = pelin ajan nopeus (kertymä ja hiipuminen), dt = kaiverrus
 if(RES.flagsRef!==flags){RES.flagsRef=flags;resinClearVis();_resNodeMap=null;}
  resinEnsureG();carveTick(dt);
  const st=flags.resin;if(st)for(const id in st){const e=st[id];
    if(e.b&&(e.tot||0)<eCap(e)){const add=Math.min(eCap(e)-(e.tot||0),td*eCap(e)/RESIN_T*resinFlowK(e.q||1));e.acc=(e.acc||0)+add;e.tot=(e.tot||0)+add;}
    if((e.tot||0)>=eCap(e)&&!e.done){e.fade=Math.min(1,(e.fade||0)+td/RESIN_FADE);if(e.fade>=1)e.done=1;}}
  RES.t-=dt;if(RES.t<=0){RES.t=.25;resinVisTick();}}
// solmu kaatui (resources.js killNode): kulho, naru ja pihkat maahan, ilmoitus
function resinKilled(n){const st=flags&&flags.resin;if(!st||!st[n.id])return;const e=st[n.id];delete st[n.id];if(P.carve&&P.carve.id===n.id)P.carve=null;resinVisDrop(n.id);
  if(!e.b)return;const k=Math.floor(e.acc||0),y=resinBase(n)+.3;spawnDrop('kulho',1,n.x+.6,y,n.z);spawnDrop('naru',1,n.x-.5,y,n.z+.3);if(k>0)spawnDrop('pihka',k,n.x,y,n.z+.6);
  msg(`${n._storm?'Myrsky kaatoi pihkapuusi':'Pihkapuusi kaatui'} – kulho, naru${k>0?` ja ${k} pihkaa`:''} putosivat maahan.`,'warn');}

/* ---------- ulkoasu ---------- */
const RES_MAT={hint:mat(0x9a7a38),amber:mat(0xd9a03a,{emissive:0x3a2200}),bark:mat(0x9a5a2c),groove:mat(0xe8c896),bowl:mat(0xa8743e),rope:mat(0xb09a6c),fill:mat(0xd9962a,{emissive:0x2a1800})};
function resinClearVis(){for(const v of RES.vis.values())resinVisFree(v);RES.vis.clear();}
function resinVisDrop(id){const v=RES.vis.get(+id);if(v){resinVisFree(v);RES.vis.delete(+id);}}
function resinVisFree(v){scene.remove(v.g);v.g.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.userData.own)o.material.dispose();}});}
function resinVisTick(){if(P.inDun){if(RES.vis.size)resinClearVis();return;}
  const want=new Set();
  for(const n of nodesNear(P.pos.x,P.pos.z,RESIN_VIS_R,_resNl)){if(!resinKind(n))continue;const e=resinState(n);if(!isResinTree(n)&&!(e&&(e.b||!e.done)))continue;want.add(n.id);
    const key=resinVisKey(n,e),v=RES.vis.get(n.id);if(v&&v.key===key)continue;if(v)resinVisFree(v);RES.vis.set(n.id,resinBuild(n,e,key));}
  for(const [id,v] of RES.vis)if(!want.has(id)){resinVisFree(v);RES.vis.delete(id);}}
function resinVisKey(n,e){return e?[Math.floor((e.c||0)*24),e.b?1:0,Math.floor((e.fade||0)*10),Math.min(10,Math.floor((e.acc||0)/eCap(e)*10)),e.done?1:0,n.x.toFixed(2),n.z.toFixed(2)].join('|'):'h|'+n.x.toFixed(2)+'|'+n.z.toFixed(2);}
function resinBuild(n,e,key){const g=new THREE.Group(),hw=resinHW(n),by=resinBase(n),th=resinTrunkH(n);g.position.set(n.x,by,n.z);g.userData.resin=1;
  const add=(w,h,d,m,x,y,z,rz)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);if(rz)me.rotation.z=rz;me.castShadow=false;me.receiveShadow=true;g.add(me);return me;};
  // kellertävä pinta: pienet pihkavalumat kahdella sivulla (ainoa tuntomerkki)
  if(!(e&&(e.done||(e.c||0)>0))){g.rotation.y=n.rot||0;for(const [k,y,x,h] of [[0,.95,-.05,.22],[1,1.3,.04,.18],[2,.75,-.05,.14]]){const a=k*Math.PI/2,c=Math.cos(a),s=Math.sin(a),zz=hw+.004,xx=x*n.s;
      const m=add(.034*n.s,h*n.s,.008,RES_MAT.hint,xx*c+zz*s,Math.min(th-.2,y*n.s),-xx*s+zz*c);m.rotation.y=a;}}
  if(!e||!((e.c||0)>0)){scene.add(g);return {g,key};}
  // kuvio omassa ryhmässä kaiverrussivun suuntaan (paikallinen +z = ulospäin rungosta)
  const P0=new THREE.Group();P0.rotation.y=(e.a||0)-(g.rotation.y||0);g.add(P0);
  const fade=e.fade||0,op=1-fade,own=m=>{if(op>=.999)return m;const c=m.clone();c.transparent=true;c.opacity=op;c.depthWrite=false;c.userData.own=1;return c;};
  const y0=Math.max(.4,Math.min(.55,th-1.2)),y1=Math.min(1.55,th-.15),H=y1-y0,W=hw*2*.84,z=hw+.004,c=e.c||0;
  const addP=(w,h,d,m,x,y,zz,rz)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,zz);if(rz)me.rotation.z=rz;me.castShadow=false;me.receiveShadow=true;P0.add(me);return me;};
  const flow=e.b&&(e.tot||0)<eCap(e);
  // kuorittu alue kasvaa ylhäältä alas (0–30 %), urat ylhäältä alas (30–90 %), keskikouru lopuksi (90–100 %)
  const ph=H*Math.min(1,c/.3);if(ph>.01)addP(W,ph,.006,own(RES_MAT.bark),0,y1-ph/2,z);
  const N=7,L=W*.5,ang=.62,gm=own(flow?RES_MAT.amber:RES_MAT.groove);
  for(let i=0;i<N;i++){if(c<.3+.6*(i+1)/N)break;const yi=y1-.08-(H-.2)*i/(N-1)*.92;
    for(const sd of [-1,1])addP(L,.022,.006,gm,sd*Math.cos(ang)*L/2,yi+Math.sin(ang)*L/2-.02,z+.003,sd*ang);}
  if(c>=.9){const ch=(H-.04)*Math.min(1,(c-.9)/.1);addP(.03,ch,.006,gm,0,y1-.02-ch/2,z+.004);}
  // kulho narulla rungon ympärillä
  if(e.b){const by0=y0-.08,bm=RES_MAT.bowl;const b=new THREE.Mesh(new THREE.CylinderGeometry(.1,.065,.08,10,1,true),bm);b.material.side=THREE.DoubleSide;b.position.set(0,by0,z+.09);P0.add(b);
    const bot=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.01,10),bm);bot.position.set(0,by0-.04,z+.09);P0.add(bot);
    const lv=Math.min(1,(e.acc||0)/eCap(e));if(lv>.02){const f=new THREE.Mesh(new THREE.CylinderGeometry(.065+.033*lv,.065+.033*lv,.006,10),RES_MAT.fill);f.position.set(0,by0-.035+.07*lv,z+.09);P0.add(f);}
    const rw=hw+.012,ry=by0+.03;addP(rw*2+.02,.018,.018,RES_MAT.rope,0,ry,rw);addP(rw*2+.02,.018,.018,RES_MAT.rope,0,ry,-rw);addP(.018,.018,rw*2+.02,RES_MAT.rope,rw,ry,0);addP(.018,.018,rw*2+.02,RES_MAT.rope,-rw,ry,0);
    for(const sd of [-1,1])addP(.012,.07,.012,RES_MAT.rope,sd*.08,by0+.01,z+.05);}
  scene.add(g);return {g,key};}
