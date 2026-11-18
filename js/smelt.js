/* Hiidenmaa – smelt.js
   v3.06 SULATUSUUNIN VALIKKO (käyttäjä). Ladataan farm.js:n jälkeen.
   - Jono SM_Q (5) paikkaa: sulatetaan järjestyksessä (ensimmäinen ei-tyhjä paikka). Paikassa yksi aine (enintään max): kuparimalmi 7 s, rautamalmi 10 s,
     hiekka 2 → lasi GLASS_T, pilaantunut pata → 2 rautaa + 1 kupari POT_MELT_T. Paikkaa napsauttamalla aineet palaavat reppuun.
   - Polttoaine (sekunteina, enintään SM_FUEL_MAX): puu SM_PUU_S, hiili SM_HIILI_S. Lisäys sytyttää uunin; "Sammuta" säästää polttoaineen.
   - Lämpötila D.heat 0–1: palaessa nousee sulatuslämpöön SM_HEAT_T (45 s), ilman tulta jäähtyy SM_COOL_T (2 min). Aineita ei voi lisätä, ennen kuin uuni on kuuma,
     ja sulatus etenee vain kuumassa, palavassa uunissa.
   - Mittarit: lämpötila (°C), polttoaine, nykyisen sulatuksen edistyminen ja arvio koko jonon kestosta (+ riittääkö polttoaine).
   Vanha tallennus (ore/iore/sand/pp/wood) muunnetaan jonoksi smInit:ssä. */
'use strict';
const SM_Q=5,SM_HEAT_T=45,SM_COOL_T=120,SM_PUU_S=20,SM_HIILI_S=200,SM_FUEL_MAX=600,SM_C0=20,SM_C1=1100,SM_COAL_K=1.2;   // v3.07 hiili lämmittää 20 % nopeammin (D.coal = hiilen osuus s)
/* v3.07 käyttäjä: TULISUUN HEHKU lämmön mukaan – tumma → punainen → oranssi → kirkkaan keltainen sulatuslämmössä (heatGlow, myös savustin). */
const GLOW_STOPS=[[0,0x0c0908],[.3,0x6a1606],[.7,0xe0601a],[.95,0xffb040],[1,0xffe68a]],_glC=new THREE.Color(),_glC2=new THREE.Color();
function heatGlow(mesh,h,dark){if(!mesh)return;if(h<.02){if(mesh.material!==dark)mesh.material=dark;return;}if(!mesh.userData.gm)mesh.userData.gm=new THREE.MeshBasicMaterial({color:0});const m=mesh.userData.gm;if(mesh.material!==m)mesh.material=m;
  let i=0;while(i<GLOW_STOPS.length-2&&h>GLOW_STOPS[i+1][0])i++;const [a,ca]=GLOW_STOPS[i],[b,cb]=GLOW_STOPS[i+1];m.color.copy(_glC.setHex(ca)).lerp(_glC2.setHex(cb),clamp((h-a)/(b-a),0,1));}
const SM_ITEMS={malmi:{t:7,max:10,out:{kupari:1}},rautamalmi:{t:10,max:10,out:{rauta:1}},hiekka:{t:GLASS_T,max:20,per:2,out:{lasi:1}},pilapata:{t:POT_MELT_T,max:2,out:POT_MELT}};
const SM_OUT_KEY={kupari:'done',rauta:'idone',lasi:'glass'};
let curSmelt=null,smSig='',smUiT=0;
function smInit(p){const D=p.data;
  if(!Array.isArray(D.q)){D.q=new Array(SM_Q).fill(null);const push=(id,n)=>{n=Math.max(0,n|0);if(!n)return;const i=D.q.indexOf(null);if(i>=0)D.q[i]={id,n};};
    const sd=D.sand|0;push('malmi',D.ore);push('rautamalmi',D.iore);push('hiekka',sd-sd%2);push('pilapata',D.pp);if(sd%2)D.rh=(D.rh|0)+1;D.fuel=Math.min(SM_FUEL_MAX,(D.wood|0)*SM_PUU_S);D.lit=D.fuel>0;D.heat=0;D.prog=0;}
  while(D.q.length<SM_Q)D.q.push(null);D.q.length=SM_Q;D.q=D.q.map(s=>s&&SM_ITEMS[s.id]&&s.n>0?{id:s.id,n:s.n|0}:null);smCompact(D);
  D.fuel=clamp(+D.fuel||0,0,SM_FUEL_MAX);D.coal=clamp(+D.coal||0,0,D.fuel);D.heat=clamp(+D.heat||0,0,1);D.prog=Math.max(0,+D.prog||0);D.lit=!!D.lit;D.done=D.done|0;D.idone=D.idone|0;D.glass=D.glass|0;D.rh=D.rh|0;
  for(const k of ['ore','iore','sand','pp','wood','t','job','ppT'])delete D[k];}
