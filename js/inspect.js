'use strict';
/* v2.98 F-TARKASTELU (käyttäjä). Kun vasara ei ole kädessä, F (korjaa-näppäin) tarkastelee oikean käden esinettä: käsi nousee eteen hieman
   koukkuun ja kääntelee esinettä hitaasti, pää katsoo hieman alas ja seuraa esinettä. Tyypit (INSP_TYPE): pitkä (miekat, keihäs, lapio, kuokka),
   raskas (kirveet, hakut, nuija), pieni (kulho, tyhjä käsi ym.), puukko (knife: omat + pienten animaatiot). F arpoo sopivan animaation.
   Käsi viedään IK:lla (armIK) kehon koordinaateissa annettuun pisteeseen ja esineen suunta lasketaan suoraan (käden kvaternio).
   Keskeytyy heti, kun kättä käytetään (lyönti, hiiren napit, jousi, torjunta, kaiverrus, E-toiminto, pikapaikka, esineen vaihto, uinti).
   Ääni (sounds/extra/raw/f_ihmettely): 2 s kohdalla 10 % wow tai mmm (v3.07 käyttäjä: harvinaisempi, arvotaan kerran jokaisella toistolla, myös uudella esineellä). Uusi esine (saatu alle 2 min sitten) kädessä ja pelaaja AFK (P.afkT)
   → tarkastelee kerran itsestään ja ääni soi varmasti. DEV Ä › Tarkasteluanimaatiot (0,2 s viive, vihje mille esineelle).
   v2.99 (käyttäjä: nykiminen, varsinkin paluu lepoon):
   - Sekoitus aikapohjainen ja pehmeä (INS.u lineaarinen 0…1, INS.k = smootherstep): sisään INSP_IN s, ulos INSP_OUT s.
   - Käden perusasento palautetaan joka ruudun alussa (inspectRestore, player.js) – ennen IK:n tulos jäi käsivarren Euler-kulmiksi, joista
     perusasennon lerp jatkoi (kulmien hyppy/kiepahdus → nykiminen paluussa).
   - F uudelleen: uusi animaatio alkaa pehmeästi edellisen asennosta (ristiinhäivytys INSP_XF s), myös pää; pää pehmennetään omalla
     nopeudellaan (INS.hy/hp), ei hyppää.
   - Esine kuuluu animaatioon: puukon heitot irtoavat kädestä (pose.fly: lentopiste kehon koordinaateissa + pyörähdys), ote voi kääntyä
     (pose.g = esineen kierto käden x-akselin ympäri, väärä ote = π/2). Miekalla villimpi huitomis- ja pistokoe, puukolla villimmät pistot,
     5 % korkea heitto (pyörii ilmassa, napataan huitaisulla kämmeneen väärinpäin), 10 % pyöräytysheittely (180° kerrallaan, käsi notkahtaa). */
/* v2.99 käyttäjä: AFK-lähitarkastelu – kun AFK-animaatio alkaa (P.afkT > INSP_AFK0, sama raja kuin player.js afkK) ja oikeassa kädessä on esine,
   arvotaan kerran AFK-jaksoa kohden INSP_AFK_P (10 %): puolet heti AFK:n alussa, puolet 5–10 s AFK-animaation jälkeen. Animaatio = esineen
   tyypin lähikatselu (INSP_CLOSE). Liikkuminen/syöte nollaa P.afkT → uusi arvonta seuraavalla AFK-kerralla. */
const INSP_AFK0=3,INSP_AFK_P=.1,INSP_CLOSE={long:'pitka_tera',heavy:'raskas_tera',small:'pieni_lahikatselu',knife:'pieni_lahikatselu'};
function inspectAfkTick(){const a=P.afkT||0;if(a<INSP_AFK0){INS.afk=null;return;}
  if(!INS.afk)INS.afk={at:Math.random()<INSP_AFK_P?INSP_AFK0+(Math.random()<.5?.2:5+Math.random()*5):-1};
  const A=INS.afk;if(A.at>0&&a>=A.at){A.at=-1;if(heldId&&!P.insp&&state==='play'&&!inspMoving())inspectStart(INSP_CLOSE[INSP_TYPE(heldId)],{afk:1});}}
