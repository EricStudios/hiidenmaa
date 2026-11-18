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
const FISH_PH=['aamulla','päivällä','illalla','yöllä'],FISH_WXN={selkea:'selkeällä',pilvi:'pilvisellä',tuuli:'tuulella',tihku:'tihkusateella',sade:'sateella',myrsky:'myrskyllä',sumu:'sumussa',lumi:'lumisateella'};
const FISH_WAIT=[60,300],FISH_MIN=30,FISH_BAIT_K=.75,FISH_WIN=.6,FISH_CAST=[3,16],FISH_NAME_K=1.6,FISH_STEAL=.08,FISH_KEEP_R=5;
const ROD_LEN=2.05;   // vavan pituus (models.js)
const FISH_JUNK=[['rauta',.01],['kupari',.02],['hiidensiru',.015],['saapas',.03],['pulloposti',.015],['ruostavain',.01]];
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
    for(let k=0;k<C.cells.length;k++){const p=pos(C.cells[k]);sx+=p.x;sz+=p.z;if(k%st===0&&biomeAt(p.x,p.z,1)==='suo')bog++;}
    const cx=sx/C.cells.length,cz=sz/C.cells.length;let best=C.cells[0],bd=1e18;for(const c of C.cells){const p=pos(c),d=dist2(p.x,p.z,cx,cz);if(d<bd){bd=d;best=c;}}
    const type=bog>=Math.ceil(C.cells.length/st)*.4?'bog':'lake',L=type==='bog'?['ruutana','ruutana','suonsilma']:['ahven','hauki','lahna'],sp=L[Math.floor(rs()*L.length)];
    const nm=uniq(WB_LAKE[sp]+(type==='bog'||C.cells.length<45?'lampi':'järvi')),lp=pos(best);remap[ci]=WBS.length;WBS.push({id:'w'+WBS.length,name:nm,type,sp,x:lp.x,z:lp.z,n:C.cells.length});});
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
    SUNK=pick;}})();
// v3.08: onko kohta sisämaan vettä (järvi/lampi) eikä merta – ruutujen tunnukset 2 ruudun säteellä (ei Meri-aluetta järvellä)
function inlandWater(x,z){const i0=Math.floor((x+HALF)/WB_S),j0=Math.floor((z+HALF)/WB_S);let lake=false;for(let r=0;r<=4;r++){for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=i0+di,j=j0+dj;if(i<0||j<0||i>=WB_N||j>=WB_N)return false;const id=WB_ID[j*WB_N+i];if(id===-2)return false;if(id>=0)lake=true;}if(lake)return true;}return false;}
function wbAt(x,z){const i=Math.floor((x+HALF)/WB_S),j=Math.floor((z+HALF)/WB_S);if(i<0||j<0||i>=WB_N||j>=WB_N)return null;const id=WB_ID[j*WB_N+i];
  if(id>=0)return WBS[id];if(id===-2){let b=null,bd=1e18;for(const s of WB_SEA){const d=dist2(x,z,s.x,s.z);if(d<bd){bd=d;b=s;}}return b;}return null;}
