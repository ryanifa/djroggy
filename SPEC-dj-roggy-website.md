# Website-specificatie: DJ Roggy (Roggy Douglas)

Versie 1.1 — 24 oktober 2026 — opgesteld voor bouw via Claude Code

Wijzigingen t.o.v. 1.0: architectuur gelijkgetrokken met `ryanifa/passthedutchie` (statisch + Gist + beheer.html), beheergedeelte gespecificeerd (§6a), prijzen marktconform ingevuld (§4.8), logo geleverd (§5), foto's uit Instagram geleverd (§9), aanleverlijst teruggebracht tot wat in het beheerscherm wordt onderhouden.

---

## 1. Context & doel

Roggy Douglas (Rotterdam, °1965) draait sinds 2021 als "DJ Roggy" via The DJ Company (thedjcompany.nl) en gaat nu zelfstandig verder. De website moet zijn bewezen trackrecord (9,3/10 over 77 reviews, 71+ feesten) overnemen naar zijn eigen merk, zodat hij boekingen rechtstreeks binnenhaalt — van particulieren (bruiloften, verjaardagen, jubilea) én bedrijven (personeelsfeesten, zakelijke events).

**Primair doel:** aanvraag/offerte binnenhalen (conversie).
**Secundair doel:** vertrouwen opbouwen via reviews, foto/video en duidelijke werkwijze.

### Bronnen die ik heb bekeken
- Facebook: facebook.com/roggy.douglas (1K volgers; vooral privé-posts, enkele DJ-posts)
- Instagram: instagram.com/roggydouglas (550 posts, 203 volgers; veel korte gig-reels)
- DJ-profiel The DJ Company: thedjcompany.nl/dj-huren/djs/0012p00002xvayraa2 (alle 77 reviews uitgelezen)
- djhuren.nl: dit is een ander bedrijf (Eindhoven, 040-nummer). Roggy's reviewprofiel staat bij **The DJ Company**, niet bij djhuren.nl. Check dit even met Roggy.

---

## 2. Wat de data zegt over Roggy (gebruik dit als basis voor copy)

### Cijfers (bron: The DJ Company, okt 2026)
| Kengetal | Waarde |
|---|---|
| Gemiddelde beoordeling | **9,3 / 10** (77 reviews) |
| Feesten gedraaid | 71 |
| Gasten op feesten | 5.600+ |
| Uren muziek gedraaid | 320+ |
| Feestlocaties | 45 |
| Actief sinds | 2021 (The DJ Company); DJ-passie sinds 1981 ("Playing dj in my sleeping room 1981") |
| Mijlpalen | "Beste service in Zuid-Holland", "Bruiloft DJ", "50+ positieve reviews" |

### Feesttypes (verdeling van 71 feesten)
- Bruiloften: 38 (54%)
- Verjaardagen: 17 (24%) — veel 50/60-jarigen, ook 70/80's-party
- Andere feesten: 10 (14%) — studentenparty, salsa, themafeest (Pirates of the Caribbean), Keti Koti, Sail 2025
- Bedrijfsfeesten / zakelijke events: 6 (8%) — WTC Rotterdam, Inntel Hotels, Bijenkorf personeelsfeest, Den Haag, Breda, Utrecht

### Wat klanten het meest noemen (samenvatting The DJ Company)
1. **Volle dansvloer** — 22 van 71 reviews
2. **Vriendelijk en gezellig** — 13 van 71
3. **Voelt de sfeer goed aan** — 10 van 71
4. **Mooi licht en goed geluid** — 8 van 71
5. **Goede, afwisselende muziekkeuze** — 7 van 71

### Terugkerende thema's in de reviewteksten (USP's voor de site)
- **Afstemming vooraf**: belt/appt in de week voor het feest, bespreekt wensen, gaat soms vooraf langs de locatie om licht/geluid/opbouw te checken. ("Net voor ons feest hebben we nog een gesprek gehad om onze wensen te kunnen bespreken.")
- **Verzoeknummers**: worden vlot gedraaid; durft ook af te slaan als het de sfeer breekt wanneer de klant dat vraagt.
- **Eigen complete set**: geluid, DMX-lichtset, laser, rookmachine, sfeerverlichting — bouwt zelfstandig op en af. Kan tekst/namen projecteren ("lichtset met onze namen erop").
- **Allround**: house, pop, dancehall, Nederlandstalig, reggaeton, 70s/80s, salsa, techno, kerst → "voor ieder wat wils", 18 tot 80 jaar.
- **Persoonlijkheid**: enthousiast, open, benaderbaar, flexibel, danst mee, checkt tussendoor of alles oké is, memorabele afsluiter.
- **Gasten vragen om zijn kaartje** (komt meerdere keren terug) → directe boekingsreden voor eigen site.
- Verbeterpunten uit reviews (eerlijk meenemen in aanbod): lichtset mag uitgebreider (2x), bas soms hard (1x), verzoekjes aan het eind (1x). → Bied een "uitgebreide lichtshow"-optie aan.

