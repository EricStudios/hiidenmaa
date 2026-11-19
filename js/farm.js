/* Hiidenmaa – farm.js
   v3.06 VILJELY (käyttäjä): siemenet, taimet ja pellot. Ladataan pot.js:n jälkeen. */
'use strict';
/* Siemenet (cat 'offhand'): puun kaatuessa SEED_P (5 %) lajin oma siemen; pihkapuu antaa siemenen SEED_RZ_P (70 %) ja se on pihkasiemen (puusta tulee pihkapuu).
   Istutus: siemen toisessa kädessä + kuokka + kyykky + vasen (lyönti) maahan → taimi (flags.sap). Ei normaalia kuokan toimintoa silloin.
   Taimi kasvaa nukkuessa SAP_GROW (30 %) / uni. Istutettu puu (n.planted) ei uusiudu kaadettuna; sen paikka (instanssi) käytetään seuraavalle taimelle.
   Istutettu puu saa kasvaa myös rakennusten lähelle (nearBase ei koske). Marjat, sienet ja kaura: varpu/rihmasto/kauransiemen (työpenkki) maahan tai pellolle.
   v3.07 käyttäjä: VILJELYLAATIKKO (id pelto, puu) 1 kylvö, kasvaa nukkuessa FIELD_GROW 60 % (puolet nopeammin kuin maassa), sato FIELD_YIELD 9 + kylvetty siemen takaisin.
   KOHOPENKKI (kivi + puu, kalliimpi) BED_SLOTS 4 kylvöä, kukin 9 + siemen, kasvu BED_GROW 70 %. Maahan istutettu varpu/rihmasto/kaura: sato GROUND_YIELD 2 + siemen.
   Kylvö E:llä tai kuokalla (siemen toisessa kädessä). */
const SEEDS={kuusenkapy:{t:'kuusi'},mannynkapy:{t:'manty'},koivunsiemen:{t:'koivu'},aarnisiemen:{t:'aarnipuu'},pihkakapy:{t:'kuusi',rz:1},pihkamannynkapy:{t:'manty',rz:1},
  puolukanvarpu:{t:'marjat',crop:1},sienirihma:{t:'sieni',crop:1},kauransiemen:{t:'villikaura',crop:1}};
const SEED_OF={kuusi:'kuusenkapy',manty:'mannynkapy',koivu:'koivunsiemen',aarnipuu:'aarnisiemen'},SEED_RZ={kuusi:'pihkakapy',manty:'pihkamannynkapy'},CROP_SEED={marjat:'puolukanvarpu',sieni:'sienirihma',villikaura:'kauransiemen'};
const SEED_P=.05,SEED_RZ_P=.7,SAP_GROW=.3,FIELD_GROW=.6,BED_GROW=.7,GROUND_YIELD=2,SAP_MAX=80,SAP_GAP_T=2.6,SAP_GAP_C=.9,FIELD_SEED_P=.4;
const FIELD_YIELD=9,BED_SLOTS=4,FARM_PIECES=new Set(['pelto','kohopenkki']);   // v3.07 käyttäjä: viljelylaatikko ja kohopenkki 9 + siemen takaisin; maassa 2 + siemen
const FARM={ref:null,mesh:new Map(),cd:0};
// puun kaatuessa (pelaaja): siemen 5 %, pihkapuu 70 % pihkasiemen
function seedDrop(n,rz,x,z){if(!n||n.isLog||n.dun)return null;let id=null;
  if(rz&&SEED_RZ[n.type]){if(Math.random()<SEED_RZ_P)id=SEED_RZ[n.type];}
  else if(SEED_OF[n.type]&&Math.random()<SEED_P)id=SEED_OF[n.type];
  if(id){const px=x??n.x,pz=z??n.z;spawnDrop(id,1,px+(Math.random()-.5),terrainH(px,pz)+.6,pz+(Math.random()-.5));}return id;}
