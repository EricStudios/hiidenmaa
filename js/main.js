/* Hiidenmaa – main.js
   Valikko, pääsilmukka ja testirajapinta window.__game */
'use strict';
window.__JSV2='3.35';   // v1.58: versiotarkistus (viimeinen skripti)
// v1.24 KORJAUS (KORJAUKSET 22): valikkokameran tila esitellään ennen kuin startPlay voidaan kutsua (karttavaihdon jälkeinen automaattinen
// aloitus tapahtuu jo tiedoston alussa; ennen let-muuttujat olivat vielä alustamatta → ReferenceError → peli jäi mustaksi).
let frameErrShown=false;
/* v1.27: KÄYTTÄJÄN PYYNTÖ – valikkokameran muutokset (v1.15 3D-kierros, v1.25 animoidut kuvat) väliaikaisesti pois.
   true = alkuperäinen valikkokamera (kiertää kartan keskikohtaa). Palautus: false. Koodi säilyy (menuCam, menubg.js). */
const MENU_V2_OFF=false;   // v1.29: palautettu käyttöön (v1.27 väliaikaisesti true)
function menuCamOld(dt){menuA+=dt*.03;const cx=Math.cos(menuA)*60,cz=Math.sin(menuA)*60;camera.position.set(cx,terrainH(cx,cz)+22,cz);camera.lookAt(0,6,6);P.pos.set(0,5,6);updateEnvironment(dt);if(!started)fig.g.visible=true;}
const MENU_SHOT_T=20;let menuShot=null,menuSpots=null,menuDeco=[],menuMob=null,menuLight=null,menuFading=false;

/* ---------------- MENU ---------------- */
function hasSave(){return slotMeta().some(Boolean);}
// v1.36 (lista 3, kohta 20): päävalikon maailmalista (enint. 5): nimi, viimeksi pelattu, päivä, taso ja kartta; Pelaa, Nimeä, Poista (vahvistus)
// ja Uusi maailma omalla nimellä. Pelin aikana toiseen maailmaan siirtyminen tallentaa nykyisen ensin.
// v1.43 (lista 4, kohta 32): taukovalikon tila – Tauko (maailma pysähtyy) tai Käynnissä (maailma päivittyy valikon takana)
let pauseRun=false,intro=null,menuVis=true,uiAlt=false;   // intro ennen karttavaihdon jatkoa (KORJAUKSET 22)
try{pauseRun=localStorage.getItem('hiidenmaa_prun')==='1';}catch(e){}
function refreshMenu(){const inGame=started;$('#bResume').hidden=!inGame;$('#bSave').hidden=!inGame;{const b=$('#bRun');if(b){b.hidden=!inGame;$('#bRunT').textContent='Tila: '+(pauseRun?'Käynnissä':'Tauko');b.classList.toggle('on',pauseRun);}}
  const m=slotMeta();$('#mapName').textContent=inGame?`Kartta: ${MAP.name}`:'';$('#curWorld').textContent=inGame&&curSlot>=0&&m[curSlot]?`Maailma: ${m[curSlot].name}`:'';renderWorlds();
  // v1.46: sankaripainike – jatka viimeisintä maailmaa tai aloita ensimmäinen; Maailmat-painikkeen alateksti
  {const used=m.filter(Boolean).length,li=lastWorld(m),c=$('#bContinue');if(c){c.hidden=inGame;
    if(li>=0){const w=m[li];$('#bContT').textContent='Jatka seikkailua';$('#bContS').textContent=`${w.name} · päivä ${w.day||1} · taso ${w.lvl||1} · ${(MAPS[w.mapId||0]||MAPS[0]).name}`;}
    else{$('#bContT').textContent='Aloita seikkailu';$('#bContS').textContent='Uusi maailma – haaksirikko, ranta ja arvottu saari';}}
   const ws=$('#bWorldsS');if(ws)ws.innerHTML=used?`${used} / ${SLOTS} maailmaa<span class="bh"> – pelaa, nimeä tai aloita uusi</span>`:'Ei vielä maailmoja<span class="bh"> – aloita uusi</span>';}
  bhApply();
  $('#menu').classList.toggle('inGame',inGame);menuStagger();}
/* v3.21 käyttäjä: valikon nappien itsestäänselvät ohjerivit (.bh) näkyvät vain siihen asti, kun nappia on käytetty kerran (localStorage BH_KEY, kaikille maailmoille).
   Asetukset › Ohjaus › Näytä valikon nappien ohjeet aina (SET.alwaysBtnHints, body.showBH). */
const BH_KEY='hiidenmaa_btnUsed',BH_IDS=['bRun','bSave','bWorlds','bKeys','bMenuToggle','bNewWorld'];
function bhUsed(){try{return JSON.parse(localStorage.getItem(BH_KEY)||'{}')||{};}catch(e){return {};}}
function bhMark(id){const o=bhUsed();if(o[id])return;o[id]=1;try{localStorage.setItem(BH_KEY,JSON.stringify(o));}catch(e){}}
function bhApply(){const o=bhUsed();for(const id of BH_IDS){const b=document.getElementById(id);if(b)b.classList.toggle('bhUsed',!!o[id]);}}
addEventListener('pointerup',e=>{const b=e.target&&e.target.closest&&e.target.closest('#menu .mbtn[id]');if(b&&BH_IDS.includes(b.id))setTimeout(()=>{bhMark(b.id);bhApply();},400);},true);
function lastWorld(m){let b=-1,t=-1;m.forEach((w,i)=>{if(w&&(w.at||0)>t){t=w.at||0;b=i;}});return b;}
/* v1.46: valikon näkymät. 'main' = päänäkymä ilman vieritystä; 'worlds' ja 'settings' (Asetukset/Näppäimet) korvaavat sen leveällä
   näkymällä tyhjään tilaan. Takaisin-painike tai P palaa. #settings-paneelin hidden-tila ohjaa settings-näkymää (MutationObserver). */
function setMenuView(v){const M=$('#menu');if(!M||M.dataset.view===v)return;M.dataset.view=v;
  if(v==='worlds')$('#mvTitle').textContent='Maailmat';else if(v==='settings')$('#mvTitle').textContent=setTab==='keys'?'Näppäimet':'Asetukset';
  else{M.classList.remove('anim');void M.offsetWidth;M.classList.add('anim');}
  if(typeof sfx==='function')sfx('pickup',v==='main'?.8:1.2,.25);}
function menuBack(){const M=$('#menu');if(!M||M.dataset.view==='main')return false;if(!$('#settings').hidden)$('#settings').hidden=true;setMenuView('main');return true;}
function menuStagger(){let i=0;for(const b of $('#menu').querySelectorAll('.menuBtns>*'))if(!b.hidden)b.style.setProperty('--i',i++);}
(function(){const M=$('#menu');if(!M)return;
  for(const b of M.querySelectorAll('.mbtn[data-rune]')){if(b.querySelector('.mIco'))continue;const i=document.createElement('i');i.className='mIco';i.textContent=b.dataset.rune;b.prepend(i);const sh=document.createElement('b');sh.className='mSheen';b.appendChild(sh);}
  new MutationObserver(()=>{const open=!$('#settings').hidden;if(open)setMenuView('settings');else if(M.dataset.view==='settings')setMenuView('main');}).observe($('#settings'),{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{if(M.dataset.view==='settings')$('#mvTitle').textContent=setTab==='keys'?'Näppäimet':'Asetukset';}).observe($('#setTabs'),{childList:true});
  $('#bBack').onclick=menuBack;$('#bWorlds').onclick=()=>setMenuView('worlds');
  /* v3.20 KORJAUKSET 92: Aloita seikkailu ei tehnyt mitään – Uusi maailma -nappi on pito-nappi (pointer-tapahtumat, v3.13), joten .click() ei käynnistänyt sitä.
     Nyt napsautus aloittaa ensimmäisen maailman suoraan (NEWW.go) ja olemassa olevan maailman kanssa jatkaa viimeisintä. */
  $('#bContinue').onclick=()=>{const m=slotMeta(),li=lastWorld(m);if(li>=0){const b=$(`#worlds [data-play="${li}"]`);if(b){b.click();return;}}if(!NEWW.go)renderWorlds();if(NEWW.go)NEWW.go();};
  M.classList.add('anim');})();
const fmtAt=t=>{try{return new Date(t).toLocaleString('fi-FI',{dateStyle:'short',timeStyle:'short'});}catch(e){return '';}};
function renderWorlds(){const el=$('#worlds');if(!el)return;const m=slotMeta(),used=m.filter(Boolean).length,free=m.findIndex(x=>!x);const lw=started?-1:lastWorld(m);   /* v3.08 käyttäjä: pelissä oleva maailma kirkas ääriviiva + "Pelaat nyt", muuten viimeksi pelattu vaalea + "Viimeksi pelattu" */
  el.innerHTML=`<h3>Maailmat <span class="note">${used} / ${SLOTS}</span></h3>`+m.map((w,i)=>!w?'':`<div class="world${started&&i===curSlot?' cur':i===lw?' last':''}" data-i="${i}" title="Tuplaklikkaus: pelaa · pidä pohjassa 1 s: kopioi maailman koodi">
    ${started&&i===curSlot?'<span class="wTag cur">Pelaat nyt</span>':i===lw?'<span class="wTag last">Viimeksi pelattu</span>':''}<div class="wInfo"><b class="wName">${esc(w.name)}</b><span>${fmtAt(w.at)} · päivä ${w.day||1} · taso ${w.lvl||1} · ${(MAPS[w.mapId||0]||MAPS[0]).name}${w.seed?` · seed ${w.seed}`:''}${w.min?` · ${w.min} min`:''}</span></div>
    <div class="wBtns"><button class="btn pri" data-play="${i}">${started&&i===curSlot?'Pelissä':'Pelaa'}</button><button class="btn" data-ren="${i}">Nimeä</button><button class="btn" data-del="${i}">Poista</button></div></div>`).join('')+
    (free>=0?`<div class="wNew"><input id="newName" class="search" maxlength="28" placeholder="Maailma ${free+1}">${DEV?`<input id="newSeed" class="search" type="number" min="1" max="${SEED_MAX}" placeholder="Seed (DEV, tyhjä = satunnainen)">`:''}<label class="wTut"><input type="checkbox" id="newTut"${tutDefault()?' checked':''}> Opastus uuden maailman alkuun</label><button class="mbtn holdBtn" id="bNewWorld"><i class="mIco">ᚨ</i>Uusi maailma<small class="bh">Aloita rannalta ilman mitään – kartta arvotaan · pidä pohjassa = heti</small><b class="mSheen"></b></button></div>`
      :`<div class="note">Kaikki ${SLOTS} paikkaa ovat käytössä. Poista maailma tehdäksesi uuden.</div>`);
  el.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{const i=+b.dataset.play;if(started&&i===curSlot){$('#bResume').click();return;}
    const go=()=>{const d=slotData(i);if(!d){$('#saveMsg').textContent='Tallennus puuttuu tai on rikki.';return;}setCurSlot(i);playSave(d,`Tervetuloa takaisin: ${m[i].name}.`);};
    if(started)keyDialog(`Siirrytäänkö maailmaan «${m[i].name}»? Nykyinen maailma tallennetaan ensin.`,[['Vahvista',()=>{saveGame(true);go();}],['Peruuta',null]]);else go();});
  el.querySelectorAll('[data-ren]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ren,row=el.querySelector(`.world[data-i="${i}"] .wName`);const inp=document.createElement('input');inp.className='search';inp.maxLength=28;inp.value=m[i].name;row.replaceWith(inp);inp.focus();inp.select();
    const done=ok=>{if(inp.dataset.done)return;inp.dataset.done=1;if(ok&&inp.value.trim()){const mm=slotMeta();mm[i].name=inp.value.trim();setSlotMeta(mm);}refreshMenu();};
    inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')done(true);else if(e.key==='Escape')done(false);};inp.onblur=()=>done(true);});
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const i=+b.dataset.del;keyDialog(`Poistetaanko maailma «${m[i].name}» pysyvästi?`,[['Vahvista',()=>{deleteSlot(i);refreshMenu();}],['Peruuta',null]],'Poistoa ei voi perua.');});
  const nb=$('#bNewWorld');if(nb){const ni=$('#newName');ni.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')nb.click();};
    const si=$('#newSeed');if(si)si.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')nb.click();};
    const go=()=>{const name=ni.value.trim()||`Maailma ${free+1}`,sv=si?clamp(Math.floor(+si.value)||0,0,SEED_MAX):0;if(started)saveGame(true);const mm=slotMeta();mm[free]={name,at:Date.now(),day:1,lvl:1,mapId:MAP_ID,min:0};setSlotMeta(mm);setCurSlot(free);{const tc=$('#newTut');tutChoose(!!(tc&&tc.checked));}startNewGame(sv?{seed:sv}:null);};
    /* v3.13 käyttäjä: Uusi maailma – napsautus = varmistus isolla Aloita-napilla, pohjassa NEW_HOLD s = aloitus heti (palkki napin taustalla, vihje napissa) */
    const ask=()=>{const name=ni.value.trim()||`Maailma ${free+1}`;keyDialog(`Aloitetaanko uusi maailma «${name}»?`,[['Aloita',go],['Peruuta',null]],started?'Nykyinen maailma tallennetaan ensin. Vinkki: pidä Uusi maailma -nappia pohjassa, niin maailma alkaa heti.':'Vinkki: pidä Uusi maailma -nappia pohjassa, niin maailma alkaa heti.');const y=document.querySelector('#keyDlgB .btn');if(y)y.classList.add('pri','big');};
    nb.onclick=e=>e.preventDefault();ni.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')ask();};if(si)si.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')ask();};
    holdBtn(nb,NEW_HOLD,go,ask);NEWW.go=go;}
  // v3.13 käyttäjä: kortin tuplaklikkaus = Pelaa (tai jatka, jos käynnissä); kortti pohjassa 1 s = maailman tallennuskoodi leikepöydälle
  el.querySelectorAll('.world[data-i]').forEach(c=>{const i=+c.dataset.i;c.ondblclick=e=>{if(e.target.closest('button,input'))return;const b=c.querySelector('[data-play]');if(b)b.click();};
    holdBtn(c,CODE_HOLD,()=>worldCodeCopy(i,c),null,e=>!e.target.closest('button,input'));});bhApply();}
