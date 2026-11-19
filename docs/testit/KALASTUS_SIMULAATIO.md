# Kalastuksen simulaatio (v3.13)

Simuloitu pelin omilla funktioilla (`fishTick`, `fishHook`, `fishFight`, `fishPick`, `fishWaitPlan`) headless-selaimessa, 0,1 s askelin, päiväaika alkaen klo ~10 (pelin vuorokausi 12 min),
sää selkeä. **Pelaajamalli:** reagoi tärppiin 0,35 s:ssa, heittää uudelleen 2 s:n tauon jälkeen, väsytyksessä pitää kelaa kun siiman kireys < 0,72, kestävyys ei lopu.
→ yhtään tärppiä ei karannut eikä siima katkennut (taitava pelaaja). Oikeassa pelissä hitaampi reaktio ja kävely heittojen välillä vähentävät saalista.
Lyhyet ajot toistettu (5 min × 8, 25/30 min × 3) ja keskiarvo annettu. "Väli" = keskimääräinen aika saaliista seuraavaan. "Muut" = muut saaliit (kalakirja = ensimmäisen kalan palkinto).
Kartat: Hiidenmaa (seed 0: Haukijärvi, Lohisalmi, soinen Ahvenjärvi) ja Routasaari (seed 0: Ruutanalampi = oikea suolampi).

```
== lake Haukijärvi
    5 min onki: kalaa keskim 1.3 (vaihtelu [0, 2]), väli ~170 s, muut {'kalakirja': 1, 'pulloposti': 1, 'saapas': 1} / 8 ajoa
   25 min onki: kalaa keskim 7.7 (vaihtelu [7, 8]), väli ~175 s, muut {'saapas': 1, 'hiidensiru': 1} / 3 ajoa
   30 min onki: kalaa keskim 8.7 (vaihtelu [7, 10]), väli ~198 s, muut {'rauta': 1, 'pulloposti': 1, 'saapas': 2, 'hiidensiru': 1} / 3 ajoa
  120 min onki: 33 kalaa (16.5/h), väli ~217 s, 22.2 kg, suurin 3.69 kg, lajit {'ahven': 8, 'muikku': 4, 'sarki': 8, 'lahna': 8, 'toutain': 1, 'kuha': 2, 'kiiski': 1, 'hauki': 1}, muut {'pulloposti': 1, 'kupari': 1, 'hiidensiru': 1, 'rauta': 1}
  120 min onki +madot: 43 kalaa (21.5/h), väli ~164 s, 22.9 kg, suurin 2.69 kg, lajit {'muikku': 9, 'kiiski': 4, 'kuha': 2, 'sarki': 14, 'made': 3, 'ahven': 6, 'lahna': 4, 'hauki': 1}, muut {'hiidensiru': 1, 'saapas': 1, 'kupari': 1}
  120 min hiidenvapa +madot: 60 kalaa (30/h), väli ~120 s, 52.1 kg, suurin 8.34 kg, lajit {'ahven': 10, 'hauki': 4, 'kuha': 4, 'sarki': 16, 'kiiski': 6, 'muikku': 12, 'lahna': 4, 'made': 2, 'toutain': 2}, muut {'hiidensiru': 1, 'ruostavain': 1, 'saapas': 2}
== sea Lohisalmi
    5 min onki: kalaa keskim 1.5 (vaihtelu [1, 3]), väli ~164 s, muut {} / 8 ajoa
   25 min onki: kalaa keskim 7.7 (vaihtelu [7, 8]), väli ~186 s, muut {'rauta': 1, 'saapas': 1, 'pulloposti': 1} / 3 ajoa
   30 min onki: kalaa keskim 8 (vaihtelu [7, 9]), väli ~213 s, muut {'saapas': 2} / 3 ajoa
  120 min onki: 37 kalaa (18.5/h), väli ~195 s, 61.5 kg, suurin 6.78 kg, lajit {'silakka': 17, 'turska': 11, 'kampela': 3, 'siika': 2, 'meritaimen': 3, 'lohi': 1}, muut {'ruostavain': 1, 'rauta': 1, 'saapas': 1}
  120 min onki +madot: 41 kalaa (20.5/h), väli ~173 s, 50.2 kg, suurin 7.14 kg, lajit {'turska': 7, 'kampela': 9, 'silakka': 15, 'meritaimen': 3, 'siika': 5, 'lohi': 2}, muut {'pulloposti': 1, 'saapas': 2, 'hiidensiru': 1, 'rauta': 1}
  120 min hiidenvapa +madot: 58 kalaa (29/h), väli ~124 s, 71.2 kg, suurin 11.09 kg, lajit {'silakka': 24, 'kampela': 11, 'turska': 11, 'siika': 7, 'lohi': 3, 'meritaimen': 2}, muut {'kupari': 2, 'pulloposti': 1, 'saapas': 2, 'rauta': 1}
== bogg Ahvenjärvi
    5 min onki: kalaa keskim 1.1 (vaihtelu [0, 2]), väli ~124 s, muut {'pulloposti': 1, 'saapas': 1} / 8 ajoa
   25 min onki: kalaa keskim 8 (vaihtelu [7, 10]), väli ~183 s, muut {'saapas': 1} / 3 ajoa
   30 min onki: kalaa keskim 7.3 (vaihtelu [5, 9]), väli ~246 s, muut {'kupari': 2, 'pulloposti': 1, 'hiidensiru': 2, 'rauta': 1} / 3 ajoa
  120 min onki: 34 kalaa (17/h), väli ~205 s, 11.9 kg, suurin 2.97 kg, lajit {'sarki': 8, 'kiiski': 5, 'ahven': 5, 'muikku': 6, 'ruutana': 4, 'toutain': 1, 'made': 1, 'suonsilma': 1, 'lahna': 1, 'kuha': 1, 'hauki': 1}, muut {'rauta': 1}
  120 min onki +madot: 42 kalaa (21/h), väli ~166 s, 22.1 kg, suurin 3.69 kg, lajit {'sarki': 11, 'ahven': 8, 'kiiski': 4, 'suonsilma': 3, 'suutari': 3, 'ruutana': 3, 'muikku': 4, 'lahna': 4, 'made': 2}, muut {'hiidensiru': 1}
  120 min hiidenvapa +madot: 62 kalaa (31/h), väli ~113 s, 40.7 kg, suurin 4.86 kg, lajit {'hauki': 3, 'kiiski': 2, 'ruutana': 11, 'made': 2, 'lahna': 8, 'sarki': 9, 'ahven': 15, 'muikku': 9, 'suutari': 1, 'toutain': 2}, muut {'pulloposti': 1, 'rauta': 1, 'hiidensiru': 2, 'saapas': 2}
== bog Ruutanalampi
    5 min onki: kalaa keskim 1.6 (vaihtelu [1, 2]), väli ~141 s, muut {'kalakirja': 1} / 8 ajoa
   25 min onki: kalaa keskim 8.7 (vaihtelu [7, 10]), väli ~166 s, muut {'kupari': 1, 'hiidensiru': 1} / 3 ajoa
   30 min onki: kalaa keskim 10.3 (vaihtelu [9, 13]), väli ~172 s, muut {'hiidensiru': 2, 'ruostavain': 1, 'saapas': 1} / 3 ajoa
  120 min onki: 45 kalaa (22.5/h), väli ~145 s, 17.2 kg, suurin 1.41 kg, lajit {'ruutana': 34, 'suonsilma': 6, 'suutari': 5}, muut {'pulloposti': 1, 'hiidensiru': 2, 'saapas': 1}
  120 min onki +madot: 46 kalaa (23/h), väli ~155 s, 15.9 kg, suurin 1.43 kg, lajit {'ruutana': 37, 'suonsilma': 4, 'suutari': 5}, muut {'ruostavain': 1, 'pulloposti': 1, 'hiidensiru': 1, 'saapas': 2, 'rauta': 1}
  120 min hiidenvapa +madot: 76 kalaa (38/h), väli ~94 s, 33.3 kg, suurin 2.08 kg, lajit {'ruutana': 57, 'suutari': 10, 'suonsilma': 9}, muut {'ruostavain': 1, 'rauta': 1, 'kupari': 1}
```

