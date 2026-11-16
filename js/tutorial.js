/* Hiidenmaa – tutorial.js
   v2.71 OPASTUS (käyttäjän pyyntö ja vastaukset): interaktiivinen opastus uuden maailman alkuun. Valinta uuden maailman luonnissa (#newTut,
   oletuksena päällä vain ensimmäisessä maailmassa koskaan tai kun Asetukset › Ohjaus › "Opastus seuraavassa uudessa maailmassa" on päällä).
   Alkulennon jälkeen peli pysähtyy OMALLA tilallaan (TUT.hold → update() päivittää vain kameran ja HUDin) – ei riipu DEV-koodista (freeze),
   jotta DEV-työkalujen poisto ei riko opastusta. Vaiheet: kortti + korostusrengas ruudun osan ympärillä; paneelit avataan ja suljetaan itse
   näppäimillä (Tab, M, J, L, T), muut kortit etenevät Enterillä tai Jatka-napilla. Viimeisenä liikkuminen: peli käynnistyy ja opastus päättyy,
   kun pelaaja on liikkunut, juossut ja hypännyt. "Ohita opastus" kysyy varmistuksen. Opastuksen maailmassa tulee myöhemmin kertavinkkejä
   (TIPS), kun asia tulee ensimmäisen kerran vastaan (flags.tips). */
'use strict';

