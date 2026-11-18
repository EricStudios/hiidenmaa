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
const RES={vis:new Map(),flagsRef:null,t:0,near:[],sndT:0,fallen:new Map()};
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
/* v3.04 käyttäjä: VESIKULHO KAATUU. Kun vesikulho on kädessä ja animaatio (esim. F-tarkastelu) kääntää kulhon suun alaspäin (suun suunta
   y < BOWL_SPILL_Y, ~100° kallistus) BOWL_SPILL_T s ajan, vesi valuu pois: kulho tyhjenee, roiske, ilmoitus "Hups…" ja hahmo kiroaa
   (paikkamerkki sounds/extra/raw/moka/kirous, avain p/moka/kirous) BOWL_CURSE_D s myöhemmin.
   Liikkuessa (kävely, juoksu, hyppy – juoksun käsienheilunta kallistaisi kulhoa ~105°) hahmo kantaa vesikulhoa varovasti: kulho pidetään vaakasuorassa
   (bowlLevel); vain F-tarkastelu (P.insp, myös AFK-lähitarkastelu) kääntää sen oikeasti → voi kaataa. */
const BOWL_SPILL_Y=-.15,BOWL_SPILL_T=.12,BOWL_CURSE_D=.45,BOWL_LEVEL_K=12,_spillQ=new THREE.Quaternion(),_spillPQ=new THREE.Quaternion(),_spillFix=new THREE.Quaternion(),_spillT=new THREE.Quaternion(),_spillV=new THREE.Vector3(),_spillUp=new THREE.Vector3(0,1,0);
function bowlLevel(hm,dt){if(!hm.userData.q0)hm.userData.q0=hm.quaternion.clone();const q0=hm.userData.q0;
  if(P.insp){_spillT.copy(q0);}else{hm.parent.getWorldQuaternion(_spillPQ);_spillQ.copy(_spillPQ).multiply(q0);_spillV.set(0,1,0).applyQuaternion(_spillQ);
    _spillFix.setFromUnitVectors(_spillV,_spillUp);_spillQ.premultiply(_spillFix);_spillT.copy(_spillPQ.invert()).multiply(_spillQ);}
  hm.quaternion.slerp(_spillT,Math.min(1,dt*BOWL_LEVEL_K));}
function bowlSpillTick(dt){if(heldId!=='vesikulho'||!heldMesh||P.dead){RES.spT=0;return;}bowlLevel(heldMesh,dt);heldMesh.getWorldQuaternion(_spillQ);const y=_spillV.set(0,1,0).applyQuaternion(_spillQ).y;
  if(y>=BOWL_SPILL_Y){RES.spT=0;return;}RES.spT=(RES.spT||0)+dt;if(RES.spT<BOWL_SPILL_T)return;RES.spT=0;bowlSpill();}
function bowlSpill(){const s=heldBowl();if(!s||s.id!=='vesikulho')return;heldMesh.getWorldPosition(_spillV);s.id='kulho';invDirty=true;updateGear();bump('spills');
  burst(_spillV.x,_spillV.y,_spillV.z,0x8fc8ff,16,2.2);plSnd('kaytto','vesi_kaato',{v:.6,pos:{x:_spillV.x,y:_spillV.y,z:_spillV.z}});
  msg('Hups! Kaadoit vedet vahingossa – kulho on taas tyhjä. Kengät kastuivat ja harmittaa.','warn');setTimeout(()=>{if(!P.dead)plSnd('moka','kirous',{v:.9});},BOWL_CURSE_D*1000);   // v3.05 käyttäjän ääni hieman hiljempaa
  P.buffs.markakengat=SPILL_FX.markakengat;P.buffs.kylmavesi=SPILL_FX.kylma;P.buffs.vihainen=SPILL_FX.vihainen;RES.angT=5+Math.random()*5;}   // v3.04 tilat
/* v3.04 käyttäjä: kaatuneesta vedestä tilat – Märät kengät (liike −11 %, SPILL_FX.markakengat s), Kylmä 30 s (kuten kylmä yö: tuli lämmittää),
   Vihainen 20 s (kestävyys kuluu 20 % nopeammin, environment.js survival; ääni p/moka/vihainen 5–10 s välein angryTick). */
