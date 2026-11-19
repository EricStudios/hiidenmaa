/* Hiidenmaa – fishbook.js
   v3.15 KALAKIRJA (käyttäjä 19.11.). Ladataan tackle.js:n jälkeen.
   ARVO: jokaisella saaliilla paino (kg) ja pituus (cm). Lajikohtainen jakauma (FB_N näytettä, sama painokaava kuin fishHook) → painopisteet (persentiili) ja kokopisteet;
   yhteispisteet 0,6 × paino + 0,4 × koko → "parempi kuin X % lajinsa kaloista" → 8 luokkaa FB_CLS (Roskakala … Maailmanennätysvonkale).
   KIRJA (#fishP): aukeama, 1 kala / sivu, sivunumerot alakulmissa, sivujen kääntö (animaatio + paikkamerkki sivun_kaanto). Sivut: sisällys, arvoluokat, 18 lajia,
   toivekalat, vedet, tavoitteet, tietokirjallisuus (vedet ja todennäköisyydet, ajat ja sää, viehteet ja varusteet).
   TOIVEKALAT: 3 kpl (helppo, keskivaikea, vaikea), lukittu 7 päivää (flags.fish.wish), XP lajin harvinaisuuden ja vaatimuksen mukaan.
   Kirja vasemmassa kädessä (cat offhand): vasen klikkaus avaa (kun oikea käsi on tyhjä), oma pikanäppäin (K). Pelkkä kirja → oikeaan käteen (F-tarkastelu toimii).
   Lukiessa molemmat kädet pitelevät avointa kirjaa (bookPose). DEV: Paljasta kalakirja (DEVF.fishReveal). */
'use strict';
const FB_N=3000,FB_WISH_DAYS=7;
const FISH_LEN={ahven:40,hauki:120,lahna:70,silakka:25,turska:110,lohi:120,ruutana:40,suonsilma:55,kuha:90,made:80,muikku:22,sarki:40,kiiski:20,toutain:80,siika:60,kampela:45,meritaimen:100,suutari:60};
const FB_CLS=[{n:'Roskakala',p:0,c:'#8a8478'},{n:'Tavallinen',p:.15,c:'#e8e2d0'},{n:'Hyvä',p:.5,c:'#6ec85a'},{n:'Harvinainen',p:.75,c:'#4f9fe0'},{n:'Ennätysluokka',p:.9,c:'#b06ae8'},
  {n:'Legendaarinen',p:.97,c:'#f0902a'},{n:'Ikijärkäle',p:.995,c:'#e8483a'},{n:'Maailmanennätysvonkale',p:.999,c:'#ffd24a'}];
const FB_SP=Object.keys(FISH_B);   // kirjan järjestys = FISH_B
const FB_FIRST_SP=4;   // ensimmäisen lajisivun numero (1 sisällys, 2 arvoluokat, 3 toiveet)
const FB={dist:{},page:0,turn:null};
/* ---------------- ARVO ---------------- */
function fbLen(sp,kg,r){const B=FISH_B[sp];return Math.round(FISH_LEN[sp]*Math.cbrt(kg/B.kg[1])*(.93+.14*r));}
function fbDist(sp){if(FB.dist[sp])return FB.dist[sp];const B=FISH_B[sp],rnd=mulberry32(sp.split('').reduce((a,c)=>a*31+c.charCodeAt(0),7)|0),W=[],L=[];
  for(let i=0;i<FB_N;i++){const q=rnd(),kg=B.kg[0]+(B.kg[1]-B.kg[0])*q*q*(.6+.4*rnd());W.push(kg);L.push(fbLen(sp,kg,rnd()));}
  const ws=[...W].sort((a,b)=>a-b),ls=[...L].sort((a,b)=>a-b),pr=(arr,v)=>{let lo=0,hi=arr.length;while(lo<hi){const m=(lo+hi)>>1;if(arr[m]<v)lo=m+1;else hi=m;}return lo/arr.length;};
  const S=W.map((w,i)=>.6*pr(ws,w)+.4*pr(ls,L[i])).sort((a,b)=>a-b);return FB.dist[sp]={ws,ls,S,pr};}