const TUT={on:false,hold:false,i:0,pending:false,el:null,ring:null,tipEl:null,tipQ:[],tipT:0,tipCd:0,mv:null,hud0:0,t:0,chk:0};
const kL=a=>`<kbd>${keyLabel(BIND[a])}</kbd>`,kX=s=>`<kbd>${s}</kbd>`;
// vaiheet: t otsikko, d teksti (funktio → näppäimet nykyisistä sidonnoista), el korostettava osa, next = Enter/Jatka, ok = ehto, keys = sallitut toiminnot
const TUT_STEPS=[
  {t:'Tervetuloa Hiidenmaahan!',d:()=>`Käydään yhdessä läpi ruudun osat ja tärkeimmät näppäimet – useimpia pääset kokeilemaan itse. Maailma odottaa pysähdyksissä, kunnes kaikki on opeteltu, joten kiirettä ei ole.<br><span class="tutK">Jatka: ${kX('Enter')} tai Jatka-nappi</span>`,next:1},
  {t:'Terveys, kestävyys ja nälkä',el:'#bars',d:()=>`Ylimpänä <b>terveys</b>, sitten <b>kestävyys</b> (juoksu, hypyt, lyönnit, uinti) ja <b>kylläisyys</b>. Syö kypsää ruokaa ja lepää tulen ääressä katon alla, niin palkit pysyvät täysinä. Alla näkyvät tilavaikutukset.`,next:1},
  {t:'Pikapaikat ja kantokyky',el:'#hotbar',d:()=>`Repun alarivi on pikapaikkoja: ruoka syödään ja työkalu tai ase otetaan käteen. ${kL('up')} pudottaa valitusta paikasta. Paino ja kantokyky näkyvät vieressä – ylikuormassa et voi juosta.<br><b>Kokeile:</b> paina jotain numeroa ${kX('1')}–${kX('8')}.`,ok:()=>TUT.dig,keys:['digits']},   // v2.74 interaktiivinen
  {t:'Minikartta ja kello',el:'#topright',d:()=>`Minikartta näyttää ympäristön ja tuulen suunnan, kello vuorokauden ajan (yöllä on vaarallisempaa).<br><b>Kokeile:</b> paina ${kL('minizoom')} – minikartan zoom vaihtuu.`,ok:()=>typeof miniZ!=='undefined'&&miniZ!==TUT.mz0,keys:['minizoom']},   // v2.74 interaktiivinen (ennen N oli estetty)
  {t:'Tarina ja tavoite',el:'#quest',alt:'#goal',d:()=>`Oikealla on tarinan tehtävä, vasemmalla seuraava tavoite – ne neuvovat aina eteenpäin. Kokeile: paina ${kL('hud')}, niin ne piiloutuvat.`,ok:()=>(SET.hudMode|0)!==TUT.hud0,keys:['hud']},
  {t:'Tarina ja tavoite',el:'#quest',alt:'#goal',d:()=>`Hyvä! Paina ${kL('hud')} uudelleen, kunnes molemmat näkyvät taas.`,ok:()=>(SET.hudMode|0)===0,keys:['hud']},
  {t:'Reppu ja valmistus',el:'#hotbar',d:()=>`Paina ${kL('inv')} avataksesi repun.`,ok:()=>openPanel==='inv',keys:['inv']},
  {t:'Reppu ja valmistus',el:'#inv',panel:1,d:()=>`Vasemmalla esineesi ja varusteet, oikealla <b>valmistus</b>: alkupelin työkalut (kirves, vasara, lapio…) tehdään suoraan repussa, isommat työpenkillä, nuotiolla tai ahjolla. Raahaa esineitä hiirellä, oikea klikkaus ottaa puolet pinosta. Repun voi laajentaa päivitysnapista.<br><span class="tutK">Sulje: ${kL('inv')} tai ${kL('menu')}</span>`,ok:()=>!openPanel,keys:['inv','menu']},
  {t:'Kartta',el:'#topright',d:()=>`Paina ${kL('map')} avataksesi kartan.`,ok:()=>openPanel==='map',keys:['map']},
  {t:'Kartta',el:'#mapP',panel:1,d:()=>`Löydetyt paikat merkitään karttaan, ja tarinan kohde näkyy suunnan ja matkan kanssa. Rulla zoomaa, hiirellä voi vetää.<br><span class="tutK">Sulje: ${kL('map')} tai ${kL('menu')}</span>`,ok:()=>!openPanel,keys:['map','menu']},
  {t:'Taso ja saavutukset',el:'#lvlbox',d:()=>`Paina ${kL('prog')}: taso, saavutukset, tavoitteet ja mitä seuraava taso avaa.`,ok:()=>openPanel==='prog',keys:['prog']},
  {t:'Taso ja saavutukset',el:'#progP',panel:1,d:()=>`Kokemuspisteitä saa tavoitteista, tehtävistä, löydöistä ja kaadoista. Jokainen taso antaa palkinnon (terveyttä, kestävyyttä tai kantokykyä) ja uusia valmistusohjeita. Saavutukset antavat pysyviä bonuksia.<br><span class="tutK">Sulje: ${kL('prog')} tai ${kL('menu')}</span>`,ok:()=>!openPanel,keys:['prog','menu']},
  {t:'Ilmoitukset',el:'#msgs',d:()=>`Ilmoitukset näkyvät hetken ruudulla. Paina ${kL('log')}, niin näet viimeisimmät, jos jokin meni ohi.`,ok:()=>openPanel==='log',keys:['log']},
  {t:'Ilmoitukset',el:'#logP',panel:1,d:()=>`Tässä viimeiset ilmoitukset.<br><span class="tutK">Sulje: ${kL('log')} tai ${kL('menu')}</span>`,ok:()=>!openPanel,keys:['log','menu']},
  {t:'Toiminnot',d:()=>`${kL('interact')} poimii, avaa, käyttää ja lukee (kun kohde on edessä, ruudulla näkyy ohje). <b>Hiiren vasen</b> lyö, kaataa puita ja ampuu jousella, <b>oikea</b> torjuu kilvellä. Vasara kädessä ${kL('build')} avaa rakennusvalikon.`,next:1},
  {t:'Päävalikko',d:()=>`${kL('menu')} avaa päävalikon (tauko, asetukset, tallennus) ja sulkee avoimet ikkunat. <b>Vältä Esciä</b>: selain vapauttaa silloin hiiren. Kaikki näppäimet löydät: Asetukset › Näppäimet › Kaikki toiminnot.`,next:1},
  {t:'Liikkuminen',move:1,d:()=>`Nyt peli käynnistyy! Napsauta ruutua, niin voit kääntää kameraa hiirellä.<div class="tutChk">${['fwd','left','back','right'].map(a=>`<span data-mv="${a}">${kL(a)}</span>`).join('')}<span data-mv="run">${kL('run')} juokse</span><span data-mv="jump">${kL('jump')} hyppää</span><span data-mv="crouch">${kL('crouch')} kyykky</span></div>`},
];
const TUT_MOVE_DONE=['fwd','left','back','right','run','jump'];
const tutOn=()=>TUT.on;
// opastuksen oletus uuden maailman valinnassa: ensimmäinen maailma koskaan (ei tallennuksia eikä läpikäytyä opastusta) tai asetus päällä
function tutDefault(){let done=false;try{done=localStorage.getItem('hiidenmaa_tutdone')==='1';}catch(e){}return !!SET.tutNext||(!done&&!slotMeta().some(Boolean));}
function tutChoose(on){try{sessionStorage.setItem('hiidenmaa_tutgo',on?'1':'0');}catch(e){}}
// kutsutaan uuden maailman newGame()-kutsun jälkeen (main.js, molemmat polut): opastus alkaa alkulennon jälkeen (endIntro → tutMaybeStart)
function tutOnNewWorld(){let go=null;try{go=sessionStorage.getItem('hiidenmaa_tutgo');sessionStorage.removeItem('hiidenmaa_tutgo');}catch(e){}
  if(go===null)go=tutDefault()?'1':'0';if(go==='1'){flags.tut=1;flags.tips={};TUT.pending=true;}}