const NEW_HOLD=.6,CODE_HOLD=1,NEWW={go:null};   // v3.20 NEWW.go = uuden maailman aloitus (Aloita seikkailu -napille)
// pito-nappi: --qp etenee nollasta ykköseen (CSS-palkki), lyhyt painallus kutsuu tap-funktiota, ok-ehto rajaa mistä painallus saa alkaa
function holdBtn(b,T,done,tap,ok){let t0=0,raf=0,fired=false;const stop=()=>{t0=0;cancelAnimationFrame(raf);b.style.setProperty('--qp','0');b.classList.remove('holding');};
  const step=()=>{if(!t0)return;const k=Math.min(1,(performance.now()-t0)/(T*1000));b.style.setProperty('--qp',k.toFixed(3));if(k>=1){fired=true;stop();done();return;}raf=requestAnimationFrame(step);};
  b.addEventListener('pointerdown',e=>{if(e.button!==0||(ok&&!ok(e)))return;fired=false;t0=performance.now();b.classList.add('holding');raf=requestAnimationFrame(step);});
  b.addEventListener('pointerup',()=>{if(!t0)return;const short=performance.now()-t0<T*1000;stop();if(short&&tap&&!fired)tap();});
  for(const ev of ['pointerleave','pointercancel','blur'])b.addEventListener(ev,()=>{if(t0)stop();});}
async function worldCodeCopy(i,card){let code='';worldToast(card,'Kopioidaan maailman koodia…');try{const d=started&&i===curSlot?serialize():slotData(i);if(!d)throw 0;code=await packSave(d);}catch(e){worldToast(card,'Koodia ei voitu tehdä','bad');return;}
  let ok=false;try{await navigator.clipboard.writeText(code);ok=true;}catch(e){try{const t=document.createElement('textarea');t.value=code;document.body.appendChild(t);t.select();ok=document.execCommand('copy');t.remove();}catch(e2){}}
  worldToast(card,ok?'Maailman koodi kopioitu leikepöydälle ✓':'Kopiointi estetty – käytä Asetukset › Tallennus',ok?'':'bad');if(ok&&typeof mSnd==='function')mSnd('valikko','klikkaus');}
function worldToast(card,t,cls){let e=card.querySelector('.wToast');if(!e){e=document.createElement('div');e.className='wToast';card.appendChild(e);}e.textContent=t;e.className='wToast on '+(cls||'');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2200);}
// Valikon vierityksen vihjeet: ohuet, raaputetun näköiset tikkunuolet ylä- ja alareunassa, jotka sykkivät rauhallisesti,
// kun sivua on piilossa ylhäällä tai alhaalla. Vierityspalkki on piilotettu CSS:llä.
function scrollHints(el){
  const svg=(up)=>`<svg viewBox="0 0 16 36" width="12" height="30" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="${up?'M8.2 34 L7.8 19 L8.3 3.2':'M7.8 2 L8.2 17 L7.7 32.8'}" stroke-width="1.3"/><path d="${up?'M8.6 33 L8.4 4.4':'M7.4 3 L7.6 31.6'}" stroke-width=".6" opacity=".6"/>
    <path d="${up?'M2.6 9.4 L8.1 3 L13.6 9.8':'M2.4 26.6 L7.9 33 L13.4 26.2'}" stroke-width="1.3"/><path d="${up?'M3.4 10.2 L8.3 4.2':'M3.2 25.8 L8.1 31.8'}" stroke-width=".6" opacity=".6"/></g></svg>`;
  const mk=(cls,up)=>{const d=document.createElement('div');d.className='scrollHint '+cls;d.innerHTML=svg(up);el.appendChild(d);return d;};
  const u=mk('up',true),dn=mk('down',false);
  const upd=()=>{u.classList.toggle('on',el.scrollTop>6);dn.classList.toggle('on',el.scrollTop+el.clientHeight<el.scrollHeight-6);};
  el.addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);
  if(window.ResizeObserver)new ResizeObserver(upd).observe(el.firstElementChild||el);
  new MutationObserver(upd).observe(el,{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true});
  setTimeout(upd,50);return upd;}
let started=false,confirmNew=false;
// v1.14 (lista 2, kohta 5): "Toimii parhaiten tietokoneella…" näkyy ruudun yläkeskellä kerran per käynnistys 6 s ja häipyy 1,5 s:ssa
(function(){const h=$('#pcHint');if(!h||true)return;   // v1.55: varoitus näytetään vain ensikäynnin aloitusjaksossa
  /* ajastin alkaa vasta kun valikko on piirretty (2. kehys), jotta latausaika ei syö näkymisaikaa */
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(started)return;h.hidden=false;setTimeout(()=>h.classList.add('fade'),3000);setTimeout(()=>{h.hidden=true;},4600);   /* v1.30: 3 s (ennen 6 s) */}));})();
/* v2.53/v2.66 MUSIIKKI (boot.js __mus, säännöt siellä): valikko = menu1 aloitusjakson logosta ja sen jälkeen menu2; liityttäessä peliin
   (startPlay) valikkomusiikki häivytetään ja maailman musiikki alkaa 10–40 s kuluttua. Pelissä konteksti joka ruutu (musicCtx): pomotaistelu
   (pomopalkki näkyvissä, BB.m), ulottuvuus / Hautakumpu (P.inDun) tai biomi. Biomi vaihtuu vasta, kun pelaaja on ollut uudessa biomissa
   MUS_BIO_T s (raja-alueella ei heilu). Taukovalikko: PAUSE_MUSIC_T s auki → menu2 (tauko); peliin palatessa maailman säännöt alusta. */
const PAUSE_MUSIC_T=15,MUS_BIO_T=4,MUS_REALM={portal1:'routaluola',portal2:'kalmankammio',portal3:'aarnihauta'};
const MUSB={cur:null,cand:null,t:0};
function musicBiome(dt){const b=(typeof BIO_SND!=='undefined'&&BIO_SND[biomeHere(P.pos.x,P.pos.z)])||'rantaniitty';
  if(!MUSB.cur){MUSB.cur=b;return b;}if(b===MUSB.cur){MUSB.cand=null;return b;}if(b!==MUSB.cand){MUSB.cand=b;MUSB.t=0;}MUSB.t+=dt;if(MUSB.t>=MUS_BIO_T){MUSB.cur=b;MUSB.cand=null;}return MUSB.cur;}
/* v2.86 VIIMEISEN POMON MUSIIKKI (Kalmanvartija, tyyppi 'vartija'): alle puolet terveydestä → 'vboss' (vartija_puolivali) kuolemaan asti tai kunnes
   taistelu keskeytyy (pomopalkki poistuu, pelaaja kuolee); kun pomo alkaa kuolla → 'vend' (vartija_kuolema) soi kerran loppuun (enintään 10 min;
   jos kappale ei ala 8 s:ssa, palataan normaaliin). Puuttuva kappale = vanha käytös (pomotaistelu). */
