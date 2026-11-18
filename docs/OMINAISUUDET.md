# Hiidenmaa – ominaisuudet ja fysiikat (v0.64)

Tämä on pelin nykytilan **viiteopas**: mitä pelissä on ja miten se toimii (säännöt, arvot, fysiikka).
Versiohistoria, päätösten taustat ja ideajono ovat `KEHITYSMUISTIO.md`:ssä. Päivitä tämä tiedosto aina,
kun ominaisuus tai arvo muuttuu (tiedosto ja funktio suluissa, jotta kohta löytyy koodista).

---

## 1. Maailma
- **v2.69 seed:** jokaisella maailmalla oma seed (näkyy maailmalistassa). Seed määrää porttien, raunioiden, arkkukivien, riimukivien (paitsi rannan
  aloituskiven), Avaimen kätkijän, leirien, kiviröykkiöiden, kylttien ja kasvillisuuden paikat; saaren muoto, aloitusranta, Hautakumpu ja Kalmankehä
  pysyvät kartan mukaan. Vanhat maailmat (ennen v2.69) säilyttävät vanhat paikat. Ulottuvuudet arvotaan maailmakohtaisesti.

- **Vihollisten syntyminen (v0.83):** yöllä 90 % 55–85 m päähän (vaeltavat), 10 % 20–30 m päähän puun/kiven taakse; aarnimetsä vetää
  vihollisia (yöllä tahti 1,5 s, raja 18). Päivällä enintään 2 vihollista (aarnimetsässä 3) ja vain korpimetsässä, suolla, kankaalla,
  nummella ja aarnimetsässä. Aarnimetsässä viholliset +20 % nopeampia, ilmoitus alueelle astuessa.
- **Biomit (`biomeAt`/`zoneAt`/`BIOMES`, world.js, v0.82):** Rantaniitty (aloitus), Koivulehto, Korpimetsä, Upposuo (liike −15 %, lätäköt),
  Jäkäläkangas (männyt, piikivi), Aarnimetsä, Kalmanummi, Tunturikangas, Rakka (lohkareet, kupari), Kivivuori, Routahuiput (> 33 m),
  Hietaranta. Nimi näkyy minikartan alla, ominaisuudet repussa. Ensimmäisellä käynnillä "Uusi alue löydetty: …" (häivytys), `flags.bio`.
- **Kartat (`MAPS`, world.js):** 6 karttaa – Hiidenmaa, Kalmansaaret (saaristo), Tunturinniemi (iso vuoristo), Routasaari (vuoristo idässä,
  laajat tunturit), Aarnikorpi (neljä aarnimetsää), Nummiluodot (iso keskijärvi, laaja nummi). Uusi peli arpoo kartan; vaihto lataa sivun.
- **Koko:** noin ±350 m (`HALF`), korkeusruudukko 2 m (`GS`), skaala `WS` = 1,75. Reunat laskevat mereen.
- **Biomit (`biomeAt`):** meri, ranta, niitty, metsä, aarnimetsä (sumuinen, pimeä, 14–22 m puut), vuori (yli `mtnH` 23 m, lumi yli 33 m),
  kalmanummi. Kartoittain säädettävä: `moorR` (nummen säde), `mtnH` (vuoriraja), `meadowT` (niittyjen osuus).
- **Meri (v2.18):** pohja syvenee jyrkästi rannan jälkeen (−9 → −23 m, avomeri −40 m) ja on kiinteä. Maailman raja merellä on 3× kauempana
  rannasta kuin ennen (kartasta riippuen noin 435–640 m keskeltä); rajalla ilmoitus.
- **Vesi (v2.18):** läpinäkyvä ja sinertävä matalassa, tummuu yli 2 m syvyydessä; ranta häipyy pehmeästi; taivas ja aurinko heijastuvat;
  aallot tuulen mukaan (tyyni ~7 cm, myrsky ~1,3 m). Medium+: rantamaininki, vaahtopäät ja myrskyroiskeet (optimointi: roiskeet vain lähellä
  eikä metsän takana; pois High+:sta). Veden alla (kamera pinnan alla): sininen sumu tummuu syvemmällä, High+: kuplat ja leijuvat hiukkaset.
  Koko pelaaja veden alla → kamera lähimpään zoomiin, rulla ei zoomaa.
- **Vesi (v2.20):** oletuksena kevyt low poly -vesi (tahkot, ~4 200 kärkeä). Asetukset › Extra-grafiikka: Realistinen vesi (heijastukset,
  väreily), Mega-aallot (tiheä verkko, raskain) ja Aallot iskevät rantaan (myrskyssä pisaroita korkealle, putoavat painovoimalla).
- **Rinteet (v2.20):** ylämäki hidastaa pelaajaa ja kaikkia olentoja: nopeus × (1 − 0,5 · kulma/90°) (45° = 75 %, 90° = 50 %), alamäki ei.
  Kivet, malmit, poimittavat ja pensaat kallistuvat maan muodon mukaan; puut pysyvät pystyssä, tyvi upotettuna rinteeseen.
- **Kiinteät paikat (`LOC`):** aloitusranta, 3 raunioita arkkuineen, 3 riimukiveä, Hautakumpu, Kalmankehä.
- **Arvotut paikat (`SITE_DEFS`):** 3 portaalia, 4 rauniotaloa, 3 arkkukiveä, 6 lisäriimukiveä. Sama siemen → samat paikat samalla kartalla;
  maasto tasoitetaan (`flatten`). Metsä väistää kaikkia paikkoja 20 m (riimukivet 4 m).
- **Etäisyydet ja suunnat lasketaan** (`dirIn`, `dirText`): tarinateksteissä ei ole kiinteitä ilmansuuntia (pohjoinen = −z).

## 2. Pelaaja ja liikkumisen fysiikka (player.js)
- **Enimmäisterveys (v1.20):** 60 tasolla 1, +10 per taso tasoille 2–5 (taso 5: 100), lisäksi saavutukset ja voima; tason nousu lisää terveyttä heti.

| Asia | Arvo |
| --- | --- |
| Pituus / säde / askelnousu `STEPUP` | 1,8 m / 0,38 m / 0,55 m |
| Kävely / juoksu / kyykky / torjunta tai jousen veto | 4,6 / 8 / 2,3 / 2,4 m/s |
| Isku käynnissä | nopeus × 0,45 |
| Ylikuormitus (paino > `MAXW` 160) | nopeus × 0,55, ei juoksua eikä hyppyä |
| Uinti (v2.18: pohja yli 1,5 m pinnan alla) | 2,6 m/s (veden alla 2,1); välilyönti pohjassa kelluu pinnassa: painallus −1 kestävyys (jäähy 1 s) + −5/s; ilman vajoaa 0,42 m/s; kestävyys palautuu 25 % nopeudella kun välilyönti ei ole pohjassa |
| Hukkuminen (v2.18) | pää veden alla yli 1 s → −10 HP/s, reunat tummuvat, kuplia; vedessä kuollessa keho vajoaa 0,63 m/s, ruutu tummuu, kuolinruutu 3,8 s; hautakasa lähimmälle rannalle |
| Hyppy | pystynopeus 7,2 m/s, maksaa 8 kestävyyttä |
| Painovoima | 22 m/s² |
| Putoamisvahinko | kun alastulonopeus > 15 m/s: (nopeus − 15) × 6 hp |
| Tikkaat | ylös/alas 2,6 m/s (eteen/hyppy = ylös, taakse = alas); vain samalta puolelta – seinä tai ovi välissä estää (v2.15) |
| Kiihtyvyys | maassa nopea (×12), ilmassa hidas (×3) |

- **Törmäys (collision.js):** laatikot ja ympyrät ruudukossa (`CELL` 8 m). Alle `STEPUP`-korkuiset esteet ylitetään askeltamalla.
  Katto pysäyttää hypyn (`ceilingAt`).
- **Kestävyys:** palautuu 22/s viiveen jälkeen; juoksu −13/s.
- **Kamera:** kolmas persoona, pehmeä liike, ei mene seinien tai maaston läpi; zoom hiiren rullalla (tai asetuksista). v2.88: rako esteisiin 0,22 m (`CAM_GAP`, ennen 0,1),
  kameran ympäriltä tarkistetaan 0,2 m sivuille, ylös ja alas (`CAM_R`), olkasiirtymä lyhenee seinän vieressä (`camSO`), lähin etäisyys seinän ollessa aivan takana 0,1 m (`CAM_MIN`,
  hahmo piilossa alle 1,2 m); korkeuden seuranta 10 % pehmeämpi (`CAM_TY_K` 12,6, ennen 14).
- **Raajojen törmäys (v2.88):** pää (0,14 m), kädet ja kyynärpäät (0,06 m) ja polvet (0,08 m) ovat osa osumalaatikkoa: asennon jälkeen tallennetut paikat (`limbCapture`)
  tarkistetaan seiniä, ovia, rakennusosia, kiviä ja puita vasten (`limbPen`) ja pelaaja työntyy ulos (`limbPush`, enintään 0,12 m/ruutu). Kyykyssä polvet pitävät pelaajan
  ~0,6 m seinästä. Käsi lasketaan enintään 0,6 m päähän (`LIMB_ARM_R`); pidemmälle ojennettu käsi koukistuu ja laskeutuu (`armWorldClear`). Lyönti, hakkuu ja jousen veto eivät työnnä.
- **Hahmo:** low-poly, kyynär- ja polvinivelet, kääntymisviive iskun alussa, kyykky polvet koukussa ja vaanimisasennossa,
  selässä yksi työkalu + kilpi (`backG`), kilven torjunta osoittaa eteenpäin.

## 3. Selviytyminen (environment.js `survival`, `calcFx`)

- **Nälkä:** 100 → 0 noin 1000 s:ssa; kylmässä × 1,3, iskiessä/juostessa × 1,15. Terveys palautuu 0,35/s (nälkä > 35), 0,15/s (> 0),
  levänneenä + 0,6/s.
- **Syöminen:** ruoka lisää kylläisyyttä ja terveyttä (`heal` 3/s). **Ähky (vatsakipu) vain, jos kylläisyys on jo ≥ 99 ja syö silti** (v2.00: täyteen syöty = 100, laskee vasta 60 s:n jälkeen)
  (52 s: kävely −10 %, kestävyys hitaammin, kramppi vie 12 kestävyyttä 8–14 s välein). Raaka liha: 45 % pahoinvointi (40 s).
- **Lihat (v2.80, arvot v3.02):** pienriistan liha (jänis, kettu, metso, porsas; yleinen) → paistettuna kylläisyys 25 / terveys 12; riistanliha (peura, poro, karju, emakko; epätavallinen) → 35 / 20; suurriistan liha (hirvi, karhu, hiidenkarhu, hiidenhirvi; harvinainen) → 50 / 32 + kestävyys 24. Raakana 2 / 3 / 4. Kypsyminen: pieni 7–10 s, riista 9–14 s, suuri 14–19 s. Nuotiolla: Lihakeitto (taso 2) 45 / 28 / 16; grillillä Juhla-ateria (taso 4) 70 / 56 / 40 + voima, varras 42 / 32 + voima. Puolukat 5 / – / 16, sieni 6 / 5, paistettu sieni (vain keittopadassa) 14 / 8. **v3.02 pataruoat** täyttävät eniten ja antavat Kylläinen-tilan (ks. Keittopata).
- **Tilat** (repun Tilat-osio, hiirellä lisätiedot ja ajastin): märkä (60 s, kuivuu 5× nopeammin tulella), kylmä (−7 % nopeus, −10 % isku,
  −40 % kestävyyden palautus), nälkä / nälkäinen, pahoinvointi, vatsakipu, ylikuormitus, levännyt (12 s tulen ja katon alla →
  360 s, kestävyys +45 %), voimistunut, lämmin, suojassa, hiipii.
- **Kylmä tulee:** märkänä, lumisateessa vuorilla tai yöllä ulkona ilman lämpimiä vaatteita, ellei tulen lähellä.
- **Lepo ja uni:** sänky asettaa herätyspaikan; nukkuminen vaatii yön, katon eikä vihollisia 20 m sisällä → seuraava aamu, levännyt. Terveys palautuu vain kodin lämmössä: Mukava +10 %, Lämmin koti +20 % (v2.09).
- **Kuoleman ruutu (Kaaduit):** kaikki valikot ja päävalikko sulkeutuvat, kursori näkyy, herätys napista tai Enterillä.
- **Päävalikon tausta (v1.25):** oletuksena 10 animoitua kuvaa (ei 3D-piirtoa valikossa); kuva arvotaan aina (v1.31, myös sivun avauksessa),
  vaihtuu 20 s välein. Asetus "Valikon tausta": kuvat / 3D-kamera (alla, v1.15).
- **Päävalikon tausta (v1.15):** kamera näyttää satunnaisia kohteita lähikuvina (biomit, järvi, hylätty leiri päivällä ja yöllä, eläimet),
  20 s / kohde, hidas kierto, vaihto mustan kautta; ensimmäinen kohde arvotaan joka latauksella.
- **Päävalikko (v1.14):** "Toimii parhaiten tietokoneella hiirellä ja näppäimistöllä" näkyy ruudun yläkeskellä kerran per käynnistys 3 s (v1.30) ja häipyy.
- **Ruoho (v1.00, v1.04 kasoina):** ohuita läpikuultavia heinäkasoja harvakseltaan biomin mukaan (ei kohteiden päällä), heiluu ja kallistuu tuulessa; asetus Grafiikka → Ruoho (Pois / Normaali / Täysi).
- **Kasvillisuuden esto (v1.04):** puut, kivet ja poimittavat eivät kasva uudelleen leirien, kiviröykkiöiden, linnakkeiden, raunioiden, portaalien ym. päälle (suoja 3,5–15 m).
- **Hylätyt leirit (v0.99):** 1–2 per kartta: sammunut nuotio (sytytä puulla), teltta jossa sänky (herätyspaikka, nukkuminen), tukki ja säkki tarvikkeineen. Teltan voi myös rakentaa itse (Kalusto).
- **Arkkukivet (v1.01, v1.03):** suljettu 3,5 m kivilinnake: arkulle pääsee juoksuhypyin viittä kapeaa siksak-pilaria pitkin muurin harjalle ja kierreportaita alas.
- **Kiviröykkiöt (v1.03):** 2 per kartta, avoin kivikasa, arkku näkyvissä keskellä (pieni saalis).
- **Aluevartijat (v0.97):** vartioalue 30–32 m; rajalla vartija jää seisomaan ja taistelemaan 1–10 s ennen paluuta, palaa jahtiin jos pelaaja tulee alueelle.
  **v1.09:** paluu kävellen (kalmo 30 m ≈ 21 s), paranee paluun aikana 1 %/s; pelaaja alle 8 m päässä keskeyttää paluun (myös alueen
  ulkopuolella) ja vartija taistelee niin kauan kuin pelaaja on alle 8 m päässä; sen jälkeen uusi 1–10 s ajastin ja paluu.
- **Kuokka ja lapio (v0.96):** kuokka vasen nostaa maata 0,3 m (perusväri), oikea palauttaa maan värin ja kasvillisuuden (v2.78: ruoho seuraa tarkkaa 1 m verkkoa `mudAt`, palautus kerralla lähes koko säteeltä); lapio vasen kaivaa 0,3 m kuopan (enint. 3 m), oikea tekee ruskean polun.
- **Tietoikkuna (v0.94):** Shift pohjassa ja hiiri esineen päällä (reppu, arkku, valmistus) → esineen tiedot kursorin vieressä.
- **Hautakasa (v0.93):** ei katoa koskaan; jos kaikki ei mahdu reppuun, avautuu arkkuikkunaksi, tyhjänä vajoaa maahan.
- **Kuolema:** koko reppu jää hautakasaan (valomajakka lähellä, pääkallo kartalla), herätys sängyltä tai rannalta. Kasaa ei voi poimia,
  ellei kaikki mahdu reppuun.

## 4. Keräily, puut ja maasto
- **Tarkka maanmuokkaus (v2.65):** lapio ja kuokka muokkaavat maata 1 m tarkkuudella (4× enemmän kärkiä kuin muu maasto); muokattu 16 × 16 m alue
  saa oman tiheän verkon ilman saumoja, ja se tallentuu. Kartan aivan reunalla ei voi muokata.

- **Solmut (resources.js `NODE`):** puut (kuusi, koivu, kelo, aarnipuu), kivet (lohkare, kupari- ja rautasuoni), poimittavat (oksa, kivi,
  piikivi, marjat, sieni), koristeet (pensas). Piirretään ruuduittain instansseina (`CHUNK_IMS`).
- **Puun koko** `s` 0,6–2,0 (pienet yleisimpiä); kestävyys ∝ s², saalis ∝ s. Isompi puu kaatuu hitaammin (alku hidas, k^2,6).
- **Kaatuminen (state.js `fallTree`):** oksat irtoavat kaatumisen aikana (30–90 % kohdalla) ja loput maahan osuessa, vajoavat maahan.
  Koivun oksat näkyvät jo pystypuussa (`TREE_BR`, sama asettelu). Lähellä kaatuva puu tärähdyttää ruutua; alle jäävä menettää 80 % terveydestä.
- **Pieni puu (s < 0,8) muuttuu suoraan tavaroiksi**; isompi jättää 1–2 tukkia, joita hakataan (lohkeamat, puupartikkelit) → puuta.
- **Uusiutuminen:** kaadetut puut kasvavat takaisin **kerran yössä** pelaajan **100 m** säteellä (`nightRegrow`), enintään 5 m alkuperäisestä
  paikasta, samaan biomiin. Muut solmut uusiutuvat ajan kuluttua (> 40 m pelaajasta). Marjat ja kasvit uusiutuvat nukkuessa.
- **Rakennusalue on suojattu:** ei kasvua 15 m:n säteelle mistään pelaajan rakennusosasta eikä työpenkin alueelle + 30 % (26 m) (`nearBase`).
- **Myrsky kaataa puun noin 5 s välein** 2–100 m päässä (ei aarnipuita eikä rakennusalueelta); 70 % tuulen suuntaan, 30 % satunnaisesti (v1.19).
- **Kaatuva puu (v1.19):** kaikki kaatuvat puut (myrsky, kirves, karhu) osuvat rungon alle jääviin: 80 % suurimmasta terveydestä, haarniska ei suojaa;
  osuu myös mobeihin, ei puun kaatanutta karhua. **Tuulen taivutus:** myrskyssä latva n. 12–17°, 10 m/s n. 3°.
- **Työkalutasot:** kirves/hakku taso 1–3 (piikivi/kivi, kupari, rauta); aarnipuu vaatii tason 3, rautasuoni tason 2.
- **Maanmuokkaus:** lapio tasoittaa ja tekee maasta multaisen (polut), kuokka nostaa maata ja palauttaa alkuperäisen (`TERRA`, `MUD`, tallentuu).
- **Esineet maassa** katoavat 5 min jälkeen (v1.17: aika kuluu vain, kun olet samassa ulottuvuudessa); maahan pudonneita ei tallenneta.
- **Täysi reppu (v1.17):** poiminta ei onnistu, jos kaikki ei mahdu (esine jää paikalleen), viesti "Reppu on täynnä – et voi poimia".

## 5. Valmistus ja esineet (items.js)