## Havainnot
- Onki ilman syöttiä: noin **16–19 kalaa tunnissa** (väli ~3–3,5 min) kaikissa vesissä; madoilla ~21–23/h; **hiidenvavalla + madoilla ~29–38/h** (väli ~1,5–2 min).
- 5 minuutissa saa 1–2 kalaa (vaihtelu 0–3), 25–30 minuutissa 7–10 kalaa, 2 tunnissa 33–45 (onki) tai 55–76 (hiidenvapa).
- Muut saaliit: noin 1 kahdessakymmenessä heitossa – saapas yleisin, sitten kupari/rauta/hiidensiru; pulloposti ja ruostunut avain harvinaisia ja vain kerran ennen upponutta arkkua.
- Meri antaa painavimmat saaliit (turska, lohi, meritaimen), suolampi kevyimmät mutta tiheimmin (ruutanaa). Soisessa järvessä (Ahvenjärvi) tulee järvikalojen lisäksi ruutanaa,
  suonsilmää ja suutaria.
- **Löydetty vika (KORJAUKSET 87):** suolampia ei syntynyt koskaan v3.06–v3.12 → ruutana, suonsilmä ja suutari olivat saavuttamattomia. Korjattu v3.13.
- Katiska (1 h): täyttyy maksimiin 3 kalaa (syötillä nopeammin, 3 syöttiä kului). Savustin: 3 kalaa → 4 savukalaa (hauki 2). Upponut arkku: kirje → avain → arkku aukeaa,
  saalis rauta 4, kupari 6, hiidensiru 1, lasi 2, savukala 3.