const INSP_SND_T=2,INSP_SND_P=.1,INSP_SND_PH=.3,INSP_SND_PITY=4,INSP_NEW_T=120,INSP_AFK_T=4,INSP_KNIFE_THROW=.05,INSP_KNIFE_FLIP=.1,INSP_KNIFE_BOTTLE=.001,INSP_THROW_V=.7,INSP_THROW_VS=.4,INSP_SPIN_UP=.07,INSP_IN=.55,INSP_OUT=.8,INSP_XF=.7;
function INSP_TYPE(id){if(!id)return 'small';const d=ITEMS[id];if(!d)return 'small';if(id==='puukko')return 'knife';if(d.cat==='hammer')return 'heavy';
  if(/miekka/.test(id)||id==='keihas'||d.cat==='shovel')return 'long';if(d.chop||d.pick||id==='nuija')return 'heavy';return 'small';}
const _ie=(a,b,k)=>a+(b-a)*k,_iv3=(a,b,k)=>[_ie(a[0],b[0],k),_ie(a[1],b[1],k),_ie(a[2],b[2],k)],_ism=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
/* avainruudut: [aika, käden paikka, esineen suunta, kierto s, ote g] – välit smootherstepillä (pehmeä alku ja loppu) */
function _ikf(K,t){if(t<=K[0][0])return _ikp(K[0]);for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(t<b[0]){const w=_ism((t-a[0])/(b[0]-a[0]));
    return {p:_iv3(a[1],b[1],w),d:_iv3(a[2],b[2],w),s:_ie(a[3]||0,b[3]||0,w),g:_ie(a[4]||0,b[4]||0,w)};}}return _ikp(K[K.length-1]);}
const _iwr=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};   // kulma välille (−π, π]
const _ikp=k=>({p:k[1].slice(),d:k[2].slice(),s:k[3]||0,g:k[4]||0});
/* pose: p = käden paikka kehon koordinaateissa (−x = oikea, +z = eteen), d = esineen suunta, s = kierto esineen akselin ympäri,
   g = esineen kierto käden x-akselin ympäri (ote), fly = {p, a}: esine irti kädestä (lentopiste ja pyörähdys) */