function seedHeld(){const o=equipped('offhand');return o&&SEEDS[o.id]?o:null;}
function plantHint(){if(playTime-(FARM.hintT??-99)<4)return;FARM.hintT=playTime;msg(`Muista mennä kyykkyyn (${keyLabel(BIND.crouch)}), niin kuokka istuttaa siemenen.`,'warn');}
function plantMode(){const w=equipped('weapon');return !!(w&&w.id==='kuokka'&&P.crouch&&seedHeld());}
function sapList(){if(!Array.isArray(flags.sap))flags.sap=[];return flags.sap;}
function fieldAt(x,z){for(const p of pieces)if(FARM_PIECES.has(p.t)){const a=-(p.rot||0)*Math.PI/4,dx=x-p.x,dz=z-p.z,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a),hw=farmW(p)/2+.1;if(Math.abs(lx)<hw&&Math.abs(lz)<hw)return p;}return null;}
function farmW(p){return p.t==='kohopenkki'?BED_W:FIELD_W;}
// kylvöpaikat: viljelylaatikko = p.data itse, kohopenkki = p.data.s[0..3]
function farmSlots(p){if(p.t!=='kohopenkki')return [p.data];const d=p.data;if(!Array.isArray(d.s))d.s=[];while(d.s.length<BED_SLOTS)d.s.push({c:null,g:0});return d.s;}
function seedUse(o){o.n--;if(o.n<=0){inv[inv.indexOf(o)]=null;}invDirty=true;updateGear();}
// kuokka + kyykky + siemen toisessa kädessä: istuta katsottuun kohtaan
function plantTry(){if(P.dead||state!=='play'||playTime<FARM.cd)return true;FARM.cd=playTime+.5;const o=seedHeld();if(!o)return false;const S=SEEDS[o.id];
  if(P.inDun){msg('Täällä ei voi istuttaa.','warn');return true;}
  const c=camRayPoint(6);if(dist2(c.x,c.z,P.pos.x,P.pos.z)>7*7){msg('Kohta on liian kaukana.','warn');return true;}
  const f=fieldAt(c.x,c.z);if(f){fieldSow(f,o);return true;}
  const h=terrainH(c.x,c.z);if(h<=water.position.y+.15){msg('Veteen ei voi istuttaa.','warn');return true;}
  if(Math.abs(h-P.pos.y)>3){msg('Kohta on liian kaukana.','warn');return true;}
  const tree=NODE[S.t].kind==='tree',gap=tree?SAP_GAP_T:SAP_GAP_C;
  for(const p of pieces)if(dist2(p.x,p.z,c.x,c.z)<(tree?2.2:1.1)**2){msg('Rakennus on tiellä.','warn');return true;}
  if(nodesNear(c.x,c.z,gap,_fmN).length||sapList().some(s=>dist2(s.x,s.z,c.x,c.z)<gap*gap)){msg(tree?'Liian ahdasta – taimi tarvitsee tilaa (noin 2,5 m).':'Liian ahdasta.','warn');return true;}
  if(sapList().length>=SAP_MAX){msg(`Taimia voi olla kerralla enintään ${SAP_MAX}.`,'warn');return true;}
  if(P.stam<4){msg('Liian uupunut.','warn');return true;}
  P.stam-=4;P.stamDelay=1;P.atk={t:0,dur:.45,hitAt:.2,done:true,w:{},offBusy:true};P.yaw=camYaw+Math.PI;
  const s={t:S.t,x:+c.x.toFixed(2),z:+c.z.toFixed(2),rz:S.rz?1:0,d:dayN};sapList().push(s);seedUse(o);sapMesh(s);
  sfx('build');burst(c.x,h+.15,c.z,0x6b5a3a,8,2.5);plSnd('kaytto','poiminta',{v:.5});bump('planted');
  msg(`Istutit: ${sapName(s)}. Se kasvaa nukkuessa (30 % / yö).`,'loot');return true;}
