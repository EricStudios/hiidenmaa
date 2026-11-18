'use strict';
/* v3.02 KEITTOPATA JA HIILOS (käyttäjä). Vakiot ja mallit: pieces.js (EMBER_*, emberOn, coalBed, potModel, potInit).
   KEITTOPATANUOTIO (taso 10): tulipaikka, johon asennetaan erikseen valmistettu keittopata (ahjo). E avaa padan ikkunan (#potP):
   tila ja arvioitu aika, kansi, sienet (enintään POT_MAX), polttoaine, ruoan otto, padan irrotus/asennus ja pataruokien reseptit.
   - Kypsyminen grilliajasta: kansi pois POT_K_OPEN (10×), kansi päällä POT_K_LID (8×) (käyttäjä: alun 5×/4× tuplana). Ilman tulta: kansi päällä jatkuu POT_LID_NOFIRE (−30 %),
     ilman kantta pysähtyy; hiilloksella EMBER_COOK_K. Aloitus (sienet, resepti) vaatii palavan tulen. Valmis ruoka ei pala koskaan.
   - Ilman kantta valmis ruoka pilaantuu vuorokaudessa (DAY_LEN): ruoka katoaa, pohjalle jää hiiltä ja pata on käyttökelvoton →
     irrota (pilaantunut pata) ja sulata sulatusuunissa (POT_MELT) tai asenna uusi pata.
   - Äänet (p/rakentaminen/…, käyttäjän äänet v3.05): pata_aloitus (valmistus alkaa), pata_vesi (veden vaativa resepti alkaa), pata_kiehuu (silmukkamainen kupliva, harvakseltaan),
     pata_valmis_kansi / pata_valmis (valmis kansi päällä / ilman kantta), kansi_kiinni, kansi_auki. */
const POT_FUEL_S=600,POT_MAX=10,POT_K_OPEN=10,POT_K_LID=8,POT_LID_NOFIRE=.7,POT_COOK={sieni:'sienipaisti'},POT_MELT={rauta:2,kupari:1},POT_MELT_T=12,POT_R=4;
let curPot=null,potUiT=0,potSig='';
/* v3.05 käyttäjä: padan äänet hiljaisia (POT_SND_V; työkalu lisäksi −26…−29 LUFS), kiehuminen vielä hiljempaa (POT_BUB_V). Resepti, joka vaatii veden
   (vesikulho), soittaa alussa pata_vesi (veden kaato pataan) aloitusäänen sijaan. */
const POT_SND_V=.75,POT_BUB_V=.5;
const potSndAt=p=>({pos:{x:p.x,y:(p.y||0)+.9,z:p.z},v:POT_SND_V});
function potNear(){let b=null,bd=POT_R*POT_R;if(P.inDun)return null;for(const p of pieces)if(p.t==='patanuotio'){const d2=dist2(p.x,p.z,P.pos.x,P.pos.z);if(d2<bd){bd=d2;b=p;}}return b;}
function potBusy(p){const d=p.data;return !!(d.job||d.cook.length);}
// nopeus suhteessa grilliaikaan (1 = grillin nopeus)
function potRate(p){const d=p.data;if(!d.pot||d.spo)return 0;const k=fireLit(p)?1:emberOn(p)?EMBER_COOK_K:d.lid?POT_LID_NOFIRE:0;return k/(d.lid?POT_K_LID:POT_K_OPEN);}
function potAnyDone(p){const d=p.data;return d.job?d.job.t>=d.job.need:d.cook.some(c=>c.t>=c.need);}
function potAllDone(p){const d=p.data;return d.job?d.job.t>=d.job.need:d.cook.length>0&&d.cook.every(c=>c.t>=c.need);}
function potRem(p){const d=p.data;return d.job?Math.max(0,d.job.need-d.job.t):d.cook.reduce((m,c)=>Math.max(m,c.need-c.t),0);}
function potEta(p){const r=potRate(p),rem=potRem(p);return rem<=0?0:r>0?rem/r:Infinity;}
function potName(p){const d=p.data;return d.job?ITEMS[d.job.id].n:d.cook.length?`${d.cook.length} × ${ITEMS.sieni.n.toLowerCase()}`:'';}
const mmss=s=>s===Infinity?'–':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function potWhy(p,r){if(!p)return 'Ei keittopataa lähellä';const d=p.data;if(!d.pot)return 'Asenna ensin keittopata';if(d.spo)return 'Pata on pilaantunut';if(d.job||(r&&d.cook.length))return 'Pata on käytössä';
  if(!fireLit(p))return 'Tarvitsee palavan tulen';if(r){if(!recipeOpen(r))return `Taso ${r.lvl}`;if(!hasReq(r.req))return 'Aineita puuttuu';}return '';}
