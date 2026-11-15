/* Hiidenmaa – story.js
   Löytöpaikat (rauniotalot, arkkukivet), vartijamobit, lisäriimukivet ja tarinatehtävät */
'use strict';

const SITE_KEYS=Object.keys(LOC).filter(k=>LOC[k].kind==='ruin'||LOC[k].kind==='rock'||LOC[k].kind==='portal');
const POI_LOOT={poiR1:[['jaaavain',1],['rauta',2],['nuolet',15]],poiR2:[['rautamalmi',5],['nuolet',20],['pihka',3]],poiR3:[['hiidenkivi',1],['kupari',4]],poiR4:[['rauta',4],['nahka',4],['hiili',5]],
  poiK1:[['rauta',3],['pihka',4],['nuolet',15]],poiK2:[['kupari',6],['luu',4],['hiili',5]],poiK3:[['hiidenkivi',1],['rautamalmi',3]]};
const GUARDS={portal1:['kivivartija','kivivartija'],portal2:['kivivartija','kalmo','kalmo'],portal3:['kivivartija','hiisi','hiisi'],
  poiR1:['kivivartija','kalmo'],poiR2:['kalmo','kalmo'],poiR3:['kivivartija'],poiR4:['kivivartija','hiisi'],poiK1:['kalmo','kalmo'],poiK2:['hiisi','hiisi','hiisi'],poiK3:['kivivartija','kalmo']};
const stoneM=()=>mat(rockC(0x77746d,Math.random())),mossM=mat(0x4d6a3a);

/* ---------------- LÖYTÖPAIKKOJEN RAKENTEET ---------------- */
function buildPoiRuin(k){const L=LOC[k],y=terrainH(L.x,L.z),r=mulberry32(k.charCodeAt(4)*977+(L.x|0));
  const W=9,D=7,sx=r()<.5?1:-1;
  const wall=(x,z,len,ry)=>{if(r()<.22)return;const h=.7+r()*2.7;stoneBox(len,h,.7,x,y+h/2-.1,z,ry,stoneM());if(h>1.6&&r()<.5)stoneBox(len*.6,.4,.8,x,y+h+.1,z,ry+r()*.1,mossM,false);};
  for(let i=0;i<5;i++){const x=L.x-W/2+.9+i*1.8;wall(x,L.z-D/2,1.8,0);if(!(i===2))wall(x,L.z+D/2,1.8,0);}
  for(let i=0;i<4;i++){const z=L.z-D/2+.9+i*1.75;wall(L.x-W/2,z,1.75,Math.PI/2);wall(L.x+W/2,z,1.75,Math.PI/2);}
  for(const [cx,cz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const h=3+r()*1.2;stoneBox(1.1,h,1.1,L.x+cx*W/2,y+h/2-.1,L.z+cz*D/2,0,stoneM());}
  statics.add(bx(W-1,.2,D-1,mat(0x55524c),L.x,y+.05,L.z,false));
  for(let i=0;i<4;i++)stoneBox(.7+r(),.5,.7,L.x+(r()-.5)*5,y+.2,L.z+(r()-.5)*3.5,r()*3,stoneM());
  const cx=L.x+sx*2.6,cz=L.z-1.2,ch=makeChest('wood',1,.7,.65);ch.position.set(cx,y,cz);statics.add(ch);addBox(cx-.5,y,cz-.33,cx+.5,y+.7,cz+.33,'static');
  chestUse(k,ch,cx,y,cz);
}
// v1.01 (käyttäjän pyyntö): arkkukivi on suljettu kivilinnake – 3,5 m korkea umpinainen muuri (säde 5,5 m, paksuus 0,8 m), ulkopuolella
// 5 kivipilaria hyppyreittinä muurin harjalle (nousu 0,7 m, välit 1,6–1,9 m = vaikea, pelaajan hyppy ~1,18 m korkea / kävellen ~2,5 m),
// sisäpuolella kiviportaat (0,5 m < askelnousu) alas arkulle ja takaisin ylös. Reitin tiedot FORT[k] (tarkistus).
const FORT={};
function buildPoiRock(k){const L=LOC[k],y=terrainH(L.x,L.z),r=mulberry32(k.charCodeAt(4)*733+(L.z|0)),WR=5.5,WH=3.5,WT=.8,a0=r()*TAU,f=FORT[k]={pillars:[],steps:[],a0};
  const stoneM=()=>mat(rockC(0x6f6c66,r())),P2=(rr,a)=>[L.x+Math.cos(a)*rr,L.z+Math.sin(a)*rr];
  // muuri: 18 lohkoa renkaana (alaosa maan alle rinteen varalta), sammalta harjalla
  for(let i=0;i<18;i++){const a=i/18*TAU,[x,z]=P2(WR,a),gy=Math.min(y,terrainH(x,z)),h=WH+(y-gy)+1,len=WR*TAU/18+.35;
    const m=stoneBox(WT,h,len,x,gy-1+h/2,z,-a,stoneM(),false);m.add(bx(WT*1.02,.15,len*.95,mossM,0,h/2,0,false));}
  // v1.39 (lista 4, extra 2): muurin osuma kaaren mukaan ympyröinä (ennen kierretyn lohkon AABB, joka ulottui jopa ~0,9 m sisään portaille)
  for(let i=0,n=Math.ceil(WR*TAU/.42);i<n;i++){const a=i/n*TAU,[x,z]=P2(WR,a),gy=Math.min(y,terrainH(x,z));addCircle(x,z,WT/2+.04,gy-1,y+WH+.07,'static').ground=1;}   // v2.04: harja on kävelypinta (sammaleen pinta +7 cm)
  // v1.03 vaikeammat hypyt: 5 kapeaa pilaria (0,75–0,85 m) siksakissa (säde vuorotellen 8,2 / 10,2 m), nousu 0,8 m (huippu 4,0 m),
  // välit reunasta reunaan 2,0–2,4 m → vaatii juoksuhypyn (kävellen ~2,4 m, juosten ~4 m). Viimeiseltä pudotaan 0,5 m muurin harjalle (väli 1,6 m).
  const PH=[.8,1.6,2.4,3.2,4.0];let a=a0,prevP=null;
  PH.forEach((ph,i)=>{const w=.75+r()*.1,rr=i===4?8.1:(i%2?10.2:8.2);let x,z;
    if(prevP){const gap=2+r()*.4,need=gap+(w+prevP.w)/2;let lo=0,hi=1.5;for(let t=0;t<30;t++){const mid=(lo+hi)/2,[tx,tz]=P2(rr,a-mid);if(Math.hypot(tx-prevP.x,tz-prevP.z)<need)lo=mid;else hi=mid;}a-=hi;}
    [x,z]=P2(rr,a);const gy=terrainH(x,z),top=y+ph,h=top-gy+1;stoneBox(w,h,w,x,top-h/2,z,r()*3,stoneM()).add(bx(w*1.01,.12,w*1.01,mossM,0,h/2,0,false));
    f.pillars.push({x,z,top,w});prevP={x,z,w};});
  // v1.03 kierreportaat: muurin sisäpintaa kiertävä portaikko harjalta (3,5 m) alas 0,3 m askelin (askelma 1,2 m leveä, ~0,75 m syvä),
  // kiertää ~300° ja päättyy maahan; samaa tietä takaisin ylös. Alkaa pilarireitin kohdalta (viimeisen pilarin kulma).
  {const aw=Math.atan2(f.pillars[4].z-L.z,f.pillars[4].x-L.x),rs=WR-WT/2-.56,n=Math.round(WH/.3);let a2=aw;
   for(let s=1;s<n;s++){const top=y+WH-s*.3;a2+=.78/rs;const [x,z]=P2(rs,a2),h=top-y+1;stoneBox(1.05,h,1.24,x,top-h/2,z,-a2+Math.PI/2,stoneM()).add(bx(1.07,.06,1.26,mossM,0,h/2,0,false));   /* v1.39: leveämmät askelmat (0,82 → 1,05 m) */f.steps.push({x,z,top});}}
  stoneBox(2.2,.5,2.2,L.x,y,L.z,.4,mat(0x5b5853),false);
  const g=bx(.5,1.2,.04,MAT.glow,0,0,0,false);{const [gx,gz]=P2(WR-WT/2-.03,a0+Math.PI);g.position.set(gx,y+2.2,gz);g.rotation.y=-(a0+Math.PI)+Math.PI/2;statics.add(g);}   // hehkuva riimu muurin sisäpinnalla
  const ch=makeChest('stone',.95,.65,.62);ch.position.set(L.x,y+.25,L.z);statics.add(ch);
  chestUse(k,ch,L.x,y+.4,L.z,true);
  lightSources.push({x:L.x,y:y+2,z:L.z,c:0x7fd6cc,i:.8,on:()=>true});
}
function chestUse(k,mesh,x,y,z,noBox){
  const fk='poi:'+k;
  interactables.push({x,y:y+.6,z,r:2.6,label:()=>foundEmpty(fk)?'Arkku (tyhjä)':'Avaa arkku',use:()=>{const first=!fo('poi')[k];
    openFound(fk,LOC[k].name||'Arkku',first?POI_LOOT[k]||[['kupari',3]]:null);if(!first)return;
    const guards=mobs.filter(m=>m.siteK===k&&!m.dead&&dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z)<14*14);
    fo('poi')[k]=1;openLid(mesh);
    msg(guards.length?'Arkku aukesi – vartijat eivät ole tyytyväisiä!':'Arkku avattiin.','loot');addXp(25,'Löytö');burst(x,y+1,z,0x7fd6cc,12,3);}});
}
for(const k of SITE_KEYS){if(LOC[k].kind==='ruin')buildPoiRuin(k);else if(LOC[k].kind==='rock')buildPoiRock(k);}

