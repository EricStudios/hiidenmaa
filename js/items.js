/* Hiidenmaa – items.js
   Esineet (ITEMS), reseptit (RECIPES) ja esinekuvakkeet */
'use strict';

/* ---------------- ITEMS ---------------- */
const ITEMS={
  puu:{n:'Puu',w:2,s:50,c:'#9a6234',d:'Rakennusten, työkalujen ja polttopuun perusaine.'},
  kivi:{n:'Kivi',w:2,s:50,c:'#8f8d86',d:'Tukevaa rakennuskiveä.'},
  piikivi:{n:'Piikivi',w:1,s:50,c:'#4d535c',d:'Teräväsärmäistä kiveä rantojen ja järvien reunoilta.'},
  pihka:{n:'Pihka',w:.5,s:50,c:'#dc9d2c',d:'Tahmeaa ja palavaa. Kuusista ja sammalhiisiltä.'},
  nahka:{n:'Nahka',w:1,s:50,c:'#a06d45',d:'Eläinten vuota. Vaatteisiin ja jänteisiin.'},
  luu:{n:'Luunsiru',w:.5,s:50,c:'#e7e1cf',d:'Kalmojen jäänteitä.'},
  malmi:{n:'Kuparimalmi',w:5,s:30,c:'#b96c3d',d:'Sulata sulatusuunissa kupariksi.'},
  kupari:{n:'Kupariharkko',w:3,s:30,c:'#e0904f',d:'Ahjon tärkein aine.'},
  rautamalmi:{n:'Rautamalmi',w:6,s:30,c:'#7a5a50',d:'Vuorten syvistä suonista. Sulata sulatusuunissa raudaksi.'},
  rauta:{n:'Rautaharkko',w:4,s:30,c:'#8a96a3',d:'Kovaa ja raskasta. Parhaat työkalut ja aseet taotaan raudasta.'},
  tervaspuu:{n:'Tervaspuu',w:2.5,s:50,c:'#4a3424',d:'Aarnipuun tummaa, pihkaista puuta. Kestää kaksi kertaa tavallista puuta.'},
  jaaavain:{n:'Jääavain',w:.3,s:1,c:'#9fd8ff',d:'Kylmä, huurteinen avain jostain saaren vanhasta arkusta. Toinen Routaportin kahdesta lukosta.'},
  sinetti:{n:'Kalmon sinetti',w:.4,s:1,c:'#c9b8ff',d:'Luinen sinetti, joka hohtaa himmeästi. Hautakummun ylimys kantoi sitä vyöllään. Toinen Routaportin kahdesta lukosta.'},   // v2.62
  luuavain:{n:'Luuavain',w:.3,s:1,c:'#e6e0cf',d:'Luusta veistetty avain, jonka Jäätär kantoi. Aukaisee Kalmankammion portin lukon.'},
  aarniavain:{n:'Aarniavain',w:.3,s:1,c:'#7aff9a',d:'Sammaleen peittämä vihreä avain. Aukaisee Aarnihaudan portin lukon.'},
  hiidenkivi:{n:'Hiidenkivi',w:2,s:10,c:'#7fd6cc',d:'Harvinainen, sisältä hehkuva kivi – siitä taotaan hiidenaseita ja -panssari. Saarelle on kätketty yhdeksän.'},
  kruunusirpale:{n:'Kalmankruunun sirpale',w:1,s:5,c:'#9aff7a',d:'Murtuneen kruunun hehkuva palanen Aarnihaudan syvyyksistä. Kalmankehän alttari kaipaa kolmea. (Harvinainen)'},
  sydan:{n:'Vartijan sydän',w:3,s:1,c:'#5fe6d9',d:'Kivinen sydän, joka sykkii vielä hiljaa. Voittosi merkki.'},
  /* v2.80 KOLME LIHATYYPPIÄ (käyttäjä): harvinaisuus = saaliin vaarallisuus ja koko. Paistettuna merkittävästi enemmän kylläisyyttä (ennen 30),
     harvinaisempi liha täyttää enemmän. rar = harvinaisuusväri (itemRarity, ui.js). */
  pienliha:{n:'Raaka pienriistan liha',w:.5,s:30,c:'#d06a5e',food:{h:2,raw:true},d:'Jäniksestä, ketusta, metsosta tai porsaasta. Paista nuotiolla – nopein kypsentää.'},
  liha:{n:'Raaka riistanliha',w:1,s:20,c:'#c9554e',food:{h:3,raw:true},rar:'unc',d:'Peurasta, porosta tai villikarjusta. Paista nuotiolla. Raakana vatsa voi kääntyä.'},
  suurliha:{n:'Raaka suurriistan liha',w:1.5,s:15,c:'#a83a36',food:{h:4,raw:true},rar:'rare',d:'Hirvestä tai karhusta. Paistuu hitaasti, mutta täyttää parhaiten. (Harvinainen)'},
  pienpaisti:{n:'Paistettu pienriista',w:.5,s:30,c:'#9a5a36',food:{h:25,hp:12},d:'Pientä mutta täyttävää.'},
  paisti:{n:'Paistettu riistanliha',w:1,s:20,c:'#8d4b2b',food:{h:35,hp:20},rar:'unc',d:'Täyttävää ja lämmintä.'},
  suurpaisti:{n:'Paistettu suurriistan liha',w:1.5,s:15,c:'#6e3520',food:{h:50,hp:32,st:24},rar:'rare',d:'Mehevä ja voimia antava. (Harvinainen)'},
  lihakeitto:{n:'Lihakeitto',w:1,s:10,c:'#a8743e',food:{h:45,hp:28,st:16},rar:'unc',d:'Pienriistaa ja sieniä padassa – lämmittää pitkään.'},
  juhla:{n:'Juhla-ateria',w:2,s:5,c:'#c08a3a',food:{h:70,hp:56,st:40,buff:'voima'},rar:'rare',d:'Suurriistaa, riistaa, sieniä ja marjoja. Täyttää vatsan ja antaa voimaa viideksi minuutiksi. (Harvinainen)'},
  marjat:{n:'Puolukat',w:.2,s:50,c:'#c82a3c',food:{h:5,st:16},d:'Hapanta virkistystä.'},
  sieni:{n:'Herkkutatti',w:.3,s:30,c:'#c8a26b',food:{h:6,hp:5},d:'Metsän pohjalta. Kypsennä keittopadassa (enintään 10 kerralla).'},
  varras:{n:'Metsästäjän varras',w:1,s:10,c:'#b06c3a',food:{h:42,hp:32,buff:'voima'},rar:'unc',d:'Lihaa, sieniä ja marjoja. Antaa voimaa viideksi minuutiksi.'},
  /* v2.00 juomat: löytyvät vain arkuista (10 % / juoma / arkku ensimmäisellä avauksella). Juodaan pikapaikasta kuten ruoka (drink, actions.js). */
  parannusjuoma:{n:'Parannusjuoma',w:.4,s:5,c:'#d8323c',potion:{full:1},d:'Punainen juoma. Palauttaa terveyden heti täyteen.'},
  elpymisjuoma:{n:'Elpymisjuoma',w:.4,s:5,c:'#3fbf5a',potion:{regen:60},d:'Vihreä juoma. Palauttaa 1 terveyttä sekunnissa minuutin ajan.'},
  sisujuoma:{n:'Sisujuoma',w:.4,s:5,c:'#3f7fe0',potion:{sisu:1},d:'Sininen juoma. Kylläisyys pysyy täynnä 5 minuuttia ja kestävyys 30 sekuntia.'},
  sienipaisti:{n:'Paistettu sieni',w:.3,s:30,c:'#9b6a3a',food:{h:14,hp:8},d:'Keittopadassa kypsennetty herkkutatti.'},
  /* v3.02 KEITTOPATA (käyttäjä): pataruoat täyttävät eniten; kyl = Kylläinen-tilan kesto s (nälkä kasvaa puolet hitaammin, täyteen syötynä pysyy täynnä pidempään). */
  villikaura:{n:'Villikaura',w:.2,s:50,c:'#d6b96a',d:'Niityiltä ja koivulehdoista poimittua kauraa. Keittopadassa risottoon ja puuroon.'},
  keittopata:{n:'Keittopata',w:6,s:1,c:'#3d3d40',d:'Rautainen pata. Asenna keittopatanuotioon (E). Pataruoat aukeavat tasolta 10.'},
  pilapata:{n:'Pilaantunut pata',w:6,s:1,c:'#2a2420',d:'Ruoka pilaantui padassa ilman kantta. Sulata sulatusuunissa: saat 2 rautaharkkoa ja 1 kupariharkon takaisin.'},
  puolukkahillo:{n:'Puolukkahillo',w:.4,s:20,c:'#a3182c',food:{h:28,st:35,kyl:120},rar:'unc',d:'Padassa keitettyä puolukkaa. Virkistää ja pitää nälän loitolla.'},
  sienikeitto:{n:'Sienikeitto',w:.6,s:10,c:'#b48a52',food:{h:50,hp:30,kyl:240},rar:'unc',d:'Herkkutateista ja vedestä padassa keitetty keitto.'},
  puolukkapuuro:{n:'Puolukkapuuro',w:.6,s:10,c:'#c47a82',food:{h:55,st:35,kyl:300},rar:'unc',d:'Villikaurapuuro puolukoilla. Täyttää pitkäksi aikaa.'},
  sienipata:{n:'Sienipata',w:.8,s:10,c:'#7a5230',food:{h:62,hp:36,kyl:300},rar:'unc',d:'Herkkutatteja ja pienriistaa haudutettuna.'},
  sienirisotto:{n:'Sienirisotto',w:.8,s:10,c:'#d8c08a',food:{h:68,hp:36,st:25,kyl:330},rar:'unc',d:'Villikauraa ja herkkutatteja padassa – kermaisen täyttävä.'},
  riistakeitto:{n:'Riistakeitto',w:1,s:10,c:'#9a5a34',food:{h:78,hp:45,st:20,kyl:360},rar:'rare',d:'Riistanlihaa, sieniä ja vettä hitaasti keitettynä. (Harvinainen)'},
  juhlapata:{n:'Juhlapata',w:2,s:5,c:'#8a4a24',food:{h:100,hp:75,st:50,buff:'voima',kyl:480},rar:'rare',d:'Suurriistaa, riistaa, sieniä, kauraa ja puolukoita padassa. Täyttää vatsan, pitää sen täynnä ja antaa voimaa viideksi minuutiksi. (Harvinainen)'},
  hiili:{n:'Puuhiili',w:.5,s:50,c:'#2a2623',fuel:10,d:'Palaa kymmenen kertaa pidempään kuin puu. Nuotioon, sulatusuuniin ja seisoviin soihtuihin. Syntyy ylipaistetusta ruoasta tai nuotiolla puusta.'},
  hiekka:{n:'Hiekka',w:.5,s:50,c:'#d8c38c',d:'Rannan hiekkaa. Sulatusuunissa 2 hiekkaa → 1 lasi.'},
  lasi:{n:'Lasi',w:.4,s:20,c:'#a9d6e6',d:'Sulatettua hiekkaa. Lasi-ikkunoihin.'},
  puunuolet:{n:'Puunuolet',w:.08,s:100,c:'#a87a46',d:'Halpoja ammuksia pelkästä puusta. Putoavat ja kaartuvat tuulessa enemmän ja tekevät vähemmän vahinkoa.'},
  nuolet:{n:'Piikivinuolet',w:.1,s:100,c:'#6d6a60',d:'Ammuksia jouselle.'},
  karhuntalja:{n:'Karhuntalja',w:4,s:5,c:'#5a4030',d:'Paksu karhun talja. Siitä tehdään karhuntaljamatto (Kalusto).'},
  sulka:{n:'Metson sulka',w:.05,s:50,c:'#3a3a40',d:'Metson pyrstösulka. Sulitetut nuolet lentävät suorempaan.'},
  sulkanuolet:{n:'Sulitetut nuolet',w:.1,s:100,c:'#4a4f58',d:'Metson sulilla sulitetut nuolet: 25 % nopeampi lento, kaari putoaa 40 % vähemmän (kantaa kauemmas), 15 % enemmän vahinkoa ja tuuli kallistaa rataa vain puolet.'},
  tulinuolet:{n:'Tulinuolet',w:.12,s:100,c:'#e8893b',d:'Pihkaan kastetut nuolet syttyvät lennossa: osuma sytyttää kohteen tuleen 5–10 sekunniksi (5 terveyttä sekunnissa). Sade ja vesi sammuttavat.'},
  kirves:{n:'Kivikirves',w:2,s:1,c:'#9a8a70',cat:'weapon',kb:2,dmg:8,dt:'slash',chop:1,range:2.3,st:6,spd:.5,d:'Kaataa puita. Kelpaa hätätilassa aseeksi.'},
  piikivikirves:{n:'Piikivikirves',w:2.2,s:1,c:'#4d535c',cat:'weapon',kb:2.2,dmg:10,dt:'slash',chop:1.5,range:2.35,st:6,spd:.49,d:'Lohkottu piikiviterä nahkasitein. Kaataa puut kivikirvestä nopeammin, mutta ei vielä kovimpia.'},   // v1.53
  kuparikirves:{n:'Kuparikirves',w:2.5,s:1,c:'#d98a4e',cat:'weapon',kb:2.5,dmg:13,dt:'slash',chop:2,range:2.4,st:6,spd:.48,d:'Kaataa puut puolet nopeammin.'},
  nuija:{n:'Puunuija',w:3,s:1,c:'#7b5434',cat:'weapon',kb:6,dmg:12,dt:'blunt',range:2.3,st:9,spd:.62,d:'Paksu, mailamainen murskaava ase. Puree hyvin luuhun ja kiveen ja tönäisee vihollisia kauimmas.'},
  hakku:{n:'Piikivihakku',w:3,s:1,c:'#58606b',cat:'weapon',kb:1.5,dmg:6,dt:'pierce',pick:1,range:2.4,st:7,spd:.6,d:'Louhii lohkareita ja kupariesiintymiä.'},
  kuparihakku:{n:'Kuparihakku',w:3.5,s:1,c:'#d98a4e',cat:'weapon',kb:1.5,dmg:9,dt:'pierce',pick:2,range:2.4,st:7,spd:.56,d:'Louhii myös rautasuonia.'},
  rautahakku:{n:'Rautahakku',w:4,s:1,c:'#8a96a3',cat:'weapon',kb:2,dmg:12,dt:'pierce',pick:3,range:2.5,st:7,spd:.52,d:'Paras hakku. Louhii kaiken nopeasti.'},
  rautakirves:{n:'Rautakirves',w:3,s:1,c:'#8a96a3',cat:'weapon',kb:3,dmg:18,dt:'slash',chop:3,range:2.5,st:6,spd:.46,d:'Kaataa myös aarnipuut.'},
  /* v2.91 PUUKKO JA PIHKANKERÄYS (käyttäjä). Puukko: isku kuin rautamiekalla, mutta ulottuu vain aivan lähelle. Kulho ↔ vesikulho (sama esine, nimi vaihtuu). */
  puukko:{n:'Puukko',w:.5,s:1,c:'#aab6c4',cat:'weapon',kb:.8,dmg:34,dt:'slash',range:1.2,st:5,spd:.3,d:'Lyhyt rautaterä: isku kuin rautamiekalla, mutta ulottuu vain aivan lähelle. PIHKANKERÄYS: osa männyistä ja kuusista kellertää rungosta – mene aivan kiinni ja paina E puukko kädessä, niin kaiverrat pihkakuvion (n. 10 s, jatkuu kesken jääneestä). Kiinnitä sitten kuvion alle kulho: kulho kädessä, naru toisessa kädessä, E. Pihkaa valuu tunnissa puun koon mukaan 10–50 (vain pelin ollessa käynnissä); E irrottaa kulhon ja pihkat. Parempi puukko (taso 3) kaivertaa ja valuttaa 20 % nopeammin.'},
  kulho:{n:'Kulho',w:.4,s:1,c:'#a8743e',cat:'bowl',d:'Puukulho. Täytä vedellä veden ääressä (hiiren vasen kädessä) tai kiinnitä narulla pihkapuuhun kaiverruksen alle.'},
  vesikulho:{n:'Vesikulho',w:.9,s:1,c:'#5aa0c8',cat:'bowl',d:'Kulhollinen vettä. Hiiren vasen kädessä: juo (vatsakipu menee ohi 5× nopeammin) – tai jos palat, kaada vesi päällesi ja sammuta tuli. E taimen, kasvavan puun tai viljelylohkon kohdalla: kastele (seuraava kasvu +5 %, 5 kastelua = +5 % pysyvästi). Vesi käytetään kerralla. Ole varovainen veden kanssa – vesi ei ole kiinteästi kulhossa kiinni :)'},
  /* v3.06 viljely (farm.js): siemenet toiseen käteen */
  kuusenkapy:{n:'Kuusenkäpy',w:.1,s:20,c:'#7a5634',cat:'offhand',d:'Kuusen siemenkäpy. Pidä toisessa kädessä, ota kuokka, kyyristy ja lyö maahan: istutat taimen, joka kasvaa puuksi nukkuessa (30 % / yö) ja siitä vaiheittain isommaksi (joka 5. yö 60 %).'},
  mannynkapy:{n:'Männynkäpy',w:.1,s:20,c:'#8a6a44',cat:'offhand',d:'Männyn siemenkäpy. Pidä toisessa kädessä, ota kuokka, kyyristy ja lyö maahan: istutat taimen, joka kasvaa puuksi nukkuessa (30 % / yö) ja siitä vaiheittain isommaksi (joka 5. yö 60 %).'},
  koivunsiemen:{n:'Koivun siemen',w:.05,s:20,c:'#b8a66a',cat:'offhand',d:'Koivun siemenkuoma. Pidä toisessa kädessä, ota kuokka, kyyristy ja lyö maahan: istutat taimen, joka kasvaa puuksi nukkuessa (30 % / yö) ja siitä vaiheittain isommaksi (joka 5. yö 60 %).'},
  aarnisiemen:{n:'Aarnipuun siemen',w:.2,s:10,c:'#4a7a3a',cat:'offhand',d:'Harvinainen aarnipuun siemen. Pidä toisessa kädessä, ota kuokka, kyyristy ja lyö maahan: istutat taimen, joka kasvaa puuksi nukkuessa (30 % / yö) ja siitä vaiheittain isommaksi (joka 5. yö 60 %).'},
  pihkakapy:{n:'Pihkainen kuusenkäpy',w:.1,s:20,c:'#c08a2a',cat:'offhand',d:'Pihkapuusta pudonnut käpy – siitä kasvaa pihkapuu. Pidä toisessa kädessä, ota kuokka, kyyristy ja lyö maahan: istutat taimen, joka kasvaa puuksi nukkuessa (30 % / yö) ja siitä vaiheittain isommaksi (joka 5. yö 60 %).'},
  pihkamannynkapy:{n:'Pihkainen männynkäpy',w:.1,s:20,c:'#d09a3a',cat:'offhand',d:'Pihkapuusta pudonnut käpy – siitä kasvaa pihkapuu. Pidä toisessa kädessä, ota kuokka, kyyristy ja lyö maahan: istutat taimen, joka kasvaa puuksi nukkuessa (30 % / yö) ja siitä vaiheittain isommaksi (joka 5. yö 60 %).'},
  puolukanvarpu:{n:'Puolukan varpu',w:.1,s:20,c:'#4a7a34',cat:'offhand',d:'Juurineen nostettu puolukan varpu. Pidä toisessa kädessä ja paina pellolla E (tai kuokka + kyykky + lyönti maahan). Kasvaa nukkuessa (30 % / yö).'},
  sienirihma:{n:'Sienirihmasto',w:.1,s:20,c:'#e8dcc4',cat:'offhand',d:'Herkkutatin rihmastoa sammalen seassa. Pidä toisessa kädessä ja paina pellolla E (tai kuokka + kyykky + lyönti maahan). Kasvaa nukkuessa (30 % / yö).'},
  kauransiemen:{n:'Kauransiemen',w:.05,s:40,c:'#e0cc8a',cat:'offhand',d:'Villikauran jyviä kylvöön. Pidä toisessa kädessä ja paina pellolla E (tai kuokka + kyykky + lyönti maahan). Kasvaa nukkuessa (30 % / yö).'},
  naru:{n:'Naru',w:.3,s:10,c:'#c9b48a',cat:'offhand',d:'Nahasta punottu naru. Pidä toisessa kädessä, kun kiinnität kulhon pihkapuuhun.'},
  rautamiekka:{n:'Rautamiekka',w:2.5,s:1,c:'#b8c2cc',cat:'weapon',kb:2.5,dmg:34,dt:'slash',range:2.7,st:8,spd:.42,d:'Pitkä ja terävä rautaterä.'},
  keihas:{n:'Piikivikeihäs',w:2,s:1,c:'#66707a',cat:'weapon',kb:3,dmg:15,dt:'pierce',range:3.1,st:8,spd:.55,d:'Pitkä ulottuvuus.'},
  miekka:{n:'Kuparimiekka',w:2,s:1,c:'#e0904f',cat:'weapon',kb:2,dmg:24,dt:'slash',range:2.6,st:8,spd:.44,d:'Nopea ja terävä.'},
  soihtu:{n:'Soihtu',w:1,s:1,c:'#ff9a3a',cat:'offhand',light:true,d:'Valaisee pimeässä. Pidä toisessa kädessä aseen tai työkalun rinnalla.'},
  jousi:{n:'Metsästysjousi',w:2,s:1,c:'#8a5a32',cat:'bow',dmg:16,dt:'pierce',st:4,d:'Pidä hiiren vasenta pohjassa jännittääksesi. Tarvitsee nuolia.'},
  kuokka:{n:'Kuokka',w:2.5,s:1,c:'#7a6a50',cat:'shovel',d:'Vasen: nostaa maata 0,3 m kerralla (maa saa biomin perusvärin). Oikea: palauttaa maan alkuperäisen värin ja kasvillisuuden. Ei rakennusten lähellä.'},
  lapio:{n:'Lapio',w:2.5,s:1,c:'#8a7a60',cat:'shovel',d:'Vasen: kaivaa kuoppaa 0,3 m kerralla (enint. 3 m). Oikea: ruskea polku – tasoittaa maan jalkojesi korkeudelle ja tummentaa sen (kestävyys −6). Ei rakennusten lähellä.'},
  hiidenjousi:{n:'Hiidenjousi',w:2,s:1,c:'#5fe6d9',cat:'bow',dmg:30,dt:'pierce',st:4,rare:1,d:'Hiidenkivellä vahvistettu jousi: vetää nopeammin (1,15 s), nuoli lentää 25 % nopeammin ja kauemmas, tarkempi vajaalla vedolla. (Harvinainen)'},
  hiidenmiekka:{n:'Hiidenmiekka',w:3,s:1,c:'#7fe9dd',cat:'weapon',kb:3.5,dmg:52,dt:'slash',range:2.8,st:8,spd:.4,rare:1,d:'Vartijan sydämen ja hiidenkivien voimalla taottu terä. (Harvinainen)'},
  vasara:{n:'Vasara',w:2,s:1,c:'#7c6a52',cat:'hammer',d:'Rakennustyökalu. B avaa rakennusvalikon.'},
  kilpi:{n:'Puukilpi',w:4,s:1,c:'#8a5a32',cat:'shield',block:.6,d:'Torju hiiren oikealla. Torjunta kuluttaa kestävyyttä.'},
  kuparikilpi:{n:'Kuparikilpi',w:5,s:1,c:'#d98a4e',cat:'shield',block:.8,d:'Raskas, mutta pitää.'},
  rautakilpi:{n:'Rautakilpi',w:6,s:1,c:'#8a96a3',cat:'shield',block:.9,d:'Raskas ja luja.'},
  hiidenpanssari:{n:'Hiidenpanssari',w:9,s:1,c:'#5fe6d9',cat:'armor',arm:32,warm:1,slow:.05,rare:1,d:'Kylmästi hehkuva panssari. Paras suoja. (Harvinainen)'},
  nahkavaatteet:{n:'Nahkavaatteet',w:4,s:1,c:'#9a6a44',cat:'armor',arm:5,warm:1,d:'Suojaa yön kylmältä.'},
  karhuhaarniska:{n:'Karhuntaljahaarniska',w:6,s:1,c:'#5a4030',cat:'armor',arm:10,warm:1,d:'Karhuntaljaviitta karhun pää huppuna ja nahkasuojat. Lämmin ja kevyt: ei hidasta.'},
  kuparipanssari:{n:'Kuparipanssari',w:8,s:1,c:'#d98a4e',cat:'armor',arm:14,warm:1,slow:.06,d:'Vahva suoja, hieman raskas.'},
  rautapanssari:{n:'Rautapanssari',w:11,s:1,c:'#8a96a3',cat:'armor',arm:22,warm:1,slow:.08,d:'Paras suoja. Raskas.'},
};
/* v3.06 ONKIMINEN (fish.js): kalat lajeittain (raaka + paistettu), vavat, syötti ja muut saaliit. Koko: 1 pieni (raaka h5 kuten puolukat, paistettu h25 kuten pienpaisti),
   1,5 keskikokoinen, 2 iso (enintään 2×). Paistetaan nuotiolla/grillillä (COOKABLE, fish.js), savustetaan savustimessa (savukala). */
