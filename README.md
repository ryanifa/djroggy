# DJ Roggy

Website van DJ Roggy (Roggy Douglas, allround DJ uit Rotterdam): bruiloften,
verjaardagen en bedrijfsfeesten in Zuid-Holland. Bezoekers zien een snelle,
mobielvriendelijke site; Roggy past reviews, foto's, prijzen, agenda en
contactgegevens zelf aan via `beheer.html`.

Geen server, geen build-stap, geen dependencies: statische bestanden op GitHub
Pages, en de gegevens staan als één JSON-bestand in een **Gist** (de "database").
De opzet is overgenomen van `ryanifa/passthedutchie`.

Specificatie: **`SPEC-dj-roggy-website.md`** (versie 1.1).

## Hoe het werkt

| | |
|---|---|
| Hosting | GitHub Pages (deze repo, gewoon vanuit `main`) |
| Gegevens | `site.json` in een openbare Gist |
| Lezen (bezoekers) | Zonder sleutel, rechtstreeks van de GitHub-API |
| Schrijven (beheer) | Met een GitHub-sleutel die alleen Gists mag |
| Foto's uit beheer | in een tweede Gist (de media-Gist), die het beheer bij de eerste upload zelf aanmaakt |
| Terugval | `data/site.json` in de repo, plus een cache in de browser |
| Contactformulier | Formspree (id in `assets/js/config.js`) + WhatsApp- en belknop |

De GitHub-API staat zonder sleutel 60 verzoeken per uur per IP-adres toe. Is dat
op, dan valt de site terug op de CDN-kopie van de Gist
(`gist.githubusercontent.com`), die geen limiet heeft maar een paar minuten
achter kan lopen. Daarvoor is `gistOwner` in `config.js` nodig.

Bezoekers zien meteen inhoud (de HTML bevat de standaardinhoud, daarna de cache
of `data/site.json`) en vervolgens, zodra de Gist binnen is, de actuele versie.
Is GitHub even niet bereikbaar, dan blijft de site gewoon werken.

## Eenmalig instellen