const MUS_FB={m:null,vd:null,rec:null};
function musicCtx(dt){const M=window.__mus,has=p=>!!(M&&M.has&&M.has(p));
  if(typeof BB!=='undefined'&&BB.m&&BB.m.type==='vartija')MUS_FB.m=BB.m;
  {const fb=MUS_FB.m;if(fb&&fb.dead){MUS_FB.m=null;if(!MUS_FB.vd&&has('mu/ulottuvuudet/vartija_kuolema_'))MUS_FB.vd={t:playTime,seen:false};}else if(fb&&!mobs.includes(fb))MUS_FB.m=null;}
  if(MUS_FB.rec){const V=MUS_FB.rec,st=M.state;if(st.track&&st.track.indexOf('ennatyskala')>=0)V.seen=true;else if(V.seen&&!st.playing)V.done=true;   // v3.27 ennätyskalan teema soi kerran
    if(!V.done&&playTime-V.t<180&&(V.seen||playTime-V.t<8))return 'rec';MUS_FB.rec=null;}
  if(MUS_FB.vd){const V=MUS_FB.vd,st=M.state;if(st.track&&st.track.indexOf('vartija_kuolema')>=0)V.seen=true;else if(V.seen&&!st.playing)V.done=true;
    if(!V.done&&playTime-V.t<600&&(V.seen||playTime-V.t<8))return 'vend';MUS_FB.vd=null;}
  if(typeof BB!=='undefined'&&BB.m&&!BB.m.dead&&!P.dead)return BB.m.type==='vartija'&&BB.m.hp<=BB.m.maxHp*.5&&has('mu/ulottuvuudet/vartija_puolivali_')?'vboss':'boss';
  if(P.inDun)return 'd:'+(P.realm?MUS_REALM[P.realm]||'hautakumpu':'hautakumpu');return 'w:'+musicBiome(dt);}
let musT=performance.now();
function musicTick(){const M=window.__mus;if(!M||!M.set)return;const now=performance.now(),dt=Math.min(.5,(now-musT)/1000);musT=now;const c=M.state.ctx;
  if(state==='paused'&&started){if(now-pausedAt>=PAUSE_MUSIC_T*1000&&c!=='tauko')M.set('tauko');return;}   // alle 15 s: maailman musiikki jatkuu
  if(started&&(state==='play'||state==='ui')){M.set(musicCtx(dt));return;}
  if(c==='tauko'&&state!=='paused')M.set(null);}
function startPlay(){if(window.__mus)window.__mus.stop();if(typeof menuClear==='function')menuClear();if(typeof mbgShow==='function'&&MBG.cv)mbgShow(false);setTimeout(()=>{if(typeof applyHudMode==='function')applyHudMode();},50);{const f=$('#menuFade');if(f)f.style.opacity=0;}fig.g.visible=true;started=true;{const h=$('#pcHint');if(h&&!h.hidden){h.classList.add('fade');setTimeout(()=>h.hidden=true,1600);}}state='play';$('#menu').hidden=true;$('#hud').hidden=false;requestLock();invDirty=true;}
function pauseGame(){if(state!=='play'||openPanel||P.dead)return;if(typeof tipDismiss==='function')tipDismiss();QUIT.saved=false;state='paused';pausedAt=performance.now();$('#menu').hidden=false;$('#settings').hidden=true;setMenuView('main');if(typeof logoRandom==='function')logoRandom();/* v1.48: uusi logoteema joka valikkokäynnillä */$('#hud').hidden=true;refreshMenu();mouseL=mouseR=false;P.drawing=false;}
addEventListener('beforeunload',e=>{if(started&&!flags.won&&!reloading){e.preventDefault();e.returnValue='';}});
// Maailma rakennetaan skriptien latautuessa, joten kartan vaihto = sivun uudelleenlataus.
let reloading=false;
function switchMap(id,pending,data,seed){try{localStorage.setItem('hiidenmaa_map',String(id));if(seed!==undefined)localStorage.setItem('hiidenmaa_seed',String(seed|0));   /* v2.69 seed */sessionStorage.setItem('hiidenmaa_pending',pending);if(data)sessionStorage.setItem('hiidenmaa_data',data);}catch(e){return false;}
  reloading=true;$('#fade').style.opacity=1;const mp=window.__mus&&window.__mus.state.playing;if(mp){window.__mus.stop(.5);setTimeout(()=>location.reload(),550);}else location.reload();return true;}   // v2.53 musiikki häivyttäen
/* v2.69 uusi maailma: uusi seed ja satunnainen kartta → uudelleenlataus. Tuore (käyttämätön) ladattu maailma käytetään sellaisenaan (ensikäynti). */
function worldFresh(){try{return localStorage.getItem('hiidenmaa_fresh')===MAP_ID+':'+SEED;}catch(e){return false;}}
function startNewGame(o){o=o||{};const fresh=worldFresh()&&!o.seed,id=fresh?MAP_ID:Math.floor(Math.random()*MAPS.length),sd=o.seed||(fresh?SEED:newSeed());
  if((id!==MAP_ID||sd!==SEED)&&switchMap(id,'new',null,sd))return;try{localStorage.removeItem('hiidenmaa_fresh');}catch(e){}worldLoad(()=>{newGame();tutOnNewWorld();startPlay();saveGame(true);msg(`Kartta: ${MAP.name}`);startIntro(true);});}
function playSave(s,welcome){if(curSlot<0){const f=freeSlot();setCurSlot(f<0?0:f);}const mid=s.mapId||0,sd=s.seed|0;if((mid!==MAP_ID||sd!==SEED)&&switchMap(mid,'load',JSON.stringify(s),sd))return;saveLoad(s,welcome);}
/* v2.59 TALLENNUKSEN JATKAMINEN LATAUSNÄYTÖLLÄ (ennen loadData jäädytti näytön): riimukivi (__ldShow) → lataus seuraavassa ruudussa → muutama
   ruutu varjostimille → valmis-leimahdus, häivytys peliin (__ldDone). Pelaaja suojassa (P.spawnProt) latausnäytön ajan. */
const SAVE_LD_FRAMES=20;
function saveLoad(s,welcome){if(!window.__ldShow){loadData(s);startPlay();msg(welcome,'loot');return;}
  window.__ldShow('Maailma herää…');if(window.__ldSet)window.__ldSet(.1);
  setTimeout(()=>{if(window.__ldSet)window.__ldSet(.45);loadData(s);startPlay();P.spawnProt=Math.max(P.spawnProt||0,4);let n=0;
    const tick=()=>{if(window.__ldSet)window.__ldSet(.45+n/SAVE_LD_FRAMES*.55);if(++n<SAVE_LD_FRAMES)requestAnimationFrame(tick);else{ldPrewarm();window.__ldAfter=()=>{if(typeof keysClear==='function')keysClear();msg(welcome,'loot');};if(window.__ldDone)window.__ldDone();}};requestAnimationFrame(tick);},90);}
$('#bRun').onclick=()=>{pauseRun=!pauseRun;try{localStorage.setItem('hiidenmaa_prun',pauseRun?'1':'0');}catch(e){}refreshMenu();};
$('#bResume').onclick=()=>{state='play';$('#menu').hidden=true;$('#hud').hidden=false;requestLock();};
// Tallenna: ei avaa asetuksia; ilmoitus näkyy painikkeessa ja valikon tilariviltä
$('#bSave').onclick=()=>{const ok=saveGame(true);if(ok)QUIT.saved=true;refreshMenu();const lbl=$('#bSave .bLbl'),prevT='Tallenna nyt';$('#bSave').classList.toggle('saved',!!ok);   // v1.49: oma tekstielementti (firstChild on riimulaatta)
  $('#saveMsg').textContent=ok?'Tallennettu selaimeen.':'Selaimen tallennus ei ole käytössä – avaa Asetukset › Tallennus ja tallenna koodi tai tiedosto.';
  lbl.textContent=ok?'Tallennettu ✓':'Tallennus epäonnistui';setTimeout(()=>{lbl.textContent=prevT;$('#saveMsg').textContent='';$('#bSave').classList.remove('saved');},2200);};
$('#bKeys').onclick=()=>{if(!$('#settings').hidden&&setTab==='keys'){$('#settings').hidden=true;return;}openSettings('keys');};
$('#bMenuToggle').onclick=()=>{if(!$('#settings').hidden&&setTab!=='keys'){$('#settings').hidden=true;return;}openSettings(setTab==='keys'?'gfx':setTab);};
$('#bSetClose').onclick=()=>{$('#settings').hidden=true;};
$('#bRespawn').onclick=respawn;
$('#bWinCont').onclick=()=>{$('#winS').hidden=true;$('#hud').hidden=false;state='play';requestLock();};
refreshMenu();scrollHints($("#menu"));
// Kartanvaihdon jälkeinen jatko: aloita uusi peli tai lataa tallennus automaattisesti.
(function(){let p=null,d=null;try{p=sessionStorage.getItem('hiidenmaa_pending');d=sessionStorage.getItem('hiidenmaa_data');sessionStorage.removeItem('hiidenmaa_pending');sessionStorage.removeItem('hiidenmaa_data');}catch(e){}
  if(p==='new'){window.__ldSndOnce=1;try{localStorage.removeItem('hiidenmaa_fresh');}catch(e){}newGame();tutOnNewWorld();startPlay();saveGame(true);setTimeout(()=>msg(`Kartta: ${MAP.name}`),300);startIntro(true);introVeil(true);window.__ldAfter=introRelease;}
  else if(p==='load'&&d){window.__ldSndOnce=1;try{loadData(JSON.parse(d));startPlay();setTimeout(()=>msg('Tervetuloa takaisin.','loot'),300);}catch(e){}}})();

/* v1.43 (lista 4, kohta 11): uuden maailman intro ~6 s. 4 s korkealla pilvien yläpuolella (175 m, hidas kierto pelaajan ympäri),
   "Hiidenmaa" ja kartan nimi animoituna; sitten 2 s nopea syöksy (easeInOut) tavalliseen kameraan. Ohitus millä tahansa näppäimellä tai napsautuksella. */
const _iP=new THREE.Vector3(),_iQ=new THREE.Quaternion(),_iH=new THREE.Vector3(),_iHQ=new THREE.Quaternion();
function startIntro(hold){if(P.inDun)return;intro={t:0,a0:Math.random()*TAU,hold:!!hold};state='intro';$('#hud').hidden=true;const el=$('#introT');if(!el)return;$('#introMap').textContent='Kartta · '+MAP.name;
  el.hidden=false;el.classList.remove('on','out');{const sk=el.querySelector('.skip');if(sk){const ok=introSeen();sk.textContent=ok?'Ohita: napsauta hiirellä':'';sk.hidden=!ok;}}   /* v3.20 ensimmäistä introa ei voi ohittaa */if(hold){el.classList.add('out');return;}introSndStart();void el.offsetWidth;el.classList.add('on');}
/* v2.52 INTRON ÄÄNET (menu_2_efektit/uusi_maailma): tuuli + linnut silmukoina ja pilvien wuush intron alkaessa (pilvet aukeavat), kameran
   syöksyn ääni t = 4 s. Luonnollinen loppu → silmukat hiipuvat INTRO_FADE s; ohitus → kaikki hiipuu INTRO_SKIP_FADE s. */
const INTRO_FADE=2.5,INTRO_SKIP_FADE=.3,ISND={L:[],one:[]};
function introSndStart(){introSndStop(.05);for(const ev of ['tuuli','linnut']){const h=mSnd('uusi_maailma',ev,{loop:true,cat:'amb',menu:1});if(h)ISND.L.push(h);}const w=mSnd('uusi_maailma','pilvet_wuush');if(w)ISND.one.push(w);}
function introSndStop(f){for(const h of ISND.L)mStop(h,f);ISND.L.length=0;if(f<=INTRO_SKIP_FADE)for(const h of ISND.one)mStop(h,Math.min(f,.15));ISND.one.length=0;}
function endIntro(nat){if(!intro)return;if(nat){try{localStorage.setItem(INTRO_SEEN_K,'1');}catch(e){}}if(typeof keysClear==='function')keysClear();introGrassVis(true);introCarpetClear();introMistClear();introSndStop(nat?INTRO_FADE:INTRO_SKIP_FADE);intro=null;introCloudsClear();const el=$('#introT');if(el){el.classList.add('out');el.classList.remove('on');setTimeout(()=>{if(!intro)el.hidden=true;},900);}
  if(state==='intro'){state='play';$('#hud').hidden=false;}if(typeof tutMaybeStart==='function')tutMaybeStart();}   // v2.71 opastus alkulennon jälkeen
