/* Hiidenmaa – fish.js
   v3.06 ONKIMINEN (käyttäjä). Ladataan smelt.js:n jälkeen. Kalat ja esineet: FISH_DEF + ITEMS (items.js).
   VEDET: kartta jaetaan 4 m ruutuihin; yhtenäiset vesialueet (syvyys > 0,45 m) etsitään täytöllä. Reunaa koskettava = meri (3 nimettyä aluetta,
   lähimmän nimipisteen mukaan), muut = järvet/lammet (vähintään 5 ruutua); suolla (biomi suo) = suolampi. Jokainen nimetään kalalajin mukaan
   (seed): Haukijärvi, Ahvenlampi, Silakkalahti, Ruutanalampi… Nimi näkyy kartalla, kun vesi on löydetty, ja hienovaraisesti rantaan tultaessa.
   ONKI: vasen heittää katsottuun veteen (3–16 m). Tärppiväli 1–5 min × vapa (kupari −20 %, hiiden −35 %) × syötti (mato −25 %) × lajien aktiivisuus
   (aika ja sää), vähintään 30 s. Tärppi: ~0,6 s ikkuna vasemmalle. Iso kala: väsytys – pidä vasenta (kelaa), päästä kun siima kiristyy (jännitys).
   Muut saaliit: saapas 3 %, pulloposti 1,5 % (vihje upponeeseen arkkuun), ruostunut avain 1 % (3 % kun arkku tiedossa), hiidenkiven siru 1,5 %,
   rautaharkko 1 %, kupariharkko 2 %. Syötti voi kadota ilman saalista. Kalastajan kirja: lajit, ennätykset, vedet, ajat, tavoitteet (XP). */
'use strict';
const FISH_B={   // w: vesi, b: perusyleisyys, kg: paino, t: [aamu, päivä, ilta, yö], wx: sää, big: väsytys
  ahven:{w:'lake',b:5,kg:[.08,.7],t:[1,1.3,1,.5],wx:{}},
  hauki:{w:'lake',b:2,kg:[.8,9],t:[1.8,.8,1.8,.4],wx:{pilvi:1.5,tihku:1.4,sade:1.2,selkea:.8},big:1},
  lahna:{w:'lake',b:3,kg:[.5,4],t:[1,.6,1.4,1.6],wx:{sade:1.5,tihku:1.3},big:1},
  silakka:{w:'sea',b:6,kg:[.04,.25],t:[1.1,1.3,1,.6],wx:{}},
  turska:{w:'sea',b:3,kg:[.8,7],t:[1.2,.7,1,1.6],wx:{myrsky:2,sade:1.4,tuuli:1.3},big:1},
  lohi:{w:'sea',b:.6,kg:[2,13],t:[2,.5,1.3,.4],wx:{sade:2,tihku:1.6,myrsky:1.3,selkea:.6},big:1},
  ruutana:{w:'bog',b:5,kg:[.1,.9],t:[1,1.4,1,.6],wx:{selkea:1.4,sade:.7}},
  suonsilma:{w:'bog',b:1.2,kg:[.2,1.4],t:[.3,0,1,3],wx:{sumu:2.5,selkea:.8},big:1},
  /* v3.08 käyttäjä: 10 uutta lajia (järvet 6, meri 3, suo 1); vesien nimet pysyvät ennallaan (WB_LAKE/WB_SEAN-arvonta ei muutu) */
  kuha:{w:'lake',b:1.5,kg:[.4,6],t:[1.5,.5,1.8,1.4],wx:{pilvi:1.4,tihku:1.3,selkea:.7},big:1},
  made:{w:'lake',b:.8,kg:[.3,3],t:[.2,.1,.8,3],wx:{sade:1.3,myrsky:1.4,sumu:1.2,lumi:1.5},big:1},
  muikku:{w:'lake',b:5,kg:[.02,.12],t:[1,1.2,1.3,.8],wx:{}},
  sarki:{w:'lake',b:6,kg:[.05,.5],t:[1.2,1.3,1,.4],wx:{selkea:1.1}},
  kiiski:{w:'lake',b:3,kg:[.02,.15],t:[1,1,1,1],wx:{pilvi:1.2}},
  toutain:{w:'lake',b:.7,kg:[1,8],t:[1.2,1.4,1,.4],wx:{selkea:1.3},big:1},
  siika:{w:'sea',b:2,kg:[.3,3],t:[1.4,1,1,.6],wx:{tuuli:1.2}},
  kampela:{w:'sea',b:2.5,kg:[.2,1.5],t:[.8,1.2,1,.8],wx:{}},
  meritaimen:{w:'sea',b:.8,kg:[1,10],t:[1.8,.6,1.4,.6],wx:{sade:1.5,tihku:1.3,tuuli:1.2},big:1},
  suutari:{w:'bog',b:2,kg:[.3,2.5],t:[1,.8,1.3,1.2],wx:{sade:1.3,pilvi:1.2},big:1}};
/* v3.27 käyttäjä: SYVYYS. Syötin syvyys (ongen kohon säätö 0–2 m pöydällä, rig.fd) tai vieheen syvyys (FS.ld) vaikuttaa lajeihin.
   'b' = pohjakala: syötti pohjassa ×1,8, irti pohjasta ×0,35 (syvällä ×0,6). [a,b] = viihtyy a–b m syvyydellä: sisällä ×1,4, ulkona −1,2 / m (vähintään ×0,3);
   pohjassa makaava syötti ×0,8 muille kuin pohjakaloille. */
const FISH_Z={ahven:[.5,2],hauki:[.2,1.5],lahna:'b',silakka:[.8,2],turska:'b',lohi:[.3,1.5],ruutana:[.2,1.2],suonsilma:[0,.6],kuha:'b',made:'b',muikku:[1,2],sarki:[.2,1.2],
  kiiski:'b',toutain:[0,.8],siika:[1,2],kampela:'b',meritaimen:[0,1.2],suutari:'b'};
function fishDepthK(sp,d,bot){const Z=FISH_Z[sp];if(!Z||d==null)return 1;if(Z==='b')return bot?1.8:d>1.4?.6:.35;const o=d<Z[0]?Z[0]-d:d>Z[1]?d-Z[1]:0;return Math.max(.3,1.4-o*1.2)*(bot?.8:1);}
function fishDepthText(sp){const Z=FISH_Z[sp];return !Z?'kaikki syvyydet':Z==='b'?'pohjan tuntumassa (syötti pohjassa)':`${String(Z[0]).replace('.',',')}–${String(Z[1]).replace('.',',')} m syvyydellä`;}
// syvyyden sopivuus kaikille vedessä viihtyville lajeille (tärppiväli): painotettu keskiarvo, ×0,4–1,4
function fishDepthFit(wb,bd){let a=0,t=0;for(const sp in FISH_B){const w=fishW(sp,wb);if(!w)continue;t+=w;a+=w*fishDepthK(sp,bd.d,bd.bot);}return t?clamp(a/t,.4,1.4):1;}
const FISH_PH=['aamulla','päivällä','illalla','yöllä'],FISH_WXN={selkea:'selkeällä',pilvi:'pilvisellä',tuuli:'tuulella',tihku:'tihkusateella',sade:'sateella',myrsky:'myrskyllä',sumu:'sumussa',lumi:'lumisateella'};
const FISH_REL_K=.9,FISH_WAIT=[60,300],FISH_MIN=30,FISH_BAIT_K=.75,FISH_WIN=.6,FISH_CAST=[3,16],FISH_NAME_K=1.6,FISH_STEAL=.08,FISH_KEEP_R=5;
const ROD_LEN=2.05;   // vavan pituus (models.js)
// v3.29 käyttäjä: onki 2,6 m, muut vavat +0,3 m (2,35 m) – nosto riittää kalan saamiseen vedestä
const ROD_LENS={onki:2.6,kuparivapa:2.35,hiidenvapa:2.35},rodLen=id=>ROD_LENS[id]||ROD_LEN;
const FISH_JUNK=[['rauta',.01],['kupari',.02],['hiidensiru',.015],['saapas',.03],['pulloposti',.015],['ruostavain',.01]];
/* v3.13 KORJAUKSET 87: suolammen tunnistus kutsui biomeAt(…, 1) → korkeus < 1,1 = aina 'beach', joten suolampia ei syntynyt koskaan (ruutana, suonsilmä, suutari
   eivät olleet saatavilla). WB_BOG_H 1,3 = rannan yläpuolella mutta aarnimetsän rajan (1,6) alla. */