- **48 esinettä, 27 valmistusohjetta.** Työpisteet: työpenkki, ahjo, nuotio/grilli, sulatusuuni. Ohjeilla tasovaatimus (`lvl`).
- **Nuija:** mailamainen, ohut kahva kädessä ja paksu pää kärjessä (v1.06). Pelaajalla hiukset myös takaraivossa (piiloon kypärän alle).
- **Aseet:** puunuija, kivikirves, piikivikeihäs, kupari-/rautamiekka, kupari-/rautakirves, kupari-/rautahakku, hiidenmiekka (harvinainen).
  Jouset: metsästysjousi, hiidenjousi. Kilvet: puu, kupari, rauta. Panssarit: nahka, kupari, rauta, hiiden.
- **Laatu (★1–3):** kehittäminen parantaa vahinkoa, nopeutta ja jousen vetoa; käsisoihdun palamisaika +50 % per taso.
- **Löydetyt arkut ja tynnyrit:** avautuvat arkkuikkunaan kuten omat arkut; sisältö pysyy (`flags.fc`), esineitä voi ottaa ja jättää.
- **Repun käyttö:** napsautus valitsee, toinen napsautus siirtää/vaihtaa paikat, oikea puolittaa pinon, kaksoisnapsautus käyttää,
  Q pudottaa yhden, Shift+Q kaikki (v1.31: hiiren alla oleva esine, myös arkussa, ilman valintaa; itse pudotettu ei imeydy heti takaisin). Arkuissa napsautus–napsautus siirtää, Shift+napsautus siirtää heti. E sulkee valikot.
  **v1.08 (reppu ja arkku):** valittu ruutu sykkii oranssina ja nousee, sen kuvake seuraa hiirtä haamuna, kohderuudussa vihje
  Siirrä / Pinoa / Vaihda ja tietolaatikossa ohjeteksti. Valittuna oikea napsautus toiseen ruutuun siirtää puolet (tyhjään tai samaan
  esineeseen). Raahaus (hiiri pohjassa) siirtää ruutuun / pikapalkkiin; paneelin ulkopuolelle raahattu esine putoaa maahan.
  **v1.30:** oikea napsautus pinoon ottaa puolet valituksi (haamussa määrä), vasen laskee ne; oikealla raahaus siirtää puolet.
- **Valmistusehdotukset (v1.16):** kaksi osiota: "Voit valmistaa nyt" (aineet repussa, enint. 6; puuttuva työpiste merkitään, rakentamaton työpiste
  → myös toiseen osioon) ja "Hyödyllistä seuraavaksi" (enint. 4, pelin vaiheeseen sopivat). Järjestys: ei koskaan valmistettu → usein
  tarvittavat (nuolet, soihdut, ruoka) → valmistettu mutta ei mukana → välituotteet. Tarpeettomia varusteita ei ehdoteta.
- **Ehdotukset ja haku:** valmistuksen ja rakennusvalikon oletusvälilehti *Ehdotukset* näyttää syineen ne, joihin aineet ovat valmiina,
  puuttuvat tai paremmat varusteet ja pelin vaiheeseen sopivat rakennukset (työpenkki → nuotio → sänky → suoja → sulatin/ahjo).
  Hakukenttä hakee kaikista välilehdistä nimen osalla.
- **Tietopaneeli (reppu, napsautus):** nimi isolla, kaikki ominaisuudet taulukkona (esim. soihtu: palamisaika max ja jäljellä).
- **Päivitykset (★, reppu, arkku, tynnyri):** ensimmäinen painallus näyttää mitä muuttuu (nyt → uusi) ja hinnan; vasta **Päivitä nyt** päivittää.
- **Kodin lämpö v2.88:** jokaisen 16 säteen reitti tarkistetaan katon alla seinään asti (~2 m välein, `HOME_ROOF_STEP`): puuttuvan seinän kohdalta karkaava säde ei enää kelpaa, vaikka se osuisi 15 m:n sisällä toiseen rakennukseen, aitaan tai rinteeseen.
- **Kodin lämpö (v2.09):** kokonaan suljettu talo (seinät, katto, suljettu ovi, lasi-ikkunat – ei aukkoikkunoita) antaa tehosteen **Mukava lämpötila** (+0,5 terveyttä/s, nälkä kuluu 30 % hitaammin, nukkuessa +10 % terveyttä). Kun sisällä palaa nuotio, grillinuotio, seisova soihtu tai seinäsoihtu vähintään 5 s, tehoste on **Lämmin koti** (+1,0/s, nälkä −50 %, nukkuessa +20 %). Ovi saa olla auki 20 s, sitten tehoste harmaantuu; lämmönlähteen sammuttua Lämmin koti kestää 30 s; ulos lähtiessä tehoste hiipuu 20 s:ssa. Nukkuminen ei enää paranna täyteen.
- **Viholliset ja talot (v2.08):** suljettu ovi estää näkemisen (ikkunoista ja lasista näkee). Vihollinen muistaa sinut 30 s; jos pakenet taloon, se hajottaa oven, jos se on heikompi kuin lähin seinä, muuten lähimmän seinän, ja tulee sisään. Saman lajin lauma 20 m:n päästä liittyy mukaan. Kun muisti loppuu, vihollinen poistuu murtokohdasta.
- **Hiekka ja lasi (v2.07):** rannoilla harvinaisia hiekkakasoja (5–10 / kartta, uusiutuvat 20 min, 2–3 hiekkaa). Sulatusuunissa 2 hiekkaa → 1 lasi 15 s:ssa (enint. 20 hiekkaa, vuorotellen malmien kanssa).
- **Ikkunat ja ovet (v2.07):** Aukkoikkuna (2 puuta, 130) ja Kivinen aukkoikkuna (5 kiveä, 420); Puinen lasi-ikkuna (2 puuta + lasi, 100) ja Kivinen lasi-ikkuna (5 kiveä + lasi, 250) – lasi estää kulun, nuolet ja sateen, mutta olennot näkevät läpi; rikkoutuessa lasi särkyy ja jäljelle jää aukkoikkuna. Rautaovi 4 rautaa + 2 puuta, 900.
- **Puunuolet (v2.06):** pelkästä puusta (2 puuta → 15, työpenkki); putoavat 30 % ja kaartuvat tuulessa 20 % enemmän ja tekevät 40 % vähemmän vahinkoa kuin piikivinuolet. Tuuli kaartaa kaikkia nuolia 10 % enemmän kuin ennen.
- **Tähtäin (v2.05):** Z vaihtaa Viivasto / Pisteet / Kevyt / Pois; vilkkuessa apuviivasto ja piste samaan tahtiin.
- **Tähtäin (v2.04):** kyykkytähtäimen merkit suoraan pisteen alla; X kytkee täyden vedon vilkkumisen (oletus pois, 3 s välein, piste ja viivat yhtä aikaa); tuulen suunta ja nopeus näkyvät aina jousta jännittäessä ristikon yläpuolella. Linnakkeen muurin harjalla voi kävellä.
- **Kyykkytähtäin (v2.03):** täydellä vedolla kyykyssä näkyy todellinen lentorata metrimerkkeineen ja osumakohta (huomioi katsekulman, painovoiman ja tuulen); Z vaihtaa tyyliä (Viivasto, Pisteet, Kevyt). Täydellä vedolla piste pienenee ja himmenee 2 s välein; ohjeet C- ja Z-näppäimille. Jousta jännitettävä vähintään 0,4 s.
- **Valot (v2.03):** asetukset "Valojen näkyvyysetäisyys" (40 m … koko kartta) ja "Valon kantama" (17–32 m); High+/Ultra pitkät etäisyydet, Ultran varjot 220 m. Tulinuolen liekki hehkuu kauas.
- **Esineet maassa (v2.02):** aseet, työkalut, jouset, kilvet, haarniskat, avaimet, arvoesineet ja juomat näkyvät oikeina 3D-malleina; raaka-aineet ja ruoka kuvakkeina.
- **Jousi (v2.01):** nuoli osuu ristikon kohtaan myös olentoihin; jousta pitää jännittää vähintään 0,4 s (v2.03) (muuten peruuntuu, nuoli ei kulu); tuuli kaartaa nuolta hieman (sulitettua puolet) ja kova tuuli (≥ 8 m/s) näkyy varoituksena ⚠ suuntanuolineen jännittäessä. Tulinuoli valaisee kohteessa kirkkaasti 5 s (sateessa 1,6 s pehmeästi hiipuen).
- **Juomat (v2.00):** Parannusjuoma (punainen) palauttaa terveyden heti täyteen; Elpymisjuoma (vihreä) +1 terveys/s minuutin; Sisujuoma (sininen) pitää kylläisyyden täynnä 5 min ja kestävyyden 30 s. Löytyvät arkuista (10 % / juoma / arkku), juodaan pikapaikasta.
- **Kylläisyys (v2.00):** täyteen syöty = 100, ja mittari alkaa laskea vasta minuutin kuluttua.
- **DEV Å (v2.00):** esinevalikko – pikavalinnat ja esinehaku.
- **Pomot murskaavat (v1.99):** pomo tuhoaa kulkiessaan alleen/eteensä jäävät rakennelmat (seinät, aidat, ovet, lattiat, katot, työpisteet, sängyt) ja kaataa puut; arkut ja tynnyrit säilyvät. Ei nukkuessa eikä herätessä.
- **Ulottuvuuksissa rakentaminen (v1.99):** vain työpenkki, vapaalle lattialle (ei seinän tai esineen päälle); muusta tulee ilmoitus. Hautakummussa ei rakenneta.
- **Nuolet (v1.98):** pysähtyvät tarkasti pintaan (seinät, suljetut ovet, muurit, puut, kivet, maa, vesi). Osumasta: nuoli häviää 10 s (tulinuoli 8 s), tulinuolen liekki ja valo sammuvat 5 s:ssa; sade (ei katon alla) tai vesi sammuttaa heti osuessa.
- **Tuli:** palava käsisoihtu sytyttää lyödyn, tulinuoli osumansa: 5–10 s, 5 hp/s; sade tai vesi sammuttaa heti.
  **v1.97:** märkä (sataa ja ei katon alla, tai vedessä) ei syty lainkaan – pelaaja eikä olento; katon alla sateessa syttyy ja palaa. Sammutuksen jälkeen 3 s jäähy; syttymisilmoitus enintään 12 s välein.
  Suonäkki syntyy öisin suolla (22 % suon yöspawneista, enintään yksi väijyjä kerrallaan).
- **Ammukset:** piikivinuolet ja tulinuolet (+ pihka). Oletuksena käytetään heikointa ensin (`AMMO`-järjestys); repusta voi valita ammuksen
  ("Käytä ammuksena"), uusi painallus palauttaa automaattiseen.
- **Hiipiminen (kyykky):** paikallaan eläimet eivät huomaa; liikkuessa 1,5 m (eläin katsoo kohti) / 0,9 m (selin). Kävely 7 m, juoksu 16 m, ase ×1,4.
- **Kahden käden ote:** kirveellä vasen käsi tarttuu varteen (IK `armIK` napavektorilla, kyynärpää alas-ulos); jousen vedossa vetokäsi on jänteellä.
- **Lyönnit:** nosto pään/olan yli → isku viistosti alas vartalon eteen → loppuliike edessä; vuorottelevat suunnat. Kädet eivät mene vartalon läpi (`armClear`).
- **Selässä kannettavat:** kilpi ja jousi selässä, yksi muu työkalu/ase selässä; vasara roikkuu vyöllä takana (heiluu kävellessä).
- **Jousi:** hiiren vasen pohjassa jännittää, vapautus laukaisee (veto > 0,15). Täysi veto 1,6 s (laatu 2: 1,3 s, laatu 3: 1,07 s); vajaa veto = vähemmän vahinkoa, hitaampi nuoli, jyrkempi kaari.
  **Vetoasento (v1.22):** vartalo kääntyy sivuttain, jousi keskellä edessä, oikea käsi vetää jänteen posken oikealle puolelle; levossa jousi heiluu käden mukana.
  **Tähtäys (v1.23):** ympyrä = hajonta: vedon alussa n. 10°, pienenee vedettäessä (keltainen → punainen), täysi veto paikallaan = 0° (pieni ympyrä + piste); liike lisää 2–3°.
  **Jouset (v1.23):** hiidenjousi vetää 1,15 s, nuoli +25 % nopeampi, hajonta ×0,7; ★ nopeuttaa vetoa ja pienentää hajontaa.
- **Nuolet (v1.23):** puunuoli (v2.06) = heikoin (putoaa +30 %, tuuli +20 %, vahinko −40 %); piikivi = perus; sulitettu +25 % nopeus, −40 % pudotus, +15 % vahinko, tuuli puolet; tulinuoli = perus + sytyttää. Asetus: tulinuolten valo (oletus pois).
- **Kestävyys / isku (v1.23):** kupari −10 %, rauta −20 %, hiiden −30 %; kilven torjunta kuluttaa puu 90 %, kupari 75 %, rauta 60 % iskusta.
- **Palava mob (v1.23):** isommat liekit, kipinöitä ja savua, oranssi valo maahan.
- **Repun käyttö (v1.32):** kiinteä kolmen sarakkeen näkymä (ruudukko | tiedot | valmistus), mikään ei liiku. Napsautus valitsee,
  toinen napsautus siirtää. Haarniska/vaate, kilpi, soihtu ja nuolet otetaan käyttöön jo valintanapsautuksella (keltainen); jos seuraava
  napsautus siirtää esineen, käyttöönotto perutaan. Ruoka syödään VAIN pikapaikan numerolla. Pudotus (Q, Pudota-nappi, raahaus ulos) heittää
  esineen ~3 m eteenpäin kameran suuntaan.
- **Reppu:** 32 paikkaa, kehitys +8 paikkaa / +40 painoa (2 tasoa). Arkku 16→24→32, tynnyri 10→16→22.
- **Avaimet:** Jääavain, Kalmon sinetti (v2.62, Routaportin toinen lukko), Luuavain, Aarniavain (ulottuvuuksien portit).

## 6. Rakentaminen (pieces.js, building.js)

- **Mitat:** ruudukko `G` 2,5 m, seinä `WH` 2,6 m, oviaukko 1,7 × 2,3 m, portaiden askelma alle `STEPUP`.
- **Työpenkki** tekee 20 m rakennusalueen (`BENCH_R`, oranssi raja näkyy vasara kädessä). Nuotio ja työpenkki eivät tarvitse aluetta.
- **Osat (58):** lattiat, seinät (täysi, ikkuna, puoli/neljännes pysty/vaaka, vino, päätykolmio), ovet, katot (olki, loiva, harja + kiviversiot),
  palkit, pylväät (ohut, lyhyt, pitkä), raput, portaat, tikkaat, paaluaita, seisova soihtu, työpisteet, sänky, arkku, tynnyri; kiviversiot.
- **Kohdistustilat (G):** ruudukko (2,5 m), **1 m**, puoli (1,25 m), **3D** (vaaka- + pystyruudukko, korkeus WH/4 portain), vapaa (0,25 m),
  reuna, **jatko** (v2.13). Ruudukkotiloissa kaikki osat kohdistuvat: lattiat ruutujen keskelle, seinät reunoille, **pylväät kulmiin, muut ruudun keskelle**.
- **Tikkaat (v2.13):** asennot pysty, 1:3 ja 1:2 (Shift+R): jokainen tikas nousee 2,6 m ja siirtyy 0 / 0,83 / 1,25 m → 3 tikasta 1:3 tai 2 tikasta
  1:2 = tasan 1 ruutu sivulle. Seinän pintaan tähdätessä tikkaat nojaavat seinään (alareuna maassa/seinän alareunassa).
- **Jatkokohdistus (v2.13):** tikkaat ja portaat (raput, portaikko, kiviversiot) napsahtavat alemman yläpään jatkoksi kaikissa tiloissa (alle 1,3 m),
  G-tilassa **jatko** 3 m päästä. Jatko ottaa alemman kulman ja suunnan; portailla R = 90°: suoraan, käännös 90° tai U-käännös (tasanteeksi lattia).
  Sivupuut, puolat ja portaiden sivupalkit jatkuvat saumattomasti.
- **3D-tila:** näkyvä 3D-hila haamun ympärillä (pystytolpat ruudukon kulmissa, vaakaruudukot WH/2 välein kahteen kerrokseen).
- **Pystykohdistus (H):** auto, pysty (Q/Z nostaa/laskee), 3D (seuraava kerros näkyy).
- **Reunakohdistus (`smartSnap`, kaikki G-tilat paitsi vapaa, kaikki osat):** kohteen muoto = törmäyslaatikoiden rajaus.
  - Yläpinta tai sivun ylin kaista (30 % korkeudesta, 0,12–0,5 m) → **päälle**: keskelle, reunalle tai kulmaan (sivulta: katsottu sivu +
    vasen/oikea yläkulma). Esim. pylvään yläkulma → lattia/palkki/pylväs pylvään yläpuolelle katsottuun suuntaan.
  - Seinän/palkin pääty tai sivun uloin 15 % → jatko samaan linjaan. Sivun keski → viereen (vain reuna-tilassa).
  - Kokosäännöt (ohut < 0,4 m): ohut+ohut keskitetty, ohut kohde → osan reuna kohteen keskilinjalle, ohut osa → kohteen reunalle/kulmaan,
    muuten reunat tasan. Lattia/katto ohuen kohteen päällä seuraa ruudukkoa: ruudukkoviivalla oleva pylväs → katsottu ruutu.
  - Seinä/palkki kääntyy katsotun reunan suuntaiseksi (seinän päällä samaan suuntaan). Ruudukkotiloissa lattian yläpinta ja sivujen
    keskiosat kohdistuvat tavalliseen ruudukkoon. Ei vinoille (45°) kohteille, katoille, portaille eikä tikkaille.
- **Kääntö:** R = 45°, Shift+R = asento (kolmiot/vinoseinät 4 asentoa, palkit 5 kulmaa, portaat 3 jyrkkyyttä).
- **Rakennusnäppäimet** (R, Shift+R, G, H, Q, Z) toimivat ja ilmoittavat vain rakennustilassa: vasara kädessä ja osa valittuna (`isBuilding`).
- **Säännöt (`validPlace`):** sama osa samaan paikkaan kielletty, ei liian syvälle veteen, katto ei pelaajan päälle, maksu repusta.
- **Kunto:** 3 vauriotasoa näkyvät tekstuurissa; vasara: X purkaa (materiaalit takaisin), F korjaa. Paaluaita kestää mobit (piikit vahingoittavat).
- **Kivet ja säiliöt (v2.63):** kiven päällä voi seistä noin puolen säteen alueella (reunalta valuu); kaikki säiliöt (arkut, kirstut, tynnyrit,
  leirin säkki) ovat kiinteitä ja niiden päällä voi seistä.
- **Ovet:** kaksipuoliset, aukeavat pelaajasta poispäin. Katoilla voi kävellä.
  **v2.60:** ovi kääntyy 0,6 s pehmeästi (liike hidastuu loppua kohti, `DOOR_T`, `doorTick`). Avatessa oviaukko vapautuu heti, sulkiessa este
  palaa vasta, kun ovi on kiinni. Jos pelaaja seisoo oviaukossa, ovi ei sulkeudu ("Seisot oviaukossa"). Ladattu tallennus näyttää asennon suoraan.
- **Sade ja valo** eivät tule katon läpi (`roofTopAt`, `indoorK`).

## 7. Tuli ja valo