function fishF(){if(!flags.fish||typeof flags.fish!=='object')flags.fish={};const F=flags.fish;F.rec=F.rec||{};F.n=F.n||{};F.wb=F.wb||{};F.g=F.g||{};return F;}
function fishPhase(){return dayT>=.19&&dayT<.3?0:dayT>=.3&&dayT<.72?1:dayT>=.72&&dayT<.83?2:3;}
// lajin todennäköisyyspaino tässä vedessä nyt (aika ja sää)
function fishW(sp,wb){const B=FISH_B[sp];if(!B||!wb||B.w!==wb.type)return 0;return B.b*B.t[fishPhase()]*(B.wx[weather.cur]||1)*(wb.sp===sp?FISH_NAME_K:1);}
function fishPick(wb){const L=Object.keys(FISH_B).map(sp=>[sp,fishW(sp,wb)]).filter(a=>a[1]>0);const tot=L.reduce((a,b)=>a+b[1],0);if(!tot)return null;let r=Math.random()*tot;for(const [sp,w] of L){r-=w;if(r<=0)return sp;}return L[L.length-1][0];}
function fishActivity(wb){let a=0,b=0;for(const sp in FISH_B){const B=FISH_B[sp];if(B.w!==wb.type)continue;b+=B.b;a+=fishW(sp,wb)/(wb.sp===sp?FISH_NAME_K:1);}return b?clamp(a/b,.45,1.6):1;}
/* ---------------- ONKI ---------------- */
const FS={st:'idle',t:0,bob:null,line:null,body:null,ox:0,oz:0,bx:0,bz:0,bait:false,biteAt:0,nibAt:0,win:0,sp:null,kg:0,ten:0,prog:0,pullT:0,pullOn:false,fightT:0,wbT:0,last:null,lastT:{},kelT:0,rod:null};
function rodDef(){const w=equipped('weapon');return w&&ITEMS[w.id]&&ITEMS[w.id].cat==='rod'?ITEMS[w.id].rod:null;}
function fishWaterPoint(){const {o,d}=camRay();const wy=water.position.y;if(d.y>-.02)return null;const t=(wy-o.y)/d.y;if(t<0)return null;const x=o.x+d.x*t,z=o.z+d.z*t;return {x,z,y:wy};}
function fishClick(){if(P.dead||state!=='play')return;if(FS.st==='idle')fishCast();else if(FS.st==='wait'||FS.st==='cast')fishReset('Kelasit siiman sisään.');else if(FS.st==='bite')fishHook();}
function fishCast(){const rod=rodDef();if(!rod)return;if(P.inDun){msg('Täällä ei ole kalavettä.','warn');return;}if(P.swim){msg('Et voi onkia uidessa.','warn');return;}
  const p=fishWaterPoint(),d=p?Math.sqrt(dist2(p.x,p.z,P.pos.x,P.pos.z)):0;
  if(!p||d<FISH_CAST[0]||d>FISH_CAST[1]){msg(`Heitä veteen: katso vedenpintaa ${FISH_CAST[0]}–${FISH_CAST[1]} m päähän.`,'warn');return;}
  if(terrainH(p.x,p.z)>p.y-.45){msg('Liian matalaa – heitä syvemmälle.','warn');return;}
  const wb=wbAt(p.x,p.z);if(!wb){msg('Tässä lätäkössä ei ole kaloja.','warn');return;}
  if(P.stam<3){msg('Liian uupunut.','warn');return;}P.stam-=3;P.stamDelay=1;
  Object.assign(FS,{st:'cast',t:0,body:wb,ox:P.pos.x,oz:P.pos.z,bx:p.x,bz:p.z,bait:invCount('mato')>0,rod,sp:null,ten:0,prog:0});
  if(FS.bait)invRemove('mato',1);fishWaitPlan(true);P.atk={t:0,dur:.5,hitAt:.25,done:true,w:{},offBusy:true};P.yaw=camYaw+Math.PI;plSnd('onkiminen','heitto',{v:.8});fishMeshes(true);}
function fishWaitPlan(first){const wb=FS.body,base=FISH_WAIT[0]+Math.random()*(FISH_WAIT[1]-FISH_WAIT[0]);let t=base*FS.rod.k*(FS.bait?FISH_BAIT_K:1)/fishActivity(wb);
  if(!first)t*=.45;if(DEV&&typeof DEVF!=='undefined'&&DEVF.fishFast)t=3;FS.biteAt=FS.t+Math.max(DEV&&DEVF.fishFast?3:FISH_MIN,t);FS.nibAt=FS.t+4+Math.random()*12;}
function fishHook(){FS.st='hooked';const r=Math.random();let acc=0,junk=null;const F=fishF(),have=id=>invCount(id)>0;
  for(const [id,p] of FISH_JUNK){let q=p;if(id==='pulloposti'&&(F.sunkO||F.sunkK||have('pulloposti')||!SUNK))q=0;if(id==='ruostavain'){if(F.sunkO||have('ruostavain')||!SUNK)q=0;else if(F.sunkK)q=.03;}acc+=q;if(r<acc){junk=id;break;}}
  if(junk){FS.sp=junk;FS.kg=0;FS.st='reel';FS.t2=0;plSnd('onkiminen','kelaus',{v:.6});return;}
  const sp=fishPick(FS.body)||'ahven',B=FISH_B[sp],q=Math.random();FS.sp=sp;FS.kg=+(B.kg[0]+(B.kg[1]-B.kg[0])*q*q*(.6+.4*Math.random())).toFixed(2);
  if(B.big&&FS.kg>B.kg[0]+(B.kg[1]-B.kg[0])*.18){FS.st='fight';FS.ten=.15;FS.prog=.08;FS.pullT=1+Math.random();FS.pullOn=false;FS.fightT=0;msg(`Iso kala koukussa! Pidä vasenta pohjassa kelataksesi – päästä irti, kun siima kiristyy.`,'quest');}
  else{FS.st='reel';FS.t2=0;}plSnd('onkiminen','kelaus',{v:.6});}