const WB_BOG_H=1.3,WB_BOG_MAX=200,WB_BOGG_K=.6;const WB_POND_D=-.04,WB_POND_MIN=1;   // v3.25 lampien vähimmäissyvyys ruudun keskellä ja koko (ruutuja à 16 m²)   // iso soinen järvi pysyy järvenä (nimi ennallaan), mutta siitä saa myös suokaloja (paino 0,6×)
const WB_S=4,WB_N=Math.ceil(HALF*2/WB_S),WB_ID=new Int16Array(WB_N*WB_N).fill(-1),WBS=[],WB_SEA=[];
const WB_LAKE={ahven:'Ahven',hauki:'Hauki',lahna:'Lahna',ruutana:'Ruutana',suonsilma:'Suonsilmän'},WB_SEAN={silakka:'Silakkalahti',turska:'Turskanselkä',lohi:'Lohisalmi'},WB_PRE=['','Pikku-','Iso-','Ala-','Ylä-','Musta-'];
let SUNK=null;
/* ---------------- VEDET (ladattaessa, maailman seedin mukaan) ---------------- */
(function(){const N=WB_N,wc=(i,j)=>terrainH(-HALF+(i+.5)*WB_S,-HALF+(j+.5)*WB_S)<-.45,W=new Uint8Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++)W[j*N+i]=wc(i,j)?1:0;
  const rs=mulberry32(seedMix(77123+MAP_ID*31)),comps=[];
  for(let k=0;k<N*N;k++){if(!W[k]||WB_ID[k]>=0)continue;const id=comps.length,q=[k],cells=[];WB_ID[k]=id;let edge=false;
    while(q.length){const c=q.pop(),i=c%N,j=(c/N)|0;cells.push(c);if(i===0||j===0||i===N-1||j===N-1)edge=true;
      for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(x<0||y<0||x>=N||y>=N)continue;const n=y*N+x;if(W[n]&&WB_ID[n]<0){WB_ID[n]=id;q.push(n);}}}
    comps.push({cells,edge});}
  const pos=c=>({x:-HALF+(c%N+.5)*WB_S,z:-HALF+(((c/N)|0)+.5)*WB_S}),used=new Set(),uniq=b=>{for(const p of WB_PRE){const n=p?p+b.toLowerCase():b;if(!used.has(n)){used.add(n);return n;}}return b;};
  const remap=new Int16Array(comps.length).fill(-1);
  comps.forEach((C,ci)=>{if(C.edge){remap[ci]=-2;return;}if(C.cells.length<5)return;let sx=0,sz=0,bog=0;const st=Math.max(1,Math.floor(C.cells.length/40));
    for(let k=0;k<C.cells.length;k++){const p=pos(C.cells[k]);sx+=p.x;sz+=p.z;if(k%st===0&&biomeAt(p.x,p.z,WB_BOG_H)==='suo')bog++;}
    const cx=sx/C.cells.length,cz=sz/C.cells.length;let best=C.cells[0],bd=1e18;for(const c of C.cells){const p=pos(c),d=dist2(p.x,p.z,cx,cz);if(d<bd){bd=d;best=c;}}
    const isBog=bog>=Math.ceil(C.cells.length/st)*.4,type=isBog&&C.cells.length<WB_BOG_MAX?'bog':'lake',L=type==='bog'?['ruutana','ruutana','suonsilma']:['ahven','hauki','lahna'],sp=L[Math.floor(rs()*L.length)];
    const nm=uniq(WB_LAKE[sp]+(type==='bog'||C.cells.length<45?'lampi':'järvi')),lp=pos(best);remap[ci]=WBS.length;WBS.push({id:'w'+WBS.length,name:nm,type,sp,x:lp.x,z:lp.z,n:C.cells.length,bogg:isBog&&type==='lake'?1:0});});
  // meri: kolme nimettyä aluetta rannikolla (ensimmäinen lähimpänä aloitusta), kauimmaisen pisteen valinnalla
  const coast=[];for(let k=0;k<N*N;k++){if(!W[k]||remap[WB_ID[k]]!==-2)continue;const i=k%N,j=(k/N)|0;if(i<2||j<2||i>N-3||j>N-3)continue;let land=false;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(!W[(j+b)*N+i+a])land=true;if(land)coast.push(k);}
  if(coast.length){const S0=LOC.spawn,pts=[];let b=coast[0],bd=1e18;for(const c of coast){const p=pos(c),d=dist2(p.x,p.z,S0.x,S0.z);if(d<bd){bd=d;b=c;}}pts.push(pos(b));
    while(pts.length<3){let bb=null,bdd=-1;for(let k=0;k<coast.length;k+=3){const p=pos(coast[k]);let m=1e18;for(const q of pts)m=Math.min(m,dist2(p.x,p.z,q.x,q.z));if(m>bdd){bdd=m;bb=p;}}if(!bb)break;pts.push(bb);}
    const sps=['silakka','turska','lohi'];for(let i=sps.length-1;i>0;i--){const j=Math.floor(rs()*(i+1));[sps[i],sps[j]]=[sps[j],sps[i]];}
    const seaAt=(x,z)=>{const i=Math.floor((x+HALF)/WB_S),j=Math.floor((z+HALF)/WB_S);return i>=0&&j>=0&&i<N&&j<N&&W[j*N+i]&&!(WB_ID[j*N+i]>=0&&remap[WB_ID[j*N+i]]!==-2);};
    const off=p=>{const L=Math.hypot(p.x,p.z)||1,dx=p.x/L,dz=p.z/L;let q={x:p.x,z:p.z};for(let k=0;k<14;k++){const x=q.x+dx*WB_S,z=q.z+dz*WB_S;if(!seaAt(x,z))break;q={x,z};let ok=true;for(let a=0;a<8&&ok;a++)if(!seaAt(q.x+Math.cos(a/8*TAU)*14,q.z+Math.sin(a/8*TAU)*14))ok=false;if(ok&&k>=2)break;}return q;};   // v3.08 nimi veden päälle (ei rannalle)
    pts.forEach((p0,i)=>{const p=off(p0),sp=sps[i%3],o={id:'s'+i,name:uniq(WB_SEAN[sp]),type:'sea',sp,x:p.x,z:p.z,n:0};WB_SEA.push(o);WBS.push(o);});}
  for(let k=0;k<N*N;k++)if(WB_ID[k]>=0)WB_ID[k]=remap[WB_ID[k]];
  // UPPONUT ARKKU: luodolla (pieni maa-alue veden keskellä) tai rannalla, yli 120 m aloituksesta
  {const lid=new Int32Array(N*N).fill(-1),isl=[];let n=0;for(let k=0;k<N*N;k++){if(W[k]||lid[k]>=0)continue;const q=[k],cells=[];lid[k]=n;let edge=false;
      while(q.length){const c=q.pop(),i=c%N,j=(c/N)|0;cells.push(c);if(i===0||j===0||i===N-1||j===N-1)edge=true;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(x<0||y<0||x>=N||y>=N)continue;const m=y*N+x;if(!W[m]&&lid[m]<0){lid[m]=n;q.push(m);}}}
      if(!edge&&cells.length>=2&&cells.length<160)isl.push(cells);n++;}
    const S0=LOC.spawn,okP=p=>dist2(p.x,p.z,S0.x,S0.z)>120*120&&!siteBlocked(p.x,p.z)&&terrainH(p.x,p.z)>.05&&terrainH(p.x,p.z)<1.2;let pick=null;
    for(const cells of isl.sort(()=>rs()-.5)){for(const c of cells){const p=pos(c);if(okP(p)){pick={x:p.x,z:p.z,isl:1};break;}}if(pick)break;}
    if(!pick){for(let t=0;t<4000&&!pick;t++){const k=Math.floor(rs()*N*N);if(W[k])continue;const i=k%N,j=(k/N)|0;let wn=false;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const m=(j+b)*N+i+a;if(m>=0&&m<N*N&&W[m])wn=true;}const p=pos(k);if(wn&&okP(p))pick={x:p.x,z:p.z,isl:0};}}
    SUNK=pick;}
  /* v3.25 käyttäjä: KAIKKI LAMMET NIMETÄÄN. Ennen alle 5 ruudun (80 m²) ja matalat (pohja yli −0,45 m) lammet jäivät ilman nimeä ja kalastusvettä → DEV-paljastus ei näyttänyt
     niitä. Erillinen vaihe vanhojen jälkeen (oma satunnaisjono, tunnukset p0, p1 …) → vanhojen vesien nimet ja tunnukset eivät muutu. Matala ranta nimetyn veden vieressä
     liitetään siihen; erillinen vähintään WB_POND_MIN ruudun allas on uusi lampi. */
  {const rp=mulberry32(seedMix(77125+MAP_ID*31)),sh=k=>!W[k]&&terrainH(-HALF+(k%N+.5)*WB_S,-HALF+(((k/N)|0)+.5)*WB_S)<WB_POND_D,cand=k=>W[k]&&WB_ID[k]===-1||sh(k),seen=new Uint8Array(N*N);let pn=0;
    for(let k=0;k<N*N;k++){if(seen[k]||!cand(k))continue;const q=[k],cells=[];seen[k]=1;let edge=false;const nb=new Set();
      while(q.length){const c=q.pop(),i=c%N,j=(c/N)|0;cells.push(c);if(i===0||j===0||i===N-1||j===N-1)edge=true;
        for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(x<0||y<0||x>=N||y>=N)continue;const m=y*N+x;if(WB_ID[m]>=0||WB_ID[m]===-2)nb.add(WB_ID[m]);else if(!seen[m]&&cand(m)){seen[m]=1;q.push(m);}}}
      if(nb.size===1){const id=[...nb][0];for(const c of cells)WB_ID[c]=id;continue;}   // matala ranta kuuluu viereiseen veteen
      if(edge||nb.size>1||cells.length<WB_POND_MIN)continue;
      let sx=0,sz=0,bog=0;for(const c of cells){const p=pos(c);sx+=p.x;sz+=p.z;if(biomeAt(p.x,p.z,WB_BOG_H)==='suo')bog++;}
      const cx=sx/cells.length,cz=sz/cells.length,type=bog>=cells.length*.4?'bog':'lake',L=type==='bog'?['ruutana','ruutana','suonsilma']:['ahven','hauki','lahna'],sp=L[Math.floor(rp()*L.length)];
      let best=cells[0],bd=1e18;for(const c of cells){const p=pos(c),d=dist2(p.x,p.z,cx,cz);if(d<bd){bd=d;best=c;}}const lp=pos(best),ix=WBS.length;
      WBS.push({id:'p'+pn++,name:uniq(WB_LAKE[sp]+'lampi'),type,sp,x:lp.x,z:lp.z,n:cells.length,bogg:0,pond:1});for(const c of cells)WB_ID[c]=ix;}}})();
// v3.08: onko kohta sisämaan vettä (järvi/lampi) eikä merta – ruutujen tunnukset 2 ruudun säteellä (ei Meri-aluetta järvellä)
function inlandWater(x,z){const i0=Math.floor((x+HALF)/WB_S),j0=Math.floor((z+HALF)/WB_S);let lake=false;for(let r=0;r<=4;r++){for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=i0+di,j=j0+dj;if(i<0||j<0||i>=WB_N||j>=WB_N)return false;const id=WB_ID[j*WB_N+i];if(id===-2)return false;if(id>=0)lake=true;}if(lake)return true;}return false;}
function wbAt(x,z){const i=Math.floor((x+HALF)/WB_S),j=Math.floor((z+HALF)/WB_S);if(i<0||j<0||i>=WB_N||j>=WB_N)return null;const id=WB_ID[j*WB_N+i];
  if(id>=0)return WBS[id];if(id===-2){let b=null,bd=1e18;for(const s of WB_SEA){const d=dist2(x,z,s.x,s.z);if(d<bd){bd=d;b=s;}}return b;}return null;}
