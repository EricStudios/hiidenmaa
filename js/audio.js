/* Hiidenmaa – audio.js
   Äänet: vain käyttäjän omat tiedostoäänet (olennot, toiminnot); sfx() on hiljainen koukku tuleville projekteille (v2.22) */
'use strict';

/* ---------------- AUDIO ---------------- */
let actx=null, soundOn=true;
/* v2.53 ÄÄNENVOIMAKKUUS (Asetukset › Äänet ja musiikki): master × kategoria × perustaso. 100 % = entinen oletus (VOL_BASE); säätimet 0–150 %.
   Mykistys: Äänet (soundOn), Musiikki (musicOn), Ääniefektit (sfxOn = kaikki muu kuin musiikki). Sama kaava boot.js:ssä (bsVolK). */
/* v2.58 (käyttäjä) KUULUVUUS: kaikkien 3D-äänten kuuluvuusetäisyydet × SND_DIST_K 0,8 (olennot: laukaisusäteet CRE_*_R ja paneri; toiminnot
   TG_RK; pelaaja plSnd-paneri; kaukainen ulvonta ja Kalmanvartijan kaiku). TILA: olennon ääni vain samassa tilassa (creSpaceOk: maailma /
   Hautakumpu / sama ulottuvuus) – soivat äänet katkeavat, kun pelaaja vaihtaa tilaa (myös pomojen kaiut). */
const SND_DIST_K=.8;
function creSpaceOk(m){if(!m)return true;return m.dun?(!!P.inDun&&(m.realm===undefined||m.realm===(P.realm||null))):!P.inDun;}
const VOL_BASE={cre:.8,pl:.8,ui:.7,amb:.7,notif:.7,music:1},VOL_KEY={cre:'creVol',pl:'plVol',ui:'uiVol',amb:'ambVol',notif:'notifVol',music:'musicVol'};
function volK(c){if(typeof SET==='undefined')return VOL_BASE[c]||1;if(SET.sound===false||(c==='music'?SET.musicOn===false:SET.sfxOn===false))return 0;
  return (+(SET.volMaster??1))*(+(SET[VOL_KEY[c]]??1))*(VOL_BASE[c]||1);}
function audio(){if(!actx){try{actx=window.__AC||new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return actx;}   // v2.52 sama konteksti kuin boot.js (__AC)
/* v2.22 (käyttäjän päätös): KOODILLA GENEROIDUT ÄÄNET POISTETTU KOKONAAN. Peli soittaa vain käyttäjän omia ääniä (sounds/-projektit,
   manifest.json). sfx(nimi) on hiljainen koukku: kutsut jäävät paikoilleen, jotta tulevat ääniprojektit (pelaaja, maailma, käyttöliittymä)
   voidaan kytkeä samoihin kohtiin. Koukkujen nimet (KEHITYSMUISTIO "Äänikoukut"): pickup, build, craft, hit, slam, roar, crumble, die,
   swing, hurt, eat, bow, thud, pick, howl, flap, discover, block, chop, chopFinal, chopLog, logBreak, rockBreak, woodBreak. */
const SFX_HOOKS=new Set(['pickup','build','craft','hit','slam','roar','crumble','die','swing','hurt','eat','bow','thud','pick','howl','flap','discover','block',
  'chop','chopFinal','chopLog','logBreak','rockBreak','woodBreak']);
function sfx(type,pitch=1,vol=1){}   // hiljainen koukku (ei generoitua ääntä)

/* ---------------- OLENTOJEN ÄÄNET (v1.84, äänierä A – ks. KEHITYSMUISTIO "Äänisuunnitelma", sounds/AANILISTA.md) ----------------
   Tiedostoäänet sounds/<id>_<laji>_<n>.mp3 (käsitelty tools/process_sounds.py:llä; peli lukee vain manifest.json:ssa olevat).
   Lajit: idle (1–2), hurt, death, aggro (hyökkäävät). Laiska lataus kun olento ilmestyy, 3D-ääni (PannerNode), sävel ±6 %.
   VARAANI: väliaikainen varaääniketju, jos olennolla ei ole omaa ääntä (to = mistä, p = sävelkerroin). Ketju seurataan useampi
   askel (kerroin kertautuu). Jos idle_2 puuttuu → idle_1. Jos mitään ei löydy → hiljaisuus (v2.22: ei generoituja ääniä).
   Lohko VARAANI-ALKU…LOPPU on tiukkaa JSONia: tools/process_sounds.py lukee sen taulukkoa varten – pidä muoto. */
const VARAANI=/*VARAANI-ALKU*/{
  "kalmasusi":{"to":"susi","p":0.88},"routasusi":{"to":"susi","p":1.06},"kettu":{"to":"susi","p":1.35},"janis":{"to":"kettu","p":1.2},
  "ilves":{"to":"susi","p":1.15},"ahma":{"to":"ilves","p":1.1},
  "emakko":{"to":"karju","p":1.08},"porsas":{"to":"karju","p":1.5},
  "hiidenkarhu":{"to":"karhu","p":0.85},
  "hiidenhirvi":{"to":"hirvi","p":0.82},"poro":{"to":"peura","p":0.9},"peura":{"to":"hirvi","p":1.3},
  "ylimys":{"to":"kalmo","p":0.85},"vartija":{"to":"aarnihirvio","p":0.7},
  "jaajattari":{"to":"aarnihirvio","p":1.2},"kalmaherra":{"to":"aarnihirvio","p":0.85},"suonakki":{"to":"hiisi","p":0.7}
}/*VARAANI-LOPPU*/;
// v2.16: täysin hiljaiset kunnes omat tiedostoäänet (ei lainausta). v2.23: kivivartija sai omat äänet → lista tyhjä (pidetään tuleville)
const CRE_SILENT=new Set([]);
function mobBurning(m){return !m.dead&&(m.burnT>0||!!m.sunBurn);}   // v2.17
const CRE_AGGRO=['neutral','hostile','boss','rboss'];   // niillä on suuttumisääni (aggro)
const CRE_CHASE=['hostile','boss','rboss'];             // niillä on lisäksi toistuva jahtiääni (chase) ja suuttumisääni vain kerran
const CRE_ECHO=['rboss','boss'];                         // v1.88: pomoilla lisäksi kaikuääni (echo, 1–2 versiota): kuuluu kaukaa kunnes pelaaja kohtaa pomon (v1.95: myös Kalmanvartija maan alta)
const CRE_KINDS=['idle','hurt','death','aggro','chase','echo'];  // v2.11: versioita rajattomasti (_1, _2 … _9 …), arvonta niistä jotka ovat manifestissa
const CRE={man:null,idx:{},ok:false,buf:{},load:{},want:{},gain:null,voices:[],max:10,last:{},lastAmb:-9,rev:null};
// manifest kerran (tiiviste osoitteessa → välimuisti ei anna vanhaa ääntä). Ilman palvelinta (file://) epäonnistuu hiljaa.
function creInit(){if(CRE.man)return;CRE.man={};
  try{fetch('sounds/manifest.json?v='+(window.HV||'')).then(r=>r.ok?r.json():null).then(j=>{CRE.man=(j&&j.sounds)||{};creIndex();CRE.ok=true;for(const t in CRE.want)creLoad(t);if(typeof mLoad==='function')mLoad();}).catch(()=>{});}catch(e){}}
// v2.11: hakemisto '<id>_<laji>' → kaikki manifestin versiot numerojärjestyksessä (idle_4, idle_5 … toimivat ilman koodimuutosta)
function creIndex(){const I={};for(const n in CRE.man){const m=/^(.+)_(\d+)$/.exec(n);if(m)(I[m[1]]||(I[m[1]]=[])).push([+m[2],n]);}
  CRE.idx={};CRE.idxOf=CRE.man;for(const k in I)CRE.idx[k]=I[k].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
// ratkaisee lajin äänet: omat versiot (kaikki olemassa olevat) → muuten varaääniketju. Palauttaa {names:[…], p} tai null.
function creRes(id,kind){const M=CRE.man;if(!M)return null;if(CRE.idxOf!==M)creIndex();let cur=id,p=1;
  for(let d=0;d<6&&cur;d++){const L=CRE.idx[`${cur}_${kind}`];if(L&&L.length)return{names:L,p};const v=VARAANI[cur];if(!v)break;p*=v.p;cur=v.to;}
  // v1.88: kaikuäänen pääääni on Aarnihirviö (💎): pomo ilman omaa kaikuääntä lainaa sen, vaikka VARAANI-ketju ei johtaisi sinne
  if(kind==='echo'&&id!=='aarnihirvio'&&MOBDEF[id]&&CRE_ECHO.includes(MOBDEF[id].ai)){const L=CRE.idx.aarnihirvio_echo;if(L&&L.length)return{names:L,p:1};}
  return null;}
function creBuf(name){if(CRE.buf[name]||CRE.load[name])return;const a=audio(),e=CRE.man&&CRE.man[name];if(!a||!e)return;
  CRE.load[name]=fetch(`sounds/${e.f||name+'.mp3'}?h=${e.h}`)   /* v2.16: projektikansiot (manifestin f-polku) */.then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();}).then(b=>a.decodeAudioData(b)).then(B=>{CRE.buf[name]=B;}).catch(()=>{});}
// laiska lataus: olennon kaikki äänet (myös varaäänet) haetaan kun se ilmestyy ensimmäisen kerran
function creLoad(type){creInit();CRE.want[type]=1;if(!CRE.ok)return;const ai=typeof MOBDEF!=='undefined'&&MOBDEF[type]&&MOBDEF[type].ai;
  for(const k of CRE_KINDS){if(k==='aggro'&&!CRE_AGGRO.includes(ai))continue;if(k==='chase'&&!CRE_CHASE.includes(ai))continue;if(k==='echo'&&!CRE_ECHO.includes(ai))continue;const r=creRes(type,k);if(r)for(const n of r.names)creBuf(n);}tgLoad(type);}
function crePos(pn,x,y,z){if(pn.positionX){pn.positionX.value=x;pn.positionY.value=y;pn.positionZ.value=z;}else pn.setPosition(x,y,z);}
// ---- toistosäännöt (v1.86) ----
// Tärkeys: kuolema 5 > osuma 4 > suuttuminen 3 > jahti 2 > rauhallinen 1. Yhdellä olennolla soi kerrallaan vain yksi ääni
// (tärkeämpi katkaisee heikomman nopealla häivytyksellä, heikompi ei katkaise vahvempaa). Kuolema vaientaa olennon muut äänet.
// Kaikkiaan enintään CRE.max ääntä: täyden ollessa uusi syrjäyttää heikoimman (tasatilanteessa kaukaisimman), tai jää pois jos on heikompi kuin kaikki.
// Rauhallisia ja jahtiääniä saa samaa lajia soida enintään 3, ja uusi alkaa aikaisintaan 0,3 s edellisen jälkeen (ei kuoroa).
// Sama versio ei toistu heti perään (jos versioita on useita).
// v2.10: suuttumisäänen lupa (olento 15 s, laji 6 s); varaa vuoron heti, jotta samassa ruudussa suuttuvat eivät soi päällekkäin
const CRE_AGT={};
function creAngerOk(m){const t=playTime;if(t-(m.agT??-99)<15||t-(CRE_AGT[m.type]??-99)<6)return false;m.agT=t;CRE_AGT[m.type]=t;return true;}
// v2.12 etäisyys: kutsuäänet (manifestin far=1: ulvonta, soidin, mylvintä) kuuluvat kauas, muut lähemmäs hiljaisempina. Kaukana ääni tummenee
// (alipäästö) ja saa enemmän kaikua (sama ConvolverNode kuin luolissa) → "kaukana"-tuntu. creDistK: 0 lähellä … 1 kantaman reunalla.
// v2.14 (käyttäjä): kutsuäänet 220 → 150 m, muut 80 → 64 m (−20 %), rauhallinen ääntely 45 → 36 m; efekti selvästi vahvempi: suora ääni −30 %
// kantaman reunalla, alipäästö puolimatkassa alle 1,5 kHz (15 kHz·(1−k)^4 + 500 Hz), kaiku jopa ~1,9 × ja pieni sävelhuojunta (LFO ≤ 30 senttiä).
const CRE_FAR_R=150*SND_DIST_K,CRE_NEAR_R=64*SND_DIST_K,CRE_IDLE_R=36*SND_DIST_K,CRE_WOLF=new Set(['susi','routasusi','kalmasusi']);
function creIsFar(name){const e=CRE.man&&CRE.man[name];return !!(e&&e.far);}
function creHasFar(type,kind){const r=creRes(type,kind);return !!(r&&r.names.some(creIsFar));}
/* v2.25 (käyttäjä): susien (CRE_WOLF) suuttumis- ja jahtiäänet 30 % hiljempaa ja kantama −20 %, ulvonnan (kutsuääni, far) kantama −15 %.
   creRK = kantamakerroin (laukaisusäde, etäisyysefekti, 3D-viite), CRE_WOLF_V = voimakkuus. Kaukainen yöulvonta 85–123 m (ennen 100–145). */
const CRE_WOLF_V={aggro:.7,chase:.7},CRE_WOLF_R={aggro:.8,chase:.8};
/* v2.57 (käyttäjä) SUSIELÄINTEN ULVONTA (kutsuääni, far): kuuluvuus × WOLF_HOWL_R 0,7 ja voimakkuus × WOLF_HOWL_V 0,7 aina; päivällä kuuluvuus
   lisäksi × WOLF_HOWL_DAY_R 0,6 (yhteensä 0,85 × 0,7 × 0,6 ≈ 0,36 alkuperäisestä). Kaukainen yöulvonta (farHowl) 60–86 m. */
const WOLF_HOWL_R=.7,WOLF_HOWL_V=.7,WOLF_HOWL_DAY_R=.6;
function wolfHowlRK(){return .85*WOLF_HOWL_R*(typeof isNight!=='function'||isNight()?1:WOLF_HOWL_DAY_R);}
function creRK(type,kind,far){return CRE_WOLF.has(type)?(CRE_WOLF_R[kind]||(kind==='idle'&&far?wolfHowlRK():1)):1;}
function creAgR(m){const f=creHasFar(m.type,'aggro');return ((f?CRE_FAR_R:CRE_NEAR_R)*creRK(m.type,'aggro',f))**2;}   // suuttumisäänen kantama (neliö)
function creDistK(d,far,rk){return clamp((d-8)/((far?CRE_FAR_R:CRE_NEAR_R)*(rk||1)-8),0,1);}
function creLpf(k){return 15000*Math.pow(1-k,4)+500;}
function creDistFx(v,d){const k=v.tg?tgDistK(d):creDistK(d,v.far,v.rk),now=actx.currentTime;if(v.df)v.df.frequency.setTargetAtTime(creLpf(k),now,.1);
  if(v.dg)v.dg.gain.setTargetAtTime(1-(v.tg?TG_DG:.3)*k,now,.1);if(v.lg)v.lg.gain.setTargetAtTime(30*k,now,.2);if(v.sdo)v.sdo.gain.setTargetAtTime(.08+1.8*k,now,.1);}
const CRE_PRI={idle:1,chase:2,aggro:3,hurt:4,death:5},CRE_G={idle:.75,chase:.9,aggro:1,hurt:1,death:1};
const CRE_VK=.8;   // v2.24 (käyttäjä): kaikki olentojen äänet 20 % hiljempaa
// Kaiku (vain ulottuvuuksien ja luolaston olennoille m.dun): yksi yhteinen ConvolverNode + proseduraalinen vastaus (1,2 s; ConvolverNode vaatii saman näytetaajuuden kuin ääni-AudioContext),
// pimeä (alipäästö 3,2 kHz). Kytkeytyy vain kun jokin kaiullinen ääni soi ja irtoaa 3 s sen jälkeen → ei kuormaa maailmassa.
function creRevMake(a){if(CRE.rev)return CRE.rev;const sr=a.sampleRate,len=Math.floor(sr*1.2),buf=a.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);let lp=0,seed=1234+c*777;for(let i=0;i<len;i++){seed=(seed*1664525+1013904223)>>>0;const n=seed/2147483648-1,t=i/len;
    lp+=(n-lp)*(.85-.6*t);d[i]=lp*Math.pow(1-t,2.6)*(i<sr*.012?i/(sr*.012):1);}}
  const cv=a.createConvolver();cv.normalize=true;cv.buffer=buf;const inp=a.createGain(),lp=a.createBiquadFilter(),out=a.createGain();lp.type='lowpass';lp.frequency.value=3200;out.gain.value=.9;
  inp.connect(lp);lp.connect(cv);cv.connect(out);CRE.rev={inp,cv,out,on:false,t:0};return CRE.rev;}