const FISH_DEF={ahven:{n:'Ahven',k:1,c:'#7d8c4a',c2:'#d86a2a'},hauki:{n:'Hauki',k:2,c:'#5d7a46',c2:'#c8c070'},lahna:{n:'Lahna',k:1.5,c:'#a8a27a',c2:'#6a6450'},
  silakka:{n:'Silakka',k:1,c:'#9ab0c0',c2:'#e8f0f4'},turska:{n:'Turska',k:1.5,c:'#8a7a5a',c2:'#e0d8c0'},lohi:{n:'Lohi',k:2,c:'#a8b8c4',c2:'#e88a6a'},
  ruutana:{n:'Ruutana',k:1,c:'#b08a3a',c2:'#e0c070'},suonsilma:{n:'Suonsilmä',k:1.5,c:'#3a4a3a',c2:'#8fe6c8'},
  /* v3.08 käyttäjä: 10 uutta lajia (FISH_B fish.js; kuvakkeen muoto FISH_SHAPE) */
  kuha:{n:'Kuha',k:1.5,c:'#7a8a6a',c2:'#dfe4d4'},made:{n:'Made',k:1.5,c:'#5a5232',c2:'#b8ac7a'},muikku:{n:'Muikku',k:1,c:'#8fa8b8',c2:'#f0f4f6'},
  siika:{n:'Siika',k:1.5,c:'#9aaab4',c2:'#eef2f4'},sarki:{n:'Särki',k:1,c:'#8a9aa0',c2:'#e8ecec'},kiiski:{n:'Kiiski',k:1,c:'#7a7448',c2:'#d0c89a'},
  toutain:{n:'Toutain',k:2,c:'#7e909a',c2:'#e2e8ea'},kampela:{n:'Kampela',k:1,c:'#8a7a5a',c2:'#e8e0cc'},meritaimen:{n:'Meritaimen',k:2,c:'#98a8b4',c2:'#f0e8e0'},
  suutari:{n:'Suutari',k:1.5,c:'#7a7a2e',c2:'#d8c870'}};