const SPILL_FX={markakengat:60,kylma:30,vihainen:20},WET_SHOE_K=.89,ANGRY_STAM_K=1.2;
function angryTick(dt){if(!P.buffs.vihainen||P.dead){RES.angT=Math.max(RES.angT||0,1);return;}RES.angT=(RES.angT??5)-dt;if(RES.angT<=0){RES.angT=5+Math.random()*5;plSnd('moka','vihainen',{v:.8});}}
function heldBowl(){const w=equipped('weapon');return w&&ITEMS[w.id].cat==='bowl'?w:null;}
function bowlUse(){const s=heldBowl();if(!s||P.dead)return;
  if(s.id==='kulho'){if(nearWater()){s.id='vesikulho';invDirty=true;updateGear();msg('Täytit kulhon vedellä – nyt se on vesikulho.','loot');plSnd('pihka','kulho_taytto');sfx('pickup');}
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
  e.b=1;e.acc=e.acc||0;plSnd('pihka','kulho_kiinni');sfx('build');
  msg(`Kulho sidottu pihkakuvion alle. Tästä puusta valuu noin ${eCap(e)} pihkaa tunnin aikana (vain pelin ollessa käynnissä) – voit lähteä muualle.`,'loot');}
function resinTake(s){if(!s)return;s.n--;if(s.n<=0){const i=inv.indexOf(s);if(i>=0)inv[i]=null;}}
function resinDetach(n,e){const k=Math.floor(e.acc||0);giveOrDrop('kulho',1,n.x,resinBase(n)+.6,n.z);giveOrDrop('naru',1,n.x,resinBase(n)+.6,n.z);
  if(k>0){giveOrDrop('pihka',k,n.x,resinBase(n)+.6,n.z);e.acc-=k;bump('resin',k);addXp(k*4,'Pihkankeräys');}
  e.b=0;plSnd('pihka','kulho_kiinni');msg(k>0?`Irrotit kulhon: ${k} pihkaa.`:'Irrotit kulhon – pihkaa ei ollut vielä kertynyt.','loot');}
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
  e.c=Math.min(1,e.c+dt*resinFlowK(h.wq)/CARVE_T);RES.sndT-=dt;if(RES.sndT<=0){RES.sndT=1+Math.random()*.4;   /* v3.05 käyttäjän vedot ~1,2 s: ei päällekkäin */plSnd('pihka','kaiverrus',{pos:{x:n.x,y:resinBase(n)+1.1,z:n.z}});if(Math.random()<.6)burst(n.x+Math.sin(e.a)*(resinHW(n)+.05),resinBase(n)+.6+(1-e.c)*.9,n.z+Math.cos(e.a)*(resinHW(n)+.05),0xc89a5a,3,1.2);}
  if(e.c>=1){P.carve=null;e.q=Math.max(1,h.wq);addXp(25,'Pihkakuvio');msg('Pihkakuvio valmis! Sido kuvion alle kulho: tyhjä kulho kädessä, naru toisessa kädessä, E.','loot');sfx('craft');}}
// oikea käsi vetää puukkoa kuvion uria pitkin, vasen tukee runkoa
function carvePose(){if(!P.carve)return;const t=playTime*8.5,s=Math.sin(t);
  fig.armR.rotation.x=-1.12+.2*s;fig.armR.rotation.z=.18+.08*Math.sin(t*.5);fig.elbowR.rotation.x=-.75+.3*Math.sin(t+1);
  fig.armL.rotation.x=-1.25;fig.armL.rotation.z=-.1;fig.elbowL.rotation.x=-.35;}

/* v2.97 ENSIMMÄINEN PUUKKO (käyttäjä): 2 s puukon saamisesta selkeä ohje pihkankeräyksestä – chattiin ja vinkkilaatikkoon (14 s). Kerran maailmaa
   kohti (flags.knifeInfo); näkyy kaikille (ei vain opastusmaailmassa, toisin kuin TIPS). */