const fishNow=()=>dayN+dayT;   // v3.27 pelin aika päivinä (kalan tuoreus, laatan päiväys)
function fishF(){if(!flags.fish||typeof flags.fish!=='object')flags.fish={};const F=flags.fish;F.rec=F.rec||{};F.n=F.n||{};F.wb=F.wb||{};F.g=F.g||{};return F;}
function fishPhase(){return dayT>=.19&&dayT<.3?0:dayT>=.3&&dayT<.72?1:dayT>=.72&&dayT<.83?2:3;}
// lajin todennäköisyyspaino tässä vedessä nyt (aika ja sää)
function fishW(sp,wb){const B=FISH_B[sp];if(!B||!wb)return 0;const bg=B.w==='bog'&&wb.bogg;if(B.w!==wb.type&&!bg)return 0;return (bg?WB_BOGG_K:1)*B.b*B.t[fishPhase()]*(B.wx[weather.cur]||1)*(wb.sp===sp?FISH_NAME_K:1);}
function fishPick(wb,rod,bd){const L=Object.keys(FISH_B).map(sp=>[sp,fishW(sp,wb)*(rod&&typeof tkSpK==='function'?tkSpK(sp,rod,wb):1)*(bd?fishDepthK(sp,bd.d,bd.bot):1)]).filter(a=>a[1]>0);const tot=L.reduce((a,b)=>a+b[1],0);if(!tot)return null;let r=Math.random()*tot;for(const [sp,w] of L){r-=w;if(r<=0)return sp;}return L[L.length-1][0];}
function fishActivity(wb){let a=0,b=0;for(const sp in FISH_B){const B=FISH_B[sp];if(B.w!==wb.type)continue;b+=B.b;a+=fishW(sp,wb)/(wb.sp===sp?FISH_NAME_K:1);}return b?clamp(a/b,.45,1.6):1;}
/* ---------------- ONKI ---------------- */
const FS={st:'idle',t:0,bob:null,line:null,body:null,ox:0,oz:0,bx:0,bz:0,bait:false,biteAt:0,nibAt:0,win:0,sp:null,kg:0,ten:0,prog:0,pullT:0,pullOn:false,fightT:0,wbT:0,last:null,lastT:{},kelT:0,rod:null};
function rodDef(){const w=equipped('weapon');return w&&ITEMS[w.id]&&ITEMS[w.id].cat==='rod'?(typeof rigStats==='function'?rigStats(w):ITEMS[w.id].rod):null;}   // v3.14 vavan osat (tackle.js)
function fishWaterPoint(){const {o,d}=camRay();const wy=water.position.y;if(d.y>-.02)return null;const t=(wy-o.y)/d.y;if(t<0)return null;const x=o.x+d.x*t,z=o.z+d.z*t;return {x,z,y:wy};}
/* v3.27 käyttäjä: ONGEN FYSIIKKA. Tärppi näkyy vain kohon liikkeenä (ei huutomerkkiä eikä ilmoitusta). Klikkaus nostaa siiman: jos kala on tarttunut, se nousee
   vedestä ja roikkuu ilmassa vavan kärjessä (tila 'hang'), kunnes klikkaat ja otat sen – vasta sitten voi heittää uudelleen. Ilman tärppiä nosto tuo koukun tyhjänä. */
function fishClick(){if(P.dead||state!=='play')return;const st=FS.st;   // v3.27 fysiikka (fishphys.js): kela → voiman lataus, onki → heitto heti
  if(st==='idle'){const rod=rodDef();if(rod&&rod.reel&&rod.line!==null)fpChargeStart();else fishCast(1);}
  else if(st==='wait'){if(fpOnkiSnag())return;FS.E.y=water.position.y;fpRetrStart();}else if(st==='bite'){if(fpOnkiSnag())return;fishHook();}
  else if(st==='land'&&!(FS.rod&&FS.rod.reel))fpRetrStart();else if(st==='hang')fishTake();}
function fishCast(pw){const rod=rodDef();if(!rod)return;if(P.inDun){msg('Täällä ei ole kalavettä.','warn');return;}if(P.swim){msg('Et voi onkia uidessa.','warn');return;}
  if(rod.line===null){msg('Vavassa ei ole siimaa – kiinnitä siima Kalastajan pöydällä (tai pakista kentällä, hitaasti).','warn');return;}   // v3.14
  if(typeof TKA!=='undefined'&&TKA.on){msg('Vaihdat vielä siimaa – odota tai liiku keskeyttääksesi.','warn');return;}
  if(P.stam<3){msg('Liian uupunut.','warn');return;}P.stam-=3;P.stamDelay=1;
  /* v3.27 käyttäjä: heiton voi tehdä aina ja mihin suuntaan tahansa – ballistinen lento vavan kärjestä katseen suuntaan (fishphys.js) */
  const tip=fpTip(new THREE.Vector3()),dir=camRay().d,v0=fpV0(rod.dmax||16)*(pw==null?1:pw);
  const slot=equipped('weapon');   // v3.14: mato laitetaan koukkuun E:llä (rig.bait), ei enää automaattisesti repusta
  Object.assign(FS,{st:'fly',t:0,body:null,ox:P.pos.x,oz:P.pos.z,bx:tip.x,bz:tip.z,E:{x:tip.x,y:tip.y,z:tip.z},V:{x:dir.x*v0,y:dir.y*v0,z:dir.z*v0},where:'air',noFish:false,drift:0,landM:0,fin:0,botT:0,
    bait:!rod.spin&&!!(slot.rig&&slot.rig.bait),rod,slot,spin:!!rod.spin,sp:null,ten:0,prog:0,reelT:0,tired:0,ld:0,cm:0,kelT:0});if(typeof tkWear==='function')tkWear(.25);P.yaw=camYaw+Math.PI;P.castT=playTime;   /* v3.27 oma heittoanimaatio (fishphys.js rodCastPose / virvPose), ei yleistä lyöntiä */
  if(!(FS.spin&&typeof tkSnd==='function'&&tkSnd('virveli_heitto')))plSnd('onkiminen','heitto',{v:.8});fishMeshes(true);}
function fishWaitPlan(first){const wb=FS.body,base=FISH_WAIT[0]+Math.random()*(FISH_WAIT[1]-FISH_WAIT[0]);let t=base*FS.rod.k*(FS.bait?FISH_BAIT_K:1)/fishActivity(wb);
  if(typeof fpBaitDepth==='function'&&FS.E)t/=fishDepthFit(wb,fpBaitDepth());   /* v3.27 syvyys */{const F=fishF();if(F.relB&&F.relB[wb.id]){t*=FISH_REL_K;delete F.relB[wb.id];}}   /* v3.27 vapautus: seuraava tärppi 10 % nopeammin */
  if(!first)t*=.45;if(DEV&&typeof DEVF!=='undefined'&&DEVF.fishFast)t=3;FS.biteAt=FS.t+Math.max(DEV&&DEVF.fishFast?3:FISH_MIN,t);FS.nibAt=FS.t+4+Math.random()*12;}
function fishHook(spin){FS.st='hooked';const r=Math.random();let acc=0,junk=null;const F=fishF(),have=id=>invCount(id)>0;
  if(typeof tkSnapCheck==='function'&&tkSnapCheck())return;   // v3.14 siima voi katketa iskussa (kuluminen + pieni satunnainen)
  if(!spin)for(const [id,p] of FISH_JUNK){let q=p;if(id==='pulloposti'&&(F.sunkO||F.sunkK||have('pulloposti')||!SUNK))q=0;if(id==='ruostavain'){if(F.sunkO||have('ruostavain')||!SUNK)q=0;else if(F.sunkK)q=.03;}acc+=q;if(r<acc){junk=id;break;}}
  if(junk){FS.sp=junk;FS.kg=0;FS.st='pull';fpPullStart();plSnd('onkiminen','kelaus',{v:.6});return;}
  const sp=fishPick(FS.body,FS.rod,typeof fpBaitDepth==='function'?fpBaitDepth():null)||'ahven',B=FISH_B[sp];FS.sp=sp;
  {const r=fishRoll(sp,null,FS.rod.big&&B.big?FS.rod.big:0);FS.kg=r.kg;FS.cm=r.cm;}   // v3.27 kokojakauma (v3.14 runko: isot kalat painavampia)
  if(B.big&&FS.kg>B.kg[0]+(B.kg[1]-B.kg[0])*.18){FS.st='fight';FS.ten=.15;FS.prog=.08;FS.pullT=1+Math.random();FS.pullOn=false;FS.fightT=0;msg(`Iso kala koukussa! Pidä vasenta pohjassa kelataksesi – päästä irti, kun siima kiristyy.`,'quest');fpPullStart();}
  else{FS.st='pull';fpPullStart();}plSnd('onkiminen','kelaus',{v:.6});}
function fishLoseBait(p){if(FS.bait&&Math.random()<p){FS.bait=false;return true;}return false;}
function fishReset(m,cls){if(m)msg(m,cls);if(typeof fpFishDrop==='function')fpFishDrop();if(typeof HG!=='undefined'&&HG.on)fpUnhookEnd();if(typeof tkBaitSync==='function')tkBaitSync();FS.st='idle';FS.sp=null;fishMeshes(false);fishHud();}
// v3.08 käyttäjä: vavan kärki taipuu alaspäin – levossa hieman, kääntyessä/liikkuessa heilahtaen, tärpissä nykäisten ja väsytyksessä jännityksen mukaan
const RODB={b:0,v:0,yaw:null};
function rodBendTick(dt){const h=typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.bend;if(!h||!h.length)return;const yw=camYaw,dy=RODB.yaw==null?0:Math.atan2(Math.sin(yw-RODB.yaw),Math.cos(yw-RODB.yaw));RODB.yaw=yw;
  const tg=.05+(FS.st==='fight'?.25+FS.ten*.55:0)+(FS.st==='bite'?.22:0)+(FS.dip||0)*.15+Math.min(.25,Math.hypot(P.vel.x,P.vel.z)*.012);
  RODB.v+=((tg-RODB.b)*60-RODB.v*7)*dt+Math.abs(dy)*4;RODB.b+=RODB.v*dt;RODB.b=clamp(RODB.b,-.1,.9);h[0].rotation.x=RODB.b*.35;if(h[1])h[1].rotation.x=RODB.b*.65;}