function tutMaybeStart(){if(!TUT.pending||TUT.on)return;const ld=document.getElementById('loadScr');
  if((ld&&!ld.classList.contains('out')&&getComputedStyle(ld).display!=='none')||state!=='play'){setTimeout(tutMaybeStart,400);return;}   // odota latausnäytön ja alkulennon loppu
  TUT.pending=false;tutStart();}
function tutStart(){TUT.on=true;TUT.hold=true;TUT.i=0;TUT.mv={};closePanels(false,true);releaseLock();tutBuild();tutShow();}
function tutBuild(){if(TUT.el)return;const d=document.createElement('div');d.id='tut';d.innerHTML=`<div class="tutRing"></div><div class="tutCard"><div class="tutHead"><b class="tutT"></b><span class="tutN"></span></div><div class="tutD"></div><div class="tutBtns"><button class="btn" data-tut="skip">Ohita opastus</button><button class="btn pri" data-tut="next">Jatka</button></div></div>`;
  document.body.appendChild(d);TUT.el=d;TUT.ring=d.querySelector('.tutRing');
  d.querySelector('[data-tut="next"]').onclick=()=>tutNext();d.querySelector('[data-tut="skip"]').onclick=()=>tutSkipAsk();}
function tutShow(){const S=TUT_STEPS[TUT.i],d=TUT.el;if(!S||!d)return;d.hidden=false;d.classList.toggle('tPanel',!!S.panel);d.classList.toggle('tMove',!!S.move);
  d.querySelector('.tutT').textContent=S.t;d.querySelector('.tutN').textContent=`${TUT.i+1} / ${TUT_STEPS.length}`;d.querySelector('.tutD').innerHTML=S.d();
  d.querySelector('[data-tut="next"]').hidden=!S.next;if(S.el&&S.el==='#quest')TUT.hud0=SET.hudMode|0;TUT.mz0=typeof miniZ!=='undefined'?miniZ:0;TUT.dig=false;
  if(S.move){TUT.hold=false;TUT.t=0;if(typeof mSnd==='function')mSnd('napit','klikkaus');}tutPlace();}
function tutPlace(){const S=TUT_STEPS[TUT.i],d=TUT.el;if(!S||!d)return;const card=d.querySelector('.tutCard'),R=TUT.ring;let el=S.el?$(S.el):null;
  if(el&&(el.hidden||!el.getClientRects().length||getComputedStyle(el).display==='none')&&S.alt)el=$(S.alt);
  const r=el&&el.getClientRects().length?el.getBoundingClientRect():null;
  if(r&&r.width>0){R.hidden=false;const p=8;Object.assign(R.style,{left:(r.left-p)+'px',top:(r.top-p)+'px',width:(r.width+p*2)+'px',height:(r.height+p*2)+'px'});}else R.hidden=true;
  card.classList.remove('up','dn');
  if(S.panel||!r){card.style.left='50%';card.style.top='';card.style.bottom=S.panel?'12px':'';if(!S.panel)card.style.top='18%';return;}
  // kortti kohteen viereen: alle, jos tilaa, muuten yläpuolelle; vaakasuunnassa ruudun sisällä
  const cw=Math.min(440,innerWidth-24),cx=clamp(r.left+r.width/2,cw/2+12,innerWidth-cw/2-12);card.style.left=cx+'px';card.style.bottom='';
  if(r.bottom+230<innerHeight){card.style.top=(r.bottom+18)+'px';card.classList.add('up');}else{card.style.top=Math.max(12,r.top-18-card.offsetHeight)+'px';card.classList.add('dn');}}