/* ---------------- VARTIJAT JA LÖYDÖT ---------------- */
let siteT=0;
function updateSites(dt){
  siteT-=dt;if(siteT>0)return;siteT=1;if(P.inDun)return;
  for(const k of SITE_KEYS){const L=LOC[k],d2=dist2(L.x,L.z,P.pos.x,P.pos.z);
    if(d2<30*30&&!flags.disc[k]){flags.disc[k]=1;msg(`Löysit paikan: ${L.name}`,'loot');}
    if(d2>75*75)continue;
    (GUARDS[k]||[]).forEach((type,i)=>{if(fo('gk')[k+':'+i]||mobs.some(m=>m.siteK===k&&m.gi===i))return;
      const a=i/(GUARDS[k].length)*TAU+k.charCodeAt(k.length-1),R=L.kind==='portal'?8:7,x=L.x+Math.cos(a)*R,z=L.z+Math.sin(a)*R;
      const m=spawnMob(type,x,z,{noBorn:1});m.siteK=k;m.gi=i;m.guard={x,z,r:(L.kind==='portal'?16:15)*2};/* v0.97: alue ×2 */});}
}

/* ---------------- LISÄRIIMUKIVET ---------------- */
const DIRS=['pohjoiseen','koilliseen','itään','kaakkoon','etelään','lounaaseen','länteen','luoteeseen'];
function dirText(from,k){const L=LOC[k],dx=L.x-from.x,dz=L.z-from.z,a=Math.atan2(dx,-dz),i=((Math.round(a/(Math.PI/4))%8)+8)%8;return `${DIRS[i]}, noin ${Math.round(Math.hypot(dx,dz)/10)*10} m`;}
const XRUNES={
  runeA:{t:'Riimukivi – Tunturin huurre',reveal:['portal1'],txt:f=>`”Tunturin kylmyydessä seisoo Routaportti, ${dirText(f,'portal1')}. Sen takana on Routaluola, ja siellä Jäätär vartioi talvea. Portti on lukittu – sen avain on kätketty tänne, meidän maailmaamme.”`},
  runeB:{t:'Riimukivi – Vuoren kuiskaus',reveal:['portal1'],txt:f=>`”Korkealla, ${vagueDir(f,LOC.runeK)} täältä, missä tuuli ei koskaan lakkaa, seisoo Avaimen kätkijä. Se muistaa jokaisen kätkön ja kertoo sille, joka jaksaa nousta. Routaportti, ${dirText(f,'portal1')}, vaatii kaksi: jään ja kalman.”`},   // v2.62 (ent. Avaimen kätkijä – kivi on nyt vuorella)
  runeC:{t:'Riimukivi – Kivien kirstut',reveal:['poiK1'],txt:f=>`”Vanhat kansat kätkivät aarteensa suuriin kiviin. Yksi arkkukivi on ${dirText(f,'poiK1')}. Muista: vartijat ovat sidottuja paikkaansa – juokse karkuun, jos hupenet.”`},
  runeD:{t:'Riimukivi – Kolme sisarta',reveal:['portal2'],txt:f=>`”Kolme sisarta vartioivat jäätä, kuolemaa ja metsää, ja kukin kantaa seuraavan avainta. Jäätär kantaa luuavainta, joka aukaisee Kalmankammion portin, ${dirText(f,'portal2')}. Viimeinen sisar kantaa kruunun sirpaletta. Kun kaikki kaatuvat, Hiidenmaan vartija jää yksin.”`},
  runeE:{t:'Riimukivi – Vihreä avain',reveal:['portal3'],txt:f=>`”Kun Kalmaherra kaatuu, hänen vyöltään putoaa vihreä aarniavain. Se aukaisee Aarnihaudan portin, ${dirText(f,'portal3')}, metsän pimeimmässä kohdassa.”`},
  runeF:{t:'Riimukivi – Vanha varoitus',reveal:['circle'],txt:f=>`”Portit eivät ole vain pakoreittejä. Niiden takana lepää Kalmankruunu, jonka kolme sirpaletta Kalmankehän alttari kaipaa: ${dirText(f,'circle')}. Sirpaleet ovat Aarnihaudan syvyydessä – yksi hirviön hallussa, kaksi kätkettynä arkkuihin.”`},
};
for(const k in XRUNES){const R=XRUNES[k],L=LOC[k],y=terrainH(L.x,L.z),v=k.charCodeAt(4)%4,r=mulberry32(k.charCodeAt(4)*131);
  let me;
  if(v===0)me=stoneBox(.9,2.8,.5,L.x,y+1.2,L.z,r()*3,mat(0x6a6c70));
  else if(v===1){me=stoneBox(1.1,2.2,.55,L.x,y+1,L.z,r()*3,mat(0x706a62));me.rotation.z=.12;stoneBox(.5,.7,.5,L.x+1.2,y+.3,L.z+.4,1,mat(0x5b5853));}
  else if(v===2){me=stoneBox(.7,3.2,.5,L.x,y+1.5,L.z,r()*3,mat(0x5f6a66));stoneBox(.5,2,.4,L.x+.9,y+.9,L.z-.3,r()*3,mat(0x66706c));}
  else{me=stoneBox(1.3,1.9,.6,L.x,y+.8,L.z,r()*3,mat(0x78726a));me.add(bx(1.0,.3,.64,mossM,0,.9,0,false));}
  const gl=bx(.4,.9+v*.2,.04,MAT.glow,0,0,.26,false);me.add(gl);
  interactables.push({x:L.x,y:y+1,z:L.z,r:2.6,label:()=>'Lue riimukivi',use:()=>{showLore(R.t,R.txt(L));flags.runes[k]=1;
    for(const t of R.reveal)if(!flags.disc[t]){flags.disc[t]=1;msg(`${LOC[t].name} merkittiin karttaan.`,'loot');}}});}