// arvo: pw = painopisteet, pl = kokopisteet, pct = yhteispisteiden persentiili, cls = luokan indeksi
function fishValue(sp,kg,cm){const D=fbDist(sp),pw=D.pr(D.ws,kg+1e-9),pl=D.pr(D.ls,cm+1e-9),s=.6*pw+.4*pl,pct=Math.min(.9999,D.pr(D.S,s+1e-9));let cls=0;FB_CLS.forEach((c,i)=>{if(pct>=c.p)cls=i;});return {pw,pl,pct,cls,s};}
const fbPct=v=>(Math.floor(v*1000)/10).toFixed(1).replace('.',',').replace(/,0$/,'');
const fbKg=kg=>kg<1?kg.toFixed(2).replace('.',','):kg.toFixed(1).replace('.',',');
function fbClsTag(i,pct,big){const C=FB_CLS[i];return `<span class="fbCls${big?' big':''}" style="--c:${C.c}" title="Parempi kuin ${fbPct(pct)} % lajinsa kaloista">${C.n}</span>`;}
function fbPage(sp){return FB_FIRST_SP+FB_SP.indexOf(sp);}
/* ---------------- SAALIS (fish.js fishLand) ---------------- */
// kirjaa saaliin: pituus, arvo, paras yksilö, luokkatilasto, toiveet ja saavutukset → palauttaa ilmoitustekstin
function fbCatch(sp,kg,first,rec){const F=fishF(),cm=fbLen(sp,kg,Math.random()),V=fishValue(sp,kg,cm);F.best=F.best||{};F.cls=F.cls||{};F.cls[V.cls]=(F.cls[V.cls]||0)+1;
  const b=F.best[sp];if(!b||V.s>b.s)F.best[sp]={kg,cm,s:+V.s.toFixed(4),pct:+V.pct.toFixed(4),cls:V.cls,d:dayN};
  if(V.cls>=5)F.legend=(F.legend||0)+1;fbWishCheck(sp,V);
  return `Sait: ${ITEMS[sp].n} ${fbKg(kg)} kg, ${cm} cm (${FB_CLS[V.cls].n})${first?' – uusi laji!':''}${rec?' – uusi ennätys!':''} – katso kalakirjan sivu ${fbPage(sp)}`;}
/* ---------------- TOIVEKALAT ---------------- */
function fbWorldTypes(){const t={};for(const w of WBS){t[w.type]=1;if(w.bogg)t.bog=1;}return t;}
function fbWishMake(){const F=fishF(),T=fbWorldTypes(),rnd=mulberry32(seedMix(9071+dayN)),pool=FB_SP.filter(sp=>T[FISH_B[sp].w]),pick=(L)=>L[Math.floor(rnd()*L.length)];
  const rar=sp=>clamp(1-FISH_B[sp].b/6,0,1),easy=pool.filter(sp=>FISH_B[sp].b>=2.5),mid=pool.filter(sp=>FISH_B[sp].b>=1),hard=pool.filter(sp=>FISH_B[sp].b<2.5),out=[],used=new Set();
  for(const [tier,L,minC] of [[0,easy,0],[1,mid,2],[2,hard,3]]){const c=(L.length?L:pool).filter(sp=>!used.has(sp));if(!c.length)continue;const sp=pick(c);used.add(sp);
    out.push({sp,c:minC,xp:Math.round(12+30*rar(sp)+[0,10,25][tier]),t:tier,ok:0});}
  F.wish={d0:dayN,L:out};return F.wish;}
function fbWish(){const F=fishF();if(!F.wish||!F.wish.L||dayN>=F.wish.d0+FB_WISH_DAYS)fbWishMake();return F.wish;}
function fbWishCheck(sp,V){const W=fbWish();for(const w of W.L){if(w.ok||w.sp!==sp||V.cls<w.c)continue;w.ok=1;const F=fishF();F.wishN=(F.wishN||0)+1;if(w.c>=3)F.wishH=(F.wishH||0)+1;
    addXp(w.xp,'toive');msg(`Toive täyttyi: ${ITEMS[sp].n}${w.c?' ('+FB_CLS[w.c].n+' tai parempi)':''} – +${w.xp} XP!`,'quest');}}