function tutNext(){const S=TUT_STEPS[TUT.i];if(!S||!TUT.on)return;if(typeof mSnd==='function')mSnd('napit','klikkaus');TUT.i++;if(TUT.i>=TUT_STEPS.length){tutEnd(false);return;}tutShow();}
function tutSkipAsk(){keyDialog('Ohitetaanko opastus?',[['Vahvista',()=>tutEnd(true)],['Peruuta',null]],'Opastuksen voi ottaa uudelleen käyttöön: Asetukset › Ohjaus › Opastus seuraavassa uudessa maailmassa.');}
function tutEnd(skipped){TUT.on=false;TUT.hold=false;TUT.pending=false;if(TUT.el)TUT.el.hidden=true;try{localStorage.setItem('hiidenmaa_tutdone','1');}catch(e){}
  if(SET.tutNext){SET.tutNext=false;saveSet();}if(skipped&&flags)flags.tut=0;   /* ohitettu → ei kertavinkkejä */
  if(!skipped)msg('Opastus valmis – hyvää matkaa Hiidenmaassa!','loot');if(state==='play'&&!openPanel&&!locked)requestLock();}
// näppäimet opastuksen aikana (input.js): pysäytyksessä vain vaiheen sallimat toiminnot, Enter = jatka. Palauttaa true, kun näppäin käsiteltiin tai estettiin.
function tutKey(e){if(!TUT.on)return false;const S=TUT_STEPS[TUT.i],c=e.code;if(!S)return false;
  if(!$('#keyDlg').hidden)return false;
  if((c==='Enter'||c==='NumpadEnter')&&S.next){e.preventDefault();tutNext();return true;}
  if(!TUT.hold)return false;
  const ok=(S.keys||[]).some(a=>BIND[a]===c||(a==='inv'&&c==='KeyI'&&BIND.inv==='Tab')||(a==='digits'&&/^Digit[1-8]$/.test(c)));if(ok&&/^Digit[1-8]$/.test(c))TUT.dig=true;
  if(c===BIND.menu&&!openPanel)return true;   // P ilman avointa ikkunaa avaisi päävalikon kesken opastuksen
  if(c==='Tab')e.preventDefault();return !ok;}
// pysäytetyn pelin päivitys (main.js update): vain kamera, HUD ja korostuksen paikka – maailma, olennot, nälkä ja aika seis
function tutHoldUpdate(dt){updateCamera(dt);updateHUD(dt);}
// joka ruutu (main.js frame): vaiheiden ehdot, liikkumisen tarkistus, kortin paikka ja kertavinkit
function tutTick(dt){
  if(TUT.on){const S=TUT_STEPS[TUT.i];if(!S){tutEnd(false);return;}if(TUT.el)TUT.el.hidden=state!=='play'&&state!=='ui';
    if(S.ok&&S.ok()){TUT.i++;if(TUT.i>=TUT_STEPS.length)tutEnd(false);else tutShow();return;}   // heti (nopea painallus ei jumita vaihetta)
    if(S.move&&state==='play'){TUT.t+=dt;for(const a of [...TUT_MOVE_DONE,'crouch'])if(kd(a)&&(a!=='run'||Math.hypot(P.vel.x,P.vel.z)>.5))TUT.mv[a]=1;
      for(const sp of TUT.el.querySelectorAll('[data-mv]'))sp.classList.toggle('ok',!!TUT.mv[sp.dataset.mv]);
      if(TUT_MOVE_DONE.every(a=>TUT.mv[a])||(TUT.t>40&&Object.keys(TUT.mv).length>=3)){tutEnd(false);return;}}
    TUT.pl=(TUT.pl||0)-dt;if(TUT.pl<=0){TUT.pl=.25;tutPlace();}return;}
  tipsTick(dt);}