/* ---------------- TEHTÄVÄT ---------------- */
// Jokainen tehtävä on kuvaus + ehto; näytetään ensimmäinen suorittamaton. at = kartalle merkitty kohde, jonka suunta ja etäisyys näytetään.
const QUESTS=[
  {t:'Lue rannan riimukivi',d:'Rannalla seisoo kivi, joka kertoo saaresta.',done:()=>!!flags.runes.rune1},
  {t:'Löydä Hautakumpu',get d(){return `Kalmanummella ${dirIn('barrow')} lepäävät vanhat päälliköt.`;},at:'barrow',done:()=>!!flags.disc.barrow},
  {t:'Avaa Hautakummun kolme kirstua',d:'Kumpu on pimeä – ota tuli mukaan.',at:'barrow',done:()=>flags.sarc.every(Boolean)},
  {t:'Kaada Hautakummun ylimys',d:'Kuolleiden ylimys kantaa Kalmon sinettiä vyöllään. Sinetti on toinen Routaportin kahdesta lukosta.',at:'barrow',done:()=>!!flags.sinetti||ylimysDead()||lockOpen('portal1','sinetti')||!portalLocked('portal1')},   // v2.62
  {t:'Etsi Routaportti',d:'Riimukivet tietävät sen sijainnin. Se on tuntureiden kylmyydessä.',at:'portal1',done:()=>!!flags.disc.portal1},
  {t:'Löydä Jääavain',get d(){return keyHint()+' Kyltit ja riimukivet voivat auttaa.';},done:()=>invCount('jaaavain')>0||!portalLocked('portal1')},
  {t:'Avaa Routaportti',d:'Portissa on kaksi lukkoa: Jääavain ja Kalmon sinetti.',at:'portal1',done:()=>!portalLocked('portal1')},
  {t:'Kukista Jäätär Routaluolassa',d:'Sokkelon perimmäisessä kammiossa. Hän kantaa luuavainta.',at:'portal1',done:()=>!!fo('rb').portal1},
  {t:'Avaa Kalmankammion portti',d:'Lukko aukeaa Jäättären luuavaimella.',at:'portal2',done:()=>!portalLocked('portal2')},
  {t:'Kukista Kalmaherra',d:'Hän pitää vihreää aarniavainta vyöllään.',at:'portal2',done:()=>!!fo('rb').portal2},
  {t:'Avaa Aarnihaudan portti',d:'Aarniavain sopii metsän portin lukkoon.',at:'portal3',done:()=>!portalLocked('portal3')},
  {t:'Kukista Aarnihirviö',d:'Luolan pimeimmässä sopessa. Hän kantaa Kalmankruunun sirpaletta.',at:'portal3',done:()=>!!fo('rb').portal3},
  {t:'Kerää kolme Kalmankruunun sirpaletta',d:'Kaksi muuta sirpaletta on kätketty Aarnihaudan arkkuihin.',at:'portal3',done:()=>invCount('kruunusirpale')>=3||!!flags.altarSt||!!(flags.boss||boss)},
  {t:'Herätä Kalmanvartija',d:'Aseta kolme Kalmankruunun sirpaletta Kalmankehän alttarille.',at:'circle',done:()=>!!(flags.boss||boss)},
  {t:'Kukista Kalmanvartija',d:'Saari vapautuu otteesta.',at:'circle',done:()=>!!flags.boss},
];
let questKey='',questT=0;
function updateStory(dt){
  updateSites(dt);valuableCensus(dt);if(KEEPER.fx&&!P.inDun){KEEPER.fx.rotation.y+=dt*.9;KEEPER.fx.position.y=KEEPER.y+Math.sin(playTime*1.3)*.12;}
  questT-=dt;if(questT>0)return;questT=1;keeperTick();
  const quiet=flags.qi===undefined;let qi=flags.qi|0;
  while(qi<QUESTS.length&&QUESTS[qi].done()){if(!quiet){msg(`Tehtävä suoritettu: ${QUESTS[qi].t}`,'loot');addXp(60,'Tehtävä');sfx('craft');}qi++;}
  flags.qi=qi;
  const q=QUESTS[qi],el=$('#quest');
  if(!q){const key='end';if(key!==questKey){questKey=key;el.innerHTML='<div class="eyebrow">Tarina</div><div class="qt">Kaikki tehtävät suoritettu</div><div class="qd">Hiidenmaa on vapaa.</div>';}return;}
  let h='';if(q.at&&flags.disc[q.at]){const L=LOC[q.at],dx=L.x-P.pos.x,dz=L.z-P.pos.z;h=P.inDun?'':`${DIRS[((Math.round(Math.atan2(dx,-dz)/(Math.PI/4))%8)+8)%8]}, ${Math.round(Math.hypot(dx,dz)/10)*10} m`;}
  const key=qi+'|'+h;if(key===questKey)return;questKey=key;
  el.innerHTML=`<div class="eyebrow">Tehtävä ${qi+1}/${QUESTS.length}</div><div class="qt">${q.t}</div><div class="qd">${q.d}</div>${h?`<div class="qh">${LOC[q.at].name}: ${h}</div>`:''}`;
}