const _fmN=[];
function sapName(s){return {kuusi:'kuusen taimi',manty:'männyn taimi',koivu:'koivun taimi',aarnipuu:'aarnipuun taimi',marjat:'puolukan varpu',sieni:'sienirihmasto',villikaura:'kauran oras'}[s.t]+(s.rz?' (pihkapuu)':'');}
// taimen pieni malli (näkyy, kunnes kasvaa)
function sapMesh(s){const g=new THREE.Group(),y=terrainH(s.x,s.z);g.position.set(s.x,y,s.z);g.rotation.y=(s.x*7.3+s.z*3.1)%TAU;
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(.26,.32,.06,8),mat(0x3e2c1c));soil.position.y=.02;g.add(soil);
  if(NODE[s.t].kind==='tree'){const st=new THREE.Mesh(new THREE.CylinderGeometry(.015,.022,.42,5),mat(s.t==='koivu'?0xe8e2d4:0x6a4a2c));st.position.y=.21;g.add(st);
    if(s.t==='koivu'){for(let i=0;i<4;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.07,5,4),mat(0x7ab04a));l.scale.set(1,.5,1.4);l.position.set(Math.cos(i*1.6)*.07,.24+i*.05,Math.sin(i*1.6)*.07);g.add(l);}}
    else{const col=s.t==='aarnipuu'?0x1f3d26:s.t==='manty'?0x3d6a34:0x2a5a30;for(let i=0;i<3;i++){const cn=new THREE.Mesh(new THREE.ConeGeometry(.13-i*.03,.16,6),mat(s.rz?0x6a7a30:col));cn.position.y=.2+i*.09;g.add(cn);}}}
  else{const col=s.t==='marjat'?0x3f6a2a:s.t==='sieni'?0xd8c8a8:0x9ab45a;for(let i=0;i<5;i++){const a=i/5*TAU,b=new THREE.Mesh(s.t==='sieni'?new THREE.SphereGeometry(.035,5,4):new THREE.BoxGeometry(.015,.14,.015),mat(col));b.position.set(Math.cos(a)*.09,s.t==='sieni'?.06:.08,Math.sin(a)*.09);if(s.t!=='sieni')b.rotation.set(Math.sin(a)*.3,0,Math.cos(a)*.3);g.add(b);}}
  careDeco(g,s,.5,.05,Math.round(s.x*31+s.z*17));
  scene.add(g);FARM.mesh.set(s,g);return g;}
function sapMeshDrop(s){const g=FARM.mesh.get(s);if(!g)return;scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});FARM.mesh.delete(s);}
// tallennuksen vaihtuessa (flags korvautuu) mallit rakennetaan uudelleen; tarkistus kerran sekunnissa (main.js)
function farmSync(force){const L=sapList();if(!force&&FARM.ref===L&&FARM.mesh.size===L.length)return;FARM.ref=L;for(const s of [...FARM.mesh.keys()])if(force||!L.includes(s))sapMeshDrop(s);
  for(const s of L)if(!FARM.mesh.has(s))sapMesh(s);for(const p of pieces)if(FARM_PIECES.has(p.t))fieldVis(p);}
// istutettu solmu: käytetään saman ruudun kuollut istutettu paikka uudelleen (id:t pysyvät tallennuksessa samoina, varapaikat eivät lopu)
function plantNode(type,x,z,s,rz){const k=chunkOf(x,z);let n=nodes.find(q=>q.planted&&!q.alive&&q.type===type&&q.im&&q.im.userData.k===k);
  if(n){if(flags.resin)delete flags.resin[n.id];n.ox=x;n.oz=z;n.s0=s;moveNode(n,x,z,s);syncNodeY(n);reviveNode(n);}
  else{n=plantTree(type,x,z,s);if(!n)return null;setNodeMatrix(n,true);}
  n.rz=rz?1:0;n.deadT=null;markShadowDirty();return n;}
/* v3.08 käyttäjä: ISTUTETUT PUUT KASVAVAT VAIHEITTAIN – taimesta tulee vaiheen 0 puu; joka 5. nukuttu yö (flags.sleepC) jokainen istutettu puu, joka ei ole
   vielä lopullisessa koossaan, arpoo 60 % (TREE_STAGE_P) → seuraava vaihe. Lajin tyypilliset koot TREE_STAGES; lopullinen vaihe arvotaan (n.gmx: viimeinen tai toiseksi
   viimeinen), puukohtainen kerroin n.gsk ±6 %. Pihkan määrä kasvaa koon mukana (resinCap n.s; pihkapuuksi vasta RESIN_MIN_S). Luonnon puut eivät muutu koskaan. */