// Resepti pataan (valmistuspaneelista tai padan ikkunasta)
function potCraft(r,p){p=p||potNear();const w=potWhy(p,r);if(w){msg(w==='Pata on käytössä'?'Keittopata on jo käytössä – ota ruoka ensin.':w+'.','warn');return false;}
  const d=p.data,wasW=(equipped('weapon')||{}).id==='vesikulho';payReq(r.req);if(r.ret)for(const [id,n] of Object.entries(r.ret))giveOrDrop(id,n,P.pos.x,P.pos.y+1,P.pos.z);
  if(wasW&&!equipped('weapon')){const k=inv.find(s=>s&&s.id==='kulho');if(k)toggleEquip(k);}updateGear();   // v3.07 käyttäjä: käteen jäi vesikulhon malli – tyhjä kulho tilalle
  d.job={id:r.id,n:r.n||1,t:0,need:r.pt||15};d.doneT=0;d.rdy=0;bump('potStart');xpFirst('c_'+r.id,6,'uusi pataruoka');
  sfx('craft');plSnd('rakentaminen',r.req.vesikulho?'pata_vesi':'pata_aloitus',potSndAt(p));msg(`${ITEMS[r.id].n} kiehuu padassa – valmis noin ${fmtMin(potEta(p))} (${d.lid?'kansi päällä':'kansi pois'}).`);invDirty=true;potRefresh(true);return true;}
function potAddMush(p,all){const d=p.data;if(!d.pot||d.spo||d.job){msg(!d.pot?'Asenna ensin keittopata.':d.spo?'Pata on pilaantunut.':'Padassa kypsyy jo ruokaa.','warn');return;}
  if(!fireLit(p)){msg('Sienten keittäminen vaatii palavan tulen.','warn');return;}
  const n=Math.min(all?invCount('sieni'):Math.min(1,invCount('sieni')),POT_MAX-d.cook.length);if(n<=0){msg(invCount('sieni')?`Padassa on jo ${POT_MAX} sientä.`:'Sinulla ei ole sieniä.','warn');return;}
  const first=!d.cook.length;invRemove('sieni',n);const ct=COOK_T.sieni;for(let i=0;i<n;i++)d.cook.push({id:'sieni',t:0,need:(ct[0]+Math.random()*ct[1])/GRILL_COOK_K});d.rdy=0;
  if(d.cook.length>=POT_MAX&&!flags.pot10){flags.pot10=1;addXp(8,'täysi pata');}
  if(first)plSnd('rakentaminen','pata_aloitus',potSndAt(p));sfx('craft');msg(`Pataan ${n} ${n>1?'sientä':'sieni'} (${d.cook.length}/${POT_MAX}) – valmis noin ${fmtMin(potEta(p))}.`);invDirty=true;potRefresh(true);}
