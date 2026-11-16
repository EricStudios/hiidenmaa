// v2.69 seed-testi (käyttö kuten tarkistus.mjs: http.server 8977 + THREE=…; MAPS=0,1 SEEDS=0,11 valinnaiset): jokainen kartta usealla seedillä → paikat maalla, erillään, teemaehdot, eri seed = eri paikat, sama seed = samat
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const T=process.env.THREE;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const maps=(process.env.MAPS||'0,1,2,3,4,5').split(',').map(Number),seeds=(process.env.SEEDS||'0,11,4242,777777').split(',').map(Number);
const all={};let bad=0;
for(const m of maps)for(const sd of seeds){
  const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([m,sd])=>{Element.prototype.requestPointerLock=function(){};localStorage.setItem('hiidenmaa_map',String(m));localStorage.setItem('hiidenmaa_seed',String(sd));},[m,sd]);
  await p.route('**/three.min.js',r=>T?r.fulfill({path:T,contentType:'application/javascript'}):r.continue());await p.route('**/fonts.googleapis.com/**',r=>r.abort());
  await p.goto('http://localhost:8977/index.html');await p.waitForFunction('window.__game',null,{timeout:180000});
  const r=await p.evaluate(()=>{const E=s=>(0,eval)(s);const g=window.__game;g.newGame();
    const LOC=E('LOC'),out={seed:E('SEED'),locs:{},probs:[]};
    for(const k in LOC){const L=LOC[k],h=E('terrainH')(L.x,L.z);out.locs[k]=[Math.round(L.x),Math.round(L.z)];
      if(k!=='spawn'&&h<1.2)out.probs.push(`${k} vedessä h=${h.toFixed(1)}`);}
    const ks=Object.keys(LOC);for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){const a=LOC[ks[i]],c=LOC[ks[j]],d=Math.hypot(a.x-c.x,a.z-c.z);
      if(d<20&&!(ks[i]==='spawn'&&ks[j]==='rune1')&&!(ks[i]==='rune1'&&ks[j]==='spawn'))out.probs.push(`${ks[i]}–${ks[j]} ${d.toFixed(0)} m`);}
    if(E('SEED'))for(const k of E('SITE_MOVE')){const L=LOC[k];if(!E('sitePrefOk')(E('SITE_MOVE_PREF')[k],L.x,L.z,E('terrainH')(L.x,L.z)))out.probs.push(`${k} ei teemapaikalla (varapaikka?)`);}
    /* riimukivien suunnat: teksti laskee suunnan kiven paikasta (dirText) */
    for(const k in E('XRUNES')){const t=E('XRUNES')[k].txt(LOC[k]);if(/undefined|NaN/.test(t))out.probs.push(`${k} teksti rikki`);}
    for(const R of E('RUNES')){const t=typeof R.txt==='function'?R.txt():R.txt;if(/undefined|NaN/.test(t))out.probs.push(`${R.k} teksti rikki`);}
    const kh=E('keeperHint')();if(!kh||/undefined|NaN/.test(JSON.stringify(kh)))out.probs.push('keeperHint rikki');
    /* eteneminen: jääavain jossain maailman arkussa, sirpaleet/hiidenkivet suunniteltu */
    out.key=JSON.stringify(E('flags').wl||E('flags').loot||'').length;
    for(let i=0;i<30;i++)g.update(1/30);out.ser=E('serialize')().seed;return out;});
  if(r.ser!==sd)r.probs.push('serialize seed '+r.ser);if(r.seed!==sd)r.probs.push('SEED '+r.seed);
  if(errs.length)r.probs.push('virheet: '+errs.slice(0,3).join(' | '));
  all[m+':'+sd]=r.locs;bad+=r.probs.length;
  console.log(`kartta ${m} seed ${sd}: ${r.probs.length?'ONGELMAT '+r.probs.join('; '):'ok'}`);await p.close();}
// eri seedit eri paikoissa
for(const m of maps){const L=seeds.map(s=>all[m+':'+s]).filter(Boolean);for(let i=1;i<L.length;i++){const same=Object.keys(L[0]).filter(k=>k!=='spawn'&&k!=='rune1'&&k!=='barrow'&&k!=='circle'&&L[i][k]&&L[0][k]&&L[i][k][0]===L[0][k][0]&&L[i][k][1]===L[0][k][1]);
  if(same.length){console.log(`kartta ${m}: seed ${seeds[i]} samoja paikkoja kuin ${seeds[0]}: ${same.join(',')}`);bad++;}}}
console.log(bad?'ONGELMIA '+bad:'SEED OK');await b.close();