/* v3.08 lajikohtaiset kuvakkeet: l/h = puolipituus/-korkeus, m = kuviointi (bars juovat, spots vaaleat täplät, dots tummat pilkut, xs ruksit, line kylkiviiva,
   mottle laikut), fin = evien väri, eye = silmän väri, sn: 'duck' hauen kuono, bar = viiksisäie, spine = piikkievä, eel = ankeriasmainen, flat = kampela, glow = hehkuva silmä */
const FISH_SHAPE={ahven:{l:14,h:7,m:'bars',fin:'#d84a2a',spine:1},hauki:{l:18,h:4.6,m:'spots',sn:'duck'},lahna:{l:12.5,h:9.5,m:'line'},silakka:{l:15,h:4.4,m:'line'},
  turska:{l:15,h:6.5,m:'dots',bar:1},lohi:{l:16,h:6,m:'xs',fin:'#c87a6a'},ruutana:{l:12.5,h:8.5,fin:'#c8902a'},suonsilma:{l:14,h:6.5,glow:1},
  kuha:{l:17,h:5.5,m:'bars',eye:'#cfe0e0',spine:1},made:{l:19,h:3.6,m:'mottle',bar:1,eel:1},muikku:{l:12,h:3.8,m:'line'},siika:{l:15,h:5.5,m:'line'},
  sarki:{l:13,h:6,fin:'#d8442a',eye:'#d8442a',m:'line'},kiiski:{l:10.5,h:5.5,m:'dots',spine:1},toutain:{l:16,h:7,m:'line',fin:'#b8a8a0'},kampela:{l:13,h:10,m:'dots',flat:1},
  meritaimen:{l:16,h:6,m:'xs'},suutari:{l:13,h:7.5,eye:'#d8442a',fin:'#8a8a3a'}};
for(const [id,f] of Object.entries(FISH_DEF)){const k=f.k,big=k>=2?' Iso kala – täyttää kaksinkertaisesti.':k>1?' Keskikokoinen kala.':'';
  ITEMS[id]={n:f.n,w:k>=2?1.5:k>1?.8:.3,s:1,cat:'fish',c:f.c,fishI:1,food:{h:Math.round(5*k),raw:true,fish:1},d:`Tuore ${f.n.toLowerCase()}. Paista nuotiolla tai grillillä, savusta savustimessa tai keitä padassa. Käteen otettuna: hiiren oikea syö (raakana riskialtista), E veden äärellä vapauttaa.${big}`};   // v3.27 yksilö (paino/pituus paikassa), käteen
  ITEMS[id+'p']={n:'Paistettu '+f.n.toLowerCase(),w:k>=2?1.2:k>1?.6:.25,s:20,c:f.c,fishI:2,food:{h:Math.round(25*k),hp:Math.round(12*k)},d:`Nuotiolla paistettu ${f.n.toLowerCase()}.${big}`};}
Object.assign(ITEMS,{
  savukala:{n:'Savukala',w:.15,s:30,c:'#a8742e',fishI:3,food:{h:30,hp:15,st:10},rar:'unc',d:'Savustimessa kuivattu kala: kevyt ja säilyy. Iso kala antaa kaksi.'},
  kalakeitto:{n:'Kalakeitto',w:.6,s:10,c:'#d8c8a0',food:{h:55,hp:30,kyl:240},rar:'unc',d:'Ahvenista, sienistä ja vedestä padassa keitetty keitto.'},
  lohikeitto:{n:'Lohikeitto',w:.7,s:10,c:'#e8b890',food:{h:72,hp:40,st:15,kyl:330},rar:'rare',d:'Kermainen lohikeitto kauran ja veden kanssa. (Harvinainen)'},
  kalakukko:{n:'Kalakukko',w:.8,s:10,c:'#8a5a2a',food:{h:80,hp:35,st:25,kyl:420},rar:'rare',d:'Silakat ja lihaa kaurakuoren sisällä hitaasti kypsennettynä. Pysyy lämpimänä pitkään. (Harvinainen)'},
  onki:{n:'Onki',w:1,s:1,c:'#9a7a4a',cat:'rod',dmg:2,dt:'blunt',range:1.5,st:3,spd:.6,rod:{k:1,ten:1},d:'Puusta ja narusta. Vasen heittää (katso veteen), vasen uudelleen kelaa sisään. Tärpätessä paina vasenta nopeasti; ison kalan väsytys: pidä vasenta pohjassa ja päästä irti, kun siima kiristyy.'},
  kuparivapa:{n:'Kuparivapa',w:1.2,s:1,c:'#d98a4e',cat:'rod',dmg:2,dt:'blunt',range:1.5,st:3,spd:.6,rod:{k:.8,ten:1.25},d:'Kuparikelalla: tärppää 20 % useammin ja siima kestää enemmän.'},
  hiidenvapa:{n:'Hiidenvapa',w:1.2,s:1,c:'#5fe6d9',cat:'rod',dmg:2,dt:'blunt',range:1.5,st:3,spd:.6,rod:{k:.65,ten:1.5},rar:'rare',d:'Hiidenkiven siruista taottu vapa: tärppää 35 % useammin, kestävin siima. (Harvinainen)'},
  mato:{n:'Kastemato',w:.02,s:50,c:'#c87a7a',cat:'offhand',d:'Syötti: vapa kädessä E laittaa madon koukkuun (tärppi noin kolmanneksen useammin). Voi kadota koukusta ilman saalista. Viljelyyn: pidä toisessa kädessä ja paina E taimen, kasvavan puun tai viljelylohkon kohdalla (maassa kyykyssä) – seuraava kasvu +5 %, kaksi matoa samaan kohtaan = +5 % pysyvästi. Löytyy joskus maata kaivaessa tai kuokkiessa (2 %).'},
  saapas:{n:'Vanha saapas',w:.8,s:5,c:'#4a3a2a',d:'Ongesta noussut märkä saapas. Työpenkillä sen voi purkaa nahaksi.'},
  pulloposti:{n:'Pullopostia',w:.2,s:1,c:'#7ab8a0',use:1,d:'Pullossa on vanha kirje. Käytä (E reppussa / napsauta) lukeaksesi sen.'},
  ruostavain:{n:'Ruostunut avain',w:.1,s:1,c:'#9a5a3a',d:'Ongesta noussut ruosteinen avain. Se avaa jossain rannalla tai luodolla puoliksi uppoavan arkun.'},
  hiidensiru:{n:'Hiidenkiven siru',w:.1,s:20,c:'#5fe6d9',rar:'rare',d:'Pieni hohtava siru. Siruista ei saa ehjää hiidenkiveä, mutta kolmesta voi takoa hiidenvavan. (Harvinainen)'},
  kalakirja:{n:'Kalastajan kirja',w:.3,s:1,c:'#6a4a2a',cat:'offhand',d:'Nahkakantinen kirja saaliistasi: lajit kuvineen, kalojen arvo, toivekalat, vedet ja kalastustietoa. Vasempaan käteen: vasen klikkaus avaa (kun oikea käsi on tyhjä), pikanäppäin K avaa aina.'},   // v3.15
});
// lvl = pelaajan taso, jolla ohje aukeaa (ei kenttää = alusta asti). alku:1 = Alkupeli-välilehti.
const RECIPES=[
  {id:'kirves',req:{puu:3,kivi:2},alku:1},
  {id:'vasara',req:{puu:3,kivi:1},alku:1},
  {id:'lapio',req:{puu:4,kivi:2},alku:1},
  {id:'kuokka',req:{puu:4,kivi:3},alku:1},
  {id:'nuija',req:{puu:6},alku:1},
  {id:'soihtu',req:{puu:1,pihka:1},alku:1},
  {id:'kulho',st:'tyopenkki',req:{puu:3},lvl:2},   // v2.91
  {id:'naru',st:'tyopenkki',req:{nahka:10},lvl:2},   // v2.91 käyttäjä: 10 nahkaa
  {id:'puolukanvarpu',st:'tyopenkki',req:{marjat:2},lvl:3},   // v3.06 viljely
  {id:'onki',st:'tyopenkki',req:{puu:3,naru:1},lvl:2},   // v3.06 onkiminen
  {id:'kuparivapa',st:'ahjo',req:{kupari:3,puu:2,naru:1},lvl:5},
  {id:'hiidenvapa',st:'ahjo',req:{hiidensiru:3,rauta:2,naru:1},lvl:9},
  {id:'kalakirja',st:'tyopenkki',req:{nahka:1,puu:1},lvl:2},
  {id:'nahka',st:'tyopenkki',req:{saapas:1},n:2,lvl:2},
  {id:'sienirihma',st:'tyopenkki',req:{sieni:2},lvl:3},
  {id:'kauransiemen',st:'tyopenkki',req:{villikaura:1},n:2,lvl:3},
  {id:'puukko',st:'ahjo',req:{rauta:3,puu:1},lvl:6},   // v2.91 kuten rautamiekka
  {id:'hiili',st:'nuotio',req:{puu:5},n:2,alku:1},
  {id:'kilpi',st:'tyopenkki',req:{puu:10,nahka:2},lvl:2},
  {id:'hakku',st:'tyopenkki',req:{puu:4,piikivi:5,nahka:2},lvl:2},
  {id:'keihas',st:'tyopenkki',req:{puu:5,piikivi:4,nahka:1},lvl:2},
  {id:'jousi',st:'tyopenkki',req:{puu:8,nahka:3},lvl:2},
  {id:'puunuolet',st:'tyopenkki',req:{puu:2},n:15,lvl:2},
  {id:'nuolet',st:'tyopenkki',req:{puu:2,piikivi:2},n:15,lvl:3},
  {id:'sulkanuolet',st:'tyopenkki',req:{puu:2,piikivi:2,sulka:1},n:15,lvl:3},
  {id:'tulinuolet',st:'tyopenkki',req:{puu:2,piikivi:2,pihka:1},n:15,lvl:3},
  {id:'nahkavaatteet',st:'tyopenkki',req:{nahka:8},lvl:2},
  {id:'varras',st:'grilli',req:{paisti:1,sieni:2,marjat:3},lvl:2},
  {id:'lihakeitto',st:'nuotio',req:{pienpaisti:2,sieni:2},lvl:2},   // v2.80
  {id:'juhla',st:'grilli',req:{suurpaisti:1,paisti:1,sieni:2,marjat:3},lvl:4},
  /* v3.02 keittopata: st 'pata' = aineet menevät padan lähellä pataan ja kypsyvät siinä (pt = grilliaika s; kansi pois ×10, kansi päällä ×8); ret = palautuu heti */
  {id:'keittopata',st:'ahjo',req:{rauta:4,kupari:3},lvl:10},
  {id:'puolukkahillo',st:'pata',req:{marjat:6},n:2,lvl:10,pt:12},
  {id:'sienikeitto',st:'pata',req:{sieni:4,vesikulho:1},n:2,lvl:10,pt:15,ret:{kulho:1}},
  {id:'puolukkapuuro',st:'pata',req:{villikaura:3,marjat:3,vesikulho:1},n:2,lvl:10,pt:14,ret:{kulho:1}},
  {id:'sienipata',st:'pata',req:{sieni:5,pienliha:1},n:2,lvl:11,pt:18},
  {id:'sienirisotto',st:'pata',req:{sieni:3,villikaura:3},n:2,lvl:11,pt:18},
  {id:'riistakeitto',st:'pata',req:{liha:2,sieni:2,vesikulho:1},n:2,lvl:12,pt:20,ret:{kulho:1}},
  {id:'kalakeitto',st:'pata',req:{ahven:2,sieni:1,vesikulho:1},n:2,lvl:10,pt:14,ret:{kulho:1}},   // v3.06 kalaruoat (keitot tarvitsevat veden)
  {id:'lohikeitto',st:'pata',req:{lohi:1,villikaura:1,vesikulho:1},n:3,lvl:11,pt:18,ret:{kulho:1}},
  {id:'kalakukko',st:'pata',req:{silakka:4,villikaura:3,liha:1},n:2,lvl:12,pt:24},
  {id:'juhlapata',st:'pata',req:{suurliha:1,liha:1,sieni:3,villikaura:2,marjat:2},n:3,lvl:13,pt:30},
  {id:'miekka',st:'ahjo',req:{kupari:6,puu:2,nahka:2},lvl:3},
  {id:'piikivikirves',st:'tyopenkki',req:{puu:3,piikivi:3,nahka:1},lvl:2},   // v1.53
  {id:'kuparikirves',st:'ahjo',req:{kupari:4,puu:3},lvl:3},
  {id:'kuparikilpi',st:'ahjo',req:{kupari:6,puu:6},lvl:4},
  {id:'karhuhaarniska',st:'tyopenkki',req:{karhuntalja:2,nahka:4},lvl:4},
  {id:'kuparipanssari',st:'ahjo',req:{kupari:12,nahka:6},lvl:4},
  {id:'kuparihakku',st:'ahjo',req:{kupari:6,puu:3},lvl:3},
  {id:'rautakirves',st:'ahjo',req:{rauta:4,puu:3},lvl:5},
  {id:'rautahakku',st:'ahjo',req:{rauta:5,puu:3},lvl:5},
  {id:'rautamiekka',st:'ahjo',req:{rauta:6,puu:2,nahka:2},lvl:6},
  {id:'rautakilpi',st:'ahjo',req:{rauta:8,puu:4},lvl:7},
  {id:'rautapanssari',st:'ahjo',req:{rauta:12,nahka:6},lvl:7},
  // Harvinaiset: aukeavat korkeilla tasoilla ja vaativat hiidenkiviä
  {id:'hiidenjousi',st:'ahjo',req:{rauta:4,hiidenkivi:2,nahka:4},lvl:10},
  {id:'hiidenmiekka',st:'ahjo',req:{rauta:10,hiidenkivi:3,sydan:1},lvl:12},
  {id:'hiidenpanssari',st:'ahjo',req:{rauta:14,hiidenkivi:4,nahka:8},lvl:14},
];
/* v3.14 KALASTUSVARUSTEET (käyttäjä; logiikka tackle.js). Vapa = RUNKO (onki / kuparivapa / hiidenvapa), johon Kalastajan pöydällä kiinnitetään siima, koukku,
   kela ja koho (+ viehe, kun vavassa on kela). Kela tekee vavasta VIRVELIN (heitto 6–30 m, kelaus pohjassa, tärppi kelatessa). Osat ovat esineitä (tk = osan tyyppi).
   Rungon arvot: k = tärppiväli (pienempi = useammin), big = isojen kalojen keskipaino +%, bw = isojen lajien yleisyys, ten = siiman kestävyyden kerroin. */
