/* Hiidenmaa – tackle.js
   v3.14 KALASTUSVARUSTEET (käyttäjä 19.11.). Ladataan fish.js:n jälkeen. Määrittelyt (TK_LINE, TK_HOOK, TK_REEL, TK_FLOAT, TK_LURE, TK_COMBOS, PAKKI_*) items.js:ssä.
   VAPA: esineen s.rig = {line, lw (siiman kunto 0–1), hook, reel, float, lure, bait (mato koukussa)}. Puuttuva rig = TK_RIG0 (pellava, pieni koukku, puukoho).
   rigStats(s) → fish.js:n FS.rod: k (tärppiväli), ten (siiman kestävyys), big/bw (isot kalat), sw (pikkukalat), hk (tarttuminen virvelissä), steal, keep (väkä),
   win/night (tärppi-ikkuna), cast (heittomatka), spin (virveli + viehe), reel, lure, combo.
   VIRVELI (kela + viehe): heitto 6–22/30 m, FS.st 'spin': vasen pohjassa kelaa (viehe lähestyy), tärppi kelatessa (hazard / s), isku tarttuu hk-todennäköisyydellä;
   matalassa viehe voi jäädä kiinni (TK_SNAG / s) → viehe ja siima menetetään. Siiman katketessa viehe menetetään.
   KULUMINEN: heitto 0,25, kala 1 (iso 1,5), roska 0,5 yksikköä / siiman kesto (dur kalaa). Iskussa pieni satunnainen katkeamisriski (kasvaa kulumisen myötä).
   PAKKI: esine kalapakki (s.box, s.lv); maassa flags.pakit [{x,y,z,ry,box,lv}], pöydällä p.data.pk {box,lv}. Vain kalastustarvikkeet (tkPakkiOk).
   PÖYTÄ (kalapoyta): ikkuna #tkP – vavan osat, ominaisuudet, perkaus (fileet + perkeet), pakin päivitys. Siiman vaihto kentällä pakista TKA (30 s). */
'use strict';
const TK_FD_DEF=.8,TK_FD=[0,2],TK_FD_STEP=.1,TK_ONKI_SNAG=.06,TK_SINK=.22,TK_RISE=.5,TK_LURE_MIN=.25,TK_BOTTOM_SNAG=.3,TK_SHORE=.3,TK_SPIN_MIN=6,TK_SPIN_T=70,TK_SNAG=.0005,TK_REEL_V=1.1,TK_FIELD_LINE=30,TK_SNAP=.006,TK_DANGLE=3;
const TKA={on:false,t:0,T:TK_FIELD_LINE,line:null,src:null,slot:null};   // siiman vaihto kentällä
/* ---------------- VAPA: osat ja arvot ---------------- */
function rigOf(s){if(!s)return null;if(!s.rig)s.rig=Object.assign({},TK_RIG0);return s.rig;}
function rigSig(s){const r=s.rig||TK_RIG0;return [r.line,r.hook,r.reel,r.float,r.lure,r.bait?1:0].join('|');}
function rigCombo(id,r){return TK_COMBOS.find(c=>Object.entries(c.need).every(([k,v])=>v.includes(k==='rod'?id:(r[k]||0))))||null;}
function rigStats(s){const R=ITEMS[s.id].rod,r=rigOf(s),L=r.line?TK_LINE[r.line]:null,H=TK_HOOK[r.hook]||TK_HOOK.pienikoukku,K=r.reel?TK_REEL[r.reel]:null,F=r.float&&!(K&&r.lure)?TK_FLOAT[r.float]:null,
    U=K&&r.lure?TK_LURE[r.lure]:null,C=rigCombo(s.id,r),fx=C?C.fx:{};
  return {k:R.k*(L?L.vis:1)*(fx.k||1),ten:R.ten*(L?L.ten:1)*(1+(fx.ten||0)),big:(R.big||0)+(fx.big||0),bw:(R.bw||1)*H.big,sw:H.small,hk:Math.min(.97,H.hk+(fx.hk||0)),
    steal:H.steal*(F?F.steal:1)*(fx.steal||1),keep:!!H.keep,win:(F?F.win:0)+(fx.win||0),night:F&&F.night||0,spin:!!U,reel:K,lure:U,lureId:U?r.lure:null,
    cast:[1,K?K.cast:(FP_ROD_D[s.id]||16)],dmax:K?K.cast:(FP_ROD_D[s.id]||16),fd:r.fd!=null?r.fd:TK_FD_DEF,float:F,line:L,combo:C,virveli:!!K};}   // v3.27 heittomatka 35°:ssa (fishphys.js)
function rodName(s){return s.rig&&s.rig.reel?'Virveli':'Onki';}
const fishSmall=sp=>FISH_DEF[sp]&&FISH_DEF[sp].k===1&&!FISH_B[sp].big;
// lajin painokerroin vavan osien mukaan (fishPick): koukku (isot / pikkukalat), runko (isot lajit), viehe (parhaat ×2,2, pikkukalat ×0,3)
function tkSpK(sp,rod,wb){const B=FISH_B[sp];let k=B.big?rod.bw:fishSmall(sp)?rod.sw:1;if(rod.lure){const U=rod.lure;k*=U.best.includes(sp)?2.2:fishSmall(sp)?.3:1;}return k;}
// valoisuus 0 (yö) … 1 (kirkas päivä)
function tkBright(){const ph=fishPhase(),w=weather.cur;let b=ph===1?1:ph===3?0:.4;if(w==='pilvi'||w==='tihku')b*=.55;else if(w==='sade'||w==='sumu'||w==='myrsky'||w==='lumi')b*=.35;return b;}
// vieheen sopivuus nyt tähän veteen (1 = tavallinen)
function lureCond(U,wb){const b=tkBright(),lk=U.light==='bright'?.7+.6*b:U.light==='dim'?1.2-.8*Math.abs(b-.45):U.light==='dark'?1.3-.8*b:1;
  return (U.w[wb.type]||1)*U.ph[fishPhase()]*(U.wx[weather.cur]||1)*lk;}
/* ---------------- KULUMINEN JA KATKEAMINEN ---------------- */
function tkRig(){return FS.slot&&FS.slot.rig?FS.slot.rig:null;}
function tkWear(u){const r=tkRig();if(!r||!r.line)return;const L=TK_LINE[r.line];r.lw=Math.max(0,(r.lw??1)-u/L.dur);if(r.lw<=0){r.line=null;r.lw=1;invDirty=true;updateGear();msg('Siima kului loppuun ja katkesi – kiinnitä uusi siima (pöytä tai pakki).','warn');}}
function tkLineBreak(){const r=tkRig();if(!r)return '';let t='';if(r.reel&&r.lure){t=` Viehe (${ITEMS[r.lure].n.toLowerCase()}) meni kalan mukana.`;r.lure=null;}
  if(r.line){r.line=null;r.lw=1;t+=' Solmi uusi siima repusta (E).';}invDirty=true;updateGear();return t;}   // v3.33 käyttäjä: katkennut siima korvataan repun siimalla (E), ei pakista
function tkSnapCheck(){const r=tkRig();if(!r||!r.line)return false;if(Math.random()>=TK_SNAP*(1.6-(r.lw??1)))return false;
  plSnd('onkiminen','siima_katkeaa',{v:.9});FS.bait=false;const ex=tkLineBreak();fishReset('Siima napsahti poikki iskussa!'+ex,'warn');return true;}
function tkBaitSync(){const r=tkRig();if(r&&!FS.spin&&FS.st!=='idle'){if(r.bait&&!FS.bait){r.bait=0;updateGear();}}}
/* ---------------- VIRVELI: kelaus ja tärppi kelatessa ---------------- */
function tkSpinTick(dt){return fpSpin(dt);}   // v3.27 viehe vedessä: fishphys.js fpSpin (FS.ld, pohja, syvyyskerroin)
function tkSnag(){const r=tkRig();let t='Viehe tarttui pohjaan';if(r){const ln=r.line?ITEMS[r.line].n.toLowerCase():'siima';t+=` – ${r.lure?ITEMS[r.lure].n.toLowerCase():'viehe'} ja ${ln} menetettiin.`;r.lure=null;r.line=null;r.lw=1;invDirty=true;updateGear();}
  plSnd('onkiminen','siima_katkeaa',{v:.8});fishReset(t,'warn');}
/* ---------------- MATO KOUKKUUN (E vapa kädessä) ---------------- */
function tkNoTarget(){const w=equipped('weapon');if(!w||ITEMS[w.id].cat!=='rod'||FS.st!=='idle')return false;const r=rigOf(w);
  if(!r.line){const id=tkLineInPack();if(!id){msg('Vavassa ei ole siimaa. Tarvitset siimaa repussa (pakissa oleva ei riitä – siirrä se reppuun) tai Kalastajan pöydän.','warn');return true;}
    tkLineTake(id,inv);r.line=id;r.lw=1;invDirty=true;updateGear();tkSnd('siiman_vaihto')||plSnd('kaytto','poiminta',{v:.5});msg(`Solmit uuden siiman (${ITEMS[id].n.toLowerCase()}) vapaan – voit heittää.`);return true;}   // v3.33 kuten mato: E
  if(r.reel&&r.lure){msg('Virvelissä on viehe – mato sopii vain kohon kanssa (irrota viehe pöydällä).');return true;}
  if(r.bait){msg('Koukussa on jo mato. Heitä vasemmalla.');return true;}
  if(!invCount('mato')){msg('Sinulla ei ole matoja. Niitä löytyy maata kaivaessa tai kuokkiessa.','warn');return true;}
  invRemove('mato',1);r.bait=1;invDirty=true;updateGear();tkSnd('mato_koukkuun')||plSnd('kaytto','poiminta',{v:.5});msg('Laitoit madon koukkuun – kalat tärppäävät noin kolmanneksen useammin.');return true;}