/* ---------------- HYLÄTYT LEIRIT (v0.99, kohta 14) ---------------- */
// 1–2 leiriä per kartta (siemen kartan mukaan): sammunut nuotio (sytytetään puulla kuten oma nuotio), teltta (A-runko, suojaa: nukkuminen
// onnistuu) ja sänky sisällä, istuintukki ja säkki (löydetty säiliö). Paikka valitaan kasvillisuuden sijoittelun JÄLKEEN puista ja kivistä
// vapaalta tasaiselta maalta (≥ 60 m muista paikoista), joten maiseman numerointi ja vanhat tallennukset eivät muutu. Rakennelmat ovat
// tavallisia rakennusosia (tallentuvat, `flags.camps` = luotu); vanhaan tallennukseen ne luodaan latauksessa.
const CAMPS=(function(){const r=mulberry32(97531+MAP_ID*7919),out=[],n=1+(r()<.5?1:0),tmp=[];
  // ensin tiukat ehdot (niitty/koivikko/metsä/kangas, tasainen, 60 m muista paikoista), jos ei löydy, väljemmät (vuoriset kartat)
  for(let t=0;t<8000&&out.length<n;t++){const loose=t>=4000,x=(r()-.5)*HALF*1.6,z=(r()-.5)*HALF*1.6,h=terrainH(x,z);if(h<2||h>(loose?30:18))continue;
    const b=biomeAt(x,z,h);if(!(loose?['meadow','koivu','forest','kangas','tunturi','suo','aarni','mountain']:['meadow','koivu','forest','kangas']).includes(b))continue;
    let flat=true;for(const [ox,oz] of [[4,0],[-4,0],[0,4],[0,-4]])if(Math.abs(terrainH(x+ox,z+oz)-h)>(loose?1.1:.7))flat=false;if(!flat)continue;
    let far=true;for(const k in LOC){const L=LOC[k];if(dist2(x,z,L.x,L.z)<(loose?35:60)**2){far=false;break;}}for(const c of out)if(dist2(x,z,c.x,c.z)<(loose?80:120)**2)far=false;if(!far)continue;
    nodesNear(x,z,7,tmp);if(tmp.some(o=>o.def.kind==='tree'||o.def.kind==='rock'))continue;
    const k='camp'+(out.length+1);LOC[k]={x,z,name:'Hylätty leiri',kind:'camp'};out.push({k,x,z,y:h,rot:(r()*8)|0});}
  for(const c of out){const sx=c.x+2.2,sz=c.z-1.6,sy=terrainH(sx,sz),key='camp:'+c.k,sk=new THREE.Group();sk.position.set(sx,sy,sz);
    sk.add(bx(.55,.5,.42,mat(0x8a7454),0,.25,0),bx(.2,.12,.2,mat(0x6a5434),0,.55,0));statics.add(sk);   // säkki
    // v1.04 leirin yksityiskohdat: puupino, nahankuivausteline (taljoja), kaatunut ämpäri ja luita/oksia maassa
    {const wp=new THREE.Group(),wx=c.x-2.4,wz=c.z+1.8,wy=terrainH(wx,wz);wp.position.set(wx,wy,wz);const lw=mat(0x6b4a2e),cut=mat(0xc08a52);
      for(let row=0;row<3;row++)for(let q=0;q<4-row;q++){const lg=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,1.1,7),lw);lg.rotation.x=Math.PI/2;lg.position.set((q-(3-row)/2)*.23,.11+row*.2,0);lg.castShadow=true;wp.add(lg);
        for(const e of [-.555,.555]){const cap=new THREE.Mesh(new THREE.CircleGeometry(.105,7),cut);cap.position.set(lg.position.x,lg.position.y,e);cap.rotation.y=e>0?0:Math.PI;wp.add(cap);}}statics.add(wp);}
    {const rk=new THREE.Group(),rx=c.x+1.6,rz=c.z+2.4,ry=terrainH(rx,rz);rk.position.set(rx,ry,rz);rk.rotation.y=r()*3;const st=mat(0x5a3d22),hide=mat(0x9a6a44);
      for(const sx2 of [-.8,.8])rk.add(bx(.07,1.5,.07,st,sx2,.75,0));rk.add(bx(1.7,.06,.06,st,0,1.45,0));const h1=bx(.7,.8,.03,hide,-.35,1.05,.02);h1.rotation.z=.08;rk.add(h1);const h2=bx(.55,.65,.03,mat(0x7a5232),.42,1.12,.02);h2.rotation.z=-.1;rk.add(h2);statics.add(rk);}
    {const bu=new THREE.Mesh(new THREE.CylinderGeometry(.16,.13,.3,9,1,true),Object.assign(mat(0x7b5434),{side:THREE.DoubleSide}));const bx2=c.x+.9,bz=c.z-1.1;bu.position.set(bx2,terrainH(bx2,bz)+.14,bz);bu.rotation.z=Math.PI/2.2;bu.castShadow=true;statics.add(bu);
      for(let q=0;q<4;q++){const qx=c.x+(r()-.5)*3,qz=c.z+(r()-.5)*3;const o=bx(.05,.05,.5,mat(q%2?0xe2dccb:0x6b4527),qx,terrainH(qx,qz)+.03,qz,false);o.rotation.y=r()*3;statics.add(o);}}
    interactables.push({x:sx,y:sy+.5,z:sz,r:2.4,label:()=>foundEmpty(key)?'Säkki (tyhjä)':'Tutki hylätty säkki',use:()=>{const first=!fo('fc')[key];openFound(key,'Hylätty säkki',[['liha',2],['nahka',2],['soihtu',1],['puu',6],['nuolet',8]]);if(first)addXp(15,'Hylätty leiri tutkittu');}});}
  return out;})();
function ensureCamps(){if(flags.camps)return;flags.camps=1;
  for(const c of CAMPS){const a=c.rot*Math.PI/4,fw=(d,s)=>[c.x+Math.sin(a)*d+Math.cos(a)*s,c.z+Math.cos(a)*d-Math.sin(a)*s];
    const [tx,tz]=fw(-3.2,0);addPiece('teltta',tx,terrainH(tx,tz),tz,c.rot);addPiece('sanky',tx,terrainH(tx,tz),tz-0,c.rot);
    addPiece('nuotio',c.x,terrainH(c.x,c.z),c.z,0,undefined,{fuel:0,burn:0});
    const [lx,lz]=fw(1.6,1.4);addPiece('palkki',lx,terrainH(lx,lz)+.2,lz,(c.rot+2)%8);}}