function smCompact(D){const a=D.q.filter(Boolean);while(a.length<SM_Q)a.push(null);D.q=a;}
function smFront(D){return D.q.find(Boolean)||null;}
function smBurning(p){const D=p.data;return !!D.lit&&D.fuel>0;}
function smHot(p){return p.data.heat>=1-1e-6;}
function smCelsius(D){return Math.round(SM_C0+(SM_C1-SM_C0)*Math.pow(D.heat,.8));}
function smOutN(D){return (D.done|0)+(D.idone|0)+(D.glass|0)+(D.rh|0);}
function smUnits(s){const it=SM_ITEMS[s.id];return Math.floor(s.n/(it.per||1));}
// arvio: lämpeneminen + jonon kesto (s)
function smEta(p){const D=p.data;let t=0;D.q.forEach((s,i)=>{if(!s)return;t+=smUnits(s)*SM_ITEMS[s.id].t;});const f=smFront(D);if(f)t-=Math.min(D.prog,SM_ITEMS[f.id].t);
  return {work:Math.max(0,t),heat:(1-D.heat)*SM_HEAT_T};}
function smTick(p,dt){const D=p.data;if(!D.q)smInit(p);const burn=smBurning(p);
  if(burn){D.fuel=Math.max(0,D.fuel-dt);D.heat=Math.min(1,D.heat+dt/SM_HEAT_T*(D.coal>0?SM_COAL_K:1));D.coal=Math.max(0,Math.min(D.fuel,(D.coal||0)-dt));if(D.fuel<=0){D.lit=false;if(dist2(p.x,p.z,P.pos.x,P.pos.z)<30*30)msg('Sulatusuunin polttoaine loppui – uuni jäähtyy.','warn');}}
  else D.heat=Math.max(0,D.heat-dt/SM_COOL_T);
  const f=smFront(D);
  if(f&&burn&&smHot(p)){const it=SM_ITEMS[f.id],per=it.per||1;if(f.n<per){D.rh+=f.id==='hiekka'?f.n:0;D.q[D.q.indexOf(f)]=null;smCompact(D);D.prog=0;}
    else{D.prog+=dt;if(D.prog>=it.t){D.prog=0;f.n-=per;for(const [o,n] of Object.entries(it.out))D[SM_OUT_KEY[o]]=(D[SM_OUT_KEY[o]]|0)+n;bump('smelted');
      if(f.n<per){if(f.id==='hiekka')D.rh+=f.n;D.q[D.q.indexOf(f)]=null;smCompact(D);}smeltDone(p);}}}
  {const gl=p.mesh.userData.glow;if(gl){gl.visible=true;heatGlow(gl,D.heat*(burn?1:.85),SMELT_DARK);}}   /* v2.84 sammuneena tulisuu musta (SMELT_DARK), v3.07 hehku lämmön mukaan */
  if(openPanel==='smelt'&&curSmelt===p){smUiT-=dt;if(smUiT<=0){smUiT=.25;smRefresh(false);}}}
function smLabel(p){const D=p.data;if(!D.q)smInit(p);const n=smOutN(D),f=smFront(D);
  return n?`Sulatusuuni: valmiita ${n} – avaa (E)`:f?`Sulatusuuni: ${smHot(p)?'sulattaa':smBurning(p)?'lämpenee '+smCelsius(D)+' °C':'kylmä – lisää polttoainetta'} (E)`:`Sulatusuuni (${smBurning(p)?smCelsius(D)+' °C':'sammunut'}) – avaa (E)`;}
