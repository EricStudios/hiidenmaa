'use strict';
/* v3.02 käyttäjä: RAKENNUSVALIKON TIETOIKKUNA. Kun hiiri (myös virtuaalinen osoitin VC) on saman kortin päällä BINFO_DELAY (2 s), rakennusvalikon
   vasemmalle puolelle aukeaa kapea, valikon korkuinen ja hieman tummempi ikkuna (#binfo): pyörivä 3D-kuva osasta pienin animaatioin (kääntyy,
   keinuu, liekit lepattavat, hiilos hehkuu), nimi, hinta ja ominaisuudet lyhyesti. Toiminnan selostus on piilossa avattavassa kohdassa
   (Miten toimii? ▸), jotta se ei vie tilaa. Ikkuna pysyy auki, kun hiiri siirtyy siihen; sulkeutuu BINFO_HIDE s poistumisen jälkeen.
   3D-kuva: oma pieni WebGLRenderer (luodaan ensimmäisellä avauksella), piirretään vain ikkunan ollessa auki. */
/* v3.06 käyttäjä: aukeaa 1 s:ssa (BINFO_DELAY), luotettavasti: korttien hover delegoidaan #buildCards-säiliölle (mouseover kuplii, myös VC) → ajastin
   käynnistyy, vaikka kortit piirrettäisiin uudelleen hiiren alla. "Paina I" lukitsee ikkunan auki (BI.pin; I = repun varanäppäin vain muualla). */
const BINFO_DELAY=1,BINFO_HIDE=.35,BI={pin:false,hovT:null,cur:null,show:0,hide:0,r:null,sc:null,cam:null,obj:null,raf:0,t0:0,last:0};
const fireRows=t=>[['Ruokapaikat',t==='grilli'?`${FIRE_SLOTS.grilli} (2 tankoa)`:`${FIRE_SLOTS.nuotio} (kivien päällä)`],['Kypsyminen',t==='grilli'?'30 % nopeampi':'normaali'],['Palaa hiileksi',`${FIRE_BURN_K[t]}× kypsymisaika`],['Hiilos',`${EMBER_T/60} min, paistaa −20 %`]];
const PIECE_INFO={
  nuotio:{p:()=>[...fireRows('nuotio'),['Reseptit','lihakeitto, puuhiili']],d:'Lisää puuta, pihkaa tai hiiltä (E). Raaka liha paistuu kivien päällä – ota se ajoissa, muuten se palaa hiileksi. Kun polttoaine loppuu, tuli hiipuu 10 minuutiksi hiillokseksi: sillä voi vielä paistaa (−20 %), mutta reseptit eivät aukea. Sade sammuttaa katottoman tulen ja hiilloksen kolme kertaa nopeammin. Lähellä on lämmin ja olennot pelkäävät tulta.'},
  grilli:{p:()=>[...fireRows('grilli'),['Vain grillillä','metsästäjän varras, juhla-ateria']],d:'Kuin nuotio, mutta kuusi paikkaa kahdessa tangossa: ruoka kypsyy noin 30 % nopeammin ja palaa hiileksi vasta kolminkertaisessa ajassa. Grillin lähellä aukeavat metsästäjän varras ja juhla-ateria.'},
  patanuotio:{p:()=>[['Pata','asennetaan erikseen (keittopata, ahjo)'],['Sienet',`enintään ${POT_MAX} kerralla`],['Kansi pois',`${POT_K_OPEN}× grilliaika`],['Kansi päällä',`${POT_K_LID}× grilliaika, jatkuu ilman tulta −30 %`],['Pataruoat',RECIPES.filter(r=>r.st==='pata').length+' reseptiä']],d:'E avaa padan ikkunan: tila ja arvioitu aika, kansi, sienet, polttoaine ja reseptit. Padan lähellä valmistetut pataruoat menevät pataan kypsymään. Valmis ruoka ei pala koskaan, mutta ilman kantta se pilaantuu vuorokaudessa: ruoka hiiltyy ja pata on irrotettava ja sulatettava sulatusuunissa. Kun ruoka on valmis, padasta nousee höyryä. Pataruoat täyttävät eniten ja antavat Kylläinen-tilan.'},
  sulatin:{p:()=>[['Jono','5 paikkaa, sulatetaan järjestyksessä'],['Sulattaa','kupari 7 s, rauta 10 s, 2 hiekkaa → lasi 15 s, pilaantunut pata → 2 rautaa + 1 kupari'],['Polttoaine',`puu ${SM_PUU_S} s, hiili ${SM_HIILI_S} s (enintään ${SM_FUEL_MAX/60} min)`],['Lämpö',`kuuma ${SM_HEAT_T} s, jäähtyy ${SM_COOL_T/60} min`]],d:'E avaa uunin valikon: lisää polttoainetta, odota sulatuslämpöä ja laita malmit jonoon. Mittarit näyttävät lämpötilan, polttoaineen, edistymisen ja arvion. Aineita voi lisätä vasta kuumaan uuniin.'},
  ahjo:{p:()=>[['Valmistaa','aseet, haarniskat, kilvet, keittopata']],d:'Ahjon lähellä repun valmistusvalikkoon aukeavat kupari- ja rautavarusteet.'},
  tyopenkki:{p:()=>[['Rakennusalue','20 m säde'],['Valmistaa','työkalut, jousi, nuolet, kulho']],d:'Työpenkin 20 metrin säteellä voi rakentaa. Lähellä aukeavat työpenkin reseptit.'},
  vedenkeraaja:{p:()=>[['Täyttyy','sateella 10 %/min (taivasalla)'],['Täynnä','20 vesikulhollista']],d:'Iso kuparisaavi ulos taivasalle. Sateella se täyttyy hiljalleen; tyhjä kulho kädessä E täyttää kulhon. Purettaessa vesi menetetään.'},
  sanky:{p:()=>[['Toiminto','nukkuminen, herätyspaikka']],d:'Yöllä E nukkuu aamuun (katon alla). Sänky asettaa herätyspaikan.'},
};
const CAT_DESC={seinat:'Seinät ja lattiat kohdistuvat ruudukkoon (G vaihtaa kohdistusta, R kääntää). Olentojen iskut kuluttavat kestävyyttä – korjaa vasaralla.',katot:'Katto pitää sateen ja lumen pois: katon alla voi levätä ja tuli palaa sateessakin.',palkit:'Palkit ja pylväät kantavat ja yhdistävät rakenteita.',portaat:'Portaat ja tikkaat nostavat ylempiin kerroksiin. Tikkaat: pidä W.',kalusto:'Kalusteet tekevät kodista kodin.',tyopisteet:'Työpiste avaa uusia reseptejä lähellään.',valo:'Valot palavat polttoaineella (E lisää) ja valaisevat ympäristön.',puolustus:'Puolustusrakenteet pitävät olennot loitolla.',kivi:'Kivirakenteet kestävät paljon enemmän kuin puiset.',kivikatot:'Kivikatot kestävät tulta ja iskuja.'};
function binfoRows(t){const d=PIECES[t],X=PIECE_INFO[t],o=[['Kestävyys',`${d.hp} HP`]];if(d.lvl)o.push(['Taso',String(d.lvl)]);
  o.push(['Työpenkki',d.noBench?'ei tarvita':'20 m säteellä']);if(X)o.push(...X.p());
  if(d.store)o.push(['Paikkoja',`${d.store} (+8 / laajennus)`]);if(d.roof)o.push(['Suoja','sade ja lumi']);if(d.mobProof)o.push(['Olennot','eivät pääse läpi']);
  if(bt(t)==='ovi')o.push(['Ovi','E avaa ja sulkee']);if(d.glass)o.push(['Lasi','rikkoutuu iskusta']);if(isTorch(t))o.push(['Valo','palaa polttoaineella (E)']);if(d.poses)o.push(['Asennot',`${d.poses} (Shift+R)`]);return o;}