function fishLoseBait(p){if(FS.bait&&Math.random()<p){FS.bait=false;return true;}return false;}
function fishReset(m,cls){if(m)msg(m,cls);FS.st='idle';FS.sp=null;fishMeshes(false);fishHud();}
// v3.08 käyttäjä: vavan kärki taipuu alaspäin – levossa hieman, kääntyessä/liikkuessa heilahtaen, tärpissä nykäisten ja väsytyksessä jännityksen mukaan
const RODB={b:0,v:0,yaw:null};
function rodBendTick(dt){const h=typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.bend;if(!h||!h.length)return;const yw=camYaw,dy=RODB.yaw==null?0:Math.atan2(Math.sin(yw-RODB.yaw),Math.cos(yw-RODB.yaw));RODB.yaw=yw;
  const tg=.05+(FS.st==='fight'?.25+FS.ten*.55:0)+(FS.st==='bite'?.22:0)+(FS.dip||0)*.15+Math.min(.25,Math.hypot(P.vel.x,P.vel.z)*.012);
  RODB.v+=((tg-RODB.b)*60-RODB.v*7)*dt+Math.abs(dy)*4;RODB.b+=RODB.v*dt;RODB.b=clamp(RODB.b,-.1,.9);h[0].rotation.x=RODB.b*.35;if(h[1])h[1].rotation.x=RODB.b*.65;}
function fishTick(dt){const rod=rodDef();rodBendTick(dt);if(typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.hook){const hk=heldMesh.userData.hook;hk.visible=FS.st==='idle';if(hk.visible&&hk.parent){hk.parent.updateMatrixWorld();hk.quaternion.copy(hk.parent.getWorldQuaternion(_fsQ).invert());}}   /* v3.07 koukku roikkuu pystyyn */if(FS.st!=='idle'){FS.t+=dt;
    if(!rod||P.dead||P.inDun||P.swim||state==='dead'||dist2(P.pos.x,P.pos.z,FS.ox,FS.oz)>FISH_KEEP_R*FISH_KEEP_R){fishReset(rod&&!P.dead?'Siima kelautui sisään – pysy paikallasi onkiessa.':null);return;}
    if(FS.st==='cast'&&FS.t>.55){FS.st='wait';plSnd('onkiminen','loiskahdus',{v:.7,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});}
    else if(FS.st==='wait'){if(FS.t>=FS.nibAt){FS.nibAt=FS.t+5+Math.random()*18;FS.dip=.35;plSnd('onkiminen','nykaisy',{v:.35,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});
        if(FS.bait&&Math.random()<FISH_STEAL){FS.bait=false;FS.biteAt=FS.t+(FS.biteAt-FS.t)/FISH_BAIT_K;msg('Syötti katosi koukusta.');}}
      if(FS.t>=FS.biteAt){FS.st='bite';FS.win=FISH_WIN+(FS.rod.ten>1.4?.1:0);FS.dip=1;plSnd('onkiminen','tarppays',{v:.9,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});msg('Tärppää!','quest');}}
    else if(FS.st==='bite'){FS.win-=dt;if(FS.win<=0){const lost=fishLoseBait(.5);msg(lost?'Kala pääsi karkuun – ja vei syötin.':'Kala pääsi karkuun. Odota uutta tärppiä.','warn');FS.st='wait';fishWaitPlan(false);}}
    else if(FS.st==='reel'){FS.t2+=dt;const k=Math.min(1,FS.t2/.9);FS.bx=lerp(FS.bx,P.pos.x,k*.12);FS.bz=lerp(FS.bz,P.pos.z,k*.12);if(FS.t2>=.9)fishLand();}
    else if(FS.st==='fight')fishFight(dt);
    if(FS.dip>0)FS.dip=Math.max(0,FS.dip-dt*1.6);fishMeshUpd();fishHud();}
  // vesien nimet: rantaan tultaessa hienovaraisesti (kerran minuutissa samalle vedelle)
  FS.wbT-=dt;if(FS.wbT<=0){FS.wbT=1;if(!P.inDun){let wb=null;for(let a=0;a<8&&!wb;a++){const x=P.pos.x+Math.cos(a/8*TAU)*7,z=P.pos.z+Math.sin(a/8*TAU)*7;if(terrainH(x,z)<-.45)wb=wbAt(x,z);}
      if(wb&&wb!==FS.last){const F=fishF();if(!F.wb[wb.id]){F.wb[wb.id]=1;wbShow(wb.name,true);}}FS.last=wb;}}}   // v3.07 käyttäjä: nimi näkyy vain kerran, kun vesi löytyy (ennen joka kerta pelin alkaessa)
