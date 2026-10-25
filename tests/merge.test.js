/* Tests voor mergeDefaults() in assets/js/store.js. Draaien met: node tests/merge.test.js */
import assert from 'node:assert/strict';
import { normalize, mergeDefaults, slug } from '../assets/js/store.js';

const bundled = normalize({
  info: {
    tagline: 'Standaard tagline', kop: 'Standaard *kop*', linkedin: 'https://www.linkedin.com/in/test/', bureauMateriaal: true,
    apparatuur: ['Geluidsset', 'Twee draadloze microfoons', 'Beamer'],
    faq: [{ type: 'Algemeen', vraag: 'Hoe lang draai je?', antwoord: 'Standaardantwoord.' }, { type: 'Algemeen', vraag: 'Kun je ook karaoke doen?', antwoord: 'Ja.' }],
    werkwijze: [{ titel: 'Aanvraag', tekst: 'a' }, { titel: 'Gesprek', tekst: 'b' }],
  },
  opties: [{ id: 'extra-uur', naam: 'Extra uur', prijs: 95 }, { id: 'karaoke', naam: 'Karaoke', prijs: null, tekst: 'Op aanvraag' }],
  zekerheden: ['Geen verrassingen', 'Gratis annuleren'],
  locaties: [{ naam: 'de Bijenkorf', plaats: 'Rotterdam', herkomst: 'eigen' }],
});

// Het "live" document van de beheerder: oudere versie met eigen invullingen.
const live = normalize({
  info: {
    tagline: 'Eigen tagline!', kop: '', linkedin: '', bureauMateriaal: false,
    apparatuur: ['Geluidsset (aangepast door Roggy)'],
    faq: [{ type: 'Algemeen', vraag: 'Hoe lang draai je?', antwoord: 'Eigen antwoord van Roggy.' }],
    werkwijze: [{ titel: 'Aanvraag', tekst: 'eigen tekst' }],
  },
  opties: [{ id: 'extra-uur', naam: 'Extra uur (eigen prijs)', prijs: 110 }],
  zekerheden: ['Geen verrassingen'],
  locaties: [],
  verwijderdeIds: ['zek-gratis-annuleren', 'ww-gesprek'],
});

let n = 0;
const test = (naam, fn) => { fn(); n++; console.log('✓', naam); };

test('normalize geeft lijsten zonder id een stabiele slug-id', () => {
  assert.equal(bundled.info.faq[1].id, 'faq-kun-je-ook-karaoke-doen');
  assert.equal(bundled.info.apparatuur[1].id, 'app-twee-draadloze-microfoons');
  assert.equal(bundled.zekerheden[1].id, 'zek-gratis-annuleren');
  assert.equal(bundled.locaties[0].id, 'loc-de-bijenkorf-rotterdam');
  assert.equal(slug('Záálig Eten & Drinken', 'loc-'), 'loc-zaalig-eten-drinken');
});

const voor = JSON.stringify(live);
const { doc, rapport } = mergeDefaults(live, bundled);

test('de functie is puur: het invoerdocument verandert niet', () => {
  assert.equal(JSON.stringify(live), voor);
});

test('nieuw item wordt toegevoegd (optie, FAQ, apparatuur, locatie)', () => {
  assert.ok(doc.opties.some((o) => o.id === 'karaoke'));
  assert.ok(doc.info.faq.some((f) => f.id === 'faq-kun-je-ook-karaoke-doen'));
  assert.deepEqual(doc.info.apparatuur.map((a) => a.id), ['app-geluidsset-aangepast-door-roggy', 'app-geluidsset', 'app-twee-draadloze-microfoons', 'app-beamer']);
  assert.equal(doc.locaties.length, 1);
  const ids = rapport.toegevoegd.map((t) => `${t.lijst}:${t.id}`);
  assert.deepEqual(ids.sort(), ['apparatuur:app-beamer', 'apparatuur:app-geluidsset', 'apparatuur:app-twee-draadloze-microfoons', 'faq:faq-kun-je-ook-karaoke-doen', 'locaties:loc-de-bijenkorf-rotterdam', 'opties:karaoke'].sort());
  assert.equal(rapport.toegevoegd.find((t) => t.id === 'karaoke').label, 'Karaoke');
});

test('bestaand item met andere tekst in bundled blijft byte-voor-byte ongewijzigd', () => {
  assert.equal(doc.opties.find((o) => o.id === 'extra-uur').naam, 'Extra uur (eigen prijs)');
  assert.equal(doc.opties.find((o) => o.id === 'extra-uur').prijs, 110);
  assert.equal(doc.info.faq.find((f) => f.id === 'faq-hoe-lang-draai-je').antwoord, 'Eigen antwoord van Roggy.');
  assert.equal(doc.info.werkwijze[0].tekst, 'eigen tekst');
});

test('verwijderd item komt niet terug en staat in overgeslagen', () => {
  assert.ok(!doc.zekerheden.some((z) => z.id === 'zek-gratis-annuleren'));
  assert.ok(!doc.info.werkwijze.some((w) => w.id === 'ww-gesprek'));
  assert.deepEqual(rapport.overgeslagen.sort(), ['ww-gesprek', 'zek-gratis-annuleren']);
  assert.deepEqual(doc.verwijderdeIds, ['zek-gratis-annuleren', 'ww-gesprek']);
});

test('leeg info-veld wordt gevuld, gevuld veld niet', () => {
  assert.equal(doc.info.kop, 'Standaard *kop*');
  assert.equal(doc.info.linkedin, 'https://www.linkedin.com/in/test/');
  assert.equal(doc.info.tagline, 'Eigen tagline!');
  assert.deepEqual(rapport.ingevuld.sort(), ['kop', 'linkedin']);
});

test('contactvelden (placeholders) worden nooit ingevuld', () => {
  const b = normalize({ info: { phone: '06-xxxxxxxx', whatsapp: '06-xxxxxxxx', email: 'jouw-mail@voorbeeld.nl', kvk: '00000000', tagline: 'x' } });
  const l = normalize({ info: { phone: '06-11111111', whatsapp: '', email: '', kvk: '', tagline: '' } });
  const r = mergeDefaults(l, b);
  assert.equal(r.doc.info.whatsapp, '');
  assert.equal(r.doc.info.email, '');
  assert.equal(r.doc.info.kvk, '');
  assert.equal(r.doc.info.phone, '06-11111111');
  assert.deepEqual(r.rapport.ingevuld, ['tagline']);
});

test('bureauMateriaal verandert nooit', () => {
  assert.equal(doc.info.bureauMateriaal, false);
  const { doc: doc2 } = mergeDefaults(normalize({ info: { bureauMateriaal: true } }), normalize({ info: { bureauMateriaal: false } }));
  assert.equal(doc2.info.bureauMateriaal, true);
});

test('nogmaals samenvoegen levert niets nieuws op', () => {
  const tweede = mergeDefaults(doc, bundled);
  assert.equal(tweede.rapport.toegevoegd.length, 0);
  assert.equal(tweede.rapport.ingevuld.length, 0);
  assert.equal(JSON.stringify(tweede.doc), JSON.stringify(doc));
});

test('positie: nieuw item komt na zijn buurman uit bundled', () => {
  const b = normalize({ opties: [{ id: 'a', naam: 'A' }, { id: 'b', naam: 'B' }, { id: 'c', naam: 'C' }] });
  const l = normalize({ opties: [{ id: 'c', naam: 'C' }, { id: 'a', naam: 'A' }] });
  assert.deepEqual(mergeDefaults(l, b).doc.opties.map((o) => o.id), ['c', 'a', 'b']);
});

console.log(`\n${n} tests geslaagd`);