/* ---------------- KALAKUVITUS (piirretty, myös repun kuvakkeet) ---------------- */
// piirtää kalan kontekstiin g: keskipiste (cx, cy), puolipituus R px. o.sil = siluetti (tuntematon), o.ck = paistettu, o.icon = kuvake (vähemmän yksityiskohtia)
function fishArtDraw(g,sp,cx,cy,R,o={}){const S=FISH_SHAPE[sp],f=FISH_DEF[sp];if(!S||!f)return;const h=S.h/S.l*(S.eel?1.1:1),ck=!!o.ck,sil=!!o.sil,ic=!!o.icon;
  const sh=(c,k)=>{const C=new THREE.Color(c);C.multiplyScalar(k);return '#'+C.getHexString();},body=ck?'#a8642e':f.c,belly=ck?'#e0a060':sp==='ahven'?'#e6dcae':f.c2,fin=ck?'#7a4420':S.fin||sh(f.c,.8),ol=sil?'rgba(0,0,0,0)':'#1a140e';
  g.save();g.translate(cx,cy);g.rotate(o.rot||0);g.scale(R,R);g.lineJoin='round';g.lineCap='round';const lw=1/R;
  if(S.glow&&!sil&&!ck){g.shadowColor='rgba(95,230,217,.9)';g.shadowBlur=R*.25;}
  // runko: kärki vasemmalla (−1), pyrstön tyvi oikealla (+0,92)
  const bodyP=()=>{g.beginPath();if(S.flat){g.ellipse(-.05,0,.95,h,0,0,TAU);return;}
    const sn=S.sn==='duck'?-1.08:-1;g.moveTo(sn,h*.08);g.bezierCurveTo(sn+.15,-h*.7,-.45,-h*1.02,-.05,-h);g.bezierCurveTo(.45,-h*.95,.75,-h*.45,.92,-h*.2);
    g.lineTo(.92,h*.2);g.bezierCurveTo(.72,h*.55,.4,h*1.02,-.05,h*1.02);g.bezierCurveTo(-.5,h*1.02,sn+.1,h*.75,sn,h*.08);g.closePath();};
  const finP=(pts,col,rays)=>{g.fillStyle=col;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();if(!sil){g.strokeStyle=ol;g.lineWidth=lw*.9;g.stroke();
      if(rays&&!ic){g.save();g.clip();g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=lw*.7;const [a,...r]=pts;for(const q of r){g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(q[0],q[1]);g.stroke();}g.restore();}}};
  const fc=sil?'#2a2218':fin;g.globalAlpha=sil?.85:1;
  // pyrstö
  if(S.flat)finP([[.9,0],[1.25,-h*.5],[1.18,0],[1.25,h*.5]],fc,1);
  else if(S.eel)finP([[.75,-h*.35],[1.12,-h*.15],[1.15,h*.15],[.75,h*.35]],fc,1);
  else{const fk=/lohi|meritaimen|siika|muikku|silakka|sarki|lahna|toutain/.test(sp)?.18:.05,tp=[[.88,0],[1.32,-h*1.15],[1.18-fk,0],[1.32,h*1.15]];
    if(!ic){const rp=[[.88,0]];for(let i=0;i<=6;i++){const t=i/6,yy=-h*1.15+t*h*2.3;rp.push([1.32-Math.sin(t*Math.PI)*fk*1.4,yy]);}rp.push([.88,0]);finP(rp,fc,1);}else finP(tp,fc,1);}
  // selkäevät
  if(S.flat){finP([[-.75,-h*.55],[-.2,-h*1.25],[.6,-h*1.15],[.85,-h*.3]],fc,1);finP([[-.6,h*.6],[-.1,h*1.25],[.6,h*1.1],[.85,h*.3]],fc,1);}
  else if(S.eel){finP([[-.15,-h*.9],[.3,-h*1.35],[.85,-h*.55],[.8,-h*.3]],fc,1);finP([[0,h*.95],[.4,h*1.3],[.85,h*.5],[.8,h*.3]],fc,1);}
  else{if(S.spine){const p=[[-.5,-h*.92]];for(let i=0;i<6;i++)p.push([-.46+i*.11,-h*1.55],[-.41+i*.11,-h*1.02]);p.push([.12,-h*.95]);finP(p,fc,0);finP([[.15,-h*.95],[.32,-h*1.35],[.55,-h*1.2],[.62,-h*.6]],fc,1);}
    else finP([[-.3,-h*.98],[-.05,-h*1.6],[.3,-h*1.3],[.32,-h*.88]],fc,1);
    if(/lohi|meritaimen|siika|muikku/.test(sp))finP([[.55,-h*.62],[.66,-h*.95],[.74,-h*.5]],fc,0);   // rasvaevä
    finP([[.4,h*.85],[.52,h*1.4],[.75,h*1.05],[.72,h*.55]],fc,1);finP([[-.2,h*.98],[-.08,h*1.5],[.05,h*1.0]],fc,1);}
  // runko
  bodyP();if(sil){g.fillStyle='#2a2218';g.fill();g.restore();return;}
  const gr=g.createLinearGradient(0,-h,0,h);gr.addColorStop(0,sh(body,.62));gr.addColorStop(.38,body);gr.addColorStop(.62,sh(belly,1));gr.addColorStop(1,sh(belly,1.08));g.fillStyle=gr;g.fill();
  g.save();bodyP();g.clip();const rr=mulberry32(sp.length*977+sp.charCodeAt(0));
  if(!ck){g.fillStyle='rgba(15,12,8,.45)';
    if(S.m==='bars')for(let i=0;i<6;i++){const x=-.55+i*.24;const bg=g.createLinearGradient(x-.07,0,x+.07,0);bg.addColorStop(0,'rgba(15,12,8,0)');bg.addColorStop(.5,'rgba(15,12,8,.55)');bg.addColorStop(1,'rgba(15,12,8,0)');g.fillStyle=bg;g.fillRect(x-.07,-h*1.1,.14,h*1.5);}
    if(S.m==='spots'){g.fillStyle='rgba(235,230,170,.78)';for(let i=0;i<26;i++){g.beginPath();g.ellipse(-.75+rr()*1.6,(rr()-.65)*h*1.5,.035+rr()*.03,.022+rr()*.015,0,0,TAU);g.fill();}}
    if(S.m==='dots'){g.fillStyle='rgba(30,22,12,.55)';for(let i=0;i<34;i++){g.beginPath();g.arc(-.75+rr()*1.6,(rr()-.7)*h*1.4,.016+rr()*.02,0,TAU);g.fill();}}
    if(S.m==='xs'){g.strokeStyle='rgba(15,12,10,.7)';g.lineWidth=lw*1.2;for(let i=0;i<20;i++){const x=-.6+rr()*1.35,y=(rr()-.8)*h*1.1,s=.025;g.beginPath();g.moveTo(x-s,y-s);g.lineTo(x+s,y+s);g.moveTo(x+s,y-s);g.lineTo(x-s,y+s);g.stroke();}}
    if(S.m==='mottle'){g.fillStyle='rgba(25,20,10,.45)';for(let i=0;i<18;i++){g.beginPath();g.ellipse(-.8+rr()*1.7,(rr()-.6)*h*1.4,.06+rr()*.07,.035+rr()*.04,rr()*3,0,TAU);g.fill();}}
    if(S.m==='line'||!S.m){g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=lw*1.3;g.beginPath();g.moveTo(-.68,-h*.15);g.quadraticCurveTo(0,h*.02,.9,-h*.02);g.stroke();}
    if(!ic){g.strokeStyle='rgba(0,0,0,.09)';g.lineWidth=lw*.8;for(let y=-h;y<h;y+=.07)for(let x=-.6;x<.9;x+=.08){g.beginPath();g.arc(x+(Math.round(y/.07)%2)*.04,y,.045,-.9,.9);g.stroke();}}   // suomut
    const hl=g.createLinearGradient(0,-h,0,0);hl.addColorStop(0,'rgba(255,255,255,0)');hl.addColorStop(.55,'rgba(255,255,255,.22)');hl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=hl;g.fillRect(-1.1,-h*.75,2,h*.5);}
  else{g.strokeStyle='rgba(70,30,8,.7)';g.lineWidth=lw*3;for(let i=-1;i<2;i++){g.beginPath();g.moveTo(-.25+i*.32,-h);g.lineTo(-.12+i*.32,h);g.stroke();}}
  g.restore();bodyP();g.strokeStyle=ol;g.lineWidth=lw*1.4;g.stroke();
  // pää: kiduskansi, silmä, suu, rintaevä, viiksisäie
  const ex=S.flat?-.55:S.sn==='duck'?-.72:-.66,ey=S.flat?-h*.35:-h*.22;
  if(!S.flat){g.strokeStyle='rgba(20,14,8,.55)';g.lineWidth=lw*1.3;g.beginPath();g.arc(ex+.42,0,h*.9,Math.PI*.72,Math.PI*1.28);g.stroke();}
  finP([[ex+.5,h*.2],[ex+.78,h*.55],[ex+.82,h*.32]],sh(fin,1.05),1);
  const er=Math.max(.06,h*.17);g.fillStyle=S.eye||'#e8d890';g.beginPath();g.arc(ex,ey,er,0,TAU);g.fill();g.strokeStyle=ol;g.lineWidth=lw;g.stroke();g.fillStyle='#0a0a0a';g.beginPath();g.arc(ex-er*.1,ey,er*.55,0,TAU);g.fill();
  g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(ex-er*.35,ey-er*.35,er*.22,0,TAU);g.fill();
  g.strokeStyle=ol;g.lineWidth=lw*1.2;g.beginPath();const mx=S.sn==='duck'?-1.06:-.98;g.moveTo(mx,h*.12);g.quadraticCurveTo(mx+.12,h*.24,mx+.2,h*.16);g.stroke();
  if(S.bar||S.eel){g.strokeStyle=sh(body,.8);g.lineWidth=lw*1.4;g.beginPath();g.moveTo(mx+.08,h*.26);g.quadraticCurveTo(mx+.06,h*.6,mx+.14,h*.8);g.stroke();}
  g.restore();}