function introCam(dt){if(!intro)return;if(!intro.hold)intro.t+=Math.min(dt,.05);const t=intro.t,px=P.pos.x,py=P.pos.y,pz=P.pos.z;
  _iP.copy(camera.position);_iQ.copy(camera.quaternion);   // tavallinen kolmannen persoonan kamera (updateCamera juuri laski)
  const a=intro.a0+t*.11;_iH.set(px+Math.cos(a)*80,175,pz+Math.sin(a)*80);camera.position.copy(_iH);camera.lookAt(px,py,pz);_iHQ.copy(camera.quaternion);
  let k=0;if(t>4){const u=Math.min(1,(t-4)/INTRO_DIVE);k=introEase(u);}   /* v3.13 käyttäjä: syöksy 2,6 s, pehmeä alku ja pitkä, sulava hidastus lopussa */
  camera.position.lerpVectors(_iH,_iP,k);camera.quaternion.copy(_iHQ).slerp(_iQ,k);
  if(k<1){const nf=scene.fog.near,ff=scene.fog.far,E=introEdge(px,py,pz,k);scene.fog.near=lerp(E.n,nf,k);scene.fog.far=lerp(E.f,ff,k);updateChunkVis();}   // v3.10 piirtorajan sumennus (matalat esiasetukset)
  if(t>=4.3&&$('#introT').classList.contains('on')){$('#introT').classList.remove('on');$('#introT').classList.add('out');}
  if(t>=4+INTRO_DIVE-1&&!intro.dsc){intro.dsc=1;   /* v2.99 syöksyääni 1 s ennen paikalleen asettumista (ennen 2 s) */const h=mSnd('uusi_maailma','kamera_laskeutuu');if(h)ISND.one.push(h);}   // v2.52 syöksyn ääni
  if(!SET.oldLoad)introGrassVis(camera.position.y-py<INTRO_GRASS_H);   // v3.10 ylhäältä ei ruohoa
  introCloudsTick(dt);introMistTick(t,k,px,py,pz);if(t>=4+INTRO_DIVE)endIntro(true);}
/* v1.52 (lista 5, kohta 4): uusi maailma latausnäytön takana. Riimukivi näytetään (__ldShow), maailma rakennetaan, intron korkea
   kamera piirretään muutama kuva valmiiksi (varjostimet, ruudut) intro pidossa (hold). Kun latausnäyttö leimahtaa ja alkaa häipyä
   (__ldAfter), pilvet aukeavat sivuille: Medium ja yli → 3D-lisäpilvet kameran edessä (poistetaan animaation jälkeen), alle Medium
   CSS-pilviverho (#cloudVeil). Sitten intro jatkuu normaalisti (4 s ylhäällä + 2 s syöksy). Karttavaihdossa (sivun lataus) sama pito. */
/* v3.13 käyttäjä: SYÖKSY JA USVAKERROKSET. Syöksy INTRO_DIVE s: k = (1−u)·u³ + u·(1 − (1−u)⁵) → alku pehmeä, loppu hidastuu sulavasti (nopeus 0 molemmissa päissä).
   Kamera laskeutuu MIST_LAYERS-korkeuksilla olevien ohuiden usvakerrosten läpi (pilvipallot kameran reitin varrella, häivytys lähellä kameraa ettei rajaa näy);
   kaikilla esiasetuksilla, kevyt (MIST_N palloa / kerros). Poistetaan endIntro:ssa. */
const INTRO_DIVE=2.6,MIST_LAYERS=[78,46,24],MIST_N=12,IMIST={L:null};
function introEase(u){return (1-u)*u*u*u+u*(1-Math.pow(1-u,5));}
/* v3.20 käyttäjä: usva näkyy koko intron ajan (ennen ilmestyi tyhjästä syöksyn alkaessa). Kerrokset lasketaan syöksyn reitille (yläkameran paikka t = 4 s ennustetaan),
   pallot tulevat hiljaa sivulta (MIST_IN s, hidastuen kuin ohi lipuva pilvi) ja jatkavat lipumista samaan suuntaan; ilmestyvät häivyttäen (MIST_FADE s). Lähellä kameraa
   häipyy (ei valkoista huntua); kokonaan pois vasta kun kamera on alhaalla (k > MIST_OUT_K). */
/* v3.25 käyttäjä: pilvi ei saa pysähtyä keskelle vaan liikkuu koko ajan hiljaa kulkusuuntaansa (näyttää sattumalta siinä olevalta): nopeus = MIST_VD (1,1–2 m/s)
   + alun lisä, joka vaimenee (τ = MIST_TAU) – saapuu hitaammin (MIST_APP 32–55 m, ennen 70–140 m 4,4 s:ssa). Pallo on kohdallaan juuri kun kamera ohittaa kerroksen (tc),
   joten ohituksessakin se on lähellä ruudun keskiosaa. Pallo 20 % pidempi liikkeen suunnassa (MIST_LONG). */
const MIST_IN=4.4,MIST_FADE=1.6,MIST_OUT_K=.82,MIST_VD=[1.1,2],MIST_APP=[32,55],MIST_TAU=1.7,MIST_LONG=1.2;
function introMistTick(t,k,px,py,pz){if(!intro||intro.hold||SET.introPlain||k>=1){return;}const C=camera.position;
  if(!IMIST.L){IMIST.L=[];const r=mulberry32(SEED*13+5),tex=introPuffTex(1),a4=intro.a0+4*.11,hx=px+Math.cos(a4)*80,hz=pz+Math.sin(a4)*80,
      dx=hx-_iP.x,dz=hz-_iP.z,dl=Math.hypot(dx,dz)||1,sd=r()<.5?1:-1,wx=-dz/dl*sd,wz=dx/dl*sd;IMIST.w=[wx,wz];   // tuulen suunta: kohtisuoraan syöksyn reittiä vasten
    for(const h of MIST_LAYERS){let u=0,tc=4+INTRO_DIVE;for(let j=1;j<=60;j++){const q=introEase(j/60);if(lerp(175,_iP.y,q)-py<=h){u=q;tc=4+j/60*INTRO_DIVE;break;}}   // tc = hetki, jolloin kamera ohittaa kerroksen
      const ox=lerp(hx,_iP.x,u),oz=lerp(hz,_iP.z,u);
      for(let i=0;i<MIST_N;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false,opacity:0}));m.renderOrder=6;const a=r()*TAU,d=Math.sqrt(r())*28,sz=26+r()*30;
        const tx=ox+Math.cos(a)*d,tz=oz+Math.sin(a)*d,vd=MIST_VD[0]+r()*(MIST_VD[1]-MIST_VD[0]),A=(MIST_APP[0]+r()*(MIST_APP[1]-MIST_APP[0]))/MIST_TAU;
        m.userData={o:.2+r()*.1,tx,ty:py+h+(r()-.5)*5,tz,vd,A,tc:tc+(r()-.5)*.6,fd:r()*.6};m.scale.set(sz*1.6*MIST_LONG,sz,1);scene.add(m);IMIST.L.push(m);}}}
  const tn=.62+.38*lightK,[wx,wz]=IMIST.w,out=k>MIST_OUT_K?clamp(1-(k-MIST_OUT_K)/(1-MIST_OUT_K),0,1):1;
  for(const m of IMIST.L){const U=m.userData,f=q=>U.vd*q+U.A*MIST_TAU*(1-Math.exp(-q/MIST_TAU)),s0=f(t)-f(U.tc);   // ei pysähdy: nopeus vd + A·e^(−t/τ) > 0 koko ajan, kohdalla (s0 = 0) kun kamera ohittaa
    m.position.set(U.tx+wx*s0,U.ty,U.tz+wz*s0);
    const d=m.position.distanceTo(C),near=clamp((d-12)/30,0,1),far=clamp(1-(d-150)/90,0,1),fin=sstep(0,1,(t-U.fd)/MIST_FADE);
    m.material.opacity=U.o*near*far*fin*out;m.material.color.setRGB(tn*.92,tn*.92,tn*.95);}}
function introMistClear(){if(!IMIST.L)return;for(const m of IMIST.L){scene.remove(m);m.material.dispose();}IMIST.L=null;}
function introHiQ(){const pi=presetIdx();return pi<0?(SET.shadow==='high'&&(+SET.lights||6)>=6):pi>=3;}
/* v3.10 käyttäjä: MAAILMA VALMIIKSI LATAUSRUUDUSSA (vanha tapa: SET.oldLoad, Asetukset › Ohjaus › Ammattilaisille). Latausruudun lopussa ldPrewarm:
   pelikamera + intron puoliväli piirretään kerran latausruudun takana ja kaikki varjostimet käännetään (renderer.compile) → lähimaailma (tarkat puut, ruoho, varjot,
   yhdistetyt kohteet, maaston LOD) on valmiina eikä lataudu näkyvästi intron aikana. Intron yläkamerassa kevyt tila (introLight): puiden LOD lasketaan 3D-etäisyydestä
   (korkealta kaikki kaukomalleina), ruohoa ei piirretä yli INTRO_GRASS_H m korkeudelta; laatu nousee asetusten mukaiseksi laskeutuessa. Kesto mitataan (LD_PREWARM.ms). */
const INTRO_GRASS_H=30,LD_PREWARM={ms:0,n:0};
function introLight(){return state==='intro'&&!SET.oldLoad;}
function introGrassVis(on){for(const g of [typeof grassIM!=='undefined'?grassIM:null,typeof tallIM!=='undefined'?tallIM:null,...(typeof weedIMs!=='undefined'?weedIMs:[])])if(g&&g.visible!==on)g.visible=on;}
/* v3.25 käyttäjä (nykäys ilmakuvassa): intron usvapallot luodaan vasta intron alkaessa ja sammuneen tulen savu vasta pelissä → niiden sprite-varjostin ja tekstuurit
   käännettiin/ladattiin kesken intron tai pelin. Nyt esilatauksessa piirretään kerran näkymätön sprite kummallakin tekstuurilla (sumu päällä/pois). */
function ldWarmSprites(){const W=[],fw=camera.getWorldDirection(new V3());
  for(const [tex,fog] of [[typeof introPuffTex==='function'?introPuffTex(1):null,false],[typeof smkTexGet==='function'?smkTexGet():null,true]]){if(!tex)continue;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog,opacity:.002}));sp.position.copy(camera.position).addScaledVector(fw,6);scene.add(sp);W.push(sp);}
  return W;}