const KG=[-.15,1.24,.33],KD=[.05,.12,1],KI=[-.1,1.45,.42],KID=[.5,.5,.7];   // puukon perusote ja tarkastelu
const INSP_ANIMS=[
  {id:'pitka_tera',n:'Terän katselu',best:'miekat, keihäs',type:'long',dur:6.5,f:(t,S)=>({p:[-.1,1.3+.03*Math.sin(t*.7),.44],d:[.75,.2+.08*Math.sin(t*.8),.62],s:S*1.5*Math.sin(t*.9)})},
  {id:'pitka_pituus',n:'Pituuden katselu',best:'miekat, lapio, kuokka',type:'long',dur:6,f:(t,S)=>{const k=.5-.5*Math.cos(t*1.05);return {p:[-.1,_ie(1.12,1.24,k),.46],d:_iv3([0,.95,.32],[.55,.5,.66],k),s:S*.7*Math.sin(t*.7)};}},
  {id:'pitka_huitoo',n:'Huitomis- ja pistokoe',best:'miekat (parhaiten rautamiekka)',type:'long',dur:6.6,f:(t,S)=>_ikf([
    [0,[-.16,1.22,.32],[.05,.15,1]],[.45,[-.22,1.32,.2],[.1,.3,1]],[.75,[-.2,1.3,.66],[0,.08,1]],[1.05,[-.16,1.22,.34],[.05,.15,1]],   // pisto
    [1.45,[-.44,1.58,.24],[-.5,.78,.38]],[1.8,[.12,1.04,.5],[.65,-.32,.7]],                                                                // viilto oikealta ylhäältä vasemmalle alas
    [2.2,[.1,1.3,.42],[.75,.25,.6]],[2.55,[-.42,1.2,.46],[-.8,.08,.6]],                                                                    // takakäden viilto
    [2.9,[-.18,1.22,.36],[.05,.15,1]],[3.15,[-.2,1.34,.66],[0,.12,1]],[3.4,[-.16,1.22,.36],[.05,.15,1]],[3.6,[-.2,1.06,.64],[0,-.15,1]],     // pisto, pisto alas
    [3.9,[-.16,1.24,.38],[.05,.2,1],0],[4.7,[-.14,1.28,.42],[.1,.3,1],S*Math.PI*2],                                                        // ranteen pyöräytys
    [5.3,[-.1,1.32,.44],[.72,.25,.62],S*Math.PI*2],[6.6,[-.1,1.32,.44],[.72,.3,.62],S*Math.PI*2+S*.8]],t)},                                 // terän katselu
  {id:'raskas_tera',n:'Terän tarkastus',best:'kirveet, hakut',type:'heavy',dur:6.5,f:(t,S)=>({p:[-.08,1.36+.02*Math.sin(t),.44],d:[.42,.82,.38],s:S*1.25*Math.sin(t*.85)})},
  {id:'raskas_punnitus',n:'Painon punnitus',best:'kirveet, nuija',type:'heavy',dur:5,f:(t,S)=>{const b=Math.max(0,Math.sin(t*3.1))*sstep(.3,.8,t)*(1-sstep(3.8,4.5,t));return {p:[-.15,1.02+.08*b,.44],d:[.1,.35+.2*b,1],s:S*.25*Math.sin(t*.9)};}},
  {id:'raskas_heilautus',n:'Hidas heilautus',best:'kirveet, hakut, nuija',type:'heavy',dur:6,f:(t,S)=>_ikf([[0,[-.2,1.4,.4],[0,.9,.35]],[.4,[-.2,1.46,.4],[0,.95,.3]],[1.4,[-.12,1.1,.62],[0,-.1,1]],[2,[-.16,1.3,.5],[0,.6,.8]],
    [2.6,[-.2,1.46,.4],[0,.95,.3]],[3.6,[-.12,1.1,.62],[0,-.1,1]],[4.4,[-.14,1.32,.46],[.3,.8,.5]],[6,[-.12,1.34,.46],[.4,.8,.45],S*.8]],t)},
  {id:'pieni_lahikatselu',n:'Lähikatselu',best:'kulho, puukko, pienet',type:'small',dur:6,f:(t,S)=>({p:[-.09,1.53+.02*Math.sin(t*1.1),.4],d:[.55,.45+.12*Math.sin(t*.6),.7],s:S*1.8*Math.sin(t*.8)})},
  {id:'pieni_ojennus',n:'Käsi ojennettuna',best:'kulho, puukko, pienet',type:'small',dur:5.5,f:(t,S)=>({p:[-.24,1.36,.58],d:[.25,.25+.1*Math.sin(t*.9),1],s:S*2.2*Math.sin(t*.7)})},
  {id:'pieni_kaannos',n:'Lähelle ja kauas',best:'kulho, pienet',type:'small',dur:6.5,f:(t,S)=>{const k=.5-.5*Math.cos(t*1.05);return {p:_iv3([-.09,1.53,.4],[-.24,1.34,.58],k),d:_iv3([.55,.5,.65],[.2,.2,1],k),s:S*1.6*Math.sin(t*.9+1)};}},
  {id:'puukko_pistot',n:'Villit pistot ja viillot',best:'puukko',type:'knife',dur:5,f:(t,S)=>_ikf([
    [0,KG,KD],[.3,[-.32,1.36,.18],[.2,.3,1]],[.48,[-.16,1.3,.64],[0,.05,1]],[.7,KG,KD],                                     // pisto
    [.9,[-.42,1.5,.3],[-.4,.5,.8]],[1.12,[.1,1.1,.5],[.7,-.2,.7]],[1.36,[-.36,1.25,.48],[-.7,.2,.7]],[1.58,KG,KD],          // viilto ja takakäsi
    [1.76,[-.12,1.04,.62],[0,-.2,1]],[1.94,KG,KD],[2.12,[-.15,1.5,.58],[0,.3,1]],[2.34,KG,KD,0],                              // ala- ja yläpisto
    [3.3,[-.14,1.3,.4],[.1,.45,.9],S*Math.PI*4],[3.7,KI,KID,S*Math.PI*4],[5,KI,[.5,.6,.65],S*Math.PI*4+S*1.2]],t)},          // pyöräytys ja katselu
  {id:'puukko_heitto',n:'Korkea heitto, nappaus väärinpäin',best:'puukko (5 %)',type:'knife',rare:'throw',dur:7,f:(t,S)=>{
    /* .45 heitto: puukko lentää 1,1 s (nousee 1,3 m, 2¼ kierrosta), käsi laskee ja nappaa huitaisulla 1,55 → väärä ote (g = π/2),
       sivupisto, yläpisto, ote takaisin ja katselu */
    const O=[-.14,1.3,.4],C=[.02,1.32,.46],t0=.45,T=1.1,R=Math.PI/2;
    const pz=_ikf([[0,KG,KD],[t0,O,[0,.35,1]],[.7,[-.16,1.38,.4],[0,.4,1]],[1.05,[-.22,1.12,.38],[0,.2,1]],[1.32,[-.44,1.32,.3],[-.2,.3,1]],[t0+T,C,[.1,.25,1]],
      [1.85,[-.12,1.3,.42],[0,.2,1],0,R],[2.2,[-.46,1.38,.18],[-.2,.2,1],0,R],[2.45,[-.04,1.3,.58],[.2,.1,1],0,R],[2.75,[-.12,1.3,.42],[0,.2,1],0,R],
      [3.2,[-.24,1.78,.44],[0,.2,1],0,R],[3.45,[-.14,1.1,.58],[0,.1,1],0,R],[3.9,[-.12,1.3,.42],[0,.2,1],0,R],[4.6,[-.12,1.3,.42],[.1,.3,1],0,0],[5.2,KI,KID],[7,KI,[.5,.6,.65],S*1.2]],t);
    if(t>=t0&&t<t0+T){const u=(t-t0)/T,pp=_iv3(O,C,u);pp[1]+=1.3*Math.sin(Math.PI*u);pz.fly={p:pp,a:u*(Math.PI*4+R)};pz.g=0;}else if(t>=t0+T&&t<1.85)pz.g=R;
    return pz;}},
  {id:'puukko_heitto3',n:'Kolme korkeaa heittoa putkeen',best:'puukko (puolet 5 %:n heitoista)',type:'knife',rare:'throw3',dur:6.4,f:(t,S,R)=>{
    /* v2.99 käyttäjä: 5 %:n heiton muunnelma – kolme korkeaa heittoa peräkkäin hieman eri korkeuksille (R = arvotut korkeudet), 2 kierrosta kukin,
       käsi laskee heiton ajaksi ja nappaa huitaisulla kiinni oikein päin; lopuksi katselu */
    const O=[-.14,1.3,.4],C=[-.04,1.3,.44],T=.95,TS=[.45,1.75,3.05],H=R||[1.05,1.35,1.2];
    const K=[[0,KG,KD],[TS[0],O,[0,.35,1]]];TS.forEach((ts,i)=>{K.push([ts+.25,[-.16,1.36,.4],[0,.4,1]],[ts+.6,[-.22,1.12,.38],[0,.2,1]],[ts+.8,[-.4,1.3,.32],[-.2,.3,1]],[ts+T,C,[.1,.25,1]],[ts+T+.25,O,[0,.35,1]]);});
    K.push([4.6,KI,KID],[6.4,KI,[.5,.6,.65],S*1.2]);const pz=_ikf(K,t);
    TS.forEach((ts,i)=>{if(t>=ts&&t<ts+T){const u=(t-ts)/T,pp=_iv3(O,C,u);pp[1]+=H[i]*Math.sin(Math.PI*u);pz.fly={p:pp,a:u*Math.PI*4,n:i};pz.g=0;}});
    return pz;}},
  {id:'puukko_kaanto',n:'Pyöräytysheittely 180°',best:'puukko (10 %)',type:'knife',rare:'flip',dur:5.8,f:(t,S)=>{
    /* puukko pystyssä; 4 pientä heittoa, joissa se kääntyy 180° (ote vaihtuu oikea ↔ väärä), käsi notkahtaa heittojen välissä; sitten katselu */
    const H=[-.13,1.3,.42],D=[0,.8,.6],L=[-.13,1.2,.42],T=.5,TS=[.6,1.35,2.1,2.85];
    const K=[[0,KG,KD],[.4,H,D]];TS.forEach((ts,i)=>{K.push([ts,H,D,0,i*Math.PI],[ts+T*.5,L,D,0,i*Math.PI],[ts+T,H,D,0,(i+1)*Math.PI],[ts+T+.12,L,D,0,(i+1)*Math.PI]);});
    K.push([3.9,KI,KID,0,4*Math.PI],[5.8,KI,[.5,.6,.65],S*1.2,4*Math.PI]);const pz=_ikf(K,t);
    for(let i=0;i<TS.length;i++){const ts=TS[i];if(t>=ts&&t<ts+T){const u=(t-ts)/T,pp=H.slice();pp[1]+=.34*Math.sin(Math.PI*u);pz.fly={p:pp,a:i*Math.PI+u*Math.PI,n:i};pz.g=0;}}
    return pz;}},
  {id:'puukko_pullo',n:'Pyöritys kämmenellä (pullonpyöritys)',best:'puukko (0,1 %)',type:'knife',rare:'bottle',dur:7.6,f:(t,S)=>{
    /* v2.99 käyttäjä: puukko asetellaan lappeelleen kämmenelle (.3–.7), vasen käsi tarttuu kärkeen ja antaa vauhtia (1,1–1,3), puukko pyörii kuin
       pullo ja hidastuu pehmeästi (ω ∝ (1−u)², 1,25–4,3 s), pompautus ilmaan (4,6–5,1) ja kiinniotto oikein päin, lopuksi katselu */
    const PALM=[-.07,1.28,.4],pz=_ikf([[0,KG,KD],[.6,PALM,[0,-.15,1],INSP_PALM_S],[4.55,PALM,[0,-.15,1],INSP_PALM_S],[4.85,[-.1,1.34,.45],[0,.1,1],INSP_PALM_S*.4],
      [5.15,[-.12,1.28,.42],[0,.25,1]],[5.8,KI,KID],[7.6,KI,[.5,.6,.65],S*1.2]],t);
    const T0=1.25,TT=3.05,W0=14,u=clamp((t-T0)/TT,0,1),th=t<T0?0:W0*TT*(1-Math.pow(1-u,3))/3;
    const w=sstep(.3,.7,t)*(1-sstep(4.6,5.1,t)),tu=clamp((t-4.6)/.5,0,1);
    pz.spin={th,w,h:t>4.6&&t<5.1?.26*Math.sin(Math.PI*tu):0};
    pz.L=_ikf([[.8,[.1,1.05,.25],[0,0,1]],[1.08,[-.02,1.24,.6],[0,0,1]],[1.32,[.14,1.26,.5],[0,0,1]],[2,[.12,1.1,.3],[0,0,1]]],t).p;pz.lw=sstep(.75,1.05,t)*(1-sstep(1.4,2.1,t));
    return pz;}},
];
const INSP_PALM_S=Math.PI/2,INSP_SFLAT=Math.PI/2,INSP_KMID=.1;   // kämmen ylöspäin (käden kierto), terä lappeellaan, puukon keskikohta kahvasta
const INS={u:0,k:0,pose:null,hy:0,hp:0,qid:new THREE.Quaternion(),bq:new THREE.Quaternion(),be:0,saved:false,bqL:new THREE.Quaternion(),beL:0,savedL:false,flew:false};
const _ispA=new THREE.Vector3(),_ispB=new THREE.Vector3(),_ispX=new THREE.Vector3(),_ispY=new THREE.Vector3(),_ispZ=new THREE.Vector3(),_ispM=new THREE.Matrix4(),_ispQ=new THREE.Quaternion(),_ispQ2=new THREE.Quaternion(),_ispQ3=new THREE.Quaternion();
function inspectAnimsFor(type){return INSP_ANIMS.filter(a=>a.type===type||(type==='knife'&&a.type==='small'));}
function _ipMix(a,b,w){if(!a)return b;return {p:_iv3(a.p,b.p,w),d:_iv3(a.d,b.d,w),s:_ie(a.s||0,b.s||0,w),g:_ie(a.g||0,b.g||0,w),fly:b.fly,spin:b.spin,L:b.L,lw:(b.lw||0)*w};}
// F: vasara kädessä → korjaa (input.js); muuten tarkastelu. id = DEV-valinta, o.auto = uusi esine (ääni varmasti)
function inspectStart(id,o={}){if(state!=='play'||P.dead||P.swim||P.atk||P.drawing||P.carve)return false;const w=equipped('weapon');if(w&&w.cat==='hammer'&&!o.afk)return false;   /* vasara: F korjaa, AFK-tarkastelu sallittu */if(heldId&&ITEMS[heldId].cat==='bow')return false;   // jousi on vasemmassa kädessä
  if(INS.pose&&(INS.pose.fly||INS.pose.spin&&INS.pose.spin.w>.02))return false;   // puukko ilmassa: ei keskeytetä kesken heiton
  const type=INSP_TYPE(heldId);let a=id?INSP_ANIMS.find(x=>x.id===id):null;
  if(!a){const L=inspectAnimsFor(type).filter(x=>!x.rare&&(!P.insp||x.id!==P.insp.a.id)),r=Math.random();
    a=type==='knife'&&r<INSP_KNIFE_BOTTLE?INSP_ANIMS.find(x=>x.rare==='bottle'):type==='knife'&&r<INSP_KNIFE_THROW?INSP_ANIMS.find(x=>x.rare===(Math.random()<.5?'throw3':'throw')):type==='knife'&&r<INSP_KNIFE_THROW+INSP_KNIFE_FLIP?INSP_ANIMS.find(x=>x.rare==='flip'):L[Math.random()*L.length|0];}
  if(!a)return false;
  // ristiinhäivytys: uusi animaatio alkaa edellisen (tai paluuta tekevän) asennon kohdalta
  const from=INS.pose&&INS.k>.02?{p:INS.pose.p.slice(),d:INS.pose.d.slice(),s:_iwr(INS.pose.s||0),g:_iwr(INS.pose.g||0)}:null;
  P.insp={a,t:0,R:[.95+Math.random()*.25,1.2+Math.random()*.3,1.05+Math.random()*.25].sort(()=>Math.random()-.5),S:Math.random()<.5?-1:1,item:heldId,snd:false,auto:!!o.auto,afk:!!o.afk,from,fk:from?INS.k:0};return true;}