/* ---------------- KIVIRÖYKKIÖT (v1.03, käyttäjän pyyntö) ---------------- */
// Perinteiset avoimet kivikasat, joissa arkku näkyy (v0.98:n tyyli): kivirengas kahdella vastakkaisella kulkuaukolla, matala laatta ja arkku
// keskellä. 2 per kartta, sijoitus kasvillisuuden jälkeen (kuten leirit) → ei muuta maisemaa eikä tallennuksia. Saalis vaatimattomampi kuin
// arkkukivilinnakkeissa. LOC.kiviN = "Kiviröykkiö" (löytyy 30 m:stä, merkki kartalle).
const STASHES=(function(){const r=mulberry32(24680+MAP_ID*104729),out=[],tmp=[];
  for(let t=0;t<8000&&out.length<2;t++){const loose=t>=4000,x=(r()-.5)*HALF*1.6,z=(r()-.5)*HALF*1.6,h=terrainH(x,z);if(h<1.5||h>(loose?30:22))continue;
    const b=biomeAt(x,z,h);if(['sea','beach','peak'].includes(b))continue;
    let flat=true;for(const [ox,oz] of [[4,0],[-4,0],[0,4],[0,-4]])if(Math.abs(terrainH(x+ox,z+oz)-h)>(loose?1.2:.8))flat=false;if(!flat)continue;
    let far=true;for(const k in LOC){const L=LOC[k];if(dist2(x,z,L.x,L.z)<(loose?35:55)**2){far=false;break;}}for(const c of out)if(dist2(x,z,c.x,c.z)<100*100)far=false;if(!far)continue;
    nodesNear(x,z,5.5,tmp);if(tmp.some(o=>o.alive&&(o.def.kind==='tree'||o.def.kind==='rock')))continue;
    const k='kivi'+(out.length+1);LOC[k]={x,z,name:'Kiviröykkiö',kind:'stash'};out.push({k,x,z,y:h});}
  for(const c of out){const y=c.y,rr=mulberry32((c.x*31^c.z*17)|0),gap=rr()*TAU,inGap=a=>{for(const g0 of [gap,gap+Math.PI]){const da=Math.abs(((a-g0)%TAU+TAU+Math.PI)%TAU-Math.PI);if(da<.8)return true;}return false;};
    const n=7;for(let i=0;i<n;i++){const a=i/n*TAU+rr()*.3,w=1.4+rr()*1.1,hh=1.3+rr()*1.8,d=2.3+w*.6+rr()*.6;if(inGap(a))continue;const x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d;
      const m=stoneBox(w,hh,w*(.7+rr()*.4),x,y+hh/2-.2,z,a+Math.PI/2+(rr()-.5)*.4,mat(rockC(0x6f6c66,rr())));m.add(bx(w*.9,.22,w*.8,mossM,0,hh/2,0,false));}
    stoneBox(2,.45,2,c.x,y,c.z,.3,mat(0x5b5853),false);const ch=makeChest('wood',.9,.62,.6);ch.position.set(c.x,y+.22,c.z);statics.add(ch);
    const key='stash:'+c.k,loot=[[['kupari',2],['nuolet',10],['liha',2]],[['pihka',3],['kivi',8],['luu',3]]][out.indexOf(c)%2];
    interactables.push({x:c.x,y:y+.6,z:c.z,r:2.6,label:()=>foundEmpty(key)?'Arkku (tyhjä)':'Avaa arkku',use:()=>{const first=!fo('fc')[key];openFound(key,'Kiviröykkiön arkku',loot);if(first)addXp(20,'Kiviröykkiö tutkittu');}});}
  return out;})();

/* ---------------- MAAILMAN SAALIS JA ARVOESINEET (v1.34, lista 3 kohdat 8, 9, 38, 40) ---------------- */
// Maailman arkut (pääsaari + Hautakummun kirstut). Uuden maailman luonnissa (planLoot) arkkujen tavalliset tavarat sekoitetaan
// arkkujen kesken ja Jääavain arvotaan yhteen arkkuun (v2.62: ei Hautakummun kirstuihin; ennen kävi myös kirstu). Suunnitelma: flags.wl = {avain: [[id,n],…]},
// avaimen paikka flags.wl._key. openFound käyttää suunnitelmaa ensimmäisellä avauksella (wlLoot).
const SARC_LOOT=[[['hiidenkivi',1],['kupari',2]],[['hiidenkivi',1],['nuolet',12]],[['kupari',3],['luu',3]]];   // v2.62: 2 hiidenkiveä (tasan 9, ks. HK_PLAN)
function worldChests(){const out=[];
  for(const k of ['ruinF','ruinM','ruinC'])out.push({key:'ruin:'+k,L:LOC[k],loot:Object.entries(RUIN_LOOT[k])});
  for(const k of SITE_KEYS)if(LOC[k].kind==='ruin'||LOC[k].kind==='rock')out.push({key:'poi:'+k,L:LOC[k],loot:POI_LOOT[k]||[['kupari',3]]});
  STASHES.forEach((c,i)=>out.push({key:'stash:'+c.k,L:LOC[c.k],loot:[[['kupari',2],['nuolet',10],['liha',2]],[['pihka',3],['kivi',8],['luu',3]]][i%2]}));
  for(let i=0;i<3;i++)out.push({key:'sarc:'+i,L:LOC.barrow,loot:SARC_LOOT[i],barrow:1});
  return out;}
function planLoot(old){const fc=fo('fc'),W=worldChests().filter(c=>!fc[c.key]),pool=[];let key=false;
  for(const c of W)for(const [id,n] of c.loot){if(id==='jaaavain'){key=true;continue;}pool.push([id,+n]);}
  if(!old)key=true;else if(fc['poi:poiR1']||!portalLocked('portal1')||invCount('jaaavain')>0)key=false;
  for(let i=pool.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[pool[i],pool[j]]=[pool[j],pool[i]];}
  const wl={};for(const c of W)wl[c.key]=[];pool.forEach((e,i)=>{const c=W[i%W.length];const ex=wl[c.key].find(x=>x[0]===e[0]);if(ex)ex[1]+=e[1];else wl[c.key].push(e);});
  const KW=W.filter(c=>!c.barrow);   // v2.62 Jääavain vain tavallisiin maailman arkkuihin (ei Hautakummun kirstuihin)
  if(key&&KW.length){const c=KW[Math.random()*KW.length|0];wl[c.key].unshift(['jaaavain',1]);wl._key=c.key;}
  flags.wl=wl;}