function ldPrewarm(){if(SET.oldLoad)return 0;const t0=performance.now();
  try{const dsc=intro&&intro.dsc,it=intro&&intro.t;
    update(1/60);statT=0;updateChunkVis();if(typeof terrLodTick==='function')terrLodTick();if(typeof shpTick==='function')shpTick();   // pelikamera (update laski sen) ja normaali sumu
    introGrassVis(true);sun.shadow.needsUpdate=true;const W=ldWarmSprites();renderer.compile(scene,camera);renderer.render(scene,camera);for(const sp of W){scene.remove(sp);sp.material.dispose();}
    if(intro){intro.dsc=1;intro.t=4+INTRO_DIVE*.45;introCam(0);updateChunkVis();renderer.render(scene,camera);intro.t=it||0;intro.dsc=dsc;introCam(0);}   // intron puoliväli, sitten takaisin yläkameraan
    LD_PREWARM.n++;}catch(e){console.warn('ldPrewarm',e);}
  return LD_PREWARM.ms=Math.round(performance.now()-t0);}
function worldLoad(build){if(window.__ldShow)window.__ldShow('Saari nousee merestä…');if(window.__ldSet)window.__ldSet(.08);
  introVeil(true);
  setTimeout(()=>{if(window.__ldSet)window.__ldSet(.45);build();let n=0;const tick=()=>{if(window.__ldSet)window.__ldSet(.45+n/24*.55);if(++n<24)requestAnimationFrame(tick);else{ldPrewarm();introReady();}};requestAnimationFrame(tick);},90);}
function introReady(){window.__ldAfter=introRelease;if(window.__ldDone)window.__ldDone();else introRelease();}
function introRelease(){if(typeof keysClear==='function')keysClear();if(!intro){introVeil(false);return;}intro.hold=false;intro.t=0;introSndStart();const el=$('#introT');if(el){el.classList.remove('out');void el.offsetWidth;el.classList.add('on');}
  if(SET.intro2d)introVeil(false);else{introVeil(false,true);introCloudsMake();}}   /* v3.13 asetus Käytä 2D-pilviä; käyttäjä: sivuille vetäytyvät 3D-pilvet kaikilla esiasetuksilla (ennen vain Medium+, muilla CSS-verho) */
// CSS-pilviverho (alle Medium). v1.62: kolme kerrosta kummallakin puolella (taka/keski/etu), maalattu kerran canvasiin pehmeistä
// varjostetuista pilvipalloista (alta sinertävä varjo, päältä valo), sävy vuorokaudenajan mukaan (lightK). Aukeaminen: kerrokset liukuvat
// sivuille eri nopeuksilla ja kasvavat (lento pilvien läpi), keskeltä hehkuu valo. Vain transform/opacity → sulava heikollakin koneella.
function veilCloud(side,layer,tint){const w=420,h=520,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),R=Math.random;
  const o=document.createElement('canvas');o.width=w;o.height=h;const q=o.getContext('2d'),dk=1-(2-layer)*.08,T=(v)=>Math.round(v*tint*dk);
  // kumpupilvi: läpinäkymättömät kummut, valo ylävasemmalta ja sinertävä varjo alla; ylhäältä alas piirretyt kummut peittävät
  // edellisten varjopuolen → kerroksellinen, pöyheä pinta. Sisäreuna aaltoilee (kaksi siniaaltoa + satunnaisuus) ja on kumpujen rosottama.
  const C=[],lim=w*(.98-layer*.13),ph=R()*6;
  for(let y=-50;y<h+50;y+=10+R()*16){const e=lim*(.66+.16*Math.sin(y*.011+ph)+.1*Math.sin(y*.029+ph*2.3)+(R()-.5)*.08),r=20+R()*(26+layer*10);
    C.push([e-r*.35,y,r]);if(R()<.5)C.push([e-r*.9,y+(R()-.5)*16,r*(.6+R()*.5)]);for(let x=e-r*1.3-R()*30;x>-90;x-=60+R()*70)C.push([x,y+(R()-.5)*40,45+R()*75]);}
  C.sort((p,k)=>p[1]-k[1]);
  for(const [x0,y,r] of C){const x=side<0?x0:w-x0,gr=q.createRadialGradient(x-r*.28*side*-1,y-r*.45,r*.08,x,y,r*1.02);
    gr.addColorStop(0,`rgb(${T(255)},${T(253)},${T(250)})`);gr.addColorStop(.5,`rgb(${T(236)},${T(241)},${T(248)})`);gr.addColorStop(.86,`rgb(${T(206)},${T(215)},${T(230)})`);gr.addColorStop(1,`rgba(${T(170)},${T(182)},${T(204)},0)`);
    q.fillStyle=gr;q.beginPath();q.arc(x,y,r,0,6.2832);q.fill();}
  // utu sisäosan päälle: suuret läpikuultavat vaaleat läiskät häivyttävät toistuvan kumpukuvion
  for(let i=0;i<14;i++){const yy=R()*h,rr=60+R()*90,xx0=lim*(.1+R()*.45),xx=side<0?xx0:w-xx0,hz=q.createRadialGradient(xx,yy,0,xx,yy,rr);hz.addColorStop(0,`rgba(${T(246)},${T(248)},${T(252)},.55)`);hz.addColorStop(1,`rgba(${T(246)},${T(248)},${T(252)},0)`);q.fillStyle=hz;q.fillRect(xx-rr,yy-rr,rr*2,rr*2);}
  g.filter='blur(3.5px)';g.drawImage(o,0,0);g.filter='none';
  c.className=(side<0?'cL':'cR')+' l'+layer;return c;}
function introVeil(on,instant){let v=$('#cloudVeil');if(on){if(!v){v=document.createElement('div');v.id='cloudVeil';const t=.5+.5*clamp(typeof lightK==='number'?lightK:1,0,1);
    const bg=document.createElement('i');bg.className='cvBg';bg.style.filter=`brightness(${t.toFixed(2)})`;v.appendChild(bg);const sun=document.createElement('i');sun.className='cvSun';v.appendChild(sun);
    for(let l=0;l<3;l++)for(const sd of [-1,1])v.appendChild(veilCloud(sd,l,t));document.body.appendChild(v);}v.className='';return;}
  if(!v)return;if(instant){v.remove();return;}void v.offsetWidth;v.className='open';setTimeout(()=>{if(v.parentNode)v.remove();},3000);}
// 3D-lisäpilvet: sprite-ryppäät kameran edessä, vasen puoli liukuu vasemmalle ja oikea oikealle 2 s:ssa, häipyen
let IC=null;
/* v3.10–v3.12 käyttäjä: INTRON PIIRTORAJAN PEITTO matalilla esiasetuksilla. Ylhäältä näkyi terävä raja, johon puut ja muut kohteet loppuvat
   (piirtoetäisyys VIS_R.tree × RDK). Voimakkuus introEdgeK: Low–Medium- täysi, Medium ~0,8, Medium+ ~0,5, High ~0,2, High+/Ultra 0.
   v3.12 (käyttäjä: vaalea läpinäkyvä matto kauhea): rajan päällä OIKEAT PILVET – peittävät pilvipallot (sprite, 4 satunnaista tekstuuria, varjostettu pohja)
   IC_H m korkeudella pelaajan yllä, aukko saaren kohdalla. Aukon paikka ja koko lasketaan kameran kautta (projektio pilvitasolle), joten aukko osuu piirtorajaan
   vaikka kamera kiertää. Pilvet kiertävät ja aaltoilevat hitaasti, hajaantuvat ulospäin ja häipyvät syöksyssä. Maan tasolla vain kevyt usva (IE_FOG).
   Intron ajan puut rajataan pelaajan ympäriltä (introEdgeOn → updateChunkVis). */
const IE={g:null,P:[],R:0,t:0,s:1,cx:0,cz:0},IC_H=95,IE_FOG=.4,IE_N=330,IC_CLEAR_H=14;
function introEdgeK(){if(P.inDun||SET.introPlain)return 0;   /* v3.13 asetus: intron usva ja pilvikerrokset pois */const R=VIS_R.tree*RDK;return clamp((230-R)/120,0,1);}
function introEdgeOn(){return state==='intro'&&!!intro&&introEdgeK()>0;}   // updateChunkVis: puut rajataan pelaajan ympäriltä
function introEdge(px,py,pz,k){const ek=introEdgeK();if(ek<=0){introCarpet(0);return {n:260,f:700};}
  const h=Math.max(20,camera.position.y-py),R=VIS_R.tree*RDK,dP=Math.hypot(camera.position.x-px,camera.position.z-pz,h),
    n=Math.max(dP*1.05,Math.hypot(R*.9,h)),f=Math.max(dP+220,Math.hypot(R*1.8,h)+120);
  introCarpet(ek,px,py,pz,R,k);   /* v3.13 pilvet eivät häivy syöksyn alussa – kamera laskeutuu niiden läpi */const w=ek*IE_FOG;return {n:lerp(260,n,w),f:lerp(700,f,w)};}
function introPuffTex(i){const T=introPuffTex.T||(introPuffTex.T=[]);if(T[i])return T[i];const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=mulberry32(901+i*77);
  const n=10+(r()*8|0);for(let k=0;k<n;k++){const a=r()*TAU,d=r()*58,x=128+Math.cos(a)*d*1.25,y=140+Math.sin(a)*d*.55-r()*18,rad=34+r()*40,gr=g.createRadialGradient(x,y,0,x,y,rad);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.55,'rgba(250,251,253,.85)');gr.addColorStop(1,'rgba(245,247,250,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);}
  g.globalCompositeOperation='source-atop';const sh=g.createLinearGradient(0,60,0,220);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.55,'rgba(205,212,224,.35)');sh.addColorStop(1,'rgba(150,160,178,.6)');
  g.fillStyle=sh;g.fillRect(0,0,256,256);return T[i]=new THREE.CanvasTexture(c);}