function potTake(p){const d=p.data;let got=0;
  if(d.job&&d.job.t>=d.job.need){const j=d.job;giveOrDrop(j.id,j.n,p.x,p.y+1,p.z);got+=j.n;d.job=null;bump('potDish');flags.potN=(flags.potN||0)+1;xpFirst('potDish1',25,'ensimmäinen pataruoka');addXp(6,ITEMS[j.id].n);
    if(j.lid){flags.potLid=1;addXp(4,'haudutus');}if(j.id==='juhlapata')flags.juhlapata=1;if(j.id==='puolukkahillo')flags.hilloN=(flags.hilloN||0)+j.n;}
  const done=d.cook.filter(c=>c.t>=c.need);if(done.length){giveOrDrop(POT_COOK.sieni,done.length,p.x,p.y+1,p.z);got+=done.length;d.cook=d.cook.filter(c=>c.t<c.need);bump('cooked');addXp(Math.min(6,done.length),'sienet');}
  if(!got){msg('Padassa ei ole valmista ruokaa.','warn');return;}d.doneT=0;d.rdy=0;sfx('pickup');plSnd('kaytto','poiminta');potRefresh(true);}
function potLid(p){const d=p.data;if(!d.pot){msg('Asenna ensin keittopata.','warn');return;}d.lid=d.lid?0:1;potLidPose(p.mesh,!!d.lid);
  if(d.job&&d.lid)d.job.lid=1;   // haudutus kansi päällä (XP, tavoite)
  plSnd('rakentaminen',d.lid?'kansi_kiinni':'kansi_auki',potSndAt(p))||sfx('build');potRefresh(true);}
function potRemove(p){const d=p.data;if(!d.pot)return;if(!d.spo&&potBusy(p)){msg('Ota ruoka padasta ensin.','warn');return;}
  giveOrDrop(d.spo?'pilapata':'keittopata',1,p.x,p.y+1,p.z);if(d.char){giveOrDrop('hiili',1,p.x,p.y+1,p.z);d.char=0;}d.pot=0;d.spo=0;d.lid=0;d.job=null;d.cook=[];d.doneT=0;potLidPose(p.mesh,false);sfx('build');potRefresh(true);}
function potInstall(p){const d=p.data;if(d.pot)return;if(!invCount('keittopata')){msg('Tarvitset keittopadan (ahjo, taso 10).','warn');return;}invRemove('keittopata',1);d.pot=1;d.spo=0;d.lid=0;flags.potBuilt=1;sfx('build');plSnd('rakentaminen','kansi_kiinni',potSndAt(p));msg('Asensit keittopadan.','loot');potRefresh(true);}
function potSpoil(p){const d=p.data;d.cook=[];d.job=null;d.spo=1;d.char=1;d.doneT=0;d.rdy=0;
  if(dist2(p.x,p.z,P.pos.x,P.pos.z)<40*40)msg('Ruoka pilaantui padassa ilman kantta! Pata on käyttökelvoton – irrota se ja sulata sulatusuunissa.','warn');potRefresh(true);}
// Hiilos kaikille tulipaikoille: kesto, sade, paisto −20 % (nuotio/grilli), hiilipeti ja valo.
function emberTick(p,dt){const d=p.data,cb=p.mesh.userData.coal,lit=fireLit(p);if(lit)d.ember=0;   // tila luetaan uudelleen (polttoaine voi loppua samassa ruudussa)
  const on=!lit&&(d.ember||0)>0;
  if(on){d.ember=Math.max(0,d.ember-dt*(fireRainOut(p)?EMBER_RAIN_K:1));if(p.t!=='patanuotio'){const ck=(p.t==='grilli'?GRILL_COOK_K:1)*EMBER_COOK_K;for(const c of d.cook)c.t+=dt*ck;}
    if(dist2(p.x,p.z,P.pos.x,P.pos.z)<30*30){if(Math.random()<dt*.5)emitEmber(p.x+(Math.random()-.5)*.3,p.y+.25,p.z+(Math.random()-.5)*.3,'smoke');if(Math.random()<dt*.6)emitEmber(p.x+(Math.random()-.5)*.25,p.y+.15,p.z+(Math.random()-.5)*.25,'spark');}}
  if(cb){const v=lit||on;if(cb.visible!==v)cb.visible=v;if(v){const k=lit?1:Math.max(.2,d.ember/EMBER_T);cb.material.emissiveIntensity=(.55+.35*Math.sin(playTime*2.1+p.x*3))*k*(lit?1.3:1);}}
  if(p.light)p.light.i=lit?2:.35+.45*((d.ember||0)/EMBER_T);}