### Werkgebied
Zuid-Holland als kern (Rotterdam, Schiedam, Zoetermeer, Den Haag, Delft, Leiden, Rijswijk, Bergschenhoek, Vlaardingen, Dordrecht), met uitstapjes naar Breda, Gemert, Utrecht, Haarlem, Amsterdam, Amstelveen, Beesd, Renesse.

### Bekende locaties (voor "Locaties waar ik draaide")
Lommerrijk (Rotterdam, 6x), Het Wapen van Zoetermeer (6x), Familierestaurant Bergsche Plas (4x), Landgoed te Werve (Rijswijk, 3x), De Tuin van de Vier Windstreken (Rotterdam, 3x), Eten bij LOO, Het Rieten Dak (Delft), Veur Theater (Leidschendam), Inntel Hotels Rotterdam Centre, WTC Rotterdam, Van der Valk Leiden/Zwijndrecht, Kasteel Duivenvoorde, Landgoed Heerlijkheid Mariënwaerdt, Stadsbrouwerij De Pelgrim, Het Koetshuis, Záálig (Schiedam), NON Burgersdijk (De Lier), Moments Beach, Boomerang Beach, Fletcher Landgoed Hotel Renesse.

---

## 3. Doelgroepen & user stories

**A. Bruidspaar (25–45 jaar)**
- Wil zekerheid: "krijgen wij de dansvloer vol?" → bewijs via reviews + video.
- Wil weten of hij ónze muziek draait → werkwijze/intakegesprek + wensenlijst.
- Vergelijkt prijs met DJ-bureaus (€ 475–800 all-in bij The DJ Company) → duidelijke "vanaf"-prijs.

**B. Jarige / jubilaris (40–65 jaar)**
- Zoekt gezelligheid en herkenbare muziek (70s/80s/90s, Nederlandstalig).
- Wil ontzorgd worden: alles meenemen, zelf opbouwen.

**C. Bedrijf / HR / eventmanager**
- Wil professionaliteit, factuur, KvK, verzekering, snelle reactie.
- Vraagt vaak kort van tevoren; wil zakelijke offerte.

**D. Locatie / weddingplanner (indirect)**
- Beveelt DJ's aan; wil een strakke pagina om naar te linken.

---

## 4. Sitemap & pagina-inhoud

```
/                      Home
/bruiloft              Bruiloft-DJ
/verjaardag            Verjaardag & jubileum
/bedrijfsfeest         Bedrijfsfeest & zakelijk
/werkwijze             Zo werkt het (intake → feest)
/reviews               Alle reviews (77, filterbaar)
/foto-video            Galerij / reels
/prijzen               Pakketten & prijzen
/over-roggy            Over Roggy
/contact               Aanvraag / beschikbaarheid
/privacy               Privacyverklaring
/voorwaarden           Algemene voorwaarden
```

### 4.1 Home
1. **Hero** (full-bleed video-loop uit Instagram-reels, gedempt, fallback foto)
   - H1: "DJ Roggy — de dansvloer vol, de hele avond"
   - Sub: "Allround DJ uit Rotterdam voor bruiloften, verjaardagen en bedrijfsfeesten. Eigen licht & geluid, afgestemd op jullie wensen."
   - Trustbar: ★ 9,3/10 · 77 reviews · 71+ feesten · 5.600+ gasten
   - CTA primair: "Check beschikbaarheid" (→ /contact met datumveld)
   - CTA secundair: "Bekijk reviews"