function fishFight(dt){const B=FISH_B[FS.sp],S=.45+.55*clamp((FS.kg-B.kg[0])/(B.kg[1]-B.kg[0]),0,1),hold=mouseL&&locked&&P.stam>0;FS.fightT+=dt;
  FS.pullT-=dt;if(FS.pullT<=0){FS.pullOn=!FS.pullOn;FS.pullT=FS.pullOn?.5+Math.random()*.9:1.2+Math.random()*1.8;if(FS.pullOn){FS.dip=1;plSnd('onkiminen','nykaisy',{v:.6,pos:{x:FS.bx,y:water.position.y,z:FS.bz}});}}
  if(hold){FS.prog+=dt*(FS.pullOn?.03:.16)/(.6+S*.6);FS.ten+=dt*(FS.pullOn?1.05*S:.18*S)/FS.rod.ten;P.stam-=dt*4;P.stamDelay=Math.max(P.stamDelay,.5);FS.kelT-=dt;if(FS.kelT<=0){FS.kelT=.45;plSnd('onkiminen','kelaus',{v:.45});}}
  else{FS.ten-=dt*.55;FS.prog-=dt*(FS.pullOn?.06:.015)*S;}
  FS.ten=clamp(FS.ten,0,1.01);FS.prog=clamp(FS.prog,0,1);const k=FS.prog;FS.bx=lerp(FS.bx,P.pos.x,dt*k*.4);FS.bz=lerp(FS.bz,P.pos.z,dt*k*.4);
  if(FS.ten>=1){fishLoseBait(1);plSnd('onkiminen','siima_katkeaa',{v:.9});fishReset(`Siima katkesi! ${ITEMS[FS.sp].n} pääsi karkuun.`,'warn');return;}
  if(FS.fightT>120){fishLoseBait(.5);fishReset('Kala irtosi koukusta.','warn');return;}
  if(FS.prog>=1)fishLand();}
function fishLand(){const id=FS.sp,F=fishF();if(!id){fishReset();return;}
  if(!FISH_B[id]){giveOrDrop(id,1,P.pos.x,P.pos.y+1,P.pos.z);plSnd('onkiminen','roska',{v:.7});
    if(id==='saapas'){setTimeout(()=>plSnd('moka','kirous',{v:.9}),500);msg('Vanha saapas… ei ihan sitä mitä toivoit.','warn');}
    else if(id==='pulloposti')msg('Koukussa on pullo, jossa on kirje! Käytä sitä lukeaksesi.','loot');
    else if(id==='ruostavain')msg('Koukkuun tarttui ruostunut avain. Mihin lukkoon se mahtaa sopia?','loot');
    else if(id==='hiidensiru')msg('Koukussa hohtaa hiidenkiven siru!','loot');
    else msg(`Koukkuun oli tarttunut ${ITEMS[id].n.toLowerCase()}!`,'loot');
    if(FS.bait&&Math.random()<.5)FS.bait=false;fishReset();return;}
  if(invAdd(id,1)>0){spawnDrop(id,1,P.pos.x,P.pos.y+1,P.pos.z);msg('Reppu on täynnä – kala putosi maahan.','warn');}
  const rec=F.rec[id]||0,first=!F.n[id];F.n[id]=(F.n[id]||0)+1;bump('fish');plSnd('onkiminen','saalis',{v:.85});
  const kgT=FS.kg.toFixed(2).replace('.',',');if(FS.kg>rec){F.rec[id]=FS.kg;}
  msg(`${first?'Uusi laji! ':''}${ITEMS[id].n} ${kgT} kg${rec&&FS.kg>rec?' – uusi ennätys!':''}`,'loot');
  addXp(Math.round((FISH_DEF[id].k>=2?8:FISH_DEF[id].k>1?4:2)+(rec&&FS.kg>rec?3:0)+(first?5:0)),'kala');
  if(!invCount('kalakirja')&&!F.book){F.book=1;giveOrDrop('kalakirja',1,P.pos.x,P.pos.y+1,P.pos.z);msg('Aloitit kalastajan kirjan – kaikki saaliisi kirjataan siihen.','quest');}
  fishGoals();FS.bait=false;fishReset();}
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
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(10*3),3));FS.line=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xe8e8e0,transparent:true,opacity:.75}));FS.line.frustumCulled=false;scene.add(FS.line);}
  if(FS.bob){FS.bob.visible=on;FS.line.visible=on;}}