function smOpen(p){curSmelt=p;smSig='';if(!p.data.q)smInit(p);if(openPanel!=='smelt')togglePanel('smelt');else smRefresh(true);}
// aine jonoon: täyttää saman aineen viimeisen paikan, sitten ensimmäisen tyhjän (järjestys säilyy)
function smAdd(p,id,all){const D=p.data,it=SM_ITEMS[id];if(!it)return 0;if(!smHot(p)){msg('Uuni ei ole vielä kuuma – lisää polttoainetta ja odota sulatuslämpöä.','warn');return 0;}
  const per=it.per||1;let have=invCount(id);have-=have%per;if(have<per){msg(`Sinulla ei ole ${per>1?per+' ':''}${ITEMS[id].n.toLowerCase()}${per>1?'a':''}.`,'warn');return 0;}
  let want=all?have:per,added=0;
  while(want>0){let s=null;for(let i=SM_Q-1;i>=0;i--){const q=D.q[i];if(q){if(q.id===id&&q.n+per<=it.max)s=q;break;}}
    if(!s){const i=D.q.indexOf(null);if(i<0)break;s=D.q[i]={id,n:0};}const k=Math.min(want,it.max-s.n);const kk=k-k%per;if(kk<=0)break;s.n+=kk;want-=kk;added+=kk;}
  smCompact(D);if(!added){msg('Uunin jono on täynnä (5 paikkaa).','warn');return 0;}invRemove(id,added);sfx('build');plSnd('kaytto','poiminta',{v:.4,p:.8});
  msg(`Uuniin: ${added} ${ITEMS[id].n.toLowerCase()}.`);smRefresh(true);return added;}
function smUnqueue(p,i){const D=p.data,s=D.q[i];if(!s)return;const front=smFront(D)===s;giveOrDrop(s.id,s.n,p.x,p.y+1,p.z);D.q[i]=null;smCompact(D);if(front)D.prog=0;smRefresh(true);}
function smFuel(p,id,n){const D=p.data,v=id==='hiili'?SM_HIILI_S:SM_PUU_S;let k=0;
  while(k<n&&invCount(id)>k&&D.fuel+v*(k+1)<=SM_FUEL_MAX+1e-6)k++;
  if(!k){msg(invCount(id)?`Uunissa on jo polttoainetta ${fmtMin(D.fuel)} (enintään ${fmtMin(SM_FUEL_MAX)}).`:`Sinulla ei ole: ${ITEMS[id].n.toLowerCase()}.`,'warn');return;}
  invRemove(id,k);D.fuel+=v*k;if(id==='hiili')D.coal=(D.coal||0)+v*k;D.lit=true;sfx('build');msg(`Polttoaine: +${k} ${ITEMS[id].n.toLowerCase()} (${fmtMin(D.fuel)}).`);smRefresh(true);}
function smToggle(p){const D=p.data;if(D.lit){D.lit=false;msg('Sammutit uunin – polttoaine säästyy, uuni jäähtyy.');}else if(D.fuel>0){D.lit=true;msg('Sytytit uunin.');}else msg('Lisää ensin polttoainetta.','warn');smRefresh(true);}
function smTake(p){const D=p.data;let got=0;
  for(const [o,k] of Object.entries(SM_OUT_KEY))if(D[k]>0){giveOrDrop(o,D[k],p.x,p.y+1,p.z);got+=D[k];D[k]=0;}if(D.rh>0){giveOrDrop('hiekka',D.rh,p.x,p.y+1,p.z);D.rh=0;got++;}
  if(got)sfx('pickup');smRefresh(true);}