const FB_ART={};
function fishArt(sp,W,H,sil){const k=sp+W+'x'+H+(sil?'s':'');if(FB_ART[k])return FB_ART[k];const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');g.scale(2,2);
  const S=FISH_SHAPE[sp],h=S?S.h/S.l:.4;fishArtDraw(g,sp,W*.46,H*.5,Math.min(W*.36,H*.46/Math.max(.45,h*1.55)),{sil});return FB_ART[k]=c.toDataURL();}   // korkearunkoiset (lahna, ruutana) pienempinä
/* ---------------- KIRJA ---------------- */
function fbKnown(sp){const F=fishF();return !!F.n[sp]||(DEV&&typeof DEVF!=='undefined'&&!!DEVF.fishReveal);}
function fbPages(){const F=fishF(),P0=[],tot=fishTotal(F),known=FB_SP.filter(fbKnown).length,W=fbWish();
  const toc=[['Arvoluokat',2],['Toivekalat',3],['Kalat',FB_FIRST_SP],['Vedet',FB_FIRST_SP+FB_SP.length],['Tavoitteet',FB_FIRST_SP+FB_SP.length+1],['Tietoa: vedet',FB_FIRST_SP+FB_SP.length+2],['Tietoa: ajat ja sää',FB_FIRST_SP+FB_SP.length+3],['Tietoa: viehteet ja varusteet',FB_FIRST_SP+FB_SP.length+4]];
  P0.push(`<div class="fbTitle">Kalastajan kirja</div><div class="fbOrn"></div><p class="fbC">Saaliita ${tot} · lajeja ${known}/${FB_SP.length}${F.wishN?` · toiveita täytetty ${F.wishN}`:''}</p>
    <h4>Sisällys</h4><ol class="fbToc">${toc.map(([t,p])=>`<li data-go="${p}"><span>${t}</span><i></i><b>${p}</b></li>`).join('')}</ol>`);
  const cnt=F.cls||{};P0.push(`<h3>Arvoluokat</h3><p class="fbS">Jokaisen kalan arvo lasketaan painosta ja pituudesta lajin omaa jakaumaa vasten (paino 60 %, koko 40 %).</p>
    <table class="fbClsT">${FB_CLS.map((c,i)=>`<tr><td>${fbClsTag(i,c.p)}</td><td>${i?'vähintään parempi kuin '+fbPct(c.p)+' %':'heikoin 15 %'}</td><td>${cnt[i]||0}</td></tr>`).join('')}</table><p class="fbS">Viimeinen sarake: saamasi kalat luokittain.</p>`);
  const left=Math.max(0,W.d0+FB_WISH_DAYS-dayN);
  P0.push(`<h3>Toivekalat</h3><p class="fbS">Kolme toivetta, jotka vaihtuvat ${left} päivän kuluttua (lukittu ${FB_WISH_DAYS} päivää).</p>${W.L.map(w=>`<div class="fbWish${w.ok?' ok':''}"><img src="${fishArt(w.sp,120,60,!fbKnown(w.sp))}"><div><b>${fbKnown(w.sp)?ITEMS[w.sp].n:'Tuntematon laji ('+{lake:'järvi',sea:'meri',bog:'suolampi'}[FISH_B[w.sp].w]+')'}</b>
    <span>${w.c?FB_CLS[w.c].n+' tai parempi':'mikä tahansa koko'} · ${['helppo','keskivaikea','vaikea'][w.t]}</span><em>${w.ok?'✔ täytetty':'+'+w.xp+' XP'}</em></div></div>`).join('')}`);
  for(const sp of FB_SP){const B=FISH_B[sp],k=fbKnown(sp),n=F.n[sp]||0,b=(F.best||{})[sp],wt={lake:'järvet',sea:'meri',bog:'suolammet'}[B.w],best=B.t.indexOf(Math.max(...B.t)),wx=Object.entries(B.wx).sort((a,c)=>c[1]-a[1])[0],
      lures=Object.keys(TK_LURE).filter(l=>TK_LURE[l].best.includes(sp)).map(l=>ITEMS[l].n);
    P0.push(k?`<h3>${ITEMS[sp].n}</h3><div class="fbArt"><img src="${fishArt(sp,280,130)}"></div>
      <table class="fbT"><tr><td>Saatu</td><td>${n} kpl</td></tr><tr><td>Ennätys</td><td>${fbKg(F.rec[sp]||0)} kg</td></tr>${b?`<tr><td>Arvokkain</td><td>${fbKg(b.kg)} kg · ${b.cm} cm ${fbClsTag(b.cls,b.pct)}</td></tr><tr><td></td><td class="fbS">parempi kuin ${fbPct(b.pct)} % lajinsa kaloista (päivä ${b.d})</td></tr>`:''}
      <tr><td>Vesi</td><td>${wt}</td></tr><tr><td>Parhaiten</td><td>${FISH_PH[best]}${wx&&wx[1]>1?', '+FISH_WXN[wx[0]]:''}</td></tr><tr><td>Koko</td><td>${fbKg(B.kg[0])}–${fbKg(B.kg[1])} kg, enintään ~${FISH_LEN[sp]} cm${B.big?' · väsytettävä':''}</td></tr>
      ${lures.length?`<tr><td>Viehteet</td><td>${lures.join(', ')}</td></tr>`:''}</table>`
      :`<h3>???</h3><div class="fbArt"><img src="${fishArt(sp,280,130,1)}"></div><p class="fbS">Et ole vielä saanut tätä lajia. Vihje: ${wt}${B.big?', iso kala':''}.</p>`);}
  const ws=WBS.filter(w=>F.wb[w.id]);P0.push(`<h3>Vedet</h3>${ws.length?`<ul class="fbL">${ws.map(w=>`<li>${w.name} <small>(${{lake:'järvi',sea:'meri',bog:'suolampi'}[w.type]}${w.bogg?', soinen':''})</small></li>`).join('')}</ul>`:'<p class="fbS">Et ole vielä löytänyt nimettyjä vesiä.</p>'}
    ${F.sunkK&&!F.sunkO?'<p class="fbS">Pullopostin arkku on merkitty karttaan (✕).</p>':''}`);
  P0.push(`<h3>Tavoitteet</h3><ul class="fbL fg">${FISH_GOALS.map(g=>`<li class="${F.g[g.id]?'ok':''}">${F.g[g.id]?'✔':'○'} ${g.t} <small>+${g.xp} XP</small></li>`).join('')}</ul>`);
  // tietokirjallisuus: lajien osuudet vesityypeittäin (perusyleisyys, päivällä selkeällä)
  const share=type=>{const L=FB_SP.filter(sp=>FISH_B[sp].w===type),tot=L.reduce((a,sp)=>a+FISH_B[sp].b,0);return L.map(sp=>[sp,FISH_B[sp].b/tot]).sort((a,b)=>b[1]-a[1]);};
  const bar=(sp,v)=>`<div class="fbBar"><span>${fbKnown(sp)?ITEMS[sp].n:'tuntematon laji'}</span><i style="width:${Math.round(v*100)}%"></i><b>${Math.round(v*100)} %</b></div>`;
  P0.push(`<h3>Tietoa: vedet</h3><p class="fbS">Lajien osuudet saaliista vesityypeittäin (keskimäärin). Nimetyssä vedessä sen oma laji on 1,6× yleisempi; isoista soisista järvistä saa myös suokaloja.</p>
    ${[['lake','Järvet ja lammet'],['sea','Meri'],['bog','Suolammet']].map(([t,n])=>`<h4>${n}</h4>${share(t).map(([sp,v])=>bar(sp,v)).join('')}`).join('')}`);
  P0.push(`<h3>Tietoa: ajat ja sää</h3><table class="fbT fbTime"><tr><th></th><th>aamu</th><th>päivä</th><th>ilta</th><th>yö</th><th>sää</th></tr>${FB_SP.map(sp=>{const B=FISH_B[sp],k=fbKnown(sp),m=Math.max(...B.t);
      return `<tr><td>${k?ITEMS[sp].n:'???'}</td>${B.t.map(v=>`<td>${k?'●'.repeat(Math.max(0,Math.round(v/m*3))):'·'}</td>`).join('')}<td>${k?Object.entries(B.wx).filter(e=>e[1]>1).map(e=>FISH_WXN[e[0]]).join(', ')||'–':'?'}</td></tr>`;}).join('')}</table>`);
  P0.push(`<h3>Tietoa: viehteet ja varusteet</h3><p class="fbS">Kela tekee vavasta virvelin. Viehteet eivät sovi pikkukaloille. Vahvempi siima kestää, mutta kalat huomaavat sen.</p>
    <ul class="fbL">${Object.entries(TK_LURE).map(([id,U])=>`<li><b>${ITEMS[id].n}</b>: ${U.best.map(sp=>fbKnown(sp)?ITEMS[sp].n:'???').join(', ')} <small>(${{bright:'kirkas valo',dim:'hämärä',dark:'pimeä'}[U.light]||'kaikki valot'})</small></li>`).join('')}</ul>
    <p class="fbS">Koukut: pieni = pikkukalat, iso = isot kalat, väkä = kala ei irtoa. Kohot: korkki näyttää arat tärpit, hehku näkyy yöllä.</p>`);
  if(P0.length%2)P0.push('<div class="fbEnd">✦</div>');return P0;}