Object.assign(ITEMS.onki,{rod:{k:1,ten:1,big:0,bw:1},d:'Puinen vavan runko. Osat (siima, koukku, kela, koho, viehe) vaihdetaan Kalastajan pöydällä. Vasen heittää veteen, vasen uudelleen kelaa sisään; tärpätessä paina vasenta. Mato: E vapa kädessä.'});
Object.assign(ITEMS.kuparivapa,{rod:{k:.95,ten:1.1,big:.1,bw:1.1},d:'Kuparisilattu runko: isot kalat keskimäärin 10 % painavampia ja isot lajit hieman yleisempiä. Osat vaihdetaan Kalastajan pöydällä.'});
Object.assign(ITEMS.hiidenvapa,{rod:{k:.9,ten:1.2,big:.2,bw:1.2},d:'Hiidenkiven siruista taottu runko: isot kalat keskimäärin 20 % painavampia, isot lajit yleisempiä ja siima kestää enemmän. (Harvinainen)'});
const TK_LINE={pellavasiima:{ten:1,dur:12,vis:1,col:0xe0d8c0},jannesiima:{ten:1.25,dur:25,vis:1.06,col:0xc8a070},punottusiima:{ten:1.55,dur:45,vis:1.12,col:0x6a8a5a},hiidensiima:{ten:1.9,dur:80,vis:1.18,col:0x5fe6d9}};
const TK_HOOK={pienikoukku:{big:.85,small:1.2,hk:.65,steal:1},isokoukku:{big:1.3,small:.7,hk:.75,steal:1},vakakoukku:{big:1.05,small:1,hk:.88,steal:.45,keep:1}};
const TK_REEL={kuparikela:{cast:22,spd:1.25,fk:1.15,tk:1,col:0xd98a4e},hiisikela:{cast:30,spd:1.6,fk:1.3,tk:.85,col:0x5fe6d9}};
const TK_FLOAT={puukoho:{win:0,steal:1,col:0xd83a2a},korkkikoho:{win:.15,steal:.8,col:0xe8b04a},hehkukoho:{win:.05,night:.3,steal:1,col:0x7af0d0,glow:1}};
/* Viehteet: w = vesi (järvi/meri/suo), ph = [aamu, päivä, ilta, yö], wx = sää, light = valo, jossa paras (bright kirkas päivä, dim hämärä/pilvi, dark yö/sumu), best = parhaat kalat ×2,2.
   Pikkukalat (koko 1, enintään ~0,7 kg) ×0,3 – viehe ei sovi niille. Viehteet eivät kulu; matalassa voivat jäädä kiinni (viehe + siima menetetään, hyvin harvoin). */
const TK_LURE={
  kuparilusikka:{col:0xd98a4e,c2:0xf0c080,sh:'spoon',best:['ahven','hauki','meritaimen'],w:{lake:1.2,sea:1,bog:.7},ph:[1.1,1.2,1,.6],wx:{selkea:1.3,pilvi:.9,sade:.8},light:'bright',d:'Kirkas kuparinen lusikka välkehtii auringossa.'},
  rautapilkki:{col:0x8a9098,c2:0xc8d0d8,sh:'jig',best:['turska','kuha','made'],w:{lake:.9,sea:1.4,bog:.6},ph:[1,1,1,1.1],wx:{tuuli:1.2,myrsky:1.3,selkea:.9},light:null,d:'Raskas rautapilkki uppoaa syvälle – merellä omimmillaan.'},
  puuvaappu:{col:0x6a8a3a,c2:0xe8d890,sh:'plug',best:['hauki','kuha','toutain'],w:{lake:1.3,sea:.8,bog:1},ph:[1.3,.8,1.3,.8],wx:{pilvi:1.3,tihku:1.2,selkea:.85},light:'dim',d:'Veistetty ja maalattu vaappu ui kuin vaivainen kala.'},
  hiidenhohtoviehe:{col:0x2a6a68,c2:0x5fe6d9,sh:'spoon',glow:1,best:['suonsilma','made','lohi'],w:{lake:1,sea:1.1,bog:1.3},ph:[.8,.6,1.1,1.6],wx:{sumu:1.5,sade:1.2,selkea:.8},light:'dark',d:'Hiidenkiven sirulla koristeltu viehe hohtaa pimeässä.'},
  pohjolanlusikka:{col:0xc8ccd0,c2:0xd98a4e,sh:'spoon',thin:1,best:['lohi','meritaimen','siika'],w:{lake:.9,sea:1.3,bog:.6},ph:[1.4,.8,1.2,.7],wx:{tuuli:1.3,sade:1.3,tihku:1.2,selkea:.8},light:'dim',d:'Ohut kaksivärinen lusikka pohjoisen koskien tapaan – lohikalojen herkku.'},
  valkelippa:{col:0xe0e4e8,c2:0xd84a3a,sh:'spin',best:['ahven','toutain','siika'],w:{lake:1.3,sea:.9,bog:.8},ph:[1,1.3,1,.4],wx:{selkea:1.3},light:'bright',d:'Pyörivä lippa ja lasihelmi – välke näkyy kauas kirkkaassa vedessä.'},
  verilusikka:{col:0xa82a22,c2:0xe8d0a0,sh:'spoon',best:['hauki','suutari','kuha'],w:{lake:1.1,sea:.8,bog:1.4},ph:[1,1,1.2,.9],wx:{sade:1.3,sumu:1.2,pilvi:1.1},light:'dim',d:'Puolukalla punaiseksi värjätty lusikka erottuu sameassa vedessä.'},
  pintavaappu:{col:0x3a3a2a,c2:0xd8c8a0,sh:'plug',top:1,best:['hauki','toutain','meritaimen'],w:{lake:1.3,sea:.9,bog:1},ph:[1.4,.6,1.5,.8],wx:{selkea:1.1,tuuli:.6,myrsky:.5},light:null,d:'Pinnalla pulputtava sulkavaappu – tyynellä säällä aamuin illoin.'},
  nahkajigi:{col:0x8a5a32,c2:0xd8a060,sh:'jig',soft:1,best:['kuha','ahven','kampela'],w:{lake:1.2,sea:1.1,bog:.9},ph:[1,1,1.1,1.2],wx:{pilvi:1.2,tihku:1.1},light:null,d:'Pehmeä nahkajigi pomppii pohjaa pitkin.'}};
/* Nimetyt yhdistelmät (pieni etu): osat = vaaditut (taulukko = jokin näistä); rod = runko, reel 0 = ei kelaa. */
const TK_COMBOS=[
  {id:'perinne',n:'Perinneonki',need:{rod:['onki'],line:['pellavasiima'],hook:['pienikoukku'],float:['puukoho'],reel:[0]},fx:{k:.92},t:'tärppi 8 % useammin'},
  {id:'yo',n:'Yön vartija',need:{float:['hehkukoho'],line:['jannesiima','punottusiima'],hook:['isokoukku','vakakoukku']},fx:{win:.12},t:'tärppi-ikkuna +0,12 s'},
  {id:'suo',n:'Suonkulkija',need:{float:['korkkikoho'],line:['jannesiima'],hook:['pienikoukku','vakakoukku']},fx:{steal:.7},t:'syötti katoaa 30 % harvemmin'},
  {id:'hauki',n:'Haukimiehen virveli',need:{line:['punottusiima','hiidensiima'],hook:['vakakoukku'],lure:['puuvaappu','verilusikka','pintavaappu']},fx:{big:.05},t:'isot kalat +5 %'},
  {id:'meri',n:'Merikarhu',need:{line:['punottusiima','hiidensiima'],hook:['isokoukku'],lure:['rautapilkki']},fx:{ten:.1},t:'siima kestää +10 %'},
  {id:'kupari',n:'Kuparikuningas',need:{rod:['kuparivapa'],reel:['kuparikela'],lure:['kuparilusikka']},fx:{k:.92},t:'tärppi 8 % useammin'},
  {id:'lohi',n:'Lohiretki',need:{line:['punottusiima','hiidensiima'],hook:['vakakoukku','isokoukku'],lure:['pohjolanlusikka']},fx:{hk:.08,ten:.05},t:'koukkuun tarttuu 8 % varmemmin, siima +5 %'},
  {id:'hiisi',n:'Hiiden valta',need:{rod:['hiidenvapa'],reel:['hiisikela'],line:['hiidensiima'],lure:['hiidenhohtoviehe']},fx:{big:.05,ten:.1},t:'isot kalat +5 %, siima +10 %'}];