// purkaessa: jono, valmiit ja ylijäänyt polttoaine (puuna) takaisin
function smRefund(p){const D=p.data;if(!D.q)smInit(p);for(const s of D.q)if(s)giveOrDrop(s.id,s.n,p.x,p.y+1,p.z);smTake(p);const w=Math.floor(D.fuel/SM_PUU_S);if(w>0)giveOrDrop('puu',w,p.x,p.y+1,p.z);D.q=new Array(SM_Q).fill(null);D.fuel=0;}
function smRefresh(force){if(openPanel!=='smelt'||!curSmelt)return;const p=curSmelt;if(!pieces.includes(p)||dist2(p.x,p.z,P.pos.x,P.pos.z)>8*8){closePanels();return;}
  const D=p.data,burn=smBurning(p),hot=smHot(p),f=smFront(D),e=smEta(p),c=smCelsius(D);
  const need=e.work+(f?e.heat:0),short=f&&need>D.fuel+.5,fuelTxt=D.fuel>0?`${fmtMin(D.fuel)}${burn?'':' (sammutettu)'}`:'loppu';
  const tTxt=hot?`${c} °C – sulatuslämpö`:burn?`${c} °C – lämpenee, kuuma noin ${mmss(e.heat)}`:D.heat>0?`${c} °C – jäähtyy`:`${c} °C – kylmä`;
  const it=f&&SM_ITEMS[f.id],prog=f&&it?Math.min(1,D.prog/it.t):0;
  const etaTxt=!f?'Jono on tyhjä':!burn?'Pysähtynyt – uuni ei pala':`Koko jono valmis noin ${mmss(need)}${short?` · polttoaine ei riitä (puuttuu ${Math.ceil((need-D.fuel)/SM_PUU_S)} puuta)`:''}`;
  $('#smSt').innerHTML=`<table class="props"><tr><td>Lämpötila</td><td>${tTxt}</td></tr><tr><td>Polttoaine</td><td>${fuelTxt}</td></tr><tr><td>Nyt</td><td>${f?`${ITEMS[f.id].n}${hot&&burn?' sulaa':' odottaa'} (${Math.round(prog*100)} %)`:'–'}</td></tr><tr><td>Arvio</td><td class="${short?'warnTxt':''}">${etaTxt}</td></tr></table>`;
  $('#smHeatF').style.width=Math.round(D.heat*100)+'%';$('#smHeat').classList.toggle('hot',hot);$('#smFuelF').style.width=Math.round(D.fuel/SM_FUEL_MAX*100)+'%';$('#smProgF').style.width=Math.round(prog*100)+'%';
  const sig=[burn,hot,D.q.map(s=>s?s.id+s.n:'-').join(),smOutN(D),['puu','hiili','malmi','rautamalmi','hiekka','pilapata'].map(invCount).join(),Math.floor(D.fuel/SM_PUU_S)].join(';');
  if(!force&&sig===smSig)return;smSig=sig;
  $('#smQ').innerHTML=D.q.map((s,i)=>s?`<button class="smSlot${s===f?' cur':''}" data-smq="${i}" title="${ITEMS[s.id].n} – palauta reppuun"><img src="${icon(s.id)}" alt=""><span>${s.n}</span>${s===f?'<em>sulaa</em>':''}</button>`:`<div class="smSlot empty"><em>${i+1}</em></div>`).join('');
  const B=[],btn=(a,t,ok,pri,tt)=>B.push(`<button class="btn${pri?' pri':''}" data-sm="${a}"${ok?'':' disabled'}${tt?` title="${tt}"`:''}>${t}</button>`);
  const why=hot?'':'Uuni ei ole vielä kuuma';
  for(const id of ['malmi','rautamalmi','hiekka','pilapata']){const n=invCount(id),per=SM_ITEMS[id].per||1;if(!n&&id==='pilapata')continue;btn('add1:'+id,`+${per} ${ITEMS[id].n.toLowerCase()}`,hot&&n>=per,0,why);btn('addA:'+id,`Kaikki (${n-n%per})`,hot&&n>=per*2,0,why);}
  $('#smAdd').innerHTML=B.join('');B.length=0;
  btn('f1:puu',`+1 puu (${invCount('puu')})`,invCount('puu')>0&&D.fuel+SM_PUU_S<=SM_FUEL_MAX);btn('f5:puu','+5 puuta',invCount('puu')>0&&D.fuel+SM_PUU_S<=SM_FUEL_MAX);btn('f1:hiili',`+1 hiili (${invCount('hiili')})`,invCount('hiili')>0&&D.fuel+SM_HIILI_S<=SM_FUEL_MAX);
  btn('lit',D.lit?'Sammuta':'Sytytä',D.lit||D.fuel>0);$('#smFuelB').innerHTML=B.join('');B.length=0;
  const o=Object.entries(SM_OUT_KEY).filter(([,k])=>D[k]>0).map(([id,k])=>`${D[k]} ${ITEMS[id].n.toLowerCase()}`);if(D.rh)o.push(`${D.rh} hiekka`);
  $('#smOut').innerHTML=`<span>${o.length?'Valmiina: '+o.join(', '):'Ei valmiita'}</span>`+(o.length?'<button class="btn pri" data-sm="take">Ota valmiit</button>':'');}
function smClick(e){const b=e.target.closest('[data-sm],[data-smq]');if(!b||b.disabled||!curSmelt)return;const p=curSmelt;
  if(b.dataset.smq!=null){smUnqueue(p,+b.dataset.smq);return;}const [a,id]=b.dataset.sm.split(':');
  switch(a){case 'add1':smAdd(p,id,false);break;case 'addA':smAdd(p,id,true);break;case 'f1':smFuel(p,id,1);break;case 'f5':smFuel(p,id,5);break;case 'lit':smToggle(p);break;case 'take':smTake(p);break;}}
{const el=document.getElementById('smeltP');if(el)el.addEventListener('click',smClick);}