- **Polttoaineet (v2.91, v2.94 ×1,5):** kaikki palavat samalla fysiikalla (pihka 2× puu, hiili 10× puu), soihdut pysyvät 2× pidempään samalla polttoaineella; v2.94 jokainen polttoaine lämmittää 1,5× kauemmin (`FUEL_K`).
- **Nuotio/grilli:** polttoaine ≤ 40 yksikköä (`FUEL_MAX`), yksikkö `FIRE_UNIT` 67,5 s (v2.94): puu 1 = 67,5 s, pihka 2 = 2 min 15 s, hiili 10 = 11 min 15 s (`FIRE_FUEL`), täynnä 45 min. Lisäys vain kun alle 50 %.
  Grilli kypsentää 4 ruokaa kerrallaan (oma ajastin 9–14 s); 2× ajalla ruoka palaa hiileksi.
- **Soihdut (seinäsoihtu, seisova soihtu, kivinen soihtupylväs), v2.91:** E lisää yhden: pihka 4,5 min, puu 2¼ min, hiili 22,5 min (v2.94 `TORCH_FUEL`, järjestys pihka → puu → hiili), enintään 60 min (`TORCH_CAP`): seinäsoihtu tunnin ≈ 13–14 pihkaa. Rakennettuna seinäsoihtu 22,5 min, seisova 7,5 min. Lyöminen sammuttaa tulen.
- **Käsisoihtu:** palaa **405 s** (v2.94; ★2 607 s, ★3 810 s; juostessa 20 % nopeammin), pihka lisää 4,5 min; sade ja vesi sammuttavat; sytytys toisen liekin vieressä 2,5 s.
- **Valot:** enintään 6 lähintä valonlähdettä kerralla (asetus), yhteisvalon katto (`LIGHT_CAP`), elävä välke.
- **Varjot:** aurinko/kuu (varjokartta 2048, alue 55 m); lähimmän tulen varjot pimeällä (päivitys tiheä pelaajan ollessa 17 m sisällä, kerran
  poistuttaessa); käsisoihdun pieni varjo pimeällä.
  **v2.42:** vaalennus tehdään pääosin itse varjoon (30 % tasaisena valona) → low poly -kolmioiden kirkkauserot (esim. illalla vuorten muodot) säilyvät.
  **v2.34:** metsissä varjot 20 % vaaleammat; kaikki varjot keskipäivällä vielä 15 % vaaleammat ja hämärässä/yöllä 15 % tummemmat (liukuu auringon mukaan).
  **v2.33:** avoimissa biomeissa (niitty, ranta, meri, nummi, tunturi, rakka, vuori, huiput, suo) varjot ovat 40 % vaaleammat; metsissä
  (koivulehto, korpi, jäkäläkangas, aarnimetsä) ennallaan. Vaihto häivyttyy hitaasti (n. 5–8 s) biomin rajalla.

## 8. Taistelu (actions.js)

- **Isku:** kestävyys aseen `st`, kesto `spd`; nyrkki 3 vahinkoa. Vahinkotyypit: viilto, murskaus, pisto, tuli – viholliset heikkoja/vahvoja.
- **Hiiviskelyisku:** kyykyssä huomaamattomaan viholliseen × 2.
- **Torjunta (hiiren oikea, kilpi):** vain edestä, kestävyys = 90 % iskusta, vähennys kilven `block` (max 95 %); kestävyyden loppuessa torjunta murtuu.
- **Panssari:** vahinko × 20 / (20 + panssari). Iskun jälkeen 0,25 s suoja.
- **Keihäs** osoittaa kohdetta, kirves lyö viistosti vuorotellen.

- **Pomojen terveys:** isot pomot eivät parane; ulottuvuuspomon ja vartijan terveys säilyy poistuttaessa. Alttarin hiidenkivet jäävät
  alttarille, jos vartija vajoaa takaisin – uusi herätys ilman uusia kiviä.

## 9. Viholliset ja eläimet (mobs.js, ai.js)
- **v2.63:** arkkukivilinnakkeen muuri estää näkemisen; muurin takana olento muistaa pelaajan 3 s. Törmäysääni vain kovasta vauhdista (3 s tauko).
- **v2.63 Kalmanummi:** usva Aarnimetsän tapaan (näkyvyys ~52 m), harmaampi ja hämärämpi, vaihtuu sisään ja ulos pehmeästi ~5 s.

- **Nopeudet −15 %** (`MOB_SPD` 0,85 kaikessa liikkeessä).
- **Terveyspalkit (v2.26):** piilossa, kunnes tähtäin on olennon päällä (alle 12 m, vaikeat ≥ 3 kalloa alle 70 m). Jos olento ei ole täysissä
  voimissa, palkki näkyy myös, kun olento on 10 % ruudun leveydestä tähtäimen ympärillä (~13°, alle 20 m). Vahingon jälkeen palkki näkyy 5 s
  katsomatta – paitsi jos olento on yli 40 m päässä ja maaston tai esteiden takana. (Alla vanhemmat säännöt; nämä korvaavat ne.)
- **Terveyspalkit (v1.21):** rivi = 100 hp, rivit päällekkäin (enint. 5, ylin tyhjenee ensin), yli 500 hp:lla toinen värikerros (oranssi).
- **Terveyspalkit:** mobin yläpuolella (mallin korkeus + 0,45 m), nimi ja pääkallot palkin yllä; näkyy kun katse osuu mobiin (~11°, vahvat ~9°)
  alle 12 m (vahvat 70 m) tai 10 s osuman jälkeen. Pomoilla oma palkki ruudun yläreunassa.
- **Juoksu (v0.93):** harppova juoksuanimaatio (takajalka taakse, polvi ylös, kädet koukussa); kävelyaskel hieman pidempi.
  **v1.13:** runko keinuu sivuttain edessä olevan jalan puolelle (kävely ±2°, juoksu ±5°); juoksusta kävelyyn etukeno ja askel palautuvat pehmeästi (~1,2 s).
- **Kalmanpesä (v0.93):** murskautuu millä tahansa, muulla kuin hakulla kaksi kertaa hitaammin; murskatun pesän ympärille ei synny mobeja.
- **Harppovat hirviöt (v0.92):** kaksijalkaiset hirviöt liikkuvat 10 % nopeammin pitkin, keinuvin askelin ja lyövät 10 % kauemmas.
- **Tönäisy (v1.31):** arvo ilman yksikköä, N = N/2 m tavalliseen viholliseen (10 = 5 m); nuija 6 (eniten), kivikirves 2, keihäs ja rautakirves 3,
  hiidenmiekka 3,5; isot olennot lentävät vähemmän. Tönäisty vihollinen on kyvytön lennon ajan (ei kävele eikä lyö).
- **Ulottuvuusmobit (v0.91):** teeman mukaiset koristeet (huurre/jää, hautavaatteet ja pronssikorut, sammal ja hohtavat sienet), liekkimäisesti
  sykkivät silmät ulottuvuuden värillä (kirkastuvat jahdatessa, räpäyttävät), +10 % terveys ja lisäsaalis. Ulkomaailman mobit ennallaan.
- **Haarniskat (v0.90):** jokaisella oma painava malli ja kypärä/huppu (kasvot näkyvät; Hiidenpanssarissa suljettu visiiri): nahkavaatteet,
  karhuntaljahaarniska (uusi: 2 taljaa + 4 nahkaa, arm 10, ei hidasta), kupari-, rauta- ja Hiidenpanssari. Kilpi ja selkätavarat siirtyvät
  haarniskan pinnalle, kun haarniska on päällä.
- **Pomot (v0.89):** Kalmanvartija ryntää harvemmin (25 %, väh. 8 s välein) ja sen huitaisun/maahaniskun ennakko on 40 % pidempi;
  kiviä heittävien pomojen (vartija, Jäätär) hyökkäykset ovat 10 % hitaampia ja kivi lentää 30 % hitaammin. Vartija vajoaa 3 s:ssa maahan ja nousee herätettäessä 2,5 s:ssa (v0.95, haavoittumaton sillä aikaa). Vajonneen vartijan alttari jää
  valmiiksi (3/3 kiveä näkyvissä) – herätys ei vaadi uusia kiviä.
- **Eläinten luonteet (v0.85, `per`):** jänis jähmettyy ja pakenee siksakkia, kettu jää katsomaan matkan päästä, metso antaa tulla lähelle
  ja lehahtaa 14–24 m, porolauma pakenee yhdessä. Uudet eläimet: metsäjänis, kettu, metso (sulat → sulitetut nuolet), poro.