function introCarpet(a,px,py,pz,R,k=0){const hc=camera.position.y-py,lo=IC_CLEAR_H;   /* v3.20 käyttäjä: pilvet pois vasta kun kamera on alhaalla */if(a<=.01||hc<lo){if(IE.g)IE.g.visible=false;return;}
  const Rr=Math.round(Math.max(R,85));if(IE.g&&IE.R!==Rr)introCarpetClear();
  if(!IE.g){IE.g=new THREE.Group();IE.P=[];IE.R=Rr;const r=mulberry32(SEED*31+7);
    const o1=r()*TAU,o2=r()*TAU;for(let i=0;i<IE_N;i++){const sz=55+r()*85,ang=r()*TAU,rr=Rr*.94+sz*.2+Math.pow(r(),1.7)*400;
      const gap=Math.sin(ang*3.3+o1)*Math.cos(rr*.017+ang*1.9+o2);if(rr>Rr*1.35+60&&gap>.42)continue;   /* v3.13 luonnolliset raot (ei aukon reunalla) */
      const m=new THREE.Sprite(new THREE.SpriteMaterial({map:introPuffTex(i%4),transparent:true,depthWrite:false,fog:false}));m.renderOrder=5;
      const reg=.5+.5*Math.sin(ang*2.1+o2)*Math.cos(rr*.011+o1),p={m,ang,rr,sz,y:r()*22,sh:Math.min(1,1-.1*reg-r()*.03),sp:(r()-.5)*.03,ph:r()*TAU};   /* v3.13 alueittain enintään 10 % tummempia */m.material.rotation=(r()-.5)*.3;IE.g.add(m);IE.P.push(p);}
    scene.add(IE.g);}
  IE.t+=1/60;IE.g.visible=true;const C=camera.position;if(hc>IC_H+30){IE.s=clamp(1-IC_H/hc,.12,1);IE.cx=C.x+(px-C.x)*IE.s;IE.cz=C.z+(pz-C.z)*IE.s;}   /* v3.13 alempana aukko pysyy paikallaan maailmassa (kamera menee läpi) */
  const s=IE.s,cx=IE.cx,cz=IE.cz,t=.62+.38*lightK,out=1+k*1.2,fa=a*.9*(hc<IC_H?sstep(0,1,(hc-lo)/(IC_H-30-lo)):1);   /* v3.13 peittävyys −10 %, häipyy vasta reilusti pilvikerroksen alla */
  for(const p of IE.P){const an=p.ang+IE.t*(.006+p.sp),rr=(p.rr+Math.sin(IE.t*.35+p.ph)*6)*out,x=cx+Math.cos(an)*rr*s,z=cz+Math.sin(an)*rr*s;
    p.m.position.set(x,py+IC_H+p.y,z);const b=1+.06*Math.sin(IE.t*.5+p.ph);p.m.scale.set(p.sz*s*1.5*b,p.sz*s*b,1);
    const edge=clamp((p.rr-Rr)/(p.sz*.55+18),0,1);p.m.material.opacity=fa*(.25+.75*edge);p.m.material.color.setRGB(t*p.sh,t*p.sh,t*p.sh*1.03);}}
function introCarpetClear(){if(!IE.g)return;scene.remove(IE.g);for(const p of IE.P)p.m.material.dispose();IE.g=null;IE.P=[];}
function introCloudTex(){if(introCloudTex.t)return introCloudTex.t;const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  for(let i=0;i<26;i++){const r=28+Math.random()*34,x=r+8+Math.random()*(240-2*r-16),y=r+30+Math.random()*(200-2*r-30),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.6,'rgba(245,248,255,.5)');gr.addColorStop(1,'rgba(240,244,250,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);}
  return introCloudTex.t=new THREE.CanvasTexture(c);}
function introCloudsMake(){introCloudsClear();const tex=introCloudTex(),L=[];const tint=.55+.45*lightK;
  for(let i=0;i<22;i++){const side=i%2?1:-1,m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false,fog:false,color:new THREE.Color(tint,tint,tint*1.02)}));
    m.renderOrder=999;const sc=5+Math.random()*4;m.scale.set(sc*1.5,sc,1);scene.add(m);L.push({m,side,lx:side*(.3+Math.random()*3.2),ly:(Math.random()-.5)*5,lz:-(5+Math.random()*4),sp:.7+Math.random()*.6});}
  IC={L,t:0};}
const _icV=new THREE.Vector3();
function introCloudsTick(dt){if(!IC)return;IC.t+=Math.min(dt,.05);const k=Math.min(1,IC.t/2.1),e=k*k*(3-2*k);camera.updateMatrixWorld(true);
  for(const c of IC.L){_icV.set(c.lx+c.side*e*14*c.sp,c.ly+e*.8,c.lz+e*1.5);camera.localToWorld(_icV);c.m.position.copy(_icV);c.m.material.opacity=1-Math.max(0,(k-.55)/.45);}
  if(k>=1)introCloudsClear();}
function introCloudsClear(){if(!IC)return;for(const c of IC.L){scene.remove(c.m);c.m.material.dispose();}IC=null;}
/* v3.20 käyttäjä: INTRON OHITUS. Näppäimet eivät koskaan ohita introa eivätkä liikuta hahmoa (latausruutu + intro); ensimmäistä introa (INTRO_SEEN_K puuttuu) ei voi ohittaa
   ollenkaan, myöhemmin vain hiiren napsautuksella (tai kosketuksella) INTRO_SKIP_MIN s alusta. Hahmo liikkuu vasta, kun kamera on paikallaan (endIntro → keysClear). */
const INTRO_SEEN_K='hiidenmaa_introSeen',INTRO_SKIP_MIN=.6;
function introSeen(){let ok=true;try{ok=localStorage.getItem(INTRO_SEEN_K)==='1'||slotMeta().some((w,i)=>w&&i!==curSlot);}catch(e){}return ok;}   // aiemmat maailmat = ei ensimmäinen intro
function introCanSkip(){return introSeen()&&!!intro&&!intro.hold&&intro.t>=INTRO_SKIP_MIN;}
addEventListener('keydown',e=>{if(state==='intro'){e.stopPropagation();e.preventDefault();}},true);
addEventListener('mousedown',e=>{if(state==='intro'){e.stopPropagation();e.preventDefault();if(introCanSkip())endIntro();}},true);
addEventListener('touchstart',()=>{if(state==='intro'&&introCanSkip())endIntro();},{capture:true,passive:true});
/* v1.43/v1.60: suorituskykytesti tehdään ennen pelin latausta (js/boot.js, oma kevyt 3D-näkymä). Tulos on localStorage hiidenmaa_perf;
   pend:1 = esiasetusta ei ole vielä otettu käyttöön → otetaan tässä (perfApply) ja merkitään tehdyksi. */
function perfApply(){try{const r=JSON.parse(localStorage.getItem('hiidenmaa_perf')||'null');if(!r||!r.pend)return;if(SET.noAuto){r.pend=0;localStorage.setItem('hiidenmaa_perf',JSON.stringify(r));return;}   /* v2.65 noAuto: testin esiasetusta ei oteta käyttöön */applyPreset(clamp(r.idx|0,0,7));r.pend=0;localStorage.setItem('hiidenmaa_perf',JSON.stringify(r));}catch(e){}}
/* ---------------- MAIN LOOP ---------------- */
let last=performance.now(),slowT=0,saveT=0,lightT=0,menuA=0;
function update(dt){
  if(typeof TUT!=='undefined'&&TUT.hold){tutHoldUpdate(dt);return;}   // v2.71 opastus: peli seis omalla tilallaan (ei DEV freeze)
  // v1.92 DEV: freeze = maailma seis (vain pelaaja, kamera ja käyttöliittymä päivittyvät), lockTW = kello ja sää pysyvät
  const fz=devOn('freeze'),lkT=fz||devOn('lockTW');
  const td=dt*timeSpd();   // v2.93 pelin ajan nopeus
  playTime+=dt;if(!lkT){dayT+=td/DAY_LEN;if(dayT>=1){dayT-=1;dayN++;msg(`Päivä ${dayN}`);}}
  const wasNight=isNight();
  updatePlayer(dt);updateEffects(dt);updateDungeons(dt);updateStory(dt);
  if(!fz){updateMobs(dt);creTick(dt);updateProjs(dt);updateDrops(dt);updateFx(dt);updateStations(td);doorTick(dt);spawner(dt);survival(td);resinTick(dt,td);fishTick(dt);tkTick(dt);}   /* v3.06 onkiminen (fish.js) */
  if(!lkT){if(td>dt)weather.until-=td-dt;updateWeather();}else weather.until=Math.max(weather.until,playTime+1);
  updateEnvironment(dt);updateCamera(dt);updateBenchRings();updateChunkVis();updateGrass();
  if(state==='play'){lookTarget=findInteract();updateGhost();}else if(ghost)ghost.visible=false;
  lightT-=dt;if(lightT<=0){lightT=.4;updateLights();}
  slowT-=dt;if(slowT<=0){slowT=1;exploreTick();updateGoals();pickFarTick(1);mobRespawnTick();   /* v3.00 */farmSync();   /* v3.06 taimet ja pellot (uusiutuminen: nukkuessa, pickFarTick) */}
  saveT+=dt;if(saveT>120){saveT=0;saveGame(true);}   // v1.35 (kohta 21): automaattitallennus 2 min välein
  updateZone(dt);updateHUD(dt);if(DEV)devLiveTick(dt);   // v2.96 DEV-valikon elävät arvot
}
/* v1.15 (lista 2, kohta 6): valikon taustakamera näyttää satunnaisia kohteita lähikuvina: luontokohteet (biomit, järvi), hylätty
   leiri päivällä ja yöllä (nuotio palaa) ja eläimiä (kamera seuraa). 20 s per kohde, hidas 30° kierto ja hieman laskeutuen, vaihto
   mustan kautta (#menuFade 0,8 s). Ensimmäinen kohde arvotaan joka latauksella. Pelin aikana (Esc) tausta on pelaajan oma paikka. */
/* menuShot ym. esitelty tiedoston alussa (KORJAUKSET 22) */
function buildMenuSpots(){const S=[],r=Math.random,used=new Set(),want=['koivu','forest','suo','kangas','aarni','tunturi','rakka','beach','meadow','mountain'];
  for(let t=0;t<8000&&used.size<want.length;t++){const x=(r()-.5)*HALF*1.7,z=(r()-.5)*HALF*1.7,h=terrainH(x,z),b=biomeAt(x,z,h);if(h<.6||!want.includes(b)||used.has(b))continue;
    if(Math.abs(terrainH(x+3,z)-h)>1.5||Math.abs(terrainH(x,z+3)-h)>1.5)continue;used.add(b);S.push({k:'nature',x,z,b});}
  for(const [lx,lz,lr] of (MAP.lakes||[]).slice(0,2)){const cx=lx*WS,cz=lz*WS;for(let t=0;t<40;t++){const a=r()*TAU,d=lr*WS*(.9+t*.03),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(terrainH(x,z)>.8){S.push({k:'lake',x,z,lx:cx,lz:cz});break;}}}
  for(const c of CAMPS)S.push({k:'camp',x:c.x,z:c.z,c,night:false},{k:'camp',x:c.x,z:c.z,c,night:true});
  const land=S.filter(s=>s.k==='nature'&&s.b!=='beach'&&s.b!=='mountain');
  for(const t of ['peura','poro','karhu','kettu','hirvi','janis'])if(land.length&&MOBDEF[t]){const s=land[(r()*land.length)|0];S.push({k:'animal',x:s.x,z:s.z,t});}
  return S;}
function menuClear(){for(const o of menuDeco)scene.remove(o);menuDeco=[];if(menuMob){mobRemove(menuMob);menuMob=null;}
  if(menuLight){const i=lightSources.indexOf(menuLight);if(i>=0)lightSources.splice(i,1);menuLight=null;}}
