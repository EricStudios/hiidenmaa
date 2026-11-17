'use strict';
/* v2.98 F-TARKASTELU (käyttäjä). Kun vasara ei ole kädessä, F (korjaa-näppäin) tarkastelee oikean käden esinettä: käsi nousee eteen hieman
   koukkuun ja kääntelee esinettä hitaasti, pää katsoo hieman alas ja seuraa esinettä. Tyypit (INSP_TYPE): pitkä (miekat, keihäs, lapio, kuokka),
   raskas (kirveet, hakut, nuija), pieni (puukko, kulho, tyhjä käsi ym.); kullakin 3 animaatiota, puukolla lisäksi pistot ja 5 %:n heitto
   (puukko heitetään ja otetaan kiinni väärinpäin, sitten sivu- ja yläpistot). F arpoo sopivan animaation. Käsi viedään IK:lla (armIK) kehon
   koordinaateissa annettuun pisteeseen ja esineen suunta lasketaan suoraan (käden kvaternio), joten esine pysyy vartalon ja pään edessä.
   Keskeytyy heti, kun kättä käytetään (lyönti, hiiren napit, jousi, torjunta, kaiverrus, E-toiminto, pikapaikka, esineen vaihto, uinti).
   Lopuksi käsi palaa pehmeästi (INS.k). Ääni (sounds/extra/raw/f_ihmettely): 2 s kohdalla 30 % wow tai mmm. Uusi esine (saatu alle 2 min sitten)
   kädessä ja pelaaja AFK (P.afkT) → tarkastelee kerran itsestään ja ääni soi varmasti. DEV Ä › Tarkasteluanimaatiot (0,2 s viive). */
const INSP_SND_T=2,INSP_SND_P=.3,INSP_NEW_T=120,INSP_AFK_T=4,INSP_KNIFE_THROW=.05;
function INSP_TYPE(id){if(!id)return 'small';const d=ITEMS[id];if(!d)return 'small';if(id==='puukko')return 'knife';
  if(/miekka/.test(id)||id==='keihas'||d.cat==='shovel')return 'long';if(d.chop||d.pick||id==='nuija')return 'heavy';return 'small';}