const KNIFE_INFO_DELAY=2,KNIFE_INFO_SHOW=14;
/* v2.99 käyttäjä: chattiin vain lyhyt muistutus (pitkä teksti meni pelinäkymän yli); täysi ohje ylävinkissä selkeinä vaiheina */
/* v3.02 käyttäjä: ylävinkki lyhyeksi – ohje on puukon tiedoissa (reppu); vinkki kerran pelaajalle kuten TIPS (tipSeenG 'puukko', toisto vain flags.tipsRe) */
const KNIFE_INFO_MSG='Puukolla voi kerätä pihkaa – ohje puukon tiedoissa (reppu).';
const KNIFE_INFO_TXT='<b>Sait puukon – voit kerätä pihkaa!</b> Lisätietoa löydät esineen tiedoista repusta.';
function knifeInfoTick(dt){if(RES.tipT>0){RES.tipT-=dt;if(RES.tipT<=0&&TUT.tipEl)TUT.tipEl.classList.remove('on');}
  if(flags.knifeInfo||state!=='play'||P.dead)return;if(invCount('puukko')<=0){RES.knifeT=KNIFE_INFO_DELAY;return;}
  RES.knifeT=(RES.knifeT??KNIFE_INFO_DELAY)-dt;if(RES.knifeT>0)return;flags.knifeInfo=1;if(tipSeenG().puukko&&!flags.tipsRe)return;tipSeenSet('puukko');msg(KNIFE_INFO_MSG,'loot');
  const el=tipEl();el.querySelector('.tipD').innerHTML=KNIFE_INFO_TXT;el.classList.add('on');TUT.tipT=KNIFE_INFO_SHOW;RES.tipT=KNIFE_INFO_SHOW;if(typeof mSnd==='function')mSnd('napit','hover');}

/* ---------- kertyminen, kaatuminen ja hiipuminen ---------- */
/* v3.02 käyttäjä: pihkan tippuminen kulhoon kuuluu hiljaa vain aivan läheltä (RESIN_DRIP_R m), 4–8 s välein, kun kulho kerää pihkaa.
   Pihkankeräyksen äänet (kaiverrus, kulho_kiinni, kulho_taytto, tippa) ovat extra/-kansiossa ryhmässä pihka (avaimet p/pihka/…). */
const RESIN_DRIP_R=6,RESIN_DRIP_V=.35,RESIN_DRIP_T=[4,8];
function resinTick(dt,td=dt){   // td = pelin ajan nopeus (kertymä ja hiipuminen), dt = kaiverrus
 if(RES.flagsRef!==flags){RES.flagsRef=flags;resinClearVis();_resNodeMap=null;}
  resinEnsureG();carveTick(dt);knifeInfoTick(dt);inspectTick(dt);bowlSpillTick(dt);angryTick(dt);   // v3.04 vesikulho kaatuu, vihainen-ääni
  const st=flags.resin;if(st)for(const id in st){const e=st[id];
    if(e.b&&(e.tot||0)<eCap(e)){const add=Math.min(eCap(e)-(e.tot||0),td*eCap(e)/RESIN_T*resinFlowK(e.q||1));e.acc=(e.acc||0)+add;e.tot=(e.tot||0)+add;
      e.dripT=(e.dripT??Math.random()*RESIN_DRIP_T[1])-dt;if(e.dripT<=0){e.dripT=RESIN_DRIP_T[0]+Math.random()*(RESIN_DRIP_T[1]-RESIN_DRIP_T[0]);const n=resinNode(id);if(n&&!P.inDun&&dist2(n.x,n.z,P.pos.x,P.pos.z)<RESIN_DRIP_R*RESIN_DRIP_R)plSnd('pihka','tippa',{pos:{x:n.x,y:resinBase(n)+.9,z:n.z},v:RESIN_DRIP_V,rk:.3});}}   // v3.02 tipan ääni
    if((e.tot||0)>=eCap(e)&&!e.done){e.fade=Math.min(1,(e.fade||0)+td/RESIN_FADE);if(e.fade>=1)e.done=1;}}
  RES.t-=dt;if(RES.t<=0){RES.t=.25;resinVisTick();for(const [id,r] of RES.fallen)if(playTime-r.t>30){if(r.v&&!r.v.attached)resinVisFree(r.v);RES.fallen.delete(id);}}
  resinSwayTick();}
// solmu kaatui (resources.js killNode): kulho, naru ja pihkat maahan, ilmoitus
function resinKilled(n){const vv=RES.vis.get(n.id);if(vv){RES.vis.delete(n.id);}const st=flags&&flags.resin,e0=st&&st[n.id];
  /* v2.96 kaatuva puu: kuvio (tai pihkavalumat) jää talteen fallTree:lle (resinFallAttach) ja tukin läiskälle (resinLogMark) */
  if(vv||e0)RES.fallen.set(n.id,{v:vv||null,e:e0?{...e0}:null,t:playTime});
  if(!e0)return;const e=e0;delete st[n.id];if(P.carve&&P.carve.id===n.id)P.carve=null;
  if(!e.b)return;const k=Math.floor(e.acc||0),y=resinBase(n)+.3;spawnDrop('kulho',1,n.x+.6,y,n.z);spawnDrop('naru',1,n.x-.5,y,n.z+.3);if(k>0)spawnDrop('pihka',k,n.x,y,n.z+.6);
  msg(`${n._storm?'Myrsky kaatoi pihkapuusi':'Pihkapuusi kaatui'} – kulho, naru${k>0?` ja ${k} pihkaa`:''} putosivat maahan.`,'warn');}

