/* Tests voor filter() en de terugval van hero/portret. Draaien met: node tests/filter.test.js */
import assert from 'node:assert/strict';
import { normalize, filter, verborgenKeuzes } from '../assets/js/store.js';

const basis = {
  media: [
    { id: 'm-bureau', bron: 'repo', pad: 'b.jpg', bijschrift: 'Bureau-foto', herkomst: 'bureau', home: true },
    { id: 'm-eigen-1', bron: 'repo', pad: 'e1.jpg', bijschrift: 'Eigen zonder home', herkomst: 'eigen', home: false },
    { id: 'm-eigen-2', bron: 'repo', pad: 'e2.jpg', bijschrift: 'Eigen met home', herkomst: 'eigen', home: true },
    { id: 'm-gist', bron: 'gist', pad: '', bijschrift: 'Geüpload', herkomst: 'eigen', home: true },
  ],
  hero: 'b.jpg', portret: 'b.jpg',
};
let n = 0;
const test = (naam, fn) => { fn(); n++; console.log('✓', naam); };

test('schakelaar aan: bureau-foto mag hero en portret zijn', () => {
  const v = filter(normalize({ ...basis, info: { bureauMateriaal: true } }));
  assert.equal(v.hero, 'b.jpg');
  assert.equal(v.portret, 'b.jpg');
  assert.equal(verborgenKeuzes(normalize({ ...basis, info: { bureauMateriaal: true } })).length, 0);
});

test('schakelaar uit: terugval op de eerste eigen foto met home=true', () => {
  const doc = normalize({ ...basis, info: { bureauMateriaal: false } });
  const v = filter(doc);
  assert.equal(v.hero, 'e2.jpg');
  assert.equal(v.portret, 'e2.jpg');
  const w = verborgenKeuzes(doc);
  assert.deepEqual(w.map((x) => [x.veld, x.item.id, x.terugval.id]), [['hero', 'm-bureau', 'm-eigen-2'], ['portret', 'm-bureau', 'm-eigen-2']]);
});

test('geen eigen foto met home: eerste zichtbare eigen foto; niets eigen: leeg', () => {
  const doc = normalize({ ...basis, media: basis.media.map((m) => ({ ...m, home: false })), info: { bureauMateriaal: false } });
  assert.equal(filter(doc).hero, 'e1.jpg');
  const leeg = normalize({ ...basis, media: [basis.media[0]], info: { bureauMateriaal: false } });
  assert.equal(filter(leeg).hero, '');
});

test('geüploade foto (gist) als hero wordt op id herkend', () => {
  const doc = normalize({ ...basis, hero: 'm-gist', info: { bureauMateriaal: false } });
  assert.equal(filter(doc).hero, 'm-gist');
});

test('hero die geen galerij-item is, blijft staan', () => {
  const doc = normalize({ ...basis, hero: 'assets/img/los.jpg', info: { bureauMateriaal: false } });
  assert.equal(filter(doc).hero, 'assets/img/los.jpg');
});

console.log(`\n${n} tests geslaagd`);