const _ie=(a,b,k)=>a+(b-a)*k,_iv3=(a,b,k)=>[_ie(a[0],b[0],k),_ie(a[1],b[1],k),_ie(a[2],b[2],k)],_ios=(t,a,b)=>sstep(a,b,t)*(1-sstep(b+.6,b+1.2,t));
/* pose: p = käden paikka kehon koordinaateissa (−x = oikea, +z = eteen), d = esineen suunta, s = kierto esineen akselin ympäri, f = kääntö (puukon heitto) */
const INSP_ANIMS=[
  {id:'pitka_tera',n:'Pitkä: terän katselu',type:'long',dur:6.5,f:(t,S)=>({p:[-.1,1.3+.03*Math.sin(t*.7),.44],d:[.75,.2+.08*Math.sin(t*.8),.62],s:S*1.5*Math.sin(t*.9)})},
  {id:'pitka_pituus',n:'Pitkä: pituuden katselu',type:'long',dur:6,f:(t,S)=>{const k=.5-.5*Math.cos(t*1.05);return {p:[-.1,_ie(1.12,1.24,k),.46],d:_iv3([0,.95,.32],[.55,.5,.66],k),s:S*.7*Math.sin(t*.7)};}},
  {id:'pitka_pisto',n:'Pitkä: pistokoe',type:'long',dur:5.5,f:(t,S)=>{const th=Math.max(sstep(.5,1.1,t)*(1-sstep(1.3,2,t)),sstep(2.4,3,t)*(1-sstep(3.2,3.9,t)));const up=sstep(4.1,4.8,t);
    return {p:_iv3([-.16,1.22,.32],[-.2,1.3,.62],th),d:_iv3([.05,.08,1],[.25,.55,.8],up),s:S*.5*up*Math.sin(t*1.3)};}},
  {id:'raskas_tera',n:'Raskas: terän tarkastus',type:'heavy',dur:6.5,f:(t,S)=>({p:[-.08,1.36+.02*Math.sin(t),.44],d:[.42,.82,.38],s:S*1.25*Math.sin(t*.85)})},
  {id:'raskas_punnitus',n:'Raskas: painon punnitus',type:'heavy',dur:5,f:(t,S)=>{const b=Math.max(0,Math.sin(t*3.1))*sstep(.3,.8,t)*(1-sstep(3.8,4.5,t));return {p:[-.15,1.02+.08*b,.44],d:[.1,.35+.2*b,1],s:S*.25*Math.sin(t*.9)};}},
  {id:'raskas_heilautus',n:'Raskas: hidas heilautus',type:'heavy',dur:6,f:(t,S)=>{const w=Math.max(_ios(t,.4,1.4),_ios(t,2.6,3.6));return {p:_iv3([-.2,1.46,.4],[-.12,1.1,.62],w),d:_iv3([0,.95,.3],[0,-.1,1],w),s:0};}},
  {id:'pieni_lahikatselu',n:'Pieni: lähikatselu',type:'small',dur:6,f:(t,S)=>({p:[-.09,1.53+.02*Math.sin(t*1.1),.4],d:[.55,.45+.12*Math.sin(t*.6),.7],s:S*1.8*Math.sin(t*.8)})},
  {id:'pieni_ojennus',n:'Pieni: käsi ojennettuna',type:'small',dur:5.5,f:(t,S)=>({p:[-.24,1.36,.58],d:[.25,.25+.1*Math.sin(t*.9),1],s:S*2.2*Math.sin(t*.7)})},
  {id:'pieni_kaannos',n:'Pieni: lähelle ja kauas',type:'small',dur:6.5,f:(t,S)=>{const k=.5-.5*Math.cos(t*1.05);return {p:_iv3([-.09,1.53,.4],[-.24,1.34,.58],k),d:_iv3([.55,.5,.65],[.2,.2,1],k),s:S*1.6*Math.sin(t*.9+1)};}},
  {id:'puukko_pistot',n:'Puukko: pistot',type:'knife',dur:5,f:(t,S)=>{let th=0;for(const a of [.6,1.6,2.6])th=Math.max(th,sstep(a,a+.35,t)*(1-sstep(a+.45,a+.8,t)));const up=sstep(3.6,4.3,t);
    return {p:_iv3([-.14,1.25,.3],[-.18,1.3,.6],th),d:_iv3([.05,.05,1],[.45,.45,.7],up),s:S*1.4*up*Math.sin(t*1.4)};}},
  {id:'puukko_heitto',n:'Puukko: heitto ja väärä ote (5 %)',type:'knife',rare:1,dur:7.5,f:(t,S)=>{
    /* 0–.5 nosto, .5–1.2 heitto (1¼ kierrosta, käsi nousee ja laskee kiinni), sitten väärä ote (terä alas): sivupisto 1.6–2.8, yläpisto 3–4.4,
       4.8–6 kääntö takaisin oikeaan otteeseen ja lepo */
    const toss=sstep(.5,1.2,t),hop=Math.sin(Math.PI*clamp((t-.5)/.7,0,1));let fl=toss*Math.PI*2.5-sstep(4.8,6,t)*Math.PI*.5;
    let p=[-.12,1.3+.22*hop,.42],d=[0,.2,1];
    const sd=sstep(1.6,2.1,t)*(1-sstep(2.3,2.8,t)),sw=sstep(2.05,2.35,t)*(1-sstep(2.5,2.8,t));if(t>1.4&&t<2.9)p=_iv3(_iv3([-.12,1.3,.42],[-.46,1.38,.18],sd),[-.04,1.3,.56],sw);
    const ov=sstep(3,3.5,t)*(1-sstep(3.9,4.4,t)),dn=sstep(3.6,3.85,t)*(1-sstep(4,4.4,t));if(t>2.9&&t<4.5)p=_iv3(_iv3([-.12,1.3,.42],[-.24,1.78,.44],ov),[-.14,1.12,.56],dn);
    return {p,d,s:0,f:fl};}},
];
const INS={k:0,pose:null,qid:new THREE.Quaternion()};
const _ispA=new THREE.Vector3(),_ispB=new THREE.Vector3(),_ispX=new THREE.Vector3(),_ispY=new THREE.Vector3(),_ispZ=new THREE.Vector3(),_ispM=new THREE.Matrix4(),_ispQ=new THREE.Quaternion(),_ispQ2=new THREE.Quaternion(),_ispQ3=new THREE.Quaternion();
function inspectAnimsFor(type){return INSP_ANIMS.filter(a=>a.type===type||(type==='knife'&&a.type==='small'));}
// F: vasara kädessä → korjaa (input.js); muuten tarkastelu. id = DEV-valinta, o.auto = uusi esine (ääni varmasti)
function inspectStart(id,o={}){if(state!=='play'||P.dead||P.swim||P.atk||P.drawing||P.carve)return false;const w=equipped('weapon');if(w&&w.cat==='hammer')return false;if(heldId&&ITEMS[heldId].cat==='bow')return false;   // jousi on vasemmassa kädessä

  const type=INSP_TYPE(heldId);let a=id?INSP_ANIMS.find(x=>x.id===id):null;
  if(!a){const L=inspectAnimsFor(type).filter(x=>!x.rare&&(!P.insp||x.id!==P.insp.a.id));a=type==='knife'&&Math.random()<INSP_KNIFE_THROW?INSP_ANIMS.find(x=>x.id==='puukko_heitto'):L[Math.random()*L.length|0];}
  if(!a)return false;P.insp={a,t:0,S:Math.random()<.5?-1:1,item:heldId,snd:false,auto:!!o.auto};return true;}