const _fsTip=new THREE.Vector3(),_fsQ=new THREE.Quaternion();
function fishMeshUpd(){if(!FS.bob)return;const wy=water.position.y;let bx=FS.bx,bz=FS.bz,by=wy+.02+Math.sin(playTime*2.2)*.012-(FS.dip||0)*.12-(FS.st==='fight'?.08:0);
  if(typeof heldMesh!=='undefined'&&heldMesh&&heldMesh.userData.tip){heldMesh.updateMatrixWorld(true);heldMesh.userData.tip.getWorldPosition(_fsTip);}else if(typeof heldMesh!=='undefined'&&heldMesh){heldMesh.updateMatrixWorld(true);_fsTip.set(0,0,ROD_LEN-.1);heldMesh.localToWorld(_fsTip);}else _fsTip.set(P.pos.x,P.pos.y+1.6,P.pos.z);
  if(FS.st==='cast'){const k=Math.min(1,FS.t/.55);bx=lerp(_fsTip.x,FS.bx,k);bz=lerp(_fsTip.z,FS.bz,k);by=lerp(_fsTip.y,by,k)+Math.sin(k*Math.PI)*2.2;}
  FS.bob.position.set(bx,by,bz);const a=FS.line.geometry.attributes.position,sag=FS.st==='fight'?.05:.6;
  for(let i=0;i<10;i++){const t=i/9;a.setXYZ(i,lerp(_fsTip.x,bx,t),lerp(_fsTip.y,by+.1,t)-Math.sin(t*Math.PI)*sag*(FS.st==='cast'?0:1),lerp(_fsTip.z,bz,t));}a.needsUpdate=true;}
/* ---------------- HUD: tärppi ja väsytys ---------------- */
function fishHud(){const el=document.getElementById('fishHud');if(!el)return;const on=FS.st==='bite'||FS.st==='fight'||FS.st==='wait';el.hidden=!on;if(!on)return;
  el.className=FS.st==='bite'?'bite':FS.st==='fight'?'fight':'wait';
  if(FS.st==='bite'){el.innerHTML='<b>!</b><span>Tärppää – vasen!</span>';return;}
  if(FS.st==='wait'){el.innerHTML=`<span>${FS.body?FS.body.name:''}${FS.bait?' · syötti: mato':''} · vasen kelaa sisään</span>`;return;}
  el.innerHTML=`<div class="fl">Väsytys: ${ITEMS[FS.sp].n}</div><div class="fb"><i class="ten${FS.ten>.8?' hi':''}" style="width:${Math.round(FS.ten*100)}%"></i></div><div class="fb"><i class="pr" style="width:${Math.round(FS.prog*100)}%"></i></div><div class="fh">${FS.pullOn?'Kala vetää – päästä irti!':'Kelaa: pidä vasenta'}</div>`;}