function creRevOn(a){const R=creRevMake(a);R.t=3;if(!R.on){R.out.connect(CRE.gain);R.on=true;}return R;}
function creRevTick(dt){const R=CRE.rev;if(!R||!R.on)return;if(CRE.voices.some(v=>v.sd)||TGV.v.some(v=>v.sd)){R.t=3;return;}R.t-=dt;if(R.t<=0){try{R.out.disconnect();}catch(e){}R.on=false;}}
function creStop(v,t){try{v.g.gain.setTargetAtTime(0,actx.currentTime,.03);v.src.stop(actx.currentTime+(t||.12));}catch(e){}}
// v1.88 kaikuääni: pomon paikasta, mutta enintään 38 m pelaajasta (kaukainen pomo kuuluu vaimeana kaikuna luolastossa, ei hiljaisuutena)
function creEchoPos(m,pn){let x=m.pos.x,z=m.pos.z;const dx=x-P.pos.x,dz=z-P.pos.z,d=Math.hypot(dx,dz);if(d>38){x=P.pos.x+dx/d*38;z=P.pos.z+dz/d*38;}crePos(pn,x,P.pos.y+1.6,z);}
// o (valinnainen): {p: sävelkerroin, v: voimakkuuskerroin, pri: tärkeys, key: oma laskuriavain, echo: kaukainen kaikuääni,
//   rev: pakotettu kaiun määrä (pomon kuolema), add: lisä-ääni joka ei katkaise olennon muita ääniä eikä katkea niistä} 
// soittaa olennon äänen 3D:nä (arpoo ladatuista versioista). Palauttaa äänen keston sekunteina, jos olennolla on tiedostoääni
// (silloin tehtyä ääntä ei soiteta), muuten false (ei ääntä tai vielä latautumassa).
/* v2.60 päällekkäisyysraja (käyttäjän sääntö; ei pelaajan ääniä, ei hurt/death): sama äänitiedosto enintään 3 päällekkäin; kun toinen päällekkäinen
   kopio alkaa → tiedostolle 1 s tauko; jos tiedosto on alkanut 3 kertaa 3 s sisällä → 8 s tauko; sama tiedosto ei uudelleen alle 0,15 s (kampasuodinilmiö).
   Estetyn tilalle arvotaan toinen versio; estettyä ei siirretä myöhemmäksi. Lisäksi sama olentolaji + äänilaji enintään 3 kerralla (perKind). */
const CRE_OVL={kinds:new Set(['idle','chase','aggro','echo']),max:3,cd2:1,win:3,n3:3,cd3:8,gap:.15,perKind:3};
CRE.fcd={};CRE.fh={};CRE.skip=0;
function creFileN(n){let c=0;for(const v of CRE.voices)if(v.name===n)c++;return c;}
function creFileOk(n,t){if((CRE.fcd[n]||0)>t)return false;const h=CRE.fh[n];if(h&&h.length&&t-h[h.length-1]<CRE_OVL.gap)return false;return creFileN(n)<CRE_OVL.max;}
function creFileUse(n,t){const h=(CRE.fh[n]=(CRE.fh[n]||[]).filter(x=>t-x<CRE_OVL.win));h.push(t);let cd=0;
  if(creFileN(n)>=2)cd=CRE_OVL.cd2;if(h.length>=CRE_OVL.n3)cd=CRE_OVL.cd3;if(cd)CRE.fcd[n]=Math.max(CRE.fcd[n]||0,t+cd);}
/* v2.67 (käyttäjä): ulottuvuuksissa tavallisten olentojen idle-ääni (myös ulvonta) vain jos olento on alle REALM_IDLE_R m päässä, ja koko
   ulottuvuudessa enintään yksi idle-ääni REALM_IDLE_GAP s välein. Pomot ja muut äänilajit ennallaan. */
const REALM_IDLE_R=15,REALM_IDLE_GAP=40;let realmIdleT=-1e9;
function realmIdleOk(m){if(!m.dun||!m.realm||m.def.ai==='boss'||m.def.ai==='rboss')return true;const t=performance.now()/1000;
  if(t<realmIdleT||dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z)>REALM_IDLE_R*REALM_IDLE_R)return false;realmIdleT=t+REALM_IDLE_GAP;return true;}
function creSnd(m,kind,o){if(!m)return false;if(kind==='idle'&&!realmIdleOk(m))return false;const r=creRes(m.type,kind);if(!r)return false;
  let L=r.names.filter(n=>CRE.buf[n]);if(o&&o.farOnly)L=L.filter(creIsFar);if(!L.length){for(const n of r.names)creBuf(n);return false;}
  const key=m.type+'_'+(o&&o.key||kind),ovl=CRE_OVL.kinds.has(kind),tn=performance.now()/1000;let blk=false;
  if(ovl){const L2=L.filter(n=>creFileOk(n,tn));if(L2.length)L=L2;else blk=true;}   // v2.60 estetty tiedosto → toinen versio, kaikki estetty → hiljaa
  let pick=L;if(L.length>1&&CRE.last[key])pick=L.filter(n=>n!==CRE.last[key]);
  const name=pick[Math.random()*pick.length|0],B=CRE.buf[name],rate=r.p*(o&&o.p||1)*(1+(Math.random()*2-1)*.06),dur=B.duration/rate;
  const a=actx;if(!a||a.state!=='running'||!soundOn)return dur;const vol=volK('cre');if(!(vol>0))return dur;
  if(blk){CRE.skip++;return dur;}
  const pri=o&&o.pri||CRE_PRI[kind]||1,now=a.currentTime,amb=pri<=2,boss=m.def.ai==='boss'||m.def.ai==='rboss';
  const ec=!!(o&&o.echo),rv=o&&o.rev,addv=!!(o&&o.add);
  if(!CRE.gain){CRE.gain=a.createGain();CRE.gain.connect(sndBus(a));}CRE.gain.gain.value=vol;
  // olennon oma ääni: heikompi ei katkaise, samanarvoinen vasta kun edellinen on soinut hetken
  if(!addv)for(const v of CRE.voices)if(v.m===m){if(v.pri>pri||(v.pri===pri&&now-v.t0<.35))return dur;}
  if(amb&&now-CRE.lastAmb<.3)return dur;
  if(ovl){let n=0;for(const v of CRE.voices)if(v.key===key)n++;if(n>=CRE_OVL.perKind){CRE.skip++;return dur;}}   // v2.60 sama olentolaji + laji enintään 3 (ennen vain idle/chase)
  if(!addv)for(const v of CRE.voices.slice())if(v.m===m){creStop(v);CRE.voices.splice(CRE.voices.indexOf(v),1);}
  if(CRE.voices.length>=CRE.max){let w=null,wd=-1;for(const v of CRE.voices){const d=dist2(v.m.pos.x,v.m.pos.z,P.pos.x,P.pos.z);if(!w||v.pri<w.pri||(v.pri===w.pri&&d>wd)){w=v;wd=d;}}
    if(!w||w.pri>pri)return dur;creStop(w,.08);CRE.voices.splice(CRE.voices.indexOf(w),1);}
  if(amb)CRE.lastAmb=now;CRE.last[key]=name;
  const src=a.createBufferSource(),g=a.createGain(),pn=a.createPanner();src.buffer=B;src.playbackRate.value=rate;
  const far=!ec&&creIsFar(name),md=Math.sqrt(dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z)),rk=creRK(m.type,kind,far);
  pn.panningModel='equalpower';pn.distanceModel='inverse';pn.refDistance=(far?10:boss?6.4:2.4)*rk*SND_DIST_K;pn.maxDistance=(far?220:120)*rk*SND_DIST_K;pn.rolloffFactor=ec?.7:far?.8:1.1;
  g.gain.value=(CRE_G[kind]||1)*(o&&o.v||1)*CRE_VK*(CRE_WOLF.has(m.type)&&CRE_WOLF_V[kind]||1)*(CRE_WOLF.has(m.type)&&far&&kind==='idle'?WOLF_HOWL_V:1);   /* v2.25 sudet; v2.57 ulvonta −30 % */src.connect(g);let df=null,dg=null,lfo=null,lg=null;
  if(ec){const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1500;g.connect(lp);lp.connect(pn);}   // kaikuääni: tumma, kaukainen
  else{const k0=creDistK(md,far,rk);df=a.createBiquadFilter();df.type='lowpass';df.Q.value=.5;df.frequency.value=creLpf(k0);dg=a.createGain();dg.gain.value=1-.3*k0;g.connect(df);df.connect(dg);dg.connect(pn);   // v2.12/v2.14: etäisyys tummentaa ja hiljentää
    if(src.detune){lfo=a.createOscillator();lfo.frequency.value=.35+Math.random()*.3;lg=a.createGain();lg.gain.value=30*k0;lfo.connect(lg);lg.connect(src.detune);lfo.start();}}   // kaukana pieni huojunta (utuisuus)
  pn.connect(CRE.gain);if(ec)creEchoPos(m,pn);else crePos(pn,m.pos.x,m.pos.y+(m.def.r||.5)*1.6,m.pos.z);
  let sd=null,sdo=null;if(m.dun||rv){const R=creRevOn(a);sd=a.createGain();sd.gain.value=rv||(ec?1.3:m.def.ai==='rboss'?.75:boss?.6:.45);pn.connect(sd);sd.connect(R.inp);}
  else if(!ec&&md>8){const R=creRevOn(a);sd=sdo=a.createGain();sdo.gain.value=.08+1.8*creDistK(md,far,rk);pn.connect(sdo);sdo.connect(R.inp);}   // v2.12: ulkona kaukana kaikuu
  const v={src,pn,g,sd,sdo,df,dg,lg,far,rk,m,pri,t0:now,key,ec,name};CRE.voices.push(v);if(ovl)creFileUse(name,tn);src.onended=()=>{const i=CRE.voices.indexOf(v);if(i>=0)CRE.voices.splice(i,1);try{pn.disconnect();}catch(e){}if(lfo)try{lfo.stop();lfo.disconnect();}catch(e){}if(sd)try{sd.disconnect();}catch(e){}};src.start();return dur;}