const TREE_STAGES={kuusi:[.35,.55,.8,1.05,1.3],manty:[.35,.55,.85,1.15,1.45],koivu:[.35,.55,.8,1.05,1.25],aarnipuu:[.45,.6,.75,.92,1.1]},TREE_STAGE_N=5,TREE_STAGE_P=.6;
function stageS(n){const L=TREE_STAGES[n.type];return L?+(L[Math.min(n.gst|0,L.length-1)]*(n.gsk||1)).toFixed(2):n.s;}
function treeStageInit(n){const L=TREE_STAGES[n.type];if(!L)return;n.gst=0;n.gmx=L.length-1-(Math.random()<.4?1:0);n.gsk=.94+Math.random()*.12;}
function treeStageSleep(){if(!flags.sleepC||flags.sleepC%TREE_STAGE_N)return 0;let c=0;
  for(const n of nodes){if(!n.planted||!n.alive||n.gmx==null||(n.gst|0)>=n.gmx)continue;const cr=flags.care&&flags.care['n'+n.id];if(Math.random()>=TREE_STAGE_P+careBonus(cr))continue;careDone(cr);
    const hk=n.maxHp?n.hp/n.maxHp:1;n.gst=(n.gst|0)+1;moveNode(n,n.x,n.z,stageS(n));syncNodeY(n);n.hp=n.maxHp*hk;
    const e=typeof resinState==='function'?resinState(n):null;if(e&&!e.done)e.cap=Math.max(e.cap||0,resinCap(n));c++;}
  if(c){markShadowDirty();bump('treeStage',c);}return c;}
function sapSize(s){return NODE[s.t].kind==='tree'&&TREE_STAGES[s.t]?TREE_STAGES[s.t][0]:s.t==='aarnipuu'?.8+Math.random()*.3:NODE[s.t].kind==='tree'?(s.rz?.85:.7)+Math.random()*.6:1;}
// nukkuessa: taimet 30 %, pellot 30 %
function farmGrow(){let g=0;const L=sapList();
  for(let i=L.length-1;i>=0;i--){const s=L[i];if(Math.random()>=SAP_GROW+careBonus(s))continue;const n=plantNode(s.t,s.x,s.z,sapSize(s),s.rz);if(!n)continue;if(flags.care)delete flags.care['n'+n.id];if(s.pw||s.pm||s.wc||s.mc)Object.assign(careOf(n),{wc:s.wc|0,mc:s.mc|0,pw:s.pw|0,pm:s.pm|0});if(TREE_STAGES[s.t]){treeStageInit(n);const sz=stageS(n);if(Math.abs(sz-n.s)>.001){moveNode(n,n.x,n.z,sz);syncNodeY(n);}n.hp=n.maxHp;}L.splice(i,1);sapMeshDrop(s);g++;bump('grown');}
  for(const p of pieces)if(FARM_PIECES.has(p.t)){let ch=0;for(const q of farmSlots(p))if(q.c&&!q.g&&Math.random()<(p.t==='kohopenkki'?BED_GROW:FIELD_GROW)+careBonus(q)){q.g=1;careDone(q);ch=1;g++;}if(ch)fieldVis(p);}
  return g;}
/* ---------------- v3.08 KASTELU JA MADOT (käyttäjä) ----------------
   Vesikulho kädessä E taimen, istutetun puun (kasvuvaihe kesken) tai viljelylohkon kohdalla: +5 % seuraavaan kasvuun (s.w). Kastemato toisessa kädessä
   (maassa kyykyssä, kohopenkissä/laatikossa ilman) E: +5 % (s.m). Kumpikin kerran kasvua kohti (nollautuu kasvaessa). PYSYVÄT: 5 kastelua (wc) → +5 % pysyvästi (pw),
   2 matoa (mc) → +5 % pysyvästi (pm) sille lohkolle/paikalle, kunnes se tuhotaan. Taimen pysyvät siirtyvät puulle (flags.care['n'+id]).
   Ulkoasu: kasteltu = tumma märkä multa, pw = tummempi multa, pm = madot kurkkivat, molemmat = lisäksi ruohotupsuja reunoilla (careDeco). */
