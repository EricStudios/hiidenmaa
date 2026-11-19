# Kalastus (v3.14) – äänien paikkamerkit

Ensimmäinen `sounds2/`-projekti. Paikkamerkit ovat hiljaisia mp3-tiedostoja (alle 3 kt). Korvaa paikkamerkki samalla nimellä
(lisäversiot `_2`, `_3` … sallittu). Peli kutsuu näitä avaimilla `kalastus/<nimi>` (`tkSnd` tackle.js → `plSnd('kalastus', nimi)`);
kun ensimmäiset oikeat äänet tulevat, `tools/process_sounds.py` laajennetaan käsittelemään `sounds2/`-kansiota (rakenne suunnitellaan silloin).
Siihen asti peli käyttää vanhoja vastineita (esim. arkun avaus, onkimisen kelaus).

| Nimi | Milloin | Tyyli |
| --- | --- | --- |
| pakki_auki | kalastuspakki tai Kalastajan pöytä avataan | puulaatikon salvat + kansi |
| pakki_kiinni | pakki suljetaan / lasketaan maahan tai pöydälle | kansi kiinni, kolahdus |
| sivun_kaanto | kalakirjan sivun käännös (v3.15) | paperin kahahdus |
| perkaus | kalojen perkaus pöydällä | puukko + märkä läiske |
| virveli_kelaus | virvelin kelaus (toistuu 0,5 s välein) | kelan rattaiden surina |
| virveli_heitto | virvelin heitto | vavan vihellys + kelan sirinä |
| siiman_vaihto | siiman vaihto (pöytä tai kenttä) | siiman kiristys ja solmiminen |
| koukun_vaihto | koukun, kelan, kohon tai vieheen vaihto | pieni metallinen naksahdus |
| mato_koukkuun | mato laitetaan koukkuun (E) | pieni märkä ääni |
| kala_satkii | kala sätkii koukussa noston jälkeen (3 s) | pyrstön läpsytys |
| eka_onki | ensimmäisen ongen wow-ilmoitus | lyhyt juhlava aihe |