const TK_SLOTS=[['line','Siima',TK_LINE],['hook','Koukku',TK_HOOK],['reel','Kela',TK_REEL],['float','Koho',TK_FLOAT],['lure','Viehe',TK_LURE]];
const TK_RIG0={line:'pellavasiima',lw:1,hook:'pienikoukku',reel:null,float:'puukoho',lure:null,bait:0};   // uusi tai vanha vapa: pellava + pieni koukku + puukoho
const PAKKI_SLOTS=[12,16,20,24],PAKKI_UP=[null,{puu:4,kupari:2},{rauta:3,nahka:2},{hiidensiru:2,rauta:2}],PAKKI_COL=[0x6a4a2a,0x2a5a7a,0x7a2a2a,0x2a6a5a];
Object.assign(ITEMS,{
  pellavasiima:{n:'Pellavasiima',w:.05,s:10,c:'#e0d8c0',tk:'line',d:'Kevyt ja huomaamaton siima. Ei kestä isojen kalojen rynnistystä kauan.'},
  jannesiima:{n:'Jännesiima',w:.05,s:10,c:'#c8a070',tk:'line',d:'Kuivatusta jänteestä kierretty sitkeä siima.'},
  punottusiima:{n:'Punottu siima',w:.05,s:10,c:'#6a8a5a',tk:'line',d:'Kolmesta narusta punottu ja pihkalla käsitelty vahva siima.'},
  hiidensiima:{n:'Hiidensiima',w:.05,s:10,c:'#5fe6d9',tk:'line',rar:'rare',d:'Hiidenkiven pölyllä kyllästetty siima kestää lähes mitä tahansa – mutta kalat näkevät sen. (Harvinainen)'},
  pienikoukku:{n:'Pieni koukku',w:.02,s:20,c:'#d8d0c0',tk:'hook',d:'Luusta veistetty pieni koukku: pikkukalat tarttuvat helposti, isot pääsevät useammin.'},
  isokoukku:{n:'Iso koukku',w:.03,s:20,c:'#d98a4e',tk:'hook',d:'Kuparinen iso koukku: isot kalat yleisempiä, pikkukalat jäävät useammin tarttumatta.'},
  vakakoukku:{n:'Väkäkoukku',w:.03,s:20,c:'#8a9098',tk:'hook',d:'Rautainen väkäkoukku: kala ei irtoa ja syötti pysyy paremmin.'},
  kuparikela:{n:'Kuparikela',w:.4,s:1,c:'#d98a4e',tk:'reel',d:'Kela tekee vavasta virvelin: heitto jopa 22 m vieheellä ja kelaus vasemmalla.'},
  hiisikela:{n:'Hiisikela',w:.4,s:1,c:'#5fe6d9',tk:'reel',rar:'rare',d:'Nopea ja tasainen kela: heitto jopa 30 m, kelaus ja väsytys selvästi tehokkaampia. (Harvinainen)'},
  puukoho:{n:'Puukoho',w:.02,s:20,c:'#d83a2a',tk:'float',d:'Tavallinen punavalkoinen koho.'},
  korkkikoho:{n:'Korkkikoho',w:.02,s:20,c:'#e8b04a',tk:'float',d:'Herkkä kaarnakoho näyttää varovaisenkin tärpin: tärppi-ikkuna pidempi.'},
  hehkukoho:{n:'Hehkukoho',w:.02,s:20,c:'#7af0d0',tk:'float',rar:'unc',d:'Hiidensirulla hohtava koho näkyy yöllä: yöllä tärppi-ikkuna selvästi pidempi.'},
  kalapakki:{n:'Kalastuspakki',w:20,s:1,c:'#6a4a2a',cat:'offhand',tk:'pakki',d:'Vain kalastustarvikkeille (vavat, osat, viehteet, madot, perkeet, kirja). Vasemmassa kädessä: vasen klikkaus laskee pakin maahan tai Kalastajan pöydän pakkipaikalle. Maassa E avaa, klikkaus nostaa. Vain yksi pakki mukana kerrallaan.'},
  kalafilee:{n:'Kalafilee',w:.2,s:30,c:'#e8b0a0',food:{h:4,raw:true},d:'Perattu kalafilee. Paista nuotiolla tai grillillä.'},
  filepaisti:{n:'Paistettu filee',w:.15,s:30,c:'#c8803a',food:{h:22,hp:12,st:5},d:'Nuotiolla paistettu kalafilee – kevyt ja ravitseva.'},
  perkeet:{n:'Perkeet',w:.1,s:50,c:'#8a5a4a',d:'Kalan perkeet. Katiskan syötti: houkuttelee kaloja paremmin kuin mato.'}});
for(const [id,L] of Object.entries(TK_LURE)){const nm={kuparilusikka:'Kuparilusikka',rautapilkki:'Rautapilkki',puuvaappu:'Puuvaappu',hiidenhohtoviehe:'Hiidenhohtoviehe',pohjolanlusikka:'Pohjolan lusikka',
  valkelippa:'Välkelippa',verilusikka:'Verilusikka',pintavaappu:'Pintavaappu',nahkajigi:'Nahkajigi'}[id];ITEMS[id]={n:nm,w:.05,s:10,c:'#'+L.col.toString(16).padStart(6,'0'),tk:'lure',rar:id==='hiidenhohtoviehe'?'rare':undefined,d:L.d+' Viehe kiinnitetään virveliin (vapa + kela) Kalastajan pöydällä.'};}
RECIPES.push({id:'kalapakki',st:'kalapoyta',req:{puu:8,nahka:2},lvl:3},
  {id:'pellavasiima',st:'kalapoyta',req:{naru:2},lvl:3},{id:'jannesiima',st:'kalapoyta',req:{nahka:1,naru:1},lvl:4},{id:'punottusiima',st:'kalapoyta',req:{naru:3,pihka:1},lvl:6},{id:'hiidensiima',st:'kalapoyta',req:{hiidensiru:1,naru:2},lvl:9},
  {id:'pienikoukku',st:'kalapoyta',req:{luu:1},lvl:3},{id:'isokoukku',st:'kalapoyta',req:{kupari:1},lvl:4},{id:'vakakoukku',st:'kalapoyta',req:{rauta:1},lvl:6},
  {id:'kuparikela',st:'kalapoyta',req:{kupari:4,puu:1},lvl:5},{id:'hiisikela',st:'kalapoyta',req:{hiidensiru:2,rauta:2},lvl:9},
  {id:'puukoho',st:'kalapoyta',req:{puu:1},lvl:3},{id:'korkkikoho',st:'kalapoyta',req:{puu:1,pihka:1},lvl:4},{id:'hehkukoho',st:'kalapoyta',req:{hiidensiru:1,pihka:1},lvl:7},
  {id:'kuparilusikka',st:'kalapoyta',req:{kupari:1},lvl:5},{id:'rautapilkki',st:'kalapoyta',req:{rauta:1},lvl:6},{id:'puuvaappu',st:'kalapoyta',req:{puu:1,pihka:1},lvl:5},
  {id:'hiidenhohtoviehe',st:'kalapoyta',req:{hiidensiru:1,kupari:1},lvl:9},{id:'pohjolanlusikka',st:'kalapoyta',req:{kupari:1,rauta:1},lvl:7},{id:'valkelippa',st:'kalapoyta',req:{kupari:1,lasi:1},lvl:6},
  {id:'verilusikka',st:'kalapoyta',req:{kupari:1,marjat:3},lvl:5},{id:'pintavaappu',st:'kalapoyta',req:{puu:2,sulka:1},lvl:6},{id:'nahkajigi',st:'kalapoyta',req:{nahka:1,rauta:1},lvl:6});
const RECIPE_BY={};RECIPES.forEach(r=>RECIPE_BY[r.id]=r);
const STATION_NAME={tyopenkki:'Työpenkki',nuotio:'Nuotio',grilli:'Grillinuotio',ahjo:'Ahjo',pata:'Keittopata',kalapoyta:'Kalastajan pöytä'};   // v3.02 pata: pataruoat   // v3.00 grilli: varras ja juhla-ateria
// Valmistusvälilehdet: Alkupeli (alku:1) on oletus, muut ryhmitellään esineen tyypin mukaan.
/* v3.08 käyttäjä: uudet kategoriat Nuolet, Kalastus, Viljely ja Pataruoat (ennen Aseet/Muut/Ruoka) */
const CRAFT_CATS=[['alku','Alkupeli'],['tyokalut','Työkalut'],['aseet','Aseet'],['nuolet','Nuolet'],['varusteet','Varusteet'],['ruoka','Ruoka'],['pata','Pataruoat'],['kalastus','Kalastus'],['viljely','Viljely'],['muut','Muut']];
function recipeCat(r){const d=ITEMS[r.id];if(d.food)return r.st==='pata'?'pata':'ruoka';if(/nuolet$/.test(r.id))return 'nuolet';if(d.cat==='rod'||d.tk||r.id==='kalakirja')return 'kalastus';if(typeof SEEDS!=='undefined'?SEEDS[r.id]:/varpu|rihma|siemen/.test(r.id))return 'viljely';if(d.cat==='armor'||d.cat==='shield')return 'varusteet';if(d.cat==='weapon'&&(d.chop||d.pick))return 'tyokalut';if(d.cat==='shovel'||d.cat==='hammer')return 'tyokalut';if(d.cat==='weapon'||d.cat==='bow'||r.id==='nuolet'||r.id==='tulinuolet')return 'aseet';return 'muut';}