/* ---------- ulkoasu ---------- */
const RES_MAT={hint:mat(0xa9863e),   // v2.97 pihkavalumat 10 % kirkkaammat (ennen 0x9a7a38)
 amber:mat(0xb8893c,{emissive:0x1a0f00}),bark:mat(0x8a5028),groove:mat(0xbf9e72),bowl:mat(0xa8743e),rope:mat(0xb09a6c),fill:mat(0xe8b23a,{emissive:0x2a1a00}),fillO:mat(0xd9802a,{emissive:0x241000})};   // v2.96 urat himmeämmät; kulhon pihka keltainen + oranssi
function resinClearVis(){for(const v of RES.vis.values())resinVisFree(v);RES.vis.clear();}
function resinVisDrop(id){const v=RES.vis.get(+id);if(v){resinVisFree(v);RES.vis.delete(+id);}}
function resinVisFree(v){scene.remove(v.g);v.g.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.userData.own)o.material.dispose();}});}
function resinVisTick(){if(P.inDun){if(RES.vis.size)resinClearVis();return;}
  const want=new Set();
  for(const n of nodesNear(P.pos.x,P.pos.z,RESIN_VIS_R,_resNl)){if(!resinKind(n))continue;const e=resinState(n);if(!isResinTree(n)&&!(e&&(e.b||!e.done)))continue;want.add(n.id);
    const key=resinVisKey(n,e),v=RES.vis.get(n.id);if(v&&v.key===key)continue;if(v)resinVisFree(v);RES.vis.set(n.id,resinBuild(n,e,key));}
  for(const [id,v] of RES.vis)if(!want.has(id)){resinVisFree(v);RES.vis.delete(id);}}
function resinVisKey(n,e){return e?[Math.floor((e.c||0)*24),e.b?1:0,Math.floor((e.fade||0)*10),Math.min(10,Math.floor((e.acc||0)/eCap(e)*10)),e.done?1:0,n.x.toFixed(2),n.z.toFixed(2)].join('|'):'h|'+n.x.toFixed(2)+'|'+n.z.toFixed(2);}
// kuvion mitat (rungon pinnalla, korkeudet tyvestä)
function resinGeom(n){const hw=resinHW(n),th=resinTrunkH(n),y0=Math.max(.4,Math.min(.55,th-1.2)),y1=Math.min(1.55,th-.15);return {hw,th,y0,y1,W:hw*2*.84};}
/* v2.96 kaatuminen: kuvio ja kulho liitetään kaatuvaan puuhun (state.js fallTree) → kaatuvat mukana */
function resinFallAttach(n,g){const r=RES.fallen.get(n.id);if(!r||!r.v)return;g.updateMatrixWorld(true);r.v.g.updateMatrixWorld(true);g.attach(r.v.g);r.v.attached=1;}
/* v2.96 tukkiin jää kaiverruksen kohdalle tumma läiskä (resources.js spawnLogs → ensimmäinen tukki) */
function resinLogMark(n,a,lg){const r=RES.fallen.get(n.id);RES.fallen.delete(n.id);if(!r||!r.e||!((r.e.c||0)>0)||!lg)return;const G=resinGeom(n),hm=(G.y0+G.y1)/2,ea=r.e.a||0;
  const fx=Math.sin(a),fz=Math.cos(a),nx=Math.sin(ea),nz=Math.cos(ea),sd=nx*Math.cos(a)-nz*Math.sin(a),v=-(nx*fx+nz*fz),th=Math.atan2(v,sd);
  const mid=(Math.hypot(lg.ax-n.x,lg.az-n.z)+Math.hypot(lg.bx-n.x,lg.bz-n.z))/2,z=clamp(hm-mid,-lg.len/2+.2,lg.len/2-.2);
  logPatch(lg,th,z,.03,G.W*.5*Math.min(1,r.e.c*1.5),(G.y1-G.y0)*.5*Math.min(1,r.e.c*1.2),0x3a2414);}