// v1.95: Kalmanvartijan kaikuääni maan alta: ennen ensimmäistä voittoa, kun vartija ei ole hereillä ja pelaaja on alle 80 m Kalmankehästä
// (maailmassa). Soi 24–48 s välein (ensimmäinen 4–10 s), tumma ja kaiullinen; jos ääni latautuu vielä, uusi yritys 3 s päästä.
// Ilman omaa kaikuääntä lainaa Aarnihirviön (💎) kaikuäänen; jos sitäkään ei ole, on hiljaa.
// v2.12: kaukainen ulvonta: yöllä ulkona (ei luolassa) susien kutsuääni kuuluu 100–145 m päästä (v2.14; ennen 150–230; v2.25 ×0,85 → 85–123 m) satunnaisesta suunnasta 56–138 s välein
// (60 %:n todennäköisyydellä) – tumma ja kaikuinen etäisyysefektin ansiosta. Vain jos suden ulvontaääniä (far) on.
const FHW={t:20,m:null};
function farHowl(dt){if(P.inDun||P.dead||!isNight()){FHW.t=Math.max(FHW.t,15);return;}if((FHW.t-=dt)>0)return;FHW.t=(45+Math.random()*65)*1.25;   /* v2.14: 20 % harvemmin */
  if(Math.random()>.6||!creHasFar('susi','idle'))return;creLoad('susi');const a=Math.random()*TAU,d=(100+Math.random()*45)*.85*WOLF_HOWL_R*SND_DIST_K,x=P.pos.x+Math.cos(a)*d,z=P.pos.z+Math.sin(a)*d;
  FHW.m={type:'susi',def:MOBDEF.susi,pos:{x,y:Math.max(terrainH(x,z),0)+1,z},dead:false,dun:false};creSnd(FHW.m,'idle',{farOnly:1,key:'farhowl'});}
const VEC={t:-1,m:null};
function vartijaEcho(dt){const L=typeof LOC!=='undefined'&&LOC.circle;if(!L||P.inDun||P.dead||flags.boss||mobs.some(m=>m.type==='vartija'&&!m.dead)){VEC.t=-1;return;}
  if(dist2(L.x,L.z,P.pos.x,P.pos.z)>(80*SND_DIST_K)**2){VEC.t=-1;return;}
  if(!VEC.m){VEC.m={type:'vartija',def:MOBDEF.vartija,pos:{x:L.x,y:terrainH(L.x,L.z)-3,z:L.z},dun:false};}
  if(VEC.t<0){VEC.t=4+Math.random()*6;creLoad('vartija');}VEC.t-=dt;if(VEC.t>0)return;
  VEC.t=creSnd(VEC.m,'echo',{echo:1,v:.6,pri:1,key:'echo',rev:.9})?24+Math.random()*24:creRes('vartija','echo')?3:10;}   // ei kaikuääntä vielä → tarkistus 10 s välein
// joka ruutu: kuuntelija = kamera, soivat äänet seuraavat olentoa; idle 6–15 s välein alle 25 m päässä, aggro kerran jahdin alkaessa
const _creF=new THREE.Vector3();
function creTick(dt){const a=actx;if(!a||a.state!=='running'||typeof camera==='undefined')return;const L=a.listener,c=camera.position;camera.getWorldDirection(_creF);
  if(L.positionX){L.positionX.value=c.x;L.positionY.value=c.y;L.positionZ.value=c.z;L.forwardX.value=_creF.x;L.forwardY.value=_creF.y;L.forwardZ.value=_creF.z;L.upX.value=0;L.upY.value=1;L.upZ.value=0;}
  else{L.setPosition(c.x,c.y,c.z);L.setOrientation(_creF.x,_creF.y,_creF.z,0,1,0);}
  creRevTick(dt);tgTick(dt);plTick(dt);
  for(const v of CRE.voices.slice())if(!creSpaceOk(v.m)){creStop(v,.15);CRE.voices.splice(CRE.voices.indexOf(v),1);}   // v2.58 tila vaihtui → ääni pois
  for(const v of CRE.voices){if(v.ec)creEchoPos(v.m,v.pn);else if(!v.m.dead){crePos(v.pn,v.m.pos.x,v.m.pos.y+(v.m.def.r||.5)*1.6,v.m.pos.z);creDistFx(v,Math.sqrt(dist2(v.m.pos.x,v.m.pos.z,P.pos.x,P.pos.z)));}}
  if(state!=='play'||!soundOn)return;
  vartijaEcho(dt);farHowl(dt);
  for(const m of mobs){if(m.dead||!creSpaceOk(m))continue;const d2=dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z),ai=m.def.ai,hs=CRE_CHASE.includes(ai),chasing=m.state==='chase',hasChase=hs&&chasing&&creRes(m.type,'chase');
    // rauhallinen ääntely 6–15 s välein alle 25 m päässä (ei jahdin aikana, jos olennolla on jahtiääni)
    // v2.12: tavallinen ääntely alle CRE_IDLE_R (36 m, v2.14), kutsuäänet (ulvonta ym.) alle CRE_FAR_R (150 m); pitkän äänen jälkeen tauko
    // vähintään äänen pituus + 2 s, kutsuäänen jälkeen 12–30 s lisää (ei jatkuvaa ulvontaa)
    // v2.17 PALAMINEN: liekeissä olennon ääntely (idle, suuttuminen, jahti) on tauolla – kesken soiva katkaistaan; kipuääni soi 1,7–2,1 s välein
    // kunnes palo sammuu tai olento kuolee (kuolinhuuto soi normaalisti). Sammuttua ääntely jatkuu tavalliseen tapaan.
    const burn=mobBurning(m);
    if(burn){if(!m.brS){m.brS=1;m.brT=.15;for(const v of CRE.voices.slice())if(v.m===m&&v.pri<=3){creStop(v);CRE.voices.splice(CRE.voices.indexOf(v),1);}}
      if((m.brT-=dt)<=0){m.brT=1.7+Math.random()*.4;const bo=m.def.ai==='boss'||m.def.ai==='rboss';if(d2<(bo?60:CRE_NEAR_R)**2)creSnd(m,'hurt',bo?{p:.78,v:.55,key:'burn'}:undefined);}m.sndT=Math.max(m.sndT||0,2);continue;}
    else if(m.brS){m.brS=0;m.sndT=2+Math.random()*4;}
    if(m.sndT===undefined)m.sndT=2+Math.random()*13;m.sndT-=dt;if(m.sndT<=0){m.sndT=6+Math.random()*9;const fr=creHasFar(m.type,'idle');
      if(d2<(fr?CRE_FAR_R*creRK(m.type,'idle',1):CRE_IDLE_R)**2&&m.state!=='sleep'&&m.state!=='rise'&&!hasChase){const du=creSnd(m,'idle');const ln=CRE.last[m.type+'_idle'];
        if(du){if(creIsFar(ln))m.sndT=(du+12+Math.random()*18)*(CRE_WOLF.has(m.type)?(isNight()?1.25:3):1);   /* v2.14: sudet ulvovat päivällä 3× harvemmin, yöllä 20 % harvemmin */
          else m.sndT=Math.max(m.sndT,du+2);}}}
    // v1.88: nukkuvan ulottuvuuspomon kaikuääni: kuuluu satunnaisesti (24–48 s välein, ensimmäinen 5–14 s sisääntulosta) vain tässä ulottuvuudessa kunnes pomo herää
    if(ai==='rboss'&&m.dun&&m.state==='sleep'&&P.inDun&&m.realm===P.realm&&!P.dead){m.echoT=(m.echoT??(5+Math.random()*9))-dt;if(m.echoT<=0){m.echoT=24+Math.random()*24;if(creRes(m.type,'echo'))creSnd(m,'echo',{echo:1,v:.6,pri:1,key:'echo'});}}
    if(hs){
      // vihamielinen / pomo: suuttumisääni VAIN KERRAN olennon elinaikana (kun huomaa sinut ensimmäistä kertaa); jos sitä ei ole, ei erillistä ääntä
      // vaan jahtiääni alkaa heti. Sen jälkeen jahtiääni toistuu 4–9 s välein kun olento jahtaa sinua.
      if(chasing||m.state==='intro'){
        if(!m.angerDone){m.angerTry=(m.angerTry||0)+dt;const has=creRes(m.type,'aggro');
          if(!has||m.angerTry>3){m.angerDone=1;m.chT=0;}
          else{const ar=creAgR(m),dur=d2<ar?creSnd(m,'aggro'):0;if(dur){m.angerDone=1;m.chT=dur+1+Math.random()*2;}else if(d2>=ar){m.angerDone=1;m.chT=0;}}}
        else if(!m.inChase)m.chT=1+Math.random()*2;
        m.inChase=1;
        if(chasing&&m.angerDone){m.chT-=dt;if(m.chT<=0){m.chT=4+Math.random()*5;if(d2<((creHasFar(m.type,'chase')?CRE_FAR_R:CRE_NEAR_R)*creRK(m.type,'chase'))**2){const du=creSnd(m,'chase');if(du)m.chT=Math.max(m.chT,du+1.5);}}}
      }else m.inChase=0;
    }else if(ai==='neutral'){
      // neutraali: suuttumisääni aina kun suuttuu (uusi vasta 5 s jahdin päättymisen jälkeen), ei jahtiääntä
      // v2.10: yksi ääni / suuttuminen: uusi vasta kun rauhoittunut (ei vihainen, 5 s ilman jahtia), olennolla vähintään 15 s väli ja
      // saman lajin suuttumisäänten välillä 6 s (lauma / emakot eivät kerrostu)
      if(chasing){m.sndOff=0;if(!m.sndAg){m.sndAg=1;if(d2<creAgR(m)&&creAngerOk(m))creSnd(m,'aggro');}}else if(m.sndAg&&!m.angry){m.sndOff=(m.sndOff||0)+dt;if(m.sndOff>5)m.sndAg=0;}
    }}}