function fishBookOpen(){if(openPanel!=='fish')togglePanel('fish');else fishBookRender();}
function fishBookRender(){const el=document.getElementById('fishBody');if(!el)return;const P0=fbPages();FB.pages=P0;FB.page=clamp(FB.page-(FB.page%2),0,P0.length-2);const i=FB.page;
  el.innerHTML=`<div class="fbBook"><div class="fbPg L"><div class="fbIn">${P0[i]}</div><span class="fbNo">${i+1}</span></div><div class="fbPg R"><div class="fbIn">${P0[i+1]||''}</div><span class="fbNo">${i+2}</span></div><div class="fbSpine"></div></div>
    <div class="fbNav"><button class="btn" data-fb="-2"${i<=0?' disabled':''}>‹ Edellinen</button><span>${i+1}–${i+2} / ${P0.length}</span><button class="btn" data-fb="2"${i+2>=P0.length?' disabled':''}>Seuraava ›</button></div>`;
  el.querySelectorAll('[data-fb]').forEach(b=>b.onclick=()=>fbTurn(+b.dataset.fb));el.querySelectorAll('[data-go]').forEach(li=>li.onclick=()=>fbGo(+li.dataset.go));}
function fbGo(n){const t=(n-1)-((n-1)%2);if(t===FB.page)return;fbTurn(t-FB.page);}
// sivun kääntö: kääntyvä lehti animoidaan (CSS), sitten uusi aukeama
const FB_TURN_V=.7;
function fbTurn(d){const P0=FB.pages||fbPages(),to=clamp(FB.page+d,0,P0.length-2);if(to===FB.page||FB.turn)return;const el=document.querySelector('#fishBody .fbBook');tkSnd('sivun_kaanto')||plSnd('valikot','kartta',{v:FB_TURN_V});   /* v3.22 käyttäjä: sivun käännössä kirjan avausääni −30 % */
  if(!el){FB.page=to;fishBookRender();return;}const fw=d>0,lf=document.createElement('div');lf.className='fbLeaf '+(fw?'fw':'bw');lf.innerHTML=`<div class="fbIn">${(fw?P0[FB.page+1]:P0[FB.page])||''}</div>`;el.appendChild(lf);
  FB.turn=setTimeout(()=>{FB.turn=null;FB.page=to;fishBookRender();},380);}