function newMenuShot(){menuClear();if(!menuSpots)menuSpots=buildMenuSpots();if(!menuSpots.length)return;
  let s;for(let i=0;i<6;i++){s=menuSpots[(Math.random()*menuSpots.length)|0];if(!menuShot||s!==menuShot.s)break;}
  const an=s.k==='animal';menuShot={s,t:0,a0:Math.random()*TAU,dist:an?5+Math.random()*1.5:8+Math.random()*4,hgt:an?1.4+Math.random()*.6:2+Math.random()*1.6};
  dayT=s.k==='camp'?(s.night?.9:.47):[.3,.42,.52,.66][(Math.random()*4)|0];weather.cur='selkea';
  if(s.k==='camp'){const c=s.c,a=c.rot*Math.PI/4,fw=(d,q)=>[c.x+Math.sin(a)*d+Math.cos(a)*q,c.z+Math.cos(a)*d-Math.sin(a)*q];
    if(!pieces.some(p=>dist2(p.x,p.z,c.x,c.z)<49)){const [tx,tz]=fw(-3.2,0);
      for(const [t,x,z,rot] of [['teltta',tx,tz,c.rot],['nuotio',c.x,c.z,0]]){const m=buildPieceMesh(t);m.position.set(x,terrainH(x,z),z);m.rotation.y=rot*Math.PI/4;scene.add(m);menuDeco.push(m);
        if(m.userData.flame)for(const f of m.userData.flame)f.visible=s.night;}}
    if(s.night){menuLight={x:c.x,y:terrainH(c.x,c.z)+.9,z:c.z,c:0xff8a3a,i:2.4,on:()=>true};lightSources.push(menuLight);}}
  if(s.k==='animal'){menuMob=spawnMob(s.t,s.x,s.z,{noBorn:1});if(menuMob){menuMob.yaw=Math.random()*TAU;menuMob.menu=true;}}
  P.pos.set(s.x,terrainH(s.x,s.z),s.z);updateLights();}
function menuCam(dt){if(!started)fig.g.visible=false;
  if(!menuShot)newMenuShot();if(!menuShot){updateEnvironment(dt);return;}
  const sh=menuShot,s=sh.s;sh.t+=dt;const fade=$('#menuFade');
  if(sh.t>MENU_SHOT_T-.85&&!menuFading){menuFading=true;if(fade)fade.style.opacity=1;}
  if(sh.t>MENU_SHOT_T){newMenuShot();menuFading=false;if(fade)setTimeout(()=>{fade.style.opacity=0;},60);}
  let tx=s.x,tz=s.z;const m=menuMob;
  if(m&&!m.dead){m.yaw+=Math.sin(sh.t*.35+sh.a0)*.25*dt;moveMob(m,Math.sin(m.yaw),Math.cos(m.yaw),(m.def.walk||1.5)*.8,dt);animMob(m,dt);tx=m.pos.x;tz=m.pos.z;}
  const k=Math.min(1,sh.t/MENU_SHOT_T),ty=terrainH(tx,tz);
  if(s.k==='lake'){const a=Math.atan2(s.z-s.lz,s.x-s.lx),cx=s.x+Math.cos(a)*4,cz=s.z+Math.sin(a)*4;camera.position.set(cx,Math.max(terrainH(cx,cz),0)+3.5-k,cz);
    const pa=a+Math.PI+(k-.5)*.5;camera.lookAt(s.x+Math.cos(pa)*40,1.2,s.z+Math.sin(pa)*40);}
  else{const ang=sh.a0+k*Math.PI/6,d=sh.dist*(1-.12*k),cx=tx+Math.cos(ang)*d,cz=tz+Math.sin(ang)*d;
    camera.position.set(cx,Math.max(terrainH(cx,cz)+1.2,ty+sh.hgt*(1-.25*k)),cz);
    /* kohde kuvan oikealle puolelle (valikon tekstit ovat vasemmalla): katsepistettä siirretään kameran vasemmalle 30 % etäisyydestä */
    const fx=tx-cx,fz=tz-cz,fl=Math.hypot(fx,fz)||1,off=d*.3;camera.lookAt(tx+fz/fl*off,ty+(s.k==='animal'?.7:1.1),tz-fx/fl*off);}
  P.pos.set(tx,ty,tz);updateEnvironment(dt);if(typeof updateChunkVis==='function')updateChunkVis();
  if(menuLight){const l=LIGHTS.find(l=>l.position.x===menuLight.x&&l.position.z===menuLight.z);if(l)l.intensity=menuLight.i*1.15*(.85+.1*Math.sin(playTime*13+sh.t*7)+.05*Math.sin(sh.t*31));}}
// Mukautuva laatu: liukuva keskiarvo kehysajasta; >36 ms 3 s → laatu −1 taso, <18 ms 12 s → +1 taso (min 6 s välein).
let fAvg=.016,qBadT=0,qGoodT=0,qCool=0;
function autoQuality(raw){if(raw>.5)return;fAvg+=(raw-fAvg)*.05;qCool-=raw;
  if(fAvg>.036){qBadT+=raw;qGoodT=0;}else if(fAvg<.018){qGoodT+=raw;qBadT=0;}else{qBadT=Math.max(0,qBadT-raw);qGoodT=Math.max(0,qGoodT-raw);}
  /* v1.12: osa-alueet laskevat järjestyksessä varjot → hiukkaset/usva/ruoho → resoluutio → piirtoetäisyys (vain päällä olevat),
     ja palautuvat käänteisessä järjestyksessä. Yksi askel kerrallaan, vähintään 6 s välein. */
  if(qCool<=0){const C=[['q',()=>QUAL.lvl,QUAL.max],['fx',()=>AUTO.fx,2],['res',()=>AUTO.res,3],['dist',()=>AUTO.dist,2]].filter(c=>autoOn(c[0]));
    const step=(k,d)=>{if(k==='q')setQuality(QUAL.lvl+d);else{AUTO[k]+=d;applyGfx();}qCool=6;};
    if(qBadT>3){const c=C.find(c=>c[1]()<c[2]);if(c){step(c[0],1);qBadT=0;}}
    else if(qGoodT>12){const c=[...C].reverse().find(c=>c[1]()>0);if(c){step(c[0],-1);qGoodT=0;}}}}
// v1.12 FPS-näyttö (asetus fps): päivittyy 2 kertaa sekunnissa, väri sujuvuuden mukaan
let fpsN=0,fpsT=0;
/* v2.41 DEV-suorituskykymittari (Ä › Suorituskykymittari): piirtokutsut ja kolmiot (myös varjot), ruudun aika, varjomallit, yhdistetyt rakennukset */
let perfEl=null,perfT=0,perfN=0,perfMs=0,perfMax=0;
function perfTick(raw){if(!devOn('perf')){if(perfEl){perfEl.remove();perfEl=null;}return;}
  if(!perfEl){perfEl=document.createElement('div');perfEl.id='devPerf';perfEl.style.cssText='position:fixed;left:8px;top:8px;z-index:9000;font:12px/1.35 monospace;color:#d8f0c8;background:rgba(0,0,0,.55);padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre';document.body.appendChild(perfEl);}
  perfN++;perfMs+=raw*1000;perfMax=Math.max(perfMax,raw*1000);perfT+=raw;if(perfT<.5)return;const i=renderer.info;
  perfEl.textContent=`ruutu ${(perfMs/perfN).toFixed(1)} ms (max ${perfMax.toFixed(0)}) · ${Math.round(perfN/perfT)} FPS\npiirtokutsut ${i.render.calls} · kolmiot ${(i.render.triangles/1000).toFixed(0)}k\ngeometriat ${i.memory.geometries} · tekstuurit ${i.memory.textures}\nvarjomallit ${typeof SHP!=='undefined'?SHP.n+' (+'+SHP.nf+' tuli, '+SHP.occ+' piilossa)':'-'}\nyhdistetyt rakennussolut ${typeof BMC!=='undefined'?BMC.size:'-'}\nolentoäänet ${CRE.voices.length} · pois jääneet ${CRE.skip}`;   // v2.60 päällekkäisyysraja
  perfT=0;perfN=0;perfMs=0;perfMax=0;}
function updateFps(raw){if(SET.fps==='off')return;fpsN++;fpsT+=raw;if(fpsT<.5)return;const f=Math.round(fpsN/fpsT),el=$('#fps');fpsN=0;fpsT=0;
  if(el){el.textContent=f+' FPS';el.style.color=f>=50?'#8fd8a0':f>=30?'#e8c45a':'#e0614f';}}
const MENU_EL=$('#menu');
/* v2.93 DEV MAAILMAN NOPEUS (Ä-valikko): koko peli (liike, olennot, aika, sää, nälkä, tulet, pihka…) ajetaan DEVF.spd-kertaisena. Nopeutettuna
   päivitys jaetaan enintään WSPD_STEP s askeliin (fysiikka pysyy vakaana), enintään WSPD_MAX askelta ruudussa (heikolla koneella 30× voi jäädä vajaaksi). */
const WSPD=[.5,1,2,4,16,30],WSPD_STEP=.05,WSPD_MAX=14;
function worldSpd(){return DEV&&DEVF.spd>0?DEVF.spd:1;}
/* v2.93 DEV PELIN AJAN NOPEUS (yksinkertaisempi): vain kello ja siihen sidottu – vuorokausi, sään vaihtuminen, nälkä ja tehosteet (survival),
   tulet, soihdut, ruoan kypsyminen ja sulatus (updateStations), käsisoihdun polttoaine ja pihkan kertyminen. Liike, olennot ja animaatiot normaalisti. */
function timeSpd(){return DEV&&DEVF.tspd>0?DEVF.tspd:1;}
/* v3.18 käyttäjä: PELATTU AIKA YHTEENSÄ (kaikki maailmat, selainkohtainen localStorage PT_KEY). Laskee oikeaa aikaa, kun peli on käynnissä (pelissä, paneelit auki,
   intro, kuolinruutu); EI tauolla (myöskään Käynnissä-tilassa), päävalikossa tai kun välilehti on piilossa. Alkaa ensimmäisestä pelistä (PT.first). Ensimmäisellä kerralla
   mukaan lasketaan jo tallennettujen maailmojen peliaika (PT.seed). Näkyy Asetukset › Profiilit alimpana tuntien tarkkuudella yhdellä desimaalilla. Tallennus 10 s välein + sulkiessa. */
const PT_KEY='hiidenmaa_playtotal',PT_STATES=['play','ui','intro','dead','win'],PT={s:0,first:0,seed:0,ld:0,saveT:0};
function ptLoad(){if(PT.ld)return;PT.ld=1;let o=null;try{o=JSON.parse(localStorage.getItem(PT_KEY)||'null');}catch(e){}
  if(o){PT.s=+o.s||0;PT.first=+o.first||0;PT.seed=+o.seed||0;return;}
  try{let s=0;for(let i=0;i<SLOTS;i++){const d=JSON.parse(localStorage.getItem(slotKey(i))||'null');if(d&&d.playTime>0)s+=d.playTime;}if(s>0){PT.s=s;PT.seed=Math.round(s);}}catch(e){}}