/* ================================================================ v2.16 OLENTOJEN TOIMINNOT (äänierä B1)
   Projekti sounds/olennot_toiminnot/ (raw/<ryhmä>/, valmiit/<ryhmä>_valmis/, AANILISTA_TOIMINNOT.md); manifestin avaimet t/<ryhmä>/<ääni>_<n>.
   Ryhmät (TG, sama jako kuin tools/process_sounds.py:n TG_GROUPS) jakavat äänet; puuttuva ääni = hiljaisuus (pomot lainaavat pomot/-kansiosta,
   v2.21: kerrostuvat ryhmät TG_BASE soittavat pohjaryhmän äänet + omat päälle).
   Askeleet kuljetun matkan mukaan (TG_STRIDE, v2.24: kävellessä ×1,2, juostessa ×1,375) alustan mukaan (tgSurface), lähimmät 6 alle 16 m (isot 32 m);
   pomon askel alle 15 m tärisyttää kameraa. Muut: oksa (Aarnimetsä 15 %), kahina (juostessa metsässä), loiskahdus ja ravistus (vesi),
   palaminen (silmukka), kalina (luurangot, joka askeleella v2.21), tömistys (raskaat, kivivartija, pomot), lentoonlähtö, kaatuminen, törmäys, huitaisu, osuma, nousu, nuuhkiminen, syöminen. Oma budjetti TGV. */
const TG={hiisi:'kaksijalkaiset',suonakki:'kaksijalkaiset',kalmo:'luurangot',ylimys:'luurangot',peura:'nelijalkaiset',poro:'nelijalkaiset',hirvi:'nelijalkaiset',
  karju:'nelijalkaiset',emakko:'nelijalkaiset',susi:'nelijalkaiset',routasusi:'nelijalkaiset',kalmasusi:'nelijalkaiset',ilves:'nelijalkaiset',ahma:'nelijalkaiset',
  karhu:'raskaat_nelijalkaiset',hiidenkarhu:'raskaat_nelijalkaiset',hiidenhirvi:'raskaat_nelijalkaiset',janis:'kevyet_nelijalkaiset',kettu:'kevyet_nelijalkaiset',porsas:'kevyet_nelijalkaiset',
  metso:'kevyet_kaksijalkaiset',kivivartija:'kivivartija',vartija:'kalmanvartija',jaajattari:'jaatar',kalmaherra:'kalmaherra',aarnihirvio:'aarnihirvio'};
const TG_STRIDE={kaksijalkaiset:.75,luurangot:.75,nelijalkaiset:.9,raskaat_nelijalkaiset:1.15,kevyet_nelijalkaiset:.45,kevyet_kaksijalkaiset:.3,kivivartija:1,
  kalmanvartija:1.9,jaatar:1.6,kalmaherra:1.5,aarnihirvio:1.8};
/* v2.24 (käyttäjä): kävellessä askeleet 20 % harvemmin (×1,2), juostessa 10 % harvemmin kuin ennen (ennen ×1,25 → ×1,25·1,1) */
const TG_WALK_K=1.2,TG_RUN_K=1.25*1.1;
const TG_BIG=new Set(['raskaat_nelijalkaiset','kivivartija','kalmanvartija','jaatar','kalmaherra','aarnihirvio']),TG_BOSS=new Set(['kalmanvartija','jaatar','kalmaherra','aarnihirvio']);
const TG_EAT={karju:'tonkiminen',emakko:'tonkiminen',porsas:'tonkiminen',susi:'rouskutus',routasusi:'rouskutus',kalmasusi:'rouskutus',karhu:'rouskutus',
  ahma:'rouskutus',peura:'laidun',poro:'laidun',hirvi:'laidun',janis:'nakerrus'};
const TG_SHAKE=new Set(['nelijalkaiset','raskaat_nelijalkaiset','kevyet_nelijalkaiset']),TG_RUSTLE={forest:1,koivu:1,aarni:1,suo:1};
const TGV={v:[],last:{},max:8,steps:6,loaded:{}};
/* v2.24 (käyttäjä): toimintoäänten kuuluvuus 20 % lyhyempi ja vaimeneminen jyrkempi: kaikki säteet ×0,8 (TG_RK), 3D-viite ×0,8, rolloff
   askel 1,4 → 1,8 ja muut 1,1 → 1,45, maxDistance 120 → 96; etäisyysefekti oma (tgDistK: reuna 51 m eikä 64 m, suora ääni −50 % reunalla eikä −30 %). */
const TG_RK=.8*SND_DIST_K,TG_R=64*TG_RK,TG_DG=.5;
function tgDistK(d){return clamp((d-6)/(TG_R-6),0,1);}
function tgR2(r){return (r*TG_RK)**2;}
// v2.17: pomot lainaavat yhteisestä pääkansiosta `pomot/` (sävel pomon mukaan), jos pomon omassa kansiossa ei ole samannimistä ääntä (oma voittaa).
// Raskaat nelijalkaiset (karhu, hiidenkarhu, hiidenhirvi) ovat oma ryhmänsä eivätkä liity pomoihin.
const TG_BORROW={kalmanvartija:'pomot',jaatar:'pomot',kalmaherra:'pomot',aarnihirvio:'pomot'},TG_BP={kalmanvartija:.85,jaatar:1.12,kalmaherra:.95,aarnihirvio:.9};
/* v2.21 KERROSTUS (käyttäjän päätös): raskaat ja kevyet eläimet, luurangot, kivivartija ja pomot soittavat pohjaryhmän äänen (TG_BASE, sävel ja
   voimakkuus TG_BASEP) ja oman samannimisen äänensä PÄÄLLE, jos sellainen on (pomoilla oma > pomot-kansio). Joka askeleella soi lisäksi
   ryhmän kerros TG_STEP_LAYER (tömistys / luurankojen kalina), ei uidessa (tömistys ei kahlatessa). Sama taulu tools/process_sounds.py:ssä. */
const TG_BASE={raskaat_nelijalkaiset:'nelijalkaiset',kevyet_nelijalkaiset:'nelijalkaiset',kevyet_kaksijalkaiset:'kaksijalkaiset',luurangot:'kaksijalkaiset',
  kivivartija:'kaksijalkaiset',kalmanvartija:'kaksijalkaiset',jaatar:'kaksijalkaiset',kalmaherra:'kaksijalkaiset',aarnihirvio:'kaksijalkaiset'};
const TG_BASEP={raskaat_nelijalkaiset:[.8,1],kevyet_nelijalkaiset:[1.3,.55],kevyet_kaksijalkaiset:[1.5,.45],luurangot:[1.05,.8],kivivartija:[.8,1],
  kalmanvartija:[.62,1],jaatar:[.75,1],kalmaherra:[.72,1],aarnihirvio:[.68,1]};
/* v2.22 OSUMAT JA TÖRMÄYKSET (käyttäjän päätös): osumaäänet omassa kansiossaan osumat/ kuuteen kategoriaan (TG_HIT: olento → kategoria;
   soi kun olento osuu pelaajaan, jousikalmon nuoli tai Jäätären kivi osuu, ja pelaajan nuoli osuu olentoon). Törmäykset tormaykset/-kansiossa:
   kevyt (tavalliset) ja raskas (raskaat, kivivartija, pomot) – kaikki lainaavat näistä kahdesta. */
const TG_HIT={hiisi:'isku',suonakki:'raapaisu',kalmo:'isku',ylimys:'isku',peura:'sarvet',poro:'sarvet',hirvi:'sarvet',hiidenhirvi:'sarvet',karju:'sarvet',
  emakko:'purema',porsas:'purema',susi:'purema',routasusi:'purema',kalmasusi:'purema',ahma:'purema',kettu:'purema',janis:'purema',ilves:'raapaisu',
  karhu:'raapaisu',hiidenkarhu:'raapaisu',metso:'isku',kivivartija:'murskaus',vartija:'murskaus',jaajattari:'murskaus',kalmaherra:'isku',aarnihirvio:'murskaus'};
/* v2.54 varakategoria: kategoria, jolla ei ole vielä yhtään ääntä manifestissa, soittaa toisen (sarvet → isku: karju, hirvi, hiidenhirvi).
   Kun käyttäjä lisää omat äänet (osuma_sarvet_1 …), ne ovat manifestissa ja soivat automaattisesti. */
const TG_HIT_ALT={sarvet:'isku'};
function tgHitCat(cat){const L=tgRes('osumat','osuma_'+cat);return L&&L.length||!TG_HIT_ALT[cat]?cat:TG_HIT_ALT[cat];}
function tgHit(cat,x,y,z,p){const q={x,y,z};return tgPlay({pos:q,dun:P.inDun,type:'_osuma'},'osuma_'+tgHitCat(cat),'osumat',{pos:q,p:p||1},false);}
function tgHeavy(m){return TG_BIG.has(TG[m.type])||m.def.ai==='boss'||m.def.ai==='rboss';}
const TG_STEP_LAYER={raskaat_nelijalkaiset:'tomistys',kivivartija:'tomistys',luurangot:'kalina',kalmanvartija:'tomistys',jaatar:'tomistys',kalmaherra:'tomistys',aarnihirvio:'tomistys'};
function tgRes(g,ev){if(!CRE.man)return null;if(CRE.idxOf!==CRE.man)creIndex();return CRE.idx[`t/${g}/${ev}`]||null;}
function tgLoad(type){const g=TG[type];if(!CRE.ok||!g||TGV.loaded[g])return;TGV.loaded[g]=1;const b=TG_BORROW[g],ba=TG_BASE[g];for(const n in CRE.man)if(n.startsWith(`t/${g}/`)||n.startsWith('t/yhteiset/')||n.startsWith('t/osumat/')||n.startsWith('t/tormaykset/')||(b&&n.startsWith(`t/${b}/`))||(ba&&n.startsWith(`t/${ba}/`)))creBuf(n);}
function tgSize(m){return clamp(1.35-(m.def.r||.5)*.55,.6,1.4);}   // yhteisten äänten sävel koon mukaan
// soittaa ryhmän äänen 3D:nä olennon kohdalta (o: g ryhmä, v voimakkuus, p sävel, loop silmukka, pos kiinteä paikka). Palauttaa keston (silmukalla äänen), muuten false.
// v2.21: ilman o.g:tä kerrostuva ryhmä soittaa pohjaryhmän äänen + oman päälle (TG_BASE). Kerros (lay) ei kuluta äänibudjettia (yläraja 24 ääntä).
function tgSnd(m,ev,o){o=o||{};if(o.g)return tgPlay(m,ev,o.g,o,false);const g=TG[m.type];if(!g)return false;const b=TG_BASE[g];let r0=false;
  if(b){const q=TG_BASEP[g];r0=tgPlay(m,ev,b,Object.assign({},o,{p:(o.p||1)*q[0],v:(o.v??1)*q[1]}),false,g);}
  const r1=tgPlay(m,ev,g,o,!!r0);if(o.loop){const L=[r0,r1].filter(x=>x&&x.src);return L.length?L:false;}return r1||r0;}