function fishTick(dt){const rod=rodDef();rodBendTick(dt);fpTick(dt);if(typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.hook){const hk=heldMesh.userData.hook;hk.visible=FS.st==='idle';if(hk.visible&&hk.parent){hk.parent.updateMatrixWorld();hk.quaternion.copy(hk.parent.getWorldQuaternion(_fsQ).invert());}}   /* v3.07 koukku roikkuu pystyyn */if(FS.st!=='idle'){FS.t+=dt;
    /* v3.27 tilat (fishphys.js): charge → fly → wait/bite | spin | land → retr | pull/fight → hang → unhook */
    if(FS.st==='hang'){if(fpHangCheck(dt))return;}
    else if(FS.st==='unhook'){fpUnhookTick(dt);if(FS.st!=='unhook')return;}
    else if(FS.st==='charge'){if(!rod||(FS.slot&&equipped('weapon')!==FS.slot)||P.dead||P.swim||P.inDun){FS.st='idle';fishHud();return;}fpChargeTick(dt);fishHud();return;}
    else if((FS.st==='pull'||FS.st==='fight')&&(!rod||(FS.slot&&equipped('weapon')!==FS.slot)||P.dead||P.inDun||P.swim||state==='dead')){fpLoseOnLine();return;}   // v3.29 kala siimassa: vain käsiesineen vaihto irrottaa (ei etäisyysrajaa – raahaus)
    else if(FS.st!=='pull'&&FS.st!=='fight'&&(!rod||(FS.slot&&equipped('weapon')!==FS.slot)||P.dead||P.inDun||P.swim||state==='dead'||dist2(P.pos.x,P.pos.z,FS.ox,FS.oz)>FISH_KEEP_R*FISH_KEEP_R)){fishReset(rod&&!P.dead?'Siima kelautui sisään – pysy paikallasi kalastaessa.':null);return;}
    if(FS.st==='fly')fpFly(dt);
    else if(FS.st==='wait'){if(FS.t>=FS.nibAt){FS.nibAt=FS.t+5+Math.random()*18;FS.dip=.35;plSnd('onkiminen','nykaisy',{v:.35,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});
        if(FS.bait&&Math.random()<FISH_STEAL*(FS.rod.steal||1)){FS.bait=false;FS.biteAt=FS.t+(FS.biteAt-FS.t)/FISH_BAIT_K;msg('Syötti katosi koukusta.');}}
      if(FS.t>=FS.biteAt){FS.st='bite';FS.win=FISH_WIN+(FS.rod.win||0)+(fishPhase()===3?FS.rod.night||0:0);FS.dip=1;plSnd('onkiminen','tarppays',{v:.55,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});}   // v3.27 ei ilmoitusta – koho kertoo
      fpWaitDrift(dt);}
    else if(FS.st==='bite'){FS.win-=dt;FS.dip=Math.max(FS.dip,.55+.45*Math.abs(Math.sin(FS.t*11)));   /* koho painuu ja nykii tärpin ajan */if(FS.win<=0){const lost=fishLoseBait(.5);msg(lost?'Kala pääsi karkuun – ja vei syötin.':'Kala pääsi karkuun. Odota uutta tärppiä.','warn');FS.st='wait';fishWaitPlan(false);}}
    else if(FS.st==='land'){if(FS.rod&&FS.rod.reel&&mouseL&&locked&&state==='play')fpRetrStart();}
    else if(FS.st==='retr'){fpRetr(dt);if(FS.st==='idle')return;}
    else if(FS.st==='pull'){fpPull(dt);if(FS.st==='idle')return;}
    else if(FS.st==='fight'){fishFight(dt);if(FS.st==='fight')fpFightPos();else if(FS.st==='idle')return;}
    else if(FS.st==='spin'){if(fpSpin(dt))return;}
    if(FS.dip>0)FS.dip=Math.max(0,FS.dip-dt*1.6);fishMeshUpd();if((FS.hudT=(FS.hudT||0)-dt)<=0){FS.hudT=FS.st==='charge'?.033:.1;fishHud();}}   // v3.29 HUD 10 Hz (DOM-päivitys ei joka ruutu)
  // vesien nimet: rantaan tultaessa hienovaraisesti (kerran minuutissa samalle vedelle)
  FS.wbT-=dt;if(FS.wbT<=0){FS.wbT=1;if(!P.inDun){let wb=null;for(let a=0;a<8&&!wb;a++){const x=P.pos.x+Math.cos(a/8*TAU)*7,z=P.pos.z+Math.sin(a/8*TAU)*7;if(terrainH(x,z)<-.45)wb=wbAt(x,z);}
      if(wb&&wb!==FS.last)wbArrive(wb);FS.last=wb;}}}
function fishFight(dt){const B=FISH_B[FS.sp],S=.45+.55*clamp((FS.kg-B.kg[0])/(B.kg[1]-B.kg[0]),0,1),hold=mouseL&&locked&&P.stam>0;FS.fightT+=dt;
  FS.pullT-=dt;if(FS.pullT<=0){FS.pullOn=!FS.pullOn;FS.pullT=FS.pullOn?.5+Math.random()*.9:1.2+Math.random()*1.8;if(FS.pullOn){FS.dip=1;plSnd('onkiminen','nykaisy',{v:.6,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});}}
  const RL=FS.rod.reel;if(hold){FS.prog+=dt*(FS.pullOn?.03:.16)/(.6+S*.6)*(RL?RL.fk:1);FS.ten+=dt*(FS.pullOn?1.05*S:.18*S)/FS.rod.ten*(RL?RL.tk:1);P.stam-=dt*4;P.stamDelay=Math.max(P.stamDelay,.5);FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.45;plSnd('onkiminen','kelaus',{v:.45});}}
  else{FS.ten-=dt*.55;FS.prog-=dt*(FS.pullOn?.06:.015)*S;}
  FS.ten=clamp(FS.ten,0,1.01);FS.prog=clamp(FS.prog,0,1);
  if(FS.ten>=1){fishLoseBait(1);plSnd('onkiminen','siima_katkeaa',{v:.9});const ex=typeof tkLineBreak==='function'?tkLineBreak():'';fishReset(`Siima katkesi! ${ITEMS[FS.sp].n} pääsi karkuun.${ex}`,'warn');return;}
  if(FS.fightT>120){if(FS.rod.keep){if(!FS.tired){FS.tired=1;FS.pullOn=false;FS.pullT=1e9;msg('Kala väsyi – väkäkoukku pitää sen kiinni.','quest');}}else{fishLoseBait(.5);fishReset('Kala irtosi koukusta.','warn');return;}}   // v3.14 väkäkoukku ei päästä
  if(FS.prog>=1){FS.st='pull';FS.pt=25;const t=fpTip();FS.L=Math.max(FP_TETHER_MIN,Math.hypot(FS.E.x-t.x,FS.E.y-t.y,FS.E.z-t.z));}}   // v3.29 väsynyt kala siiman päähän (raahaus / nosto)
const FISH_LIFT_T=.4;
// v3.27: kala nousee ilmaan vavan kärkeen ja jää roikkumaan (roska tulee suoraan reppuun kuten ennen)
function fishLift(){const id=FS.sp;if(!id||!FISH_B[id]){fishLand();return;}FS.st='hang';fishMeshes(false);fpFishDrop();FS.hx=P.pos.x;FS.hz=P.pos.z;if(!FS.cm)FS.cm=typeof fbLen==='function'?fbLen(id,FS.kg,Math.random()):0;plSnd('onkiminen','saalis',{v:.55});
  if(typeof tkDangle==='function')FS.dg=tkDangle(id,FS.kg,true);fishHud();}
// v3.27: otto klikillä; joskus koukku on syvällä (3–10 % arvon mukaan) → minipeli (fishphys.js), onnistuessa fishTake(false,true)
function fishTake(auto,unhooked){if(FISH_B[FS.sp]&&!fishCanFit(FS.sp,FS.kg,FS.cm)){msg('Reppu on täynnä – tee tilaa, kala odottaa koukussa.','warn');if(!(FS.fullT>0))FS.fullT=FP_FULL_T[0]+Math.random()*(FP_FULL_T[1]-FP_FULL_T[0]);if(FS.st==='unhook')fpUnhookEnd(),FS.st='hang';return;}   // v3.29 täysi reppu: kala jää koukkuun (karkaa 10–30 s)
  FS.fullT=0;if(!unhooked&&FISH_B[FS.sp]&&Math.random()<fpHookP()){fpUnhookStart();return;}if(FS.dg){FS.dg.hold=false;FS.dg.t=1e9;FS.dg=null;}fishLand();}
function fishLand(){const id=FS.sp,F=fishF();if(!id){fishReset();return;}
  if(!FISH_B[id]){giveOrDrop(id,1,P.pos.x,P.pos.y+1,P.pos.z);plSnd('onkiminen','roska',{v:.7});
    if(id==='saapas'){setTimeout(()=>plSnd('moka','kirous',{v:.9}),500);msg('Vanha saapas… ei ihan sitä mitä toivoit.','warn');}
    else if(id==='pulloposti')msg('Koukussa on pullo, jossa on kirje! Käytä sitä lukeaksesi.','loot');
    else if(id==='ruostavain')msg('Koukkuun tarttui ruostunut avain. Mihin lukkoon se mahtaa sopia?','loot');
    else if(id==='hiidensiru')msg('Koukussa hohtaa hiidenkiven siru!','loot');
    else msg(`Koukkuun oli tarttunut ${ITEMS[id].n.toLowerCase()}!`,'loot');
    if(FS.bait&&Math.random()<.5)FS.bait=false;if(typeof tkWear==='function')tkWear(.5);fishReset();return;}
  const cm=FS.cm||(typeof fbLen==='function'?fbLen(id,FS.kg,Math.random()):0);if(fishGive(id,FS.kg,cm)>0){msg('Reppu on täynnä.','warn');return;}   // v3.27 kala yksilönä (paino + pituus)
  const rec=F.rec[id]||0,first=!F.n[id];F.n[id]=(F.n[id]||0)+1;bump('fish');plSnd('onkiminen','saalis',{v:.85});
  const kgT=FS.kg.toFixed(2).replace('.',',');if(FS.kg>rec){F.rec[id]=FS.kg;}
  if(typeof fbCatch==='function'){const H=fbCatch(id,FS.kg,first,rec&&FS.kg>rec,cm);lappu(fishArt(id,150,70),H.html,{cls:rec&&FS.kg>rec?'rec':''});if(rec&&FS.kg>rec)fpRecordMusic();}else msg(`${first?'Uusi laji! ':''}${ITEMS[id].n} ${kgT} kg${rec&&FS.kg>rec?' – uusi ennätys!':''}`,'loot');   // v3.15 "Sait: … (luokka) – katso kalakirjan sivu N"
  addXp(Math.round((FISH_DEF[id].k>=2?8:FISH_DEF[id].k>1?4:2)+(rec&&FS.kg>rec?3:0)+(first?5:0)),'kala');
  if(!invCount('kalakirja')&&!F.book){F.book=1;giveOrDrop('kalakirja',1,P.pos.x,P.pos.y+1,P.pos.z);msg('Aloitit kalastajan kirjan – kaikki saaliisi kirjataan siihen.','quest');}
  if(typeof tkWear==='function')tkWear(FISH_DEF[id].k>=2?1.5:1);   // v3.14 siima kuluu (v3.27 kala roikkui jo ilmassa ennen ottoa)
  fishGoals();FS.bait=false;fishReset();}