// v3.33 käyttäjä: siimakerästä kuluu 1/10 jokaisella uudella siimalla (s.lu, palkki slotBar). Säiliö = inv tai pakin box. Osittain käytetty kerä ensin.
function tkLineTake(id,box){box=box||inv;let i=-1;for(let k=0;k<box.length;k++){const b=box[k];if(b&&b.id===id){if(b.lu>0){i=k;break;}if(i<0)i=k;}}if(i<0)return false;
  const b=box[i];b.lu=(b.lu||0)+1;if(b.lu>=TK_LINE_USES){b.lu=0;b.n--;if(b.n<=0)box[i]=null;}invDirty=true;return true;}
// v3.33: paras siima repussa (vain reppu, ei pakki)
function tkLineInPack(){let best=null;for(const id in TK_LINE)if(invCount(id)&&(!best||TK_LINE[id].ten>TK_LINE[best].ten))best=id;return best;}
/* ---------------- SIIMAN VAIHTO KENTÄLLÄ (pakista, hidas) ---------------- */
function tkFieldLine(lineId,src){const w=equipped('weapon');if(!w||ITEMS[w.id].cat!=='rod'){msg('Ota vapa käteen vaihtaaksesi siiman.','warn');return;}if(!rigOf(w).line&&src){msg('Katkennut siima korvataan repussa olevalla siimalla (E) – pakista se ei onnistu. Siirrä siima reppuun.','warn');return;}   /* v3.33 */if(FS.st!=='idle'){msg('Kelaa ensin siima sisään.','warn');return;}
  Object.assign(TKA,{on:true,t:0,T:TK_FIELD_LINE,line:lineId,src,slot:w,x:P.pos.x,z:P.pos.z});closePanels();tkSnd('siiman_vaihto');
  msg(`Vaihdat siimaa (${ITEMS[lineId].n.toLowerCase()}) – ilman pöytää tämä kestää ikuisuuden… (${TK_FIELD_LINE} s, pysy paikallasi)`,'quest');}
function tkFieldTick(dt){if(!TKA.on)return;if(P.dead||state==='dead'||equipped('weapon')!==TKA.slot||dist2(P.pos.x,P.pos.z,TKA.x,TKA.z)>.8){TKA.on=false;msg('Siiman vaihto keskeytyi.','warn');return;}
  if(state==='play')TKA.t+=dt*(DEV&&typeof DEVF!=='undefined'&&DEVF.fishFast?10:1);if(TKA.t<TKA.T)return;TKA.on=false;
  const box=TKA.src;let ok=(box&&tkLineTake(TKA.line,box))||(invCount(TKA.line)&&tkLineTake(TKA.line,inv));   /* v3.33 kerästä 1/10 */
  if(!ok){msg('Siima katosi pakista – vaihto peruttiin.','warn');return;}tkSetPart(TKA.slot,'line',TKA.line,true);lappu(icon(TKA.line),`<span class="mG">Uusi siima kiinni:</span> <b class="mW">${ITEMS[TKA.line].n}</b><br><b style="color:#e8c070">Kireitä siimoja!</b>`);}   // v3.27 lappu vasemmalta
/* ---------------- OSIEN VAIHTO (pöytä) ---------------- */
// palauttaa vanhan osan reppuun (kulunut siima heitetään pois); id null = irrota
function tkSetPart(s,slot,id,noRet){const r=rigOf(s),old=r[slot];if(slot==='lure'&&id&&!r.reel){msg('Viehe sopii vain virveliin – kiinnitä ensin kela. Onkiessa käytetään matoa.','warn');return false;}   // v3.27 onki ei käytä vieheitä
  if(old&&!noRet&&slot!=='line')giveOrDrop(old,1,P.pos.x,P.pos.y+1,P.pos.z);else if(old&&slot==='line'&&!noRet)msg('Vanha siima leikattiin pois.');   // v3.33: siima tulee kerästä (1/10), joten irrotettu siima ei palaa keräksi
  r[slot]=id;if(slot==='line')r.lw=1;if(slot==='reel'&&!id&&r.lure){if(!noRet)giveOrDrop(r.lure,1,P.pos.x,P.pos.y+1,P.pos.z);r.lure=null;}if(slot==='lure'&&id)r.bait=0;
  invDirty=true;updateGear();}
/* ---------------- 3D: vavan osat, koho, viehe, mato ---------------- */
const TK_MAT={};
function tkMat(k,c,o){return TK_MAT[k]||(TK_MAT[k]=mat(c,o));}
function tkWormGeo(len,seed,burrow){const r=mulberry32((seed|0)+7),n=7,pts=[];let a=r()*TAU,x=0,z=0;
  for(let i=0;i<n;i++){pts.push(new THREE.Vector3(x,burrow?(i===0||i===n-1?-.008:.004+Math.sin(i/(n-1)*Math.PI)*.006):Math.sin(i*.7)*.003,z));a+=(r()-.5)*1.4;x+=Math.cos(a)*len/(n-1);z+=Math.sin(a)*len/(n-1);}
  const c=new THREE.CatmullRomCurve3(pts),R=len*.075,g=new THREE.TubeGeometry(c,18,R,6,false),p=g.attributes.position,col=new Float32Array(p.count*3),cu=new THREE.Color(),u=g.attributes.uv;
  for(let i=0;i<p.count;i++){const t=u.getX(i),band=t>.22&&t<.34,ring=.92+.08*Math.cos(t*90);cu.setRGB(band?.86:.78*ring,band?.5:.46*ring,band?.46:.45*ring);col[i*3]=cu.r;col[i*3+1]=cu.g;col[i*3+2]=cu.b;
    const taper=Math.min(1,t*6,(1-t)*5);if(taper<1){const cp=c.getPointAt(t);p.setXYZ(i,cp.x+(p.getX(i)-cp.x)*(.35+.65*taper),cp.y+(p.getY(i)-cp.y)*(.35+.65*taper),cp.z+(p.getZ(i)-cp.z)*(.35+.65*taper));}}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();g.translate(-x/2,0,-z/2);return g;}
// kastemato: kaareva, rengastettu, satulavyö (clitellum), burrow = osin mullan sisällä (viljelylaatikko)
function tkWormMesh(len,seed,burrow){const m=new THREE.Mesh(tkWormGeo(len,seed||3,burrow),tkMat('worm',0xffffff,{vertexColors:true,roughness:.38,metalness:.02}));m.castShadow=false;return m;}
// vavan osat näkyviin (state.js updateGear): kela (rig), siiman väri, koho, viehe tai mato koukussa
function tkDressRod(g,s){const r=rigOf(s),hk=g.userData.hook;g.traverse(o=>{if(o.userData.tkReel)o.visible=false;});
  if(r.reel){const K=TK_REEL[r.reel],m=tkMat('reel'+r.reel,K.col,{metalness:.6,roughness:.35}),reel=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.045,14),m);reel.rotation.z=Math.PI/2;reel.position.set(0,-.07,.24);g.add(reel);
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.05,12),tkMat('spool',r.line?TK_LINE[r.line].col:0x555555,{roughness:.6}));sp.rotation.z=Math.PI/2;sp.position.set(.004,-.07,.24);g.add(sp);
    g.add(bx(.012,.05,.012,tkMat('rstem',0x3a3a3a),0,-.035,.24));
    /* v3.27 kampi pyörii kelatessa (fishphys.js virvPose): nivel kelan akselilla, varsi + nuppi; oikea käsi seuraa nuppia (IK) */
    const cr=new THREE.Group();cr.position.set(.03,-.07,.24);g.add(cr);cr.add(bx(.008,.05,.008,tkMat('rhd',0x2a2a2a),0,-.022,0));const kn=bx(.022,.014,.014,tkMat('rkn',0xd8c8a0),.012,-.046,0);cr.add(kn);
    g.userData.crank=cr;g.userData.knob=kn;g.userData.virv=1;}
  if(!hk)return;const base=[...hk.children],ln=base[0];if(ln&&r.line)ln.material=tkMat('ln'+r.line,r.line==='pellavasiima'?0x8e8e8a:TK_LINE[r.line].col,Object.assign({transparent:true,opacity:.3,depthWrite:false},r.line==='hiidensiima'?{emissive:0x3a8ab0,emissiveIntensity:.22}:{}));   /* v3.34 vavan siima: vähän läpinäkyvä, valaistu (tumma yöllä); hiidensiima hohtaa hieman */if(ln)ln.visible=!!r.line;
  if(!r.line){for(const c of base)c.visible=false;return;}
  if(r.reel&&r.lure){const U=TK_LURE[r.lure],L=tkLureMesh(U,.7);L.position.y=-.33;hk.add(L);base.forEach((c,i)=>{if(i>1)c.visible=false;});}   // viehe korvaa koukun (vieheessä oma koukku)
  else{if(r.float){const F=TK_FLOAT[r.float],fl=tkFloatMesh(F,.45);fl.position.y=-.12;hk.add(fl);}
    if(r.bait){const w=tkWormMesh(.05,11);w.rotation.z=Math.PI/2;w.position.set(.012,-.34,0);hk.add(w);const w2=tkWormMesh(.035,5);w2.rotation.x=1.2;w2.position.set(.006,-.355,.004);hk.add(w2);}}}