1. **Maak een sleutel.** Ga naar
   [GitHub → fine-grained token](https://github.com/settings/personal-access-tokens/new)
   en zet bij **Account permissions → Gists** de waarde op **Read and write**.
   Verder niets aanzetten.
2. **Open `beheer.html`** op de site, plak de sleutel en klik op *Inloggen*.
3. Klik op **Nieuwe Gist aanmaken**. De Gist wordt gevuld met `data/site.json`.
4. **Zet het Gist-id en je GitHub-naam in `assets/js/config.js`** (het tabblad
   *Instellingen* laat de exacte regels zien) en push. Vanaf dan zien álle
   bezoekers de live gegevens.
5. **Formulier:** maak op [formspree.io](https://formspree.io) een formulier aan
   en zet het id in `config.js` (`formspreeId`).

Eerst rondkijken kan ook: *Demo zonder sleutel* op de inlogpagina. Wijzigingen
blijven dan in je browser, en de website laat ze (alleen in die browser) zien
met een gele balk erboven.

## Beheren (tabs in `beheer.html`)

- **Reviews** — alle reviews (77 geïmporteerd, herkomst bureau), toevoegen,
  bewerken, filter op type en herkomst, *uitgelicht* (homepage) en *verbergen*;
  gele balk "Bureau-reviews staan uit — 77 verborgen" zolang de schakelaar uit staat.
- **Foto's & video** — galerij: uploaden (verkleind in de browser naar de
  media-Gist), bijschrift, categorie, *op homepage*, volgorde, verbergen.
  Hero- en portretfoto kiezen.
- **Pakketten** — pakketten, opties en zekerheden (prijzen).
- **Agenda** — geboekte/geblokkeerde data voor de datumcheck.
- **Info** — bovenaan de schakelaar "Materiaal uit DJ Company-opdrachten tonen"
  (met waarschuwing en bevestiging) en de Google-reviewlink; verder tagline, intro,
  mededeling, telefoon, WhatsApp, e-mail, KvK, btw,
  adres, socials, werkgebied, apparatuur, verzekering, FAQ, werkwijze,
  "Over Roggy", kengetallen.
- **Instellingen** — Gist-gegevens, back-up downloaden/terugzetten, terug naar
  standaarddata, beheerlink voor op de telefoon, handleiding.

Wijzigingen staan eerst als concept klaar (ook na herladen). Pas met
**Publiceren** komen ze op de website. Heeft iemand anders intussen op een ander
apparaat gepubliceerd, dan vraagt de app eerst of je dat wilt overschrijven.

### Over de sleutel

De sleutel blijft in de browser van de beheerder (localStorage) en gaat alleen
naar `api.github.com`. Wie de sleutel heeft, kan bij de Gists van dat account —
gebruik dus een sleutel die alléén Gists mag. Lekt hij uit: intrekken bij GitHub,
nieuwe maken, opnieuw inloggen. De Gist blijft gewoon bestaan.

## Bestanden

```
index.html              de homepage
contact.html            aanvraag / beschikbaarheid (formulier, WhatsApp, bellen)
bruiloft.html, verjaardag.html, bedrijfsfeest.html   landingspagina's per feesttype
werkwijze.html, reviews.html, foto-video.html, prijzen.html, over.html
privacy.html, voorwaarden.html, 404.html
sitemap.xml, robots.txt
beheer.html             het beheer (sprint 2; nu een tussenpagina)
data/site.json          standaarddata en terugval (alles wat in beheer te wijzigen is)
assets/js/config.js     Gist-id, Gist-eigenaar, Formspree-id
assets/js/gist.js       de enige plek die met de GitHub-API praat
assets/js/store.js      laden, cache, demo en het datamodel (normalize)
assets/js/site.js       de website opbouwen
assets/js/admin.js      het beheer (sprint 2)
assets/js/media.js      foto's verkleinen (max 1600 px, JPEG), uploaden en laden
assets/js/dom.js        kleine DOM-hulpjes (alles via textContent)
assets/css/             base.css (tokens, gedeeld), site.css, admin.css
assets/logo/            logo, favicon en PWA-iconen
assets/img/hi/          11 foto's op 1080–1440 px
assets/img/instagram/   43 galerijfoto's op 640 px + captions.tsv
assets/video/           zelf gehoste MP4's (niet in de Gist)
qr/                     QR-code naar de site
docs/handleiding.pdf    handleiding beheer (sprint 2)
reviews-dj-roggy.json   bron van de 77 reviews (eenmalig geïmporteerd)
```

Lokaal bekijken: `python3 -m http.server` in de repo en open
`http://localhost:8000`.

Elke pagina bevat de standaardinhoud al in de HTML (uit `data/site.json`),
zodat de site ook zonder JavaScript en zonder GitHub werkt; `site.js` vervangt
die inhoud zodra de actuele gegevens binnen zijn. De pagina's zijn eenmalig
gegenereerd uit `data/site.json`; verander je daar vaste teksten (FAQ,
werkwijze, pakketten), dan laat het beheer/Gist ze live zien en kun je de HTML
bij gelegenheid bijwerken.

## Schakelaar bureau-materiaal (§1a van de spec)

De samenwerkingsovereenkomst met The DJ Company (art. 5.1, 7.1, 7.2, boete
art. 9.1) bepaalt dat de site live gaat in een *schone opstartversie*:

- Elke review, foto en locatie heeft `herkomst: "bureau" | "eigen"`. De 77
  geïmporteerde reviews, de foto's van DJ Company-opdrachten en de locaties uit
  die reviews zijn `bureau`; Bijenkorf, Keti Koti, Sail 2025, familiefeesten,
  Sporting Club de Uitweg en eigen booth/lichtshow-checks zijn `eigen`.
- `info.bureauMateriaal` (standaard `false`) is de enige schakelaar. Eén functie
  `filter(doc)` in `assets/js/store.js` bepaalt wat de site ziet; alle renderers
  werken op het resultaat van die functie. De HTML-bestanden bevatten alleen de
  opstartversie, zodat ook zonder JavaScript (en voor Google) geen bureau-
  materiaal zichtbaar is.
- Reviews worden nooit herschreven: de teksten in `data/site.json` zijn
  byte-voor-byte gelijk aan `reviews-dj-roggy.json`, met bronregel
  "via The DJ Company" zodra ze getoond worden.
- Kengetallen (71 feesten, 5.600+ gasten, 320 uur, 45 locaties, sinds 2021)
  zijn eigen ervaring en staan altijd op de site.
- `info.googleReviewUrl` (Google Business Profile) zet de knoppen "Lees onze
  Google-reviews" en "Schrijf een review" aan.

Controle (acceptatiecriterium 9 en 10): render alle pagina's met de schakelaar
uit en grep de DOM op elke reviewnaam, reviewtekst-fragment, bureau-foto en
bureau-locatienaam; er mag niets gevonden worden. Zet daarna in demo-modus
`bureauMateriaal` op `true` en controleer dat laag 2 op `reviews.html`
verschijnt (77 reviews, histogram, filters, bronvermelding, JSON-LD).

## Foto's uit het beheer

Een geüploade foto wordt in de browser verkleind (max. 1600 px, JPEG) en als
tekstbestand (`m-….txt`, een data-URL) in de media-Gist gezet. Zo blijft het
databestand klein en snel. Bezoekers laden die foto's via de CDN van GitHub.
De meegeleverde foto's in `assets/img/` staan gewoon in de repo.