function inspMoving(){return state==='play'&&(Math.hypot(P.vel.x,P.vel.z)>.6||['fwd','back','left','right','jump'].some(a=>kd(a)));}
function inspectStop(){if(P.insp)P.insp=null;}
// joka ruutu (main.js update): keskeytys, ääni ja uuden esineen automaattinen tarkastelu
/* v2.99 käyttäjä: F-vinkki – kun puukko otetaan käteen 10. kerran (INSP_TIP_N; vain tutoriaalin ulkopuolella, flags.knifeEqN), kerran maailmaa kohti
   vinkki F-tarkastelusta (ylävinkki + lyhyt chat-muistutus, flags.fTip): toimii myös muilla työkaluilla ja aseilla. */
const INSP_TIP_N=10;
function inspectTipTick(){if(heldId===INS.lastHeld)return;INS.lastHeld=heldId;if(heldId!=='puukko'||flags.fTip||state!=='play'||(typeof TUT!=='undefined'&&TUT.on))return;
  flags.knifeEqN=(flags.knifeEqN|0)+1;if(flags.knifeEqN<INSP_TIP_N)return;flags.fTip=1;const k=typeof keyLabel==='function'?keyLabel(BIND.repair):'F';
  msg(`Vinkki: paina ${k} – tutki esinettä kädessäsi.`,'loot');const el=tipEl();el.querySelector('.tipD').innerHTML=`Paina <kbd>${k}</kbd>, niin hahmo tarkastelee kädessä olevaa esinettä – puukolla on myös harvinaisia temppuja. Toimii muillakin työkaluilla ja aseilla (ei vasaralla – sillä ${k} korjaa).`;
  el.classList.add('on');TUT.tipT=14;if(typeof RES!=='undefined')RES.tipT=14;if(typeof mSnd==='function')mSnd('napit','hover');}