function tkFloatMesh(F,sc=1){const g=new THREE.Group(),glow=F.glow?{emissive:F.col,emissiveIntensity:.9}:{},t=new THREE.Mesh(new THREE.SphereGeometry(.07*sc,10,6,0,TAU,0,Math.PI/2),tkMat('ft'+F.col,F.col,glow)),
    b=new THREE.Mesh(new THREE.SphereGeometry(.07*sc,10,6,0,TAU,Math.PI/2,Math.PI/2),tkMat('fb',0xf2f0e8)),st=new THREE.Mesh(new THREE.CylinderGeometry(.008*sc,.008*sc,.14*sc,4),tkMat('fs',0x2a2a2a));st.position.y=.1*sc;g.add(t,b,st);return g;}
function tkLureMesh(U,sc=1){const g=new THREE.Group(),glow=U.glow?{emissive:U.c2,emissiveIntensity:.8}:{},m1=tkMat('l1'+U.col+(U.glow?'g':''),U.col,Object.assign({metalness:U.sh==='spoon'||U.sh==='spin'||U.sh==='jig'?.7:.1,roughness:.35},glow)),m2=tkMat('l2'+U.c2,U.c2,Object.assign({metalness:.4,roughness:.4},glow));
  if(U.sh==='spoon'){const b=new THREE.Mesh(new THREE.SphereGeometry(.03*sc,10,6),m1);b.scale.set(U.thin?.45:.7,1.5,.22);g.add(b);const s=new THREE.Mesh(new THREE.SphereGeometry(.018*sc,8,5),m2);s.scale.set(U.thin?.4:.6,1.2,.3);s.position.set(0,-.004,.004*sc);g.add(s);}
  else if(U.sh==='jig'){const h=new THREE.Mesh(new THREE.SphereGeometry(.016*sc,8,6),m1);g.add(h);const t=new THREE.Mesh(new THREE.ConeGeometry(.012*sc,.06*sc,6),m2);t.position.y=-.035*sc;t.rotation.x=Math.PI;g.add(t);}
  else if(U.sh==='plug'){const b=new THREE.Mesh(new THREE.SphereGeometry(.022*sc,10,6),m1);b.scale.set(.75,2.1,.8);g.add(b);const bl=new THREE.Mesh(new THREE.BoxGeometry(.025*sc,.012*sc,.003),m2);bl.position.y=.05*sc;g.add(bl);
    const e=new THREE.Mesh(new THREE.SphereGeometry(.005*sc,6,4),tkMat('le',0x101010));e.position.set(.012*sc,.03*sc,.008*sc);g.add(e);if(U.top){const f=new THREE.Mesh(new THREE.ConeGeometry(.01*sc,.03*sc,5),tkMat('lf',0xe8e0c8));f.position.y=-.055*sc;f.rotation.x=Math.PI;g.add(f);}}
  else{const bl=new THREE.Mesh(new THREE.SphereGeometry(.02*sc,8,5),m1);bl.scale.set(.7,1.3,.15);bl.rotation.y=.6;g.add(bl);const bd=new THREE.Mesh(new THREE.SphereGeometry(.008*sc,8,5),m2);bd.position.y=-.03*sc;g.add(bd);}
  const hk=new THREE.Mesh(new THREE.TorusGeometry(.009*sc,.002,4,8,Math.PI*1.3),tkMat('lh',0xb8bcc4,{metalness:.8,roughness:.25}));hk.position.y=-.055*sc;g.add(hk);return g;}
// heitetty koho tai viehe (FS.bob): fish.js luo punavalkoisen kohon – tässä väri ja tyyppi vavan mukaan
function tkBobDress(){const b=FS.bob;if(!b)return;const r=FS.slot&&FS.slot.rig?FS.slot.rig:TK_RIG0;let L=b.userData.tkL;if(L){b.remove(L);b.userData.tkL=null;}
  const spin=FS.spin&&r.lure;for(let i=0;i<3;i++)if(b.children[i])b.children[i].visible=!spin;
  if(spin){L=tkLureMesh(TK_LURE[r.lure],3.2);b.add(L);b.userData.tkL=L;return;}
  const F=TK_FLOAT[r.float]||TK_FLOAT.puukoho;if(b.children[0])b.children[0].material=tkMat('bt'+F.col,F.col,F.glow?{emissive:F.col,emissiveIntensity:1.1}:{});}
/* ---------------- 3D-KALA KOUKUSSA (sätkii 3 s noston jälkeen) ---------------- */
const TKD=[];
function tkFishMesh(sp,len){const f=FISH_DEF[sp],S=FISH_SHAPE[sp]||{l:14,h:6},g=new THREE.Group(),L=len,H=L*S.h/S.l*(S.eel?1.2:1),T=S.flat?H*.16:H*.46;   // y = pituus (pää +), x = selkä (+) / vatsa (−), z = kylki
  const lq=typeof FISH_LQ!=='undefined'&&FISH_LQ,geo=new THREE.SphereGeometry(.5,lq?12:20,lq?8:14),   /* v3.29 Low/Medium kevyempi */p=geo.attributes.position,col=new Float32Array(p.count*3),c1=new THREE.Color(f.c),c2=new THREE.Color(f.c2),cc=new THREE.Color(),dk=new THREE.Color(0x14120c),wh=new THREE.Color(0xffffff),r=mulberry32(sp.length*977+sp.charCodeAt(0));
  const spots=[];for(let i=0;i<16;i++)spots.push([r()-.5,r()*.45-.05,.035+r()*.04]);
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const t=y+.5,tp=S.eel?.85+.15*Math.min(1,t*3):t<.5?.4+.6*Math.pow(t/.5,.7):1;x*=tp;z*=tp;
    const bel=clamp((-x+.06)/.28,0,1);cc.copy(c1).lerp(c2,bel*.85);
    if(S.m==='bars'&&Math.sin(t*30)>.5&&x>-.08)cc.lerp(dk,.42);
    if(S.m==='line'&&Math.abs(x-.02)<.025)cc.lerp(wh,.35);
    if(S.m&&S.m!=='bars'&&S.m!=='line'){for(const q of spots)if((y-q[0])**2+(x-q[1])**2<q[2]*q[2]*(S.m==='mottle'?3:1)){cc.lerp(S.m==='spots'?new THREE.Color(0xe6e2aa):dk,S.m==='spots'?.7:.5);break;}}
    if(S.glow)cc.lerp(new THREE.Color(0x5fe6d9),.18*bel);const sh=.8+.2*clamp(x*2+.6,0,1)+(x>.3?.05:0);
    p.setXYZ(i,x*H,y*L,z*T*2);col[i*3]=cc.r*sh;col[i*3+1]=cc.g*sh;col[i*3+2]=cc.b*sh;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.06})));
  const fm=new THREE.MeshStandardMaterial({color:new THREE.Color(S.fin||f.c),roughness:.6,side:THREE.DoubleSide,transparent:true,opacity:.9}),shp=pts=>{const q=new THREE.Shape();pts.forEach((a,i)=>i?q.lineTo(a[0],a[1]):q.moveTo(a[0],a[1]));return new THREE.ShapeGeometry(q);};
  const tail=new THREE.Group();tail.position.y=-L*.42;g.add(tail);   // pyrstö ja evät XY-tasossa (pystyssä kuten piirroksessa)
  if(!S.eel)tail.add(new THREE.Mesh(shp([[0,0],[H*.62,-L*.2],[H*.15,-L*.13],[0,-L*.1],[-H*.15,-L*.13],[-H*.62,-L*.2]]),fm));
  const dp=S.spine?(()=>{const a=[[H*.4,L*.16]];for(let i=0;i<5;i++)a.push([H*.4+H*.38,L*(.13-i*.07)],[H*.4+H*.16,L*(.1-i*.07)]);a.push([H*.38,-L*.22]);return a;})():S.eel?[[H*.42,L*.1],[H*.62,-L*.1],[H*.5,-L*.45],[H*.3,-L*.45]]:[[H*.42,L*.1],[H*.42+H*.32,L*.0],[H*.42+H*.2,-L*.08],[H*.38,-L*.16]];
  g.add(new THREE.Mesh(shp(dp),fm));g.add(new THREE.Mesh(shp([[-H*.38,-L*.12],[-H*.38-H*.22,-L*.2],[-H*.3,-L*.24]]),fm));   // selkä- ja peräevä
  for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(L*.026,8,6),tkMat('fe'+(S.eye||'x'),S.eye?new THREE.Color(S.eye).getHex():0xe8e0a0,{roughness:.2}));e.position.set(H*.12,L*.37,s*T*.62);g.add(e);
    const pu=new THREE.Mesh(new THREE.SphereGeometry(L*.014,6,4),tkMat('fp',0x080808,{roughness:.1}));pu.position.set(H*.12,L*.375,s*T*.72);g.add(pu);
    const pf=new THREE.Mesh(shp([[0,0],[-H*.3,-L*.12],[-H*.05,-L*.1]]),fm);pf.position.set(-H*.12,L*.24,s*T*.55);pf.rotation.y=s*.6;g.add(pf);}
  g.userData.tail=tail;g.traverse(o=>{if(o.isMesh)o.castShadow=!lq;});return g;}