- **Joskus vihaiset (v0.86, `temper`):** hirvi (35 % suuttuu alle 6 m:ssä, ryntää ja tönäisee ~2 m), ilves (yöllä hyökkää haavoittuneen
  < 50 % kimppuun, muuten väistää), ahma (suuttuu raa'asta lihasta repussa), emakko (puolustaa 2–4 porsastaan alle 7 m:ssä ja suuttuu aina, kun sen oma porsas säikähtää sinua, missä tahansa – v2.14; emon kuoltua sen porsaat jäävät orpolaumaksi, joka pelkää 2× kauempaa; rauhallisena perhehetket: nuuhkaisu, leikki, tonkiminen). Rauhoittuvat
  12 s:n kuluttua, kun pelaaja on kaukana.
- **Karhu (v0.87):** 120 hp, murisee 14 m:ssä ja hyökkää alle 8 m:ssä tai lyötynä; lyö liikkeestä pysähtymättä, tönäisee ~3,5 m, kaataa
  jahdatessaan edessään olevat puut tukeiksi, palautuu (5 %/s), jos sitä ei lyödä minuuttiin. Pelaaja pääsee juosten karkuun. Saalis
  karhuntalja → Karhuntaljamatto.
- **Harvinaiset pelottavat (v0.88):** vain öisin (≈ kerran 5 min, yksi kerrallaan): Hiidenkarhu, Hiidenhirvi, Kalmasusi (ulvoo ensin),
  Suonäkki (nousee suon lätäköstä). Huomatessaan pelaajan seuraavat 30–60 s, poistuvat 5 s ja unohtavat – suuttuvat uudelleen vain nähdessään
  pelaajan. Katoavat aamulla, jos eivät jahtaa.
- **Eläinmallit:** `makeAnimal` (nivelletyt jalat – nivel rungon sisällä, lapa/reisi kylkeen; kaula rinnasta pään tyveen, kuono, korvat, häntä; peuran sarvet, karjun harjas ja torahampaat, suden kaulus, routasuden jääpiikit).
- **Eläimet** (peura, villikarju): säikähtävät kävellen 7 m, juosten 16 m, ase kädessä × 1,4, kyykyssä paikallaan ei lainkaan, hiipiessä 1,5 m (kohti) / 0,9 m (selin); lyöty pelkää 10 s.
- **Viholliset** (sammalhiisi, harmaasusi, kalmo, ylimys, kivivartija, routasusi): tarvitsevat näköyhteyden; huomaavat pelaajan aina 10 s
  vahingon jälkeen (myös jousella); kyykky puolittaa huomausetäisyyden, yö × 1,35. Ilman näköyhteyttä 3 s → luopuvat.
- **Tulen pelko:** nuotio 7 m, seisova soihtu 5 m, käsisoihtu 6 m (ei luolastossa) – kaikki paitsi ylimys ja pomot.
- **Piiritys:** (v2.08) talossa olevaa pelaajaa muistava vihollinen hajottaa oven, jos se on heikompi kuin lähin seinä, muuten lähimmän seinän (2× vahinko), ja tulee aukosta sisään.
- **Terveyspalkit:** näkyvät lyödyllä tai lähellä katsottaessa; pääkallot kertovat vaikeuden; vaikeat (≥ 3 kalloa) näkyvät kaukaa ja
  parantuvat 30 s iskuttomuuden jälkeen.
- **Spawneri (`spawner`):** 2,5 s välein 38–68 m päähän biomin taulukosta (`SPAWN`), katto 10 (yö 14); ei rakennusten, löytöpaikkojen
  (50 m) eikä aloitusrannan lähelle päivällä.
- **Vartijat (`GUARDS`):** löytöpaikkojen ja portaalien vartijat syntyvät < 75 m, pysyvät paikallaan (palaavat 15–16 m jälkeen), kaatuminen tallentuu.

- **Syntyanimaatio (v2.14):** uusi olento häivytetään näkyviin makuulla (0,8 s) ja nousee: nelijalkaiset etujalat ensin (istuva asento),
  sitten takajalat ja pään ravistus; kaksijalkaiset vatsallaan → punnerrus → polvilleen → seisomaan. Kesto 2,5 s; osuma tai säikähdys
  nostaa heti (~0,2 s). Ei pomoille, maasta nouseville väijyjille eikä valmiiksi paikalla oleville (luolat, vartijat).
- **Kalmanummi (v2.14):** kalmot ja ylimykset eivät pala auringossa nummella. Kalmanvartijan taistelun aikana Kalmankehän ympärille
  (60 m kehästä) ei synny kalmoja itsestään – vain vartijan kutsumat.

## 10. Pomot

- **Kalmanvartija (Kalmankehä):** herätetään 3 hiidenkivellä alttarilla; vaihe 2 alle 50 % (kalmot maasta); palaa maahan > 90 m päässä
  (kivet jäävät alttarille). Kaatuminen = voitto.
- **Pomojen iskut (v1.17):** ryntäys enintään kerran 10 s:ssa; maahaniskussa kädet ylhäällä latautumassa 0,8 s ennen iskua.
- **Ulottuvuuksien pomot** (Jäätär, Kalmaherra, Aarnihirviö, `realmBossAI`): nukkuvat kunnes < 17 m; vaiheet 100–66 / 66–33 / 33–0 %
  (nopeampi). Iskut: pyyhkäisy, maahanlyönti, rynnäkkö, kiven heitto, nova (vaihe 3, väistä hyppäämällä), kutsu (apulaiset, max 4).
  Pudottavat raudan, kuparin, hiidenkiven ja seuraavan avaimen (suoraan reppuun).

## 11. Hautakumpu ja ulottuvuudet (landmarks.js, dungeons.js)

- **Hautakummun suu (v2.49):** portin aukosta näkyy kapeneva ja laskeva kivikäytävä, jonka läpikuultavat mustat levyt (7 × 30 %) syventävät
  pimeyttä (stencil-ikkuna: näkyy vain aukon läpi, maasto ei peitä). Portin takana kivimassa; kaikki osat ulottuvat maahan asti.
- **Hautakumpu:** kiinteä luolasto (`DMAP`), 3 hautakirstua (hiidenkivet), kalmot ja ylimys, seinäsoihdut, luut, tippukivet, tynnyrit.
- **Ulottuvuudet:** Routaluola (sokkelo), Kalmankammio (huoneet), Aarnihauta (luola, kivimöhkäleseinät, epätasainen lattia 0–0,45 m).
  Pohja arvotaan ensimmäisellä käynnillä (`flags.rs`), rakennetaan vasta sisään astuessa ja piirretään vain siellä ollessa.
  Katto 7,6 m. Sisältö: soihdut telineissä, luut, tippukivet + pisarat, lätäköt, usva ja höyry, arkut ja tynnyrit, Kalmanpesä-spawneri
  (3 vihollista 20 s välein, kun edelliset kuolleet ja pelaaja < 26 m). **Kalmanpesän voi murskata hakulla** (kestävyys 240, isku =
  louhintateho, kivihakulla 20 iskua) → rauniot, saalista ja 40 XP; tuhottu pesä pysyy tuhottuna (`flags.sd`).
- **Etenemisketju (v2.62):** Kalmon sinetti (Hautakummun ylimys) + Jääavain (maailman arkku) → Routaportti (kaksi lukkoa, kumpi tahansa ensin,
  teksti ✓/✗) → Routaluola → Luuavain → Kalmankammio → Aarniavain → Aarnihauta → 3 kruunusirpaletta → Kalmankehä → Kalmanvartija.
  Varmistus: lukko aukeaa ilman esinettä, jos lähde on jo käyty (arkku avattu, ylimys tai pomo kaadettu) tai ulottuvuudessa on käyty.
- **Avaimen kätkijä (v2.62):** näyttävä riimukivi korkealla vuorella, ei kartalla ennen kuin siellä käy. Kertoo runollisesti seuraavan avaimen tai
  esineen paikan pelitilanteen mukaan; 15 min ilman edistymistä → tarkempi vihje ja ilmoitus. Avaimen arkkua ei merkitä kartalle.
- **Hiidenkivet (v2.62):** tasan 9 – maailmassa 4 (Hautakummun kirstut 2 + arkut 2, arvotaan maailman arkkuihin), ulottuvuuspomot 3,
  Routaluolan ja Kalmankammion arkussa 1 + 1. Riittää hiidenjouseen (2), -miekkaan (3) ja -panssariin (4).
- **Portaalisuoja:** 3,2 s siirtymän jälkeen viholliset eivät voi vahingoittaa eivätkä aloita jahtia; viholliset ≥ 10 ruudun päässä sisäänkäynnistä.

## 12. Löytöpaikat, tarina ja eteneminen

- **Rauniotalot ja arkkukivet** arkkuineen ja vartijoineen; löytyvät kartalle 30 m päästä.
- **Riimukivet:** 3 kiinteää + 6 arvottua; vihjeet laskevat suunnan ja etäisyyden ja merkitsevät paikkoja karttaan.
- **Karttapilvet:** kartta paljastuu kulkiessa (`explored`); löydetty paikka näkyy vain paljastetulla alueella. DEV-valikossa (Ä) voi paljastaa koko kartan ja kaikki kohteet sekä hakea minkä tahansa esineen nimellä haluttu määrä (1–999; ylimenevä putoaa maahan).
- **Tehtäväketju (`QUESTS`, 13 kpl):** näkyy oikeassa yläkulmassa suunnan ja etäisyyden kanssa; +60 XP.
- **Tavoitteet (`GOALS`), saavutukset (`ACH`, pysyvät bonukset), taso ja XP** (J-paneeli); reseptejä aukeaa tasoilla.

## 13. Sää, vuorokausi ja taivas (environment.js)

- **Vuorokausi** 720 s (yö kun `dayT` < 0,21 tai > 0,79), pehmeä hämärä, kuu vaiheineen, tähdet.
- **Sää:** selkeä, pilvinen, tuulinen, tihku, sade, myrsky (salamat, puiden kaatuminen), lumisade (vuorilla), sumu.
- **Tuuli (v0.84):** suunta pysyy 2–6 min ja kääntyy hitaasti (40–90 s, enint. 120°); nopeus säästä (selkeä 1–4 … myrsky 15–22 m/s) + puuskat.
  Pilvet (myös kartalla) liikkuvat tuulen suuntaan, puut kallistuvat ja heiluvat, sade viistää, savu ja kipinät ajautuvat, nuolet kallistuvat
  (13 m/s ≈ 0,5 m / 30 m). Ison kartan oikeassa yläkulmassa iso kompassi, "Tuuli suunnasta / X m/s" ja voimakkuuspalkki – läpikuultava, häipyy kun hiiri viedään sen päälle, ja kartan merkit + pelaajan nuoli näkyvät sen päällä (v1.07); kartan päällä liukuvat tuuliviirut (v1.04); minikartan reunalla tuulinuoli + m/s.
- **Pilvet** isoina kerroksina sään mukaan, kaukana häipyvät; pilvikansi rankassa säässä; salaman välähdys kevyt.
- **Aurinko:** pyöreä hehku (`sunGlow`). **v2.35 säteet** selkeällä säällä: pehmeät kiilat auringosta näytöllä; kääntyvät kameran mukana eri
  nopeuksilla, osa piiloutuu ja ilmestyy katsesuunnan mukaan, mäki auringon edessä peittää. Asetus "Auringon valonsäteet" (pois Low–Medium-).
  **v2.40:** säteet 15 % läpinäkyvämmät, epäsäännölliset ja elävät (paksuus, suunta, pituus ja kirkkaus vaihtelevat), näkyvät harvemmin.
  Este auringon edessä: säteet katoavat lähes heti sen puolen mukaan, joka peittyy; kokonaan peitettynä kaikki säteet ja heijastus pois.
  **v2.39:** auringon hehku pienempi ja selvästi läpinäkyvämpi.
  **v2.38:** auringon hehku on pyöreä (ei suorakulmiota); kun este menee auringon eteen, osa säteistä (60 %) ja heijastus katoavat lähes heti,
  loput jäävät himmeämmiksi. Pilvet harmaanvalkoisia ja varjostettuja (kirkas yläosa, harmaampi pohja).
  **v2.37:** säteet ja heijastus vahvoja koko päivän (aamusta iltaan) ja hiipuvat auringon laskiessa; vahvuus vaihtelee päivittäin (30–100 %);
  piiloutuvat, kun puu, rakennus, hahmo tai pilvi on auringon edessä; yksittäisiä säteitä näkyy hieman harvemmin kuin v2.35.
  **Linssiheijastus** (asetus, vain Ultra-esiasetuksessa): haaleat renkaat auringosta ruudun keskipisteen kautta, kun katsoo aurinkoa kohti.
- **Aarnimetsässä** tiheä sumu ja pimeämpi valo.

## 14. Kartta (ui.js)

- **Kartta (v1.20):** avatun alueen päällä ohuet liikkuvat pilvet (20 %); paikkojen nimillä pehmeä varjo (näkyvät lumisilla vuorilla).
- **Iso kartta (M):** paljastettu alue 12 m säteellä (pehmeä), tutkimaton pilviverhon takana (liikkuvat kumpupilvet vain kartta auki),
  zoom rullalla, raahaus, rakennukset ylhäältä pikseleinä. **Merkit näkyvät vain paljastetulla alueella.**
- **Minikartta:** 3 zoomia (60 / 35 / 110 m, N tai napsautus), taso näkyy alareunassa.
- **Ilmoitukset:** näkyvät pituuden mukaan pidempään, piiloon valikoissa; L näyttää 10 viimeisintä (v1.18; ennen T).
- **Tehtävä ja tavoite piiloon (v1.18):** T kiertää: molemmat → vain tehtävä → vain tavoite → ei kumpaakaan; piilotettuna pieni vihje, valinta muistetaan.

## Tasot (v2.70, v3.02)
- **v3.02:** taso 1–30, XP tasolta n seuraavalle 55 + 35n (tasosta 20 lisäksi +20 × (n − 19)). XP on maailmakohtainen; vanha tallennus muunnetaan kerran niin, että
  taso ja tason sisäinen osuus säilyvät. Lisäpalkinnot: kestävyys +5 (22, 26), HP +10 (24, 28), +20 (30); muut kantokyky +5. Keittopata ja pataruoat tasoilla 10–13.
- Alkuperäinen v2.70: taso 1–20 (XP tasolta n seuraavalle 50 + 30n). Palkinnot: HP +10 (taso 3 ja 5), +15 (10 ja 15), +20 (20) = 130 HP tasolla 20; kestävyys +5
  (4, 8, 12, 16); muilla tasoilla kantokyky +5. Reseptit: 2 piikivityökalut, kilpi, keihäs, nahkavaatteet, varras, jousi + puunuolet; 3 nuolet ja
  kupariaseet/-työkalut; 4 kuparipanssari, kuparikilpi, karhuhaarniska; 5 rautakirves ja -hakku; 6 rautamiekka; 7 rautakilpi ja -panssari;
  10 hiidenjousi, 12 hiidenmiekka, 14 hiidenpanssari. J-paneeli näyttää jokaisen tason palkinnon. Poiminnat ja XP-viestit eivät soita ilmoitusääntä.

## Kuolema (v2.73)
- Hahmo kaatuu painovoimalla iskun suuntaan maan tasalle, veri leviää kehon alle, ja kamera nousee yläviistoon. Hautakasa ei näy kuolinkamerassa.
- Kuolinruutu kertoo syyn (taistelu ja tappajan nimi, hukkuminen, palaminen, putoaminen, kaatuva puu, nälkä, tyhjyys) ja tilastot.
- **v2.77 vinkki vain tarvittaessa:** vinkkilaatikko näkyy vain ensimmäisellä kuolemalla tuleen, tyhjyyteen tai hukkumalla (asioita, joita ei voi arvata), pomon armosäännön laskurissa, tai kun kaadut samalle asialle (sama syy ja sama olento) 3 kertaa putkeen.
- **Ensimmäinen uni (v2.79):** kun nukut ensimmäisen yön sängyssä (katon alla), saat saavutuksen Hyvät yöunet ja näet unen, joka kertoo Kalmanummen ja Hautakummun suunnan; Hautakumpu merkitään karttaan.
- Herätessä ruumis alkaa heti hiipua: vajoaa hieman ja haalistuu 12 s:ssa, verilammikko samassa tahdissa (v2.78; ennen 60 s + 30 s).
- Verilammikko (v2.78) seuraa maaston muotoja: leviää kehon alta 6 s, valuu alarinteeseen pidemmälle kuin ylärinteeseen, ei nouse jyrkkää ylämäkeä, pysähtyy jyrkänteen reunalle, veteen ja seinään; reunat pehmeät, pinta kiiltää märkänä.
- Tyhjyyteen (maailman tai ulottuvuuden alle) pudonnut kuolee 1 s:n kuluttua; tavarat jäävät viimeiseen turvalliseen kohtaan.
- Sateessa kasteltava pelaaja ei syty tuleen; sammumisen jälkeen 6 s ennen kuin voi syttyä uudelleen.

## Opastus (v2.71)
- Uuden maailman luonnissa valinta "Opastus uuden maailman alkuun" (oletuksena päällä ensimmäisessä maailmassa; Asetukset › Ohjaus › Opastus seuraavassa
  uudessa maailmassa). Alkulennon jälkeen peli pysähtyy: kortit ja korostus esittelevät palkit, pikapaikat, minikartan, tehtävän ja tavoitteen (T),
  repun ja valmistuksen (Tab), kartan (M), tason (J), ilmoitukset (L), toiminnot (E, hiiri, B) ja päävalikon (P). Paneelit avataan ja suljetaan itse,
  muut kortit Enterillä. Viimeisenä liikkuminen: peli käynnistyy, ja opastus päättyy, kun olet liikkunut, juossut ja hypännyt. Ohitus kysyy varmistuksen.
- v2.74: pikapaikat (1–8) ja minikartan zoom (N) kokeillaan itse; uuden maailman alussa kartalla paljastuu aloituspaikalta 30 % isompi ympyrä.
- Kertavinkit (opastuksen maailmassa, eivät pysäytä peliä): kun asia tulee ensimmäisen kerran vastaan (vasara, jousi, lapio, kirves, uinti, yö, ylikuorma, vähäinen terveys,
  Hautakumpu, ulottuvuus, ensimmäinen taso), ruudun yläosaan tulee 10 s vinkki.

## 15. Asetukset ja näppäimet (settings.js)
- **v2.68 suorituskykymerkit:** jokaisen grafiikka-asetuksen perässä väripallo nykyisen valinnan vaikutuksesta suorituskykyyn (vihreä pieni,
  keltainen kohtalainen, oranssi suuri, punainen erittäin suuri) ja vihje hiiren alla. **Biomien sekoitus** on Grafiikka-sivulla ja esiasetuksissa
  (Low/Low+ pois, Medium-…Medium+ normaali, High/High+ vahva, Ultra erittäin vahva). Sekoituksen vaihto ei enää poista tarkempaa väritystä (4×/8×).
- **v2.63:** Grafiikka › Tiheämpi maaston väritys (High+ ja Ultra: värit 1 m välein, värineliöt eivät erotu). Extra-grafiikka › Maaston väritys
  tarkemmaksi (4× / 8× / 16×) ja Pehmeä rantaveden väri. Ohjaus › HUD › HUD:n koko 60–150 % (oletus 100 %; koko pelin HUD, osat kasvavat
  reunoiltaan, yli 100 % rajoittuu näytön koon mukaan, ettei mikään mene päällekkäin).
- **v2.65:** Extra-grafiikka › Sammuta kaikki automaattiset grafiikkasäädöt (ylin rivi): päällä grafiikka ei muutu koskaan itsestään (ei suorituskyvyn
  mukaista säätöä eikä käynnistystestin esiasetusta). Extra-grafiikka › Biomien sekoitus (Pois / Normaali = oletus / Vahva / Erittäin vahva): maa-, hiekka- ja metsäalueiden värit liukuvat toisiinsa,
  kivikot ja vuoren juuri pysyvät terävinä. Maaston väritys tarkemmaksi: 4× tai 8× (8× kysyy varmistuksen; 16× poistettu).
- **v2.64 silmäpainike:** Grafiikka- ja Extra-grafiikka-sivun reunassa; pelin aikana (tauko) valikko muuttuu läpinäkyväksi, jolloin muutokset näkyvät
  pelissä suoraan. Päävalikossa (ei peliä käynnissä) painike on harmaa eikä toimi. v2.65: näkyvissä vain ääriviivat, symbolit ja tekstit.

- **Näppäimet** vaihdettavissa vahvistuksella (ei varattuja eikä päällekkäisiä); oletus mm. WASD, Shift juoksu, Välilyönti hyppy, C kyykky,
  E käytä, B rakennus, R/G/H/Q/Z/X/F rakentaminen, Tab reppu, M kartta, J taso, L ilmoitukset, T tehtävä/tavoite piiloon, (K ei tee mitään – koko näytön näppäin poistettu v2.18; käytä selaimen F11:tä), N minikartan zoom.
- **Grafiikka:** 3D-resoluutio, automaattinen laatu, piirtoetäisyys 60–400 m, yksityiskohdat, rakennusten yksityiskohdat, hiukkaset,
  valonlähteiden määrä, usva ja höyry, pilvet, valonsäteet, puiden heiluminen.
  **Väliotsikot (v1.12):** Yleiset, Luonto, Valo, Partikkelit, Rakennukset; Varjot-sivulla Auringon varjot ja Tulien varjot.
  **Automaattinen säätö (v1.12):** yleinen kytkin + osa-alueet (resoluutio, hiukkaset/usva/ruoho, piirtoetäisyys, varjot); nykiessä yksi
  askel kerrallaan 6 s välein, sujuessa takaisin. **FPS-näyttö:** valittava kulma (oletus pois, ensimmäinen vaihtoehto oikea yläkulma).
  **Usva ja höyry (v1.10):** Korkea (entinen), Normaali (oletus: höyry ja sisäkiehkurat puolet haituvista, 1,2× isommat ja 1,39× tiheämmät
  → sama paksuus), Matala, Pois. Maanpinnan usva täysimääräinen Korkealla ja Normaalilla.
- **Varjot:** laatu, auringon varjojen tarkkuus ja etäisyys, päivitystiheys, tulien varjot ja niiden tarkkuus.
- **Äänet:** proseduraaliset (`sfx`), sävelkorkeus vaihtelee ±3,5 % joka soitolla. Puun ja tukin iskut ovat sama kirveenisku; viimeinen isku
  lähes sama (pystypuu: hiljainen ritinä, tukki: pehmeä tumma tömähdys), kaatunut puu tömähtää tummasti. Tömähdyksen sävel puun koon ja
  voimakkuus etäisyyden mukaan; omat äänet kiven hajoamiselle ja rakenteiden murtumiselle.
- **Ohjaus (v2.53, ent. Ohjaus ja ääni):** rulla pikapaikoille, kameran etäisyys, käänteinen pystyhiiri; äänet omalla sivullaan Äänet ja musiikki. Oletukset merkitty, sivukohtainen palautus.
- **Piirtoetäisyys karsii:** maisema sumuun, puut ruuduittain, rakennukset, viholliset (ei animointia), staattiset kohteet, ulottuvuudet.

## 16. Tallennus (save.js)

- `localStorage` (`hiidenmaa_save_v1`, automaattisesti 90 s välein), pakattu tallennuskoodi (`HM2:`) ja .txt-tiedosto.
- Tallentuu: pelaaja, reppu, rakennukset, maanmuokkaukset, kaadetut ja siirtyneet puut, haudat, liput (`flags`: tarina, löydöt, avaimet,
  ulottuvuuksien siemenet, kaatuneet pomot, avatut arkut). Ei tallennu: maassa olevat esineet, kaukaiset viholliset.

## Taistelu v1.33 (lista 3)
- Kilpi kuluu: puu 20, kupari 15, rauta 15 torjuntaa; rikki 60 s, sitten ehjä. Torjunta puu 60 %, kupari 80 %, rauta 90 %.
- Kaikki eläimet ja hirviöt +25 % terveys ja vahinko. Pomot: Jäätär 840, Kalmaherra 1280, Aarnihirviö 1872, Kalmanvartija 2250.
- Pomo paranee täyteen ~10 s:ssa, jos siihen ei osuta minuuttiin; ulottuvuudesta poistuminen palauttaa pomon täyteen.
- Mobit lyövät liikkeestä 0,1 s viiveellä, jäähy lyöntien välillä. Tavallisten ulottuma enintään 1,9 m.
- Pelaajan taistelu −10 % (vahinko, tönäisy, lyöntinopeus).
- Yöhirviö: kerran yössä 20 % vuorilla / 10 % muualla, varmasti jos edellinen yö jäi nukkumatta; 6,6 m/s, hyökkää heti.
- Tulinuolen valo hiipuu lennossa, sateessa kaksi kertaa nopeammin; osumasta liekki ja valo sammuvat 5 s:ssa (v1.98), sateessa tai vedessä heti.
- Tulinuolen valo hiipuu lennossa, sateessa kaksi kertaa nopeammin; osumasta sammuu 2 s:ssa.

## Eteneminen ja arvoesineet v1.34
- Järjestys (v2.62: + Kalmon sinetti ylimykseltä): Jääavain (satunnainen vanha arkku, ei Hautakummun kirstu) → Routaportti → Jäätär (luuavain) → Kalmankammio → Kalmaherra
  (aarniavain) → Aarnihauta → Aarnihirviö (Kalmankruunun sirpale) + 2 sirpaletta Aarnihaudan arkuissa → Kalmankehän alttari (3 sirpaletta)
  → Kalmanvartija (viimeinen pomo).
- Pääsaaren arkkujen tavalliset tavarat arvotaan maailman luonnissa.
- Arvoesineet (avaimet, sinetti, Vartijan sydän, sirpaleet, hiidenkivet, harvinaiset ★) eivät katoa maasta, hehkuvat ja siirtyvät **v2.62: 60 s**
  jälkeen (pelaaja > 10 m tai muualla) arkkuun, josta ne normaalistikin löytää: ulottuvuuspomon esine saman ulottuvuuden arkkuun, sinetti
  Hautakummun kirstuun, muut maailman arkkuihin (ilmoitus "… on hukattu"). Reppu, arkut ja hautakasa ovat turvassa. Kadonneet uniikit palautetaan.
- Kaksi kylttiä antaa kryptiset vihjeet (E lukee).
- Maassa olevat esineet näkyvät kuvakkeina, joilla on paksuutta (asetus).

## Asetukset v1.35
- Grafiikka-sivun ylälaidassa esiasetusliukusäädin Low → Ultra (8 tasoa, oletus Medium); käsin säädettynä "Custom".
- Varjot ovat Grafiikka-sivun väliotsikko. Uudet: Veri (Normaali/Vähän/Pois), Maassa olevat esineet (3D-kuvake/kevyt), Ultra-tasot.
- Usva ja höyry: Ultra / Korkea / Normaali (oletus, kevyempi kuin ennen) / Matala / Pois.
- Profiilit-välilehti: kaikki asetukset ja näppäimet tallennetaan nimellä, otetaan käyttöön tai poistetaan.
- Muutokset näkyvät heti myös tauolla. Automaattitallennus 2 min välein. Lumisade kulkee tuulen mukana.

## Valikko ja hiiri v1.36
- Päävalikon maailmalista: enintään 5 maailmaa (nimi, viimeksi pelattu, päivä, taso, kartta). Pelaa / Nimeä / Poista (vahvistus) / Uusi maailma.
- Tallenna nyt valikosta, automaattisesti 2 min välein nykyiseen maailmaan.
- Reppu, arkku, rakennusvalikko ja kartta pitävät hiiren lukittuna ja näyttävät pelin oman osoittimen: suljettaessa (Tab, E, M, B…) kamera
  kääntyy heti ilman napsautusta. Esc-taukovalikon jälkeen selain vaatii yhden napsautuksen.

## Efektit ja animaatiot v1.37
- Osumasta lentää verta (isoista enemmän) ja maahan jää läntti, joka häipyy 10 s:ssa; haavat näkyvät mobin pinnassa. Ei-elävät pölisevät.
  Asetus Veri: Normaali / Vähän / Pois.
- Kuollut mob kaatuu velttona, veriläntti alle, katoaa alle 10 s:ssa. Palanut: mustuu ja muuttuu vajoavaksi tuhkakasaksi.
- Pelaajan kuolema: kaatuminen ja veriläntti (1 min); palokuolema → tuhka. Nuotion päällä pelaaja syttyy (sade/vesi sammuttaa).
- Palava mob: isot liekit ja paljon savua.
- Kirves ja hakku: kahden käden isku olan yli vuorotellen kummaltakin puolelta, ei pään läpi. Jousen vetokäsi oikealla olan korkeudella.
- Selkäesineet viistoon (pitkä osa/terä sivulle), jousi ja työkalu ristiin; vyön takana nahkapussi.
- Ulottuvuusportit koristeltu (riimut, kulhot, paadet, teemakoristeet).
- DEV: lento tuplahypyllä (välilyönti ylös, Shift alas).

## Lista 4, erä A (v1.39)
- Kyykyssä eläimet eivät huomaa; ylämäkeen juoksu ja hyppy kuluttavat +30 % kestävyyttä.
- Pomojen iskut +20 %, porttien ja kohteiden vartijat +80 % eivätkä pelkää tulta. Vihollisten hp vaihtelee 100–160 %.
- Rikkinäinen kilpi ei torju ja on selässä. Aarnihirviö paranee vasta 1,7 min jälkeen hitaasti.
- Veren fysiikka (asetus, High+/Ultra): pisarat lentävät iskun suuntaan ja jäävät pintoihin, viillot ja tippuminen.
- Nuolet osuvat puihin ja kiviin. Linnakkeen portaat leveämmät ja muuri ei estä niitä.

## Lista 4, erä B (v1.40)
- P avaa päävalikon ja sulkee kaikki paneelit; Esc ei tee pelissä mitään. Näppäinopasteet (asetus).
- Napsautus paneelin ulkopuolelle sulkee sen, tai pudottaa valitun esineen. Puolitus oikealla napsautuksella kumpaankin suuntaan.
- Omat liukusäätimet ja kytkimet; paneelissa kirjoittaminen menee hakuun.
- Arkut ja tynnyrit avautuvat vain, kun niitä katsoo.

## Lista 4, erä C (v1.41)
- Lumi kiertää pelaajan ympärillä maailmassa ja kulkee tuulen mukana. Sade ja lumi tummuvat yöllä; Medium+ lähivalot värjäävät ne lämpimiksi.
- Seinäsoihtu (2 puu, 1 pihka, 1 rauta): kiinnitetään seinään, palaa 15 min; v2.91 pihka lisää 3 min, puu 1,5 min, hiili 15 min (enint. 60 min).
- Sammunut soihtu syttyy 2,5 m päässä liekistä (nuotio, soihtuteline, seinäsoihtu, hauta- ja ulottuvuussoihdut), kun seisoo 1–1,5 s.
- Arkut: puuarkut lankuista rautavantein ja niitein, linnakkeen kiviarkku riimuin; lukonreikä, avattuna ontto.

## Lista 4, erä D (v1.42)
- Kalmankammion arkuissa kaksinkertainen saalis; Kalmankammiossa ja Aarnihaudassa 30 % mahdollisuus harvinaiseen (sulat, karhuntalja, hiidenkivi, ★2-ase tai -kilpi).
- Kalmaherra ryntää 5 s välein eikä huitaise ilmaa. Alle 50 %: 20 s välein 1–3 tulilinjaa (8 m, 20 vahinkoa + palaminen 4 s, kestää 5 s).
  Alle 30 %: hehkuu punaisena, vain ryntäyksiä 1,5 s välein, 5 kalmoa 20 s välein.
- Kalmankammion kalmoista 10 % on jousikalmoja: ampuvat 3–20 m päästä 2,5 s välein, pitävät etäisyyttä, pudottavat joskus nuolia.
  v1.89: jousi vasemmassa kädessä ja miekka oikeassa kuten pelaajalla; alle 2,4 m lyö miekalla, kauempana ampuu. Veto 1,9 s.
  v1.90: alle 3,2 m päässä veto keskeytyy heti ja kalmo vaihtaa miekkaan; uusi veto vasta yli 3,6 m päässä.
  v1.88: veto 0,9 s, tähtäys seuraa pelaajaa viiveellä (~0,25 s) ja kalmo kääntyy hitaasti (1 rad/s); nuoli lähtee jousen suuntaan vapautushetkellä (2° hajonta, 32 m/s,
  painovoima 7, ei ennakointia) → sivulle väistävä jää nuolen ohi. Jousi pelaajan asennossa (kahva edessä, jänne poskella, nuoli jänteellä).
- Ensimmäinen käynti ulottuvuudessa: iso animoitu otsikko ja tavoite; myöhemmin sivuviesti.

## Lista 4, erä E (v1.43)
- Latausnäyttö: riimukiven riimut syttyvät latauksen edetessä, sumu, kipinät ja säe.
- Palaava kävijä näkee käynnistyksessä HIIDENMAA-otsikon (häivytys sisään/ulos, 3,6 s) ja sitten latausnäytön. Otsikossa vain häivytys.
- Vain ensimmäisellä käynnillä (merkintä localStorage hiidenmaa_intro; F5 ei tyhjennä) 7 s suorituskykytesti ENNEN latausnäyttöä omassa metsänäkymässään (palkki, laskuri, eläva FPS; tulos 9 s:
  FPS, taso, valittu esiasetus + ohje Asetukset › Grafiikka) säätää grafiikan automaattisesti (suositus: ≥50 Medium, 35–50 Medium-, 22–35 Low+, <22 Low).
  Palaavalla pelaajalla ei introa eikä testiä (suoraan latausnäyttöön), eikä grafiikkaa säädetä.
- Uusi maailma alkaa 6 s introlla pilvien yläpuolelta (ohitettavissa millä tahansa näppäimellä). Ei aloitusjaksoa. Alle Medium-grafiikalla
  pilvet ovat 3-kerroksinen maalattu pilviverho (kumpupilvet, valo ja varjo, kerrokset aukeavat eri nopeuksilla), Medium+ 3D-pilvet.
- Taukovalikossa "Tila: Tauko / Käynnissä": Käynnissä-tilassa maailma jatkuu valikon takana (et ota vahinkoa).
- Uusi alue löytyy vasta hieman syvemmällä (~6 m); löytöotsikot häivyttyvät hitaasti eivätkä tule päällekkäin (jono).

## Lista 4, erä F (v1.44)
- Grafiikka › Suorituskyky: kaukainen maasto kevennetty (yli 100 m), staattisten kohteiden yhdistäminen, auringon varjot harvemmin paikallaan.
  Esiasetukset: Low–Medium- kaikki päällä, Medium–Ultra vain yhdistäminen.
- **v2.59:** tallennuksen jatkaminen näyttää latausnäytön (riimukivi, leimahdus ja pehmeä häivytys peliin) eikä jäädytä näyttöä;
  latausnäytön ääni soi vain myöhemmissä latauksissa (pelin käynnistyksessä vain asetuksella Latausnäytön ääni aina).
- **v2.58:** äänet kuuluvat vain siinä tilassa, jossa olet (maailma, Hautakumpu tai kyseinen ulottuvuus) – myös pomojen kaiut katkeavat
  tilaa vaihdettaessa; kaikkien äänten kuuluvuusetäisyys 20 % lyhyempi.
- **v2.57:** siirtoääni vain valmiissa siirrossa (puolituksessa vain puolitusääni); repun ja arkun ikkunat eivät enää veny valittaessa;
  susien ulvonta hiljaisempi ja lyhyemmälle kuuluva (päivällä vielä lyhyemmälle); pienten puiden kaatumisnarina korkeampi; puun
  tömähdys hiipuu pidempään ja pehmeämmin.
- **v2.56:** puolitus: valitse pino ja napsauta kohderuutua hiiren oikealla → puolet siirtyy (Shift + oikea: valitse määrä); valinta
  poistuu siirron jälkeen, eikä hiiren pieni liikahdus sotke. Puolitusääni soi vasta siirrossa; siirtoäänet hiljaisemmat ja vaihtelevammat;
  repun sulkemisääni korkeampi; arkut sulkeutuvat avausäänellä hiljempaa ja korkeammalta.
- **v2.55:** Kalmanvartija on vaikeampi (vaikeus 10): iskut +30 %; alle puolikkaalla terveydellä se raivostuu (punaiset silmät ja
  mittari) ja käyttää kivisadetta (punaiset varoitusrenkaat), maapiikkirivejä ja kolmen kiven heittoa; paranee 30 s ilman osumaa; nousee
  alttarilta täysin voimin; lakkaa paranemasta vasta 5. kuolemasta (ilmoitus).
- **v2.54:** karju, hirvi ja hiidenhirvi soittavat osuessaan iskuäänen, kunnes omat sarviosumaäänet lisätään.
- **v2.66 musiikki** (kansio `music/`): päävalikossa menu1 (aloitusjakson logosta), sen jälkeen menu2-kappaleet; tauolla 15 s jälkeen menu2.
  Maailmassa biomin kappale 10–40 s liittymisestä, kappaleiden välissä 50 s – 2 min hiljaisuutta; biomia vaihdettaessa kappale vaihtuu 80 %
  todennäköisyydellä uuden biomin kappaleeseen (20 %: loppuu). Ulottuvuuksissa, Hautakummussa ja pomotaistelussa oma kappale heti. Häivytys 2,5 s + 2,5 s.
- **v2.53:** valikkomusiikki (aloitusjakson logosta päävalikkoon, häipyy peliin liityttäessä; taukovalikossa 15 s jälkeen); uusi
  asetussivu **Äänet ja musiikki** (master, mykistykset, 7 säädintä 0–150 % (v2.67 + napit), ilmoitus-/alue-/ulottuvuusäänten valinnat); ilmoitus-,
  alueen löytö- ja ulottuvuusäänet; kolmen valikkotaustan satunnaiset hiljaiset äänet (kun äänet on lisätty).
- **v2.52:** jos selain estää äänet, alareunassa näkyy kaiutinmerkki ja "Napauta näyttöä kuullaksesi äänet" (jakso alkaa 2 s
  myöhemmin; napautus ei ohita jaksoa); äänet aloitusjaksoon, latausnäytön loppuun, uuden maailman introon (tuuli, linnut, pilvien
  wuush, syöksy) ja varmistusikkunoihin (kun äänet on lisätty).
- **v2.51:** valikkoäänet (kun äänet on lisätty): napin päälle vienti ja painallus, liukusäätimen naputus liikutettaessa, Ultra-merkkiääni,
  Extra-grafiikan päälle/pois-äänet; uusi asetus Valikkoäänet (Ohjaus ja ääni, oletus 70 %).
- **v2.50:** puun tömähdys riippuu puun koosta (isot puut pitkä hiipuva tömähdys, pienet lyhyt); repun sulkemisääni on sama kuin
  avaamisen mutta hieman korkeampi; uudet rakentamisen ja valikoiden äänet (asetus, korjaus, purku, valmistus, kartta, sulje …).
- **v2.49:** Kalmanummella usva sakenee ja maailma harmaantuu hitaasti (puolena päivistä voimakkaasti, muulloin lievemmin); Hautakummun
  suusta näkyy syvenevä luolakäytävä, ja portti on maassa kaikilla kartoilla; Ultralla pilvimaton reuna häipyy pehmeästi.
- **v2.48:** sumuinen sää on sakeampi (näkyvyys noin 22 % lyhyempi); pilvimatto noin 60 %:na päivistä, ja muina päivinä se on usein (70 %)
  taivaalla aamulla ja väistyy aamupäivällä.
- **v2.47:** pilvimatto noin joka toinen päivä; linssiheijastuksen voimakkuus vaihtelee päivittäin ±10 %; 3D-pilviä noin 70 %:na päivistä (muulloin
  selkeällä taivas tyhjä, ellei tuuli, myrsky tai sade tuo pilviä); pilvet ovat korkeammalla (3 omaa korkeuttaan) ja selkeällä 10 % läpinäkyvämpiä.
- **v2.46:** repun ruudut eivät enää vilku soihtu kädessä, ja puolitus klikkaamalla toimii aina. Pilvet ovat pehmeämpiä ja vaihtelevampia (isoja ja korkeita kumpupilviä). Hukkuessa soi hukkumiskuoleman ääni.
- **v2.45:** Extra-grafiikka › Terävät soihtuvarjot: käsisoihdun varjot selvärajaiset (1024 px), päivittyvät joka kuva ja ulottuvat 7 m; laatu heikkenee matkan kasvaessa.
- **v2.44:** joinakin päivinä (noin joka neljäs) taivaalla on läpikuultava pilvimatto millä säällä tahansa; se tulee ja menee päivän aikana ja himmentää aurinkoa hieman.
- **v2.43:** Hautakummun kumpu jatkuu portin taakse (ei rakoa). Porttien, arkkukivien, raunioiden ja kummun usva ja höyry ilmestyvät vasta
  lähestyttäessä (28 m → täysi 18 m, 80 % entisestä) ja piirretään kevyesti; Extra-grafiikka › Ultra-savut palauttaa entisen (60 m, täysi määrä).
  Soihtujen ja tulinuolten liekit osoittavat aina ylöspäin.
- **v2.41 optimoinnit** (Grafiikka › Suorituskyky; ulkoasu ennallaan, Ultra lähes täysin):
  - **Kaukaiset puut kevyemmin** (`treeLod`): koivut, männyt ja aarnipuut kaukana ilman ohuita oksia ja rungon taivutusjakoja (muoto ja värit samat).
    Etäisyys esiasetuksen mukaan: Low/Low+ 60 m, Medium- 70, Medium 80, Medium+/High 100, High+ 120, Ultra 140 m; Pois = aina täysi malli.
  - **Varjojen optimointi** (`shOpt`, oletus päällä): varjoon piirretään vain varjoalueella olevat puut ja kivet (ennen kokonaiset 70 m ruudut);
    maaston taakse jäävien varjot pois (ladataan ennen kuin harjanteen yli näkee). Tulien ja soihdun varjoille omat mallit.
  - **Yksinkertaiset varjot alkaen** (`shLod`): kauempana puiden varjot yksinkertaisemmista malleista. Low 25 m … Medium 40 m … Ultra 90 m; Pois = kaikki tarkat.
  - **Staattisten kohteiden yhdistäminen** koskee nyt myös kaukaisia rakennuksia (yli 70 m; lähellä puretaan, joten rakentaminen, purku, ovet ja tulet toimivat ennallaan).
  - Auringonsäteiden peittotarkistus ei enää pysäytä peliä (luku taustalla). DEV › Suorituskykymittari näyttää kutsut, kolmiot ja ruutuajan.

## Latausnäyttö (v1.45)
- Latauksen valmistuttua riimut leimahtavat 0,8 s lähes valkoisiksi ja kirkkaiksi, sitten näyttö häipyy. Reunoilla nousee hiilloshiukkasia ja tuhkaa.

## Päävalikko (v1.46)
- Päänäkymä ilman vieritystä: otsikko (kivi/metalli/riimut), sankaripainike Jatka seikkailua / Aloita seikkailu (pelissä Palaa peliin),
  Maailmat, Näppäimet, Asetukset (pelissä myös Tila ja Tallenna).
- Maailmat, Näppäimet ja Asetukset avautuvat leveäksi näkymäksi; takaisin Takaisin-painikkeella tai P:llä (Esc valikossa).
- Partikkelit vaihtuvat taustakuvan mukaan; painikkeet kipinöivät hiiren alla ja painettaessa.
- (v1.47) Esiasetussäätimen ulkoasu vaihtuu tason mukaan: Low kivi, Low+ vaskipatina, Medium- metsä, Medium ennallaan, Medium+ kulta,
  High routa, High+ palava punainen, Ultra violetti taika (partikkelit). Logo on halkeillut, sammaloitunut, malmeja ja riimuja sisältävä
  kivikaiverrus rautareunuksella ja hehkuvilla hiidenkivikristalleilla.
- (v1.48) Logolla on 7 teemaa, joista yksi arvotaan aina valikkoon tultaessa: halkeillut kivi, hiidenkivi, sammalkivi, taottu rauta,
  malmikallio, riimukivi ja yhdistelmä.

## Lista 5 (v1.49–)
- Jousi: seisten täysin vedettynä pieni tähtäinympyrä ja pieni hajonta; kyykyssä täysin vedettynä tähtäin pistemäinen, ei hajontaa,
  veto ja nuolen nopeus +10 %, ja näkyviin tulee tiputusristikko (20–70 m).
- Valikon Tallenna nyt -painike näyttää "Tallennettu ✓" ja välähtää vihreänä.
- Kalmot ja pelottavat yöolennot syttyvät auringossa avoimella alueella (ei metsässä, katoksen alla, pilvisellä/sateella eikä yöllä; kalmot ja ylimykset eivät pala Kalmanummella – v2.14):
  ryntäilevät palaen ~3 s, hidastuvat ja muuttuvat tuhkaksi ~6 s:ssa (ei saalista). Liian lähelle mennessä syttyy itsekin.
- Valikossa 21 animoitua taustaa (mm. kaatuvia puita myrskyssä, raivoava karhu, susilauma, hirvi järvellä, ulottuvuuksien vihjeet,
  Kalmanvartijan varjo salamoissa, nousevat kalmot, ahjo). Portaalikuva on eeppinen riimukaari, joskus hahmo portin edessä.
- Uutta maailmaa luotaessa näkyy riimukivi-latausnäyttö; sen jälkeen pilvet aukeavat kameran edestä sivuille (Medium+ 3D-pilvet,
  muuten pilviverho) ja intro alkaa pilvien yläpuolelta ilman nykimistä.

## Lista 6 (v1.53–)
- Piikivikirves (työpenkki: 3 puuta, 3 piikiveä, 1 nahka; taso 2): kaataa puut kivikirvestä nopeammin, ei kovia puita.
- Kävellessä hahmo keinuu hyvin vähän sivuille (~0,7°); juostessa enemmän ja osin eteenpäin.
- Paikallaan hahmo hengittää (4,2 s rytmi). Jos peliin ei kosketa 3 s, AFK-animaatio: pää katselee ympärilleen, kädet liikkuvat ja paino siirtyy jalalta toiselle.
- Asetukset › Ohjaus: kääntymisen herkkyys ja pelin paneelien osoittimen herkkyys. Osoitin liikkuu viiveettä.
- Ensimmäisellä käynnillä aloitusjakso: "EricStudios & KSPK-tech" allekkain ja tekijänoikeudet → HIIDENMAA kivikaiverruksena → varoitus
  (tietokone, hiiri ja näppäimistö; vältä turhaa Esc-painamista, valikko = P) → suorituskykytesti → riimusiirtymä latausnäyttöön (studio 3,5 s, logo 5,2 s, varoitus 9 s; varoituksessa myös "Paras yhteensopivuus Windows-käyttöjärjestelmällä"). Mikä tahansa näppäin tai napsautus ohittaa
  kaiken suoraan latausnäyttöön. Peli latautuu vasta tämän jälkeen; latauksen aikana vain riimujen täyttyminen, valmiina vaalea leimahdus.
- Ultra-asetuksella veri lentää tuplasti rajummin. Verilätäköt mukailevat rinnettä, ja Medium+ jyrkässä (> 45°) rinteessä lammikko
  valuu 10 s alas.
- Jousi on selässä litteänä; jos repussa on nuolia, selässä näkyy 3 nuolta.
- Jousi: naru vedetään oikein taaksepäin, ote kahvasta, osumamerkki (X) osumasta. Kyykkyristikko 40/80/120 m.
- Q pudottaa pelissä valitusta pikapaikasta yhden, Shift+Q koko pinon (reppu auki: hiiren alla oleva/valittu kuten ennen).
- Kirveellä/hakulla hakatessa kädet hieman ylempänä ja edempänä, eikä iskujen välissä tai lopussa ole pyörähdystä.

## Katoamisajat (v1.57)
| Mikä | Katoaa |
| --- | --- |
| Osuman veriläiskä, pisaran läiskä (maa/seinä) | 10 s (häivytys viimeiset 2,5 s) |
| Vihollisen kuoleman lammikko ja ruumis | 9,4 s (ruumis vajoaa 7 s jälkeen; tuhkakasa samoin) |
| Pelaajan kuoleman lammikko | 60 s; ruumis/tuhkakasa uudelleensyntymässä |
| Rinteessä valuvan noron läiskät | 40 s |
| Läiskien enimmäismäärä | 140 (vanhin poistuu) |
| Juuttunut nuoli | 6 s |
| Maassa oleva esine | 5 min (vilkkuu viimeiset 15 s); arvoesineet siirtyvät arkkuun |

## v1.65
- Jousta kannetaan jousikädessä kaari alas (aukeaa ylöspäin) ja jänne suorana ylhäällä; jousi heiluu käsivarren mukana (vedossa normaali asento).
- Aloitusjaksossa ei ohitustekstiä ensikäynnillä; palaavalle kävijälle pieni "Ohita: mikä tahansa näppäin".
- Hakukentän napsautus valitsee vanhan tekstin, joten uusi haku kirjoitetaan suoraan päälle.
- HIIDENMAA-otsikko nousee mustasta savusta ja vajoaa mustaan reunat edellä (ensikäynnillä studioiden jälkeen 0,5 s mustaa).
- Valmistusvalikon haku toimii kuten DEV-haku (nimi tai tunniste, parhaat osumat ensin, Enter valmistaa ensimmäisen).
- Siirtymä latausnäyttöön: riimukehä piirtyy, keskellä riimut tavaavat HIIDENMAA, sulautuvat sinetiksi joka leimahtaa (paineaalto, kipinät).
- Suorituskykytesti valitsee kaikista 8 tasosta (Ultra, kun indeksi ≥ 140) ja huomioi tasaantumisnopeuden ja tasaisuuden.
- AFK-eleet: heilunta, pään rapsutus, kädet levälleen; siirtymän lopussa sininen ᚺ ja kaartuva riimurivi.
- Kaatuva puu: osumasta lyhyt sivuilmoitus (väistä sivuun); kuolinruudun vihje vain, jos puu kaatuu päälle 3 kertaa putkeen (v2.77).
- Ensikäynnin aloitusjaksoa ja suorituskykytestiä ei voi ohittaa; merkintä tallentuu vasta jakson lopussa. Palaava kävijä voi ohittaa otsikon.
- Suorituskykytestin aikana (ei tulosruudussa) yläreunassa kerrotaan, että testi on heikompia koneita varten ja grafiikan voi nostaa itse (Asetukset › Grafiikka).
- Näppäinlistassa myös kaikki kiinteät näppäimet (I, Q repussa, Enter, ohitus, DEV-näppäimet).
- Asetukset › Näppäimet: "Näytä kaikki toiminnot" avaa listan kaikista näppäin- ja hiiritoiminnoista tilanteittain (oletusnäppäimet, vaihdettu näkyy "nyt: X").
- Tulinuolten valo kuuluu High+- ja Ultra-esiasetuksiin. Erittäin tarkat varjot (3 tasoa) valitaan erikseen Grafiikka › Varjot (punainen = raskain, päällä "!").
- Valikon partikkelit ja animaatiot pysähtyvät pelin ajaksi ja häivyttyvät esiin valikossa (asetus: älä pysäytä).
- Shift pohjassa: esinetiedot näkyvät heti osoittimen alla olevasta esineestä.
- Jousi käteen / lataus: hotbarin yläpuolella käytössä oleva nuoli ja määrä (tai "Ei nuolia").
- Pääosuma jousella: +10 % vahinko, punainen osumamerkki ja "Pääosuma!".
- Pikapaikan valinnassa esineen nimi ruudun yläpuolella ~1 s, väri harvinaisuuden mukaan (kulta, sininen, vihreä, vaalea).
- Herätessä (uudelleensyntyminen) viholliset 35 m säteellä katoavat savuna (ei pomot, vartijat eikä rauhalliset eläimet).
- Esiasetukset Low–Medium+ kytkevät automaattisäädöt (myös osa-alueet ja varjojen laadun) päälle, High–Ultra pois.
- Erittäin tarkat varjot ohittavat tavalliset varjoasetukset (näkyvät harmaina): 8192 px, päivitys joka ruutu, etäisyys 90 / 110 / 160 m.
- Jos kuolet samalle pomolle 3 kertaa (sama maailma), se pomo ei enää koskaan palauta terveyttään. Kuolinruutu näyttää laskurin (1/3, 2/3).
- Kehittäjätyökalut (DEV) ovat oletuksena pois; päälle Asetukset › Ohjaus › alin rivi (sivu latautuu uudelleen).
- Päävalikossa versionumeron perässä "Early Access 1.0". DEV-viitteet näkyvät vain DEV-tilassa.
- Veren fysiikka (pisarat lentävät ja jäävät maahan) on päällä Medium-esiasetuksesta ylöspäin.

## Äänet (v1.84–v1.86, äänierä A: olennot)
- **v2.86 luonnon äänet:** päivällä linnunlaulu soi koko päivän pehmeästi (pitkä nauhoitus), välillä muita lintuja; öisin heinäsirkat sirittävät omassa rytmissään kahdesta suunnasta; tuulisessa metsässä puiden humina kuuluu hiljaa pätkinä. Salamaniskujen kaiku kuuluu kokonaan.
- **v2.86 ranta:** rannan lähellä aallot lyövät rantaan (tyynellä rauhalliset, tuulella ja myrskyssä kovat); kamera veden alla 20 %. v2.87 käyttäjän äänet: rauhalliset 40 s ja kovat 57 s silmukat, sauma häivytetään 3 s (`LOOP_XF`), ettei toistokohta kuulu.
- **v2.99:** torjunta vain kilpi kädessä; tulen vahinko 2× (pelaaja 8, olennot 10 hp/s); malmit ja kivet uusiutuvat samaan kohtaan 5 vuorokaudessa (ei rakennusten tai kohteiden lähellä); oksat ja marjat uusiutuvat, kun olet ¼ kartan päässä (tarkistus 1/min); maailman arkuissa metalleja enintään ~5 % tarpeesta; jahti loppuu 40 % nopeammin näköyhteyden katketessa; pelottavat 10 %/yö, 2 valvotun yön jälkeen 90 %; hiidenkarhu kaataa aarnipuut ja loikkaa 50 % pidemmälle; eläimet rauhoittuvat vesirajalla ja kääntyvät pois; kuolema-arkku ja majakka (Medium+); kaiku talossa, tunneleissa ja vuorilla; lokit tyynellä rannalla; ahjon ja sulatusuunin valmistumisäänet; chatin koko-asetus; linssiheijastus Medium+:sta, säteiden tarkkuus 3 tasoa; latausnäytön ääni oletuksena aina (4 vaihtoehtoa); DEV vaatii salasanan.
- **v2.99 puukkotemput:** 0,1 % pullonpyöritys kämmenellä (puukko 7 cm kämmenen yläpuolella, vasen käsi antaa vauhtia, hidastuu, pompautus ja kiinniotto); puolet 5 %:n heitoista on kolme korkeaa heittoa putkeen eri korkeuksille; jokaisesta heitosta huitaisuääni: isot heitot −30 %, pienet (pyöräytysheittely, pompautus) −60 %.
- **v3.01 nuotiot:** nuotio 2 paikkaa (ruoka kivien päällä), grillinuotio 6 paikkaa, kypsyy 30 % nopeammin ja palaa hiileksi vasta 3× kypsymisajasta (nuotio 2×). Metsästäjän varras ja juhla-ateria valmistetaan vain grillin lähellä; hiili ja lihakeitto kummankin.
- **v3.01 Poistu pelistä** (v3.02: himmeä ✕ päävalikon oikeassa alakulmassa, teksti hiiren ollessa päällä, pidä pohjassa 1 s – tallentaa pidon alussa, sivuttainen palkki; ei varmistusikkunaa). Alkuperäinen v3.01: päävalikon alin nappi; kysyi tallennuksesta, jos et ollut tallentanut tällä valikkokäynnillä. Sulkee pelin (tai näyttää lopetusruudun, jos selain ei salli sulkemista).
- **v3.02 Keittopata (taso 10):** Keittopata (ahjo: rauta 4, kupari 3) asennetaan Keittopatanuotioon (Työpisteet: kivi 12, puu 6, rauta 2, taso 10). E avaa padan ikkunan:
  tila, arvioitu aika, kansi, sienet, polttoaine, ruoan otto, padan irrotus/asennus ja pataruoat. Kansi pois 10× grilliaika, kansi päällä 8×; kansi päällä kypsyy ilman tultakin
  (−30 %), ilman kantta pysähtyy; hiilloksella −20 %. Aloitus vaatii palavan tulen. Valmis ruoka ei pala, mutta ilman kantta pilaantuu vuorokaudessa → ruoka hiiltyy, pata
  on käyttökelvoton: irrota (Pilaantunut pata + 1 hiili) ja sulata sulatusuunissa (2 rautaa + 1 kupari). Sienet kypsyvät vain padassa (enintään 10). Padan lähellä
  valmistetut pataruoat menevät pataan. Valmis ruoka: höyryä ja äänimerkki (eri ääni kansi päällä / ilman). Pataruoat: puolukkahillo, sienikeitto, puolukkapuuro,
  sienipata, sienirisotto, riistakeitto, juhlapata (tasot 10–13). **Kylläinen**: nälkä kasvaa puolet hitaammin (2–8 min), täyteen syötynä vatsa pysyy täynnä pidempään.
- **v3.02 Hiilos:** kun nuotion, grillin tai padan polttoaine loppuu, tuli hiipuu 10 min hiillokseksi: paistaa −20 %, ei avaa reseptejä, lämmittää puolella säteellä, ei
  pelota olentoja, sade sammuttaa 3× nopeammin, polttoaine sytyttää heti.
- **v3.02 Villikaura:** poimittava kasvi niityillä ja koivulehdoissa (2–3 kpl, uusiutuu 10 min). Risottoon ja puuroon.
- **v3.02 Rakennusvalikon tietoikkuna:** kun hiiri on saman rakennusosan päällä 2 s, valikon vasemmalle puolelle aukeaa ikkuna: pyörivä 3D-kuva, nimi, hinta, kestävyys,
  ominaisuudet ja avattava "Miten toimii?" -selostus. Kortissa näkyy myös tasovaatimus (esim. keittopatanuotio taso 10).
- **v3.02 Korkeat ruohotupsut:** High+ ja Ultra (asetus Grafiikka › Korkeat ruohotupsut): pitkää ruohoa kasoissa niityillä, koivulehdoissa ja metsänreunoilla, huojuu tuulessa.
- **v3.02 Vinkit:** jokainen vinkki näytetään pelaajalle kerran kaikkien maailmojen yli (uusi pelaaja saa kaikki ensimmäisessä maailmassaan); toistuvat vain, kun alun opastus
  on laitettu erikseen päälle eikä sitä ohiteta. Puukon pihkavinkki on lyhyt ja ohjaa esineen tietoihin repussa.
- **v3.02 Äänet:** pihkan tippuminen kulhoon kuuluu hiljaa aivan läheltä (6 m). Pihkankeräyksen äänet ovat `sounds/extra/raw/pihka/`.
- **v3.02 Päävalikko:** Early Access 1.1.
- **v3.05 Äänet:** padan, pihkankeräyksen, kaatuneen veden (kirous, vihainen), F-ihmettelyn, sulatusuunin ja ahjon äänet ovat käyttäjän omia; padan äänet hiljaisia.
  Veden vaativa pataresepti soittaa alussa veden kaatoäänen.
- **v3.04 Vesikulho kaatuu:** jos F-tarkastelu kääntää vesikulhon ylösalaisin, vesi kaatuu (Hups!, hahmo kiroaa): Märät kengät 60 s (liike −11 %), Kylmä 30 s, Vihainen 20 s
  (kestävyys kuluu 20 % nopeammin, ärtynyt ääni 5–10 s välein). Liikkuessa hahmo kantaa vesikulhoa vaakasuorassa, joten juoksu ei kaada.
- **v3.03 Routaluola:** tunnelmasilmukka ja satunnaisäänet `satunnainen_routaluola` (_0, _1) 15 % hiljempaa.
- **v3.01 olentojen uusiutuminen:** ulottuvuuksissa ja Hautakummussa kuolleet tavalliset olennot palaavat yksi kerrallaan 20 min välein (ei pomot eikä Kalmon ylimys).
- **v2.99 AFK ja esine kädessä:** millä tahansa esineellä oikeassa kädessä selän rapsutuksen tilalla 30 % tarkastelu tai 70 % hengitys ja pään pyörittely (venyttely säilyy).
- **v2.99 F-vinkki:** kun otat puukon käteen 10. kerran (tutoriaalin jälkeen), tulee kerran vinkki F-tarkastelusta – toimii myös muilla työkaluilla ja aseilla.
- **v2.99 AFK-lähitarkastelu:** AFK:ssa esine kädessä hahmo tutkii sitä läheltä 10 %:n todennäköisyydellä kerran AFK-jaksoa kohden (heti alussa tai 5–10 s AFK-animaation jälkeen).
- **v2.99 F-tarkastelu:** pehmeät siirtymät (paluu lepoon, F uudelleen jatkaa edellisestä asennosta), uudet animaatiot: miekan huitomis- ja pistokoe, villit puukon pistot, korkea heitto (puukko irti kädestä, nappaus väärinpäin), 10 % pyöräytysheittely; DEV-listassa vihje mille esineelle.
- **v2.98 F-tarkastelu:** F (kun vasara ei ole kädessä) – hahmo nostaa käden eteen ja kääntelee esinettä hitaasti, pää seuraa. 11 animaatiota: pitkät aseet ja työkalut (terän katselu, pituuden katselu, pistokoe), raskaat (terä, punnitus, hidas heilautus), pienet (lähikatselu, ojennettuna, lähelle ja kauas), puukko (pistot; 5 %: heitto ja kiinniotto väärinpäin, sivu- ja yläpistot). Keskeytyy, kun kättä käytetään tai esine vaihtuu. 2 s kohdalla 30 %: wow/mmm (sounds/extra/f_ihmettely). Uusi esine kädessä (alle 2 min) + AFK 4 s → tarkastelee itsestään, ääni varmasti. DEV Ä: kaikki animaatiot (0,2 s viive).
- **v2.98 hylätty leiri:** teltta 3,2 × 2,6 × 3,2 m, kiinteä; sisään vain kyykyssä (sisällä pakotettu kyykky, ei hyppyä), olennot eivät näe teltassa (paitsi alle 2,5 m), suoja sateelta. Halkopino kiinteä, kirveellä 7 iskua (rautakirves vähemmän) → 20 puuta. Kuivaustelineen taljat: kerran 3 nahkaa / naru / nahkavaatteet. Ämpäri ja tolpat kiinteitä. Leirin nuotio ei paista (tavallinen tuli).
- **v2.98 repun tiedot:** puukko (pihkan keräys, pihkapuut, 10–50 pihkaa, laatu ★2 +10 % / ★3 +20 %), kulho, vesikulho, naru.
- **v2.97 pihka:** pihkapuun kellertävät valumat 10 % kirkkaammat; ensimmäisen puukon saamisesta 2 s:n kuluttua ohje pihkankeräyksestä (chat + vinkkilaatikko 14 s, kerran maailmaa kohti).
- **v2.96 pihkakuvio:** kuvio, kulho ja naru liikkuvat puun mukana (huojunta, kaatuminen); kaatuneen puun tukkiin jää tumma läiskä kaiverruksen kohdalle. Urat himmeämmät. Kulho täyttyy puun koko pihkamäärän mukaan – kun kaikki on valunut, kulho on täynnä keltaista, hieman oranssia.
- **v2.96 DEV-valikko:** kello, terveys, kylläisyys, sää, nopeudet ja kytkimet päivittyvät valikossa pelin mukana.
- **v2.95 pihka kaadosta:** vain lajin suurimmasta neljänneksestä (kuusi, mänty, aarnipuu), enintään 1 pihka ja 25 %:n todennäköisyydellä.
- **v2.95 pelaajan malli:** välkkyvät päällekkäiset pinnat korjattu (kengänpohjat, vasara, nuija, soihdun liekki, kupari-/rautapanssarin vyö ja solki, hiidenpanssarin saumat, nahka-/karhuasun säärikääre, vyön nahkapussi).
- **v2.94 sulatusuuni:** jokainen sulatus (kupari, rauta, lasi) kuluttaa 2 puuta (`SMELT_WOOD`); hiili vastaa 10 puuta.
- **v2.93 DEV-nopeudet (Ä):** Maailman nopeus 0,5–30× (koko peli) ja Pelin ajan nopeus 0,5–30× (vain kello, sää, nälkä ja tehosteet, tulet ja soihdut, ruoka, sulatus, pihka); molemmat palaavat 1×:ksi uudelleenlatauksessa.
- **v2.92 resurssit:** puut antavat 10 % enemmän puuta (kaatuminen ja tukit, myös tervaspuu); kaadetusta puusta saa pihkaa 20 % harvemmin (v2.95: ks. alla); oksia ja irtokiviä on maassa 20 % vähemmän.
- **v2.91 puukko:** ahjo, 3 rautaa + 1 puu, taso 6. Vahinko kuin rautamiekka (34), kantama vain 1,2 m (miekka 2,7), nopea (0,3 s), kestävyys 5. Paranna tasolle 2–3 kuten muut aseet (+25 % vahinko/taso); taso 2 kaivertaa ja valuttaa pihkaa 10 %, taso 3 20 % nopeammin. Kuvauksessa ohjeet.
- **v2.91 pihkankeräys** (`js/resin.js`): 3 % männyistä ja kuusista (koko ≥ 0,75) on pihkapuita (seedin mukaan), vähintään yksi 80 m sisällä aloituspaikasta. Tuntomerkki vain hillitty kellertävä pihkavaluma rungossa; ei ilmoituksia. E-ohje näkyy vasta aivan rungon vieressä (rungon puolileveys + 0,95 m) ja kun kädessä on puukko, kulho tai naru.
  1) Puukko kädessä E → kaiverrus 10 s (kädet vetävät puukkoa, lastuja), kuvio pelaajan korkeudelle lähimmälle rungon sivulle: kuorittu alue → kalanruotourat ylhäältä alas → keskikouru. Kävely pois (yli 0,35 m ulottumasta), käden vaihto, lyönti tai uinti keskeyttää; jatkuu samasta kohdasta. 2) Tyhjä kulho kädessä + naru toisessa kädessä, E → kulho sidotaan kuvion alle narulla rungon ympäri. 3) Pihkaa kertyy puun koon mukaan 10–50 kpl tunnissa (v2.95; pienin pihkapuu 10, suurin 50; 1 h oikeaa aikaa, vain pelin ollessa käynnissä, pelaajan ei tarvitse olla paikalla; urat kellertävät). 4) E irrottaa kulhon: kulho, naru ja pihkat reppuun (+4 XP/pihka); voi sitoa uudelleen. Puusta saa yhteensä koon mukaisen määrän (10–50), sitten kuvio hiipuu 2 min:ssa ja puu ei enää anna pihkaa. Monta puuta voi valuttaa yhtä aikaa.
  Väärin aloitettaessa selvät ilmoitukset (ei puukkoa, ei narua, kulhossa vettä, väärä puulaji, nuori puu, ei pihkapuu). Kaatunut puu (myrsky tai kirves): kulho, naru ja pihkat putoavat maahan + ilmoitus. Tila tallentuu (`flags.resin`).
