# Kalastuksen uudistus (v3.28–) – suunnitelma ja työstöprompti

Tila: **suunnitteilla**. Käyttäjän toiveet 25.11.2026, kirjoitettu selkeäksi työohjeeksi. Avoimet kysymykset ovat lopussa:
kun käyttäjä vastaa, päivitä vastaus kohtaan "Päätetty" ja poista kysymys. Pohjana on v3.27 (commit `c053d40`), jossa on jo
yksilökalat (paino ja pituus), kala kädessä, loinen, värillinen saalisilmoitus ja pohjaan vajoava viehe.

---

## Työstöprompti tekoälylle (kopioi sellaisenaan)

> Lue `CLAUDE.md`, `docs/KEHITYSMUISTIO.md` (Koodausmuistiinpanot), `docs/KORJAUKSET.md` ja tämä tiedosto.
> Uudista Hiidenmaan kalastus alla olevan määrittelyn mukaan **neljänä eränä** (A–D). Jokaisen erän jälkeen:
> syntaksitarkistus, `tools/tarkistus.mjs` (uusi tarkistusrivi erän ominaisuuksille), full157 (`MAPS=0,3`), muistiot, commit.
> Lopuksi versionnosto, push ja PR. Älä generoi ääniä: lisää vain paikkamerkit kansioon `sounds2/kalastus/` (`tkSnd`).
> Tiedostot: `js/fish.js` (tilakone `FS`, onki, saalis), `js/tackle.js` (virveli, vavan osat, pakki), `js/fishbook.js`
> (kirja, ilmoitus), `js/items.js` (`FISH_DEF`, `TK_*`), `js/state.js` (reppu, pinot), `js/player.js` (asennot),
> `js/models.js` (vavan malli, kalan malli kädessä), `js/ui.js` (ilmoituslappu, minipeli), `js/save.js` (vanhan muodon muunnos).
> Kaikki pelin tekstit suomeksi ja oikeinkirjoitettuina. Älä riko vanhoja tallennuksia.

### Erä A – heitto ja fysiikka (molemmat vavat)
1. **Heiton voi tehdä aina**, mihin suuntaan tahansa (myös maalle). Ei enää "katso vedenpintaa X–Y m päähän" -estoa.
2. **Ballistinen heitto:** koho tai viehe lähtee vavan kärjestä nopeudella `v0`, suunta = kameran katse.
   Painovoima + pieni ilmanvastus. Lentomatka on pisin, kun katse osoittaa noin **+35°** horisontin yläpuolelle.
   Ilmanvastus siirtää optimin 45°:sta noin 35°:een; säädä vastus niin, että maksimi osuu 33–37°:een.
   Alaspäin osoittaminen = lyhyt heitto jalkoihin.
3. **Vapa vaikuttaa heittoon:** `v0` vavan mukaan (onki < kuparivapa < hiidenvapa; kela lisää). Nykyiset `cast`-arvot
   muunnetaan `v0`:ksi niin, että 35°:n heitto antaa nykyisen maksimimatkan.
4. **Lasku maalle:** koho tai viehe jää maahan. Kelaus vetää sen maata pitkin. Maata pitkin kelatessa siima katkeaa
   hieman todennäköisemmin (oma riski / m). Jos siima katkeaa ja päässä oli **viehe**, viehe jää maahan
   katkeamiskohtaan poimittavaksi esineeksi (`spawnDrop`, säilyy tallennuksessa kuten muut pudotukset).
5. **Lasku veteen:** kalastus jatkuu normaalisti (onki: koho + odotus; virveli: kelaus).
6. Siima piirretään taipuvana kaarena (riippuu painovoimasta, kiristyy kelatessa), ei suorana viivana.

### Erä B – virveli: viehe, pohja ja animaatio
1. **Vieheessä ei ole kohoa.** Vedessä viehe vajoaa hitaasti (`TK_SINK`, lajikohtainen kerroin). Kelatessa se nousee
   kohti pintaa (`TK_RISE`). Pintavaappu kelluu (nykyinen poikkeus säilyy).
2. **Pohjakosketus:** kun viehe on pohjassa, se jää kiinni **20 % / sekunti** pohjassa (jatkuva riski, `1-(1-0.2)^dt`).
   Kiinni jäänyt viehe: siima katkeaa ja viehe menetetään (nykyinen `tkSnag`).
3. **Tärppitodennäköisyys syvyyden mukaan:** pintaa pitkin (ylin 0,25 m) **−5 %**, pohjaa pitkin (alin 0,25 m) **−30 %**,
   välissä normaali. Kerroin kertoo nykyisen tärppiriskin (`hazard / s`).
4. **Kelaus loppuun asti:** viehe kelataan vedestä ylös **vavan kärkeen asti**, ei pysähdy rantaan. Rannassa se nousee
   pinnasta ilmaan ja roikkuu kärjessä; sitten voi heittää uudelleen.
5. **Virvelin oma asento (`player.js`):** vapa on **vasemmassa kädessä**. Oikea käsi pyörittää kelan kampea
   ympyrää IK:lla (`armIK`), kun vasen nappi on pohjassa. Kelan rumpu ja kampi (vipu) pyörivät kädenliikkeen tahdissa.
   Pyörimisnopeus = kelausnopeus. Onki pysyy oikeassa kädessä kuten nyt.

### Erä C – saaliin saanti, ilmoituslappu ja koukun irrotus
1. **Kala näkyy jo vedossa:** kun kala tarttuu, sen malli (`tkFishMesh`, koko painon mukaan) häivytetään näkyviin
   siiman päähän **jo kelausvaiheessa**. Vedessä ja maalla se raahautuu **kyljellään** painovoiman mukaan.