function tgPlay(m,ev,g,o,lay,own){let L0=tgRes(g,ev),bp=1;if(!L0&&TG_BORROW[g]){L0=tgRes(TG_BORROW[g],ev);bp=TG_BP[g]||1;}if(!L0)return false;
  const L=L0.filter(n=>CRE.buf[n]);if(!L.length){for(const n of L0)creBuf(n);return false;}
  const a=actx;if(!a||a.state!=='running'||!soundOn)return false;const vol=volK('cre');if(!(vol>0))return false;
  const step=ev.startsWith('askel_');let cnt=0;for(const v of TGV.v)if(v.step===step&&!v.lay)cnt++;if(lay?TGV.v.length>=24:cnt>=(step?TGV.steps:TGV.max))return false;
  const key=L0[0].replace(/_\d+$/,'');let pick=L;if(L.length>1&&TGV.last[key])pick=L.filter(x=>x!==TGV.last[key]);const name=pick[Math.random()*pick.length|0];TGV.last[key]=name;
  const B=CRE.buf[name],rate=(o.p||1)*bp*(1+(Math.random()*2-1)*.06),q=o.pos||m.pos,md=Math.sqrt(dist2(q.x,q.z,P.pos.x,P.pos.z)),k0=tgDistK(md),big=TG_BIG.has(own||g);
  if(!CRE.gain){CRE.gain=a.createGain();CRE.gain.connect(sndBus(a));}CRE.gain.gain.value=vol;
  const src=a.createBufferSource();src.buffer=B;src.playbackRate.value=rate;if(o.loop){src.loop=true;const lp=tgLoopPts(B);src.loopStart=lp[0];src.loopEnd=lp[1];}
  const gn=a.createGain();gn.gain.value=o.v??1;const df=a.createBiquadFilter();df.type='lowpass';df.Q.value=.5;df.frequency.value=creLpf(k0);const dg=a.createGain();dg.gain.value=1-TG_DG*k0;
  const pn=a.createPanner();pn.panningModel='equalpower';pn.distanceModel='inverse';pn.refDistance=(big?5:step?1.6:2.4)*TG_RK;pn.maxDistance=120*TG_RK;pn.rolloffFactor=step?1.8:1.45;
  src.connect(gn);gn.connect(df);df.connect(dg);dg.connect(pn);pn.connect(CRE.gain);crePos(pn,q.x,(q.y??m.pos.y)+.3,q.z);
  let sd=null,sdo=null;if(m.dun){const Rv=creRevOn(a);sd=a.createGain();sd.gain.value=big?.5:.35;pn.connect(sd);sd.connect(Rv.inp);}
  else if(!step&&md>8){const Rv=creRevOn(a);sd=sdo=a.createGain();sdo.gain.value=.08+1.8*k0;pn.connect(sdo);sdo.connect(Rv.inp);}
  const v={src,pn,g:gn,sd,sdo,df,dg,far:false,tg:1,m,step,loop:!!o.loop,fixed:!!o.pos,ev,lay:!!lay};TGV.v.push(v);
  src.onended=()=>{const i=TGV.v.indexOf(v);if(i>=0)TGV.v.splice(i,1);try{pn.disconnect();}catch(e){}if(sd)try{sd.disconnect();}catch(e){}};
  if(o.loop&&o.rnd){const lp=tgLoopPts(B);src.start(0,lp[0]+Math.random()*Math.max(0,lp[1]-lp[0]-.05));gn.gain.setValueAtTime(0,a.currentTime);gn.gain.linearRampToValueAtTime(o.v??1,a.currentTime+.25);}else src.start();return o.loop?v:B.duration/rate;}
// v2.22: silmukan sauma – mp3-pakkaus lisää alkuun ja loppuun täytehiljaisuutta; silmukka soi vain äänen kohdalta (ei hiljaista raoa)
function tgLoopPts(B){if(B._lp)return B._lp;const d=B.getChannelData(0),n=d.length,th=1e-4;let a=0,b=n-1;while(a<Math.min(n,8192)&&Math.abs(d[a])<th)a++;while(b>n-8192&&b>a&&Math.abs(d[b])<th)b--;
  return B._lp=[a/B.sampleRate,(b+1)/B.sampleRate];}
function tgStop(v){if(Array.isArray(v)){for(const x of v)tgStop(x);return;}if(!v||!v.src)return;try{v.g.gain.setTargetAtTime(0,actx.currentTime,.08);v.src.stop(actx.currentTime+.35);}catch(e){}v.loop=false;}
// alusta olennon jalkojen alla (askeleet)
function tgSurface(m,g){if(m.dun)return m.realm==='portal1'?'jaa':m.realm==='portal3'?'ruoho':'kivi';
  const x=m.pos.x,z=m.pos.z,th=terrainH(x,z);
  if(m.pos.y>th+.15){gridQuery(x,z,.1,_cl);for(const c of _cl){if(c.t!=='b'||c.off)continue;if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ&&Math.abs(c.maxY-m.pos.y)<.35){const o=c.owner;return o&&o.t&&PIECES[o.t]?(PIECES[o.t].stone?'kivi':'puu'):'kivi';}}}
  const dep=water.position.y-th;if(dep>.05)return dep>(TG_BIG.has(g)?1.1:g.startsWith('kevyet')?.3:.6)?'uinti':'kahlaus';
  const b=biomeAt(x,z,th);return b==='beach'?'hiekka':b==='mountain'||b==='rakka'?'kivi':b==='peak'?'lumi':b==='suo'?'suo':b==='aarni'?'pusikko':'ruoho';}
const TG_STEP_K=.7;   // v2.73 olentojen askeleet ja askelkerrokset −30 %
function tgStep(m,g,d,spd){const sf=tgSurface(m,g),run=spd>(m.def.walk||1.5)*1.4,sb=(.55+.45*clamp(spd/(m.def.run||4),0,1))*TG_STEP_K,sv=sb*(.82+Math.random()*.18);   /* v2.23: askelten voimakkuus vaihtelee luonnollisesti */tgSnd(m,'askel_'+sf,sf==='pusikko'?{v:sb*.91*(1+(Math.random()*2-1)*.1),p:1+(Math.random()*2-1)*.09}:{v:sv});   /* v2.27 Aarnimetsän askel ±10 %, sävel ±9 % */
  {const ly=TG_STEP_LAYER[g];if(ly&&sf!=='uinti'&&!(ly==='tomistys'&&sf==='kahlaus'))tgPlay(m,ly,g,{v:ly==='kalina'?.7*TG_STEP_K:sv},true);}   // v2.21: tömistys / kalina askeleen päälle
  if(playTime-(m.okT??-9)>=2&&!m.dun&&plNodeAt('oksa',m.pos.x,m.pos.z,(m.def.r||.5)*.5)){m.okT=playTime;tgSnd(m,'oksa',{v:.7});}   // v2.27 astuu oksan päälle
  else if(sf==='pusikko'&&Math.random()<.12&&playTime-(m.okT??-9)>=2){m.okT=playTime;tgSnd(m,'oksa',{v:.18});}   // v2.27 satunnaisesti tosi hiljaa (ennen 0,45)
  if(!m.dun&&playTime-(m.puT??-9)>=2&&plBush(m.pos.x,m.pos.z,(m.def.r||.5)*.6)){m.puT=playTime;tgSnd(m,'kahina',{g:'yhteiset',p:tgSize(m),v:.8});}   // v2.25 pensaan läpi (2 s välein)   // v2.21: hiljempaa (0,8 → 0,45), enintään 2 s välein
  if(run&&!m.dun&&TG_RUSTLE[biomeHere(m.pos.x,m.pos.z)]&&Math.random()<.35&&playTime-(m.khT??-9)>.7){m.khT=playTime;tgSnd(m,'kahina',{g:'yhteiset',p:tgSize(m),v:.8});}
  if(TG_BOSS.has(g)&&d<15)shake(.12*(1-d/15));}
function tgTick(dt){if(!CRE.ok||state!=='play')return;
  for(const v of TGV.v.slice()){const m=v.m;if(m&&!creSpaceOk(m)){tgStop(v);continue;}   // v2.58
    if(v.loop&&(!mobs.includes(m)||(m.dead&&v.ev!=='palaminen'))){tgStop(v);continue;}if(v.fixed)continue;crePos(v.pn,m.pos.x,m.pos.y+.3,m.pos.z);if(actx)creDistFx(v,Math.sqrt(dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z)));}
  const C=[];
  for(const m of mobs){const g=TG[m.type];if(!g||m.menu||!creSpaceOk(m))continue;const d2=dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z);
    // palaminen: rätinä silmukkana niin kauan kuin olento palaa (myös tuhkaksi palaessa 2 s)
    const burning=(m.burnT>0||m.sunBurn||(m.dead&&m.ashDeath&&m.deadT<2))&&d2<tgR2(45)&&m.dun===P.inDun;
    if(burning&&!m.tgBurn){const v=tgSnd(m,'palaminen',{g:'yhteiset',loop:1,v:.8,p:tgSize(m)});if(v)m.tgBurn=v;}else if(!burning&&m.tgBurn){tgStop(m.tgBurn);m.tgBurn=null;}
    /* v2.23 TOIMINTOSILMUKAT: syöminen, tonkiminen ja nuuhkiminen soivat silmukkana (satunnaisesta kohdasta, 0,25 s sisäänhäivytys) niin
       kauan kuin AI pitää toimintoa yllä (m.actSnd/m.actT päivittyy joka ruutu); 0,3 s ilman päivitystä → pehmeä pysäytys. Alle 30 m. */
    {const act=m.actSnd&&playTime-(m.actT??-9)<.3&&!m.dead&&m.dun===P.inDun&&d2<tgR2(30)?m.actSnd:null;
     if(m.tgActV&&m.tgActEv!==act){tgStop(m.tgActV);m.tgActV=null;m.tgActEv=null;}
     if(act&&!m.tgActV&&playTime>=(m.tgActRetry||0)){const v=tgSnd(m,act,{loop:1,rnd:1,v:act==='nuuhkiminen'?.55:.75});if(v){m.tgActV=v;m.tgActEv=act;}else m.tgActRetry=playTime+1;}}
    if(m.shakeT>0){m.shakeT-=dt;m.f.g.rotation.z=m.shakeT>0?Math.sin(m.shakeT*42)*.2*Math.min(1,m.shakeT/.25):0;}
    if(m.dead||m.dun!==P.inDun||m.born!==undefined)continue;
    const px=m.tgX??m.pos.x,pz=m.tgZ??m.pos.z,mv=Math.hypot(m.pos.x-px,m.pos.z-pz);m.tgX=m.pos.x;m.tgZ=m.pos.z;if(mv>3)continue;const spd=mv/Math.max(dt,1e-3);
    if(d2<tgR2(40)&&!m.dun&&!m.fly){const dep=water.position.y-terrainH(m.pos.x,m.pos.z),wet=dep>.2;
      if(wet&&!m.tgWet){m.tgWet=1;tgSnd(m,'loiskahdus',{g:'yhteiset',p:tgSize(m)});}
      else if(m.tgWet&&dep<0){m.tgWet=0;if(TG_SHAKE.has(g)){m.shakeT=.7;tgSnd(m,'ravistus');}}}
    m.tgAcc=(m.tgAcc||0)+mv;const st=TG_STRIDE[g]*(spd>(m.def.walk||1.5)*1.4?TG_RUN_K:TG_WALK_K);
    if(m.tgAcc>=st){m.tgAcc=Math.min(m.tgAcc-st,st);if(d2<tgR2(TG_BIG.has(g)?40:20)&&!m.fly)C.push([d2,m,g,spd]);}}
  C.sort((a,b)=>a[0]-b[0]);for(let i=0;i<C.length&&i<TGV.steps;i++)tgStep(C[i][1],C[i][2],Math.sqrt(C[i][0]),C[i][3]);}
/* v2.24 PELAAJAN TOIMINTOÄÄNET (käyttäjän pyyntö): projekti sounds/pelaaja_toiminnot/ (raw/<ryhmä>/, valmiit/<ryhmä>_valmis/,
   AANILISTA_PELAAJA.md), manifestin avaimet p/<ryhmä>/<ääni>_<n> (sama käsittely kuin olentojen toiminnoilla, P_GROUPS työkalussa).
   askeleet/: askel jalan osuessa maahan (kävelyvaihe P.walkPh: kerran π:ssä, ~2,6/s kävellen, ~3,3/s juosten; alusta plSurface, kyykyssä hiljaa)
   ja hypyn alastulo; vesi/: kahlaus askeleittain, uintiveto joka toisella vaiheella, loiskahdus veteen mennessä (kova pudotus kovempi);
   osumat/: pelaajan isku osuu olentoon (nuija = murskaus, muut = isku) ja pelaajan nuoli osuu (nuoli). Soi pelaajan kohdalta ilman
   kaukoefektiä (luolastossa pieni kaiku), voimakkuus SET.plVol (Asetukset › Ohjaus ja ääni › Pelaajan äänet). Oma budjetti 6 ääntä. */
let plActT=-9;   // v2.67 viimeisin pelaajan toimintaääni (s, performance.now)
const PLV={v:[],last:{},loaded:0,gain:null,ph:null,wet:0,og:1,vy0:0,loops:{},lpRetry:{},cd:{},hp0:null,st:{},bushT:-9,oksaT:-9};
/* v2.51 VALIKKOÄÄNET (projekti sounds/menu_1_valikko, avaimet m/<ryhmä>/<ääni>): soivat vain pelin ulkopuolisissa valikoissa (MENU_SEL:
   päävalikko, taukovalikko, asetukset, maailmat, varmistusikkuna, kuolema- ja voittoruutu). Ääni 2D (ei sijaintia), taso SET.uiVol.
   hover = uusi nappi/valinta hiiren alle, klikkaus = painallus, Extra-grafiikan valinta (.uo) = extra_paalle / extra_pois (oletusarvo = puinen),
   naputus = liukusäädintä liikutetaan (toistuu MSND.tickDt välein hiljaa, MSND.tickV), ultra = Ultra-esiasetus asetetaan (settings.js). */