- **v2.91 kulho ja vesikulho:** kulho työpenkillä (3 puuta, taso 2), kädessä. Hiiren vasen veden ääressä → nimi vaihtuu Vesikulhoksi. Vesikulho: juo (vatsakipu kuluu 5× nopeammin kunnes ohi) tai jos palat, kaada päälle (tuli sammuu, ei juoda); vesi käytetään kerralla ja kulho on taas tyhjä.
- **v2.91 naru:** työpenkki, 10 nahkaa, taso 2; pidetään toisessa kädessä kulhoa sidottaessa.
- **v2.91 puukkohiidet:** 20 % sammalhiisistä kantaa puukkoa (näkyy kädessä nuijan tilalla): isku +50 %, tahti 15 % nopeampi, ulottuu vain 0,9 m (pitää lähes törmätä pelaajaan); puukko ei putoa.
- **v2.91 saavutus Pihkankerääjä:** 20 pihkaa pihkapuista (+5 kantokyky).
- **v2.90 sade ja lumi:** eivät näy rakennusten sisällä missään tuulessa – suojakartta `COVER` (0,4 m ruudut, 0,2 m varmuusvara) tarkistaa pisaran molemmat päät joka ruudulla; lumi ei enää sada kattojen läpi.
- **v2.89 latausnäytön ääni:** riimujen leimahdusääni 20 % hiljaisempi (`BS_EVK`, boot.js).
- **v2.88 ovet:** puuoven avausääni −30 %, muut oven äänet (narina, kiinni, rauta- ja kivioven avaus) −10 % (`DOOR_V`). Kahvat molemmin puolin aina näkyvissä (kilpi, varret, vetoripa; ennen yksityiskohta-asetuksen takana ja liian tummat).
- **v2.86 ovi:** avatessa avausääni ja saranan narina, sulkiessa narina ja kiinni-ääni sulkemisen lopussa. v2.87 käyttäjän äänet: narina on 0,85 s pätkä raakatiedoston keskeltä (ei alkuosaa, `MID_EV`) ja häipyy 0,25 s:ssa oven pysähtyessä (kääntyminen 0,6 s); avaus- ja kiinni-ääni alkavat suoraan kuuluvasta iskusta (`ATTACK_EV`, `attack_start`: 5 ms ikkunat ylipäästön jälkeen, 8 dB voimakkaimmasta). Kaksi narinaversiota arvotaan.
- **v2.87 alastulo:** käyttäjän uusi alastuloääni (0,23 s).
- **v2.86 viimeinen pomo:** Kalmanvartijan terveys alle puolet → oma kappale toistuu kuolemaan asti; kuollessa voittokappale soi kerran loppuun (paikkamerkit).
- **v2.86 valikko:** taustakuvissa hiljaiset äänet (leirin nuotio ja sirkat, ahjon alasin iskun tahdissa, kaukainen myrsky); Äänet › "Päävalikon taustakuvien äänet" mykistää.
- **v2.85 kilpi:** torjunnan pito kuluttaa kestävyyttä 1/s (ei palaudu pidon aikana). Kun kestävyys loppuu, kilpi laskeutuu ja tulee ilmoitus; uudelleen nostettavissa, kun kestävyyttä on 20.
- **v2.84 tulen ääni:** nuotiot, grillinuotiot, käynnissä oleva sulatusuuni, soihdut ja luolien liekit rätisevät (palamisääni); enintään kaksi lähintä soi kerralla, nuotio kovimmin. Sammuneen sulatusuunin suu on musta.
- **v2.84 pelottavat eläimet** (hiidenkarhu, hiidenhirvi, kalmasusi): jos et ole nukkunut sängyssä kahteen yöhön, yksi tulee varmasti seuraavana yönä; muuten 10 % todennäköisyys yössä.
- **v2.83 kodin lämpö:** toimii myös seinän vieressä ja pienessä 1×1-mökissä; yksittäinen tarkistus ei enää hiivuta; Lämmin koti estää kylmettymisen ja kuivattaa kuten nuotio; lämmönlähde lasketaan, kun sen ja pelaajan välissä ei ole seinää.
- **v2.83 valikko:** päävalikossa ja tauolla pelin äänet häipyvät ja palaavat jatkettaessa (silmukat jatkuvat samasta kohdasta).
- **v2.83 kiviversiot:** Kivimuuri (paaluaidan kiviversio) ja Kivinen soihtupylväs (seisovan soihdun kiviversio) Kivi-välilehdellä. Kiviarkussa 18 ja kivitynnyrissä 14 paikkaa (puuversioissa 16 ja 12); laajennuksia 2 × +8 → enintään 34 / 30.
- **v2.82 seinäsoihtu:** kohdistuu G:n tilan mukaan – ruudukko: seinäosan keskelle soihtukorkeudelle, puoli: neljännekset, 1 m: metrin välein, 3D: 0,25 m, reuna: seinäosan reunaan, vapaa: mihin tähtäät.
- **v2.82:** uusi kertavinkki: jos rakentaminen tuntuu hankalalta, paina G (esim. G: vapaa, jatko). Vinkit näytetään pelaajalle vain kerran kaikkien maailmojen yli; opastus ja vinkit vain maailmoissa, joissa opastus on valittu (oletuksena vain ensimmäinen maailma, jos opastusta ei ole käyty).
- **v2.81:** sääänet (sade, myrsky, tuuli, lumi, sumu, ukkonen, salama) 60 % hiljempaa, jotta muut äänet kuuluvat.
- **v2.80:** sydämen syke on yksi jatkuva silmukka (ei ala alusta), voimakkuus ja tahti muuttuvat pehmeästi, loppuu 3 s jälkeen 2,5 s häivytyksellä; tiedosto kokonaisena.
- **v2.79:** susien ulvonta kuuluu yhtä kauas kuin muiden eläinten ääntely (36 m); kaukaista yöulvontaa ilman sutta ei enää ole. Sää- ja tunnelmaäänet 20 % hiljempaa.
- **v2.76:** hengästys ei ala alusta: kun kestävyys palautuu, sama ääni hiljenee vähitellen (0 % täysi → 30 % hiljaa) ja voimistuu taas, jos kestävyys loppuu; loppuu vasta, kun kestävyys on ollut yli 30 % 4 s (häivytys 2,5 s, sen jälkeen vähintään 1 s tauko ennen uutta). Tiedosto toistuu kokonaisena (ei leikkausta).
- **v2.75:** liukusäätimen napsu vielä 20 % hiljempaa ja tasaisempi sävel; esiasetussäätimessä napsu kuuluu vain, kun taso vaihtuu.
- **v2.73:** liukusäätimen napsu 40 % hiljempaa, askeleet 30 % hiljempaa, hengästys 20 % hiljempaa; äänimerkki häipyy 2 s:ssa ja napautus aloittaa intron heti.
- **v2.72:** nopeat toiminto- ja käyttöliittymä-äänet alkavat heti (3 ms, ennen 20 ms); hengästys on käyttäjän uusi ääni saumattomana silmukkana.
- **v2.67 silmukat ja tunnelma:** jokainen silmukka pitää yhden arvotun version; sää ristihäivyttää 2,5 s; siirtyessä maailman ja ulottuvuuden
  välillä vanhat loppuvat 0,3 s ja uudet alkavat 1 s kuluttua; tauolla kaikki hiljenevät 1 s. Myrskyssä myrsky + ukkosen taustasilmukka, salaman
  jälkeen 0–3 s salama-ääni. Veden alla oma silmukka (0,5 s) ja kaikki pelin äänet vaimeina (ei musiikki eikä valikot).
  Luonto (linnunlaulu päivällä, heinäsirkat yöllä, puiden humina tuulella) ja biomien sivuäänet (korpi, koivulehto, aarnimetsä, upposuo,
  kalmanummi, rantaniitty, päivä/yö) soivat satunnaisina 30 s – 2 min jaksoina hiljaa taustalla.