document.addEventListener('keydown',e=>{if(openPanel!=='fish')return;if(e.code==='ArrowRight'||e.code==='KeyD'){fbTurn(2);e.preventDefault();}else if(e.code==='ArrowLeft'||e.code==='KeyA'){fbTurn(-2);e.preventDefault();}});
/* ---------------- KIRJA KÄDESSÄ ---------------- */
// avoin kirja molemmissa käsissä lukiessa (player.js kutsuu bookPose)
let fbOpen3D=null;
function fbBookMesh(open){const g=new THREE.Group(),lea=tkMat('bkL',0x3a2214,{roughness:.75}),pg=tkMat('bkP',0xe8dcc0,{roughness:.95}),au=tkMat('bkG',0xd8a840,{metalness:.75,roughness:.3,emissive:0x3a2a08,emissiveIntensity:.3});
  if(open){for(const s of [-1,1]){const c=bx(.17,.012,.24,lea,s*.088,0,0);c.rotation.z=s*-.12;g.add(c);const p=bx(.155,.02,.22,pg,s*.082,.014,0);p.rotation.z=s*-.12;g.add(p);}g.add(bx(.02,.02,.24,lea,0,-.004,0));return g;}
  g.add(bx(.03,.17,.23,lea,0,0,0),bx(.024,.155,.215,pg,.006,0,0));const o=new THREE.Mesh(new THREE.ShapeGeometry((()=>{const q=new THREE.Shape();q.ellipse(0,0,.05,.022,0,TAU);q.moveTo(.045,0);q.lineTo(.075,.025);q.lineTo(.075,-.025);q.lineTo(.045,0);return q;})()),au);
  o.rotation.y=-Math.PI/2;o.position.set(-.016,0,0);g.add(o);g.add(bx(.032,.006,.2,au,0,.07,0),bx(.032,.006,.2,au,0,-.07,0));return g;}
