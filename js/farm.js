/* Hiidenmaa – farm.js
   v3.06 VILJELY (käyttäjä): siemenet, taimet ja pellot. Ladataan pot.js:n jälkeen. */
'use strict';
/* Siemenet (cat 'offhand'): puun kaatuessa SEED_P (5 %) lajin oma siemen; pihkapuu antaa siemenen SEED_RZ_P (70 %) ja se on pihkasiemen (puusta tulee pihkapuu).
   Istutus: siemen toisessa kädessä + kuokka + kyykky + vasen (lyönti) maahan → taimi (flags.sap). Ei normaalia kuokan toimintoa silloin.
   Taimi kasvaa nukkuessa SAP_GROW (30 %) / uni. Istutettu puu (n.planted) ei uusiudu kaadettuna; sen paikka (instanssi) käytetään seuraavalle taimelle.
   Istutettu puu saa kasvaa myös rakennusten lähelle (nearBase ei koske). Marjat, sienet ja kaura: varpu/rihmasto/kauransiemen (työpenkki) maahan tai pellolle.
   Pelto (rakennusosa): kylvö E:llä tai kuokalla (siemen toisessa kädessä), kasvaa nukkuessa FIELD_GROW (30 %), sato E:llä (FIELD_YIELD), siemen takaisin FIELD_SEED_P. */
const SEEDS={kuusenkapy:{t:'kuusi'},mannynkapy:{t:'manty'},koivunsiemen:{t:'koivu'},aarnisiemen:{t:'aarnipuu'},pihkakapy:{t:'kuusi',rz:1},pihkamannynkapy:{t:'manty',rz:1},
  puolukanvarpu:{t:'marjat',crop:1},sienirihma:{t:'sieni',crop:1},kauransiemen:{t:'villikaura',crop:1}};
const SEED_OF={kuusi:'kuusenkapy',manty:'mannynkapy',koivu:'koivunsiemen',aarnipuu:'aarnisiemen'},SEED_RZ={kuusi:'pihkakapy',manty:'pihkamannynkapy'},CROP_SEED={marjat:'puolukanvarpu',sieni:'sienirihma',villikaura:'kauransiemen'};
const SEED_P=.05,SEED_RZ_P=.7,SAP_GROW=.3,FIELD_GROW=.3,SAP_MAX=80,SAP_GAP_T=2.6,SAP_GAP_C=.9,FIELD_SEED_P=.4;
const FIELD_YIELD={marjat:[4,6],sieni:[3,4],villikaura:[4,6]};
const FARM={ref:null,mesh:new Map(),cd:0};
// puun kaatuessa (pelaaja): siemen 5 %, pihkapuu 70 % pihkasiemen
function seedDrop(n,rz){if(!n||n.isLog||n.dun)return null;let id=null;
  if(rz&&SEED_RZ[n.type]){if(Math.random()<SEED_RZ_P)id=SEED_RZ[n.type];}
  else if(SEED_OF[n.type]&&Math.random()<SEED_P)id=SEED_OF[n.type];
  if(id)spawnDrop(id,1,n.x+(Math.random()-.5),n.y+1,n.z+(Math.random()-.5));return id;}
function seedHeld(){const o=equipped('offhand');return o&&SEEDS[o.id]?o:null;}
function plantMode(){const w=equipped('weapon');return !!(w&&w.id==='kuokka'&&P.crouch&&seedHeld());}
function sapList(){if(!Array.isArray(flags.sap))flags.sap=[];return flags.sap;}
function fieldAt(x,z){for(const p of pieces)if(p.t==='pelto'){const a=-(p.rot||0)*Math.PI/4,dx=x-p.x,dz=z-p.z,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(lx)<FIELD_W/2+.1&&Math.abs(lz)<FIELD_W/2+.1)return p;}return null;}
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
  scene.add(g);FARM.mesh.set(s,g);return g;}
function sapMeshDrop(s){const g=FARM.mesh.get(s);if(!g)return;scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});FARM.mesh.delete(s);}
// tallennuksen vaihtuessa (flags korvautuu) mallit rakennetaan uudelleen; tarkistus kerran sekunnissa (main.js)
function farmSync(force){const L=sapList();if(!force&&FARM.ref===L&&FARM.mesh.size===L.length)return;FARM.ref=L;for(const s of [...FARM.mesh.keys()])if(force||!L.includes(s))sapMeshDrop(s);
  for(const s of L)if(!FARM.mesh.has(s))sapMesh(s);for(const p of pieces)if(p.t==='pelto')fieldVis(p);}