const CARE_K=.05,CARE_W_PERM=5,CARE_M_PERM=2;
function careMode(){const w=equipped('weapon'),o=equipped('offhand');if(w&&w.id==='vesikulho')return 'w';if(o&&o.id==='mato')return 'm';return null;}
function careBonus(c){return c?CARE_K*((c.w?1:0)+(c.m?1:0)+(c.pw?1:0)+(c.pm?1:0)):0;}
function careOf(n){const F=flags.care||(flags.care={});return F['n'+n.id]||(F['n'+n.id]={});}
function careDone(c){if(c){c.w=0;c.m=0;}}
function careLabel(c,what,ground){const m=careMode();if(!m)return null;
  if(m==='w')return c.w?`${what}: kasteltu – vesi riittää tähän kasvuun`:`Kastele: ${what} (+5 %)`;
  if(c.m)return `${what}: mato jo mullassa tätä kasvua varten`;
  if(ground&&!P.crouch)return `Kyyristy (${keyLabel(BIND.crouch)}), niin voit laittaa madon multaan`;
  return `Laita mato multaan: ${what} (+5 %)`;}
function careApply(c,what,ground){const m=careMode();if(!m)return false;
  if(m==='w'){if(c.w){msg(`${what} on jo kasteltu – vesi riittää tähän kasvuun.`,'warn');return true;}
    const w=equipped('weapon');w.id='kulho';invDirty=true;updateGear();c.w=1;c.wc=(c.wc|0)+1;plSnd('kaytto','vesi_kaato',{v:.7});bump('watered');
    if(c.wc>=CARE_W_PERM&&!c.pw){c.pw=1;msg(`Kastelit ${CARE_W_PERM}. kerran – multa on nyt pysyvästi kostean rehevää (+5 %).`,'loot');}
    else msg(`Kastelit: ${what}. Seuraava kasvu +5 %${c.pw?'':` (${c.wc}/${CARE_W_PERM} pysyvään)`}.`,'loot');return true;}
  if(c.m){msg(`${what}: mato on jo mullassa tätä kasvua varten.`,'warn');return true;}
  if(ground&&!P.crouch){msg(`Kyyristy (${keyLabel(BIND.crouch)}), niin voit laittaa madon multaan.`,'warn');return true;}
  const o=equipped('offhand');seedUse(o);c.m=1;c.mc=(c.mc|0)+1;plSnd('kaytto','poiminta',{v:.45});bump('wormed');
  if(c.mc>=CARE_M_PERM&&!c.pm){c.pm=1;msg(`Toinen mato – matoja elää nyt pysyvästi tässä mullassa (+5 %).`,'loot');}
  else msg(`Mato kaivautui multaan: ${what}. Seuraava kasvu +5 %${c.pm?'':` (${c.mc}/${CARE_M_PERM} pysyvään)`}.`,'loot');return true;}
const _cmN=[];
// findInteract (actions.js): taimet ja kasvavat istutetut puut, kun vesikulho kädessä tai mato toisessa kädessä
function careConsider(consider){if(P.inDun||!careMode())return;
  for(const s of sapList())if(dist2(s.x,s.z,P.pos.x,P.pos.z)<9){const l=careLabel(s,sapName(s),true);if(l)consider(s.x,terrainH(s.x,s.z)+.3,s.z,{kind:'care',s,label:l},2.8,true);}
  for(const n of nodesNear(P.pos.x,P.pos.z,3.2,_cmN))if(n.planted&&n.alive&&n.gmx!=null&&(n.gst|0)<n.gmx){const l=careLabel(careOf(n),treeCareName(n),true);if(l)consider(n.x,n.y+.6,n.z,{kind:'care',n,label:l},3,true);}}
function treeCareName(n){return ({kuusi:'kuusi',manty:'mänty',koivu:'koivu',aarnipuu:'aarnipuu'}[n.type]||'puu')+` (vaihe ${(n.gst|0)+1}/${n.gmx+1})`;}
function careInteract(t){if(t.s){if(careApply(t.s,sapName(t.s),true)){sapMeshDrop(t.s);sapMesh(t.s);}return;}if(t.n)careApply(careOf(t.n),treeCareName(t.n),true);}
// viljelylohko katseen kohdalta (kohopenkki: 4 lohkoa)
function fieldSlotAt(p){const S=farmSlots(p);if(S.length===1)return 0;const c=camRayPoint(6),a=-(p.rot||0)*Math.PI/4,dx=c.x-p.x,dz=c.z-p.z,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);
  let si=(lx>0?1:0)+(lz>0?2:0);if(!S[si].c){const k=S.findIndex(q=>q.c&&!q.g);if(k>=0)si=k;}return si;}