/* v3.34 käyttäjä: siimat eivät saa olla kirkkaita – vähän läpinäkyviä mutta erottuvia, yöllä tummia (valo lightK). Hiidensiima hohtaa yöllä hieman vaaleansinisenä. */
const _tkLC=new THREE.Color(),_tkLG=new THREE.Color(0x8fdcff),_tkLB=new THREE.Color(0x8e8e8a),TK_LINE_OP=.28;   // v3.37 käyttäjä: läpinäkyvämpi – erottuu vain vähän; pellava harmaa, muut omalla värillään himmeinä
function tkLineLook(m){if(!m)return;const w=typeof equipped==='function'?equipped('weapon'):null,r=(FS.slot&&FS.slot.rig)||(w&&w.rig)||null,id=r&&r.line||'pellavasiima',L=TK_LINE[id]||TK_LINE.pellavasiima;
  const day=P.inDun?.1:clamp(typeof lightK==='number'?lightK:1,0,1),lit=.18+.82*day;if(id==='pellavasiima')_tkLC.copy(_tkLB);else _tkLC.setHex(L.col).lerp(_tkLB,.4);_tkLC.multiplyScalar(lit);
  let op=TK_LINE_OP*(.8+.2*day);if(id==='hiidensiima'){const gk=(1-day)*.38;_tkLC.r=Math.max(_tkLC.r,_tkLG.r*gk);_tkLC.g=Math.max(_tkLC.g,_tkLG.g*gk);_tkLC.b=Math.max(_tkLC.b,_tkLG.b*gk);op=Math.max(op,TK_LINE_OP+.12*(1-day));}
  m.color.copy(_tkLC);m.transparent=true;m.opacity=op;m.depthWrite=false;}
function tkDangle(sp,kg,hold){if(!FISH_DEF[sp]||typeof heldMesh==='undefined'||!heldMesh)return;const L=Math.min(.95,.16+Math.cbrt(Math.max(.02,kg))*.24);
  const piv=new THREE.Group(),fish=tkFishMesh(sp,L);fish.position.y=-.04-L*.5;piv.add(fish);   // suu ylhäällä koukussa
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(6),3));const ln=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xe8e8e0}));ln.frustumCulled=false;
  scene.add(piv,ln);const D={piv,fish,ln,t:0,L,ph:Math.random()*6,sw:0,sv:2.5,hold:!!hold};TKD.push(D);tkSnd('kala_satkii');return D;}   // v3.27 hold: roikkuu kunnes otetaan
const _tkTip=new THREE.Vector3();
function tkDangleTick(dt){for(let i=TKD.length-1;i>=0;i--){const D=TKD[i];D.t+=dt;const tip=heldMesh&&heldMesh.userData.tip;
    if(!tip||(D.t>TK_DANGLE&&!D.hold)){scene.remove(D.piv,D.ln);D.piv.traverse(o=>{if(o.geometry)o.geometry.dispose();});D.ln.geometry.dispose();TKD.splice(i,1);continue;}
    heldMesh.updateMatrixWorld(true);tip.getWorldPosition(_tkTip);const k=D.hold?Math.max(.22,1-D.t/TK_DANGLE):Math.max(0,1-D.t/TK_DANGLE),drop=.35;
    const hk=D.hold?FP_HANG_K:1;D.sv+=(-D.sw*9-D.sv*.6)*dt+(Math.random()-.5)*k*14*hk*dt;   /* v3.29 koukussa 2× rimpuilu */D.sw+=D.sv*dt;D.piv.position.set(_tkTip.x,_tkTip.y-drop,_tkTip.z);D.piv.rotation.set(D.sw*.35,camYaw,D.sw);
    D.fish.rotation.y=Math.sin(D.t*18*Math.sqrt(hk)+D.ph)*Math.min(1,.55*k*hk);const tl=D.fish.userData.tail;if(tl)tl.rotation.x=Math.sin(D.t*22*Math.sqrt(hk)+D.ph)*Math.min(1.1,.7*k*hk);
    const a=D.ln.geometry.attributes.position;a.setXYZ(0,_tkTip.x,_tkTip.y,_tkTip.z);a.setXYZ(1,D.piv.position.x,D.piv.position.y-.06,D.piv.position.z);a.needsUpdate=true;tkLineLook(D.ln.material);}}
/* ---------------- KALASTUSPAKKI ---------------- */
const tkPakkiOk=id=>{const d=ITEMS[id];return !!d&&(d.cat==='rod'||(d.tk&&d.tk!=='pakki')||id==='mato'||id==='perkeet'||id==='kalakirja');};
function pakkiSlots(lv){return PAKKI_SLOTS[lv||0]||12;}
function pakkiNorm(o){o.lv=o.lv||0;o.box=o.box||[];while(o.box.length<pakkiSlots(o.lv))o.box.push(null);return o;}
// 3D-pakki: väri, helat ja koko tason mukaan; kahva origossa (kädessä roikkuu)
function tkPakkiMesh(lv,held,box){lv=lv||0;const g=new THREE.Group(),s=1+lv*.08,W=.46*s,H=.24*s,D=.26*s,c=PAKKI_COL[lv]||PAKKI_COL[0],m=tkMat('pk'+lv,c,{roughness:.55,metalness:lv>=2?.15:0}),
    tr=tkMat('pkt'+lv,lv>=3?0x5fe6d9:lv>=1?0xc8a050:0x8a6a3a,{metalness:.6,roughness:.35}),y0=held?-H-.06:0;
  g.add(bx(W,H*.62,D,m,0,y0+H*.31,0),bx(W*1.02,H*.38,D*1.02,m,0,y0+H*.81,0),bx(W*1.03,.012,D*1.03,tr,0,y0+H*.62,0));
  for(const sx of [-1,1]){g.add(bx(.03,H*.6,D*1.04,tr,sx*W*.42,y0+H*.31,0));if(lv>=1)g.add(bx(.05,.04,.012,tr,sx*W*.3,y0+H*.62,D*.52));}
  g.add(bx(.18*s,.02,.02,tkMat('pkh',0x2a1a0e),0,y0+H+.07,0),bx(.02,.07,.02,tr,-.08*s,y0+H+.035,0),bx(.02,.07,.02,tr,.08*s,y0+H+.035,0));
  if(lv>=2)g.add(bx(W*.5,.05,.004,tkMat('pkp',0xe8dcc0),0,y0+H*.35,D*.505));if(lv>=3){const gl=bx(.05,.05,.01,tkMat('pkg',0x5fe6d9,{emissive:0x2a8a80,emissiveIntensity:.8}),0,y0+H*.81,D*.52);g.add(gl);}
  if(box)tkPakkiDeco(g,box,W,H,D,y0);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
/* v3.27 käyttäjä: pakissa olevat vieheet ja koukut roikkuvat koristeina pakin kyljissä (enintään 4 / kylki); pakkiSig muuttuu → malli päivittyy */
const PAKKI_DECO_MAX=8;
function pakkiDecoList(box){const L=[];for(const b of box||[]){if(!b||!ITEMS[b.id])continue;const t=ITEMS[b.id].tk;if(t==='lure'||t==='hook')for(let i=0;i<Math.min(b.n,2)&&L.length<PAKKI_DECO_MAX;i++)L.push(b.id);}return L;}
const pakkiSig=box=>pakkiDecoList(box).join(',');
function tkPakkiDeco(g,box,W,H,D,y0){const L=pakkiDecoList(box),ring=tkMat('pkr',0xb8bcc4,{metalness:.8,roughness:.25});
  L.forEach((id,i)=>{const side=i%2?1:-1,k=Math.floor(i/2),z=-D*.33+k*D*.22,x=side*(W*.52+.006),y=y0+H*.74,h=new THREE.Group();h.position.set(x,y,z);g.add(h);
    h.add(new THREE.Mesh(new THREE.TorusGeometry(.008,.0018,4,8),ring));let m;if(ITEMS[id].tk==='lure')m=tkLureMesh(TK_LURE[id],.75);
    else{m=new THREE.Mesh(new THREE.TorusGeometry(id==='isokoukku'?.012:.009,.0018,4,8,Math.PI*1.3),tkMat('pkh'+id,id==='isokoukku'?0xd98a4e:id==='vakakoukku'?0xa8b0b8:0xe8e0c8,{metalness:.7,roughness:.3}));}
    m.position.y=-.035;m.rotation.y=side>0?Math.PI/2:-Math.PI/2;h.add(m);h.rotation.z=side*.08;});}
function tkPakkiHeld(s){pakkiNorm(s);const g=tkPakkiMesh(s.lv,true,s.box);g.position.set(0,-.02,.02);return g;}
const PKW={f:null,list:[]};   // maassa olevat pakit (flags.pakit) ja niiden 3D
function pakkiList(){if(!Array.isArray(flags.pakit))flags.pakit=[];return flags.pakit;}
function tkPakkiSync(){if(PKW.f===flags)return;for(const e of PKW.list){scene.remove(e.m);const i=interactables.indexOf(e.it);if(i>=0)interactables.splice(i,1);}PKW.list=[];PKW.f=flags;for(const o of pakkiList())tkPakkiSpawn(o);}
function tkPakkiSpawn(o){pakkiNorm(o);const m=tkPakkiMesh(o.lv,false,o.box);o._sig=pakkiSig(o.box);m.position.set(o.x,o.y,o.z);m.rotation.y=o.ry||0;scene.add(m);
  const it={x:o.x,y:o.y+.3,z:o.z,r:2,pakki:o,label:()=>`Kalastuspakki (taso ${o.lv+1}) – E avaa · vasen nostaa`,use:()=>tkPakkiOpen(o),off:()=>P.inDun};interactables.push(it);PKW.list.push({o,m,it});}
function tkPakkiOpen(o){pakkiNorm(o);if(openPanel)closePanels(true);togglePanel('chest');curChest={found:true,pakki:o,title:`Kalastuspakki (taso ${o.lv+1}, ${pakkiSlots(o.lv)} paikkaa)`,data:{items:o.box}};tkSnd('pakki_auki')||plSnd('kaytto','arkku_auki',{v:.7,p:1.15});renderChest();}
function tkPakkiCarry(o,from){if(invCount('kalapakki')){msg('Voit kantaa vain yhden kalastuspakin kerrallaan.','warn');return false;}const i=inv.indexOf(null);if(i<0){msg('Reppu on täynnä.','warn');return false;}
  const s={id:'kalapakki',n:1,q:1,box:o.box,lv:o.lv||0};inv[i]=s;for(const x of inv)if(x&&x!==s&&x.eq&&equipGroup(ITEMS[x.id].cat)==='offhand')x.eq=false;{const w=equipped('weapon');if(w&&(ITEMS[w.id].cat==='bow'||virvHeld(w)))w.eq=false;}s.eq=true;
  if(from==='ground'){const L=pakkiList(),j=L.indexOf(o);if(j>=0)L.splice(j,1);const e=PKW.list.find(e=>e.o===o);if(e){scene.remove(e.m);const k=interactables.indexOf(e.it);if(k>=0)interactables.splice(k,1);PKW.list.splice(PKW.list.indexOf(e),1);}}
  invDirty=true;updateGear();sfx('pickup');msg('Nostit kalastuspakin vasempaan käteen.');return true;}
// laske pakki maahan (pisteeseen) – vain maastoon, ei vedeen tai rakennusten päälle
function tkPakkiPlace(s,x,z){const y=terrainH(x,z);if(y<water.position.y+.05){msg('Pakkia ei voi laskea veteen.','warn');return false;}
  const o=pakkiNorm({x,y,z,ry:camYaw+Math.PI,box:s.box||[],lv:s.lv||0});pakkiList().push(o);tkPakkiSpawn(o);const i=inv.indexOf(s);if(i>=0)inv[i]=null;s.eq=false;invDirty=true;updateGear();tkSnd('pakki_kiinni')||plSnd('kaytto','poiminta',{v:.5,p:.8});return true;}
function tkPakkiDrop(s){if(P.inDun)return false;const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);return tkPakkiPlace(s,P.pos.x+fx*.9,P.pos.z+fz*.9);}
function tkPakkiFilter(){const o=curChest&&curChest.pakki;if(!o)return;let bad=0;o.box.forEach((b,i)=>{if(b&&!tkPakkiOk(b.id)){const j=inv.indexOf(null);if(j>=0){inv[j]=b;o.box[i]=null;bad++;}}});
  if(bad){msg('Kalastuspakkiin mahtuu vain kalastustarvikkeita (vavat, osat, vieheet, madot, perkeet, kirja).','warn');invDirty=true;}
  let n=0;inv.forEach((b,i)=>{if(b&&b.id==='kalapakki'){n++;if(n>1){const j=o.box.indexOf(null);if(j>=0){o.box[j]=b;inv[i]=null;}}}});}