/* v3.27 käyttäjä: KALAT REPUSSA. Jokainen kala on yksilö {kg, cm, t = pyyntiaika (pelipäivinä)}; paikka {id, n, q, fl:[…]} (n === fl.length, viimeinen = päällimmäinen).
   KOKOJAKAUMA fishRoll: 70 % "tavallisia" (karkea pyöristys 0,1 kg / 2 cm → samanlaisia tulee usein), 30 % laajemmalla jakaumalla tarkasti (0,01 kg / 1 cm).
   PINOT: sama laji + sama paino + sama pituus pinoutuu itsestään (FISH_STACK); käsin raahaamalla saman lajin eriarvoiset kalat voi pinota – pino säilyttää
   yksilöt lisäysjärjestyksessä. Otto, syönti, pudotus, vapautus ja ripustus käyttävät päällimmäistä. Siirrot liikuttavat yksilöitä (flTake), eivät kopioi.
   PILAANTUMINEN: raaka kala pilaantuu FISH_SPOIL_D (4) pelipäivässä → Pilaantunut kala (sairastuttaa aina). */
const FISH_COMMON=.7,FISH_STACK=20,FISH_SPOIL_D=4;
function fishRoll(sp,R,big){R=R||Math.random;const B=FISH_B[sp];if(!B)return {kg:.3,cm:20};const lo=B.kg[0],hi=B.kg[1],span=hi-lo;let kg,cm;
  if(R()<FISH_COMMON){const q=.22+.3*(R()+R())/2;kg=lo+span*q*q*1.6;if(big)kg*=1+big;kg=clamp(Math.round(kg*10)/10,Math.max(.1,Math.ceil(lo*10)/10),Math.max(.1,Math.floor(hi*10)/10));cm=Math.max(2,Math.round(fbLen(sp,kg,.5)/2)*2);}
  else{const q=R();kg=lo+span*q*q*(.6+.4*R());if(big)kg*=1+big;kg=+clamp(kg,lo,hi).toFixed(2);cm=fbLen(sp,kg,R());}
  return {kg,cm};}
function fishMakeKg(sp){return fishRoll(sp).kg;}
const isFishSlot=s=>!!(s&&ITEMS[s.id]&&ITEMS[s.id].cat==='fish');
function flNorm(s){if(!isFishSlot(s))return s;if(!Array.isArray(s.fl)){s.fl=s.kg!=null?[{kg:s.kg,cm:s.cm||fbLen(s.id,s.kg,.5),t:s.t??fishNow()}]:[];delete s.kg;delete s.cm;delete s.t;}
  while(s.fl.length<s.n){const r=fishRoll(s.id);s.fl.unshift({kg:r.kg,cm:r.cm,t:fishNow()});}if(s.fl.length>s.n)s.fl.length=Math.max(0,s.n);return s;}
function flTop(s){if(!isFishSlot(s))return null;flNorm(s);return s.fl[s.fl.length-1]||null;}
function flTake(s,k){if(!isFishSlot(s))return undefined;flNorm(s);return s.fl.splice(Math.max(0,s.fl.length-k),k);}   // päällimmäiset k (kutsuja vähentää n:n)
const flSame=(a,b)=>!!a&&!!b&&Math.abs(a.kg-b.kg)<1e-6&&a.cm===b.cm;
const fishKg=v=>(+v).toFixed(2).replace('.',',');
// kala reppuun: sama paino + pituus pinoutuu, muuten uusi paikka; täysi reppu → maahan (noDrop: palautetaan jäljelle jäänyt määrä)
// v3.29 käyttäjä: täysi reppu → kalaa EI pudoteta esineenä; palauttaa jäljelle jääneen (0 = meni reppuun). Tarkista tila ensin fishCanFit:llä.
function fishCanFit(sp,kg,cm){if(inv.indexOf(null)>=0)return true;return inv.some(s=>isFishSlot(s)&&s.id===sp&&(s.q||1)===1&&s.n<FISH_STACK&&flNorm(s).fl.every(x=>Math.abs(x.kg-kg)<1e-6&&x.cm===cm));}
function fishGive(sp,kg,cm,noDrop,t){if(kg==null){const r=fishRoll(sp);kg=r.kg;cm=r.cm;}if(cm==null)cm=fbLen(sp,kg,Math.random());if(!flags.seen[sp])flags.seen[sp]=1;const f={kg,cm,t:t??fishNow()};
  for(const s of inv)if(isFishSlot(s)&&s.id===sp&&(s.q||1)===1&&s.n<FISH_STACK&&flNorm(s).fl.every(x=>flSame(x,f))){s.fl.push(f);s.n++;invDirty=true;return 0;}
  return invAddEx({id:sp,n:1,q:1,ex:{fl:[f]}});}
// pinon yhteenveto (esinetiedot): kevyin, raskain, keskiarvo, 5 päällimmäistä ja tuoreus
function fishStackInfo(s,o){flNorm(s);const L=s.fl,top=L[L.length-1];if(!top)return;const V=typeof fishValue==='function'?fishValue(s.id,top.kg,top.cm):null,C=V&&FB_CLS[V.cls];
  o.push(['Paino',`${fishKg(top.kg)} kg`],['Pituus',`${top.cm} cm`]);if(C)o.push(['Arvoluokka',C.n]);
  const left=FISH_SPOIL_D-(fishNow()-Math.min(...L.map(f=>f.t??fishNow())));o.push(['Tuoreus',left>1?`pilaantuu noin ${Math.ceil(left)} päivässä`:left>0?'pilaantuu pian!':'pilaantunut']);
  if(L.length>1){const ks=L.map(f=>f.kg);o.push(['Pinossa',`${L.length} kalaa · kevyin ${fishKg(Math.min(...ks))} kg · raskain ${fishKg(Math.max(...ks))} kg · keskiarvo ${fishKg(ks.reduce((a,b)=>a+b,0)/ks.length)} kg`],
    ['Päällimmäiset',L.slice(-5).reverse().map(f=>`${fishKg(f.kg)} kg / ${f.cm} cm`).join(', ')]);}}
// pilaantuminen: reppu ja arkut (2 s välein)
function fishSpoilTick(dt){if((fishSpoilTick.t=(fishSpoilTick.t||0)-dt)>0)return;fishSpoilTick.t=2;const now=fishNow();let nInv=0;
  const scan=(arr,isInv)=>{if(!Array.isArray(arr))return;for(let i=0;i<arr.length;i++){const s=arr[i];if(!isFishSlot(s))continue;flNorm(s);const keep=s.fl.filter(f=>now-(f.t??now)<FISH_SPOIL_D),k=s.fl.length-keep.length;if(!k)continue;
      s.fl=keep;s.n=keep.length;if(s.n<=0){if(s.eq&&isInv)s.eq=false;arr[i]=null;}if(isInv)nInv+=k;else{const j=arr.findIndex(x=>x&&x.id==='pilakala'&&x.n<ITEMS.pilakala.s);if(j>=0)arr[j].n+=k;else{const e=arr.indexOf(null);if(e>=0)arr[e]={id:'pilakala',n:k,q:1};}}}};
  scan(inv,true);for(const p of pieces)if(p.data&&Array.isArray(p.data.items))scan(p.data.items,false);
  if(nInv){const left=invAdd('pilakala',nInv);if(left)spawnDrop('pilakala',left,P.pos.x,P.pos.y+1,P.pos.z);invDirty=true;updateGear();msg(`Raaka kala pilaantui (${nInv}) – savusta tai paista kalat ajoissa.`,'warn');}}
// v3.27: kala kädessä – E veden äärellä vapauttaa sen takaisin veteen; HUD-vihje
function fishHeldWater(){const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),wy=water.position.y;for(const d of [.8,1.6,2.4,3.2]){const x=P.pos.x+fx*d,z=P.pos.z+fz*d;if(terrainH(x,z)<wy-.12)return {x,z};}return null;}
function fishRelease(){const s=equipped('weapon');if(!s||!ITEMS[s.id]||ITEMS[s.id].cat!=='fish'||FS.st!=='idle')return false;const w=fishHeldWater();if(!w){msg('Mene veden äärelle vapauttaaksesi kalan.');return true;}
  const top=flTop(s),kg=top?` ${fishKg(top.kg)} kg`:'';if(--s.n<=0)inv[inv.indexOf(s)]=null;invDirty=true;updateGear();P.eT=playTime;
  if(typeof burst==='function')burst(w.x,water.position.y+.1,w.z,0xcfe8f0,10,2.5);tkSnd('vapautus')||plSnd('onkiminen','loiskahdus',{v:.6,pos:{x:w.x,y:water.position.y,z:w.z}});
  msg(fishReleaseLine(s.id,top));addXp(1,'vapautus');{const wb=wbAt(w.x,w.z),F=fishF();if(wb){F.relB=F.relB||{};F.relB[wb.id]=1;}}bump('released');return true;}
/* v3.27 käyttäjä: vapautuksesta yksi vaihteleva repliikki (koon mukaan), +1 XP ja seuraava tärppi samassa vedessä 10 % nopeammin */
const FISH_REL_LINES={small:['Annetaan sen vielä kasvaa.','Käy hakemassa isovanhempasi.','Ei tuosta olisi syötävää ollut.','Uiskentele isoksi ja tule takaisin.','Liian pieni pannuun.','Mene kertomaan kavereillesi kalastajasta.'],
  big:['Nämä isot ovat yleensä pahanmakuisia.','Ehkä seuraavalla kerralla, vanha veijari.','Kunnioitus vahvaa kalaa kohtaan.','Mene ja kasva vielä isommaksi.','Tarinan saan kertoa – kalan saat pitää.'],
  any:['Takaisin kotiin vain.','Vapaa kuin vesi.','Uimaan siitä!','Pidä huolta järvestä.','Hyvää matkaa, kaveri.']};