function fieldCareLabel(p){if(!careMode())return null;const S=farmSlots(p),si=fieldSlotAt(p),q=S[si];if(!q.c)return `Lohko tyhjä – kylvä ensin, sitten ${careMode()==='w'?'kastele':'lisää mato'}`;if(q.g)return null;
  return careLabel(q,`${ITEMS[q.c].n}${S.length>1?` (lohko ${si+1})`:''}`,false);}
function fieldCare(p){if(!careMode())return false;const S=farmSlots(p),si=fieldSlotAt(p),q=S[si];if(!q.c||q.g)return false;
  if(careApply(q,`${ITEMS[q.c].n}${S.length>1?` (lohko ${si+1})`:''}`,false))fieldVis(p);return true;}
// multakoristeet: kasteltu (tumma kiilto), pysyvä vesi (tumma multa), pysyvät madot (kurkkivat), molemmat (+ ruohotupsut reunoille)
const CARE_MAT={wet:null,rich:null,worm:null,grass:null};
function careMats(){if(!CARE_MAT.wet){CARE_MAT.wet=mat(0x24180e,{roughness:.35,metalness:.05});CARE_MAT.rich=mat(0x2a1d12,{roughness:1});CARE_MAT.worm=mat(0xc07a78,{roughness:.6});CARE_MAT.grass=mat(0x5f9a3c);}return CARE_MAT;}
function careDeco(g,c,W,y,seed,ox=0,oz=0){if(!c||!(c.w||c.pw||c.pm))return;const M=careMats(),own=m=>{m.userData.own=1;return m;};
  if(c.pw||c.w){const d=own(new THREE.Mesh(new THREE.BoxGeometry(W*.92,.012,W*.92),c.w?M.wet:M.rich));d.position.set(ox,y+.006,oz);g.add(d);}
  if(c.pm){const r=mulberry32(seed|0);for(let i=0;i<Math.max(3,Math.round(W*5));i++){const w=typeof tkWormMesh==='function'?own(tkWormMesh(.07+r()*.04,(seed|0)+i*13,true)):own(new THREE.Mesh(new THREE.TorusGeometry(.04,.011,5,9,Math.PI*1.1),M.worm));   /* v3.14 kaarevat madot, osin mullan sisällä */
      w.position.set(ox+(r()-.5)*W*.8,y+.004,oz+(r()-.5)*W*.8);w.rotation.y=r()*TAU;g.add(w);}}
  if(c.pw&&c.pm){const r=mulberry32((seed|0)+77),n=Math.max(6,Math.round(W*8));for(let i=0;i<n;i++){const e=r()*4|0,t=(r()-.5)*W*.88,h=W*.44,x=e<2?t:(e===2?h:-h),z=e<2?(e===0?h:-h):t;
      for(let k=0;k<3;k++){const hh=.14+r()*.1,b=own(new THREE.Mesh(new THREE.ConeGeometry(.022,hh,4),M.grass));b.position.set(ox+x+(k-1)*.03,y+hh/2,oz+z+(r()-.5)*.04);b.rotation.set((r()-.5)*.6,r()*3,(r()-.5)*.6);g.add(b);}}}}
/* ---------------- VILJELYLAATIKKO JA KOHOPENKKI (FIELD_W, BED_W pieces.js) ---------------- */
function farmName(p){return p.t==='kohopenkki'?'Kohopenkki':'Viljelylaatikko';}
function farmPct(p){return Math.round((p.t==='kohopenkki'?BED_GROW:FIELD_GROW)*100);}
function fieldSow(p,o){const S=o&&SEEDS[o.id];if(!S)return false;if(!S.crop){msg(`Puun siemen istutetaan maahan, ei ${p.t==='kohopenkki'?'kohopenkkiin':'viljelylaatikkoon'}.`,'warn');return false;}
  const q=farmSlots(p).find(x=>!x.c);if(!q){msg(farmSlots(p).some(x=>x.g)?`${farmName(p)} on valmis – korjaa sato ensin (E).`:`${farmName(p)} on täynnä – kasvaa vielä.`,'warn');return false;}
  q.c=S.t;q.g=0;seedUse(o);fieldVis(p);sfx('build');burst(p.x,p.y+.3,p.z,0x5a4430,10,2);bump('planted');msg(`Kylvit: ${sapName({t:S.t})} (${farmName(p).toLowerCase()}). Kasvaa nukkuessa (${farmPct(p)} % / yö).`,'loot');return true;}