function inspectTick(dt){inspectTipTick();const I=P.insp;
  if(I){I.t+=dt;if((I.afk||I.auto)&&inspMoving()){inspectStop();return;}   // v3.24 käyttäjä: AFK-/automaattinen tarkastelu loppuu pehmeästi liikkeelle lähtiessä (F:llä itse aloitettu jatkuu)
    if(P.atk||P.drawing||P.blocking||P.carve||mouseL||mouseR||P.dead||P.swim||heldId!==I.item||state!=='play'&&state!=='ui'){inspectStop();return;}
    if(!I.snd&&I.t>=INSP_SND_T){I.snd=true;const em=!I.item;   /* v3.22 käyttäjä: tyhjällä kädellä ääni tuntui puuttuvan (10 %) → 30 % ja takuu: viimeistään joka INSP_SND_PITY. tyhjän käden tarkastelu */
      INS.noSnd=em?(INS.noSnd|0)+1:INS.noSnd|0;if(Math.random()<(em?INSP_SND_PH:INSP_SND_P)||em&&INS.noSnd>=INSP_SND_PITY){if(em)INS.noSnd=0;plSnd('f_ihmettely',Math.random()<.5?'wow':'mmm',{v:.85});}   /* v3.05 käyttäjän äänet hieman hiljempaa */}
    if(I.t>=I.a.dur)inspectStop();return;}
  inspectAfkTick();
  const N=P.newItem;if(N&&!N.done&&state==='play'&&heldId&&heldId===N.id&&playTime-N.t<INSP_NEW_T&&(P.afkT||0)>INSP_AFK_T&&!P.atk&&!P.drawing){N.done=1;inspectStart(null,{auto:1});}}