function fishReleaseLine(sp,f){const B=FISH_B[sp],k=f&&B?clamp((f.kg-B.kg[0])/(B.kg[1]-B.kg[0]),0,1):.5,L=FISH_REL_LINES[k<.25?'small':k>.6?'big':'any'].concat(FISH_REL_LINES.any);return L[Math.floor(Math.random()*L.length)];}
function fishHeldHint(el){const s=equipped('weapon');if(!s||!ITEMS[s.id]||ITEMS[s.id].cat!=='fish')return false;el.hidden=false;el.className='wait';
  const top=flTop(s),nau=lookTarget&&lookTarget.kind==='piece'&&(lookTarget.p.t==='kalanaulakko'||lookTarget.p.t==='palkintotaulu');
  el.innerHTML=`<span>${ITEMS[s.id].n}${top?' '+fishKg(top.kg)+' kg':''}${s.n>1?' (pinossa '+s.n+')':''} · oikea: syö${nau?' · E: ripusta naulakkoon':fishHeldWater()?' · E: vapauta veteen':''}</span>`;return true;}
/* ---------------- TAVOITTEET (Kalastajan kirja, XP) ---------------- */
const FISH_GOALS=[{id:'eka',t:'Ongi ensimmäinen kala',xp:10,ok:F=>fishTotal(F)>=1},{id:'kymmenen',t:'Ongi 10 kalaa',xp:15,ok:F=>fishTotal(F)>=10},
  {id:'lajit3',t:'Ongi kolme eri lajia',xp:20,ok:F=>Object.keys(F.n).length>=3},{id:'hauki4',t:'Ongi yli 4 kg hauki',xp:25,ok:F=>(F.rec.hauki||0)>4},
  {id:'lohi',t:'Ongi lohi merestä',xp:30,ok:F=>!!F.n.lohi},{id:'suonsilma',t:'Ongi suonsilmä suolammesta yöllä',xp:30,ok:F=>!!F.n.suonsilma},
  {id:'vedet',t:'Löydä viisi nimettyä vettä',xp:20,ok:F=>Object.keys(F.wb).length>=5},{id:'arkku',t:'Avaa upponut arkku',xp:40,ok:F=>!!F.sunkO},
  {id:'kaikki',t:`Ongi kaikki ${Object.keys(FISH_B).length} lajia`,xp:60,ok:F=>Object.keys(FISH_B).every(s=>F.n[s])}];
function fishTotal(F){return Object.values(F.n).reduce((a,b)=>a+b,0);}
function fishGoals(){const F=fishF();for(const g of FISH_GOALS)if(!F.g[g.id]&&g.ok(F)){F.g[g.id]=1;addXp(g.xp,'kalatavoite');msg(`Kalastajan tavoite: ${g.t} (+${g.xp} XP)`,'quest');}}
/* ---------------- 3D: koho ja siima ---------------- */
function fishMeshes(on){if(on&&!FS.bob){const g=new THREE.Group(),t=new THREE.Mesh(new THREE.SphereGeometry(.07,10,6,0,TAU,0,Math.PI/2),mat(0xd83a2a)),b=new THREE.Mesh(new THREE.SphereGeometry(.07,10,6,0,TAU,Math.PI/2,Math.PI/2),mat(0xf2f0e8));
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.14,4),mat(0x2a2a2a));st.position.y=.1;g.add(t,b,st);scene.add(g);FS.bob=g;
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(FP_LN*3),3));FS.line=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xe8e8e0,transparent:true,opacity:.75}));FS.line.frustumCulled=false;scene.add(FS.line);}
  if(FS.bob){FS.bob.visible=on;FS.line.visible=on;if(on&&typeof tkBobDress==='function')tkBobDress();}}   // v3.14 koho/viehe vavan osien mukaan
const _fsTip=new THREE.Vector3(),_fsQ=new THREE.Quaternion();
const FP_LN=16;
/* v3.27: koho/viehe päätteen FS.E kohdalla; siima taipuvana kaarena (löysä odottaessa, kireä kelatessa ja väsyttäessä); kalan suu siiman päässä */
function fishMeshUpd(){if(!FS.bob||!FS.E)return;const wy=water.position.y,E=FS.E;fpTip(_fsTip);let bx=E.x,by=E.y,bz=E.z;
  if(FS.st==='wait'||FS.st==='bite')by=wy+.02+Math.sin(playTime*2.2)*.012-(FS.dip||0)*.12;else if(FS.st==='spin')by=E.y+Math.sin(playTime*6)*.02;
  FS.bob.position.set(bx,by,bz);FS.bob.visible=!FS.fm;if(FS.fm){bx=FS.fm.position.x;by=FS.fm.position.y;bz=FS.fm.position.z;}
  const hold=mouseL&&locked,d=Math.hypot(bx-_fsTip.x,by-_fsTip.y,bz-_fsTip.z),st=FS.st,
    sl=st==='fly'?.02:st==='wait'||st==='bite'?.06:st==='land'?.05:st==='spin'?(hold?.012:.035):st==='retr'?(hold||!FS.rod.reel?.015:.04):st==='fight'?.004*(1-FS.ten):st==='pull'?(FS.tight?.008:.045):.03,sag=Math.min(2.5,d*sl);
  const n=FISH_LQ?10:FP_LN,a=FS.line.geometry.attributes.position;for(let i=0;i<n;i++){const t=i/(n-1);a.setXYZ(i,lerp(_fsTip.x,bx,t),lerp(_fsTip.y,by+(FS.fm?0:.1),t)-4*t*(1-t)*sag,lerp(_fsTip.z,bz,t));}FS.line.geometry.setDrawRange(0,n);a.needsUpdate=true;}   // v3.29 Low/Medium: 10 pistettä
/* ---------------- HUD: tärppi ja väsytys ---------------- */
function fishHud(){const el=document.getElementById('fishHud');if(!el)return;if(typeof tkHud==='function'&&tkHud(el))return;
  {const st=FS.st,sh=t=>{el.hidden=false;el.className='wait';el.innerHTML=t;return true;};   // v3.27 uudet tilat
    if(st==='charge'){const k=fpChargeK();el.hidden=false;el.className='wait';el.innerHTML=`<span>Heiton voima ${Math.round((FP_PW_MIN+(1-FP_PW_MIN)*k)*100)} % · päästä irti heittääksesi (katso noin 35° ylös = pisin)</span><div class="fb"><i class="pr" style="width:${Math.round(k*100)}%"></i></div>`;return;}
    if(st==='fly'){el.hidden=true;return;}
    if(st==='land'||st==='retr'){if(FS.rod&&FS.rod.reel){sh(`<span>${st==='land'?'Viehe on maassa – ':''}pidä vasenta kelataksesi</span>`);return;}if(st==='land'){sh('<span>Koho on maassa – vasen vetää sen takaisin</span>');return;}el.hidden=true;return;}
    if(st==='pull'){if(!FISH_B[FS.sp]){el.hidden=true;return;}sh(`<span>${ITEMS[FS.sp].n} siimassa – ${FS.spin?'pidä vasenta kelataksesi · ':'vapa nousee · '}kävele taaksepäin raahataksesi${FS.spin?'':' · maalla vasen nostaa'}</span>`);return;}   // v3.29
    if(st==='unhook'){el.hidden=true;return;}
    if((st==='wait'||st==='bite')&&FS.noFish){sh('<span>Täällä ei näytä olevan kaloja – heitä syvempään, nimettyyn veteen · vasen nostaa</span>');return;}}   /* v3.14 virveli, siiman vaihto, mato-vihje */if(FS.st==='hang'){el.hidden=false;el.className='wait';const ht=`<span>${ITEMS[FS.sp].n} koukussa · vasen: ota kala${FS.fullT>0?` · reppu täynnä – karkaa ${Math.ceil(FS.fullT)} s`:''}</span>`;if(el._h!==ht){el._h=ht;el.innerHTML=ht;}return;}   // v3.27
  if(FS.st==='idle'&&fishHeldHint(el))return;
  const on=FS.st==='bite'||FS.st==='fight'||FS.st==='wait';el.hidden=!on;if(!on)return;
  el.className=FS.st==='bite'?'bite':FS.st==='fight'?'fight':'wait';
  if(FS.st==='wait'||FS.st==='bite'){   // v3.27 tärppi ei näy HUDissa – katso kohoa
    if(FS.st==='bite')el.className='wait';el.innerHTML=`<span>${FS.body?FS.body.name:''}${FS.bait?' · syötti: mato':''} · vasen kelaa sisään</span>`;return;}
  el.innerHTML=`<div class="fl">Väsytys: ${ITEMS[FS.sp].n}</div><div class="fb"><i class="ten${FS.ten>.8?' hi':''}" style="width:${Math.round(FS.ten*100)}%"></i></div><div class="fb"><i class="pr" style="width:${Math.round(FS.prog*100)}%"></i></div><div class="fh">${FS.pullOn?'Kala vetää – päästä irti!':'Kelaa: pidä vasenta'}</div>`;}
/* v3.24 käyttäjä: VESISTÖN NIMI. Ensimmäisellä kerralla isompi "Vesistö löydetty" + nimi alla; myöhemmin rannalle tultaessa vain nimi pienemmällä. Sama nimi ei
   koskaan kahdesti peräkkäin (F.wbLast) ja näkyy uudelleen aikaisintaan WB_AGAIN_D (5) vuorokauden päästä (F.wbSeen). Kulkee aluebannerien jonossa (showWbBanner, ui.js). */
const WB_AGAIN_D=5;
function wbArrive(wb){const F=fishF(),now=dayN+dayT;F.wbSeen=F.wbSeen||{};
  if(!F.wb[wb.id]){F.wb[wb.id]=1;F.wbSeen[wb.id]=now;F.wbLast=wb.id;showWbBanner(wb.name,true);return;}   // v3.07: löytö kerran
  if(F.wbLast===wb.id||now-(F.wbSeen[wb.id]??-99)<WB_AGAIN_D){fishHintTry(wb);return;}F.wbSeen[wb.id]=now;F.wbLast=wb.id;showWbBanner(wb.name,false);fishHintTry(wb);}
/* v3.27 käyttäjä: vedelle tullessa 20 %: huhu lajista, jota et ole vielä saanut – laji paljastuu kalakirjaan (tiedot, ei kuvaa). Enintään kerran puolessa päivässä. */
const FISH_HINT_P=.2,FISH_HINT_GAP=.5;
function fishHintTry(wb){const F=fishF(),now=fishNow();if(now-(F.hintT??-9)<FISH_HINT_GAP||Math.random()>=FISH_HINT_P)return;F.hint=F.hint||{};
  const L=Object.keys(FISH_B).filter(sp=>!F.n[sp]&&!F.hint[sp]&&fishW(sp,wb)>0);if(!L.length)return;const tot=L.reduce((a,sp)=>a+fishW(sp,wb),0);let r=Math.random()*tot,sp=L[0];for(const x of L){r-=fishW(x,wb);if(r<=0){sp=x;break;}}
  F.hint[sp]=1;F.hintT=now;setTimeout(()=>msg(`Kuulin huhun, että tästä vedestä voi saada lajia: ${ITEMS[sp].n}. Katso kalakirjasta.`,'quest'),3500);}