function bookReading(){return openPanel==='fish'&&!!(equipped('offhand')&&equipped('offhand').id==='kalakirja'||equipped('weapon')===null&&heldId==='kalakirja');}
function bookPose(){const rd=openPanel==='fish'&&invCount('kalakirja')>0;
  if(rd){fig.armR.rotation.x=-1.05;fig.armR.rotation.z=.32;fig.elbowR.rotation.x=-.85;fig.armL.rotation.x=-1.05;fig.armL.rotation.z=-.32;fig.elbowL.rotation.x=-.85;
    if(!fbOpen3D){fbOpen3D=fbBookMesh(true);fbOpen3D.position.set(-.1,-.02,.08);fbOpen3D.rotation.set(-.5,0,0);fig.handL.add(fbOpen3D);}fbOpen3D.visible=true;if(heldMesh)heldMesh.visible=false;if(offMesh)offMesh.visible=false;}
  else if(fbOpen3D&&fbOpen3D.visible){fbOpen3D.visible=false;if(heldMesh)heldMesh.visible=true;if(offMesh)offMesh.visible=true;}}
// vasen klikkaus kirja vasemmassa kädessä (oikea käsi tyhjä) tai pelkkä kirja oikeassa kädessä → avaa
function fbPrimary(w){if(state!=='play')return false;const o=equipped('offhand');if(w.id===null&&(o&&o.id==='kalakirja'||heldId==='kalakirja')){fishBookOpen();return true;}return false;}
