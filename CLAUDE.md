# Hiidenmaa – ohjeet Claudelle

Hiidenmaa on selaimessa toimiva 3D-selviytymispeli: viikinkihenkinen saari, keräily, valmistus,
rakentaminen, taistelu, luolasto ja yksi pomo. Valheim on inspiraatio, mutta peli on oma teos:
**älä käytä Valheimin nimiä, hahmoja, grafiikkaa tai muuta suojattua sisältöä. Pelin teksteissä ei mainita muita pelejä (esim. Minecraft).**

Lue tämän lisäksi aina `docs/KEHITYSMUISTIO.md`. Siinä ovat tehdyt päätökset, tasapainoarvot,
versiohistoria ja ideajono, jotta niitä ei tarvitse selvittää uudelleen. Pelin kaikki ominaisuudet, säännöt ja
fysiikan arvot ovat viiteoppaassa `docs/OMINAISUUDET.md`. Toistuvat viat ja niiden korjaukset koodinpätkineen ovat
`docs/KORJAUKSET.md`:ssä – lue se ennen muutoksia ja lisää sinne uusi kohta aina, kun jokin rikkoutuu tai katoaa.

## Käyttäjä ja työtapa

- Kommunikoi suomeksi. Pelin kaikki tekstit ovat suomeksi.
- Vie annettu tehtävä loppuun asti. Keksi ratkaisu itse, kysy vain jos eteenpäin ei pääse.
- Älä tilaa tai ota käyttöön mitään maksullista ilman lupaa.
- Muutokset tehdään erissä (3–6 toisiinsa liittyvää muutosta). Jokaisen erän jälkeen:
  1. testaa (ks. Testaus),
  2. päivitä `docs/KEHITYSMUISTIO.md` (versioloki, muuttuneet arvot, uudet päätökset, ideajono) ja
     `docs/OMINAISUUDET.md` (muuttuneet ominaisuudet, säännöt ja arvot),
  3. päivitä tämä tiedosto, jos rakenne tai säännöt muuttuivat,
  4. tee commit suomenkielisellä viestillä. Pushaa, kun käyttäjä pyytää.
- Pidä tämä tiedosto lyhyenä (alle 200 riviä). Yksityiskohdat kuuluvat kehitysmuistioon.

## Tekniikka

- Ei build-vaihetta eikä npm-riippuvuuksia. three.js **r128** ladataan cdnjs:stä `index.html`:ssä.
- Skriptit ovat tavallisia `<script src>`-tiedostoja (ei ES-moduuleja). Ne jakavat saman globaalin
  näkyvyysalueen, joten `index.html` aukeaa myös tuplaklikkaamalla ilman palvelinta.
- **Latausjärjestys on tärkeä.** Pelin skriptit luetellaan `index.html`:n `window.__GJS`-listassa (boot.js lataa ne järjestyksessä). Tiedoston ylimmän tason koodi saa käyttää vain aiemmin ladattujen
  tiedostojen muuttujia. Funktioiden sisällä saa viitata mihin tahansa. Uusi tiedosto lisätään
  `index.html`:n skriptilistaan oikeaan kohtaan.
- Jokainen JS-tiedosto alkaa `'use strict';`. Samaa ylimmän tason nimeä ei saa määritellä kahdesti.
- v3.22: pehmennys aina `kExp(nopeus,dt)` (core.js), ei `Math.min(1,dt*nopeus)` – esiasetus/FPS ei saa muuttaa ajoitusta (KORJAUKSET 93).
- Rivin keskellä vain `/* */`-kommentti; `//` vain rivin loppuun (muuten perässä oleva koodi ei suoritu – KORJAUKSET 49).
- Tyylit ovat tiedostossa `css/style.css`. v3.07: ei selaimen omia vierityspalkkeja – teemoitettu liukuri kaikkialla (DEV-valikot poikkeus). Fontit: Uncial Antiqua (otsikot), Alegreya Sans (teksti).

## Tiedostot (latausjärjestyksessä)