function inspectStop(){if(P.insp)P.insp=null;}
// joka ruutu (main.js update): keskeytys, ääni ja uuden esineen automaattinen tarkastelu
function inspectTick(dt){const I=P.insp;
  if(I){I.t+=dt;if(P.atk||P.drawing||P.blocking||P.carve||mouseL||mouseR||P.dead||P.swim||heldId!==I.item||state!=='play'&&state!=='ui'){inspectStop();return;}
    if(!I.snd&&I.t>=INSP_SND_T){I.snd=true;if(I.auto||Math.random()<INSP_SND_P)plSnd('f_ihmettely',Math.random()<.5?'wow':'mmm');}
    if(I.t>=I.a.dur)inspectStop();return;}
  const N=P.newItem;if(N&&!N.done&&state==='play'&&heldId&&heldId===N.id&&playTime-N.t<INSP_NEW_T&&(P.afkT||0)>INSP_AFK_T&&!P.atk&&!P.drawing){N.done=1;inspectStart(null,{auto:1});}}
// asennon jälkeen (player.js): käsi IK:lla, esineen suunta, pää seuraa; INS.k pehmentää sisään ja ulos
function inspectPose(dt){const I=P.insp;INS.k+=((I?1:0)-INS.k)*Math.min(1,dt*(I?3.2:2.6));
  if(I)INS.pose=I.a.f(I.t,I.S);if(INS.k<.003||!INS.pose){INS.k=Math.max(0,INS.k);if(!I&&INS.k<.003){INS.k=0;INS.pose=null;fig.hand.quaternion.identity();}return;}
  const k=INS.k,pz=INS.pose;fig.g.updateMatrixWorld(true);
  armIK(fig.armR,fig.elbowR,fig.g.localToWorld(_ispA.set(pz.p[0],pz.p[1],pz.p[2])),k,_poleR);fig.armR.updateMatrixWorld(true);
  // esineen kanta kehon koordinaateissa: z = suunta, y = ylös (kohtisuora), kierto s akselin ympäri ja puukon kääntö f sivuakselin ympäri
  _ispZ.set(pz.d[0],pz.d[1],pz.d[2]).normalize();_ispY.set(0,1,0);if(Math.abs(_ispZ.y)>.95)_ispY.set(0,0,-1);_ispX.crossVectors(_ispY,_ispZ).normalize();_ispY.crossVectors(_ispZ,_ispX).normalize();
  _ispM.makeBasis(_ispX,_ispY,_ispZ);_ispQ.setFromRotationMatrix(_ispM);_ispQ.multiply(_ispQ2.setFromAxisAngle(_ispB.set(0,0,1),pz.s||0));if(pz.f)_ispQ.multiply(_ispQ2.setFromAxisAngle(_ispB.set(1,0,0),pz.f));
  fig.g.getWorldQuaternion(_ispQ3);_ispQ.premultiply(_ispQ3);fig.hand.parent.getWorldQuaternion(_ispQ2);_ispQ.premultiply(_ispQ2.invert());fig.hand.quaternion.copy(INS.qid).slerp(_ispQ,k);
  // pää katsoo hieman alas ja seuraa esineen keskikohtaa
  const len=INSP_TYPE(I?I.item:heldId)==='long'||INSP_TYPE(I?I.item:heldId)==='heavy'?.42:.12,lx=pz.p[0]+_ispZ.x*len,ly=pz.p[1]+_ispZ.y*len,lz=pz.p[2]+_ispZ.z*len,hx=0,hy=1.62,hz=.06;
  const yaw=clamp(Math.atan2(lx-hx,lz-hz),-.75,.75),pit=clamp(Math.atan2(hy-ly,Math.hypot(lx-hx,lz-hz))*.85+.12,-.35,.7);
  fig.head.rotation.y=_ie(fig.head.rotation.y,yaw,k);fig.head.rotation.x=_ie(fig.head.rotation.x,pit,k);}