/* v2.96 huojunta: sama siirtymä kuin puiden varjostimessa (resources.js treeMat, SWAY) kuvion keskikorkeudella → kuvio ja kulho pysyvät rungossa */
function resinSwayTick(){if(!RES.vis.size)return;const t=SWAY.uTime.value,uw=SWAY.uWind.value,ul=SWAY.uLean.value,W=SWAY.uWDir.value;
  for(const [id,v] of RES.vis){const n=resinNode(id);if(!n)continue;const G=resinGeom(n),hl=((G.y0+G.y1)/2)/n.s,swH=Math.max(0,hl-1.5),by=resinBase(n);
    if(swH<=0){v.g.position.set(n.x,by,n.z);continue;}const ph=n.x*.13+n.z*.11,r=n.rot||0,c=Math.cos(r),s=Math.sin(r);
    let dx=Math.sin(t*1.7+ph)*uw*swH*.05,dz=Math.cos(t*1.3+ph)*uw*swH*.035;const lx=W.x*c-W.z*s,lz=W.x*s+W.z*c,ll=Math.hypot(lx,lz)||1,lean=ul*swH*Math.min(swH,5)*.016*(1+.35*Math.sin(t*1.9+ph));
    dx+=lx/ll*lean;dz+=lz/ll*lean;v.g.position.set(n.x+(dx*c+dz*s)*n.s,by,n.z+(-dx*s+dz*c)*n.s);}}
function resinBuild(n,e,key){const g=new THREE.Group(),hw=resinHW(n),by=resinBase(n),th=resinTrunkH(n);g.position.set(n.x,by,n.z);g.userData.resin=1;
  const add=(w,h,d,m,x,y,z,rz)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);if(rz)me.rotation.z=rz;me.castShadow=false;me.receiveShadow=true;g.add(me);return me;};
  // kellertävä pinta: pienet pihkavalumat kahdella sivulla (ainoa tuntomerkki)
  if(!(e&&(e.done||(e.c||0)>0))){g.rotation.y=n.rot||0;for(const [k,y,x,h] of [[0,.95,-.05,.22],[1,1.3,.04,.18],[2,.75,-.05,.14]]){const a=k*Math.PI/2,c=Math.cos(a),s=Math.sin(a),zz=hw+.004,xx=x*n.s;
      const m=add(.034*n.s,h*n.s,.008,RES_MAT.hint,xx*c+zz*s,Math.min(th-.2,y*n.s),-xx*s+zz*c);m.rotation.y=a;}}
  if(!e||!((e.c||0)>0)){scene.add(g);return {g,key};}
  // kuvio omassa ryhmässä kaiverrussivun suuntaan (paikallinen +z = ulospäin rungosta)
  const P0=new THREE.Group();P0.rotation.y=(e.a||0)-(g.rotation.y||0);g.add(P0);
  const fade=e.fade||0,op=1-fade,own=m=>{if(op>=.999)return m;const c=m.clone();c.transparent=true;c.opacity=op;c.depthWrite=false;c.userData.own=1;return c;};
  const G0=resinGeom(n),y0=G0.y0,y1=G0.y1,H=y1-y0,W=G0.W,z=hw+.004,c=e.c||0;
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
    /* v2.96 täyttö puun pihkamäärän mukaan: kun koko puun pihka on kulhossa, kulho on täynnä (keltainen, oransseja juovia) */
    const lv=Math.min(1,(e.acc||0)/eCap(e));if(lv>.02){const hh=.072*lv,rr=.066+.032*lv,f=new THREE.Mesh(new THREE.CylinderGeometry(rr,.066,hh,10),RES_MAT.fill);f.position.set(0,by0-.036+hh/2,z+.09);P0.add(f);
      for(const [ox,oz,r0] of [[.02,.01,.035],[-.03,-.015,.022]]){const o=new THREE.Mesh(new THREE.CylinderGeometry(r0*lv+.008,r0*lv+.008,.004,8),RES_MAT.fillO);o.position.set(ox*lv,by0-.036+hh+.002,z+.09+oz*lv);P0.add(o);}}
    const rw=hw+.012,ry=by0+.03;addP(rw*2+.02,.018,.018,RES_MAT.rope,0,ry,rw);addP(rw*2+.02,.018,.018,RES_MAT.rope,0,ry,-rw);addP(.018,.018,rw*2+.02,RES_MAT.rope,rw,ry,0);addP(.018,.018,rw*2+.02,RES_MAT.rope,-rw,ry,0);
    for(const sd of [-1,1])addP(.012,.07,.012,RES_MAT.rope,sd*.08,by0+.01,z+.05);}
  scene.add(g);return {g,key};}