/* ---------------- ICONS ---------------- */
// v3.08 lajikohtainen kalakuvake (myös paistettu: ruskea, grillijuovat)
function fishIcon(g,id,d,circ,line){if(typeof fishArtDraw==='function'){fishArtDraw(g,id.replace(/p$/,''),21,26,17,{ck:d.fishI===2,icon:1,rot:-.35});return;}   /* v3.15 piirretty kuvitus (fishbook.js) */const sp=id.replace(/p$/,''),f=FISH_DEF[sp],S=FISH_SHAPE[sp],ck=d.fishI===2,body=ck?'#a8642e':f.c,belly=ck?'#d89a5a':f.c2,fin=ck?'#7a4420':S.fin||body,ol='#1e1a14';
  const L=S.l,H=S.h,cx=S.flat?0:-2;g.save();g.translate(24,25);g.rotate(S.flat?-.15:S.eel?-.2:-.35);g.lineJoin='round';
  const outline=()=>{g.beginPath();if(S.eel){g.moveTo(-L,0);g.quadraticCurveTo(-L+3,-H,0,-H*.9);g.quadraticCurveTo(L*.8,-H*.7,L+2,0);g.quadraticCurveTo(L*.8,H*.7,0,H*.9);g.quadraticCurveTo(-L+3,H,-L,0);}
    else g.ellipse(cx,0,L,H,0,0,TAU);};
  // pyrstö ja evät (takana)
  g.fillStyle=fin;if(!S.eel&&!S.flat){g.beginPath();g.moveTo(cx+L-3,0);g.lineTo(cx+L+7,-H*.95-1);g.lineTo(cx+L+4,0);g.lineTo(cx+L+7,H*.95+1);g.closePath();g.fill();g.strokeStyle=ol;g.lineWidth=.9;g.stroke();}
  if(S.flat){g.beginPath();g.moveTo(L-1,0);g.lineTo(L+6,-4);g.lineTo(L+6,4);g.closePath();g.fill();g.globalAlpha=.75;g.beginPath();g.ellipse(0,0,L+2.2,H+2.2,0,0,TAU);g.fill();g.globalAlpha=1;}
  if(S.eel){g.globalAlpha=.8;g.beginPath();g.moveTo(-2,-H*.85);g.quadraticCurveTo(L*.6,-H*1.5,L+2,0);g.quadraticCurveTo(L*.6,-H*.6,-2,-H*.85);g.fill();g.globalAlpha=1;}
  else if(!S.flat){if(S.spine){g.beginPath();g.moveTo(cx-L*.45,-H*.8);for(let i=0;i<5;i++){g.lineTo(cx-L*.4+i*L*.13,-H-4.2);g.lineTo(cx-L*.34+i*L*.13,-H*.88);}g.lineTo(cx+L*.25,-H*.8);g.closePath();g.fill();g.strokeStyle=ol;g.lineWidth=.7;g.stroke();}
    else{g.beginPath();g.moveTo(cx-L*.25,-H*.85);g.quadraticCurveTo(cx,-H-4.5,cx+L*.3,-H*.85);g.closePath();g.fill();}
    g.beginPath();g.moveTo(cx+L*.25,H*.8);g.lineTo(cx+L*.4,H+3);g.lineTo(cx+L*.5,H*.75);g.closePath();g.fill();}
  // runko + vatsa
  g.fillStyle=body;outline();g.fill();g.save();outline();g.clip();g.fillStyle=belly;g.beginPath();g.ellipse(cx,H*.62,L*1.05,H*.6,0,0,TAU);g.fill();
  const r=mulberry32(sp.length*977+sp.charCodeAt(0));g.fillStyle='rgba(20,18,12,.55)';
  if(S.m==='bars')for(let i=0;i<6;i++){g.beginPath();g.ellipse(cx-L*.55+i*L*.24,-H*.25,1.4,H*.75,0,0,TAU);g.fill();}
  if(S.m==='spots'){g.fillStyle='rgba(230,226,170,.75)';for(let i=0;i<14;i++)circ(cx+(r()-.5)*L*1.6,(r()-.7)*H*1.1,.9+r()*.6,g.fillStyle);}
  if(S.m==='dots')for(let i=0;i<16;i++)circ(cx+(r()-.5)*L*1.6,(r()-.75)*H*1.1,.55+r()*.6,'rgba(30,24,14,.6)');
  if(S.m==='xs'){g.strokeStyle='rgba(15,12,10,.75)';g.lineWidth=.8;for(let i=0;i<10;i++){const x=cx+(r()-.45)*L*1.3,y=(r()-.8)*H*.9;g.beginPath();g.moveTo(x-1,y-1);g.lineTo(x+1,y+1);g.moveTo(x+1,y-1);g.lineTo(x-1,y+1);g.stroke();}}
  if(S.m==='mottle')for(let i=0;i<9;i++){g.beginPath();g.ellipse(cx+(r()-.5)*L*1.6,(r()-.6)*H,2+r()*2,1.2+r(),r()*3,0,TAU);g.fill();}
  if(S.m==='line'){g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1;g.beginPath();g.moveTo(cx-L*.75,-H*.1);g.quadraticCurveTo(cx,H*.05,cx+L*.85,-H*.05);g.stroke();}
  if(ck)for(let i=-1;i<2;i++)line(cx-4+i*6,-H+1,cx-2+i*6,H-1,1.4,'#5a2a0c');
  g.restore();g.strokeStyle=ol;g.lineWidth=1.2;outline();g.stroke();
  // pää: silmä(t), suu, viiksisäie
  const ex=S.flat?-L*.45:cx-L+(S.eel?4:4.2),ey=S.flat?-H*.35:-H*.2;
  if(S.flat){circ(ex,ey,1.5,'#f4f0e0');circ(ex,ey,.75,'#111');circ(ex+3.4,ey-1.8,1.5,'#f4f0e0');circ(ex+3.4,ey-1.8,.75,'#111');}
  else{circ(ex,ey,S.eel?1.3:1.8,ck?'#3a2010':S.eye||'#f4f0e0');if(!ck)circ(ex,ey,S.eel?.6:.9,'#111');}
  if(S.glow&&!ck){g.globalAlpha=.6;circ(ex,ey,4,'#8fe6c8');g.globalAlpha=1;}
  if(S.sn==='duck'){g.fillStyle=body;g.beginPath();g.moveTo(cx-L+1,-1.6);g.lineTo(cx-L-4.5,-.6);g.lineTo(cx-L-4.5,1);g.lineTo(cx-L+1,1.8);g.closePath();g.fill();g.strokeStyle=ol;g.lineWidth=.9;g.stroke();}
  if(S.bar)line(cx-L+1.5,H*.35,cx-L-1,H+2.5,1,ol);
  line(cx-L+(S.sn?-3:.6),.9,cx-L+3.4,1.6,.8,ol);
  g.restore();}