const MENU_SEL='#menu,#settings,#keyDlg,#deadS,#winS',MENU_BTN='button,select,.tgl,input[type=checkbox],.world';
const MSND={gain:null,last:{},hov:null,loaded:0,clickT:-1e9,moveT:-1,tickT:0,tickDt:.055,tickV:.21,raf:0};
function mRes(g,ev,pre){if(!CRE.man)return null;if(CRE.idxOf!==CRE.man)creIndex();return CRE.idx[`${pre||'m'}/${g}/${ev}`]||null;}
function mLoad(){if(MSND.loaded||!CRE.ok)return;MSND.loaded=1;for(const n in CRE.man)if(n.startsWith('m/')||n.startsWith('i/'))creBuf(n);}   // v2.53 myös ilmoitukset (i/)
const BTN_BASE=.8;   // v2.67: hover- ja klikkausäänien perustaso (−20 %)
function mSnd(g,ev,o){o=o||{};creInit();if(!CRE.ok)return false;mLoad();const L0=mRes(g,ev,o.pre);if(!L0)return false;const L=L0.filter(n=>CRE.buf[n]);if(!L.length)return false;
  const a=actx;if(!a||a.state!=='running'||!soundOn)return false;const vol=volK(o.cat||'ui')*(g==='napit'?BTN_BASE*(SET.btnVol??1):1);   /* v2.67 napit: perustaso −20 % + oma säädin */if(!(vol>0))return false;
  const key=g+'/'+ev;let pick=L;if(pick.length>1&&MSND.last[key])pick=pick.filter(x=>x!==MSND.last[key]);const name=pick[Math.random()*pick.length|0];MSND.last[key]=name;
  if(!MSND.gain){MSND.gain=a.createGain();MSND.gain.connect(a.destination);}MSND.gain.gain.value=1;   /* v2.53: taso äänikohtaisesti (kategoria o.cat) */
  const src=a.createBufferSource();src.buffer=CRE.buf[name];src.playbackRate.value=(o.p||1)*(1+(Math.random()*2-1)*(o.pj??.03));
  const gn=a.createGain(),v0=(o.v??1)*vol,h={src,g:gn,done:false,cat:o.cat||'ui',v:o.v??1};src.connect(gn);gn.connect(o.cat==='notif'||o.cat==='amb'?sndBus(a):MSND.gain);   /* v2.67 pelin äänet vedenalaisen väylän kautta */src.onended=()=>{h.done=true;try{gn.disconnect();}catch(e){}};
  if(o.loop){src.loop=true;const lp=tgLoopPts(src.buffer);src.loopStart=lp[0];src.loopEnd=lp[1];gn.gain.setValueAtTime(0,a.currentTime);gn.gain.linearRampToValueAtTime(v0,a.currentTime+.15);}   /* 0,15 s vain naksahduksen esto, ei fade in */
  else gn.gain.value=v0;src.start();return h;}   // v2.52: palauttaa kahvan (mStop)
// v2.52 äänen pysäytys häivyttäen (f s): silmukat (tuuli, linnut) ja kesken jäävät kertaäänet (intro ohitetaan)
function mStop(h,f){if(!h||h.done||!actx)return;const t=actx.currentTime,g=h.g.gain;try{g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+f);h.src.stop(t+f+.05);}catch(e){}h.done=true;}
function mInMenu(el){return !!(el&&el.closest&&el.closest(MENU_SEL));}
function mWake(){audio();if(actx&&actx.state!=='running')actx.resume();creInit();mLoad();}
// liukusäädin: kutsutaan hiiren liikkuessa vedon aikana → naputus toistuu tiheästi niin kauan kuin liike jatkuu (80 ms tauko = hiljaa)
function mSliderMove(){MSND.moveT=performance.now();if(!MSND.raf)MSND.raf=requestAnimationFrame(mSliderTick);}
function mSliderTick(){const t=performance.now();if(t-MSND.moveT>80||typeof sldDrag==='undefined'||!sldDrag){MSND.raf=0;return;}
  if(t-MSND.tickT>=MSND.tickDt*1000){MSND.tickT=t;mSnd('liukusaatimet','naputus',{v:MSND.tickV,pj:.06});}MSND.raf=requestAnimationFrame(mSliderTick);}
document.addEventListener('mouseover',e=>{const b=e.target&&e.target.closest&&e.target.closest(MENU_BTN);if(!b||b===MSND.hov)return;MSND.hov=b;if(b.disabled||!mInMenu(b)||performance.now()-MSND.clickT<350)return;mSnd('napit','hover');},true);   /* klikkauksen jälkeen sivu piirtyy uudelleen → ei tuplaääntä */
/* VC (virtuaalinen osoitin) lähettää mouse-tapahtumia, ei pointer-tapahtumia → kuunnellaan mouse* */document.addEventListener('mouseout',e=>{const b=MSND.hov;if(b&&!(e.relatedTarget&&b.contains(e.relatedTarget)))MSND.hov=null;},true);
document.addEventListener('mousedown',()=>mWake(),true);document.addEventListener('keydown',()=>mWake(),true);
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest(MENU_BTN);if(!b||b.disabled||!mInMenu(b))return;MSND.clickT=performance.now();
  if(b.classList.contains('uo')){const k=b.dataset.xk,v=b.dataset.xv,def=k?String(SET_DEF[k])===v:b.dataset.ush==='off';mSnd('extra',def?'extra_pois':'extra_paalle');return;}
  mSnd('napit','klikkaus');},true);
function plRes(g,ev){if(!CRE.man)return null;if(CRE.idxOf!==CRE.man)creIndex();return CRE.idx[`p/${g}/${ev}`]||null;}
function plLoad(){if(PLV.loaded||!CRE.ok)return;PLV.loaded=1;for(const n in CRE.man)if(n.startsWith('p/'))creBuf(n);}
function plSnd(g,ev,o){o=o||{};creInit();if(!CRE.ok)return false;plLoad();const L0=plRes(g,ev);if(!L0)return false;const L=L0.filter(n=>CRE.buf[n]);if(!L.length)return false;
  const a=actx;if(!a||a.state!=='running'||!soundOn)return false;const vol=volK('pl');if(!(vol>0))return false;
  PLV.v=PLV.v.filter(v=>!v.done);if(!o.loop&&PLV.v.length>=6)return false;
  const key=g+'/'+ev;let pick=L;if(o.v_ix){const w=L.filter(n=>o.v_ix.includes(+n.slice(n.lastIndexOf('_')+1)));if(w.length)pick=w;}   /* v2.50 o.v_ix: sallitut versionumerot (puuttuessa kaikki) */
  if(pick.length>1&&PLV.last[key])pick=pick.filter(x=>x!==PLV.last[key]);const name=pick[Math.random()*pick.length|0];PLV.last[key]=name;
  if(!PLV.gain){PLV.gain=a.createGain();PLV.gain.connect(sndBus(a));}PLV.gain.gain.value=vol;
  const B=CRE.buf[name],q=o.pos||P.pos,src=a.createBufferSource();src.buffer=B;src.playbackRate.value=(o.p||1)*(o.loop?1:1+(Math.random()*2-1)*(o.pj??.05));   /* v2.56 o.pj: oma sävelvaihtelu */
  if(o.loop){src.loop=true;const lp=tgLoopPts(B);src.loopStart=lp[0];src.loopEnd=lp[1];}
  const gn=a.createGain();gn.gain.value=o.loop?0:(o.v??1)*(1+(Math.random()*2-1)*(o.vj??.05));   /* v2.26: voimakkuus ±5 % joka kerta (o.vj: oma vaihtelu) */if(o.loop)gn.gain.linearRampToValueAtTime(o.v??1,a.currentTime+.4);const pn=a.createPanner();pn.panningModel='equalpower';pn.distanceModel='inverse';pn.refDistance=4*SND_DIST_K*(o.rk||1);pn.maxDistance=60*SND_DIST_K*(o.rk||1);pn.rolloffFactor=1;   /* v2.67 o.rk: kuuluvuuskerroin */
  if(o.lp){const lf=a.createBiquadFilter();lf.type='lowpass';lf.frequency.value=o.lp;lf.Q.value=.6;src.connect(gn);gn.connect(lf);lf.connect(pn);}else{src.connect(gn);gn.connect(pn);}pn.connect(PLV.gain);   /* v2.31 o.lp: tumma alipäästö (Hz) */crePos(pn,q.x,(q.y??P.pos.y)+.2,q.z);
  let sd=null;if(P.inDun){const R=creRevOn(a);sd=a.createGain();sd.gain.value=.25;pn.connect(sd);sd.connect(R.inp);}
  if(!o.loop&&g!=='askeleet'&&g!=='vesi'&&g!=='keho')plActT=performance.now()/1000;   // v2.67 pelaajan toimintaääni (ilmoitusääni ei päälle)
  const v={src,sd,g:gn,loop:!!o.loop};if(!o.loop)PLV.v.push(v);src.onended=()=>{v.done=1;try{pn.disconnect();}catch(e){}if(sd)try{sd.disconnect();}catch(e){}};
  /* v2.29 o.until: soi enintään näin monta sekuntia ja häivyttää 0,1 s (puun narina loppuu maahan osuessa); o.fit: harvoin (25 %) aloitus keskeltä
     0–4 s, jos ääntä riittää koko ajaksi (+0,3 s) – vaihtelua pitkään ääneen */
  let off=0;if(o.until&&o.fit&&Math.random()<.25){const room=B.duration/src.playbackRate.value-o.until-.3;if(room>.5)off=Math.random()*Math.min(4,room);}
  src.start(0,off);if(o.until){const t=a.currentTime,e=t+Math.max(.15,o.until);gn.gain.setValueAtTime(gn.gain.value,e-.1);gn.gain.linearRampToValueAtTime(0,e);src.stop(e+.02);}
  return o.loop?v:B.duration;}
// v2.25 silmukka (sydämen syke): plLoop(avain, ryhmä, ääni, päällä, voimakkuus, sävel) – käynnistää, säätää tai häivyttää pois (0,4 s)
function plLoop(k,g,ev,on,v,p,f){const L=PLV.loops[k];if(!on||!actx){if(L){const fo=f||.6;try{L.g.gain.cancelScheduledValues(actx.currentTime);L.g.gain.setTargetAtTime(0,actx.currentTime,fo/4);L.src.stop(actx.currentTime+fo+.2);}catch(e){}delete PLV.loops[k];}return;}   /* v2.67 f: häivytys ulos (s) */
  if(L){L.g.gain.setTargetAtTime(v,actx.currentTime,.3);L.src.playbackRate.setTargetAtTime(p,actx.currentTime,.4);return;}
  if(playTime<(PLV.lpRetry[k]||0))return;const r=plSnd(g,ev,{loop:1,v,p});if(r&&r.src)PLV.loops[k]=r;else PLV.lpRetry[k]=playTime+1;}
// alusta pelaajan jalkojen alla (sama jako kuin olentojen tgSurface)
function plSurface(){if(P.inDun)return P.realm==='portal1'?'jaa':P.realm==='portal3'?'ruoho':'kivi';
  const x=P.pos.x,z=P.pos.z,th=terrainH(x,z);
  if(P.pos.y>th+.15){gridQuery(x,z,.4,_cl);for(const c of _cl){if(c.t!=='b'||c.off)continue;if(x>=c.minX-.4&&x<=c.maxX+.4&&z>=c.minZ-.4&&z<=c.maxZ+.4&&Math.abs(c.maxY-P.pos.y)<.35){const o=c.owner;return o&&o.t&&PIECES[o.t]?(PIECES[o.t].stone?'kivi':'puu'):'kivi';}}}
  const b=biomeAt(x,z,th);return b==='beach'?'hiekka':b==='mountain'||b==='rakka'?'kivi':b==='peak'?'lumi':b==='suo'?'suo':b==='aarni'?'pusikko':'ruoho';}