function wlLoot(key,def){const wl=flags.wl;return wl&&wl[key]?wl[key]:def;}
const chestLoc=key=>{const c=worldChests().find(c=>c.key===key);return c?c.L:null;};
// Epämääräinen suunta (vain ilmansuunta, ei matkaa)
function vagueDir(from,to){const a=Math.atan2(to.x-from.x,-(to.z-from.z));return DIRS[((Math.round(a/(Math.PI/4))%8)+8)%8];}
function keyHint(){const k=(flags.vloc&&flags.vloc.jaaavain)||(flags.wl&&flags.wl._key),L=k&&chestLoc(k),from=LOC.portal1;
  if(!L)return 'Jääavain on kätketty jonnekin saaren vanhaan arkkuun.';return `Jääavain on kätketty vanhaan arkkuun jonnekin ${vagueDir(from,L)} täältä${k.startsWith('sarc')?' – kuolleiden lepopaikkaan':''}.`;}

// Arvoesineen siirto satunnaiseen pääsaaren arkkuun (ei Hautakummun kirstuihin). Avattuun arkkuun lisätään vapaaseen paikkaan,
// avaamattomaan suunnitelmaan. Avaimen uusi paikka muistetaan vihjettä varten (flags.vloc).
/* v2.62 (käyttäjän sääntö): hukattu arvoesine siirtyy sinne, mistä sen normaalistikin löytää (VAL_HOME): ulottuvuuspomon esine saman
   ulottuvuuden arkkuun (vain jos siellä on jo käyty), Kalmon sinetti Hautakummun kirstuun, muut tavallisiin maailman arkkuihin.
   Avaamattomaan ulottuvuuden arkkuun lisäys flags.xadd[avain] (openFound lisää), avattuun vapaaseen paikkaan. */
const VAL_HOME={sinetti:'barrow',luuavain:'portal1',aarniavain:'portal2',kruunusirpale:'portal3'};
const REALM_GEN={portal1:'Routaluolan',portal2:'Kalmankammion',portal3:'Aarnihaudan'};
function chestPut(fc,key,id,n,q){const it=fc[key];for(let i=0;i<it.length;i++)if(!it[i]){it[i]={id,n,q:q||1};return true;}if(it.length<16){it.push({id,n,q:q||1});return true;}return false;}
function realmChestN(realm){const c=fo('rnc')[realm];if(c)return c;try{return ensureRealm(realm).nChest|0;}catch(e){return 0;}}
function relocateRealm(id,n,q,realm){if(!fo('rs')[realm])return false;const N=realmChestN(realm);if(!N)return false;const fc=fo('fc');
  for(let t=0;t<40;t++){const key=realm+':'+(Math.random()*N|0);let ok=false;if(fc[key])ok=chestPut(fc,key,id,n,q);else{(fo('xadd')[key]=fo('xadd')[key]||[]).push([id,n,q||1]);ok=true;}
    if(ok){fo('vloc')[id]=key;msg(`${ITEMS[id].n} on hukattu – sen voi löytää jostain ${REALM_GEN[realm]} arkusta.`,'warn');return true;}}return false;}
function relocateValuable(id,n,q){const home=VAL_HOME[id];if(home&&home!=='barrow'&&relocateRealm(id,n,q,home))return;
  if(!flags.wl)planLoot(true);const fc=fo('fc'),bar=home==='barrow',C=worldChests().filter(c=>bar?c.barrow:!c.barrow);
  for(let t=0;t<40&&n>0;t++){const c=C[Math.random()*C.length|0];
    if(fc[c.key]){if(chestPut(fc,c.key,id,n,q))n=0;}
    else{(flags.wl[c.key]=flags.wl[c.key]||[]).push([id,n,q||1]);n=0;}
    if(n===0){fo('vloc')[id]=c.key;msg(bar?`${ITEMS[id].n} on hukattu – se on palannut kuolleiden luo, johonkin Hautakummun kirstuun.`:`${ITEMS[id].n} on hukattu – sen voi löytää jostain saaren vanhasta arkusta.`,'warn');}}}
// Kaikkialla olevien kappaleiden määrä (reppu, arkut, rakennetut säiliöt, haudat, maassa, avaamattomien arkkujen suunnitelma).
function countAll(id){let n=0;const add=a=>{for(const s of a||[])if(s&&s.id===id)n+=s.n;};add(inv);for(const k in fo('fc'))add(fo('fc')[k]);
  for(const p of pieces)if(p.data&&p.data.items)add(p.data.items);for(const g of graves)add(g.items);for(const d of drops)if(d.id===id)n+=d.n;
  if(flags.wl)for(const k in flags.wl){if(k==='_key'||fo('fc')[k])continue;for(const e of flags.wl[k])if(e[0]===id)n+=+e[1];}
  if(flags.xadd)for(const k in flags.xadd){if(fo('fc')[k])continue;for(const e of flags.xadd[k])if(e[0]===id)n+=+e[1];}return n;}   // v2.62 ulottuvuuksien arkkuihin odottavat
// Uniikkien esineiden laskenta: jos jokin on kadonnut (esim. virheen takia), puuttuvat palautetaan arkkuun. Odotettu määrä pelin tilasta.
function expectedUnique(id){const rb=fo('rb'),rl=fo('rl'),rs=fo('rs');
  if(id==='jaaavain')return rl.portal1||rs.portal1||lockOpen('portal1','jaaavain')?0:1;
  if(id==='sinetti')return !flags.sinetti||rl.portal1||rs.portal1||lockOpen('portal1','sinetti')?0:1;   // v2.62
  if(id==='luuavain')return rb.portal1&&!rl.portal2&&!rs.portal2?1:0;
  if(id==='aarniavain')return rb.portal2&&!rl.portal3&&!rs.portal3?1:0;
  if(id==='kruunusirpale'){if(flags.boss||boss||flags.altarSt)return 0;let pend=rb.portal3?0:1;const sc=flags.sirpC;pend+=sc?sc.filter(i=>!fo('rc')['portal3:'+i]).length:2;return Math.max(0,3-pend);}
  if(id==='sydan')return Math.max(0,(flags.boss?1:0)-countAll('hiidenmiekka'));
  return 0;}
let censusT=20;
function valuableCensus(dt){censusT-=dt;if(censusT>0||state!=='play')return;censusT=15;
  for(const id of ['jaaavain','sinetti','luuavain','aarniavain','kruunusirpale','sydan']){const miss=expectedUnique(id)-countAll(id);if(miss>0)relocateValuable(id,miss,1);}}