- **v2.67 pelaaja:** hengästys silmukkana kestävyyden ollessa 0 → yli 30 %, ja ylikuormassa liikkuessa; ylikuorma kuluttaa kestävyyttä 5/s.
  Putoamisvahingossa tömähdys, yli 25 % HP:sta myös nilkka-ääni; pää veden alle = sukellus, pintaan = pinnalle (yli 2 s → haukkoo henkeä).
  Kaatuvan puun narina ja tömähdys kuuluvat puolet lyhyemmälle. Ulottuvuuksissa tavallisen olennon idle vain alle 15 m, yksi 40 s välein.
- **v2.67 ilmoitusääni:** pitkät ja erityiset viestit tai hiljaisuus; ei päällekkäin pelaajan toimintoäänten kanssa.
  Asetuksissa oma säädin Napit (hover ja klikkaus), perustaso 20 % hiljempi.
- **v2.61 sää ja tunnelma** (`sounds/saa_ja_tunnelma/`, käyttäjän äänet): maailmassa sään silmukat (sade, tihku, myrsky, tuuli, lumisade vuorilla,
  sumu) voimistuvat ja hiipuvat sään mukana (ristihäivytys 2,5 s), sisällä vaimeampina, veden alla hiljaa; ukkonen jyrähtää salaman jälkeen.
  Ulottuvuuksissa ja Hautakummussa oma tunnelmasilmukka ja 10–40 s välein satunnainen tunnelmaääni (puuttuessa yhteinen). Taso Taustaäänet.