function fieldLabel(p){const cl=fieldCareLabel(p);if(cl)return cl;const S=farmSlots(p),o=seedHeld(),free=S.filter(x=>!x.c).length,ready=S.filter(x=>x.g).length,grow=S.filter(x=>x.c&&!x.g).length;
  if(ready)return `Korjaa sato: ${[...new Set(S.filter(x=>x.g).map(x=>ITEMS[x.c].n))].join(', ')} (${ready * FIELD_YIELD} + siemen${ready>1?'et':''})`;
  if(free&&o&&SEEDS[o.id].crop)return `Kylvä: ${ITEMS[o.id].n}${S.length>1?` (${free}/${S.length} vapaana)`:''}`;
  if(grow)return `${farmName(p)}: ${grow} kasvaa – valmistuu nukkuessa (${farmPct(p)} % / yö)${free&&S.length>1?` · ${free} vapaana`:''}`;
  return `${farmName(p)} – pidä siementä (varpu, rihmasto, kaura) toisessa kädessä ja paina E`;}
function fieldInteract(p){if(fieldCare(p))return;const S=farmSlots(p),ready=S.filter(x=>x.g&&x.c);
  if(ready.length){for(const q of ready){giveOrDrop(q.c,FIELD_YIELD,p.x,p.y+.6,p.z);giveOrDrop(CROP_SEED[q.c],1,p.x,p.y+.6,p.z);q.c=null;q.g=0;bump('harvest');}fieldVis(p);sfx('pickup');plSnd('kaytto','poiminta',PL_PICK());return;}
  const o=seedHeld();if(S.some(x=>!x.c)){if(!o){msg('Pidä siementä toisessa kädessä (puolukan varpu, sienirihmasto tai kauransiemen – työpenkki).','warn');return;}fieldSow(p,o);return;}
  msg(`Kasvaa vielä – nuku yön yli (${farmPct(p)} % / yö).`);}
// kasvit: oras (pieni) tai valmis (kasvin oma malli pienennettynä); kohopenkissä 4 lohkoa × 4 kasvia
function fieldVis(p){const g=p.mesh&&p.mesh.userData.crop;if(!g)return;while(g.children.length){const o=g.children.pop();if(o.geometry&&o.userData.own)o.geometry.dispose();}
  const S=farmSlots(p),bed=p.t==='kohopenkki';
  S.forEach((q,si)=>careDeco(g,q,bed?.9:FIELD_W-.2,0,Math.round(p.x*13+p.z*7)+si*131+1,bed?((si%2)-.5)*1.2:0,bed?(Math.floor(si/2)-.5)*1.2:0));
  S.forEach((q,si)=>{if(!q.c)return;const geo=q.g?NGEO[q.c]:null,cx=bed?((si%2)-.5)*1.2:0,cz=bed?(Math.floor(si/2)-.5)*1.2:0,n=bed?4:9,st=bed?.55:.7;
    for(let i=0;i<n;i++){const k=bed?2:3,x=cx+((i%k)-(k-1)/2)*st,z=cz+(Math.floor(i/k)-(k-1)/2)*st;let m;
      if(geo){m=new THREE.Mesh(geo,vcMat);m.scale.setScalar(q.c==='sieni'?.9:.75);m.rotation.y=i*1.7+si;}
      else{m=new THREE.Mesh(new THREE.ConeGeometry(.06,.16,4),mat(q.c==='sieni'?0xd8c8a8:0x6aa040));m.userData.own=1;m.position.y=.08;}
      m.position.x=x;m.position.z=z;m.userData.piece=p;g.add(m);}});}