/* ---------------- KYLTIT (v1.34, kohta 40) ---------------- */
// Kaksi puukylttiä tienvarressa; teksti luetaan läheltä (E). Kryptinen vihje: 1) Jääavaimen arkun suunta, 2) kiviröykkiön suunta.
const SUNDIR=['pohjantähden alle','aamuruskon ja pohjan väliin','auringon nousuun','aamupäivän aurinkoon','keskipäivän aurinkoon','iltapäivän varjoihin','auringon laskuun','illan ja pohjan väliin'];
function poeticDir(from,to){const a=Math.atan2(to.x-from.x,-(to.z-from.z));return SUNDIR[((Math.round(a/(Math.PI/4))%8)+8)%8];}
const SIGNS=(function(){const r=mulberry32(4242+MAP_ID*7717),out=[];
  for(let t=0;t<6000&&out.length<2;t++){const a=r()*TAU,d=50+r()*(out.length?170:90),x=LOC.spawn.x+Math.sin(a)*d,z=LOC.spawn.z+Math.cos(a)*d,h=terrainH(x,z);
    if(h<1.5||h>26||Math.abs(x)>HALF*.9||Math.abs(z)>HALF*.9)continue;let far=true;for(const k in LOC)if(dist2(x,z,LOC[k].x,LOC[k].z)<25*25){far=false;break;}
    for(const s of out)if(dist2(x,z,s.x,s.z)<80*80)far=false;if(!far)continue;out.push({x,z,y:h,i:out.length});}
  const TXT=[s=>{const k=(flags.vloc&&flags.vloc.jaaavain)||(flags.wl&&flags.wl._key),L=k&&chestLoc(k);
      return L?`”Kylmä hammas nukkuu puisessa suussa. Kulje ${poeticDir(s,L)}, kunnes kivet muistavat vanhat nimensä${k.startsWith('sarc')?' ja kuolleet hengittävät hiljaa ympärilläsi':''}. Älä herätä vartijaa, joka ei nuku.”`:'”Kylmä hammas on jo löytänyt suunsa. Tämä polku on kuljettu.”';},
    s=>{const c=STASHES[0];return c?`”Seitsemän kiveä seisoo piirissä, kaksi ovea auki tuulelle. Ne vartioivat vaatimatonta aarretta ${poeticDir(s,c)}. Suurempi aarre ei ole kultaa vaan kylmää vihreää valoa syvällä metsän alla.”`:'”Tuuli tietää tien.”';}];
  for(const s of out){const wood=mat(0x6e4a28),dark=mat(0x4a2e18),a=r()*TAU,g=new THREE.Group();
    g.add(bx(.12,1.6,.12,dark,0,.8,0),bx(.95,.5,.06,wood,0,1.35,.06),bx(1.01,.06,.08,dark,0,1.62,.06),bx(1.01,.06,.08,dark,0,1.08,.06));
    for(let j=0;j<4;j++)g.add(bx(.08+j%2*.06,.035,.01,mat(0x2a1a0c),-.28+j*.18,1.38+(j%2?.06:-.04),.1,false));   // kaiverretut merkit
    g.position.set(s.x,s.y,s.z);g.rotation.y=a;statics.add(g);addCircle(s.x,s.z,.12,s.y,s.y+1.6,'static');
    interactables.push({x:s.x,y:s.y+1.2,z:s.z,r:2.6,label:()=>'Lue kyltti',use:()=>showLore('Vanha kyltti',TXT[s.i](s))});}
  return out;})();

/* ---------------- AVAIMEN KÄTKIJÄ (v2.62, käyttäjän idea) ---------------- */
// Näyttävä riimukivi korkealla vuorella. Ei näy kartalla ennen kuin siellä on käyty (25 m). Kertoo aina seuraavan pelin etenemiseen
// tarvittavan avaimen tai esineen paikan runollisesti mutta ymmärrettävästi (keeperHint). Vihje päivittyy pelitilanteen mukaan; jos
// edistymisestä on kulunut KEEPER_T s (15 min), vihje tarkentuu (taso 2) ja tulee ilmoitus. Sijainti valitaan kasvillisuuden jälkeen
// (kuten leirit) → maisema ja vanhat tallennukset eivät muutu. Kartalle ei koskaan merkitä avaimen arkkua.
const KEEPER_T=900;
(function(){const tmp=[];let best=null,bs=-1e9;
  for(let iz=-40;iz<=40;iz++)for(let ix=-40;ix<=40;ix++){const x=ix*HALF*.85/40,z=iz*HALF*.85/40,h=terrainH(x,z);if(h<12)continue;
    let lo=h,hi=h;for(let a=0;a<8;a++){const hh=terrainH(x+Math.cos(a*.785)*4,z+Math.sin(a*.785)*4);lo=Math.min(lo,hh);hi=Math.max(hi,hh);}
    const sl=hi-lo;if(sl>3.2)continue;let far=true;for(const k in LOC){const L=LOC[k];if(dist2(x,z,L.x,L.z)<40*40){far=false;break;}}if(!far)continue;
    nodesNear(x,z,4.5,tmp);if(tmp.some(o=>o.alive&&(o.def.kind==='tree'||o.def.kind==='rock')))continue;
    const sc=h-sl*4;if(sc>bs){bs=sc;best={x,z};}}
  if(!best){let hb=-1e9;for(let iz=-30;iz<=30;iz++)for(let ix=-30;ix<=30;ix++){const x=ix*HALF*.8/30,z=iz*HALF*.8/30,h=terrainH(x,z);if(h>hb){hb=h;best={x,z};}}}
  LOC.runeK={x:best.x,z:best.z,name:'Avaimen kätkijä',kind:'keeper'};})();
// malli: tumma 4 m kivipaasi hehkuvine riimuineen, viisi pienempää kiveä kehänä, leijuva kristalli ja violetti valo
const KEEPER={fx:null};
(function(){const L=LOC.runeK,y=terrainH(L.x,L.z),r=mulberry32(7331+MAP_ID*31),gl=new THREE.MeshBasicMaterial({color:0xb89aff});
  const me=stoneBox(1.25,4.2,.75,L.x,y+1.9,L.z,r()*3,mat(0x3e3a46));for(const [sx,sz,ry] of [[0,.39,0],[0,-.39,Math.PI]])for(let i=0;i<4;i++){const g=bx(.22+(i%2)*.12,.34,.02,gl,(i%2?.18:-.16),-.9+i*.75,sz,false);g.rotation.y=ry;me.add(g);}
  me.add(bx(1.32,.25,.82,mossM,0,2.05,0,false));
  for(let i=0;i<5;i++){const a=i/5*TAU+r()*.3,d=3.4,x=L.x+Math.cos(a)*d,z=L.z+Math.sin(a)*d,h=1+r()*.9,s=stoneBox(.55,h,.45,x,terrainH(x,z)+h/2-.15,z,a,mat(0x55505c));s.add(bx(.2,.2,.02,gl,0,h*.15,.23,false));}
  const cr=new THREE.Mesh(new THREE.OctahedronGeometry(.32,0),new THREE.MeshBasicMaterial({color:0xd8c8ff,transparent:true,opacity:.85}));cr.position.set(L.x,y+4.85,L.z);statics.add(cr);KEEPER.fx=cr;KEEPER.y=y+4.85;
  lightSources.push({x:L.x,y:y+4.6,z:L.z,c:0xb89aff,i:1.6,on:()=>true});
  interactables.push({x:L.x,y:y+1.2,z:L.z,r:2.8,label:()=>'Lue riimukivi – Avaimen kätkijä',use:()=>{const h=keeperHint();showLore('Avaimen kätkijä',h.txt);flags.runes.runeK=1;flags.kpRead=h.sig+'|'+h.tier;
    if(!flags.disc.runeK){flags.disc.runeK=1;msg('Löysit paikan: Avaimen kätkijä','loot');}}});})();