/* ---------------- KERTAVINKIT (opastuksen maailmassa) ---------------- */
// Kun asia tulee ensimmäisen kerran vastaan, ruudun yläosaan tulee vinkki 10 s (yksi kerrallaan, väli vähintään 6 s). flags.tips[id] = näytetty.
const TIPS=[
  {id:'vasara',c:()=>{const w=equipped('weapon');return w&&w.id==='vasara';},d:()=>`Rakentaminen: ${kL('build')} tai hiiren oikea avaa rakennusvalikon, hiiren vasen asettaa. ${kL('rot')} kääntää (Shift = asento), ${kL('snap')}/${kL('vsnap')} kohdistus, ${kL('up')}/${kL('down')} nosta/laske, ${kL('remove')} pura, ${kL('repair')} korjaa. Työpisteet tarvitsevat työpenkin lähelleen.`},
  {id:'jousi',c:()=>{const w=equipped('weapon');return w&&ITEMS[w.id].cat==='bow';},d:()=>`Jousi: pidä hiiren vasen pohjassa ja päästä irti. Kyykyssä (${kL('crouch')}) näet tarkan tähtäimen ja lentoradan. Nuolet ovat repussa.`},
  {id:'lapio',c:()=>{const w=equipped('weapon');return w&&(w.id==='lapio'||w.id==='kuokka');},d:()=>`Lapio: hiiren vasen kaivaa, oikea tekee polun. Kuokka: vasen nostaa maata, oikea palauttaa maan värin ja kasvillisuuden (esim. polun kohdalle).`},
  {id:'kirves',c:()=>{const w=equipped('weapon');return w&&ITEMS[w.id].chop;},d:()=>`Kirves kaataa puita (hiiren vasen). Kaatuneesta puusta jää tukki – lyö sitä, niin saat puuta.`},
  {id:'uinti',c:()=>P.swim,d:()=>`Uidessa ${kL('jump')} on veto pintaan (kuluttaa kestävyyttä). Veden alla happi loppuu – nouse ajoissa.`},
  {id:'yo',c:()=>typeof isNight==='function'&&isNight()&&!P.inDun,d:()=>`Yö laskeutuu: sudet ja hiidet liikkuvat. Rakenna suoja ja nuotio – katon alla tulen ääressä lepäät. Sängyssä (${kL('interact')}) voit nukkua yön yli.`},
  {id:'kuorma',c:()=>typeof MAXW!=='undefined'&&invWeight()>MAXW,d:()=>`Ylikuorma: et voi juosta, ja kestävyys hupenee liikkuessa. Pudota tavaraa (${kL('up')}) tai vie se arkkuun.`},
  {id:'hp',c:()=>P.hp<maxHp()*.4&&!P.dead,d:()=>`Terveys vähissä! Peräänny, syö kypsää ruokaa (pikapaikka) ja lepää tulen ääressä.`},
  {id:'kumpu',c:()=>P.inDun&&!P.realm,d:()=>`Hautakumpu on pimeä – soihtu kädessä näet. Kirstut avataan ${kL('interact')}:llä; ylimys kantaa Kalmon sinettiä.`},
  {id:'ulottuvuus',c:()=>P.inDun&&!!P.realm,d:()=>`Ulottuvuudessa portti vie takaisin saarelle. Pomo herää, kun astut sen kammioon – varaa ruokaa ja parannusjuomia.`},
  {id:'taso',c:()=>playerLevel()>=2,d:()=>`Uusi taso! ${kL('prog')} näyttää, mitä sait ja mitä seuraavat tasot avaavat.`},
];
function tipsTick(dt){if(!flags||!flags.tut||state!=='play'||P.dead)return;flags.tips=flags.tips||{};const el=tipEl();
  if(TUT.tipT>0){TUT.tipT-=dt;if(TUT.tipT<=0)el.classList.remove('on');return;}
  TUT.tipCd-=dt;if(TUT.tipCd>0)return;TUT.tipCd=.5;
  for(const T of TIPS){if(flags.tips[T.id])continue;let ok=false;try{ok=T.c();}catch(e){}if(!ok)continue;flags.tips[T.id]=1;
    el.querySelector('.tipD').innerHTML=T.d();el.classList.add('on');TUT.tipT=10;TUT.tipCd=6;if(typeof mSnd==='function')mSnd('napit','hover');return;}}
function tipEl(){if(TUT.tipEl)return TUT.tipEl;const d=document.createElement('div');d.id='tutTip';d.innerHTML='<b>Vinkki</b><span class="tipD"></span>';document.body.appendChild(d);TUT.tipEl=d;return d;}