function plTick(dt){plBody(dt);if(state!=='play'||P.dead||P.flying){PLV.ph=null;return;}if(!CRE.ok){creInit();return;}plLoad();
  const hv=Math.hypot(P.vel.x,P.vel.z),wy=water.position.y,dep=P.inDun?0:wy-terrainH(P.pos.x,P.pos.z),inW=!P.inDun&&(P.swim||(dep>.3&&P.pos.y<wy-.15));
  if(inW&&!PLV.wet){PLV.wet=1;if(playTime-(PLV.splT??-9)>.6){PLV.splT=playTime;const hard=Math.min(PLV.vy0,P.vy)<-6;plSnd('vesi','loiskahdus',{v:hard?1:.55,p:hard?.9:1.08});}}
  else if(!inW&&dep<.15)PLV.wet=0;
  if(P.onGround&&!PLV.og&&PLV.vy0<-4&&!inW){const lv=clamp(-PLV.vy0/9,.6,1);if(!plSnd('askeleet','alastulo',{v:lv}))plSnd('askeleet','askel_'+plSurface(),{v:lv,p:.92});}   // hypyn alastulo (v2.25 oma ääni, muuten askel)
  PLV.og=P.onGround;PLV.vy0=P.vy;
  if(!P.inDun&&!inW&&hv>.6&&P.onGround&&playTime-PLV.bushT>=2&&plBush(P.pos.x,P.pos.z,.3)){PLV.bushT=playTime;plSnd('askeleet','puska');plSnd('askeleet','askel_pusikko',{v:.72*PL_STEP_V});}   // v2.25 pensaan läpi heti
  const k=Math.floor(((P.walkPh||0)+Math.PI/2)/Math.PI);if(PLV.ph===null){PLV.ph=k;return;}if(k===PLV.ph)return;PLV.ph=k;if(hv<.6)return;
  if(P.swim){if(k%2===0)plSnd('vesi','askel_uinti',{v:.8});return;}
  if(!P.onGround||P.onLadder)return;const v=(P.crouch?.4:hv>5.5?1:.72)*PL_STEP_V;
  if(dep>.05&&P.pos.y<wy+.05)plSnd('vesi','askel_kahlaus',{v});else{const sf=plSurface(),pu=sf==='pusikko';
    plSnd('askeleet','askel_'+sf,pu?{v,vj:.1,p:1+(Math.random()*2-1)*.09}:{v});   // v2.27 Aarnimetsän askel: voimakkuus ±10 %, sävel ±9 %
    if(playTime-PLV.oksaT>=2&&plNodeAt('oksa',P.pos.x,P.pos.z,.3)){PLV.oksaT=playTime;plSnd('askeleet','oksa',{v:.9});}   // astut oksan päälle: normaali ääni
    else if(pu&&Math.random()<.12&&playTime-PLV.oksaT>=2){PLV.oksaT=playTime;plSnd('askeleet','oksa',{v:.2,vj:.15});}   // Aarnimetsässä satunnaisesti tosi hiljaa
    if(pu&&Math.random()<.07&&playTime-PLV.bushT>=2){PLV.bushT=playTime;plSnd('askeleet','puska',{v:.9});}}}
/* v2.25 PENSAAT (käyttäjä): pelaaja kävelee pensaan läpi → heti pusikkoaskel + puska-ääni (täysi voimakkuus), enintään 2 s välein (PLV.bushT);
   Aarnimetsässä lisäksi satunnaisesti (14 % askelista) oksa tai puska samalla 2 s tauolla. Pelaajan askeleet 20 % hiljempaa (PL_STEP_V). */
const PL_STEP_V=.56,_plN=[];   // v2.73 askeleet −30 % (ennen .8)
const PL_PICK=()=>({v:.55,p:1.1*(1+(Math.random()*2-1)*.2),lp:2400});   // v2.31 poiminta: hiljempaa 0,55, hieman kimeämpi (×1,1), sävel ±20 % (+ yleinen ±5 %), tumma alipäästö 2,4 kHz
function plBush(x,z,r){nodesNear(x,z,2.2,_plN);for(const n of _plN)if(n.type==='pensas'&&Math.hypot(n.x-x,n.z-z)<.9*n.s+r)return true;return false;}
// v2.27: maassa oleva kohde (esim. oksa, joka ei ole kerätty) jalkojen alla (säde 0,45 × koko + r)
function plNodeAt(type,x,z,r){nodesNear(x,z,1.5,_plN);for(const n of _plN)if(n.type===type&&n.alive!==false&&Math.hypot(n.x-x,n.z-z)<.45*(n.s||1)+r)return true;return false;}
/* v2.25 OSA 3 – PELAAJAN ÄÄNET (sounds/pelaaja_3_aanet/): kipu terveyden laskusta syyn mukaan (palaminen → kipu_tuli 1,6 s välein,
   hukkuminen → kipu_hukkuminen 1,5 s, nälkä → kipu_nalka 7 s, putoaminen, iso osuma yli 20 % → kipu_kova, muuten kipu 0,35 s tauolla),
   kuolema (hukkuessa oma). Keho: sydämen syke silmukkana kun terveys alle 30 % tai iso paha olento (stalk: hiidenkarhu, hiidenhirvi,
   kalmasusi, suonäkki – ei pomot) alle 35 m (voimakkuus ja tahti kasvavat); hengästys kun kestävyys loppuu; haukkoo henkeä pintaan
   noustessa (yli 2 s sukelluksessa); hytinä palellessa 20–35 s välein; vatsan kurina nälkäisenä (alle 20) 40–70 s välein; pahoinvointi
   alkaessa ja 15 s välein; kylläinen kun syöt itsesi täyteen; lämmin kun pääset palelemasta lämpöön; levännyt kun levon vaikutus alkaa.
   Mahakipu soi ähkyn kouristuksessa (environment.js). PLV.st muistaa edelliset tilat (siirtymät). */
const HENG_V=.64,PL_SCARY_R=35,HENG_END=.3,HENG_FADE=1.5,FALL_ANKLE=.25;
function plOverMoving(){return typeof MAXW!=='undefined'&&!devOn('weight')&&invWeight()>MAXW&&Math.hypot(P.vel.x,P.vel.z)>.6&&!P.swim;}
function plCd(k,t){if(playTime<(PLV.cd[k]||0))return false;PLV.cd[k]=playTime+t;return true;}
function plBody(dt){const S=PLV.st;if(state!=='play'&&state!=='ui'){plLoop('sydan',null,null,false);plLoop('heng',null,null,false,0,1,HENG_FADE);S.heng=false;return;}
  if(P.dead){if(!S.dead){S.dead=1;plLoop('sydan',null,null,false);plSnd('kipu',P.deathCause==='drown'||P.waterDeath||(typeof pDeath!=='undefined'&&pDeath&&pDeath.water)?'kuolema_hukkuminen':'kuolema')||plSnd('kipu','kuolema');   /* v2.46: pDeath.water – syy ja lippu nollautuvat ennen tätä (KORJAUKSET 57) */}PLV.hp0=null;return;}S.dead=0;
  // kipu: terveyden lasku
  const hp=P.hp,mx=maxHp();if(PLV.hp0!==null&&hp<PLV.hp0-.01){const d=PLV.hp0-hp;
    if(P.burnT>0&&d<2){if(plCd('tuli',1.6))plSnd('kipu','kipu_tuli')||plSnd('kipu','kipu');}
    else if((P.drownT||0)>0&&P.underT>1&&d<2){if(plCd('huk',1.5))plSnd('kipu','kipu_hukkuminen')||plSnd('kipu','kipu');}
    else if(P.hunger<=0&&d<1){if(plCd('nalka',7))plSnd('kipu','kipu_nalka')||plSnd('kipu','kipu');}
    else if(plCd('kipu',.35)){const fall=P.landT>.2;if(fall){plSnd('askeleet','putoaminen_tomahdys');if(d>mx*FALL_ANKLE)plSnd('kipu','nilkka');}   /* v2.67 kova alastulo aina, nilkka isossa pudotuksessa */
      if(!(fall&&plSnd('kipu','kipu_putoaminen'))&&!plSnd('kipu',d>mx*.2?'kipu_kova':'kipu'))plSnd('kipu','kipu');}}   // puuttuva erikoisääni → tavallinen kipu
  PLV.hp0=hp;
  // sydämen syke
  let k=hp<mx*.3?clamp((mx*.3-hp)/(mx*.3),.25,1):0;
  if(!P.inDun)for(const m of mobs){if(m.dead||!m.def.stalk||m.def.ai==='boss'||m.def.ai==='rboss')continue;const dd=Math.sqrt(dist2(m.pos.x,m.pos.z,P.pos.x,P.pos.z));if(dd<PL_SCARY_R)k=Math.max(k,clamp(1.15-dd/PL_SCARY_R,.3,1));}
  plLoop('sydan','keho','sydan',k>0,.35+.65*k,.9+.35*k);
  // tilat (siirtymät)
  // v2.67 hengästys silmukkana: alkaa kun kestävyys loppuu (0 %) tai liikutaan ylikuormassa; loppuu kun kestävyys yli HENG_END (30 %) eikä liikuta ylikuormassa
  {const ovm=plOverMoving();if(!S.heng&&(P.stam<1||ovm))S.heng=true;else if(S.heng&&P.stam>maxStam()*HENG_END&&!ovm)S.heng=false;plLoop('heng','keho','hengastys',S.heng,HENG_V,1,HENG_FADE);}S.stam=P.stam;
  // v2.67 vesi: pää pinnan alle (sukellus) ja pinnalle (pinnalle; pitkän sukelluksen jälkeen myös haukkoo henkeä)
  const und=(P.underT||0)>0;if(und&&!S.under&&!P.dead)plSnd('vesi','sukellus');if(!und&&S.under>0&&!P.dead){plSnd('vesi','pinnalle');if(S.under>2)plSnd('keho','haukkoo_henkea');}S.under=und?P.underT:0;
  if(P.cold){S.coldT=(S.coldT||0)+dt;if(S.coldT>4&&plCd('hyt',20+Math.random()*15))plSnd('keho','hytina');}
  else{if(S.coldT>8&&(fireCache||HOME.lvl===2)&&plCd('lam',60))plSnd('keho','lammin');S.coldT=0;}
  if(P.hunger<20&&!P.buffs.taysi&&plCd('vatsa',40+Math.random()*30))plSnd('keho','vatsa_kurisee');
  const pv=!!P.buffs.pahoinvointi;if(pv&&(!S.pv||plCd('pv',15)))plSnd('keho','pahoinvointi');if(pv&&!S.pv)PLV.cd.pv=playTime+15;S.pv=pv;
  const ty=!!P.buffs.taysi;if(ty&&!S.ty)plSnd('keho','kylla');S.ty=ty;
  const lv=!!P.buffs.levannyt;if(lv&&!S.lv)plSnd('keho','levannyt');S.lv=lv;}
/* v2.61 SÄÄ JA TUNNELMA (projekti sounds/saa_ja_tunnelma, avaimet a/<ryhmä>/<ääni>, taso Taustaäänet = volK('amb')). Vain käyttäjän omat äänet.
   saa/: silmukat sade, tihku, myrsky, tuuli, lumi, sumu – voimakkuus sään mukaan (wRain, WIND.spd, wSnow, wFog), ristihäivytys AMB_FADE s,
   sisällä vaimeampi (indoorK), veden alla hiljaa; ukkonen = kertaääni salaman jälkeen (viive). Vain maailmassa (ei luolastossa).
   tunnelma/: silmukka ulottuvuudessa (tunnelma_routaluola …) ja Hautakummussa (tunnelma_hautakumpu).
   satunnaiset/: kertaääni AMB_RND_MIN–AMB_RND_MAX s välein samoissa paikoissa (satunnainen_<paikka>, puuttuessa satunnainen_yhteinen).
   Pelin ulkopuolella (valikko, tauko, kuolema) silmukat häivytetään pois. Puuttuva ääni = hiljaisuus. */