const ylimysDead=()=>{const i=dunSpawns.findIndex(s=>s.type==='ylimys');return i>=0&&!!dunKilled[i];};
function sinettiHint(){return 'Kalmon sinettiä kantaa Hautakummun ylimys – se hohtaa sen vyöllä haudan pimeydessä.';}
const placeWord=k=>!k?'vanhassa':k.startsWith('stash:')?'kiviröykkiön':k.startsWith('poi:poiK')?'kivilinnakkeen':k.startsWith('sarc')?'kuolleiden':'raunioiden';
function keeperHint(){const K=LOC.runeK,rb=fo('rb'),T=flags.kpT==null?playTime:flags.kpT,tier=playTime-T>=KEEPER_T?2:1,pd=k=>poeticDir(K,LOC[k]),out=[];let sig;
  const far=L=>`noin ${Math.max(50,Math.round(Math.hypot(L.x-K.x,L.z-K.z)/50)*50)} m päässä`;
  if(portalLocked('portal1')){sig='A';
    if(!lockOpen('portal1','sinetti')&&invCount('sinetti')<1){sig+='s';const v=flags.vloc&&flags.vloc.sinetti;
      out.push(v&&flags.sinetti?'”Kalmon sinetti on palannut kuolleiden luo – se lepää jälleen jossain Hautakummun kirstuista.”'
        :`”Kuolleiden ylimys kantaa vyöllään luista sinettiä. Kulje ${pd('barrow')}: siellä nummen sumun alla nukkuu hänen kumpunsa.”`+(tier>1?' Laskeudu Hautakummun pimeyteen tuli kädessä: ylimys vartioi syvintä salia, ja sinetti hohtaa violettina hänen vyöllään.':''));}
    if(!lockOpen('portal1','jaaavain')&&invCount('jaaavain')<1){sig+='j';const k=(flags.vloc&&flags.vloc.jaaavain)||(flags.wl&&flags.wl._key),L=k&&chestLoc(k);
      out.push(L?`”Kylmä hammas nukkuu ${placeWord(k)} arkussa. Kulje ${poeticDir(K,L)}, kunnes kivet muistavat vanhat nimensä.”`+(tier>1?` Etsi ${placeWord(k)} arkkua – se on ${far(L)} täältä.`:''):'”Kylmä hammas on jo löytänyt tiensä. Katso, mitä kannat mukanasi.”');}
    if(!out.length)out.push(`”Jää ja kalma ovat käsissäsi. Kulje ${pd('portal1')} Routaportille – kaksi lukkoa odottaa.”`);}
  else if(!rb.portal1){sig='B';out.push('”Routaluolan sokkelon perimmäisessä kammiossa Jäätär puristaa luista avainta.”'+(tier>1?' Sokkelo kiertää, mutta kammio on kaukana sisäänkäynnistä – seuraa kylmintä henkäystä.':''));}
  else if(portalLocked('portal2')){sig='C';out.push(invCount('luuavain')>0?`”Luinen avain kaipaa kalman porttia. Kulje ${pd('portal2')}.”`:'”Luuavain lepää yhä Routaluolassa – Jäättären jäljillä tai jossain sen arkuista.”');}
  else if(!rb.portal2){sig='D';out.push('”Kalmankammion kirstujen keskellä Kalmaherra kantaa vihreää avainta vyöllään.”'+(tier>1?' Salit ovat monet; herra odottaa kauimmaisessa.':''));}
  else if(portalLocked('portal3')){sig='E';out.push(invCount('aarniavain')>0?`”Vihreä avain kaipaa metsän porttia. Kulje ${pd('portal3')}, metsän pimeimpään kohtaan.”`:'”Aarniavain lepää yhä Kalmankammiossa – Kalmaherran jäljillä tai jossain sen arkuista.”');}
  else if(!rb.portal3){sig='F';out.push('”Aarnihaudan syvimmässä sopessa Aarnihirviö kantaa kruunun sirpaletta.”'+(tier>1?' Juuret kiertävät luolaa; hirviö odottaa siellä, minne valo ei yllä.':''));}
  else if(!flags.altarSt&&!(flags.boss||boss)){const n=invCount('kruunusirpale');sig='G'+n;
    out.push(n>=3?`”Kolme sirpaletta kaipaa Kalmankehän alttaria. Kulje ${pd('circle')}.”`:`”Kalmankruunun sirpaleita kannat ${n}/3. Loput lepäävät Aarnihaudan arkuissa.”`+(tier>1?' Avaa jokainen arkku – kaksi sirpaletta on kätketty niihin.':''));}
  else if(!flags.boss){sig='H';out.push(`”Kalmanvartija on herännyt Kalmankehässä. Kulje ${pd('circle')} ja kaada hänet, niin saari vapautuu.”`);}
  else{sig='I';out.push('”Kalmanvartija on kaatunut. Kätköt ovat tyhjiä – paitsi yhdeksän hiidenkiveä, joita saari yhä vartioi.”');}
  return {sig,tier,txt:out.join(' ')};}
// 15 min ilman edistymistä → vihje tarkentuu ja ilmoitus (kerran vaihetta kohden)
function keeperTick(){if(state!=='play')return;if(flags.kpT==null)flags.kpT=playTime;const h0=keeperHint(),s=h0.sig;
  if(s!==flags.kpS){flags.kpS=s;flags.kpT=playTime;flags.kpN=0;return;}
  if(!flags.kpN&&playTime-flags.kpT>=KEEPER_T&&s!=='I'){flags.kpN=1;msg(flags.disc.runeK?'Avaimen kätkijä -riimukivi antaa uuden vihjeen…':'Tuulet kuiskaavat vuorella seisovasta kivestä, joka muistaa kaikki kätköt…','loot');}
  if(!flags.disc.runeK&&!P.inDun&&dist2(LOC.runeK.x,LOC.runeK.z,P.pos.x,P.pos.z)<25*25){flags.disc.runeK=1;msg('Löysit paikan: Avaimen kätkijä','loot');}}