function binfoEl(){let el=document.getElementById('binfo');if(el)return el;el=document.createElement('div');el.id='binfo';el.hidden=true;
  el.innerHTML='<div class="biPic"><canvas id="biCan" width="220" height="150"></canvas></div><h3 id="biName"></h3><div id="biCost" class="rq"></div><table class="props" id="biRows"></table><details id="biMore"><summary>Miten toimii?</summary><p id="biDesc"></p></details><div id="biPin" class="biPin">Paina I – pidä auki ja lue</div>';
  el.addEventListener('mouseenter',()=>{clearTimeout(BI.hide);});el.addEventListener('mouseleave',()=>binfoHideSoon());document.body.appendChild(el);return el;}
function binfoBind(card,t){}   // v3.06 delegoitu (binfoHover)
function binfoHover(t){clearTimeout(BI.hide);if(t===BI.hovT)return;BI.hovT=t;clearTimeout(BI.show);if(!t){if(!BI.pin)binfoHideSoon();return;}
  if(BI.cur===t&&!binfoEl().hidden)return;if(BI.pin&&BI.cur)return;BI.show=setTimeout(()=>{if(openPanel==='build'&&BI.hovT===t)binfoShow(t);},BINFO_DELAY*1000);}
{const bc=document.getElementById('buildCards');if(bc){const cardOf=e=>{const c=e.target&&e.target.closest&&e.target.closest('.card[data-piece]');return c?c.dataset.piece:null;};
  bc.addEventListener('mouseover',e=>binfoHover(cardOf(e)));bc.addEventListener('mousemove',e=>binfoHover(cardOf(e)));bc.addEventListener('mouseleave',()=>binfoHover(null));}}