const AMB={L:{},rndT:15,gain:null,ld:0,thT:-1,thV:1,place:null,hold:0,duck:1,nat:{}};
const AMB_FADE=2.5,AMB_RND_MIN=10,AMB_RND_MAX=40,AMB_RND_V=.8;
const AMB_V={sade:.8,tihku:.6,myrsky:1,tuuli:.7,lumi:.5,sumu:.5,ukkonen:.75,salama:1,tunnelma:.75,vedenalla:.8,luonto:.35};
const AMB_REALM={portal1:'routaluola',portal2:'kalmankammio',portal3:'aarnihauta'};
/* v2.67 (käyttäjä): siirtymät ja silmukat. Jokaisesta silmukasta arvotaan yksi versio, kun se alkaa (sää alkaa, paikkaan tullaan), ja vain sitä
   loopataan, kunnes se loppuu. Sää vaihtuu: vanha hiipuu ja uusi voimistuu AMB_FADE 2,5 s. Paikka vaihtuu (maailma ↔ Hautakumpu ↔ ulottuvuus):
   vanhat silmukat loppuvat AMB_CUT 0,3 s:ssa ja uuden paikan silmukat alkavat AMB_HOLD 1 s:n päästä (nousu 1 s). Taukovalikko: kaikki hiljenevät
   AMB_DUCK 1 s:ssa ja palaavat peliin palatessa (silmukat jatkuvat samoina). Vedenalainen silmukka (tunnelma_vedenalla) nousee ja laskee 0,5 s.
   Myrskyssä myrsky- ja ukkossilmukka (taustajyrinä) yhdessä; salaman isku (salama) kertaäänenä 0–3 s salaman jälkeen.
   LUONTO (maailma, hiljaa AMB_V.luonto): linnunlaulu (päivä, tyyni, ei sadetta, ei vuorilla/nummella), heinäsirkat (yö, ei sadetta/lunta, ei vuorilla/
   tuntureilla), puiden humina (metsät, tuuli > 6 m/s) ja biomien sivuäänet (NAT_BIO, päivä/yö) soivat satunnaisina jaksoina: tauko NAT_GAP,
   jakso NAT_LEN 30–120 s, hidas nousu ja lasku NAT_FADE 6–10 s. */
const AMB_CUT=.3,AMB_HOLD=1,AMB_DUCK=1,AMB_UW_FADE=.5;
const NAT_GAP=[60,240],NAT_FIRST=[15,90],NAT_LEN=[30,120],NAT_FADE=[6,10];
const NAT_BIO={forest:'korpimetsa',koivu:'koivulehto',aarni:'aarnimetsa',suo:'upposuo',moor:'kalmanummi',meadow:'rantaniitty'};
const NAT_NOBIRD=new Set(['mountain','peak','rakka','sea','moor']),NAT_NOCRICKET=new Set(['mountain','peak','rakka','tunturi','sea']),NAT_TREES=new Set(['forest','koivu','aarni']);
const nRnd=r=>r[0]+Math.random()*(r[1]-r[0]);
function ambLoad(){if(AMB.ld||!CRE.ok)return;AMB.ld=1;for(const n in CRE.man)if(n.startsWith('a/'))creBuf(n);}
function ambPlace(){return P.realm?AMB_REALM[P.realm]||'hautakumpu':'hautakumpu';}
// luonnon jakso: ehto täyttyy → tauon jälkeen soi NAT_LEN s; palauttaa tavoitetason 0–1 (nousu/lasku hoidetaan häivytysajalla AMB.L[k].fd)
function natEp(k,ok,dt){dt=+dt||0;const N=AMB.nat[k]||(AMB.nat[k]={on:false,t:nRnd(NAT_FIRST),fd:nRnd(NAT_FADE)});
  if(!ok){if(N.on){N.on=false;N.t=nRnd(NAT_GAP);}return 0;}
  N.t-=dt;if(N.t<=0){N.on=!N.on;N.t=N.on?nRnd(NAT_LEN):nRnd(NAT_GAP);N.fd=nRnd(NAT_FADE);N.v=.75+Math.random()*.25;}return N.on?N.v:0;}
function ambTargets(dt){const t={};if(typeof state==='undefined'||(state!=='play'&&state!=='ui'&&state!=='paused')||P.dead)return t;
  if(P.inDun){t['tunnelma/tunnelma_'+ambPlace()]=AMB_V.tunnelma;return t;}
  const W=WEATHERS[weather.cur]||WEATHERS.selkea,cur=weather.cur;
  if(W.storm){const sk=clamp(wRain/1.4,0,1);t['saa/myrsky']=sk*AMB_V.myrsky;t['saa/ukkonen']=sk*AMB_V.ukkonen;}else if(cur==='tihku')t['saa/tihku']=clamp(wRain/.35,0,1)*AMB_V.tihku;else t['saa/sade']=clamp(wRain,0,1)*AMB_V.sade;
  if(!W.storm)t['saa/tuuli']=clamp((WIND.spd-6)/8,0,1)*AMB_V.tuuli;
  t['saa/lumi']=(P.pos.y>10?clamp(wSnow,0,1):0)*AMB_V.lumi;t['saa/sumu']=(cur==='sumu'?clamp((1-wFog)/.85,0,1):0)*AMB_V.sumu;
  // luonto
  const b=biomeHere(P.pos.x,P.pos.z),night=isNight(),dry=wRain<.1&&wSnow<.1,nv=AMB_V.luonto*(1-clamp(wRain,0,1)*.7);
  t['luonto/linnunlaulu']=natEp('lin',!night&&dry&&WIND.spd<7&&!NAT_NOBIRD.has(b)&&P.pos.y<30,dt)*nv;
  t['luonto/heinasirkat']=natEp('hei',night&&dry&&!NAT_NOCRICKET.has(b),dt)*nv;
  t['luonto/puiden_humina']=natEp('hum',NAT_TREES.has(b)&&WIND.spd>6&&!W.storm,dt)*nv;
  for(const bb in NAT_BIO)for(const tt of ['paiva','yo']){const k='biomit/'+NAT_BIO[bb]+'_'+tt;const v=natEp(k,b===bb&&night===(tt==='yo'),dt);if(v>0||AMB.L[k])t[k]=v*nv;}
  const k=(1-.55*(indoorK||0))*(CAM_UW>0?.25:1);for(const n in t)t[n]*=k;
  t['tunnelma/tunnelma_vedenalla']=CAM_UW>0?AMB_V.vedenalla:0;return t;}
function ambFade(k){if(k==='tunnelma/tunnelma_vedenalla')return AMB_UW_FADE;if(k.startsWith('luonto/')||k.startsWith('biomit/')){const N=AMB.nat[k.startsWith('biomit/')?k:{'luonto/linnunlaulu':'lin','luonto/heinasirkat':'hei','luonto/puiden_humina':'hum'}[k]];return N?N.fd:8;}return AMB_FADE;}
function ambStart(key){const [g,ev]=key.split('/'),L0=mRes(g,ev,'a');if(!L0)return null;const L=L0.filter(n=>CRE.buf[n]);if(!L.length){ambLoad();return null;}
  const a=actx,name=L[Math.random()*L.length|0],src=a.createBufferSource(),gn=a.createGain();src.buffer=CRE.buf[name];src.loop=true;const lp=tgLoopPts(src.buffer);src.loopStart=lp[0];src.loopEnd=lp[1];
  if(!AMB.gain){AMB.gain=a.createGain();AMB.gain.connect(sndBus(a));}gn.gain.value=0;src.connect(gn);gn.connect(AMB.gain);src.start(0,Math.random()*Math.max(0,lp[1]-lp[0]-.1));return {src,g:gn,name};}
function ambStop(h,f){if(!h)return;const a=actx;if(f&&a){try{h.g.gain.cancelScheduledValues(a.currentTime);h.g.gain.setTargetAtTime(0,a.currentTime,f/3);h.src.stop(a.currentTime+f+.05);}catch(e){}setTimeout(()=>{try{h.g.disconnect();}catch(e){}},f*1000+120);return;}
  try{h.src.stop();}catch(e){}try{h.g.disconnect();}catch(e){}}
// salaman isku: salama-kertaääni d s myöhemmin (lähelle iskevä 0,05–0,3 s ja täysillä, kaukainen 0,5–3 s ja hiljempaa)
function ambThunder(d){AMB.thT=Math.max(.05,d);AMB.thV=d<.35?1:clamp(1.1-d*.2,.45,1);}
function ambTick(dt){const a=actx;if(!a||a.state!=='running'||!soundOn||!CRE.ok){for(const k in AMB.L){ambStop(AMB.L[k].h);delete AMB.L[k];}return;}
  dt=Math.min(dt,.25);uwAudioTick();const vol=volK('amb'),now=a.currentTime,live=state==='play'||state==='ui';
  // taukovalikko: kaikki hiljenevät 1 s ja palaavat (silmukat jatkuvat)
  const dk=live||state==='paused'?(live?1:0):1;if(dk!==AMB.duck){AMB.duck=dk;if(AMB.gain)AMB.gain.gain.setTargetAtTime(dk,now,AMB_DUCK/3);}
  if(state==='paused')return;
  // paikan vaihto: vanhat pois 0,3 s, uudet 1 s:n päästä
  const pl=P.inDun?'d:'+ambPlace():'w';if(pl!==AMB.place){if(AMB.place!==null){for(const k in AMB.L){ambStop(AMB.L[k].h,AMB_CUT);delete AMB.L[k];}AMB.hold=AMB_HOLD;}AMB.place=pl;}
  if(AMB.hold>0){AMB.hold-=dt;return;}
  const T=ambTargets(dt);if(Object.keys(T).length)ambLoad();
  for(const k in T)if(!AMB.L[k]&&T[k]>.002)AMB.L[k]={h:null,cur:0,retry:0,fast:pl!=='w'||k==='tunnelma/tunnelma_vedenalla'};
  for(const k in AMB.L){const L=AMB.L[k],tg=T[k]||0,st=dt/(L.fast&&L.cur<tg?(k==='tunnelma/tunnelma_vedenalla'?AMB_UW_FADE:AMB_HOLD):ambFade(k));L.cur=L.cur<tg?Math.min(tg,L.cur+st):Math.max(tg,L.cur-st);
    if(!L.h&&tg>.002){L.retry-=dt;if(L.retry<=0){L.h=ambStart(k);L.retry=2;}}
    if(L.h)L.h.g.gain.setTargetAtTime(L.cur*vol,now,.08);
    if(L.cur<=.001&&tg<=.002){ambStop(L.h);delete AMB.L[k];}}
  if(AMB.thT>0){AMB.thT-=dt;if(AMB.thT<=0){AMB.thT=-1;if(live&&!P.inDun)mSnd('saa','salama',{pre:'a',cat:'amb',v:AMB_V.salama*AMB.thV*(1-.45*(indoorK||0))*(CAM_UW>0?.4:1),pj:.08});}}
  if(live&&P.inDun&&!P.dead){AMB.rndT-=dt;if(AMB.rndT<=0){AMB.rndT=AMB_RND_MIN+Math.random()*(AMB_RND_MAX-AMB_RND_MIN);ambLoad();
      if(!mSnd('satunnaiset','satunnainen_'+ambPlace(),{pre:'a',cat:'amb',v:AMB_RND_V,pj:.06}))mSnd('satunnaiset','satunnainen_yhteinen',{pre:'a',cat:'amb',v:AMB_RND_V,pj:.06});}}
  else AMB.rndT=AMB_RND_MIN+Math.random()*(AMB_RND_MAX-AMB_RND_MIN);}
/* v2.67 ÄÄNET VEDEN ALLA (käyttäjä: kaikki pelin äänet, ei musiikki eikä valikot): yhteinen väylä sndBus = alipäästö + vahvistus ennen kaiuttimia.
   Kun kamera on veden alla (CAM_UW > 0): diskantti leikataan (UW_LP Hz) ja taso UW_G; siirtymä 0,3 s. Olennot, pelaaja, sää, tunnelma ja
   ilmoitukset (mSnd cat notif/amb) kulkevat väylän kautta. */
const SBUS={f:null,g:null,uw:false},UW_LP=650,UW_G=.7;
function sndBus(a){if(!SBUS.f){SBUS.f=a.createBiquadFilter();SBUS.f.type='lowpass';SBUS.f.frequency.value=22000;SBUS.f.Q.value=.7;SBUS.g=a.createGain();SBUS.f.connect(SBUS.g);SBUS.g.connect(a.destination);}return SBUS.f;}
function uwAudioTick(){const a=actx;if(!a||!SBUS.f)return;const uw=typeof CAM_UW!=='undefined'&&CAM_UW>0&&!P.inDun&&(state==='play'||state==='ui'||state==='paused');if(uw===SBUS.uw)return;SBUS.uw=uw;
  const t=a.currentTime;SBUS.f.frequency.cancelScheduledValues(t);SBUS.f.frequency.setTargetAtTime(uw?UW_LP:22000,t,.1);SBUS.g.gain.setTargetAtTime(uw?UW_G:1,t,.1);}
creInit();   // v2.52: manifesti ja valikko-/introäänet heti (maailman intro sivun uudelleenlatauksen jälkeen)