function ptSave(){if(!PT.ld)return;try{localStorage.setItem(PT_KEY,JSON.stringify({s:Math.round(PT.s),first:PT.first,seed:PT.seed}));}catch(e){}}
function ptTick(raw){ptLoad();if(!started||!PT_STATES.includes(state)||document.hidden)return;if(!PT.first)PT.first=Date.now();PT.s+=Math.min(raw,1);PT.saveT+=raw;if(PT.saveT>=10){PT.saveT=0;ptSave();}}
const ptHours=()=>(Math.floor(PT.s/360)/10).toFixed(1).replace('.',',');
function ptHTML(){ptLoad();const d=PT.first?new Date(PT.first).toLocaleDateString('fi-FI'):null;return `<div class="ptBox"><span>Pelattu yhteensä</span><b>${ptHours()} h</b>
  <small class="note">${d?'Ensimmäinen peli '+d+'. ':'Aika alkaa ensimmäisestä pelistä. '}Laskee, kun peli on käynnissä – tauolla ja päävalikossa ajastin on pysähdyksissä.${PT.seed?' Sisältää aiemmin tallennettujen maailmojen peliajan.':''}</small></div>`;}
addEventListener('beforeunload',ptSave);document.addEventListener('visibilitychange',()=>{if(document.hidden)ptSave();});
/* v3.22 käyttäjä: grafiikkataso ei saa muuttaa ajoitusta. Ennen dt rajattiin 0,05 s:iin → alle 20 FPS:llä peliaika (iskut, kestävyys, paluut) hidastui.
   Nyt ruutu saa olla 0,1 s asti ja se ajetaan enintään 0,05 s:n osa-askelina (fysiikka pysyy vakaana), joten tahti on sama kaikilla tasoilla. */
const WSTEP_MAX=.1;
function worldStep(dt){const k=worldSpd();if(k===1){const n=Math.max(1,Math.ceil(dt/WSPD_STEP-1e-6));for(let i=0;i<n;i++)update(dt/n);return;}const tot=dt*k,n=Math.min(WSPD_MAX,Math.max(1,Math.ceil(tot/WSPD_STEP)));for(let i=0;i<n;i++)update(tot/n);}
/* v3.25 käyttäjä: virtuaaliosoitin oli raskailla asetuksilla hidas – se päivittyy vain, kun selain ehtii piirtää ruudun. Paneelin ollessa auki 3D-tausta piirretään
   enintään 30 kertaa sekunnissa (UI3D_GAP) ja osoitinta liikutettaessa enintään 15 (UI3D_GAP_MOVE, 0,2 s viimeisestä liikkeestä). Maailma päivittyy normaalisti. */
const UI3D_GAP=1000/30,UI3D_GAP_MOVE=1000/15,UI3D_MOVE_HOLD=200;let ui3dT=0;
function frame(now){
  requestAnimationFrame(frame);
  const raw=(now-last)/1000,dt=Math.min(.05,raw);last=now;let skip3d=false;seeThruSync();crossDeathSync();
  if(state==='play'&&SET.autoAll&&!SET.noAuto)autoQuality(raw);   /* v2.65 noAuto: ei mitään automaattista säätöä */updateFps(raw);ptTick(raw);if(DEV)perfTick(raw);musicTick();if(typeof gameSndTick==='function')gameSndTick();   /* v2.83 valikossa pelin äänet häipyvät */try{ambTick(raw);}catch(err){}   /* v2.61 sää ja tunnelma */
  try{
    if(state==='play'||state==='ui')worldStep(Math.min(WSTEP_MAX,raw));   // v2.93 DEV maailman nopeus
    if(typeof tutTick==='function')tutTick(dt);   // v2.71 opastus ja kertavinkit
    if(state==='dead')deathTick(dt);   // v2.73 kaatuminen, verilammikko ja kuolinkamera jatkuvat kuolinruudun takana
    else if(state==='menu'&&MENU_V2_OFF)menuCamOld(dt);
    else if(state==='menu'){uwOverlayOff();   /* v2.18: vedenalainen sävy ja hukkumisreunat eivät jää valikon päälle (KORJAUKSET 47: ei omaksi if-riviksi ketjun keskelle) */
      if(SET.menuBg==='3d'){mbgShow(false);menuCam(Math.min(.25,raw));}else{mbgFrame(now);skip3d=true;}}   // v1.25: kuvat = ei 3D-piirtoa valikossa   // v1.25: kuvat = ei 3D-piirtoa valikossa
    else if(state==='intro'){update(dt);introCam(dt);}
    else if(state==='paused'&&pauseRun)worldStep(dt);   // v1.43: Käynnissä-tila
    else if(state==='paused'){updateEnvironment(0);updateGrass();updateLights();if(typeof updateMist==='function')updateMist(0);}   // v1.35 (kohta 18): asetusmuutokset näkyvät heti myös tauolla
    else if(state==='dead'||state==='win'){updateMobs(dt*.5);updateEnvironment(dt);updateEffects(dt);}
  }catch(err){console.error(err);if(!frameErrShown&&window.__bootBox){frameErrShown=true;window.__bootBox('Virhe pelisilmukassa: '+(err&&err.message||err));}}   // v1.26 näkyviin
  // v1.38: piirtovirhe näkyy tarkkana (ennen try-lohkon ulkopuolella → selain näytti vain "Script error.", KORJAUKSET 28)
  /* v1.76: valikon partikkelit/animaatiot vain kun valikko näkyy (pelissä ei kuormaa). Valikon avautuessa partikkelikerros häivytetään
     esiin (.mfFade). Asetus "Älä pysäytä valikon animaatioita" (menuAnimKeep) pitää partikkelit käynnissä myös pelin aikana. */
  {const mv=!!(MENU_EL&&!MENU_EL.hidden);if(mv&&!menuVis&&!SET.menuAnimKeep){MENU_EL.classList.add('mfFade');MFX.last=now;requestAnimationFrame(()=>requestAnimationFrame(()=>MENU_EL.classList.remove('mfFade')));}
   menuVis=mv;if(mv||(SET.menuAnimKeep&&started)){try{mfxFrame(now);}catch(err){console.error(err);}}}
  if(state==='ui'&&typeof VC!=='undefined'&&VC.on){const mv=now-(VC.mvT||0)<UI3D_MOVE_HOLD;if(now-ui3dT<(mv?UI3D_GAP_MOVE:UI3D_GAP))skip3d=true;else ui3dT=now;}   // v1.76/v3.25: paneelin takana 3D harvemmin → osoitin sulava
  if(skip3d&&state!=='ui'&&RAYS.clr){RAYS.g.clearRect(0,0,RAYS.W,RAYS.H);RAYS.clr=false;}   // v2.35 valikon kuvissa ei vanhoja säteitä
  if(!skip3d){try{flameUpTick();}catch(err){}   // v2.43 liekit pystyyn ennen piirtoa
    RAYS.dt=dt;try{drawRays(dt);}catch(err){if(!RAYS.err){RAYS.err=1;console.error(err);}}try{renderer.render(scene,camera);try{raysPeek();}catch(e2){}}catch(err){console.error(err);if(!frameErrShown&&window.__bootBox){frameErrShown=true;window.__bootBox('Virhe piirrossa: '+(err&&err.message||err));}}}
}
updateLights();applyGfx();refreshKeyHints();
perfApply();if(window.__ldDone)window.__ldDone();   // v1.60: testi tehty jo ennen latausta (boot.js)
requestAnimationFrame(frame);
window.__game={renderer,keys,G,WH,get ghost(){return{sel:buildSel,ok:ghostOk,pos:ghostPos,why:lastInvalid}},placeBuild,openChest,scene,camera,P,get mobs(){return mobs},inv:()=>inv,pieces:()=>pieces,invAdd,addPiece,spawnMob,newGame,startPlay,flags:()=>flags,saveGame,serialize,loadData,setState:s=>state=s,get state(){return state},update,interact,togglePanel,useSlot,craft,RECIPE_BY,setBuildSel,enterDungeon,exitDungeon,camYaw:v=>camYaw=v,doMeleeHit,startAttack,nodes,setDay:v=>dayT=v};

/* v3.00 käyttäjä: Poistu pelistä (päävalikon alin nappi; v3.02 pidetään pohjassa 1 s, ks. QUIT_HOLD alla – ei enää kysymysikkunaa). Selain sallii window.close():n vain skriptin avaamille ikkunoille – muuten peli
   pysäytetään (äänet hiljaisiksi) ja näytetään lopetusruutu "voit sulkea välilehden" + Avaa peli uudelleen. */
const QUIT={saved:false};
/* v3.08 käyttäjä: X-ruksista poistuttaessa peli tallennetaan AINA juuri ennen sulkemista samoin kuin Tallenna nyt (myös kuolleena); tulos näkyy sulkuruudussa */
function quitGame(){let sv=null;if(started){try{sv=!!saveGame(true);if(sv)QUIT.saved=true;}catch(e){sv=false;}}try{if(window.__mus)window.__mus.stop();}catch(e){}try{if(window.__AC)window.__AC.suspend();}catch(e){}state='paused';
  try{window.close();}catch(e){}
  setTimeout(()=>{if(document.getElementById('quitScr'))return;const d=document.createElement('div');d.id='quitScr';
    d.innerHTML='<div class="qBox"><div class="qRunes" aria-hidden="true">ᚺᛁᛁᛞᛖᚾᛗᚨᚨ</div><h2>Peli on suljettu</h2>'+(sv===true?'<p class="qSaved">Peli tallennettiin ennen sulkemista ✓</p>':sv===false?'<p class="qSaved bad">Tallennus epäonnistui!</p>':'')+'<p>Voit nyt sulkea selaimen välilehden.</p><button class="btn pri" id="bReopen">Avaa peli uudelleen</button></div>';
    document.body.appendChild(d);document.getElementById('bReopen').onclick=()=>location.reload();},250);}
/* v3.02 käyttäjä: ei varmistusikkunaa – nappia pidetään pohjassa QUIT_HOLD (1 s); painalluksen alussa peli tallentuu heti (jos käynnissä),
   napin taustalla etenee sivuttainen palkki (--qp), irrottaminen ennen aikaa peruu. */
const QUIT_HOLD=1;
(function(){const b=$('#bQuit');let t0=0,raf=0,saved=false;const stop=()=>{t0=0;cancelAnimationFrame(raf);b.style.setProperty('--qp','0');b.classList.remove('holding');};
  const step=()=>{if(!t0)return;const k=Math.min(1,(performance.now()-t0)/(QUIT_HOLD*1000));b.style.setProperty('--qp',k.toFixed(3));if(k>=1){stop();quitGame();return;}raf=requestAnimationFrame(step);};
  const start=e=>{if(e.button!=null&&e.button!==0)return;if(t0)return;e.preventDefault();t0=performance.now();b.classList.add('holding');
    if(started&&!P.dead&&!saved){saved=!!saveGame(true);if(saved){QUIT.saved=true;$('#saveMsg').textContent='Tallennettu – pidä pohjassa sulkeaksesi';}}raf=requestAnimationFrame(step);};
  b.addEventListener('pointerdown',start);b.addEventListener('mousedown',start);b.addEventListener('touchstart',start,{passive:false});
  for(const ev of ['pointerup','mouseup','mouseleave','pointerleave','touchend','touchcancel','blur'])b.addEventListener(ev,()=>{if(t0)stop();saved=false;});
  b.onclick=e=>e.preventDefault();})();