// pakkiikkunan lisäosa: siiman vaihto kentällä (30 s)
function tkPakkiPanel(el){const o=curChest.pakki,w=equipped('weapon'),lines=[...new Set(o.box.filter(b=>b&&ITEMS[b.id].tk==='line').map(b=>b.id))];
  if(!w||ITEMS[w.id].cat!=='rod'){el.innerHTML='<div class="note">Ota vapa käteen vaihtaaksesi siiman pakista. Muut osat vaihdetaan Kalastajan pöydällä.</div>';return;}
  const r=rigOf(w);el.innerHTML=`<div class="tkField"><b>Siiman vaihto kentällä</b> <span class="note">(${rodName(w)}: ${r.line?ITEMS[r.line].n+' '+Math.round((r.lw??1)*100)+' %':'ei siimaa'})</span>`+
    (lines.length?lines.map(id=>`<button class="btn" data-l="${id}">${ITEMS[id].n} · ${TK_FIELD_LINE} s</button>`).join(''):'<span class="note"> Pakissa ei ole siimoja.</span>')+'<div class="note">Ilman pöytää tämä kestää ikuisuuden – pöydällä vaihto on heti valmis.</div></div>';
  el.querySelectorAll('button[data-l]').forEach(b=>b.onclick=()=>tkFieldLine(b.dataset.l,o.box));}
// vasen klikkaus: pakin nosto (maasta/pöydältä) tai lasku (vasemmassa kädessä) – palauttaa true, jos klikkaus käytettiin
function tkPrimary(w){if(P.inDun||state!=='play')return false;const t=lookTarget;
  if(t&&t.kind==='it'&&t.it.pakki){tkPakkiCarry(t.it.pakki,'ground');return true;}
  const o=equipped('offhand'),hold=o&&o.id==='kalapakki';
  if(t&&t.kind==='piece'&&t.p.t==='kalapoyta'){const d=t.p.data;if(d.pk&&!hold){if(tkPakkiCarry(d.pk,'table')){d.pk=null;tkTableVis(t.p);}return true;}
    if(hold&&!d.pk){d.pk=pakkiNorm({box:o.box||[],lv:o.lv||0});const i=inv.indexOf(o);if(i>=0)inv[i]=null;o.eq=false;invDirty=true;updateGear();tkTableVis(t.p);tkSnd('pakki_kiinni');msg('Laskit pakin pöydän pakkipaikalle – sen osat ovat nyt käytössä pöydällä.');return true;}}
  if(!hold||FS.st!=='idle'||(w.id&&w.cat!=='rod'))return false;   // vasara, lapio ym. toimivat normaalisti
  const {o:ro,d}=camRay(),tt=marchTerrain(ro,d,14);if(tt!=null){const x=ro.x+d.x*tt,z=ro.z+d.z*tt,y=terrainH(x,z);
    if(dist2(x,z,P.pos.x,P.pos.z)<3.6*3.6&&Math.abs(y-P.pos.y)<1.4&&y>water.position.y+.05){tkPakkiPlace(o,x,z);msg('Laskit kalastuspakin maahan (E avaa, vasen nostaa).');return true;}}
  if(w.id===null){msg('Laske pakki maahan: katso maata aivan edessäsi (tai Kalastajan pöydän pakkipaikkaa).','warn');return true;}return false;}
/* ---------------- KALASTAJAN PÖYTÄ ---------------- */
function tkTableMesh(g){const W=MAT.wood,dk=mat(0x4a3420),top=bx(1.8,.08,.8,W,0,.86,0);g.add(top);
  for(const [x,z] of [[-.8,-.32],[.8,-.32],[-.8,.32],[.8,.32]])g.add(bx(.08,.82,.08,dk,x,.41,z));g.add(bx(1.6,.05,.05,dk,0,.25,-.32),bx(1.6,.05,.05,dk,0,.25,.32));
  g.add(bx(.7,.035,.42,mat(0xb89060,{roughness:.9}),-.45,.92,0));   // perkuulauta
  g.add(bx(.02,.012,.16,mat(0xb8bcc4,{metalness:.8,roughness:.25}),-.3,.945,.05),bx(.025,.02,.08,mat(0x3a2414),-.3,.95,.17));   // puukko
  g.add(bx(.05,.02,.05,mat(0x9a9a9a,{metalness:.5}),-.62,.95,-.12));   // kivi (teroitus)
  const rack=bx(.5,.3,.03,dk,.15,1.05,-.37);g.add(rack);for(let i=0;i<4;i++)g.add(bx(.012,.012,.06,mat(0xb8bcc4,{metalness:.8}),-.05+i*.13,1.12,-.34));   // koukkuteline
  for(let i=0;i<3;i++){const c=[0xe0d8c0,0xc8a070,0x6a8a5a][i],sp=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.04,10),mat(c,{roughness:.7}));sp.rotation.x=Math.PI/2;sp.position.set(-.02+i*.12,.98,-.33);g.add(sp);}   // siimakelat
  // pakkipaikka: tumma kehys pöydän oikeassa päässä
  const fr=mat(0x2a1a0e);g.add(bx(.56,.012,.36,mat(0x5a3e24),.58,.905,.04),bx(.56,.02,.02,fr,.58,.91,.22),bx(.56,.02,.02,fr,.58,.91,-.14),bx(.02,.02,.36,fr,.3,.91,.04),bx(.02,.02,.36,fr,.86,.91,.04));
  const pk=new THREE.Group();pk.position.set(.58,.91,.04);g.add(pk);g.userData.pkM=pk;}