// Kerran ruudussa updateStationsista (ai.js)
function potTick(p,dt){const d=p.data;potVis(p);if(!d.pot||d.spo)return;const r=potRate(p),near=dist2(p.x,p.z,P.pos.x,P.pos.z)<35*35;
  if(r>0){for(const c of d.cook)if(c.t<c.need)c.t=Math.min(c.need,c.t+dt*r);if(d.job&&d.job.t<d.job.need){d.job.t=Math.min(d.job.need,d.job.t+dt*r);if(d.lid)d.job.lid=1;}}
  const done=potAnyDone(p);
  if(done&&!d.rdy){d.rdy=1;if(dist2(p.x,p.z,P.pos.x,P.pos.z)<60*60){plSnd('rakentaminen',d.lid?'pata_valmis_kansi':'pata_valmis',potSndAt(p));if(near)msg(`${potName(p)} on valmis – höyryä nousee padasta.`,'loot');}}
  if(!done)d.rdy=0;
  if(done&&!d.lid){d.doneT=(d.doneT||0)+dt;if(d.doneT>=DAY_LEN)potSpoil(p);}
  if(near){const busy=potBusy(p),rate=done?5:busy&&r>0?1.2:0;   // höyry: valmis = runsas, kypsyy = vähän; kansi päällä reunan raosta
    if(rate&&Math.random()<dt*rate){const a=Math.random()*TAU,rr=d.lid?.34:Math.random()*.2;emitEmber(p.x+Math.cos(a)*rr,p.y+(d.lid?1:.95),p.z+Math.sin(a)*rr,'steam');}
    if(busy&&!done&&fireLit(p)){d.bubT=(d.bubT||0)-dt;if(d.bubT<=0){d.bubT=7+Math.random()*5;plSnd('rakentaminen','pata_kiehuu',Object.assign(potSndAt(p),{v:POT_BUB_V}));}}}
  if(openPanel==='pot'&&curPot===p){potUiT-=dt;if(potUiT<=0){potUiT=.4;potRefresh(false);}}}
function potVis(p){const g=p.mesh.userData,d=p.data;if(!g.pot)return;g.pot.visible=!!d.pot;g.lid.visible=!!d.pot&&!d.spo;
  const bm=d.spo?POT_SPO_MAT:POT_MAT;if(g.pot.userData.body.material!==bm)g.pot.userData.body.material=bm;
  const s=g.soup,has=d.spo||d.job||d.cook.length;s.visible=!!has;if(!has)return;
  let col=0x8a5a32;if(d.spo)col=0x120e0c;else if(d.job){const k=Math.min(1,d.job.t/d.job.need);_potC.setHex(0x9a8a6a).lerp(_potC2.set(ITEMS[d.job.id].c),k);s.material.color.copy(_potC);return;}else col=d.cook.every(c=>c.t>=c.need)?0x7a4a22:0xb08a5a;
  s.material.color.setHex(col);}
const _potC=new THREE.Color(),_potC2=new THREE.Color();
function potLabel(p){const d=p.data,fire=fireLit(p)?'tuli palaa':emberOn(p)?'hiilos':'tuli sammunut';
  if(!d.pot)return invCount('keittopata')?'Asenna keittopata (E)':`Keittopatanuotio – ${fire} · tarvitset keittopadan (E)`;
  if(d.spo)return 'Pata on pilaantunut – irrota se (E)';
  if(potAnyDone(p))return `${potName(p)} valmis – ota (E)`;
  if(potBusy(p)){const e=potEta(p);return `${potName(p)}: ${e===Infinity?'pysähtynyt (tarvitsee tulen tai kannen)':'valmis ~'+mmss(e)} · ${d.lid?'kansi päällä':'kansi pois'} (E)`;}
  return `Keittopata: tyhjä · ${fire} (E)`;}