const ICON={};const ICONC={};   // v1.34: kuvakkeiden canvasit (maassa olevat 3D-kuvakkeet)
function icon(id){
  if(ICON[id])return ICON[id];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(64/48,64/48);const d=ITEMS[id];g.lineCap='round';g.lineJoin='round';
  const line=(x1,y1,x2,y2,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};
  const poly=(pts,col,out)=>{g.fillStyle=col;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();if(out){g.strokeStyle=out;g.lineWidth=1.5;g.stroke();}};
  const circ=(x,y,r,col,out)=>{g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();if(out){g.strokeStyle=out;g.lineWidth=1.5;g.stroke();}};
  const W='#8a5a32';
  if(d&&d.fishI&&FISH_SHAPE[id.replace(/p$/,'')]){fishIcon(g,id,d,circ,line);}
  else if(d&&(d.tk||id==='kalafilee'||id==='filepaisti'||id==='perkeet')&&typeof tkIcon==='function')tkIcon(g,id,d,circ,line,poly);   // v3.14 kalastusvarusteet (tackle.js)
  else if(d&&d.fishI){const f=FISH_DEF[id.replace(/p$/,'')]||{c:'#a8742e',c2:'#e0b060'},ck=d.fishI===2,sm=d.fishI===3,body=sm?'#a8742e':ck?'#a8642e':f.c,belly=sm?'#d8a050':ck?'#d89a5a':f.c2;
    g.save();g.translate(24,25);g.rotate(-.35);g.fillStyle=body;g.beginPath();g.ellipse(-2,0,15,7,0,0,TAU);g.fill();g.fillStyle=belly;g.beginPath();g.ellipse(-2,2.5,12,3.5,0,0,TAU);g.fill();
    g.fillStyle=body;g.beginPath();g.moveTo(11,0);g.lineTo(21,-7);g.lineTo(19,0);g.lineTo(21,7);g.closePath();g.fill();g.strokeStyle='#1e1a14';g.lineWidth=1.2;g.beginPath();g.ellipse(-2,0,15,7,0,0,TAU);g.stroke();
    circ(-11,-1.5,1.8,ck||sm?'#3a2010':'#f4f0e0');if(!ck&&!sm)circ(-11,-1.5,.9,'#111');if(ck||sm){line(-6,-5,-4,5,1.2,'#6a3a14');line(0,-6,2,5,1.2,'#6a3a14');line(6,-5,7,4,1.2,'#6a3a14');}
    if(id==='suonsilma'){g.globalAlpha=.6;circ(-11,-1.5,4,'#8fe6c8');g.globalAlpha=1;}g.restore();}
  else switch(id){
    case 'puu':g.save();g.translate(24,24);g.rotate(-.5);g.fillStyle='#8a5a32';g.fillRect(-16,-7,30,14);g.restore();circ(33,17,7,'#d2a46c','#5e3b1f');circ(33,17,3,'#a87a46');break;
    case 'kivi':poly([[10,32],[16,16],[30,12],[40,22],[36,36],[18,38]],'#8f8d86','#55534e');poly([[18,18],[28,15],[24,22]],'#a8a69e');break;
    case 'piikivi':poly([[12,38],[20,12],[28,20],[36,10],[34,36]],'#4d535c','#2b2f35');line(20,14,24,34,1.5,'#7a8592');break;
    case 'kulho':case 'vesikulho':{g.fillStyle='#6a4426';g.beginPath();g.ellipse(24,22,17,6,0,0,TAU);g.fill();g.fillStyle=id==='vesikulho'?'#4f9ccc':'#3a2614';g.beginPath();g.ellipse(24,22,14,4.4,0,0,TAU);g.fill();
      g.fillStyle='#a8743e';g.strokeStyle='#3b2a1a';g.lineWidth=1.4;g.beginPath();g.moveTo(7,22);g.quadraticCurveTo(10,40,24,40);g.quadraticCurveTo(38,40,41,22);g.closePath();g.fill();g.stroke();line(12,28,36,28,1,'#c99256');
      if(id==='vesikulho'){line(16,21,26,21,1.4,'#bfe6ff');}break;}
    case 'naru':{g.strokeStyle='#8a7350';g.lineWidth=4;for(const r of [14,10,6]){g.beginPath();g.ellipse(24,24,r+3,r,0,0,TAU);g.stroke();}g.strokeStyle='#d9c69a';g.lineWidth=1.6;for(const r of [14,10,6]){g.beginPath();g.ellipse(24,24,r+3,r,0,0,TAU);g.stroke();}line(37,26,44,38,3,'#8a7350');break;}
    case 'pihka':poly([[24,8],[34,26],[30,38],[18,38],[14,26]],'#dc9d2c','#8a5a18');circ(21,26,3,'#f6cf72');break;
    case 'nahka':poly([[10,14],[20,10],[28,13],[38,10],[40,22],[36,38],[24,34],[12,38],[8,26]],'#a06d45','#5e3b1f');break;
    case 'luu':line(14,34,34,14,6,'#e7e1cf');circ(12,34,4,'#e7e1cf');circ(16,38,4,'#e7e1cf');circ(34,10,4,'#e7e1cf');circ(38,14,4,'#e7e1cf');break;
    case 'malmi':poly([[8,32],[14,14],[30,10],[42,22],[38,38],[16,40]],'#6e6862','#3f3b37');[[18,22],[30,18],[26,30],[34,28]].forEach(p=>circ(p[0],p[1],3,'#d9874a'));break;
    case 'rautamalmi':poly([[8,32],[14,14],[30,10],[42,22],[38,38],[16,40]],'#5f5a56','#34302d');[[18,22],[30,18],[26,30],[34,28]].forEach(p=>circ(p[0],p[1],3,'#a8644e'));break;
    case 'rauta':poly([[8,32],[14,20],[40,20],[44,32]],'#8a96a3','#4a525c');poly([[14,20],[18,14],[36,14],[40,20]],'#b8c2cc');break;
    case 'tervaspuu':g.save();g.translate(24,24);g.rotate(-.5);g.fillStyle='#4a3424';g.fillRect(-16,-7,30,14);g.restore();circ(33,17,7,'#7a5638','#2a1c12');circ(33,17,3,'#5a3e28');break;
    case 'kupari':poly([[8,32],[14,20],[40,20],[44,32]],'#e0904f','#8f5326');poly([[14,20],[18,14],[36,14],[40,20]],'#f2b07a');break;
    case 'hiidenkivi':poly([[24,6],[34,20],[30,40],[18,40],[14,20]],'#7fd6cc','#2f8f86');poly([[24,10],[28,20],[24,34],[20,20]],'#c9fff8');break;
    case 'jaaavain':case 'aarniavain':case 'luuavain':{const c1=id==='jaaavain'?'#9fd8ff':id==='luuavain'?'#e6e0cf':'#7aff9a',c2=id==='jaaavain'?'#3d7fa8':id==='luuavain'?'#8a8070':'#2f8f4a';circ(15,15,9,c1,c2);circ(15,15,4,'#13110e');line(21,21,40,40,5,c1);line(33,33,38,28,4,c1);line(38,38,42,34,4,c1);line(21,21,40,40,1.5,c2);break;}
    case 'sinetti':circ(24,24,15,'#e6e0cf','#6a5a8a');circ(24,24,11,'#c9b8ff','#8a78b8');circ(19,21,3,'#2a2236');circ(29,21,3,'#2a2236');poly([[24,24],[21,30],[27,30]],'#2a2236');line(18,33,30,33,2,'#2a2236');line(24,9,24,4,3,'#e6e0cf');break;   // v2.62 kallosinetti
    case 'kruunusirpale':poly([[10,30],[16,14],[22,26],[28,8],[34,24],[40,16],[38,36],[12,38]],'#9aff7a','#2f6a2a');poly([[16,18],[22,28],[28,12],[30,26]],'#e8ffd8');circ(24,33,3,'#ffe27a');break;
    case 'parannusjuoma':case 'elpymisjuoma':case 'sisujuoma':{const lc=d.c,dk=id==='parannusjuoma'?'#6a1018':id==='elpymisjuoma'?'#145a24':'#14306a';   // v2.00 pullo: lasi, neste, korkki, heijastus
      circ(24,30,12,'rgba(210,235,240,.55)','#3a4a50');g.save();g.beginPath();g.arc(24,30,10.5,0,TAU);g.clip();g.fillStyle=lc;g.fillRect(10,25,28,18);g.fillStyle=dk;g.fillRect(10,38,28,6);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(10,25,28,2);g.restore();
      g.fillStyle='rgba(210,235,240,.6)';g.fillRect(20,11,8,10);g.strokeStyle='#3a4a50';g.lineWidth=1.5;g.strokeRect(20,11,8,10);g.fillStyle='#8a5a32';g.fillRect(19,6,10,6);g.strokeStyle='#4a2e18';g.strokeRect(19,6,10,6);
      line(17,24,15,32,2.5,'rgba(255,255,255,.75)');circ(30,33,1.6,'rgba(255,255,255,.6)');break;}
    case 'sydan':circ(18,20,9,'#5fe6d9');circ(30,20,9,'#5fe6d9');poly([[10,24],[38,24],[24,40]],'#5fe6d9');circ(20,18,3,'#d8fffb');break;
    case 'liha':case 'paisti':case 'suurliha':case 'suurpaisti':{const k=id[0]==='s'?1.2:1;circ(28,22,12*k,d.c,'#4a2216');line(18,32,9,41,5,'#e7e1cf');circ(8,42,3.5,'#e7e1cf');if(id.endsWith('paisti'))line(22,18,34,24,2,'#c47a4a');break;}
    case 'pienliha':case 'pienpaisti':circ(30,20,8,d.c,'#4a2216');line(24,26,12,40,3.5,'#e7e1cf');circ(11,41,3,'#e7e1cf');if(id==='pienpaisti')line(26,17,34,21,2,'#c47a4a');break;
    case 'lihakeitto':circ(24,30,15,'#5a4636','#2a1e16');circ(24,27,11,d.c,'#6a4a26');circ(19,25,3,'#8d4b2b');circ(28,29,3,'#c8a26b');line(36,16,42,6,2.5,'#c9b48a');break;
    case 'villikaura':for(const [x,a] of [[16,-.25],[24,0],[32,.25]]){line(x,42,x+a*30,8,1.6,'#8a7a3a');for(let k=0;k<5;k++){const t=k/5,yy=12+t*18,xx=x+a*30*(1-(yy-8)/34);g.fillStyle='#d6b96a';g.beginPath();g.ellipse(xx-2.5,yy,2.4,1.3,-.6,0,TAU);g.fill();g.beginPath();g.ellipse(xx+2.5,yy+1,2.4,1.3,.6,0,TAU);g.fill();}}break;
    case 'keittopata':case 'pilapata':{const sp=id==='pilapata';poly([[9,20],[39,20],[37,36],[30,41],[18,41],[11,36]],sp?'#2a2420':'#3d3d40',sp?'#120e0c':'#1a1a1c');g.fillStyle=sp?'#0c0a09':'#55565a';g.beginPath();g.ellipse(24,20,15,4,0,0,TAU);g.fill();
      line(10,19,6,12,2,'#6a6a70');line(38,19,42,12,2,'#6a6a70');line(6,12,42,12,1.5,'#8a8a90');if(sp){circ(20,20,2,'#3a3330');circ(28,19,1.5,'#3a3330');}else line(14,28,18,34,1.5,'rgba(255,255,255,.18)');break;}
    case 'puolukkahillo':g.fillStyle='rgba(210,235,240,.5)';g.fillRect(14,14,20,26);g.strokeStyle='#3a4a50';g.lineWidth=1.5;g.strokeRect(14,14,20,26);g.fillStyle=d.c;g.fillRect(15.5,20,17,18.5);g.fillStyle='#c8a26b';g.fillRect(12,9,24,6);circ(20,28,2,'#e04a5a');circ(27,32,2,'#e04a5a');line(17,22,17,34,1.5,'rgba(255,255,255,.4)');break;
    case 'sienikeitto':case 'puolukkapuuro':case 'sienipata':case 'sienirisotto':case 'riistakeitto':case 'juhlapata':{const big=id==='juhlapata';circ(24,30,big?17:15,big?'#3d3d40':'#5a4636',big?'#1a1a1c':'#2a1e16');circ(24,27,big?13:11,d.c,'#4a3020');
      const dots={sienikeitto:[['#e4d4b2',19,25],['#9b6a3a',28,28],['#9b6a3a',23,30]],puolukkapuuro:[['#c82a3c',19,26],['#c82a3c',28,27],['#c82a3c',24,31],['#f0e2c8',22,24]],sienipata:[['#9b6a3a',19,26],['#c9554e',28,28],['#e4d4b2',23,31]],sienirisotto:[['#9b6a3a',19,27],['#9b6a3a',29,26],['#f4ead2',24,30],['#f4ead2',21,23]],riistakeitto:[['#6e3520',19,26],['#8d4b2b',28,29],['#c8a26b',24,24]],juhlapata:[['#6e3520',18,26],['#8d4b2b',29,28],['#c82a3c',24,23],['#c8a26b',22,32],['#d6b96a',30,22]]}[id];
      for(const [c,x,y] of dots)circ(x,y,big?3.5:3,c);if(id!=='juhlapata')line(36,16,42,6,2.5,'#c9b48a');else{line(8,22,4,14,2,'#6a6a70');line(40,22,44,14,2,'#6a6a70');}break;}
    case 'juhla':circ(24,30,17,'#d8d0bc','#8a8070');circ(20,27,8,'#6e3520','#3a1a10');circ(30,30,6,'#8d4b2b','#4a2216');circ(28,22,3,'#c82a3c');circ(32,24,3,'#c82a3c');circ(16,34,3.5,'#c8a26b');break;
    case 'kuusenkapy':case 'mannynkapy':case 'pihkakapy':case 'pihkamannynkapy':{const pine=id.includes('mannyn'),rz=id.startsWith('pihka'),base=pine?'#8a6a44':'#7a5634';g.save();g.translate(24,25);g.rotate(pine?-.3:-.5);
      g.fillStyle=base;g.beginPath();g.ellipse(0,0,pine?9:7,pine?13:17,0,0,TAU);g.fill();g.strokeStyle='#3e2a16';g.lineWidth=1.2;for(let k=-3;k<=3;k++){g.beginPath();g.moveTo(-8,k*4);g.lineTo(0,k*4+3);g.lineTo(8,k*4);g.stroke();}
      g.restore();line(24,8,26,3,2,'#5e3b1f');if(rz){circ(30,20,3.2,'#f2b640','#9a6a10');circ(19,31,2.4,'#f2b640','#9a6a10');}break;}
    case 'koivunsiemen':for(const [x,y,a] of [[16,24,-.4],[26,18,.2],[32,30,.6]]){g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#e6dcb0';g.beginPath();g.ellipse(-5,0,5,3,0,0,TAU);g.ellipse(5,0,5,3,0,0,TAU);g.fill();g.fillStyle='#8a6a3a';g.beginPath();g.ellipse(0,0,2,3.5,0,0,TAU);g.fill();g.restore();}break;
    case 'aarnisiemen':poly([[24,6],[36,24],[24,42],[12,24]],'#3a6a32','#1a3a1a');circ(24,24,5,'#9ad06a');line(24,10,24,38,1.2,'#1a3a1a');break;
    case 'puolukanvarpu':g.fillStyle='#5a3a22';g.fillRect(18,34,12,6);line(24,34,24,12,2,'#5a4a2a');for(const [x,y] of [[18,16],[30,18],[17,26],[31,27],[24,10]]){g.fillStyle='#3f7a2a';g.beginPath();g.ellipse(x,y,4.5,3,0,0,TAU);g.fill();}circ(28,22,2.6,'#c82a3c');break;
    case 'sienirihma':g.strokeStyle='#efe6d2';g.lineWidth=1.4;for(let k=0;k<9;k++){g.beginPath();g.moveTo(24,30);g.quadraticCurveTo(24+Math.cos(k)*14,30+Math.sin(k*1.7)*10,24+Math.cos(k*.7)*20,26+Math.sin(k)*14);g.stroke();}g.fillStyle='#5a4a32';g.fillRect(10,34,28,6);circ(24,28,4,'#9b6a3a');break;
    case 'kauransiemen':for(let k=0;k<7;k++){const x=12+(k%4)*8+(k>3?4:0),y=k>3?30:20;g.save();g.translate(x,y);g.rotate(.4+k*.3);g.fillStyle='#e0cc8a';g.beginPath();g.ellipse(0,0,2.6,5.5,0,0,TAU);g.fill();g.strokeStyle='#9a8a4a';g.lineWidth=.8;g.stroke();g.restore();}break;
    case 'onki':case 'kuparivapa':case 'hiidenvapa':{const c=id==='onki'?'#9a7a4a':id==='kuparivapa'?'#d98a4e':'#5fe6d9';line(8,42,40,6,2.6,'#6a4a2a');line(26,22,40,6,1.6,c);g.strokeStyle='rgba(230,230,230,.8)';g.lineWidth=.8;g.beginPath();g.moveTo(40,6);g.quadraticCurveTo(44,24,38,40);g.stroke();
      circ(14,35,4,c,'#2a1e14');circ(38,40,2.2,'#d83a2a','#fff');break;}
    case 'mato':g.strokeStyle='#c87a7a';g.lineWidth=4;g.beginPath();g.moveTo(10,30);g.bezierCurveTo(16,14,26,40,32,22);g.quadraticCurveTo(36,14,40,20);g.stroke();g.strokeStyle='#e8a8a0';g.lineWidth=1;g.stroke();break;
    case 'saapas':poly([[16,8],[28,8],[28,30],[40,32],[40,40],[14,40],[14,28]],'#4a3a2a','#1e140a');line(16,14,28,14,1.5,'#6a5a40');circ(34,24,2,'#4f8fb8');circ(22,44,1.5,'#4f8fb8');break;
    case 'pulloposti':g.save();g.translate(24,24);g.rotate(-.6);g.fillStyle='rgba(120,190,160,.55)';g.fillRect(-14,-7,24,14);g.fillRect(10,-3,7,6);g.strokeStyle='#2a5a4a';g.lineWidth=1.2;g.strokeRect(-14,-7,24,14);g.fillStyle='#8a5a32';g.fillRect(16,-3,4,6);g.fillStyle='#efe2c0';g.fillRect(-11,-4,16,8);line(-9,-1,3,-1,.8,'#7a6a50');line(-9,2,1,2,.8,'#7a6a50');g.restore();break;
    case 'ruostavain':circ(14,24,7,'#9a5a3a','#4a2a14');circ(14,24,3,'#2a1a10');line(20,24,40,24,3,'#9a5a3a');line(34,24,34,31,2.5,'#9a5a3a');line(39,24,39,30,2.5,'#9a5a3a');circ(28,22,1.5,'#c08a5a');break;
    case 'hiidensiru':poly([[20,10],[30,18],[26,38],[16,32]],'#5fe6d9','#1f7f78');line(22,14,24,32,1,'#d2fffb');break;
    case 'kalakirja':poly([[10,10],[36,8],[38,40],[12,42]],'#6a4a2a','#2a1a0c');line(14,12,16,40,2,'#3a2614');g.save();g.translate(26,25);g.scale(.45,.45);g.fillStyle='#d8c8a0';g.beginPath();g.ellipse(-2,0,15,7,0,0,TAU);g.fill();g.beginPath();g.moveTo(11,0);g.lineTo(21,-7);g.lineTo(21,7);g.fill();g.restore();break;
    case 'kalakeitto':case 'lohikeitto':case 'kalakukko':{if(id==='kalakukko'){g.fillStyle='#8a5a2a';g.beginPath();g.ellipse(24,28,17,11,0,0,TAU);g.fill();g.strokeStyle='#4a2a10';g.lineWidth=1.5;g.stroke();line(12,26,36,26,1,'#b8844a');circ(20,24,1.5,'#b8844a');break;}
      circ(24,30,15,'#5a4636','#2a1e16');circ(24,27,11,d.c,'#4a3020');for(const [c,x,y] of id==='lohikeitto'?[['#e88a6a',19,26],['#e88a6a',28,28],['#f4ead2',24,31]]:[['#f4ead2',19,26],['#9b6a3a',28,28],['#f4ead2',24,31]])circ(x,y,3,c);line(36,16,42,6,2.5,'#c9b48a');break;}
    case 'marjat':[[18,20],[28,18],[22,29],[32,28],[15,31]].forEach(p=>circ(p[0],p[1],6,'#c82a3c','#6a1220'));line(22,8,24,16,2,'#5a7a2a');break;
    case 'sieni':g.fillStyle='#efe6d2';g.fillRect(20,24,8,16);poly([[8,26],[14,12],[24,8],[34,12],[40,26]],'#9b6a3a','#5e3b1f');break;
    case 'varras':line(8,40,40,8,2.5,'#c9b48a');[[16,32,'#8d4b2b'],[24,24,'#c8a26b'],[32,16,'#8d4b2b']].forEach(p=>circ(p[0],p[1],5.5,p[2]));circ(20,28,3,'#c82a3c');break;
    case 'hiekka':poly([[6,38],[14,24],[24,18],[34,24],[42,38]],'#d8c38c','#9a8452');[[16,32],[24,27],[31,33],[22,35],[28,30]].forEach(p=>circ(p[0],p[1],1.2,'#b39a62'));circ(33,29,2.5,'#f2ecdf','#9a8452');break;
    case 'lasi':poly([[10,12],[36,8],[40,36],[14,40]],'rgba(170,215,232,.75)','#5a8ea2');line(16,16,22,15,2,'rgba(255,255,255,.85)');line(16,21,30,18,1.5,'rgba(255,255,255,.6)');line(30,34,36,33,1.5,'rgba(255,255,255,.5)');break;
    case 'puunuolet':for(let i=0;i<3;i++){line(10+i*5,40,32+i*5,10,2,'#c9b48a');poly([[32+i*5,10],[35+i*5,7],[34+i*5,13]],'#8a5a32');}break;
    case 'nuolet':for(let i=0;i<3;i++){line(10+i*5,40,32+i*5,10,2,'#c9b48a');poly([[32+i*5,10],[36+i*5,6],[34+i*5,14]],'#4d535c');}break;
    case 'karhuntalja':poly([[8,18],[14,10],[20,14],[28,14],[34,10],[40,18],[36,26],[40,36],[32,40],[24,36],[16,40],[8,36],[12,26]],'#5a4030','#2e2016');circ(24,12,5,'#4a3426');break;
    case 'sulka':line(12,40,34,8,2.5,'#2a2a2e');poly([[34,8],[22,20],[16,32],[20,30],[30,18]],'#3a3a40','#1d1d22');poly([[34,8],[28,24],[22,32],[26,26],[33,16]],'#55555e');break;
    case 'sulkanuolet':for(let i=0;i<3;i++){line(10+i*5,40,32+i*5,10,2,'#c9b48a');poly([[32+i*5,10],[36+i*5,6],[34+i*5,14]],'#4d535c');poly([[10+i*5,40],[8+i*5,34],[13+i*5,36]],'#2a2a2e');}break;
    case 'tulinuolet':for(let i=0;i<3;i++){line(10+i*5,40,30+i*5,13,2,'#c9b48a');circ(33+i*5,9,4,'#ff7a1a');circ(34+i*5,8,2.2,'#ffd36a');}break;
    case 'hiili':poly([[10,34],[16,18],[28,14],[38,24],[34,38],[16,40]],'#2a2623','#0f0d0c');poly([[18,22],[26,18],[24,26]],'#4a4540');circ(30,30,2.5,'#ff7a2a');break;
    case 'sienipaisti':g.fillStyle='#e4d4b2';g.fillRect(20,24,8,16);poly([[8,26],[14,12],[24,8],[34,12],[40,26]],'#7a4a22','#3a2210');break;
    case 'kilpi':case 'kuparikilpi':case 'rautakilpi':{const T={kilpi:['#8a5a32','#b88652','#6e7680','#3a3f45'],kuparikilpi:['#c87a3e','#f0a868','#e9b07a','#7a4318'],rautakilpi:['#8c97a4','#c3cdd8','#d6dee8','#454d58']}[id];
      circ(24,24,19.5,T[3]);circ(24,24,17.5,T[0]);
      g.save();g.beginPath();g.arc(24,24,17,0,TAU);g.clip();
      if(id==='kilpi'){for(let x=8;x<42;x+=6){g.fillStyle=(x/6|0)%2?'#7a4d28':'#97663a';g.fillRect(x,4,6,40);}for(let y of[16,32])line(4,y,44,y,2.5,T[2]);}
      else{const gr=g.createRadialGradient(18,16,2,24,24,20);gr.addColorStop(0,T[1]);gr.addColorStop(1,T[0]);g.fillStyle=gr;g.fillRect(0,0,48,48);
        line(24,5,24,43,5,T[2]);line(5,24,43,24,5,T[2]);for(let a=0;a<8;a++){const x=24+Math.cos(a*.785+.39)*12,y=24+Math.sin(a*.785+.39)*12;circ(x,y,1.5,T[3]);}}
      g.restore();g.strokeStyle=T[2];g.lineWidth=3;g.beginPath();g.arc(24,24,17.5,0,TAU);g.stroke();
      circ(24,24,7,T[3]);circ(24,24,5.5,T[2]);circ(22.5,22.5,2,'#fff8');for(let a=0;a<12;a++)circ(24+Math.cos(a*.5236)*17.5,24+Math.sin(a*.5236)*17.5,1.1,T[3]);break;}
    case 'nahkavaatteet':case 'karhuhaarniska':case 'kuparipanssari':case 'rautapanssari':case 'hiidenpanssari':poly([[14,10],[20,8],[24,12],[28,8],[34,10],[42,18],[36,22],[34,40],[14,40],[12,22],[6,18]],d.c,'#3b2a1a');if(id==='kuparipanssari'||id==='rautapanssari'||id==='hiidenpanssari')for(let y=16;y<38;y+=6)line(16,y,32,y,1.5,id==='rautapanssari'?'#4a525c':'#8f5326');break;
    // v1.56: kaari tähtäyssuuntaan (oikealle), jänne kärkien välissä vasemmalla, nuoli jänteeltä kaaren läpi (ennen kaari ja jänne väärin päin)
    case 'jousi':case 'hiidenjousi':{const col=id==='jousi'?'#8a5a32':'#5fe6d9';g.strokeStyle='#3b2a1a';g.lineWidth=6;g.beginPath();g.arc(14,24,22,-Math.PI*.38,Math.PI*.38);g.stroke();g.strokeStyle=col;g.lineWidth=4;g.beginPath();g.arc(14,24,22,-Math.PI*.38,Math.PI*.38);g.stroke();
      line(22.3,3.8,22.3,44.2,1.2,'#f1ecdc');line(10,24,42,24,1.6,'#c9b48a');poly([[44,24],[39,21],[39,27]],'#8f8d86');for(const y of[21,27])line(10,y,15,24,1.6,'#e8e2d2');if(id!=='jousi'){circ(36,24,3,'#c9fff8');}break;}
    default:{
      // Työkalut piirretään vinoon: origo kahvan alapäässä, +x kahvaa pitkin ylös oikealle, +y kohtisuoraan (alas oikealle).
      const tier=/rauta/.test(id)?['#aab6c4','#e4ecf5','#4a525c']:/kupari|^miekka$/.test(id)?['#e0904f','#ffc58f','#8f5326']:/hiiden/.test(id)?['#5fe6d9','#d2fffb','#1f7f78']:['#8f8d86','#c7c5bd','#4e4c48'];
      const wd=(len,w)=>{const gr=g.createLinearGradient(0,-w/2,0,w/2);gr.addColorStop(0,'#b07a46');gr.addColorStop(1,'#5a3a1c');g.fillStyle=gr;g.fillRect(0,-w/2,len,w);g.strokeStyle='#2e1d0e';g.lineWidth=1;g.strokeRect(0,-w/2,len,w);};
      const metal=(pts)=>{const gr=g.createLinearGradient(0,-8,0,10);gr.addColorStop(0,tier[1]);gr.addColorStop(.5,tier[0]);gr.addColorStop(1,tier[2]);g.fillStyle=gr;g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fill();g.strokeStyle='#1f1a16';g.lineWidth=1.3;g.stroke();};
      g.save();g.translate(6,43);g.rotate(-Math.PI/4);
      if(/kirves/.test(id)){wd(46,4.4);metal([[29,-3],[44,-4],[46,2],[43,13],[35,9],[29,3]]);line(44,-3,45,12,1.4,'#fff');for(const x of[30,32])line(x,-3,x,3,1.5,'#2e1d0e');}
      else if(/hakku/.test(id)){wd(46,4.4);g.lineCap='butt';for(const [w,c] of[[8,'#1f1a16'],[5.5,tier[0]]]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(35,-17);g.quadraticCurveTo(49,0,35,17);g.stroke();}
        poly([[33,-19],[38,-17],[36,-13]],tier[1]);poly([[33,19],[38,17],[36,13]],tier[1]);g.fillStyle='#3a3a3a';g.fillRect(38,-3.5,6,7);}
      else if(id==='lapio'){wd(37,4);g.fillStyle='#6b4527';g.fillRect(-1,-7,5,14);g.strokeStyle='#2e1d0e';g.strokeRect(-1,-7,5,14);metal([[33,-8],[43,-9],[50,0],[43,9],[33,8]]);line(36,0,47,0,1.5,'#fff9');}
      else if(id==='kuokka'){wd(42,4);metal([[34,0],[38,-1],[40,14],[34,16],[32,3]]);line(36,2,37,14,1.2,'#fff8');}
      else if(id==='keihas'){wd(40,3.2);metal([[38,0],[41,-5],[52,0],[41,5]]);line(38,0,51,0,1,'#fff9');for(let k=0;k<3;k++)line(33+k*2,-3,35+k*2,3,1.5,'#7a2a22');}
      else if(id==='nuija'){wd(30,5);g.fillStyle='#7a5230';g.strokeStyle='#2e1d0e';g.lineWidth=1.3;g.beginPath();g.moveTo(26,-2.5);g.lineTo(34,-5);g.quadraticCurveTo(48,-10,48,0);g.quadraticCurveTo(48,10,34,5);g.lineTo(26,2.5);g.closePath();g.fill();g.stroke();for(const [x,y] of[[38,-5],[42,0],[38,5],[34,0]])circ(x,y,1.6,'#9a9a92');}
      else if(id==='vasara'){wd(40,4.4);g.fillStyle='#7c6a52';g.strokeStyle='#1f1a16';g.lineWidth=1.3;g.fillRect(36,-10,9,20);g.strokeRect(36,-10,9,20);g.fillStyle='#4b4338';g.fillRect(36,-10,2.5,20);g.fillRect(42.5,-10,2.5,20);line(39,-8,39,8,1.2,'#fff6');}
      else if(/miekka/.test(id)){const gr=g.createLinearGradient(0,-3,0,3);gr.addColorStop(0,tier[1]);gr.addColorStop(1,tier[2]);g.fillStyle=gr;g.beginPath();g.moveTo(13,-3);g.lineTo(40,-3);g.lineTo(49,0);g.lineTo(40,3);g.lineTo(13,3);g.closePath();g.fill();g.strokeStyle='#1f1a16';g.lineWidth=1.2;g.stroke();line(14,0,40,0,1,'#fff8');
        g.fillStyle='#8f5326';g.fillRect(10,-8,4,16);g.strokeRect(10,-8,4,16);g.fillStyle='#4a2f18';g.fillRect(1,-2,9,4);circ(0,0,3.2,'#c9a24a','#3b2a1a');for(const x of[3,5.5,8])line(x,-2,x,2,1,'#1f1a16');}
      else if(id==='puukko'){g.fillStyle='#4a2f18';g.fillRect(2,-3.5,18,7);g.strokeStyle='#1f1a16';g.lineWidth=1;g.strokeRect(2,-3.5,18,7);for(const x of[6,10,14])line(x,-3.5,x,3.5,1,'#2e1d0e');g.fillStyle='#c9a24a';g.fillRect(19,-4.5,3,9);metal([[22,-3],[40,-2.5],[47,1],[40,3],[22,3]]);line(24,-1,42,-.5,1,'#fff9');}
      else if(id==='soihtu'){wd(38,4.6);circ(42,0,8,'#ff7a1a');circ(44,0,5.5,'#ffb43a');circ(46,0,3,'#fff0a8');}
      else if(id==='vasara_'){}
      else{wd(44,4);metal([[30,-4],[44,-4],[44,4],[30,4]]);}
      g.restore();
    }
  }
  ICONC[id]=c;return ICON[id]=c.toDataURL();
}