function tkTableVis(p){const g=p.mesh&&p.mesh.userData.pkM;if(!g)return;while(g.children.length)g.remove(g.children[0]);if(p.data.pk){const m=tkPakkiMesh(p.data.pk.lv||0,false,p.data.pk.box);p.data.pk._sig=pakkiSig(p.data.pk.box);m.rotation.y=Math.PI/2*0;g.add(m);m.traverse(o=>{o.userData.piece=p;});}}
function tkTableLabel(p){return p.data.pk?'Kalastajan pöytä – E avaa · vasen nostaa pakin':'Kalastajan pöytä – E: vavan osat, perkaus ja pakki';}
let tkCur=null,tkSel=0;
function tkTableOpen(p){tkCur=p;if(openPanel!=='tk')togglePanel('tk');else tkRender();tkSnd('pakki_auki');}
function tkRods(){const out=[];inv.forEach(s=>{if(s&&ITEMS[s.id].cat==='rod')out.push(s);});const pk=tkCur&&tkCur.data.pk;if(pk)pk.box.forEach(s=>{if(s&&ITEMS[s.id].cat==='rod')out.push(s);});return out;}
function tkAvail(tk){const m={};const add=s=>{if(s&&ITEMS[s.id].tk===tk)m[s.id]=(m[s.id]||0)+s.n;};inv.forEach(add);const pk=tkCur&&tkCur.data.pk;if(pk)pk.box.forEach(add);return m;}
function tkTake(id){if(ITEMS[id]&&ITEMS[id].tk==='line'){if(invCount(id))return tkLineTake(id,inv);const pk=tkCur&&tkCur.data.pk;return !!(pk&&tkLineTake(id,pk.box));}   /* v3.33 siimakerä: 1/10 */
  if(invCount(id)){invRemove(id,1);return true;}const pk=tkCur&&tkCur.data.pk;if(pk){const i=pk.box.findIndex(b=>b&&b.id===id);if(i>=0){pk.box[i].n--;if(pk.box[i].n<=0)pk.box[i]=null;return true;}}return false;}
const tkFmt=v=>String(Math.round(v*100)/100).replace('.',',');
function tkPropsList(s){const r=rigOf(s),S=rigStats(s),o=[],R=ITEMS[s.id].rod,pc=v=>(v>=0?'+':'−')+Math.abs(Math.round(v*100))+' %';
  o.push(['Tyyppi',S.virveli?(S.spin?'Virveli (viehe: kelaa vasen pohjassa)':'Virveli (koho ja syötti, pitkä heitto)'):'Onki (koho ja syötti)']);
  o.push(['Siima',r.line?`${ITEMS[r.line].n} – kunto ${Math.round((r.lw??1)*100)} %`:'ei siimaa!'],['Koukku',ITEMS[r.hook]?ITEMS[r.hook].n:'–'],['Kela',r.reel?ITEMS[r.reel].n:'ei kelaa']);
  if(S.spin)o.push(['Viehe',ITEMS[r.lure].n]);else o.push(['Koho',r.float?ITEMS[r.float].n:'–'],['Syötin syvyys',`${tkFmt(S.fd)} m kohon alla (säädä pöydällä)`],['Syötti',r.bait?'mato koukussa':'ei syöttiä (E vapa kädessä)']);
  if(S.combo)o.push(['Yhdistelmä',`${S.combo.n}: ${S.combo.t}`]);
  o.push(['Tärppiväli',S.k<1?`${Math.round((1-S.k)*100)} % lyhyempi`:S.k>1?`${Math.round((S.k-1)*100)} % pidempi (siima näkyy)`:'perus'],['Isojen kalojen keskipaino',S.big?pc(S.big):'perus'],
    ['Isot lajit',S.bw===1?'perus':pc(S.bw-1)],['Pikkukalat',S.sw===1?'perus':pc(S.sw-1)],['Siiman kestävyys',`×${tkFmt(S.ten)}`],['Heittomatka',`enintään ${S.dmax} m (katse ~35° ylös${S.virveli?', täysi lataus':''})`]);
  if(S.win||S.night)o.push(['Tärppi-ikkuna',`+${tkFmt(S.win)} s${S.night?`, yöllä +${tkFmt(S.win+S.night)} s`:''}`]);
  if(S.virveli&&R)o.push(['Tarttuminen iskussa (virveli)',Math.round(S.hk*100)+' %']);if(S.keep)o.push(['Väkä','kala ei irtoa pitkässäkään väsytyksessä']);
  return o;}
function tkLureList(U){const good=[],bad=[],W={lake:'järvet',sea:'meri',bog:'suolammet'};for(const [k,v] of Object.entries(U.w)){if(v>1.05)good.push(W[k]);else if(v<.95)bad.push(W[k]);}
  U.ph.forEach((v,i)=>{if(v>1.15)good.push(FISH_PH[i]);else if(v<.85)bad.push(FISH_PH[i]);});for(const [k,v] of Object.entries(U.wx)){if(v>1.05)good.push(FISH_WXN[k]);else if(v<.95)bad.push(FISH_WXN[k]);}
  if(U.light==='bright')good.push('kirkas valo');else if(U.light==='dim')good.push('hämärä ja pilvisyys');else if(U.light==='dark')good.push('pimeä ja sumu');
  if(U.light==='bright')bad.push('pimeä');if(U.light==='dark')bad.push('kirkas päivä');bad.push('pikkukalat (×0,3)');if(U.top)good.push('ei tartu pohjaan');if(U.sh==='jig')bad.push('tarttuu pohjaan herkemmin');
  return [['Vahvuudet',good.join(', ')||'–'],['Heikkoudet',bad.join(', ')],['Parhaat kalat',U.best.map(x=>FISH_DEF[x].n).join(', ')+' (×2,2)']];}
function tkProps(s,o){const d=ITEMS[s.id];
  if(d.cat==='rod'){o.push(...tkPropsList(s));return;}
  if(d.tk==='line'){const L=TK_LINE[s.id];o.push(['Kestävyys',`×${tkFmt(L.ten)}`],['Kesto','noin '+L.dur+' kalaa'],['Näkyvyys',L.vis>1?`tärppi ${Math.round((L.vis-1)*100)} % harvemmin`:'huomaamaton'],['Satunnainen katkeaminen','pieni, kasvaa kulumisen myötä'],['Kerässä',`${TK_LINE_USES-(s.lu||0)} / ${TK_LINE_USES} siimaa`]);}
  if(d.tk==='hook'){const H=TK_HOOK[s.id];o.push(['Jää pahasti kalaan',tkDeepTxt(H.deep)],['Isot lajit',H.big===1?'perus':`×${tkFmt(H.big)}`],['Pikkukalat',H.small===1?'perus':`×${tkFmt(H.small)}`],['Tarttuminen virvelissä',Math.round(H.hk*100)+' %']);
    if(H.steal<1)o.push(['Syötti pysyy',`varkaudet ×${tkFmt(H.steal)}`]);if(H.keep)o.push(['Väkä','kala ei irtoa']);}
  if(d.tk==='reel'){const K=TK_REEL[s.id];o.push(['Tekee vavasta','virvelin'],['Heittomatka vieheellä',`${TK_SPIN_MIN}–${K.cast} m`],['Kelausnopeus',`${tkFmt(TK_REEL_V*K.spd)} m/s`],['Väsytysteho',`+${Math.round((K.fk-1)*100)} %`]);if(K.tk<1)o.push(['Siiman jännitys',`−${Math.round((1-K.tk)*100)} %`]);}
  if(d.tk==='float'){const F=TK_FLOAT[s.id];o.push(['Tärppi-ikkuna',F.win?`+${tkFmt(F.win)} s`:'perus']);if(F.night)o.push(['Yöllä',`+${tkFmt(F.win+F.night)} s (hohtaa)`]);if(F.steal<1)o.push(['Syötti',`varkaudet ×${tkFmt(F.steal)}`]);}
  if(d.tk==='lure')o.push(...tkLureList(TK_LURE[s.id]),['Jää pahasti kalaan',tkDeepTxt(TK_LURE[s.id].deep)],['Kuluminen','ei kulu – voi tarttua pohjaan matalassa (hyvin harvoin)']);
  if(d.tk==='pakki'){pakkiNorm(s);const n=s.box.filter(Boolean).length;let w=0;for(const b of s.box)if(b)w+=ITEMS[b.id].w*b.n;o.push(['Taso',`${s.lv+1} / 4`],['Paikkoja',`${n} / ${pakkiSlots(s.lv)}`],['Sisällön paino',tkFmt(w)]);}}