function potOpen(p){curPot=p;potSig='';if(openPanel!=='pot')togglePanel('pot');else potRefresh(true);}
// Ikkuna: tila päivitetään 0,4 s välein; napit piirretään uudelleen vain tilan muuttuessa (napsautus ei katoa kesken)
function potRefresh(force){if(openPanel!=='pot'||!curPot)return;const p=curPot;if(!pieces.includes(p)||dist2(p.x,p.z,P.pos.x,P.pos.z)>8*8){closePanels();return;}
  const d=p.data,lit=fireLit(p),em=emberOn(p),busy=potBusy(p),done=potAnyDone(p),all=potAllDone(p),e=potEta(p);
  const fireTxt=lit?`Palaa · ${fuelText(fireRem(p),p)}`:em?`Hiilos ${mmss(d.ember)} (paistaa −20 %)`:d.out&&d.fuel>0?'Sade sammutti – sytytä uudelleen':'Sammunut';
  const st=!d.pot?'Ei pataa – asenna keittopata':d.spo?'Pilaantunut: ruoka hiiltyi pohjaan':!busy?'Tyhjä':all?`${potName(p)} – valmis!`:done?`${potName(p)} – osa valmiina`:`${potName(p)} kypsyy`;
  const eta=!busy||all?'':e===Infinity?'Pysähtynyt – sytytä tuli tai laita kansi päälle (kansi päällä kypsyy ilman tultakin −30 %)':`Valmis noin ${mmss(e)}`;
  const spoil=done&&!d.lid&&!d.spo?`Pilaantuu ilman kantta: ${mmss(Math.max(0,DAY_LEN-(d.doneT||0)))} – laita kansi päälle tai ota ruoka`:'';
  const prog=d.job?d.job.t/d.job.need:d.cook.length?d.cook.reduce((a,c)=>a+Math.min(1,c.t/c.need),0)/d.cook.length:0;
  $('#potSt').innerHTML=`<table class="props"><tr><td>Tuli</td><td>${fireTxt}</td></tr><tr><td>Pata</td><td>${st}</td></tr><tr><td>Kansi</td><td>${d.pot?(d.lid?`päällä (${POT_K_LID}× grilliaika, jatkuu ilman tulta −30 %)`:`pois (${POT_K_OPEN}× grilliaika, pysähtyy ilman tulta)`):'–'}</td></tr>${eta?`<tr><td>Aika</td><td>${eta}</td></tr>`:''}${spoil?`<tr><td>Varoitus</td><td class="warnTxt">${spoil}</td></tr>`:''}</table>`;
  $('#potBarF').style.width=Math.round(prog*100)+'%';$('#potBar').hidden=!busy;
  const sig=[d.pot,d.spo,d.lid,lit,em,!!d.job,d.cook.length,done,invCount('sieni'),invCount('keittopata'),['puu','pihka','hiili'].map(invCount).join(),playerLevel(),RECIPES.filter(r=>r.st==='pata').map(r=>Object.keys(r.req).map(invCount).join()).join('|')].join(';');
  if(!force&&sig===potSig)return;potSig=sig;
  const B=[];const btn=(id,t,ok,pri)=>B.push(`<button class="btn${pri?' pri':''}" data-pot="${id}"${ok?'':' disabled'}>${t}</button>`);
  if(!d.pot)btn('install','Asenna keittopata',invCount('keittopata')>0,1);
  if(d.pot&&!d.spo){btn('lid',d.lid?'Ota kansi pois':'Laita kansi päälle',true);if(done)btn('take','Ota ruoka',true,1);
    if(!d.job){const n=invCount('sieni');btn('m1','Lisää sieni',n>0&&lit&&d.cook.length<POT_MAX);btn('mall',`Lisää kaikki sienet (${Math.min(n,POT_MAX-d.cook.length)})`,n>1&&lit&&d.cook.length<POT_MAX);}}
  if(d.pot&&(d.spo||!busy))btn('remove',d.spo?'Irrota pilaantunut pata':'Irrota pata',true,d.spo);
  btn('fuel',d.out&&d.fuel>0?'Sytytä uudelleen':'Lisää polttoainetta',true);
  $('#potBtns').innerHTML=B.join('');
  const R=RECIPES.filter(r=>r.st==='pata');$('#potRec').innerHTML=R.map(r=>{const why=potWhy(p,r);return `<div class="potRow${why?' na':''}"><div><b>${ITEMS[r.id].n}${r.n>1?' ×'+r.n:''}</b><small>${fmtMin(r.pt*POT_K_OPEN)} / kansi ${fmtMin(r.pt*POT_K_LID)}${r.lvl?' · taso '+r.lvl:''}</small><div class="rq">${costChips(r.req)}</div></div><button class="btn" data-potr="${r.id}"${why?` disabled title="${why}"`:''}>${why||'Keitä'}</button></div>`;}).join('')+`<p class="note">Sienet kypsyvät vain padassa (enintään ${POT_MAX}). Valmis ruoka ei pala, mutta ilman kantta se pilaantuu vuorokaudessa.</p>`;}