| Tiedosto | Sisältö |
| --- | --- |
| `js/boot.js` | (ladataan `index.html`:ssä ennen muita) aloitusjakso, suorituskykytesti omassa näkymässä (`__boot`), pelin skriptien lataus listasta `window.__GJS` (uusi tiedosto lisätään SINNE) |
| `js/core.js` | v3.22 `kExp`; v3.08 DEV-ilmaiset materiaalit `devFree`/`hasReq`/`payReq` (käytä aina aineiden tarkistukseen ja kulutukseen); `DEV` (oletus pois, `localStorage.hiidenmaa_devon` / `?dev=1`, kytkin Asetukset › Ohjaus, v2.99 salasana `DEV_PW` settings.js; Ä = DEV-valikko (Näkymätön `DEVF.unseen`, v2.93 nopeudet `DEVF.spd`/`DEVF.tspd` → main.js `worldStep`/`timeSpd`), Ö = olennot ja pomot `renderDevM`, Å = esineet `renderDevI`/`DEV_PICKS`, täpät `DEVF`), `$`, `clamp`, `lerp`, `sstep`, kohina (`fbm`, `ridge`), `mulberry32` |
| `js/world.js` | `WS` (skaala), `MAPS`/`MAP`/`MAP_ID` (6 karttaa), maailman seed `SEED`/`seedMix` (v2.69, 0 = vanhat paikat; siirtyvät kartan paikat `SITE_MOVE`/`sitePrefOk`), `dirIn`, `HALF`, `LOC` (+ arvotut `SITE_DEFS`-paikat), `AARNI`, `DUN`, `heightFn`, `biomeAt`, `zoneAt`, `BIOMES` (nimet + ominaisuudet), `terrainH`, merenpohja `SEA_FLOOR`, meren raja `seaBorder`, ylämäen hidastus `uphillK`, hautakummun kohouma `barrowMound`, tarkat maanmuokkauslaikut `FT_*`/`ftH` (v2.65, laikut resources.js `ftEnsure`/`ftTool`) |
| `js/render.js` | renderer, scene, camera, valot, näytön auringonsäteet ja linssiheijastus (`RAYS`/`drawRays`, `#raysC`, `SET.flare`, päivä `raysDay`, peitto `raysPeek`, peitto suunnittain `RAYS.dir`/`rayOcc`, voimakkuus `RAYS_A`), pilvien varjostus `cloudShade`, terävät soihtuvarjot `torchSharpOn`/`torchShadowApply`, säteiden taustaluku `RPK`/`raysEval`, varjon vaalennus varjostimessa `hmLift`/`SUN_SH_BASE`, Ultran pehmeä pilvimatto `deckSoftSet`, tekstuurit, `MAT`, `mat()`, `bx()`, maasto (väri `terrCol`, tiheämpi väritys `TFINE`/`terrFineSet`, biomien sekoitus `blendApply`/`TSOFT`, laikkumaski `FTM`/`terrHook`), vesi (varjostin `WATER_U`, syvyyskartta `WATER_DEP`/`waterDepSet`, aallot `WV`/`waveAt`, verkko `waterGeo`, low poly / realistinen `waterApply`), taivas, sade |
| `js/collision.js` | törmäysruudukko: `addBox`, `addCircle`, v2.98 teltan kyykkykatto `COL_CROUCH`/`tentCeil` (crouch-laatikot, `P.inTent`), `groundAt` (ympyrälattia `ground`/`gr`/`dr`: kivet, tynnyrit, muurin harja), `collideXZ`, `pointBlocked` (`lw` = muuri estää näön), `STEPUP` |
| `js/items.js` | `ITEMS`, `RECIPES`, `RECIPE_BY`, `icon(id)` (canvas-kuvakkeet) |
| `js/audio.js` | `sfx(nimi)` – hiljainen äänikoukku; v2.53 äänenvoimakkuus `volK` (`SFX_HOOKS`; v2.22: EI generoituja ääniä – vain käyttäjän omat tiedostot); osumat `TG_HIT`/`tgHit`, törmäykset `tgHeavy`; olentojen tiedostoäänet: varaääniketju `VARAANI`, `creLoad`/`creSnd`/`creTick` (3D); toimintoäänet `TG` (ryhmät; pomot lainaavat `pomot/`-kansiosta `TG_BORROW`; kerrostus pohjaryhmän päälle `TG_BASE`/`TG_BASEP`, askelkerros `TG_STEP_LAYER`), `tgSnd`/`tgPlay`/`tgTick`/`tgSurface` (askeleet, budjetti `TGV`; kuuluvuus `TG_RK`/`tgR2`/`tgDistK`, tahti `TG_WALK_K`/`TG_RUN_K`); olentoäänten taso `CRE_VK`; pelaajan äänet `plSnd`/`plTick`/`plSurface`/`plBody`/`plLoop`/`plBush`/`plNodeAt` (`PLV`, `SET.plVol`, `PL_STEP_V`); susien kerroin `creRK`/`CRE_WOLF_V` |
| `js/models.js` | `makeHumanoid` (yksityiskohtaiset kaksijalkaiset), `makeAnimal` (eläimet; kaulan nivel `nk`, kuonon ulottuma `nkTab`, venymä `nkRig`, pään asento `NK_HP`), `makeBiped`, `makeQuad`, `makeHeld`, `makeShield`, `makeBird` (metso), pelaaja `makePlayer`, haarniskat `buildArmor` |
| `js/bossmodels.js` | pomojen korkealaatuiset mallit (`figVartija`, `figJaatar`, `figKalmaherra`, `figAarni`), apurit `bqLump`/`bqTaper`/`bqCloth`/`bqCrystal`…, Ultra-efektit `f.fx` + `bossUltra()` |
| `js/resources.js` | `NODE` (`cr` = törmäyssäde, jos eri kuin `r`; v3.03 uusi tyyppi → `NODE_ID_XT`, KORJAUKSET 77), `NGEO`, sijoittelu ruutuihin (`CHN`, `VIS_R`), `nodes`, tukit (`logs`), `regrowForest`, kohteiden suoja `siteBlocked`, ruoho `rebuildGrass` (v3.25 ruuduille jaettu `grassGen`, sektorit `grassSplit`/`GPOOL`, Ultra-LOD `*_LOW`), maaston LOD `terrLodTick`, staattisten yhdistäminen `mergeStatics`/`mergeTick`, kallistus rinteessä `NTILT`/`groundSlope`; v2.41 kaukomalli `NGEO_LOW` (`treeLod`, jaettu instanceMatrix), v2.99 uusiutuminen: kivet `ORE_DAYS`/`n.respD`/`rockReady`, oksat ja marjat kaukana `PICK_FAR`/`pickFarTick`; varjomallit `SHP`/`shpTick`/`shpFire` (`NGEO_SHF`, `shLod`, `shOpt`, varjopassin kääre – KORJAUKSET 55) |
| `js/landmarks.js` | riimukivet, rauniot, Hautakumpu, Kalmankehä, luolasto (`DMAP`), `wallTorch`, `brazier`, `rockC`, liekkirekisteri `FLAMES`, arkut `makeChest`/`openLid`/`syncChests`; maahan asti ulottuva kivi `stoneCol`/`gmin` (KORJAUKSET 58), Hautakummun stencil-luolasuu `barrowCave`/`CAVE` |
| `js/pieces.js` | `G`, `WH`, `DOOR_W/H`, tikkaiden kulmat `LADDER_RUN`/`ladRun`, saumaton puusyy `seamLen`, `PIECES`, `pieceBoxes` (tagit `door`/`glass`), `buildPieceMesh` (`GLASS_MAT`, `IRON_MAT`), `addPiece`, `removePiece`, kaukaisten rakennusten yhdistäminen `bmTick`/`BMC` (`mergeSt`); v2.43 liekit pystyyn `FLAME_UP`/`flameUpTick` (models.js) |
| `js/mobs.js` | `MOBDEF`, mallit (`figGolem` kivivartija, `figYlimys`, `figKalmo`, `figHiisi`; pomot bossmodels.js:ssä), `spawnMob`, `mobs`, `boss` |
| `js/dungeons.js` | v3.06 Routaluolan jäälätäköt `iceBuild`/`iceAt` (`ICE_GRIP`, player.js + ai.js `moveMob`), `REALMS` (3 ulottuvuutta, avainketju `lock`/`key`/`alt`, v2.62 useampi lukko `locks`/`lockOpen`/`portalLabel`), generaattorit, `ensureRealm`, v3.01 olentojen uusiutuminen `mobRespQueue`/`mobRespawnTick` (`flags.mq`, 20 min jono), koristeet (`dressFloor`, tynnyrit, spawneri), portaalit, `realmBossAI`, Kalmanpesän murskaus `hitSpawner`, usva/höyry/pisarat (v2.43 yksi instanssipiirto `SMK`/`smkDraw`, Ultra-savut `smokeUltra`), `P.spawnProt`, `fo(k)` |
| `js/story.js` | löytöpaikat (`SITE_KEYS`, rauniot, arkkukivilinnakkeet `FORT`), vartijat (`GUARDS`), lisäriimukivet (`XRUNES`), tehtävät (`QUESTS`), Avaimen kätkijä `LOC.runeK`/`keeperHint`/`keeperTick`, hukattujen arvoesineiden kohde `VAL_HOME`/`relocateRealm`, leirit `CAMPS`/`ensureCamps` (v3.24 asettelu `campDress`/`campFree`/`campGround`, penkki; v2.98 `campSync`, halkopino `campPileHit`, teline `campRackSteal`, `flags.campX`), kiviröykkiöt `STASHES`, maailman saalis `planLoot`/`wlLoot`, arvoesineiden palautus `relocateValuable`/`valuableCensus`, kyltit `SIGNS` |
| `js/state.js` | `P` (pelaaja), `inv`, `flags`, pelaajahahmo, reppu, selkäesineet (`backPose`, v3.08 olkahihna `backStrap`, kuolinvarusteet `deathThrowGear`/`gearUnlock`), maahan pudonneet esineet (arvoesineet `isValuable`, 3D-kuvakkeet `dropMesh`, 3D-mallit `dropModel`/`armorDropMesh`/`keyMesh`/`treasureMesh`/`potionMesh`, majakkasäde `beaconAdd`), partikkelit, ammukset; jousen osumamerkki `hitMarker` (punainen = pääosuma `headShot`), selän nuolet `hasArrows` |
| `js/effects.js` | v2.73 kuolema: kaatuminen `startPlayerDeath`/`updatePlayerDeath` (`P.push`), ruumiit `corpses`/`corpseTick`, `deathTick` (state 'dead'), `deathVig`; tuli ja sade `RAIN_WET`/`FIRE_CD`; veri (`bleed`, `splat`, maastoa seuraava kuolinlammikko `bloodPool`/`poolShape` v2.78, `addWound`, rinne `slopeN`, valuminen `poolFlow`, Ultra `bloodUltra`), savupilvet (`smokePuff`), v3.24 sammuneen tulen savupatsas `fireOutSmoke`/`smokeColTick`, kuolema-animaatiot (`mobDeathAnim`, tuhka), syntyanimaatio `bornStart`/`bornTick` (`opts.noBorn`), pelaajan palaminen ja kuolema (vedessä `D.water`); veden alla `CAM_UW`, `updateWaterFx` (kuplat `UWF`, roiskeet, `#uwTint`/`#drownV`) |
| `js/settings.js` | v3.08 vihjeportaat `hintL1/2/3`/`hintApply`/`HINT_CONF` (body `noHelp`/`noKeyH`/`noActH`; aina näkyvä ohje = `.note.keep`), Extra-pikanapit `xgfxAll`/`XGFX_MAX`, `keyDialog(…,warn)`; `ACTIONS`/`BIND` (näppäinsidonnat, `kd()`), `SET`/`SET_DEF` (oletus = yleisin taso), `SET_PAGES`, `applyGfx()`, HUD-skaala `hudK`/`hudScaleApply` (css `--hudK`), silmäpainike `seeThruSet`/`seeThruSync` (`#menu.seeThru`, vain pelin aikana), asetusvalikko (Grafiikka, Varjot, …); automaattisäätö `AUTO`/`autoOn`, väliotsikot; esiasetussäätimen teemat `pvTheme`/`PV_FX`; kaikki toiminnot -ikkuna `ALL_KEYS`/`showAllKeys` (päivitä, kun lisäät näppäimen). |
| `js/input.js` | v3.25 `inReady` (ei syötettä ennen latausta); näppäimet, hiiri, hiiren lukitus; virtuaalinen osoitin `VC`/`vcSync`/`vcFlush` (lukitus pysyy paneelien ajan; herkkyys `SET.sens`/`SET.curSens`) |
| `js/actions.js` | hyökkäys, vahinko, syöminen, `interact()`, alttari, luolastoon meno; jousi `bowSpread`/`bowShot`/`bowCrouch`, tähtäys `bowAimPoint`, lentorata `bowTraj` |
| `js/resin.js` | v3.08 aarnipuun pihka `RESIN_P_AARNI`/`AARNI_*`, täyttyminen `resinRefillSleep` (yhteinen unilaskuri `flags.sleepC`, regrowForest); v2.91 puukko ja pihkankeräys: pihkapuut `isResinTree` (3 %, `resinHash`, taattu `flags.resinG`), kaiverrus `P.carve`/`carveTick`/`carvePose`, kulho + naru `resinInteract`/`resinDetach`, kertymä `resinTick` (`flags.resin`), kaatuminen `resinKilled`, ulkoasu `resinBuild`; vesikulho `bowlUse` |
| `js/pot.js` | v3.02 keittopata (`POT_*`, `potTick`/`potRate`/`potCraft`/`potTake`/`potLid`/`potSpoil`, ikkuna `#potP` `potOpen`/`potRefresh`) ja hiilos `emberTick` (vakiot ja mallit `EMBER_*`/`emberOn`/`coalBed`/`potModel` pieces.js) |
| `js/farm.js` | v3.08 puiden kasvuvaiheet `TREE_STAGES`/`treeStageSleep` (`n.gst`/`gmx`/`gsk` – EI `n.gk`, se on NGRID-avain), kastelu ja madot `careMode`/`careApply`/`careConsider`/`careDeco` (`flags.care`); v3.06 viljely: siemenet `SEEDS`/`seedDrop` (5 %, pihkapuu 70 %, v3.08 puun kaatuessa), istutus `plantMode`/`plantTry` (kuokka + kyykky + siemen toisessa kädessä), taimet `flags.sap`/`farmSync`, kasvu nukkuessa `farmGrow` (30 %), istutettu solmu `plantNode` (paikan uusiokäyttö, `n.rz` pihkapuu), viljelylaatikko (id `pelto`) + v3.07 kohopenkki `farmSlots`/`fieldSow`/`fieldInteract`/`fieldVis` (`FIELD_W`/`BED_W` pieces.js), kyykkymuistutus `plantHint` |
| `js/smelt.js` | v3.06 sulatusuunin valikko `#smeltP`: jono `D.q` (`SM_Q` 5), polttoaine `D.fuel` s, lämpö `D.heat` (`SM_HEAT_T`/`SM_COOL_T`), `smTick`/`smAdd`/`smFuel`/`smTake`/`smRefund`, vanhan muunnos `smInit` |
| `js/fish.js` | v3.27 yksilökalat `fl`-pinoina (`fishRoll`, `flNorm`/`flTop`/`flTake` – siirrot aina flTake:lla, ei monistusta), pilaantuminen `fishSpoilTick`, syvyys `FISH_Z`/`fishDepthK`, naulakot `nauNorm`/`nauInteract`/`nauRefund` + laatta `nauPlaqueTick`, nimi `anglerAsk`, huhut `fishHintTry`, vapautus `fishReleaseLine`; v3.26 lammet `WB_POND_*` (tunnukset `p*`, uusi vaihe vanhojen jälkeen); v3.13 suolammet `WB_BOG_H`/`WB_BOG_MAX`/`bogg` (KORJAUKSET 87, simulaatio `docs/testit/`); v3.08 18 lajia, kuvakkeet `FISH_SHAPE`/`fishIcon` (items.js), sisävesi `inlandWater`, vavan taipuma `rodBendTick`; v3.06 onkiminen: vedet `WBS`/`wbAt` (nimet kalalajeittain, kartta `fishMapLabels`, rannalla `wbShow`), lajit `FISH_B` (+ `FISH_DEF` items.js), onki `FS`/`fishClick`/`fishTick`/`fishFight`, HUD `#fishHud`, upponut arkku `SUNK`, kirja `#fishP`/`fishBookRender`, tavoitteet `FISH_GOALS`, katiska/savustin/kalanaulakko (`katTick`, `savTick`, `nauVis`), käytettävät esineet `itemUse` |
| `js/fishphys.js` | v3.27 kalastuksen fysiikka (`docs/KALASTUS_SUUNNITELMA.md`): ballistinen heitto `fpV0`/`fpFly` (35° pisin, `FP_ROD_D`), lataus `fpChargeStart`, maa `fpRetr`/`fpLandSnap`, viehe `fpSpin` (pohja, syvyyskerroin), syötin syvyys `fpBaitDepth`, kala siimassa `fpPullStart`/`fpFishUpd`, pudotus `fpFlop`, minipeli `HG`, saalislappu `lappu`, virveli vasemmassa kädessä `virvPose` (IK kammelle), ongen heitto/asento `rodCastPose` (`P._cOff`), ennätysmusiikki `fpRecordMusic` |
| `js/tackle.js` | v3.14 kalastusvarusteet: vavan osat `s.rig`/`rigOf`/`rigStats`/`rigSig` (määrittelyt `TK_LINE`/`TK_HOOK`/`TK_REEL`/`TK_FLOAT`/`TK_LURE`/`TK_COMBOS` items.js), virveli `tkSpinTick`/`lureCond`/`tkSpK`, kuluminen `tkWear`/`tkSnapCheck`/`tkLineBreak`, mato E `tkNoTarget`, kenttävaihto `TKA`, kalastuspakki (`flags.pakit`, `tkPakkiMesh`/`tkPrimary`/`tkPakkiFilter`), Kalastajan pöytä `tkTableMesh`/`tkRender`/`tkGut` (#tkP), 3D-kala `tkFishMesh`/`tkDangle`, mato `tkWormMesh`, vavan osat näkyviin `tkDressRod`, kuvakkeet `tkIcon`, äänet `tkSnd` (`sounds2/kalastus/`), `tkTick` |
| `js/fishbook.js` | v3.15 kalakirja: arvo `fishValue`/`fbDist`/`fbLen` (`FISH_LEN`, luokat `FB_CLS`), saalis `fbCatch`, toiveet `fbWish`/`fbWishCheck`, kuvitus `fishArtDraw`/`fishArt` (myös fishIcon), sivut `fbPages`/`fishBookRender`/`fbTurn`/`fbGo`, kirja kädessä `fbPrimary`/`bookPose`/`fbBookMesh` (pikanäppäin `book` K) |
| `js/inspect.js` | v2.98 F-tarkastelu: `INSP_ANIMS` (11, tyypit `INSP_TYPE`), `inspectStart`/`inspectStop`/`inspectTick` (keskeytys, ääni `f_ihmettely`, uuden esineen AFK-tarkastelu `P.newItem`), asento `inspectPose` (IK + käden kvaternio, pää seuraa; player.js), v2.99 perusasennon palautus `inspectRestore`, avainruudut `_ikf`, ristiinhäivytys `INSP_XF`, puukko irti kädestä `pose.fly`/ote `pose.g` |
| `js/building.js` | rakennushaamu, ruudukkoon kohdistus, reunakohdistus `smartSnap`, tikkaiden/portaiden jatko `jatkoFind`/`jPlace` (tila `JK`, G-tila jatko), tikkaat seinään `ladderWall`, `validPlace`, purku |
| `js/environment.js` | v3.08 varjokameran texel-lukitus `shadowSnap`, intro `INTRO_SD`; päivä/yö (`DAY_LEN`), sää, satunnainen pilvimatto `deckDay`/`deckRnd` (aamumatto `m:1`), Kalmanummen usva `moorK`/`moorDay`/`moorSatSet`, pilvipäivät `cloudDay`/`cloudDayTick`, heijastuksen päiväkerroin `flareDay` (render.js), varjojen syvyys (`OPEN_BIOMES`/`openK`, `FOREST_SH`, `SH_TOD`, `shDepth`, valo `shAmb` render.js), tuuli (`WIND`, `updateWind`), veden päivitys `updateWater` (aallot tuulen mukaan), sateen/lumen suojakartta `COVER`/`coverH` (v2.90), valot, selviytyminen (nälkä, kylmä, lepo), kodin lämpö `HOME`/`homeScan`/`homeTick` |
| `js/player.js` | v2.73 tyhjyys `voidTick`/`P.safe`, kuolinsyy `deathCauseOf`/`DEATH_INFO`/`deathScreen`; liike, fysiikka, uinti/hukkuminen (`P.swim`/`P.swUp`/`P.underT`, hautakasa rantaan `shorePoint`), animaatio (lyönnit `swingPose`, kirves/hakku `chopIK`/`CHOP_K`, käsien IK `armIK`, läpäisyn esto `armClear`; v2.88 raajojen törmäys `limbPush`/`limbPen`/`armWorldClear`), DEV-lento, kuolema, uudelleensyntyminen, nukkuminen |
| `js/ai.js` | vihollisten tekoäly (luonteet `per`, `temperAI`, `stalkAI`), pomon hyökkäykset, `SPAWN`-taulukot, `spawnScary`, jousikalmot `archerAI`, auringossa palaminen `sunBurnAI` (nummella ei `MOOR_UNDEAD`, `moorFightBlock`), emakon perhe `famPlan`/`famStep`/`orphanPiglets`, syöminen `eatPlan`/`eatStep`, juominen `drinkOk`/`drinkSpot`/`drinkPlan`/`drinkStep`, pää alas `headDown`, karhun syöksy `bearLunge`/`bearLungePose`, osuma `mobHurtP`, voitto/rauha `bossVictory`/`peaceRefill`, työpisteiden päivitys |
| `js/camera.js` | kolmannen persoonan kamera (v2.88 rako `CAM_GAP`/`CAM_R`, olkasiirtymä `camSO`, `CAM_MIN`), kuolinkamera `deathCam` (v2.73) |
| `js/ui.js` | v3.08 haku yleissanoilla `SRCH_RULES`/`srchTags`/`srchTag` (v3.26 myös DEV-haku, kategoriat `itemCat`/`DEV_ICATS`); HUD, viestit, paneelit, kartta; esineiden siirto/raahaus (`slotUX`, `#ghostIt`), tehtävän/tavoitteen piilotus (`applyHudMode`), terveyspalkkirivit (`HP_ROW`); kyykkytähtäin `updDropRet` (tyylit `AIM_ST`, ohjeet `aimHint`), pikapaikan pudotus `dropHot`, aluebannerien jono `zoneQ`; nuoliteksti `showAmmo`, pikapaikan nimi `showHotName`/`itemRarity`; pomopalkki `bossBarTick` (teemat `BB_T`); olentojen palkit `updateMobBars` (näkyvyys `BAR_*`, `barSeen`); repun palkit paikallaan `invBarsTick`/`slotBar` (ei ajastettua `invDirty`:ä, KORJAUKSET 57), siirtoslider `splitOpen`/`SPL` (`#splitDlg`, oma rata – VC ei liikuta `<input type=range>`:a), osamäärän siirto `moveCount`. |
| `js/buildinfo.js` | v3.02 rakennusvalikon tietoikkuna `#binfo` (v3.23 0,6 s hover `BINFO_DELAY`, häipyy 10 s `BINFO_HIDE`/`biFade`, I lukitsee, v3.07 vaihtuu heti, `binfoBind`/`binfoShow`/`binfoHide`, oma 3D-kuva `binfo3D`, tiedot `PIECE_INFO`/`CAT_DESC`) |
| `js/progress.js` | `bump`, XP ja taso (`lvlInfo`, v3.16 `LVL_MAX` 999 / palkinnot `LVL_REW_MAX` 30, nimikkeet `LVL_TITLES`/`lvlTitle`; v3.02 tasot 30 + maailmakohtaisen XP:n kertamuunnos `xpMigrate`/`flags.xpv`, v2.70 palkinnot `LVL_REW`/`lvlBon`), saavutukset (`ACH`, `BON`), `GOALS`, edistymispaneeli (J) |
| `js/tutorial.js` | v2.71 opastus `TUT`/`TUT_STEPS` (oma pysäytys `TUT.hold` → `tutHoldUpdate`, ei DEV freeze; näppäimet `tutKey`; alku `tutOnNewWorld`/`tutMaybeStart`), kertavinkit `TIPS` |
| `js/save.js` | `serialize`, `loadData`, `saveGame`, `SKEY`, tallennuspaikat (`SLOTS`, `slotKey`, `slotMeta`, `curSlot`) |
| `js/menubg.js` | valikon animoidut taustakuvat (`MBG_SCENES` 21 kpl, `mbgFrame`, `mbgShow`); valikossa ei piirretä 3D:tä; valikon partikkelit `MFX`/`mfxFrame` (laji taustan mukaan), SVG-logo `buildLogo`, 7 teemaa `LOGO_T`, arvonta `logoRandom` |
| `js/main.js` | valikko, pääsilmukka `frame()`, mukautuva laatu, testirajapinta `window.__game`; valikon taustakameran kierros (`menuCam`, `buildMenuSpots`), automaattisäätö (`autoQuality`), FPS (`updateFps`); valikon näkymät `setMenuView`/`menuBack` (`#menu[data-view]`), intro `startIntro`/`introCam` (v3.13 syöksy `INTRO_DIVE`/`introEase`, usvakerrokset `introMistTick`/`IMIST`, maailmakortit `holdBtn`/`worldCodeCopy`; v3.10 esilataus `ldPrewarm`, kevyt yläkamera `introLight`/`introGrassVis`, vanha tapa `SET.oldLoad`; v3.11–v3.12 piirtorajan pilvet `introEdge`/`introCarpet` (pilvipallot `introPuffTex`, `IC_H`)/`introEdgeOn`; uusi maailma `worldLoad`, tallennuksen jatko latausnäytöllä `saveLoad`, pilvet `introCloudsMake`/`introVeil`), suorituskykytesti `perf*`, taukotila `pauseRun`, v3.01 Poistu pelistä `quitGame`/`QUIT` (v3.02 pito 1 s `QUIT_HOLD`, ruksi `#bQuit.quitX`), DEV-suorituskykymittari `perfTick`. Latausnäyttö on `index.html`:ssä (`__ldSet`/`__ldDone`/`__ldShow`, `__ldAfter`), samoin ensikäynnin aloitusjakso `#splash` (`__splashOn`). |

## Mittayksiköt ja sopimukset

- Metrit ja sekunnit. Maailma on noin −350…350 m (`HALF`), suunniteltu yksikkökoordinaatteihin ja skaalattu
  `WS`=1,75. Luolasto on erillinen tila kohdassa `DUN` (pelaaja siellä kun `P.inDun`).
- Kartta ja seed valitaan ennen skriptien latausta (`localStorage['hiidenmaa_map']`, `['hiidenmaa_seed']`); vaihto = sivun uudelleenlataus (`switchMap`).
  Satunnaisuus, joka riippuu maailmasta, kulkee `mulberry32(seedMix(…))`:n kautta. Seed-testi: `tools/seedtest.mjs`.
- Tarinateksteihin ei kirjoiteta kiinteitä ilmansuuntia: käytä `dirIn`/`dirText`, koska paikat ovat eri kartoilla eri suunnissa.
- Pelaaja: pituus 1,8 m, säde 0,38 m, kävely 4,6 m/s, juoksu 8 m/s, askelnousu `STEPUP` 0,55 m.
- Rakennusosien mitat tulevat vakioista `G`, `WH`, `DOOR_W`, `DOOR_H`, `STEP_N` (`js/pieces.js`).
  Älä kirjoita mittoja numeroina osien sisään.
- Oviaukon on oltava vähintään 0,3 m pelaajaa korkeampi, ja portaiden askelman alle `STEPUP`.

## Näin lisäät sisältöä

- **Esine:** `ITEMS` (+ `food`, `potion` tai `cat`; v2.91 `cat:'bowl'` = kädessä, ryhmä weapon), kuvake `icon()`-switchiin, resepti `RECIPES`-listaan.
- **Rakennusosa:** `PIECES`, `pieceBoxes` (törmäys), `buildPieceMesh` (malli). Työpisteen
  toiminta `actions.js`:n `pieceLabel`/`interact` ja `ai.js`:n `updateStations`.
- **Vihollinen tai eläin:** `MOBDEF` (malli `fig`, `ai`: flee/neutral/hostile/boss) ja `ai.js`:n `SPAWN`.
- **Kalastusvaruste (v3.14):** esine `tk:'line'|'hook'|'reel'|'float'|'lure'` + arvot `TK_*`-taulukkoon (items.js) + resepti `st:'kalapoyta'`; kuvake `tkIcon` (tackle.js).
- **Kala (v3.06):** `FISH_DEF` (items.js: nimi, koko) + `FISH_SHAPE` (kuvake) + `FISH_B` (fish.js: vesi, yleisyys, paino, aika, sää). Kalastustavoite: `FISH_GOALS`. Vesien nimiarvontaa (`WB_LAKE`/`sps`) ei muuteta – vanhat nimet säilyvät.
- **Tavoite:** `GOALS` (`progress.js`, id + xp), järjestyksellä on väliä. Saavutus: `ACH`. Valmistusohjeen tasovaatimus: `lvl`.
- **Rakennusosan tasovaatimus (v3.02):** `lvl` (`placeBuild` + kortti). Tietoikkunan ominaisuudet: `PIECE_INFO` (buildinfo.js).
- **Rakennusosan kategoria:** `cat` (+ `alku:1` = Alkupeli-välilehti) ja `BUILD_CATS` (`pieces.js`) + kuvaus `CAT_DESC` (buildinfo.js). Kiviversio: `base:'x',stone:1`.
- **Valmistuskategoria / hakusanat (v3.08):** `CRAFT_CATS` + `recipeCat` (items.js); uudet yleissanat `SRCH_RULES` (ui.js).

## Äänet

- **Älä koskaan tee tai generoi ääniä itse** – vain kansiot ja paikkamerkit; käyttäjä tuo äänet (v2.22).
- **Jatkossa uudet äänet ja paikkamerkit kansioon `sounds2/`** (käyttäjä 18.11.; rakenne suunnitellaan, kun ensimmäiset uudet äänet tulevat – ks. kehitysmuistio › Ideajono).
- Työtapa ja säännöt: `docs/KEHITYSMUISTIO.md` → "Äänisuunnitelma". Projektit omissa kansioissaan `sounds/<projekti>/` (`raw/`, `valmiit/`, oma lista):
  `olennot_aanet/` (AANILISTA.md), `pelaaja_1_liike/`, `pelaaja_2_toiminnot/`, `pelaaja_3_aanet/`, v2.98 `extra/` (osa 4: F-ihmettely, v3.02 pihkankeräys `pihka/`) (v2.25; avaimet `p/<ryhmä>/…`, työkalun `P_PARTS`; **yksi numeroton paikkamerkki per ääni**, lisäversiot `_1` …; listat `AANILISTA_OSA<n>.csv` + `sounds/AANILISTA_PELAAJA.xlsx`) ja `olennot_toiminnot/` (ryhmäkansiot `raw/<ryhmä>/` → `valmiit/<ryhmä>_valmis/`, AANILISTA_TOIMINNOT.md; kerrostuvissa ryhmissä vain
  kerrokset kuten tömistys/kalina – pohjaääni kaksi- tai nelijalkaisilta); `sounds/manifest.json` yhteinen (`f`-polku).
  Valikot (v2.51–): `menu_1_valikko/` ja `menu_2_efektit/` (avaimet `m/<ryhmä>/…`, työkalun `M_PARTS`, listat `AANILISTA_MENU<n>.csv` + `AANILISTA_MENU.xlsx`), peli `mSnd`/`mStop` (audio.js, `SET.uiVol`);
  ennen pelin skriptejä `__bootSnd` (boot.js, yhteinen AudioContext `window.__AC`, äänten avausmerkki `#sndHint`).
  Musiikki (v2.66): **oma pääkansio `music/`** (raw/valikko menu1/menu2, raw/biomit, raw/ulottuvuudet; avaimet `mu/…`, stereo, manifestissa `../music/…`), soitin boot.js `__mus.set`/`hold` (suoratoisto, ajat `__mus.C`) + main.js `musicTick`/`musicCtx`; ilmoitukset `ilmoitukset/` (avaimet `i/…`, yhteinen + biomi/ulottuvuuskohtaiset);
  sää ja tunnelma (v2.61) `saa_ja_tunnelma/` (avaimet `a/…`, silmukat `X_ACT`, soitin audio.js `ambTick`/`ambTargets`, ukkonen `ambThunder`; v2.67 luontojaksot `natEp`, vedenalainen väylä `sndBus`, ulottuvuuksien idle `realmIdleOk`, ilmoitusääni ui.js `msgSnd`/`plActT`, napit `BTN_BASE`/`SET.btnVol`);
  voimakkuus `volK(kategoria)` (audio.js, sivu Äänet ja musiikki, 100 % = `VOL_BASE`).
- Valikko-/UI-efektit trimmataan tarkasti (`TIGHT_EV`, työkalu): lisää uusi UI-efekti listaan.
- Käyttäjä korvaa paikkamerkin projektin `raw/`-kansiossa samalla nimellä (lisäversiot `_4`, `_5` … ilman rajaa) → aja `python3 tools/process_sounds.py` (uudet nimet: `--init`).
  Peli lukee vain `sounds/manifest.json`:n käsitellyt äänet. Uusi olento → aja `--init` (tekee sen paikkamerkit).
- **Äänierä (uudet äänet):** noudata kehitysmuistion "Äänierän rutiini" (pull → `process_sounds.py` → lue HUOM-rivit → muistio, versio, `tarkistus.mjs` → PR). Pelkkä äänidata ei vaadi
  `full157`-ajoa. Rutiiniin riittää Sonnet/medium; uusi äänikoodi vaatii enemmän ajattelua.
- Työkalu trimmaa ja tasaa äänekkyyden lajeittain (`PROFIILI`); v2.86 pätkät `SPLIT_EV`/`CHUNK_EV`, huipputasaus `PEAK_EV`, ei leikkausta `NOCUT_EV`, v2.87 pätkä keskeltä `MID_EV`, v3.05 käsin mitatut pätkät `SEG_FIX`, alku iskusta `ATTACK_EV`, silmukan sauma `LOOP_XF`, pitkät (yli 60 s) suoratoistona `sndStream`; käyttäjän saumaton silmukka kokonaisena: `WHOLE_LOOP` (työkalu) + `PL_WHOLE` (audio.js, KORJAUKSET 67); kuolemaääniä 1 paikka (rboss) / 2 muilla. Aarnihirviö on varaäänien 💎 (`VARAANI`).
  Pomot (effects.js): nukkuva piilossa `bossHide`, herätys 8 s `bossRisePose`/`bossWakeRoar` (tila `rise`), ryntäys `bossChargePose`,
  kuolema 12 s + maatuminen `bossDeathAnim`/`bossDeathEnd`, silmät `bossEyes`, etusijavalot `pri` + `BOSS_GLOW`.
  Pomohuone `R.room` + `inBossRoom` (dungeons.js) laukaisee herätyksen; DEV-siirrot `devTpBossRoom`/`devTpPortal`, ääriviiva `devRoomOutline`,
  reittiviiva `devRouteLine`/`bossRoute` (`R.grid`). DEV-täpät `DEVF`: noclip (player.js), lockTW ja freeze (main.js update).
  Äänilajit: idle, hurt, death, aggro, chase, echo (echo = nukkuva ulottuvuuspomo kaikuu kaukaa, Kalmanvartija maan alta `vartijaEcho`; pääääni Aarnihirviö). Jousikalmo: `archerAI`/`archerPose` (ai.js), jousen asento `bowAimFig` (player.js).
  Pelin toisto (`creSnd`, audio.js): tärkeys, yksi ääni/olento, 10 äänen raja, kaiku vain `m.dun`-olennoille (ConvolverNode, näytetaajuus = AudioContextin).

## Grafiikka-asetukset

- Kaikki automaattiset grafiikkasäädöt kulkevat `autoOn()`:n kautta (Extra › `noAuto` sammuttaa ne); uusi automaattinen säätö → tarkista `SET.noAuto`.
- Oletuksena pois olevat, vain käsin laitettavat (raskaat) asetukset kuuluvat Extra-grafiikka-välilehdelle (`SET_PAGES.xgfx`, rivi `xRow()`; ei esiasetuksiin).
- Uusi asetus: lisää `SET_DEF`:iin (oletus = nykyinen ulkoasu), sivun avainlistaan `SET_PAGES`, grafiikka-asetukselle suorituskykytaso `PFK`:hon (v2.68 väripallo) ja riviksi `setRow()`:lla
  (oletusmerkintä ja sivun palautus tulevat automaattisesti). Ota käyttöön `applyGfx()`:ssa.

## Etenemisketju

- Ulottuvuuksiin mennään järjestyksessä: Kalmon sinetti (Hautakumpu) + Jääavain (maailman arkku) → 1. → 2. → 3. (koko kulku: kehitysmuistio › Pysyvät päätökset › PELIN KULKU). Jokaisella portilla on varmistus (`alt`), jottei
  kadonnut avain jumita peliä. Uutta lukkoa lisättäessä tarkista, että avaimen lähde on aina saavutettavissa ilman lukon takana olevaa.

## Tallennus

- Tallennus: 6 maailmaa (v3.13). Paikka 0 = `hiidenmaa_save_v1`, paikat 1–5 = `hiidenmaa_save_v1_1`…`_5`, lista `hiidenmaa_slots` (`slotMeta`,
  `curSlot`). Lisäksi valikossa on tallennuskoodi. Automaattitallennus 2 min välein.
- Tallennusmuoto nyt `v` 12 (v2.69: `seed`; v2.65: `ft` = tarkat maanmuokkauslaikut). Kun tallennusmuoto muuttuu, nosta `serialize()`:n `v`-numeroa ja käsittele vanha versio
  `loadData()`:ssa. Kirjaa muutos kehitysmuistioon.

## Testaus

- Nopein: avaa `index.html` selaimessa. Ei palvelinta tarvita.
- Automaattinen: `window.__game` antaa pääsyn tilaan ja funktioihin (esim. `newGame()`,
  `update(dt)`, `invAdd()`, `addPiece()`, `spawnMob()`, `serialize()`, `loadData()`, `keys`).
  Headless-testissä (Playwright) korvaa `requestPointerLock` ja aja `update(1/30)` silmukassa.
  Pilvisessiossa cdnjs on estetty: asenna `three@0.128.0` npm:stä testikansioon ja ohjaa
  `**/three.min.js`-pyyntö siihen `page.route`:lla (vain testiä varten, ei peliin).
- Tarkista aina, ettei konsoliin tule virheitä, ja että tallennus + lataus toimii.
- **Ennen koodausta lue kehitysmuistion "Koodausmuistiinpanot"** (maahan sijoittaminen, stencil, yhdistäminen, Ultra-tunnistus, testiajojen vinkit)
  ja "Osumaäänien tarkistus" (uusi hyökkäys pelaajaan aina `mobHurtP`:n kautta).
- **Syntaksi ennen testejä (KORJAUKSET 62):** `for f in js/*.js tools/tarkistus.mjs; do node --check $f >/dev/null || echo VIRHE $f; done`.
- **Ominaisuustarkistus jokaisen erän jälkeen:** `tools/tarkistus.mjs` (pitää tulostaa `KAIKKI OK`; rivi palauttaa `true` tai virhetekstin – teksti = virhe, KORJAUKSET 48). Lisää uudelle ominaisuudelle
  oma tarkistusrivi, jotta sen katoaminen huomataan. Ennen haaran nollausta tarkista, ettei yhdistämättömiä committeja katoa.

## Julkaisu

- Repo: `EricStudios/hiidenmaa` (käyttäjänimi vaihtui 11/2026, vanha `erboiyprogamer-source` ohjautuu vain repon osalta), GitHub Pages haarasta `main` (juuri), `.nojekyll` käytössä.
- Peli: https://ericstudios.github.io/hiidenmaa/ (vanha `erboiyprogamer-source.github.io` EI ohjaudu; päivittyy noin minuutissa, kun `main` muuttuu).
- Testilinkit: `https://raw.githack.com/EricStudios/hiidenmaa/<haara tai SHA>/index.html`.
- Käyttäjä työskentelee yleensä pilvisessiossa. Kun erä on valmis ja testattu: commit, push ja
  pull request `main`-haaraan. Kerro käyttäjälle lyhyesti mitä muuttui ja muistuta yhdistämään PR
  (Merge), jos et voi tehdä sitä itse.
- Päivitä valikon versionumero (`index.html`, "Selviytymispeli · versio X"; perässä oleva "Early Access 1.2" (v3.13 käyttäjä) muuttuu vain käyttäjän pyynnöstä), `window.HV` (käynnistysvahti), versiotarkistuksen merkit
  (`window.__JSV` core.js, `window.__JSV2` main.js, `--css-v` style.css, `window.__BJV` boot.js; KORJAUKSET 31) ja versioloki samalla.
- **Välimuisti:** nosta samalla `index.html`:n kaikkien `<script src>`- ja `css`-linkkien `?v=X`, muuten
  raw.githack/selain voi näyttää vanhoja JS-tiedostoja. Anna testilinkki myös commit-SHA:lla.
- **Linkit:** haaralinkki näyttää aina haaran uusimman version (välimuistin takia voi viivästyä); commit-SHA-linkki näyttää täsmälleen
  sen version, ei muutu eikä viivästy – suositeltava heti päivityksen jälkeen. Varsinainen peli (Pages) päivittyy vasta Mergen jälkeen.