function wbShow(name,isNew){const el=document.getElementById('wbName');if(!el)return;el.innerHTML=isNew?`<small>Vesistö löydetty</small><b>${name}</b>`:`<b>${name}</b>`;el.classList.toggle('big',!!isNew);
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');el.onanimationend=()=>el.classList.remove('on');   /* v3.25 käyttäjä: animaatio ei toistu, kun HUD palaa valikosta (display none → näkyviin käynnisti sen alusta) */if(isNew)msg(`Löysit veden: ${name}`,'loot');}
// kartta: löydettyjen vesien nimet (kuten muut nimet, kursiivilla ja sinertävinä)
function fishMapLabels(g,pt,sx){   /* v3.08 käyttäjä: nimet kaikilla zoomeilla (koko pienenee ulos zoomatessa) */const F=fishF();for(const w of WBS){if(!F.wb[w.id])continue;const [x,y]=pt(w.x,w.z);g.save();g.shadowColor='rgba(0,0,0,.9)';g.shadowBlur=3;g.shadowOffsetX=1;g.shadowOffsetY=1;
    g.fillStyle='#a9d8f2';g.font=`italic 600 ${sx>1.6?13:sx>1?12:10}px Alegreya Sans, sans-serif`;g.textAlign='center';g.fillText(w.name,x,y+4);g.restore();}
  if(SUNK&&F.sunkK&&!F.sunkO){const [x,y]=pt(SUNK.x,SUNK.z);g.save();g.strokeStyle='#e8c070';g.lineWidth=2;g.beginPath();g.moveTo(x-5,y-5);g.lineTo(x+5,y+5);g.moveTo(x+5,y-5);g.lineTo(x-5,y+5);g.stroke();g.restore();}}
/* ---------------- KÄYTETTÄVÄT ESINEET ---------------- */
function itemUse(s){const F=fishF();
  if(s.id==='pulloposti'){if(!SUNK){msg('Kirjeen muste on haalistunut lukukelvottomaksi.');return;}F.sunkK=1;s.n--;if(s.n<=0)inv[inv.indexOf(s)]=null;invDirty=true;
    const dx=SUNK.x-P.pos.x,dz=SUNK.z-P.pos.z,i=((Math.round(Math.atan2(dx,-dz)/(Math.PI/4))%8)+8)%8;
    msg(`Kirje: "Arkkuni upposi ${SUNK.isl?'pienen luodon':'rannan'} kupeeseen. Avain jäi veteen – ehkä joku onkii sen vielä." Arkku on täältä ${DIRS[i]}, noin ${Math.round(Math.hypot(dx,dz)/10)*10} m (merkitty karttaan ✕).`,'quest');return;}
  if(s.id==='kalakirja'){fishBookOpen();return;}}
/* ---------------- UPPONUT ARKKU ---------------- */
let sunkMesh=null;
function sunkBuild(){if(!SUNK||sunkMesh)return;const y=terrainH(SUNK.x,SUNK.z),g=new THREE.Group(),wd=mat(0x4a3018),fe=mat(0x5a4a3a,{metalness:.4,roughness:.7});
  g.add(bx(1.1,.6,.7,wd,0,.3,0),bx(1.12,.12,.72,fe,0,.62,0),bx(.08,.62,.74,fe,-.4,.31,0),bx(.08,.62,.74,fe,.4,.31,0),bx(.14,.16,.06,mat(0x8a6a3a,{metalness:.5}),0,.38,.37));
  for(let i=0;i<5;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.04,.5+Math.random()*.4,.02),mat(0x3a5a2a));s.position.set(-.5+i*.25,.25,.38);s.rotation.z=(Math.random()-.5)*.6;g.add(s);}
  g.position.set(SUNK.x,y-.22,SUNK.z);g.rotation.set(.12,Math.random()*TAU,-.18);scene.add(g);sunkMesh=g;
  interactables.push({x:SUNK.x,y:y+.4,z:SUNK.z,r:2.6,label:()=>fishF().sunkO?'Tyhjä upponut arkku':invCount('ruostavain')?'Avaa upponut arkku ruostuneella avaimella':'Upponut arkku – lukossa, ruosteinen lukko',use:sunkOpen,off:()=>P.inDun});}
function sunkOpen(){const F=fishF();if(F.sunkO){msg('Arkku on tyhjä.');return;}if(!invCount('ruostavain')){msg('Lukko on ruostunut kiinni. Tarvitset sopivan avaimen – ehkä se on jossain vedessä.','warn');return;}
  invRemove('ruostavain',1);F.sunkO=1;F.sunkK=1;for(const [id,n] of [['rauta',4],['kupari',6],['hiidensiru',1],['lasi',2],['savukala',3]])giveOrDrop(id,n,SUNK.x,terrainH(SUNK.x,SUNK.z)+1,SUNK.z);
  plSnd('kaytto','arkku_auki');sfx('pickup');msg('Ruosteinen lukko narahtaa auki – upponut arkku on täynnä aarteita!','loot');addXp(20,'arkku');fishGoals();}
/* ---------------- KALASTAJAN KIRJA: v3.15 fishbook.js (fishBookOpen, fishBookRender, arvo, toiveet) ---------------- */
/* ---------------- KATISKA, SAVUSTIN, KALANAULAKKO ---------------- */
const SAV_HEAT_T=30,SAV_COOL_T=90,KAT_T=900,KAT_BAIT_K=.6,KAT_MAX=3,KAT_BAIT_MAX=5,SAV_T=180,SAV_MAX=6,SAV_WOOD=2;
function katInWater(p){return terrainH(p.x,p.z)<water.position.y-.3;}
function katTick(p,dt){const d=p.data;d.f=d.f||[];if(!katInWater(p)||d.f.length>=KAT_MAX)return;d.t=(d.t||0)+dt*(d.b>0?1/KAT_BAIT_K:1);
  if(d.t>=KAT_T){d.t=0;const wb=wbAt(p.x,p.z);if(!wb)return;const sp=fishPick(wb);if(sp&&FISH_DEF[sp].k<2){d.f.push(sp);if(d.b>0)d.b--;}}}
function katLabel(p){const d=p.data;if(!katInWater(p))return 'Katiska – aseta se veteen (vähintään 0,3 m)';if(d.f&&d.f.length)return `Katiska: ${d.f.length} kalaa – ota (E)`;return `Katiska: odottaa kaloja${d.b?` · syöttiä ${d.b}`:''}${(invCount('perkeet')||invCount('mato'))&&(d.b||0)<KAT_BAIT_MAX?` – E lisää ${invCount('perkeet')?'perkeet':'madon'}`:''}`;}
function katInteract(p){const d=p.data;d.f=d.f||[];if(d.f.length){const keep=[];for(const sp of d.f){const r=fishRoll(sp);if(!fishCanFit(sp,r.kg,r.cm)){keep.push(sp);continue;}fishGive(sp,r.kg,r.cm);msg(`+1 ${ITEMS[sp].n}`,'loot');bump('fish');const F=fishF();F.n[sp]=(F.n[sp]||0)+1;}if(keep.length)msg('Reppu on täynnä – loput kalat jäivät katiskaan.','warn');d.f=keep;sfx('pickup');plSnd('onkiminen','saalis',{v:.6});fishGoals();return;}
  if(invCount('perkeet')&&(d.b||0)<KAT_BAIT_MAX){invRemove('perkeet',1);d.b=Math.min(KAT_BAIT_MAX,(d.b||0)+2);msg(`Laitoit perkeet katiskaan (${d.b}/${KAT_BAIT_MAX}) – houkuttelevat kuin kaksi matoa.`);return;}   // v3.14
  if(invCount('mato')&&(d.b||0)<KAT_BAIT_MAX){invRemove('mato',1);d.b=(d.b||0)+1;msg(`Laitoit madon katiskaan (${d.b}/${KAT_BAIT_MAX}) – kaloja tulee nopeammin.`);return;}
  msg(katInWater(p)?'Katiskassa ei ole vielä kaloja (noin 15 min / kala, syötillä nopeammin).':'Katiska toimii vain vedessä.');}
function savTick(p,dt){const d=p.data,on=!!(d.q&&d.q.length);d.heat=clamp((d.heat||0)+(on?dt/SAV_HEAT_T:-dt/SAV_COOL_T),0,1);heatGlow(p.mesh.userData.glow,d.heat*.8,SMELT_DARK);if(!on)return;d.t=(d.t||0)+dt;if(dist2(p.x,p.z,P.pos.x,P.pos.z)<35*35&&Math.random()<dt*2)emitEmber(p.x+(Math.random()-.5)*.4,p.y+1.6,p.z+(Math.random()-.5)*.4,'smoke');
  if(d.t>=SAV_T){let n=0;for(const sp of d.q){const k=FISH_DEF[sp].k;n+=k>=2?2:k>1?(Math.random()<.5?2:1):1;}d.out=(d.out||0)+n;d.q=[];d.t=0;}}
function savLabel(p){const d=p.data;if(d.out)return `Savustin: ${d.out} savukalaa valmiina – ota (E)`;if(d.q&&d.q.length)return `Savustin: ${d.q.length} kalaa savussa – valmis ${mmss(SAV_T-(d.t||0))}`;return 'Savustin – E: laita raa\'at kalat savuun (2 puuta)';}
function savInteract(p){const d=p.data;if(d.out){giveOrDrop('savukala',d.out,p.x,p.y+1,p.z);d.out=0;sfx('pickup');return;}if(d.q&&d.q.length){msg('Kalat ovat vielä savussa.');return;}
  const raw=Object.keys(FISH_DEF).filter(id=>invCount(id)>0);if(!raw.length){msg('Tarvitset raakaa kalaa.','warn');return;}if(invCount('puu')<SAV_WOOD){msg(`Savustukseen tarvitaan ${SAV_WOOD} puuta.`,'warn');return;}
  invRemove('puu',SAV_WOOD);d.q=[];for(const id of raw){while(invCount(id)>0&&d.q.length<SAV_MAX){invRemove(id,1);d.q.push(id);}}d.t=0;sfx('build');msg(`Savustimeen: ${d.q.length} kalaa (valmis ${mmss(SAV_T)}).`);}