2. Kun kala nousee veden tai maan pinnasta, se roikkuu vavan kärjessä ja **rimpuilee** (nykyinen `tkDangle`, `hold`).
3. Kala roikkuu, kunnes pelaaja **klikkaa** → kala irrotetaan ja siirtyy reppuun. Vasta sen jälkeen voi heittää uudelleen.
4. **Ilmoitus tulee vasta irrotuksessa.** Uusi **saalislappu**: vasemmasta reunasta liukuva lappu (puu-/pergamenttiteema),
   "kurkistaa" sisään noin 0,35 s:ssa, pysyy **6 s** ja liukuu samalla animaatiolla pois. Sisältö: kalan esinekuva
   (`fishArt` / `icon`) ja alla värilliset tekstit (muu teksti harmaa, laji valkoinen, paino ja arvoluokka arvoluokan
   värillä – nykyinen `fbCatch().html`). Useampi lappu jonossa allekkain.
5. **Syvälle niellyt koukut (minipeli):** joskus (ks. kysymykset) koukku on kalan kurkussa. Irrotuksessa avautuu mittari:
   punainen alue liikkuu hitaasti, pelaajan viiva liikkuu hiirellä paljon nopeammin, ja viiva pidetään punaisella
   alueella. Onnistuminen irrottaa kalan, epäonnistuminen (ks. kysymykset) vahingoittaa kalaa tai vie koukun.

### Erä D – kalat repussa, kädessä, naulakossa ja pakissa
1. **Paino- ja kokojakauma:** jokaisella lajilla on **yleiset koot**, joihin suurin osa saaliista osuu. Ne pyöristetään
   karkeasti (esim. 0,05 kg / 1 cm), jolloin samanlaisia kaloja tulee usein. **Harvinaiset** hyvin pienet ja hyvin
   suuret kalat arvotaan laajemmalla jakaumalla ja tarkemmin (0,01 kg).
2. **Pinoutuminen:** saman lajin kalat, joilla on **sama paino ja sama pituus**, pinoutuvat automaattisesti.
3. **Käsin pinoaminen:** pelaaja voi raahata saman lajin eriarvoisia kaloja samaan pinoon. Pino säilyttää jokaisen
   kalan omat tiedot listana **lisäysjärjestyksessä** (`fl:[{kg,cm},…]`). Otto pinosta, jakaminen, syöminen,
   pudottaminen ja ripustus käyttävät listan päällimmäistä kalaa (viimeksi lisätty). Kuvake ja tiedot näyttävät
   päällimmäisen kalan, ja tooltip listaa pinon sisällön.
4. **Ei monistusta:** jakaminen siirtää täsmälleen ne yksilöt, joita siirretään (ei kopiota). `n === fl.length` aina.
   Tarkistusrivi testaa jaon, yhdistämisen, pudotuksen, tallennuksen ja latauksen sekä naulakon vaihdon niin, että
   kalojen määrä ja painojen summa pysyvät samoina.
5. **Tallennus:** vanhat paikat `{kg,cm}` muunnetaan `fl`-listaksi latauksessa. Jos muoto muuttuu, nosta `v`.
6. **Naulakko:**
   - E ripustaa **kädessä olevan kalan**. Malli on sen lajin oikean muotoinen (`tkFishMesh`), koko painon mukaan.
   - Alla on **kultainen laatta**, jossa näyttää olevan kaiverrettua tekstiä.
   - Lähelle mentäessä ja laattaa katsottaessa ruudulle tulee tieto: kalastajan nimi, päivä ja kellonaika
     (pelin päivä), laji, paino, pituus ja arvoluokka.
   - **Vaihto:** uuden kalan ripustus palauttaa vanhan kalan reppuun (täysi reppu → maahan). Naulakon purku pudottaa
     kalan maahan. Kalaa ei koskaan menetetä eikä tule lisää.
7. **Kalastuspakki:** kun pakissa on vieheitä tai syöttejä, niistä roikkuu **koristeena** pieniä malleja pakin kyljissä
   (enintään 4 kummallakin puolella). Ne näkyvät maassa, pöydällä ja kädessä.

---

## Päätetty (käyttäjä 25.11.)
- Optimikulma noin +35°, vapa vaikuttaa matkaan, heitto aina sallittu.
- Maalla siima katkeaa hieman herkemmin; katkenneen siiman viehe jää maahan.
- Pohjassa 20 % / s kiinnijäämisriski; pinnalla tärppi −5 %, pohjassa −30 %.
- Virveli vasemmassa kädessä, oikea veivaa, kelan rumpu ja kampi pyörivät.
- Kala näkyy siimassa jo vedossa (kyljellään), rimpuilee kärjessä, klikkaus ottaa → vasta sitten uusi heitto.
- Ilmoitus vasta irrotuksessa: vasemmalta liukuva lappu 6 s, kalan kuva ja värilliset tekstit.
- Sama paino + pituus pinoutuu; käsin pinoaminen säilyttää yksilöt järjestyksessä; ei monistusta.
- Naulakko: kädessä oleva kala, oikea muoto, kultainen laatta, katsomalla tiedot, vaihto/purku ei kadota kalaa.
- Pakin kyljissä roikkuvat vieheet ja syötit, jos niitä on sisällä.

## Avoimet kysymykset
Ks. keskustelu 25.11. (15 + lisäkysymykset). Vastausten jälkeen siirrä ne kohtaan "Päätetty".