function tkRender(){const el=document.getElementById('tkBody');if(!el||!tkCur)return;const rods=tkRods();if(tkSel>=rods.length)tkSel=0;const s=rods[tkSel];
  const pk=tkCur.data.pk,ic=id=>`<span class="ic" style="background-image:url(${icon(id)})"></span>`;
  let L=`<div class="tkRods">${rods.length?rods.map((r,i)=>`<button class="tkRod${i===tkSel?' on':''}" data-r="${i}">${ic(r.id)}<b>${ITEMS[r.id].n}</b><small>${rodName(r)}${r.eq?' · kädessä':''}</small></button>`).join(''):'<div class="note">Ei vapoja repussa tai pöydän pakissa.</div>'}</div>`;
  if(s){const r=rigOf(s);L+='<div class="tkSlots">';for(const [k,nm,DEF] of TK_SLOTS){if(k==='lure'&&!r.reel)continue;if(k==='float'&&r.reel&&r.lure)continue;const cur=r[k],av=tkAvail(k);
      L+=`<div class="tkSlot"><div class="tkCur">${cur?ic(cur):'<span class="ic q">–</span>'}<div><small>${nm}</small><b>${cur?ITEMS[cur].n:'ei'}${k==='line'&&cur?` <i>${Math.round((r.lw??1)*100)} %</i>`:''}</b></div>${cur&&k!=='line'&&k!=='hook'?`<button class="btn sm" data-off="${k}">Irrota</button>`:''}</div>`+
        `<div class="tkAv">${Object.keys(av).length?Object.entries(av).map(([id,n])=>`<button class="tkPart${id===cur?' cur':''}" data-k="${k}" data-id="${id}" title="${ITEMS[id].d}">${ic(id)}<span>${ITEMS[id].n}</span><small>×${n}</small></button>`).join(''):`<span class="note">Ei muita ${{Siima:'siimoja',Koukku:'koukkuja',Kela:'keloja',Koho:'kohoja',Viehe:'vieheitä'}[nm]} – valmista niitä pöydän ääressä (valmistus).</span>`}</div></div>`;}
    L+='</div>';
    /* v3.27 käyttäjä: kohon kohta – syötin syvyys 0–2 m (vaikuttaa lajeihin, ks. kalakirja) */
    if(!(r.reel&&r.lure)){const fd=r.fd!=null?r.fd:TK_FD_DEF;L+=`<div class="tkDepth"><small>Kohon kohta – syötin syvyys</small><div><button class="btn sm" data-fd="-1">−</button><b>${tkFmt(Math.round(fd*10)/10)} m</b><button class="btn sm" data-fd="1">+</button></div><span class="note keep">${fd<.3?'pintavesi':fd<1?'matala väli':fd<1.6?'välivesi':'syvä – pohjakaloille'} · pohjassa koukku voi tarttua</span></div>`;}}
  const M=s?`<h3>${ITEMS[s.id].n}: ${rodName(s)}</h3><table class="tkProps">${tkPropsList(s).map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`+
    `<details class="tkCombos"><summary>Yhdistelmät (${TK_COMBOS.length})</summary><ul>${TK_COMBOS.map(c=>`<li><b>${c.n}</b>: ${Object.entries(c.need).map(([k,v])=>v.map(x=>x===0?'ei kelaa':ITEMS[x].n).join(' / ')).join(' + ')} → ${c.t}</li>`).join('')}</ul></details>`:'';
  const raw=Object.keys(FISH_DEF).filter(id=>invCount(id)>0),nr=raw.reduce((a,id)=>a+invCount(id),0);let nf=0;for(const id of raw){const k=FISH_DEF[id].k;nf+=invCount(id)*(k>=2?3:k>1?2:1);}
  let R=`<h3>Perkaus</h3>${nr?`<p>${raw.map(id=>`${ITEMS[id].n} ×${invCount(id)}`).join(', ')}</p><button class="btn pri" id="tkGut">Perkaa kaikki → ${nf} fileetä + ${nr} perkeet</button>`:'<p class="note">Repussa ei ole raakaa kalaa.</p>'}
    <p class="note keep">Fileet paistetaan nuotiolla. Perkeet ovat katiskan syötti (vastaavat kahta matoa).</p><h3>Pakki</h3>`;
  if(pk){const up=PAKKI_UP[(pk.lv||0)+1];R+=`<p>Pöydällä: kalastuspakki, taso ${pk.lv+1} (${pk.box.filter(Boolean).length}/${pakkiSlots(pk.lv)} paikkaa). Sen osat ovat käytössä yllä.</p><button class="btn" id="tkOpenPk">Avaa pakki</button>`+
    (up?` <button class="btn" id="tkUpPk"${hasReq(up)?'':' disabled'}>Päivitä tasolle ${pk.lv+2} (${pakkiSlots(pk.lv+1)} paikkaa): ${Object.entries(up).map(([k,v])=>`${ITEMS[k].n} ${v}`).join(', ')}</button>`:'<p class="note">Pakki on korkeimmalla tasolla.</p>');}
  else R+=`<p class="note">${invCount('kalapakki')?'Ota pakki vasempaan käteen ja napsauta pöydän pakkipaikkaa – pöydällä sen voi päivittää ja sen osat ovat käytössä.':'Valmista kalastuspakki pöydällä (valmistus) – siihen mahtuvat vavat, osat ja vieheet.'}</p>`;
  el.innerHTML=`<div class="tkL">${L}</div><div class="tkM">${M}</div><div class="tkR">${R}</div>`;
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{tkSel=+b.dataset.r;tkRender();});
  el.querySelectorAll('[data-fd]').forEach(b=>b.onclick=()=>{const r=rigOf(s);r.fd=clamp(Math.round(((r.fd!=null?r.fd:TK_FD_DEF)+(+b.dataset.fd)*TK_FD_STEP)*10)/10,TK_FD[0],TK_FD[1]);tkSnd('koukun_vaihto');tkRender();});
  el.querySelectorAll('[data-off]').forEach(b=>b.onclick=()=>{tkSetPart(s,b.dataset.off,null);tkSnd('koukun_vaihto');tkRender();});
  el.querySelectorAll('.tkPart').forEach(b=>b.onclick=()=>{const k=b.dataset.k,id=b.dataset.id,r=rigOf(s);if(r[k]===id&&!(k==='line'&&(r.lw??1)<1))return;if(k==='lure'&&!r.reel){msg('Viehe sopii vain virveliin – kiinnitä ensin kela. Onkiessa käytetään matoa.','warn');return;}if(!tkTake(id))return;tkSetPart(s,k,id);
    tkSnd(k==='line'?'siiman_vaihto':'koukun_vaihto')||sfx('craft');msg(`${ITEMS[s.id].n}: ${ITEMS[id].n} kiinni.${k==='reel'&&!rigOf(s).lure?' Vapa on nyt virveli – kiinnitä viehe tai käytä kohoa ja matoa.':''}`);tkRender();});
  const g=document.getElementById('tkGut');if(g)g.onclick=()=>{tkGut();tkRender();};
  const op=document.getElementById('tkOpenPk');if(op)op.onclick=()=>tkPakkiOpen(pk);
  const u=document.getElementById('tkUpPk');if(u)u.onclick=()=>{const c=PAKKI_UP[(pk.lv||0)+1];if(!c||!hasReq(c))return;payReq(c);pk.lv++;pakkiNorm(pk);tkTableVis(tkCur);sfx('craft');plSnd('rakentaminen','valmistus');msg(`Kalastuspakki tasolla ${pk.lv+1}: ${pakkiSlots(pk.lv)} paikkaa.`,'loot');tkRender();};}
function tkGut(){let fil=0,per=0;for(const id of Object.keys(FISH_DEF)){const n=invCount(id);if(!n)continue;const k=FISH_DEF[id].k;invRemove(id,n);fil+=n*(k>=2?3:k>1?2:1);per+=n;}
  if(!per)return;giveOrDrop('kalafilee',fil,P.pos.x,P.pos.y+1,P.pos.z);giveOrDrop('perkeet',per,P.pos.x,P.pos.y+1,P.pos.z);tkSnd('perkaus')||sfx('craft');msg(`Perkasit ${per} kalaa: ${fil} fileetä ja ${per} perkeet.`,'loot');bump('gut');}
// v3.27 pakin koristeet ajan tasalle, kun sisältö muuttuu (maassa ja pöydällä; kädessä updateGear-avain)
function tkDecoSync(){for(const e of PKW.list){const sg=pakkiSig(e.o.box);if(sg!==e.o._sig){scene.remove(e.m);const m=tkPakkiMesh(e.o.lv,false,e.o.box);m.position.copy(e.m.position);m.rotation.y=e.m.rotation.y;scene.add(m);e.m=m;e.o._sig=sg;}}
  for(const p of pieces)if(p.t==='kalapoyta'&&p.data.pk&&pakkiSig(p.data.pk.box)!==p.data.pk._sig)tkTableVis(p);
  {const o=equipped('offhand');if(o&&o.id==='kalapakki'&&offKey&&offKey.split('#')[2]!==pakkiSig(o.box))updateGear();}}
/* ---------------- HUD ---------------- */
/* v3.38 käyttäjä: vavan vihjeet (mato koukkuun / solmi siima / ei siimaa) vain ensimmäisellä kerralla, 8 s (localStorage hiidenmaa_tkHint) */
const TK_HINT_T=8000,_tkHS={};
// v3.42 'jää pahasti kalaan' -kerroin tekstinä
function tkDeepTxt(k){k=k??1;return (k>=1.35?'usein':k>=1.1?'melko usein':k>.9?'tavallisesti':k>.75?'harvemmin':'harvoin')+` (×${tkFmt(k)})`;}
function tkHintOnce(k){let seen={};try{seen=JSON.parse(localStorage.getItem('hiidenmaa_tkHint')||'{}');}catch(e){}const now=performance.now();
  if(_tkHS[k]==null){if(seen[k])return false;_tkHS[k]=now;seen[k]=1;try{localStorage.setItem('hiidenmaa_tkHint',JSON.stringify(seen));}catch(e){}}
  return now-_tkHS[k]<TK_HINT_T;}