2. **Drie feesttypes** (kaarten): Bruiloft / Verjaardag & jubileum / Bedrijfsfeest → elk naar eigen landingspagina.
3. **Waarom DJ Roggy** (4 USP's met icoon, rechtstreeks uit reviewdata):
   - Volle dansvloer (genoemd in 22 van 71 reviews)
   - Afstemming vooraf: persoonlijk gesprek + wensenlijst
   - Complete set: geluid, DMX-licht, laser, rook, sfeerverlichting
   - Voor ieder wat wils: 18 tot 80, van house tot Nederlandstalig
4. **Reviewcarrousel** (6–8 uitgelichte quotes met naam, cijfer, feesttype, locatie, datum).
5. **Video/foto-strip** (6 tegels uit galerij, hover → play).
6. **Werkwijze in 4 stappen** (compact, link naar /werkwijze).
7. **Locaties waar ik draaide** (logo-/naamwolk, met Lommerrijk, Wapen van Zoetermeer, Bergsche Plas, Landgoed te Werve, WTC Rotterdam…).
8. **Prijsindicatie**: "Vanaf € 495 all-in" (tbd met Roggy) + knop naar /prijzen.
9. **Afsluitende CTA-sectie** met datumcheck.

### 4.2 Bruiloft-DJ (/bruiloft)
- Hero met bruiloftsfoto/reel; H1 "Bruiloft-DJ in Zuid-Holland".
- "38 bruiloften, 44 bruiloftsreviews, gemiddeld 9,4" (berekend uit reviewdata).
- Specifiek: openingsdans, playlist/wensenlijst, verzoeknummers, kinderdisco-optie (review E., Maasland), namen projecteren in lichtshow, samenwerking met band/ceremoniemeester, afsluiter.
- Reviews gefilterd op "Bruiloft" (min. 6 zichtbaar, link naar alle).
- Locaties: bruiloftslocaties-lijst.
- FAQ (schema.org FAQPage): Hoe lang draai je? Kom je vooraf kijken? Neem je alles mee? Wat als het feest uitloopt? Kan je ook de ceremonie/diner-muziek doen?
- CTA: datumcheck.

### 4.3 Verjaardag & jubileum (/verjaardag)
- Focus 50/60/70-feesten, "van 18 tot 80", 70s/80s/90s, Nederlandstalig, salsa.
- Reviews: Cindy (50e verjaardag, 10/10), Carolien ("guilty pleasures"-playlist), Suzan (summer vibes in de regen).
- Optie "thuis/tuin/privélocatie" (Privé locatie komt 5x voor).

### 4.4 Bedrijfsfeest & zakelijk (/bedrijfsfeest)
- Zakelijke toon: betrouwbaar, op tijd, factuur, KvK, aansprakelijkheidsverzekering (tbd), kan tekst/logo projecteren (WTC-review).
- Referenties: WTC Rotterdam, Inntel Hotels Rotterdam Centre, Bijenkorf (25 jaar werkzaam — personeelsfeest + Keti Koti), Boerhaave museum Leiden, Belgisch Biercafé Olivier Utrecht, Natuurtalent.
- Formulier met extra velden: bedrijfsnaam, aantal gasten, budgetindicatie, factuuradres.

### 4.5 Werkwijze (/werkwijze)
Tijdlijn in 5 stappen:
1. **Aanvraag** — datum, locatie, type feest → reactie binnen 24 uur.
2. **Persoonlijk gesprek** — telefonisch of op locatie: muziekwensen, do's & don'ts, verloop van de avond.
3. **Wensenlijst** — online formulier: openingsdans, must-plays, no-plays, verzoeknummers ja/nee, afsluiter.
4. **Het feest** — ruim op tijd, zelf opbouwen, sfeer lezen, meedansen, tussendoor checken.
5. **Nazorg** — review-verzoek, foto's delen.

### 4.6 Reviews (/reviews)
- Alle 77 reviews uit The DJ Company (zie data-bestand §8), met filter op feesttype (Bruiloft/Verjaardag/Bedrijfsfeest/Feest) en sortering (nieuwste/hoogste).
- Toon per review: initiaal-avatar, voornaam, datum, cijfer (bv. 9,3/10 met sterren), titel, tekst, plaats · locatie, feesttype.
- Bovenaan: gemiddelde 9,3 + verdeling (histogram 7–10).
- Bronvermelding: "Reviews verzameld via The DJ Company, 2021–2026" (transparant; voorkomt discussie).
- Later: eigen reviewformulier + Google Reviews-koppeling.
- Schema.org `AggregateRating` + individuele `Review` markup.

### 4.7 Foto & video (/foto-video)
- Masonry-galerij; reels embedden via Instagram oEmbed of zelf gehoste MP4's (voorkeur: zelf hosten, geen tracking/cookies).
- Categorieën: Bruiloft / Verjaardag / Zakelijk / Setup & lichtshow.
- Instagram-feed-widget onderaan (optioneel, cookie-consent nodig).

### 4.8 Prijzen (/prijzen)
Marktreferentie (okt 2026): The DJ Company € 475–800 all-in (bureau, met marge); djhuren.nl € 495 (alleen DJ, eigen muziek) tot € 1.195 all-in (grootste lichtshow). Als zelfstandige zonder bureaumarge zit Roggy er logisch tussenin — scherper dan djhuren.nl, maar niet de goedkoopste (dat past niet bij 9,3). **Prijzen zijn fictief maar marktconform; Roggy stelt ze definitief vast in het beheerscherm.**

| Pakket | Inhoud | All-in prijs |
|---|---|---|
| **Basis** | Allround DJ tot 4 uur, professionele geluidsset, basis-lichtset (2 LED-bars), opbouw & afbouw | **€ 545** |
| **Feest** ⭐ meest gekozen | DJ tot 5 uur, geluidsset, DMX-lichtshow, laser, rookmachine, sfeerverlichting, verlichte DJ-booth, intakegesprek vooraf, wensenlijst | **€ 745** |
| **Compleet** | Als Feest + uitgebreide lichtshow (moving heads), naam/logo-projectie, 6 uur, locatiebezoek vooraf, ceremonie-/dinermuziek-set | **€ 945** |
| **Zakelijk** | Op maat: personeelsfeest, jubileum, congresavond. Factuur, KvK, vaste contactpersoon | **vanaf € 795** (offerte) |

Opties (all-in, incl. btw):
| Optie | Prijs |
|---|---|
| Extra uur draaien | € 95 |
| Kinderdisco (1 uur, vooraf aan feest) | € 125 |
| Ceremonie- of dinermuziek (geluidsset + achtergrondmuziek, 2 uur) | € 175 |
| Locatiebezoek vooraf (bij Basis/Feest) | € 75 |
| Extra lichtpakket (2 moving heads + sterrendoek) | € 150 |
| Reiskosten | Gratis binnen 40 km van Rotterdam; daarbuiten € 0,35/km |
| Feest op zon-/feestdag of na 01:00 | + 10% |

Zekerheden onder de tabel: "Geen verrassingen: all-in prijs inclusief opbouw, afbouw en btw" · "Gratis annuleren tot 30 dagen voor het feest" · "Niet tevreden? We bellen het binnen 48 uur uit — en zoeken een oplossing".
Prijzen komen uit `pakketten` in het databestand (§8) en zijn bewerkbaar in beheer → *Pakketten*.
CTA: "Check beschikbaarheid" (→ contact met pakket voorgeselecteerd).

### 4.9 Over Roggy (/over-roggy)
- Portretfoto (headshot uit Instagram: pak, bril — professioneel).
- Verhaal: DJ sinds 1981 in zijn slaapkamer, Rotterdammer, 25 jaar Bijenkorf (herenmode) → mensenmens, sinds 2021 professioneel DJ via The DJ Company, nu zelfstandig. Keti Koti, Sail 2025, Hotel New York-reünie.
- "Een DJ zorgt niet alleen voor de muziek maar ook voor een beleving met DMX-lichteffecten, rookmachine en laser" (zijn eigen quote, Instagram).
- Apparatuurlijst (merknamen tbd; Instagram toont Mixon-controller + iPad/djay).

### 4.10 Contact (/contact)
- Formulier: naam, e-mail, telefoon, type feest (select), datum (datepicker), locatie/plaats, aantal gasten, tijden, bericht, "hoe ken je mij?".
- Direct-knoppen: WhatsApp, bellen, e-mail.
- Reactiebelofte: "binnen 24 uur".
- Spam-bescherming (honeypot + Turnstile), AVG-checkbox.
- Na verzending: bedankpagina (/bedankt) met conversietracking.

---

## 5. Design & tone of voice

### Merk & logo
- Naam: **DJ Roggy** (consistent; "Roggy Douglas" alleen in Over/footer).
- **Logo geleverd** in `assets/logo/` (bijlage):
  - `logo-horizontal.svg` — vinyl-badge "DJ" + wordmark "ROGGY" voor donkere achtergrond (header, footer)
  - `logo-horizontal-tagline.svg` — idem met tagline "DE DANSVLOER VOL. DE HELE AVOND."
  - `logo-horizontal-light.svg` — voor lichte achtergrond (factuur, zakelijke pagina, print)
  - `logo-horizontal-mono.svg` — wit, voor over foto's
  - `logo-mark.svg` / `logo-mark-bg.svg` — alleen het beeldmerk (favicon, social avatar, watermerk)
  - `logo-stacked.svg/.png` — vierkant, voor Instagram/Facebook-profiel (640×640)
  - `icon-512.png`, `icon-192.png`, `icon-180.png`, `icon-32.png`, `favicon.ico` — PWA/manifest en favicons
  - Beeldmerk: vinylplaat (3 groeven) in amber met "DJ" in antraciet, magenta "laserpunt" rechtsboven. Font: Poppins Bold (paden, geen font-dependency). Letters mogen niet los gezet worden; minimale breedte horizontaal logo 140 px.
- Tagline-opties: "De dansvloer vol. De hele avond." / "Jullie feest, mijn muziek, iedereen op de vloer."
- Domeinsuggesties: djroggy.nl, dj-roggy.nl, roggydj.nl (check beschikbaarheid).

### Visueel
- **Stijl:** strak, donker, premium nachtclub-/feestgevoel met warme accenten. Geen clipart-DJ-clichés.
- **Kleuren:** achtergrond antraciet/zwart (#0E0E11), tekst off-white (#F4F1EC), accent warm amber/goud (#F5B82E) voor CTA's, secundair accent magenta/paars (#B13BFF) als knipoog naar zijn laser/DMX-shows. Lichte variant voor zakelijke pagina optioneel.
- **Typografie:** **Poppins** (700 voor koppen, sluit aan op het logo) + **Plus Jakarta Sans** (400/500/600 voor lopende tekst; zelfde als passthedutchie, dus bekende set). Grote cijfers (9,3 · 77 · 5.600+) als visueel element.
- **Beeld:** zijn eigen reels/foto's domineren (echte feesten, echte mensen), met subtiele grain/gradient-overlay voor leesbaarheid. Portret: pak + bril (professioneel én warm).
- **Micro-interacties:** hover-play op video-tegels, teller-animatie bij kengetallen, sterren vullen bij scroll (prefers-reduced-motion respecteren).

### Tone of voice
- Warm, direct, Rotterdams nuchter, enthousiast — zoals zijn eigen posts ("Lekker gedraaid!", "Ready for party").
- Je/jullie-vorm. Korte zinnen. Geen marketingjargon.
- Zakelijke pagina iets formeler maar niet stijf.

---

## 6. Functionele & technische eisen

### Stack — zelfde opzet als `ryanifa/passthedutchie`
Geen framework, geen build-stap, geen server. Statische bestanden op **GitHub Pages**, de gegevens als één JSON-bestand in een **GitHub Gist** (de "database"), beheer via `beheer.html`. Bewezen in passthedutchie; Roggy beheert straks zelf vanaf zijn telefoon.

```
index.html              de website (one-page met ankers + aparte landingspagina's, zie hieronder)
bruiloft.html, verjaardag.html, bedrijfsfeest.html, reviews.html, prijzen.html, over.html, contact.html
beheer.html             het beheer (noindex)
data/site.json          standaarddata en terugval (alles wat in beheer te wijzigen is)
assets/js/config.js     gistId, gistOwner, gistFile
assets/js/gist.js       enige plek die met de GitHub-API praat (1:1 overnemen uit passthedutchie)
assets/js/store.js      laden, cache, demo-modus, normalize() van het datamodel
assets/js/site.js       de website opbouwen uit het document
assets/js/admin.js      het beheer (tabs, concept/publiceren, back-up)
assets/js/media.js      foto's verkleinen (max 1600 px, JPEG) en als data-URL in een media-Gist zetten (= posters.js)
assets/js/dom.js        DOM-hulpjes (alles via textContent, geen innerHTML met data)
assets/css/             base.css (gedeeld), site.css, admin.css
assets/logo/            logo-bestanden (§5)
assets/img/             meegeleverde foto's (§9) — standaard galerij, in beheer aan te vullen/te verbergen
qr/                     QR-code naar de site voor op visitekaartje/flyer
docs/handleiding.pdf    handleiding beheer (zoals bij passthedutchie)
CLAUDE.md               werkafspraken (direct naar main, geen build-stap)
```

Hergebruik letterlijk uit passthedutchie: `gist.js`, `dom.js`, de laad-volgorde in `store.js` (demo → Gist → cache → bundled), concept-in-localStorage + Publiceren-met-conflictcheck, de token-login met "Demo zonder sleutel", back-up downloaden/terugzetten, en de "beheerlink om in één tik op je telefoon in te loggen".

- Hosting: GitHub Pages (repo `ryanifa/djroggy` of `roggydouglas/djroggy`), custom domein djroggy.nl via CNAME.
- Contactformulier: statisch → **Formspree** (gratis tier, 50/mnd) of **Web3Forms**; e-mail naar Roggy + autoreply. Fallback: `mailto:` + WhatsApp-knop.
- Analytics: **GoatCounter** of Plausible (cookieloos, geen banner).
- Video: zelf gehoste MP4's in `assets/video/` (klein houden, ≤ 3 MB) — niet in de Gist.

### Must-haves
- [ ] Mobile-first; ≥ 60% verkeer verwacht via telefoon (Instagram/WhatsApp-links).
- [ ] Lighthouse ≥ 90 op Performance, Accessibility, SEO.
- [ ] Video's zelf gehost als MP4/WebM, lazy-loaded, poster-afbeelding, max ~3 MB per hero-loop.
- [ ] Reviews uit `data/site.json → reviews` (77 items; schema in §8), bewerkbaar in beheer.
- [ ] Reviewfilter en -sortering client-side.
- [ ] Datumcheck-CTA op elke pagina (sticky op mobiel).
- [ ] WhatsApp-deeplink (`https://wa.me/31XXXXXXXXX?text=...`).
- [ ] Structured data: `LocalBusiness` (type `EntertainmentBusiness`/`DJ`), `AggregateRating`, `Review`, `FAQPage`, `BreadcrumbList`.
- [ ] Open Graph / Twitter cards per pagina.
- [ ] Sitemap.xml, robots.txt, canonical URLs, 404-pagina.
- [ ] Toegankelijkheid: contrast AA, focus-states, alt-teksten, skip-link, formulierlabels.
- [ ] AVG: privacyverklaring, geen cookies van derden zonder consent.
- [ ] Nederlands als enige taal (v1); `lang="nl"`.

### 6a. Beheergedeelte (`beheer.html`) — naar voorbeeld van passthedutchie

Zelfde flow: inloggen met een GitHub fine-grained token (alleen *Gists: read & write*), of *Demo zonder sleutel*. Wijzigingen staan als **concept** klaar (ook na herladen); pas met **Publiceren** komen ze op de site. Conflictcheck als iemand anders intussen publiceerde. Mobile-first: Roggy doet dit vanaf zijn telefoon, vaak de dag na een feest.

Tabs:

| Tab | Wat Roggy hier doet |
|---|---|
| **Reviews** 💬 | Lijst van alle reviews (77 geïmporteerd). Per review: naam, datum, cijfer (1–10, één decimaal), titel, tekst, plaats, locatie, type (Bruiloft/Verjaardag/Bedrijfsfeest/Feest), bron, *uitgelicht* (home), *verbergen*. Knop **"Review toevoegen"** voor nieuwe eigen reviews (bron = "Direct"). Sorteren op datum; filter op type. Bovenaan live het gemiddelde en aantal zoals de site het toont. |
| **Foto's & video** 📷 | Galerij beheren: foto uploaden (verkleind in de browser, naar media-Gist — zie `media.js`), bijschrift, categorie (Bruiloft/Verjaardag/Zakelijk/Setup), *op homepage*, volgorde (omhoog/omlaag), verbergen/verwijderen. Hero-foto en portretfoto kiezen uit de galerij. Video's: alleen een lijst met bestandsnaam/URL + poster (de MP4 zelf gaat via de repo). |
| **Pakketten** 💶 | De 3–4 pakketten en de optietabel uit §4.8: naam, prijs, "meest gekozen"-vinkje, inhoud als regels, zichtbaar ja/nee. Reiskostenregel en zekerheden-teksten. |
| **Agenda** 📅 | Geboekte/geblokkeerde data (datum + optioneel label), zodat de site bij de datumcheck meteen "helaas bezet" of "nog vrij — vraag aan" kan tonen. Simpele lijst, geen kalenderkoppeling (v2: ICS-import). |
| **Info** ℹ️ | Alles uit de oude aanleverlijst: tagline, intro, tijdelijke mededeling (bv. "December bijna vol"), telefoon, WhatsApp, e-mail, KvK, btw-nummer, postadres, socials (Instagram, Facebook, TikTok), werkgebied/straal, apparatuurlijst (regels), aansprakelijkheidsverzekering ja/nee + tekst, FAQ (vraag/antwoord-lijst per feesttype), werkwijze-stappen, "Over Roggy"-tekst, kengetallen (feesten, gasten, uren, locaties) met de optie *automatisch uit reviews afleiden*. |
| **Instellingen** ⚙️ | Gist-gegevens, back-up downloaden/terugzetten, terug naar standaarddata, beheerlink voor op de telefoon, handleiding. |

Validatie en veiligheid: alles via `textContent` (geen HTML-injectie uit de Gist), cijfer 1–10, datum ISO, telefoonnummer genormaliseerd voor `wa.me`. Token blijft in localStorage van de beheerder en gaat alleen naar `api.github.com`.

### Nice-to-haves (v2)
- Beschikbaarheidskalender (geblokkeerde data uit Google Calendar via ICS).
- Online wensenlijst voor geboekte klanten (beveiligde link).
- Eigen reviewformulier na het feest + Google Business-koppeling.
- Engelse versie voor expat-bruiloften (Rotterdam/Den Haag).
- Spotify-playlist-embed "Roggy's warming-up".

---

## 7. SEO

- **Kernzoekwoorden:** "DJ huren Rotterdam", "bruiloft DJ Rotterdam", "bruiloft DJ Zuid-Holland", "DJ verjaardag Rotterdam", "DJ bedrijfsfeest Rotterdam", "allround DJ Zoetermeer/Den Haag/Delft".
- **Lokale landingspagina's (v2):** /dj-rotterdam, /dj-zoetermeer, /dj-den-haag, /dj-delft, /dj-leiden — met de reviews en locaties uit die plaats.
- **Google Business Profile** aanmaken ("DJ Roggy", categorie DJ, Rotterdam) en reviews daarheen sturen.
- Title-template: `{Pagina} | DJ Roggy – Allround DJ Rotterdam & Zuid-Holland`.
- Interne links van reviews naar feesttype-pagina's en locatiepagina's.

---

## 8. Datamodel (`data/site.json` = inhoud van de Gist)

```json
{
  "version": 1,
  "info": { "name": "DJ Roggy", "tagline": "", "intro": "", "announcement": "", "phone": "", "whatsapp": "", "email": "",
            "kvk": "", "btw": "", "address": "", "instagram": "roggydouglas", "facebook": "roggy.douglas", "tiktok": "",
            "regio": "Rotterdam & Zuid-Holland", "straalKm": 40, "verzekerd": true,
            "apparatuur": ["…"], "overTekst": "", "werkwijze": [{"titel": "", "tekst": ""}],
            "faq": [{"type": "Bruiloft", "vraag": "", "antwoord": ""}],
            "kengetallen": {"auto": true, "feesten": 71, "gasten": 5600, "uren": 320, "locaties": 45},
            "media": { "gistId": "", "owner": "" } },
  "pakketten": [ {"id": "feest", "naam": "Feest", "prijs": 745, "populair": true, "inhoud": ["…"], "hidden": false} ],
  "opties": [ {"id": "extra-uur", "naam": "Extra uur draaien", "prijs": 95, "eenheid": ""} ],
  "zekerheden": ["…"],
  "agenda": [ {"datum": "2026-12-31", "label": "Bezet"} ],
  "media": [ {"id": "m-…", "bron": "repo|gist", "pad": "assets/img/hi/djroggy-DK6YMV6CYPh-hi.jpg", "bijschrift": "", "categorie": "Setup", "home": true, "hidden": false} ],
  "videos": [ {"id": "v-…", "pad": "assets/video/lommerrijk.mp4", "poster": "", "bijschrift": ""} ],
  "reviews": [ {
    "id": 4, "naam": "Kassidy", "datum": "2026-07-10", "cijfer": 10,
    "titel": "Gezelligheid, sfeer, vriendelijk, meedenkend en enthousiast",
    "tekst": "…", "plaats": "Rotterdam", "locatie": "Lommerrijk", "type": "Bruiloft",
    "bron": "The DJ Company", "uitgelicht": true, "hidden": false
  } ]
}
```
`normalize()` in `store.js` vult alles aan met defaults, net als in passthedutchie, zodat de renderers nooit hoeven te guarden.

Alle 77 reviews staan in bijlage `reviews-dj-roggy.json` (velden: id, naam, datum, cijfer, titel, tekst, plaats, locatie, type, bron, uitgelicht) en worden bij de eerste build in `data/site.json → reviews` gezet. Reviewtypes: Bruiloft 44 (gem. 9,4), Verjaardag 17 (gem. 9,3), Feest 10 (gem. 9,1), Zakelijk event 6 (gem. 9,3). Gemiddelde over alles: 9,35. Ruwe tekst bewaren; "The DJ Company" in reviewteksten laten staan (eerlijk) — Roggy kan in beheer per review aanpassen.

### Uitgelichte reviews voor de homepage (voorstel)
1. Kassidy — 10/10 — Bruiloft, Lommerrijk (afstemming + sfeer lezen + aanbevolen door locatie)
2. Cindy — 10/10 — Bruiloft, Wapen van Zoetermeer ("Roggy je bent een held… mensen laten dansen die nooit dansen")
3. Suzan — 10/10 — Verjaardag, Zoetermeer ("18 tot 80… summer vibes zelfs toen het regende")
4. Lisa — 9,7/10 — Bruiloft, Landgoed te Werve ("voelde de sfeer super goed aan")
5. Jacqueline — 9/10 — Zakelijk, WTC Rotterdam ("eigen tekst laten projecteren")
6. Wesley — 9,3/10 — Verjaardag ("een ware professional… passie voor muziek")
7. Bert — 9/10 — Verjaardag ("Diverse aanwezigen hebben om zijn kaartje gevraagd")
8. E. — 9,7/10 — Bruiloft, Maasland (kinderdisco → "dikke 10+")

---

## 9. Meegeleverde foto's en wat nog in beheer wordt ingevuld

### Geleverd (bijlage `assets/img/`)
- `assets/img/hi/` — 11 foto's op 1080–1440 px, rechtstreeks uit Instagram-posts:
  - `djroggy-DOSqUVECAc4-hi.jpg` — **portret in pak** ("Ready for een trouwfeest in Lommerrijk") → portretfoto Over/hero-zijkant
  - `djroggy-DK6YMV6CYPh-hi.jpg` — DJ-booth tegen rode glitterwand, planten ("Lekker gedraaid bij de Tuinen") → **hero-kandidaat**
  - `djroggy-C1_u-7zCpba-hi.jpg` — booth met DISCO-neon, groen licht (personeelsfeest Bijenkorf) → bedrijfsfeest-pagina
  - `djroggy-C_FVYAviNCG-hi.jpg` — close-up met koptelefoon, "Made in 1965"-shirt (gig Rijswijk) → Over Roggy
  - `djroggy-DFiEuoPCcn4-hi.jpg` — achter de controller met Laura → werkwijze/intake
  - `djroggy-CuH1tBUtBii-hi.jpg` — Keti Koti bij de Bijenkorf → zakelijk/diversiteit
  - `djroggy-DNmxJqRCzhm-hi.jpg` — Sail 2025, portret buiten → Over
  - `djroggy-DR0SE_zDNZH-hi.jpg`, `djroggy-DbbjUANOXVM-hi.jpg`, `djroggy-DVjevYijs2U-hi.jpg`, `djroggy-C9FzAlvitC5-hi.jpg` — reserve (jubileum-collage, kerstboom, privé) — alleen gebruiken als Roggy dat wil
- `assets/img/instagram/` — 43 foto's/reel-covers op 640 px van alle DJ-gerelateerde posts (bruiloften Landgoed te Werve, Kasteel Duivenvoorde, Zoetermeer, Bergschenhoek; bedrijfsfeesten Den Haag/Breda; Sail 2025; Keti Koti; themafeesten; lichtshow-checks) met `captions.tsv` (shortcode, post/reel, bijschrift) → standaard galerij-inhoud, categorie afleiden uit bijschrift.
- Nog niet geleverd: **video**. De reels zelf (MP4) moet Roggy exporteren vanuit Instagram (Instellingen → Je activiteit → Gegevens downloaden) of de originele opnamen van zijn telefoon aanleveren; de reel-covers zijn er al als poster.

### Wordt in het beheerscherm onderhouden (niet vooraf nodig om te bouwen)
Alles in tab **Info** (§6a): telefoon/WhatsApp/e-mail, KvK/btw/adres, apparatuurlijst, verzekering, FAQ, "Over"-tekst, kengetallen; tab **Pakketten**: definitieve prijzen; tab **Agenda**: geboekte data; tab **Foto's**: extra foto's en volgorde. De site werkt met de standaarddata uit `data/site.json` (placeholders zoals "06-xxxxxxxx" duidelijk herkenbaar) tot Roggy publiceert.

### Nog te checken met Roggy
- Werkt hij via The DJ Company én djhuren.nl, of alleen The DJ Company? (Bepaalt de bronvermelding bij reviews.)
- Mag "The DJ Company" in de reviewteksten blijven staan?
- Domeinnaam: djroggy.nl beschikbaar?

## 10. Fasering (voorstel voor Claude Code)

**Sprint 1 — fundament (week 1)**
Repo opzetten naar passthedutchie-structuur, `gist.js`/`dom.js`/`store.js` overnemen, datamodel + `data/site.json` met de 77 reviews, pakketten en meegeleverde foto's, design tokens + base.css, header/footer met logo, Home, contactformulier werkend, GitHub Pages live.

**Sprint 2 — beheer (week 2)**
`beheer.html` met tabs Reviews, Foto's & video, Pakketten, Agenda, Info, Instellingen; concept/publiceren; media-Gist; demo-modus; handleiding.

**Sprint 3 — pagina's, media & SEO (week 3)**
Bruiloft, Verjaardag, Bedrijfsfeest, Werkwijze, Reviews (filter), Over Roggy, Prijzen; galerij/video; structured data; OG-images; Lighthouse; Google Business Profile; domein djroggy.nl.

**Sprint 4 — v2**
Lokale landingspagina's, beschikbaarheidskalender, eigen reviewformulier.

---

## 11. Acceptatiecriteria (definition of done v1)

1. Elke pagina heeft een zichtbare "Check beschikbaarheid"-CTA boven de vouw en sticky op mobiel.
2. Reviews-pagina toont alle 77 reviews, filterbaar op type, met gemiddelde 9,3 en bronvermelding.
3. Contactformulier levert binnen 1 minuut een e-mail bij Roggy af en stuurt de klant een bevestiging.
4. Lighthouse mobiel ≥ 90 op alle vier de scores voor Home en Bruiloft.
5. Geen cookiebanner nodig in v1 (geen third-party embeds zonder consent).
6. Structured data valideert zonder fouten in Google Rich Results Test.
7. Bezoekers zien altijd meteen inhoud (cache of `data/site.json`), ook als GitHub niet bereikbaar is.
8. Roggy kan vanaf zijn telefoon in beheer een review toevoegen, een foto uploaden, een prijs wijzigen en publiceren — zonder hulp.