function wbShow(name,isNew){const el=document.getElementById('wbName');if(!el)return;el.textContent=name;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');if(isNew)msg(`Löysit veden: ${name}`,'loot');}
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
/* ---------------- KALASTAJAN KIRJA ---------------- */
function fishBookOpen(){if(openPanel!=='fish')togglePanel('fish');else fishBookRender();}
function fishBookRender(){const el=document.getElementById('fishBody');if(!el)return;const F=fishF(),tot=fishTotal(F);
  const rows=Object.keys(FISH_B).map(sp=>{const B=FISH_B[sp],n=F.n[sp]||0,best=B.t.indexOf(Math.max(...B.t)),wx=Object.entries(B.wx).sort((a,b)=>b[1]-a[1])[0],wt={lake:'järvet',sea:'meri',bog:'suolammet'}[B.w];
    return n?`<tr><td><span class="ic" style="background-image:url(${icon(sp)})"></span>${ITEMS[sp].n}</td><td>${n}</td><td>${(F.rec[sp]||0).toFixed(2).replace('.',',')} kg</td><td>${wt}</td><td>${FISH_PH[best]}${wx&&wx[1]>1?', '+FISH_WXN[wx[0]]:''}</td></tr>`
      :`<tr class="na"><td><span class="ic q">?</span>???</td><td>0</td><td>–</td><td>${wt}</td><td>–</td></tr>`;}).join('');
  const ws=WBS.filter(w=>F.wb[w.id]).map(w=>`<li>${w.name} <small>(${{lake:'järvi',sea:'meri',bog:'suolampi'}[w.type]})</small></li>`).join('')||'<li class="note">Et ole vielä löytänyt nimettyjä vesiä.</li>';
  const gs=FISH_GOALS.map(g=>`<li class="${F.g[g.id]?'ok':''}">${F.g[g.id]?'✔':'○'} ${g.t} <small>+${g.xp} XP</small></li>`).join('');
  el.innerHTML=`<p class="note keep">Saaliita yhteensä ${tot}. Syöttiä (matoja): ${invCount('mato')}. Paras aika ja sää paljastuvat, kun saat lajin.</p><table class="fishT"><tr><th>Laji</th><th>Saatu</th><th>Ennätys</th><th>Vesi</th><th>Parhaiten</th></tr>${rows}</table>
    <div class="fishCols"><div><h3>Vedet</h3><ul>${ws}</ul></div><div><h3>Tavoitteet</h3><ul class="fg">${gs}</ul></div></div>${F.sunkK&&!F.sunkO?'<p class="note">Pullopostin arkku on merkitty karttaan (✕).</p>':''}`;}
/* ---------------- KATISKA, SAVUSTIN, KALANAULAKKO ---------------- */
const SAV_HEAT_T=30,SAV_COOL_T=90,KAT_T=900,KAT_BAIT_K=.6,KAT_MAX=3,KAT_BAIT_MAX=5,SAV_T=180,SAV_MAX=6,SAV_WOOD=2;
function katInWater(p){return terrainH(p.x,p.z)<water.position.y-.3;}
function katTick(p,dt){const d=p.data;d.f=d.f||[];if(!katInWater(p)||d.f.length>=KAT_MAX)return;d.t=(d.t||0)+dt*(d.b>0?1/KAT_BAIT_K:1);
  if(d.t>=KAT_T){d.t=0;const wb=wbAt(p.x,p.z);if(!wb)return;const sp=fishPick(wb);if(sp&&FISH_DEF[sp].k<2){d.f.push(sp);if(d.b>0)d.b--;}}}
function katLabel(p){const d=p.data;if(!katInWater(p))return 'Katiska – aseta se veteen (vähintään 0,3 m)';if(d.f&&d.f.length)return `Katiska: ${d.f.length} kalaa – ota (E)`;return `Katiska: odottaa kaloja${d.b?` · syöttiä ${d.b}`:''}${invCount('mato')&&(d.b||0)<KAT_BAIT_MAX?' – E lisää madon':''}`;}
function katInteract(p){const d=p.data;d.f=d.f||[];if(d.f.length){for(const sp of d.f){giveOrDrop(sp,1,p.x,p.y+1,p.z);bump('fish');const F=fishF();F.n[sp]=(F.n[sp]||0)+1;}d.f=[];sfx('pickup');plSnd('onkiminen','saalis',{v:.6});fishGoals();return;}
  if(invCount('mato')&&(d.b||0)<KAT_BAIT_MAX){invRemove('mato',1);d.b=(d.b||0)+1;msg(`Laitoit madon katiskaan (${d.b}/${KAT_BAIT_MAX}) – kaloja tulee nopeammin.`);return;}
  msg(katInWater(p)?'Katiskassa ei ole vielä kaloja (noin 15 min / kala, syötillä nopeammin).':'Katiska toimii vain vedessä.');}
function savTick(p,dt){const d=p.data,on=!!(d.q&&d.q.length);d.heat=clamp((d.heat||0)+(on?dt/SAV_HEAT_T:-dt/SAV_COOL_T),0,1);heatGlow(p.mesh.userData.glow,d.heat*.8,SMELT_DARK);if(!on)return;d.t=(d.t||0)+dt;if(dist2(p.x,p.z,P.pos.x,P.pos.z)<35*35&&Math.random()<dt*2)emitEmber(p.x+(Math.random()-.5)*.4,p.y+1.6,p.z+(Math.random()-.5)*.4,'smoke');
  if(d.t>=SAV_T){let n=0;for(const sp of d.q){const k=FISH_DEF[sp].k;n+=k>=2?2:k>1?(Math.random()<.5?2:1):1;}d.out=(d.out||0)+n;d.q=[];d.t=0;}}
function savLabel(p){const d=p.data;if(d.out)return `Savustin: ${d.out} savukalaa valmiina – ota (E)`;if(d.q&&d.q.length)return `Savustin: ${d.q.length} kalaa savussa – valmis ${mmss(SAV_T-(d.t||0))}`;return 'Savustin – E: laita raa\'at kalat savuun (2 puuta)';}
function savInteract(p){const d=p.data;if(d.out){giveOrDrop('savukala',d.out,p.x,p.y+1,p.z);d.out=0;sfx('pickup');return;}if(d.q&&d.q.length){msg('Kalat ovat vielä savussa.');return;}
  const raw=Object.keys(FISH_DEF).filter(id=>invCount(id)>0);if(!raw.length){msg('Tarvitset raakaa kalaa.','warn');return;}if(invCount('puu')<SAV_WOOD){msg(`Savustukseen tarvitaan ${SAV_WOOD} puuta.`,'warn');return;}
  invRemove('puu',SAV_WOOD);d.q=[];for(const id of raw){while(invCount(id)>0&&d.q.length<SAV_MAX){invRemove(id,1);d.q.push(id);}}d.t=0;sfx('build');msg(`Savustimeen: ${d.q.length} kalaa (valmis ${mmss(SAV_T)}).`);}
function nauLabel(p){const d=p.data;if(d.f)return `Kalanaulakko: ${ITEMS[d.f].n} ${(+d.kg).toFixed(2).replace('.',',')} kg`;return 'Kalanaulakko – E: ripusta ennätyskala';}
function nauInteract(p){const d=p.data,F=fishF();if(d.f){msg(`${ITEMS[d.f].n} ${(+d.kg).toFixed(2).replace('.',',')} kg – ennätyksesi on ${(F.rec[d.f]||0).toFixed(2).replace('.',',')} kg.`);return;}
  const c=Object.keys(FISH_DEF).filter(id=>invCount(id)>0).sort((a,b)=>(F.rec[b]||0)-(F.rec[a]||0))[0];if(!c){msg('Tarvitset raa\'an kalan ripustettavaksi (lajin ennätyspaino merkitään).','warn');return;}
  invRemove(c,1);d.f=c;d.kg=F.rec[c]||.5;nauVis(p);sfx('build');msg(`Ripustit naulakkoon: ${ITEMS[c].n} ${(+d.kg).toFixed(2).replace('.',',')} kg.`,'loot');}
function nauVis(p){const g=p.mesh&&p.mesh.userData.fishM;if(!g)return;while(g.children.length)g.remove(g.children[0]);const d=p.data;if(!d.f)return;const f=FISH_DEF[d.f],L=.35+.12*f.k*Math.min(2,Math.sqrt(d.kg||1));
  const b=new THREE.Mesh(new THREE.SphereGeometry(.5,10,7),mat(new THREE.Color(f.c).getHex(),{roughness:.5}));b.scale.set(L,L*.32,L*.12);g.add(b);
  const t=new THREE.Mesh(new THREE.ConeGeometry(L*.22,L*.35,4),mat(new THREE.Color(f.c).getHex()));t.rotation.z=Math.PI/2;t.position.x=-L*.6;t.scale.z=.25;g.add(t);for(const o of g.children)o.userData.piece=p;}
Object.assign(COOKABLE,Object.fromEntries(Object.keys(FISH_DEF).map(id=>[id,id+'p'])));   // nuotio ja grilli paistavat kalat
for(const id in FISH_DEF){const k=FISH_DEF[id].k;COOK_T[id]=k>=2?[9,4]:k>1?[7,3]:[5,2];}
sunkBuild();