function tkHud(el){if(TKA.on){el.hidden=false;el.className='wait';el.innerHTML=`<span>Vaihdetaan siimaa… ilman pöytää tämä kestää ikuisuuden · ${Math.ceil(TKA.T-TKA.t)} s</span><div class="fb"><i class="pr" style="width:${Math.round(TKA.t/TKA.T*100)}%"></i></div>`;return true;}
  if(FS.st==='spin'){el.hidden=false;el.className='wait';const d=Math.hypot(FS.bx-P.pos.x,FS.bz-P.pos.z),bd=fpBaitDepth();el.innerHTML=`<span>${FS.body?FS.body.name+' · ':''}${ITEMS[FS.rod.lureId].n} · ${Math.round(d)} m · syvyys ${tkFmt(Math.round(bd.d*10)/10)} m${bd.bot?' (pohjassa!)':''}${(h=>h?' · '+h:'')(typeof fhint==='function'?fhint('spin','pidä vasenta kelataksesi'):'')}</span>`;return true;}
  if(FS.st==='idle'){const w=equipped('weapon');if(w&&ITEMS[w.id].cat==='rod'&&state==='play'){const r=rigOf(w);let t='',k='';
      if(!r.line){k=tkLineInPack()?'solmi':'eisiima';t=k==='solmi'?'E: solmi uusi siima repusta':'Vavassa ei ole siimaa – siimaa tarvitaan repussa (tai Kalastajan pöytä)';}else if(!r.bait&&!(r.reel&&r.lure)&&invCount('mato')){k='mato';t='E: mato koukkuun · vasen heittää';}
      if(t&&tkHintOnce(k)){el.hidden=false;el.className='wait tkHint';el.innerHTML=`<span>${t}</span>`;return true;}}
    el.hidden=true;return true;}
  return false;}
/* ---------------- ENSIMMÄINEN ONKI (wow-ilmoitus) ---------------- */
function tkWowTick(){const F=fishF();if(F.rod1)return;if(!inv.some(s=>s&&ITEMS[s.id].cat==='rod'))return;F.rod1=1;if(fishTotal(F)>0)return;
  /* v3.29 käyttäjä: ei enää ruudun keskelle – sama vasemmalta kurkistava lappu kuin saaliissa */
  lappu(icon('onki'),`<b class="mW" style="font-size:15px">Ensimmäinen onkesi!</b><br><span class="mG">Vasen heittää veteen (noin 35° ylös pisin) · E laittaa madon koukkuun · kun koho nykii, vasen nostaa kalan.<br>Kalastajan pöydällä vaihdat siiman, koukun, kelan, kohon ja vieheen.</span><br><b style="color:#e8c070">Kireitä siimoja!</b>`,{t:9});tkSnd('eka_onki');}
/* ---------------- KUVAKKEET (items.js icon → tkIcon) ---------------- */
function tkIcon(g,id,d,circ,line,poly){const hx=n=>'#'+n.toString(16).padStart(6,'0'),T=d.tk;g.lineCap='round';
  if(T==='line'){const c=hx(TK_LINE[id].col);circ(24,24,15,'#6a4a2a','#2a1a0c');circ(24,24,11,c);for(let i=0;i<5;i++){g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;g.beginPath();g.arc(24,24,4+i*1.6,0,TAU);g.stroke();}circ(24,24,3.2,'#3a2614');
    g.strokeStyle=c;g.lineWidth=1.2;g.beginPath();g.moveTo(35,24);g.quadraticCurveTo(44,30,40,44);g.stroke();if(id==='hiidensiima'){g.fillStyle='rgba(95,230,217,.35)';g.beginPath();g.arc(24,24,17,0,TAU);g.fill();}return;}
  if(T==='hook'){const c=id==='pienikoukku'?'#e8e0c8':id==='isokoukku'?'#d98a4e':'#a8b0b8',s=id==='isokoukku'?1.25:id==='pienikoukku'?.85:1.05;g.save();g.translate(24,24);g.scale(s,s);
    g.strokeStyle='#1e1a14';g.lineWidth=5;g.beginPath();g.moveTo(2,-16);g.lineTo(2,6);g.arc(-5,6,7,0,Math.PI*.95);g.stroke();g.strokeStyle=c;g.lineWidth=2.8;g.stroke();
    circ(2,-17,2.6,c,'#1e1a14');poly([[-12,5],[-14,-2],[-9,3]],c,'#1e1a14');if(id==='vakakoukku'){poly([[2,-4],[7,-1],[2,-1]],c,'#1e1a14');}g.restore();return;}
  if(T==='reel'){const c=hx(TK_REEL[id].col);circ(22,26,14,c,'#1e1a14');circ(22,26,9,'#3a3a3a');circ(22,26,7,id==='hiisikela'?'#9af0e6':'#e0d8c0');line(22,26,38,16,3,'#2a2a2a');circ(39,15,3.4,'#d8c8a0','#1e1a14');line(22,8,22,13,4,'#3a3a3a');line(14,8,30,8,3,'#5a4a3a');return;}
  if(T==='float'){const F=TK_FLOAT[id],c=hx(F.col);if(F.glow){g.fillStyle='rgba(122,240,208,.35)';g.beginPath();g.arc(24,24,18,0,TAU);g.fill();}line(24,4,24,14,2,'#2a2a2a');
    g.fillStyle=c;g.beginPath();g.arc(24,24,11,Math.PI,0);g.fill();g.fillStyle='#f2f0e8';g.beginPath();g.arc(24,24,11,0,Math.PI);g.fill();g.strokeStyle='#1e1a14';g.lineWidth=1.4;g.beginPath();g.arc(24,24,11,0,TAU);g.stroke();line(24,35,24,44,1,'#e8e8e0');return;}
  if(T==='lure'){const U=TK_LURE[id],c=hx(U.col),c2=hx(U.c2);g.save();g.translate(24,22);g.rotate(-.5);if(U.glow){g.fillStyle='rgba(95,230,217,.3)';g.beginPath();g.arc(0,2,17,0,TAU);g.fill();}
    line(0,-18,0,-12,1.2,'#d8d8d0');circ(0,-11,2,'#b8bcc4','#1e1a14');
    if(U.sh==='spoon'){const w=U.thin?5:7.5;g.fillStyle=c;g.beginPath();g.ellipse(0,1,w,12,0,0,TAU);g.fill();g.strokeStyle='#1e1a14';g.lineWidth=1.3;g.stroke();g.fillStyle=c2;g.beginPath();g.ellipse(0,3,w*.55,7,0,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(-w*.35,-3,1.4,4,0,0,TAU);g.fill();}
    else if(U.sh==='jig'){circ(0,-4,5.5,c,'#1e1a14');poly([[-4,0],[4,0],[0,15]],c2,'#1e1a14');circ(-2,-5,1.2,'#101010');}
    else if(U.sh==='plug'){g.fillStyle=c;g.beginPath();g.ellipse(0,3,6,13,0,0,TAU);g.fill();g.strokeStyle='#1e1a14';g.lineWidth=1.3;g.stroke();g.fillStyle=c2;g.beginPath();g.ellipse(0,7,4,6,0,0,TAU);g.fill();circ(-2,-5,1.6,'#101010');poly([[-4,-9],[4,-9],[2,-14],[-2,-14]],'rgba(220,220,220,.7)');if(U.top){poly([[-3,15],[3,15],[0,22]],'#e8e0c8','#1e1a14');}}
    else{g.fillStyle=c;g.beginPath();g.ellipse(3,-2,5,9,.5,0,TAU);g.fill();g.strokeStyle='#1e1a14';g.lineWidth=1.2;g.stroke();circ(0,9,3,c2,'#1e1a14');}
    g.strokeStyle='#b8bcc4';g.lineWidth=1.6;g.beginPath();g.arc(-2,17,3.5,0,Math.PI);g.stroke();g.restore();return;}
  if(T==='pakki'){const c=hx(PAKKI_COL[0]);poly([[6,18],[42,18],[42,42],[6,42]],c,'#1e1a14');poly([[5,14],[43,14],[43,20],[5,20]],'#8a6a3a','#1e1a14');line(18,14,18,8,2.4,'#2a1a0e');line(30,14,30,8,2.4,'#2a1a0e');line(18,8,30,8,2.6,'#2a1a0e');
    line(10,18,10,42,2,'#c8a050');line(38,18,38,42,2,'#c8a050');circ(24,28,3,'#c8a050','#1e1a14');return;}
  if(id==='kalafilee'||id==='filepaisti'){const ck=id==='filepaisti';g.fillStyle=ck?'#c8803a':'#f0b8a0';g.beginPath();g.moveTo(6,30);g.quadraticCurveTo(16,12,36,16);g.quadraticCurveTo(44,20,42,26);g.quadraticCurveTo(30,38,6,30);g.fill();
    g.strokeStyle='#3a2014';g.lineWidth=1.4;g.stroke();g.strokeStyle=ck?'rgba(90,40,10,.6)':'rgba(255,255,255,.7)';g.lineWidth=1;for(let i=0;i<5;i++){g.beginPath();g.moveTo(12+i*6,28-i*.6);g.quadraticCurveTo(15+i*6,22,13+i*6,17+i*.5);g.stroke();}return;}
  if(id==='perkeet'){circ(18,28,8,'#8a4a3a','#2a140c');circ(28,30,6,'#a85a4a','#2a140c');circ(24,22,5,'#6a8a4a','#2a140c');line(10,36,38,36,2,'#5a3a2a');return;}}
/* ---------------- ÄÄNET (sounds2/kalastus/, paikkamerkit; peli käyttää vasta kun käsittelyrakenne on tehty) ---------------- */
function tkSnd(ev,o){return typeof plSnd==='function'?plSnd('kalastus',ev,o):false;}
/* ---------------- PÄÄSILMUKKA ---------------- */
function tkTick(dt){tkPakkiSync();tkFieldTick(dt);tkDangleTick(dt);if((tkTick.w=(tkTick.w||0)-dt)<=0){tkTick.w=.25;tkWowTick();if(FS.st==='idle')fishHud();tkDecoSync();}if(openPanel==='tk'&&tkCur&&!pieces.includes(tkCur))closePanels();}
// paistettava filee nuotiolla/grillillä
COOKABLE.kalafilee='filepaisti';COOK_T.kalafilee=[5,2];