// istutettu solmu: käytetään saman ruudun kuollut istutettu paikka uudelleen (id:t pysyvät tallennuksessa samoina, varapaikat eivät lopu)
function plantNode(type,x,z,s,rz){const k=chunkOf(x,z);let n=nodes.find(q=>q.planted&&!q.alive&&q.type===type&&q.im&&q.im.userData.k===k);
  if(n){if(flags.resin)delete flags.resin[n.id];n.ox=x;n.oz=z;n.s0=s;moveNode(n,x,z,s);syncNodeY(n);reviveNode(n);}
  else{n=plantTree(type,x,z,s);if(!n)return null;setNodeMatrix(n,true);}
  n.rz=rz?1:0;n.deadT=null;markShadowDirty();return n;}
function sapSize(s){return s.t==='aarnipuu'?.8+Math.random()*.3:NODE[s.t].kind==='tree'?(s.rz?.85:.7)+Math.random()*.6:1;}
// nukkuessa: taimet 30 %, pellot 30 %
function farmGrow(){let g=0;const L=sapList();
  for(let i=L.length-1;i>=0;i--){const s=L[i];if(Math.random()>=SAP_GROW)continue;const n=plantNode(s.t,s.x,s.z,sapSize(s),s.rz);if(!n)continue;L.splice(i,1);sapMeshDrop(s);g++;bump('grown');}
  for(const p of pieces)if(p.t==='pelto'&&p.data.c&&!p.data.g&&Math.random()<FIELD_GROW){p.data.g=1;fieldVis(p);g++;}
  return g;}
/* ---------------- PELTO (FIELD_W pieces.js) ---------------- */
function fieldSow(p,o){const S=o&&SEEDS[o.id];if(!S)return false;if(!S.crop){msg('Puun siemen istutetaan maahan, ei pellolle.','warn');return false;}
  if(p.data.c){msg(p.data.g?'Pelto on valmis – korjaa sato ensin (E).':'Pellolla kasvaa jo jotain.','warn');return false;}
  p.data.c=S.t;p.data.g=0;seedUse(o);fieldVis(p);sfx('build');burst(p.x,p.y+.3,p.z,0x5a4430,10,2);bump('planted');msg(`Kylvit pellolle: ${sapName({t:S.t})}. Kasvaa nukkuessa (30 % / yö).`,'loot');return true;}
function fieldLabel(p){const d=p.data;if(!d.c)return seedHeld()&&SEEDS[seedHeld().id].crop?`Kylvä: ${ITEMS[seedHeld().id].n}`:'Pelto – pidä siementä (varpu, rihmasto, kaura) toisessa kädessä ja paina E';
  return d.g?`Korjaa sato: ${ITEMS[d.c].n}`:`${sapName({t:d.c})} kasvaa – valmistuu nukkuessa (30 % / yö)`;}
function fieldInteract(p){const d=p.data;
  if(!d.c){const o=seedHeld();if(!o){msg('Pidä siementä toisessa kädessä (puolukan varpu, sienirihmasto tai kauransiemen – työpenkki).','warn');return;}fieldSow(p,o);return;}
  if(!d.g){msg('Kasvaa vielä – nuku yön yli (30 % / yö).');return;}
  const Y=FIELD_YIELD[d.c]||[2,3],n=Y[0]+Math.floor(Math.random()*(Y[1]-Y[0]+1)),c=d.c;giveOrDrop(c,n,p.x,p.y+.6,p.z);if(Math.random()<FIELD_SEED_P)giveOrDrop(CROP_SEED[c],1,p.x,p.y+.6,p.z);
  d.c=null;d.g=0;fieldVis(p);bump('harvest');sfx('pickup');plSnd('kaytto','poiminta',PL_PICK());}
// pellon kasvit: oras (pieni) tai valmis (kasvin oma malli pienennettynä)
function fieldVis(p){const g=p.mesh&&p.mesh.userData.crop;if(!g)return;while(g.children.length){const o=g.children.pop();if(o.geometry&&o.userData.own)o.geometry.dispose();}
  const d=p.data;if(!d.c)return;const geo=d.g?NGEO[d.c]:null;
  for(let i=0;i<9;i++){const x=((i%3)-1)*.7,z=(Math.floor(i/3)-1)*.7;let m;
    if(geo){m=new THREE.Mesh(geo,vcMat);m.scale.setScalar(d.c==='sieni'?.9:.75);m.rotation.y=i*1.7;}
    else{m=new THREE.Mesh(new THREE.ConeGeometry(.06,.16,4),mat(d.c==='sieni'?0xd8c8a8:0x6aa040));m.userData.own=1;m.position.y=.08;}
    m.position.x=x;m.position.z=z;g.add(m);}}