- **v2.60 päällekkäisyysraja (olennot, ei pelaaja):** lajeissa idle, chase, aggro (hyökkäys) ja echo sama äänitiedosto soi enintään 3 päällekkäin;
  kun toinen päällekkäinen kopio alkaa, tiedosto on 1 s tauolla; jos sama tiedosto on alkanut 3 kertaa 3 s sisällä, tauko on 8 s; sama tiedosto
  ei ala uudelleen alle 0,15 s päästä. Estetyn tilalle arvotaan toinen versio, ja ääni jää pois vasta, kun kaikki versiot ovat estettyjä (ei siirretä
  myöhemmäksi). Lisäksi sama olentolaji + äänilaji enintään 3 kerralla (esim. kalmojen hyökkäysäänet Hautakummussa). Osuma- ja kuolemaäänet
  eivät kuulu rajaan. DEV-suorituskykymittari näyttää pois jääneet äänet.
- **Osumaäänet (tila v2.49):** olennon isku pelaajaan soittaa kategoriansa äänen (isku, purema, raapaisu, murskaus ✓; sarvet → v2.54 iskuääni,
  kunnes omat äänet lisätään). Pomojen maaisku ja nova eivät soita osumaääntä.
- **v2.14 kuuluvuus:** kutsuäänet kuuluvat noin 150 m, muut 64 m, rauhallinen ääntely 36 m. Kaukana suora ääni hiljenee 30 %, tummuu
  (puolimatkassa alle 1,5 kHz), kaikuu (jopa ~1,9 × suora) ja huojuu hieman. Sudet ulvovat päivällä 3× harvemmin, yöllä 20 % harvemmin; yön
  kaukainen ulvonta 100–145 m.
- **v2.12 kuuluvuus:** kutsuäänet (📢 suden ulvonta, hirven mylvintä, metson soidin, karhun karjaisu) kuuluvat noin 220 m päähän, muut äänet noin
  80 m (rauhallinen ääntely alle 45 m). Kaukana ääni hiljenee, tummuu (alipäästö 15 kHz → 650 Hz) ja kaikuu enemmän. Yöllä ulkona kuuluu
  45–110 s välein (60 %) kaukaista suden ulvontaa 150–230 m päästä. Pitkiä kutsuääniä ei katkaista kesken (enintään 10 s, loppu luonnolliseen taukoon).
- **Toimintoäänet (v2.16):** olennot jaetaan 12 ryhmään (kaksijalkaiset, luurangot, nelijalkaiset, raskaat, kevyet nelijalkaiset, kevyet
  kaksijalkaiset, kivivartija, jokaisella pomolla oma, yhteiset). Askeleet alustan mukaan (ruoho, kivi, hiekka, lumi, suo, puu, jää, pusikko,
  kahlaus, uinti; Aarnimetsässä välillä oksa rasahtaa), lähimmät 6 alle 20 m (isot 40 m; v2.24: 16 / 32 m); pomon askel lähellä tärisyttää. Kaatuminen, törmäys
  kovassa vauhdissa, isku ja osuma, palaminen (rätinä), lentoonlähtö (metso), nousu syntyessä, luiden kalina, nuuhkiminen, loiskahdus,
  ravistus vedestä noustessa (myös animaatio), kahina juostessa metsässä. Eläimet syövät rauhassa 20–50 s välein (pää alhaalla, 3–6 s).
  Puuttuva ääni = hiljaisuus. Tila: `sounds/olennot_toiminnot/AANILISTA_TOIMINNOT.md`.
- **v2.33:** pieni hiiren liike napsautuksen aikana ei enää tyhjennä valintaa (raahaus takaisin omaan ruutuun = valinta).
- **v2.32:** valitse pino klikkaamalla ja klikkaa kohderuutua oikealla → puolet siirtyy (Shift pohjassa → slider); toimii nyt myös pelin
  omalla osoittimella (hiiri lukittuna), samoin arkussa.
- **v2.31 poimintaääni:** hieman kimeämpi, sävel vaihtelee ±20 % ja tumma suodin (alipäästö 2,4 kHz) pehmentää sitä.
- **v2.30:** Shift voi olla pohjassa jo ennen valintaa tai raahausta – ratkaisevaa on Shift oikean napin vapautuksen/klikkauksen hetkellä.
  Sliderin napit eivät sulje reppua. Poimintaääni lyhyempi, hiljaisempi ja sävel vaihtelee enemmän.
- **v2.29 repun siirtoslider:** raahaa pinoa oikealla napilla ja vapauta Shift pohjassa kohderuudussa (tai valitse pino ja Shift + oikea klikkaus
  kohteeseen) → slider 0 … pinon koko. Siirrä-nappi tai Enter siirtää valitun määrän, numerot 1–9 siirtävät heti, napsautus ruudun ohi peruu ja puolittaa.
  Toimii repussa ja arkussa. Esineen nosto/lasku ja kasan puolitus saavat omat äänet (`siirto`, `puolitus`). Puun kaatumisnarina loppuu, kun puu osuu maahan.
- **v2.28 pelaajan äänet osa 2:** jousi, lyönnit, osumat (myös puuhun ja kiveen), poiminta, syöminen, juominen ja arkun avaus soivat omilla äänillä.
  Kaatuvan puun tömähdys kuuluu, kun puu osuu maahan (myös karhun kaatamat). Reppu soittaa saman äänen auetessa ja sulkeutuessa; oma arkku
  (ja tynnyri) oman sulkemisäänen (`arkku_kiinni`, kun käyttäjä tuo sen).
- **v2.27 Aarnimetsän askel ja oksat:** pusikkoaskel lyhyempi (0,28 s), voimakkuus ±10 % ja sävel ±9 % joka askeleella. Kun astut maassa olevan
  oksan päälle, kuuluu oksan rasahdus normaalisti; Aarnimetsässä oksa rasahtaa välillä tosi hiljaa. 2 s tauko (myös olennoilla).
- **v2.26 pensaat ja askeleet:** pelaaja kävelee pensaan läpi → heti pusikkoaskel ja puska-ääni (täysi voimakkuus), enintään 2 s välein;
  Aarnimetsässä lisäksi satunnaisesti oksa tai puska (14 % askelista, 2 s tauko). Olennot pensaan läpi → kahina (2 s välein). Pelaajan askeleet
  20 % hiljempaa, ja kaikkien pelaajan äänten voimakkuus vaihtelee ±5 % joka kerta.
- **v2.25 sudet:** suuttumis- ja jahtiääni 30 % hiljempaa ja kantama 20 % lyhyempi; ulvonta kuuluu 15 % lyhyemmälle (~128 m, yöulvonta 85–123 m).
- **v2.25 karhun syöksyisku:** karhu ja hiidenkarhu kyyristyvät, ponnistavat takajaloilla ja loikkaavat 3–6 m:n päästä lyöden toisella käpälällä
  (vahinko ×1,15, tönäisy); enintään 4 s välein. Puita kaatava karhu ei tömähdä kaatamiinsa puihin.
- **v2.25 pelaajan äänet kolmessa osassa:** `sounds/pelaaja_1_liike/` (askeleet, alastulo, vesi), `sounds/pelaaja_2_toiminnot/` (lyönnit, osumat,
  jousi, rakentaminen, käyttö, valikot), `sounds/pelaaja_3_aanet/` (kipu, kuolema, sydämen syke, hengästys, hytinä, vatsa, ähky, pahoinvointi,
  kylläinen, lämmin, levännyt). Yksi numeroton paikkamerkki per ääni, lisäversiot `_1`, `_2` … Listat: `AANILISTA_OSA<n>.csv` ja
  `sounds/AANILISTA_PELAAJA.xlsx`. Puuttuva ääni = hiljaisuus.
- **v2.24 äänitasot:** olentojen äänet (ääntely, kipu, kuolema, suuttuminen, jahti, kaiku) 20 % hiljempaa. Toimintoäänet kuuluvat 20 % lyhyemmälle
  (askeleet 16 m, isot 32 m, palaminen 36 m, syöminen/juominen 24 m, loiskahdus 32 m; 3D-viite ×0,8, maxDistance 96 m) ja vaimenevat jyrkemmin
  (rolloff askel 1,8, muut 1,45; suora ääni −50 % kantaman reunalla 51 m). Askeleet kävellessä 20 % harvemmin (`TG_STRIDE` ×1,2), juostessa
  10 % harvemmin kuin ennen (×1,375).
- **v2.24 juominen:** rauhalliset eläimet (makeAnimal-mallit, ei vaanivat hirviöt eikä emoa seuraavat porsaat) lähtevät 70–160 s välein (50 %)
  juomaan, jos alle 28 m päässä on vettä: kävelevät rannalle kaulan ulottuman päähän, kääntyvät veteen päin, laskevat kuonon veden pintaan ja
  juovat 4–8 s (latkivat). Pelaaja alle 10 m (ellei kyykyssä), osuma, pelko tai jumiin jääminen keskeyttää. Ääni `juominen` (nelijalkaiset, silmukka).
- **v2.24 pää alas:** eläimen kaula kääntyy rinnan kohdalta eteen-alas ja venyy pitkäjalkaisilla (peura, poro, hirvi) niin, että kuono ylettyy
  maahan syödessä, tonkiessa ja veden pintaan juodessa; pää osoittaa alas. Laskeutuu ja nousee pehmeästi (~0,5 s).
- **v2.24 pelaajan toimintoäänet** (v2.25 alkaen osat 1 ja 2, ks. yllä): askel jalan osuessa maahan (kävellen ~2,6/s, juosten ~3,3/s,
  kyykyssä hiljaa) alustan mukaan (ruoho, kivi, hiekka, lumi, suo, puu, jää, pusikko; rakennuksissa puu/kivi), hypyn alastulo, kahlaus, uintiveto,
  loiskahdus veteen mennessä (kova pudotus kovempi), pelaajan iskun osuma (nuija = murskaus, muut = isku) ja pelaajan nuolen osuma. Aloitusäänet
  kopioitu olentojen kansiosta. Asetukset › Äänet ja musiikki › Pelaaja (v2.53: 100 % = entinen 80 %).
- **Toimintosilmukat (v2.23):** syöminen, tonkiminen ja nuuhkiminen soivat koko toiminnon ajan ja hiljenevät pehmeästi, kun eläin lopettaa.
  Askeleet: kohinanpoisto, yksi askel per ääni, voimakkuus vaihtelee hieman askeleittain. Kivivartijalla omat äänet.
- **Osumat ja törmäykset (v2.22):** osumaäänet 6 kategoriassa (raapaisu, purema, murskaus, sarvet, isku, nuoli) – soivat kun olento osuu
  pelaajaan, nuoli tai heittokivi osuu pelaajaan, tai pelaajan nuoli osuu olentoon. Törmäys (kevyt / raskas) kun olento juoksee esteeseen.
- **Ei generoituja ääniä (v2.22):** peli soittaa vain omia äänitiedostoja; koodilla tehdyt äänet on poistettu (puuttuva ääni = hiljaisuus).
- **Toimintoäänten kerrostus (v2.21):** raskaat ja kevyet nelijalkaiset käyttävät nelijalkaisten ääniä; metso, luurangot, kivivartija ja pomot
  kaksijalkaisten ääniä (sävel ja voimakkuus koon mukaan). Ryhmän oma samanniminen ääni soi päälle. Joka askeleella soi lisäksi tömistys
  (raskaat, kivivartija, pomot) tai luiden kalina (luurangot); ei uidessa. Oksan rasahdus Aarnimetsässä soi hiljaa, enintään 2 s välein.