/* v3.27 käyttäjä: NAULAKOT. Kalanaulakko (1 kala) ja Palkintotaulu (3 kalaa, paikka tähtäyksen mukaan). E kala kädessä ripustaa päällimmäisen kalan
   (oikean muotoinen malli, koko painon mukaan) – varattu paikka vaihtuu ja vanha kala palaa reppuun. E ilman kalaa ottaa kalan alas. Purku/rikkoutuminen
   pudottaa kalat maahan (nauRefund). Kultainen laatta: lähellä katsottaessa tiedot ruudulle (kalastaja, päivä ja kello, laji, paino, pituus, arvoluokka).
   Seikkailijan nimi (v3.29 pName/flags.pname) kysytään ensimmäisellä ripustuksella, vaihdettavissa Asetukset › Ohjaus › Seikkailija. Data p.data.fs = [{sp,kg,cm,t,nm,day,tod}|null]. */
const NAU_N={kalanaulakko:1,palkintotaulu:3};
const isNau=p=>!!(p&&NAU_N[p.t]);
function nauNorm(p){const d=p.data,n=NAU_N[p.t]||1;if(!Array.isArray(d.fs)){d.fs=[];if(d.f&&FISH_B[d.f]){const kg=+d.kg||.5;d.fs[0]={sp:d.f,kg,cm:fbLen(d.f,kg,.5),t:fishNow(),nm:pName(),day:dayN,tod:dayT};}delete d.f;delete d.kg;}
  while(d.fs.length<n)d.fs.push(null);d.fs.length=n;return d;}
const _nauI=new THREE.Matrix4(),_nauO=new THREE.Vector3(),_nauD=new THREE.Vector3();
function nauSlotAim(p){const n=NAU_N[p.t]||1;if(n===1||!p.mesh)return 0;const {o,d}=camRay();p.mesh.updateMatrixWorld(true);_nauI.copy(p.mesh.matrixWorld).invert();_nauO.copy(o).applyMatrix4(_nauI);_nauD.copy(d).transformDirection(_nauI);
  if(Math.abs(_nauD.z)<1e-4)return 1;const t=(.1-_nauO.z)/_nauD.z,x=_nauO.x+_nauD.x*t;return x<-.28?0:x>.28?2:1;}
function nauLabel(p){const d=nauNorm(p),i=nauSlotAim(p),f=d.fs[i],h=equipped('weapon'),N=PIECES[p.t].n;
  if(isFishSlot(h))return `${N} – E: ripusta ${ITEMS[h.id].n.toLowerCase()}${f?' (vaihtaa kalan, vanha reppuun)':''}`;
  if(f)return `${N}: ${ITEMS[f.sp].n} ${fishKg(f.kg)} kg – E: ota alas`;return `${N} – ota kala käteen ja paina E`;}
function nauInteract(p){const d=nauNorm(p),i=nauSlotAim(p),h=equipped('weapon');
  if(isFishSlot(h)){if(!pName()){anglerAsk(()=>nauInteract(p));return;}const top=flTake(h,1)[0];if(!top)return;h.n--;if(h.n<=0){h.eq=false;inv[inv.indexOf(h)]=null;}
    const old=d.fs[i];d.fs[i]={sp:h.id,kg:top.kg,cm:top.cm,t:top.t??fishNow(),nm:pName(),day:dayN,tod:dayT};
    if(old&&fishGive(old.sp,old.kg,old.cm,false,old.t)>0){d.fs[i]=old;h.n++;h.fl.push(top);invDirty=true;updateGear();msg('Reppu on täynnä – vanhaa kalaa ei voi ottaa alas.','warn');return;}   // v3.29 ei pudotusta
    invDirty=true;updateGear();nauVis(p);sfx('build');P.eT=playTime;msg(`Ripustit: ${ITEMS[h.id].n} ${fishKg(top.kg)} kg${old?` – ${ITEMS[old.sp].n} palasi reppuun`:''}.`,'loot');return;}
  const f=d.fs[i];if(f){if(!fishCanFit(f.sp,f.kg,f.cm)){msg('Reppu on täynnä.','warn');return;}d.fs[i]=null;nauVis(p);sfx('pickup');fishGive(f.sp,f.kg,f.cm,false,f.t);msg(`Otit alas: ${ITEMS[f.sp].n} ${fishKg(f.kg)} kg.`);return;}
  msg('Ota kala käteen (pikapaikka) ja paina E ripustaaksesi sen.');}
function nauRefund(p){if(!isNau(p))return;const d=nauNorm(p);for(const f of d.fs){if(!f)continue;spawnDrop(f.sp,1,p.x,p.y+.6,p.z);drops[drops.length-1].ex={fl:[{kg:f.kg,cm:f.cm,t:f.t??fishNow()}]};}d.fs=d.fs.map(()=>null);}
function nauVis(p){const S=p.mesh&&(p.mesh.userData.slots||(p.mesh.userData.fishM?[p.mesh.userData.fishM]:null));if(!S)return;const d=nauNorm(p),W=p.t==='palkintotaulu'?.5:.62;
  S.forEach((g,i)=>{while(g.children.length){const c=g.children[0];g.remove(c);c.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose();});}const f=d.fs[i];if(!f||!FISH_DEF[f.sp])return;
    const L=fpFishLen(f.sp,f.kg),m=tkFishMesh(f.sp,L),k=Math.min(1,W/L);m.scale.setScalar(k);m.rotation.z=Math.PI/2;g.add(m);m.traverse(o=>{o.userData.piece=p;o.castShadow=false;});});}
// kultainen laatta (pieces.js buildPieceMesh): kehys, kultalevy ja kaiverrusrivit
function nauPlaque(g,x,y){g.add(bx(.29,.095,.008,tkMat('nauF',0x3a2414),x,y,.045),bx(.26,.075,.012,tkMat('nauG',0xd4a83a,{metalness:.85,roughness:.28}),x,y,.052));
  for(let r=0;r<3;r++)g.add(bx(r?.14:.2,.006,.004,tkMat('nauE',0x6a5018,{metalness:.5,roughness:.6}),x,y+.022-r*.021,.059));}
// laatan tiedot ruudulle, kun naulakkoa katsotaan läheltä
const fishClock=t=>{const h=((t%1)+1)%1*24;return `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')}`;};
function nauPlaqueTick(){const el=document.getElementById('plaqueInfo')||(()=>{const e=document.createElement('div');e.id='plaqueInfo';e.hidden=true;document.getElementById('hud').appendChild(e);return e;})();
  const t=lookTarget,p=t&&t.kind==='piece'?t.p:null;if(!isNau(p)||state!=='play'||dist2(p.x,p.z,P.pos.x,P.pos.z)>4.5*4.5){if(!el.hidden)el.hidden=true;return;}
  const i=nauSlotAim(p),f=nauNorm(p).fs[i];if(!f){if(!el.hidden)el.hidden=true;return;}const key=p.x+','+p.z+','+i+','+f.kg;if(el.hidden||el._k!==key){el._k=key;
    const V=fishValue(f.sp,f.kg,f.cm),C=FB_CLS[V.cls];el.innerHTML=`<div class="plT">🏆 ${ITEMS[f.sp].n}</div><div class="plR"><span>Kalastaja</span><b>${esc(f.nm||'tuntematon')}</b></div><div class="plR"><span>Pyydetty</span><b>päivä ${(f.day??0)+1}, klo ${fishClock(f.tod??0)}</b></div>`+
      `<div class="plR"><span>Paino</span><b style="color:${C.c}">${fishKg(f.kg)} kg</b></div><div class="plR"><span>Pituus</span><b>${f.cm} cm</b></div><div class="plR"><span>Arvoluokka</span><b style="color:${C.c}">${C.n}</b></div>`;}
  el.hidden=false;}
// kalastajan nimi: näppäimistöllä kirjoitettava ikkuna (toimii hiiren lukituksessa), Enter hyväksyy, Esc peruu
const ANG={on:false,v:'',cb:null};
// v3.29 käyttäjä: yleinen seikkailijan nimi (flags.pname; vanha flags.angler siirretään)
function pName(){if(!flags.pname&&flags.angler){flags.pname=flags.angler;delete flags.angler;}return flags.pname||'';}
// v3.30 käyttäjä: nimen pyyhkiminen (Asetukset › Seikkailija › Pyyhi). Jo kaiverretut laatat ja kirjan palkintolaatat säilyvät ennätyksinä; seuraava ripustus kysyy nimen uudelleen.
function pNameClear(){const had=pName();delete flags.pname;delete flags.angler;if(had)msg('Seikkailijan nimi pyyhitty.');}
function anglerAsk(cb,cur){ANG.on=true;ANG.v=cur||'';ANG.cb=cb;let el=document.getElementById('nameDlg');if(!el){el=document.createElement('div');el.id='nameDlg';document.body.appendChild(el);}el.hidden=false;anglerDraw();}
function anglerDraw(){const el=document.getElementById('nameDlg');if(el)el.innerHTML=`<div class="ndBox"><div class="ndT">⚔️ Seikkailijan nimi</div><div class="ndS">Nimesi tällä saarella – kaiverretaan myös naulakon kultaiseen laattaan.</div><div class="ndI">${esc(ANG.v)}<i>|</i></div><div class="ndH">Kirjoita nimi · Enter hyväksyy · Esc peruu</div></div>`;}
addEventListener('keydown',e=>{if(!ANG.on)return;e.preventDefault();e.stopImmediatePropagation();
  if(e.key==='Escape'){ANG.on=false;document.getElementById('nameDlg').hidden=true;return;}
  if(e.key==='Enter'){const v=ANG.v.trim().slice(0,24);if(!v)return;flags.pname=v;delete flags.angler;ANG.on=false;document.getElementById('nameDlg').hidden=true;msg(`Seikkailijan nimi: ${v}`);const cb=ANG.cb;ANG.cb=null;if(cb)cb();return;}
  if(e.key==='Backspace'){ANG.v=ANG.v.slice(0,-1);anglerDraw();return;}if(e.key.length===1&&ANG.v.length<24&&/[\p{L}\p{N} '\-.]/u.test(e.key)){ANG.v+=e.key;anglerDraw();}},true);
Object.assign(COOKABLE,Object.fromEntries(Object.keys(FISH_DEF).map(id=>[id,id+'p'])));   // nuotio ja grilli paistavat kalat
for(const id in FISH_DEF){const k=FISH_DEF[id].k;COOK_T[id]=k>=2?[9,4]:k>1?[7,3]:[5,2];}
sunkBuild();