addEventListener('keydown',e=>{if(e.code!=='KeyI'||openPanel!=='build'||e.repeat)return;const t=BI.cur||BI.hovT;if(!t)return;e.preventDefault();e.stopImmediatePropagation();
  if(BI.pin&&BI.cur===t){BI.pin=false;binfoPinUi();if(BI.hovT!==t)binfoHideSoon();return;}if(BI.cur!==t||binfoEl().hidden)binfoShow(t);BI.pin=true;binfoPinUi();$('#biMore').open=true;},true);
function binfoPinUi(){const h=$('#biPin');if(h){h.textContent=BI.pin?'Lukittu – I vapauttaa':'Paina I – pidä auki ja lue';h.classList.toggle('on',BI.pin);}}
function binfoHideSoon(){if(BI.pin)return;clearTimeout(BI.hide);BI.hide=setTimeout(()=>binfoHide(),BINFO_HIDE*1000);}
function binfoHide(){clearTimeout(BI.show);clearTimeout(BI.hide);const el=document.getElementById('binfo');if(el)el.hidden=true;BI.cur=null;BI.hovT=null;BI.pin=false;cancelAnimationFrame(BI.raf);BI.raf=0;}
function binfoPlace(el){const b=$('#build');if(!b||b.hidden)return;const r=b.getBoundingClientRect(),w=236,left=r.left-w-10;
  el.style.top=r.top+'px';el.style.height=r.height+'px';el.style.width=w+'px';el.style.left=(left>=6?left:Math.max(6,r.left+8))+'px';el.classList.toggle('over',left<6);}
function binfoShow(t){const el=binfoEl(),d=PIECES[t];BI.cur=t;binfoPlace(el);el.hidden=false;
  $('#biName').textContent=d.n;$('#biCost').innerHTML=costChips(d.req);$('#biRows').innerHTML=binfoRows(t).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const X=PIECE_INFO[t];$('#biDesc').textContent=X?X.d:CAT_DESC[d.cat]||'';$('#biMore').hidden=!$('#biDesc').textContent;$('#biMore').open=false;
  binfoPinUi();try{binfo3D(t);}catch(e){console.warn('binfo 3D',e);}}
function binfo3D(t){const cv=$('#biCan');if(!BI.r){BI.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});BI.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));BI.r.setSize(220,150,false);
    BI.sc=new THREE.Scene();BI.sc.add(new THREE.HemisphereLight(0xfff1dc,0x3a2a1a,.95));const dl=new THREE.DirectionalLight(0xffe0b0,.9);dl.position.set(3,5,4);BI.sc.add(dl);BI.cam=new THREE.PerspectiveCamera(32,220/150,.05,200);}
  if(BI.obj){BI.sc.remove(BI.obj);BI.obj.traverse(m=>{if(m.isMesh&&m.geometry)m.geometry.dispose();});}
  const o=buildPieceMesh(t,0);o.traverse(m=>{if(m.isMesh)m.castShadow=false;});if(o.userData.coal)o.userData.coal.visible=isFirePiece(t);const fl=o.userData.flame;if(fl)for(const f of fl)f.visible=true;
  const pv=new THREE.Group();pv.add(o);const bb=new THREE.Box3().setFromObject(o),c=bb.getCenter(new V3()),sz=bb.getSize(new V3());o.position.sub(c);BI.sc.add(pv);BI.obj=pv;
  const R=Math.max(sz.x,sz.y,sz.z,.4);BI.dist=R*2.3;BI.t0=performance.now();BI.last=BI.t0;cancelAnimationFrame(BI.raf);BI.raf=requestAnimationFrame(binfoAnim);}
function binfoAnim(now){if(!BI.cur||!BI.obj){BI.raf=0;return;}const dt=Math.min(.05,(now-BI.last)/1000),t=(now-BI.t0)/1000;BI.last=now;
  const o=BI.obj;o.rotation.y=.6+t*.55;o.position.y=Math.sin(t*1.3)*.012*BI.dist;   // hidas kääntö ja keinunta
  const g=o.children[0],fl=g&&g.userData.flame;if(fl){const s=.85+.2*Math.sin(t*13)+.1*Math.sin(t*23.7);fl[0].scale.set(1,s,1);if(fl[1])fl[1].scale.set(1,1.1-(s-.85),1);}
  const cb=g&&g.userData.coal;if(cb&&cb.visible)cb.material.emissiveIntensity=.7+.3*Math.sin(t*2.2);
  const a=.35;BI.cam.position.set(Math.sin(a)*BI.dist,BI.dist*.42,Math.cos(a)*BI.dist);BI.cam.lookAt(0,0,0);BI.r.render(BI.sc,BI.cam);BI.raf=requestAnimationFrame(binfoAnim);}
window.addEventListener('resize',()=>{const el=document.getElementById('binfo');if(el&&!el.hidden)binfoPlace(el);});