- **Palavan olennon äänet (v2.17):** liekeissä olennon ääntely on tauolla; kipuääni kuuluu 1,7–2,1 s välein, kunnes palo sammuu tai olento kuolee.
- **Vesi sammuttaa (v2.17):** palava pelaaja tai olento sammuu heti vedessä (yli 0,3 m syvyys) eikä syty siellä; soihtu sammuu vedessä; tulinuoli
  sammuu heti veteen osuessaan.
- **Sade ja nuotio (v2.17):** kova sade tai myrsky sammuttaa taivasalla olevan nuotion noin 4 s:ssa (savuaa ensin); katon alla nuotio palaa.
  Polttoaine säilyy; sytytä uudelleen E:llä (ei onnistu, jos sade sammuttaisi heti) tai lisäämällä puuta. Sammunut nuotio ei valaise, lämmitä eikä kypsennä.
- **Tulen jäähyt (v2.17):** sama tuli sytyttää pelaajan enintään 1 s välein; syttymisääni enintään 2,5 s ja ilmoitus 12 s välein;
  sammumisen höyrypöllähdys enintään 2,5 s välein (pelaaja ja olennot).
- **Pomojen toimintoäänet (v2.17):** yhteinen `pomot/`-kansio, josta kaikki pomot lainaavat (sävel pomon mukaan); pomon oma samanniminen ääni
  voittaa. Ryntäyksessä lataus- ja syöksyääni. Raskaat nelijalkaiset (karhu, hiidenkarhu, hiidenhirvi) ovat oma ryhmänsä.
- Olennoilla voi olla omat äänet (`sounds/olennot_aanet/valmiit/<id>_<idle|hurt|death|aggro|chase>_<n>.mp3`, n = 1, 2, 3 … rajattomasti (v2.11), arpoo kaikista olemassa olevista versioista): rauhallinen
  ääntely 6–15 s välein alle 25 m päässä, suuttumisääni (vihamieliset ja pomot vain kerran, neutraalit kerran per suuttuminen – v2.10: sama olento enintään 15 s, sama laji 6 s välein, ei karjaisua tiedostoäänen päälle), jahtiääni 4–9 s
  välein jahdin aikana (vihamieliset ja pomot), osumaääni (enintään 0,4 s välein), kuolinääni. 3D-ääni (suunta ja etäisyys), sävel ±6 %.
- Jos olennolla ei ole omaa ääntä, käytetään väliaikaista varaääntä toiselta olennolta muutetulla sävelellä (ketju `VARAANI`), muuten
  tehtyä ääntä tai hiljaisuutta. Tila: `sounds/olennot_aanet/AANILISTA.md`.
- Asetukset › Ohjaus ja ääni › Olentojen äänet (voimakkuus, oletus 80 %).
- Varaääniketjun pääääni on Aarnihirviö (💎): Jäätär (sävel ×1,2) ja Kalmaherra (×0,85) lainaavat siltä, kunnes saavat omat. Kuolemaääniä on
  1 paikka ulottuvuuksien hirviöillä (rboss) ja 2 muilla.
- Toisto: tärkeys kuolema > osuma > suuttuminen > jahti > rauhallinen; olennolla soi yksi ääni kerrallaan (tärkeämpi katkaisee); enintään 10
  ääntä kerrallaan (heikoin syrjäytyy); rauhallisia/jahtiääniä samaa lajia enintään 3 ja 0,3 s väli; sama versio ei heti uudestaan.
- Pomon herätys (kaikki pomot, 8 s): nukkuva ulottuvuuspomo odottaa näkymättömänä maan alla ja herää vasta kun pelaaja astuu pomohuoneeseen
  (v1.91: huoneen ääriviiva = 48 sädettä seinään, tai varaetäisyys = keskimääräinen matka keskeltä seinään). Lattia halkeaa hehkuen, pomo nousee pää alhaalla ja kädet sivuilla, nostaa päänsä ja huomaa pelaajan (5,9 s: silmät
  leimahtavat, suuttumisääni), suoristuu ja lyö paineaallon. Haavoittumaton koko ajan, terveyspalkki näkyy heti.
- Pomon kuolema (kaikki pomot, ~12 s + maatuminen ~10 s): kalpenee heti noustessaan, kolme todellista valoa pinoutuu ja huone kirkastuu pehmeästi,
  kädet levälleen, kuolinääni kaiulla ja ruumis repeää (vartalo keskellä, osat irti omiin suuntiinsa valosäikein), valo katoaa, osat putoavat
  yksitellen. Saalis leijuu ilmassa ja putoaa nätisti 12,6 s. Osat maatuvat multakummuiksi, joille nousee hehkuvia sieniä (tulikuolemassa tuhkaa).
- Pomon ryntäys: kyyristyy ja silmät kirkastuvat 0,6 s, sitten etukenossa polvet koukussa.
- Pomojen mallit (v1.93, js/bossmodels.js): korkealaatuiset, pyöristetyt ja yksityiskohtaiset (sarvet, kristallit, viitat, ketjut, miekka, sienet).
  Ultra-tasolla silmissä liekit ja pomon ympärillä leijuvat sen teeman palat (riimukivet, jääkristallit, aavekallot ja sieluliekki, lehdet ja
  tulikärpäset); ne irtoavat ja putoavat kuollessa muiden osien mukana.
- Pomopalkki (v1.94): teeman mukainen (kivi/jää/kalma/aarni: väri, riimut, koriste palkin alla), vaihemerkit, viivepalkki, virtaava kuvio.
  Vaiheen vaihtuessa tärähdys, välähdys ja iso teksti (VAIHE II / III / VIIMEINEN RAIVO), halkeamat ja syke voimistuvat; ruudun reunojen
  vinjetti teeman värissä, sydämenlyönti alle 25 %:ssa; kuollessa "KUKISTETTU". Näkyy lähimmästä herännestä pomosta alle 70 m päässä.
- Rauha (v1.94): kun kaikki neljä pomoa on kaatunut, voittoruutu "Hiidenmaa on rauhallinen" (13 s kuoleman jälkeen). Kun ruutu suljetaan,
  2 s kuluttua ilmoitus, ja jokainen tyhjennetty maailman arkku (rauniot, arkkukivet, kiviröykkiöt, säkit, hautakirstut) täyttyy 8 satunnaisella
  esineellä. Kerran per maailma.
- Pomon saaliilla on majakkasäde: hehkuva valopylväs ja maarengas pomon värissä, kunnes esine poimitaan.
- Palava pomo (boss/rboss): hurt-ääni silmukkana 1,4–2,2 s välein, sävel ×0,78 ja voimakkuus ×0,55, tärkeys 1,5 (jahti katkaisee). Muut olennot eivät ähki palaessaan.
- Kalmanvartijan kaikuääni (v1.95, `vartija_echo_1/2`): maan alta Kalmankehän lähellä (< 80 m) 24–48 s välein, kunnes vartija on kukistettu kerran; ei kun se on hereillä.
  Kalmanvartija lainaa Aarnihirviön äänet sävelellä ×0,7, kunnes saa omat. Kivivartija ei lainaa pomoääniä (varaääni kalmo ×0,75).
- Kaikuääni (echo, ulottuvuuspomot, 1–2 versiota): nukkuva pomo kuuluu 24–48 s välein vain omassa ulottuvuudessaan (≤38 m päästä, tumma, kaiulla) kunnes pelaaja kohtaa sen. Aarnihirviön kaikuäänet ovat kaikkien varaääni.
- Kaiku: luolaston ja ulottuvuuksien olennoille (lähetys 0,45 / boss 0,6 / rboss 0,75), yksi yhteinen ConvolverNode (1,2 s), kytkeytyy vain tarvittaessa.
- Työkalu tulostaa erän lopuksi HUOM-varoitukset (tuplatiedosto, vahvistus yli ±12 dB, liian lyhyt, ylimääräinen paikka).
- Työkalun trimmaus/voimakkuus: pituuden rajat (idle 3 s … death 3,5 s, pomot enemmän) ja tavoite-LUFS lajeittain (idle −22 … death/aggro −16, pomo +1,5 dB).

## v3.06 – viljely, sulatusuuni, onkiminen ja muut
- **Kantokyky:** 60 alussa → enintään 200 (reppu 2 × 15, saavutukset 50, tasot 60). **Toimintojen ilmoitukset** -asetus (oletus päällä).
- **Rakennusvalikon tietoikkuna:** 1 s hover, I lukitsee auki.
- **Uusiutuminen:** puut ja kivet nukkuessa 20 % (kivet aikaisintaan 5 vrk), poimittavat ≥ 10 min + yli 60 m + 20 %/min. Rakennusten suoja 15 m / työpenkki 26 m.
- **Viljely:** siemenet (käpy, koivun siemen, aarnipuun siemen, pihkakävyt) 5 % kaadosta, pihkapuu 70 %. Istutus: siemen toisessa kädessä + kuokka + kyykky + vasen.
  Taimi kasvaa nukkuessa 30 %. Varpu, rihmasto, kauransiemen (työpenkki) maahan tai **pellolle** (E kylvää, E korjaa). Istutettu ei uusiudu.
- **Villikaura** vain kolmella seedin mukaan arvotulla alueella. **Ultra-rikkaruohot** (asetus, Ultra), ruoho taipuu kulkijan tieltä.
- **E-toiminnot:** käsi liikahtaa eteen ja takaisin.
- **Sulatusuuni (E avaa):** jono 5, polttoaine (puu 20 s, hiili 200 s, max 10 min), lämpötila 45 s → sulatuslämpö, jäähtyy 2 min, aineet vain kuumaan uuniin, mittarit + arvio.
- **Veden kerääjä:** kupari 4 + rauta 2, taso 6. Sateella taivasalla 10 %/min, 20 vesikulhollista.
- **Keittopatanuotio** vaatii työpenkin, polttoainetta enintään 10 min. Kalakeitto, lohikeitto (vesi), kalakukko.
- **Teemoitetut valikot:** tausta työpisteen/säilytyksen mukaan.
- **Routaluola:** jäälätäköt käytävissä – pelaaja ja olennot liukuvat.
- **Onkiminen:** vedet nimetty kalalajin mukaan (kartta + rannalla); vavat onki (työpenkki), kuparivapa (ahjo, t5), hiidenvapa (3 sirua, t9); mato 2 % maanmuokkauksesta;
  tärppi 1–5 min, vasen 0,6 s:ssa, iso kala väsytetään; 18 lajia (v3.08; järvi: ahven, hauki, lahna, kuha, made, muikku, särki, kiiski, toutain; meri: silakka, turska, lohi,
  siika, kampela, meritaimen; suolampi: ruutana, suonsilmä, suutari), aika ja sää vaikuttavat;
  kalat paistetaan nuotiolla/grillillä, savustimessa savukala, padassa keitot; katiska veteen, kalanaulakko seinään; muut saaliit (saapas, pulloposti, ruostunut avain → upponut arkku,
  hiidenkiven siru, rauta- ja kupariharkko); Kalastajan kirja (käytä) + tavoitteet.

## v3.07 – tarkennukset
- **Viljelylaatikko** (ent. pelto, puu 4): 1 kylvö, kasvaa nukkuessa 60 %, sato 9 + siemen. **Kohopenkki** (kivi 10 + puu 4, taso 6): 4 kylvöä, 70 %, kustakin 9 + siemen.
  Maahan istutettu varpu/rihmasto/kaura: 2 + siemen. Kuokka + siemen ilman kyykkyä → muistutus.
- **Kaatuva puu:** pelaajalle aarnipuu 90 %, iso puu 60 %, pieni 40–50 % maksimiterveydestä; eläimille vahvuuden mukaan (karhu ~50 % aarnipuusta).
- **Sulatusuuni:** hiili lämmittää 20 % nopeammin; tulisuun hehku muuttuu lämmön mukaan (punainen → keltainen). Savustin hehkuu savustaessa.
- **Polttoainemittari:** "jäljellä / enintään min".
- **Äänet:** päävalikossa häipyvät, pelin paneeleissa −30 % ja hieman vaimeammat. Käsisoihdussa hiljainen rätinä. F-tarkastelun ihastus 10 %.
- **Vinkit:** näkyvät lukuajan (4–9 s) ja katoavat heti, kun neuvoa noudattaa. **Vierityspalkit** pelin teemassa. Tietoikkuna vaihtuu heti.
- **Rikkaruohot (Ultra):** 3 lajia, biomeittain eri korkeus. Hakuissa umpinaiset kärjet, ongessa roikkuva koukku. Keittoon käytetty vesikulho vaihtuu tyhjäksi kädessä.

## v3.08 – kasvu, kastelu, pihka, vihjeet ja korjaukset
- **Istutetut puut kasvavat** 5 lajikohtaista kokovaihetta: taimesta tulee pieni puu (vaihe 1), joka 5. nukuttu yö 60 % → seuraava vaihe, kunnes lopullinen koko (viimeinen tai
  toiseksi viimeinen vaihe). Pihkapuun pihkamäärä kasvaa koon mukana (pihkapuu vasta koosta 0,75). Luonnon puut eivät muutu.
- **Kastelu ja madot:** vesikulho kädessä E taimen, kasvavan istutetun puun tai viljelylohkon kohdalla → seuraava kasvu +5 % (kulho tyhjenee). Kastemato toisessa kädessä E
  (maassa kyykyssä, laatikossa/penkissä ilman) → +5 %. Kumpikin kerran kasvua kohti. 5 kastelua = pysyvästi +5 %, 2 matoa = pysyvästi +5 % (lohkokohtainen; taimen pysyvät
  siirtyvät puulle) kunnes rakenne puretaan. Multa: kasteltu märkä, pysyvä vesi tummempi, madot kurkkivat, molemmat + ruohotupsut reunoilla.
- **Siemenet** putoavat, kun puu kaatuu maahan tukeiksi. Kaikki istutettavat (kävyt, siemenet, varpu, rihmasto, kaura) ja kastemato näkyvät mallina vasemmassa kädessä.
- **Aarnipuun pihka:** 1 % aarnipuista on pihkapuita (pihkaa 3×, kertymä tunnissa 4×, kaadettaessa 3–5 pihkaa). **Pihkan täyttyminen:** joka 5. nukuttu yö jokainen tyhjä
  pihkapuu arpoo 10 % → 30 % täyteen; puu on taas pihkapuu ja kaiverretaan uudelleen (kiinni ollut kulho täyttyy vasta uuden kaiverruksen jälkeen).
- **Kuolema:** äänet häipyvät ja kuva tummuu hitaasti (40 s); hahmo kaatuu varusteineen, käsitavarat lentävät viereen (esineet ovat hautakasassa). Veri tummempaa, ei hohda.
- **Äänet:** liemiruoat (keitot, puurot, padat, risotto, hillo) syödään lusikalla – juomisääni 2–4 kertaa. Päävalikko Käynnissä-tilassa: äänet −70 % ja vaimeat. Metso −40 %.
- **Sää:** sade tulee vinommin tuulen mukana; lumi ilmestyy pehmeästi noustessa 8–13 m.
- **Kartta:** sisävesi ei avaa Meri-aluetta; vesien nimet kaikilla zoomeilla veden päällä; zoom ulos 0,8×; "Sulje: P / M" oikeassa alanurkassa.
- **Onkivapa:** kärki taipuu kalan vetäessä, koukku kärjessä; vavoissa korkkikahva, kela ja renkaat, onki on yksinkertainen.
- **Valikot:** rakennusvalikkoon Säilytys, Ruoanlaitto, Viljely ja kalastus; valmistukseen Nuolet, Pataruoat, Kalastus, Viljely. Haku löytää myös kategoriat ja yleissanat
  (esim. kilpi, kala, keitto, kirves, siemen, valo, ruoka, ase, työkalu, juoma, tuli, säilytys, ovi, katto, puolustus, metalli). Nimiosumat ensin.
- **Extra-grafiikka:** napit Kevyin (kaikki pois) ja Vaativin (kaikki raskaimmilleen + automaattisäätö pois; varmistus ensimmäisellä kerralla). Intron varjot eivät välky.
- **Olkahihna:** kun selässä on kilpi, jousi tai työkalu – vasemmalta olalta oikealle lantiolle; puukilpi vaalea, muut tumma, rautakilpi nahka + metallisolki.
- **Ohjeet ja vihjeet (Asetukset › Ohjaus):** 1 ohjetekstit (valikkojen selitykset + kertavinkit), 2 näppäinvihjeet (Sulje/Päävalikko, rakentamisen näppäimet, B-vihje, jousi),
  3 kaikki toimintovihjeet (E-kehotteet). Ylempi porras piilottaa myös alemmat; piilotus kysyy varmistuksen (2 punainen, 3 "Oletko IHAN varma?").
- **Poistu-ruksi** tallentaa pelin aina juuri ennen sulkemista (kuten Tallenna nyt), sulkuruutu vahvistaa tallennuksen.
- **Korjattu:** lapion virhe kaadetun puun vieressä, kirveen hakkuun nykäisy, Windows-tekstin ja logon keskitys, vinkki katoaa valikon avautuessa/sulkeutuessa.

## v3.11 – intron pilvimatto
- Matalilla esiasetuksilla (Low–Medium+, heikosti High) intron yläkamerassa piirtoraja on pehmeän sumun ja pilvimaton alla: saari näkyy pilvien aukosta, ja matto häipyy kameran syöksyessä.

## v3.10 – maailman lataus
- Latausruudun lopussa lähimaailma piirretään valmiiksi (pelikamera + intron puoliväli, varjostimet käännetty), joten intro ei lataa näkyvästi. Intron yläkamerassa puut
  kaukomalleina ja ruoho piilossa yli 30 m korkeudelta; laatu nousee asetusten mukaiseksi laskeutuessa.
- Asetukset › Ohjaus › Ammattilaisille ja vertailuun › **Vanha maailman lataus (v3.09)**: vanha tapa vertailuun (vaihto lataa pelin uudelleen, peli tallennetaan).

## v3.09 – maailmalista
- Maailmat-näkymässä pelissä oleva maailma: kirkas kultainen ääriviiva + "Pelaat nyt". Kun peli ei ole käynnissä, viimeksi pelattu maailma: vaalea ääriviiva + "Viimeksi pelattu".

## DEV-työkalut (vain DEV-tilassa)
- Ä = DEV-valikko. Isot napit alussa (v1.92): Kuolemattomuus, Lento (alkaa heti), Seinien läpi, Lukitse aika ja sää, Näkymätön (v2.15: olennot eivät huomaa sinua, lyönti suututtaa), Pysäytä maailma
  (vain pelaaja liikkuu), Terveys täyteen. Lisäksi sää, aika, terveys, kylläisyys, pienet täpät, esinehaku, kartta.
- v3.08 **Ilmaiset materiaalit** (`DEVF.free`): rakentaminen, valmistus, korjaus, päivitys ja pataruoat ilman aineita (aineita ei kuluteta).
- V pohjassa = 10× kävelynopeus, lennossa 6× lentonopeus (vaaka ja pysty).
- Ö = olennot ja pomot (v1.91): luo minkä tahansa olennon 3 m eteen (pomot nousevat herätysanimaatiolla), siirry ulottuvuuspomon huoneeseen tai
  ulottuvuuden portin eteen, elvytä kukistettu pomo, Kalmankehään. Apuväline: pomohuoneen ääriviiva seinien läpi (huoneen reuna, varaetäisyyden
  ympyrä, pomon paikka) ja reittiviiva (v1.92: valkoinen nauha lattialla lyhintä reittiä pomohuoneeseen, seinien läpi). DEV-luodut pomot eivät
  kirjaa voittoa eivätkä merkitse ulottuvuutta kukistetuksi.