// v2.99 perusasennon palautus ennen käsivarren lerpiä (player.js): IK-tulos ei jää perusasennoksi
function inspectRestore(){if(INS.savedL){fig.armL.quaternion.copy(INS.bqL);fig.elbowL.rotation.x=INS.beL;INS.savedL=false;}if(!INS.saved)return;fig.armR.quaternion.copy(INS.bq);fig.elbowR.rotation.x=INS.be;INS.saved=false;}
function _heldReset(){if(!heldMesh)return;const U=heldMesh.userData;if(U.ip0)heldMesh.position.copy(U.ip0);if(U.iq0)heldMesh.quaternion.copy(U.iq0);}
// asennon jälkeen (player.js): käsi IK:lla, esineen suunta ja ote, pää seuraa; INS.k pehmentää sisään ja ulos
function inspectPose(dt){const I=P.insp;INS.u=clamp(INS.u+(I?dt/INSP_IN:-dt/INSP_OUT),0,1);INS.k=_ism(INS.u);
  if(I){let pz=I.a.f(I.t,I.S,I.R);if(I.from){const w=_ism(I.t/INSP_XF);pz=_ipMix(I.from,pz,w);if(w>=1)I.from=null;}INS.pose=pz;}
  if(INS.k<=0||!INS.pose){if(!I){INS.pose=null;fig.hand.quaternion.identity();}if(INS.flew){_heldReset();INS.flew=false;}return;}
  const k=INS.k,pz=INS.pose;
  {const fk=pz.fly?(pz.fly.n??0)+'|'+(I?I.a.id:''):pz.spin&&pz.spin.h>0?'pop|'+(I?I.a.id:''):null;if(fk&&fk!==INS.flyK&&I&&k>.5)plSnd('lyonnit','huitaisu',{v:I.a.rare==='flip'||I.a.rare==='bottle'?INSP_THROW_VS:INSP_THROW_V,p:1.1});   /* pienet heitot −60 %, isot −30 % */INS.flyK=fk;}   // v2.99 huitaisuääni jokaisesta heitosta (−30 %)
  INS.bq.copy(fig.armR.quaternion);INS.be=fig.elbowR.rotation.x;INS.saved=true;   // perusasento talteen (palautus seuraavan ruudun alussa)
  fig.g.updateMatrixWorld(true);armIK(fig.armR,fig.elbowR,fig.g.localToWorld(_ispA.set(pz.p[0],pz.p[1],pz.p[2])),k,_poleR);
  if(pz.L&&pz.lw>0){INS.bqL.copy(fig.armL.quaternion);INS.beL=fig.elbowL.rotation.x;INS.savedL=true;armIK(fig.armL,fig.elbowL,fig.g.localToWorld(_ispA.set(pz.L[0],pz.L[1],pz.L[2])),k*pz.lw);}   // v2.99 vasen käsi (pullonpyöritys)
  // esineen kanta kehon koordinaateissa: z = suunta, y = ylös (kohtisuora), kierto s akselin ympäri
  _ispZ.set(pz.d[0],pz.d[1],pz.d[2]).normalize();_ispY.set(0,1,0);if(Math.abs(_ispZ.y)>.95)_ispY.set(0,0,-1);_ispX.crossVectors(_ispY,_ispZ).normalize();_ispY.crossVectors(_ispZ,_ispX).normalize();
  _ispM.makeBasis(_ispX,_ispY,_ispZ);_ispQ.setFromRotationMatrix(_ispM);_ispQ.multiply(_ispQ2.setFromAxisAngle(_ispB.set(0,0,1),pz.s||0));
  fig.armR.updateMatrixWorld(true);fig.g.getWorldQuaternion(_ispQ3);_ispQ.premultiply(_ispQ3);fig.hand.parent.getWorldQuaternion(_ispQ2);_ispQ.premultiply(_ispQ2.invert());fig.hand.quaternion.copy(INS.qid).slerp(_ispQ,k);
  // esine: ote (g) ja lento irti kädestä (fly)
  if(heldMesh&&heldMesh.parent===fig.hand){const U=heldMesh.userData;if(!U.ip0){U.ip0=heldMesh.position.clone();U.iq0=heldMesh.quaternion.clone();}
    if(pz.spin&&pz.spin.w*k>0){const sp=pz.spin,w=sp.w*k;fig.hand.updateMatrixWorld(true);
      /* lappeellaan pyörivä puukko: maailman asento = keho · kierto pystyakselin ympäri · kanta (eteen, terä vaakaan) · iq0; käden koordinaatteihin */
      _ispZ.set(0,0,1);_ispY.set(0,1,0);_ispX.set(1,0,0);_ispM.makeBasis(_ispX,_ispY,_ispZ);_ispQ.setFromRotationMatrix(_ispM).multiply(_ispQ2.setFromAxisAngle(_ispB.set(0,0,1),INSP_SFLAT));
      _ispQ.premultiply(_ispQ2.setFromAxisAngle(_ispB.set(0,1,0),sp.th));fig.g.getWorldQuaternion(_ispQ3);_ispQ.premultiply(_ispQ3).multiply(U.iq0);
      fig.hand.getWorldQuaternion(_ispQ2);_ispQ.premultiply(_ispQ2.invert());heldMesh.quaternion.copy(U.iq0).slerp(_ispQ,w);
      fig.hand.getWorldPosition(_ispA);_ispB.set(0,1,0).applyQuaternion(_ispQ3);_ispA.addScaledVector(_ispB,INSP_SPIN_UP+sp.h);
      _ispB.set(Math.sin(sp.th),0,Math.cos(sp.th)).applyQuaternion(_ispQ3);_ispA.addScaledVector(_ispB,-INSP_KMID);heldMesh.position.copy(U.ip0).lerp(fig.hand.worldToLocal(_ispA),w);INS.flew=true;}
    else{
    const ga=_iwr(pz.fly?pz.fly.a:pz.g||0)*k;   /* kierrokset pois → paluussa esine ei pyöri */if(ga||pz.fly||INS.flew){heldMesh.quaternion.copy(U.iq0).premultiply(_ispQ2.setFromAxisAngle(_ispB.set(1,0,0),ga));
      if(pz.fly&&k>.5){fig.hand.updateMatrixWorld(true);heldMesh.position.copy(fig.hand.worldToLocal(fig.g.localToWorld(_ispA.set(pz.fly.p[0],pz.fly.p[1],pz.fly.p[2]))));}else heldMesh.position.copy(U.ip0);INS.flew=true;}}}
  // pää katsoo hieman alas ja seuraa esineen keskikohtaa (lennossa itse esinettä); oma pehmennys → ei hyppyjä
  const ty=INSP_TYPE(I?I.item:heldId),len=ty==='long'||ty==='heavy'?.42:.12,c=pz.fly?pz.fly.p:[pz.p[0]+_ispZ.x*len,pz.p[1]+_ispZ.y*len,pz.p[2]+_ispZ.z*len],hx=0,hy=1.62,hz=.06;
  const yaw=clamp(Math.atan2(c[0]-hx,c[2]-hz),-.75,.75),pit=clamp(Math.atan2(hy-c[1],Math.hypot(c[0]-hx,c[2]-hz))*.85+.12,-.55,.7),hk=kExp((pz.fly?9:4.5),dt);
  if(INS.u<=dt/INSP_IN+1e-3&&I&&!I.from){INS.hy=yaw;INS.hp=pit;}INS.hy+=(yaw-INS.hy)*hk;INS.hp+=(pit-INS.hp)*hk;
  fig.head.rotation.y=_ie(fig.head.rotation.y,INS.hy,k);fig.head.rotation.x=_ie(fig.head.rotation.x,INS.hp,k);}