function potClick(e){const b=e.target.closest('[data-pot],[data-potr]');if(!b||b.disabled||!curPot)return;const p=curPot;
  if(b.dataset.potr){potCraft(RECIPE_BY[b.dataset.potr],p);return;}
  switch(b.dataset.pot){case 'install':potInstall(p);break;case 'lid':potLid(p);break;case 'take':potTake(p);break;case 'm1':potAddMush(p,false);break;case 'mall':potAddMush(p,true);break;
    case 'remove':potRemove(p);break;case 'fuel':fireFuelAdd(p);potRefresh(true);break;}}
{const el=document.getElementById('potP');if(el)el.addEventListener('click',potClick);}

/* v3.06 käyttäjä: VEDEN KERÄÄJÄ (kupari 4 + rauta 2, taso 6): iso saavi ulos taivasalle; sateella (wRain > 0,3, ei katon alla) täyttyy WATER_FILL (10 %/min).
   Täynnä täyttää vesikulhon WATER_USES (20) kertaa: tyhjä kulho kädessä + E. Purettaessa vesi menetetään. Pinta nousee täyttymisen mukaan. */
const WATER_FILL=.1/60,WATER_USES=20;
function waterTick(p,dt){const d=p.data;d.w=d.w||0;if(!P.inDun&&wRain>.3&&d.w<1){if(playTime>=(d.shU||0)){d.shU=playTime+2;d.shd=sheltered(p.x,(p.y||0)+.2,p.z);}if(!d.shd)d.w=Math.min(1,d.w+dt*WATER_FILL*clamp(wRain,0,1.2));}
  const w=p.mesh.userData.water;if(w){w.visible=d.w>.005;if(w.visible){w.position.y=.08+.7*d.w;const k=.86+.14*d.w;w.scale.set(k,k,1);}}}
function waterUses(p){return Math.floor((p.data.w||0)*WATER_USES+1e-6);}
function waterLabel(p){const n=waterUses(p),pc=Math.round((p.data.w||0)*100),s=heldBowl();return `Veden kerääjä: ${pc} % (${n} kulhollista)`+(s&&s.id==='kulho'&&n>0?' – täytä kulho (E)':n>0?' – ota tyhjä kulho käteen':wRain>.3?' – täyttyy sateella':' – täyttyy, kun sataa');}
function waterInteract(p){const s=heldBowl();if(!s||s.id!=='kulho'){msg(s&&s.id==='vesikulho'?'Kulhossa on jo vettä.':'Ota tyhjä kulho käteen ja paina E täyttääksesi sen.','warn');return;}
  if(waterUses(p)<1){msg('Kerääjässä ei ole tarpeeksi vettä – se täyttyy sateella.','warn');return;}
  p.data.w=Math.max(0,(p.data.w||0)-1/WATER_USES);s.id='vesikulho';invDirty=true;updateGear();plSnd('pihka','kulho_taytto');msg('Täytit kulhon sadevedellä.','loot');}
