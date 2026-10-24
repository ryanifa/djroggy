# Werkafspraken

- Wijzigingen mogen direct naar `main` worden gepusht; geen feature-branch of PR nodig.
- Statische site zonder build-stap; zie README.md voor opbouw en de Gist-opslag.
- Taal van site, beheer en commits: Nederlands (je/jullie-vorm). Toon: warm, direct, Rotterdams nuchter.
- Alles wat uit de Gist of het beheer komt gaat via `textContent` (zie `assets/js/dom.js`), nooit via `innerHTML`.
- `data/site.json` is de standaarddata én de terugval; het datamodel staat in `normalize()` in `assets/js/store.js`.
- De volledige specificatie staat in `SPEC-dj-roggy-website.md`.
- Bij elke push naar `main` het nummer in `VERSION` ophogen (datum + volgnummer, bv. `2026.10.24-9`); het staat in de footer en achter de CSS/JS-links als cache-buster. De pagina's worden daarna opnieuw gegenereerd.
