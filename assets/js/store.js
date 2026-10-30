/* Het laden van het databestand, voor bezoekers en beheer.
   Volgorde van vertrouwen: demo-data (alleen in de browser die demo aanzette),
   dan de live Gist, met een lokale cache en het meegeleverde data/site.json als
   terugval zodat de pagina altijd iets toont, ook offline. */

import { CONFIG } from './config.js';
import { readGist, readGistRaw } from './gist.js';

const KEYS = {
  cache: 'djr.cache',
  demo: 'djr.demo',
  gistId: 'djr.gistId',
};

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* privémodus: prima, alleen dit bezoek */ }
}

/** De Gist waar de site uit leest: die in config.js, of die het beheer op dit apparaat koppelde. */
export function activeGistId() {
  return CONFIG.gistId || storageGet(KEYS.gistId, '') || '';
}

export function setLocalGistId(id) { storageSet(KEYS.gistId, id || null); }

export function demoDoc() { return storageGet(KEYS.demo); }
export function setDemoDoc(doc) { storageSet(KEYS.demo, doc); }

export function cacheDoc(doc, updatedAt) { storageSet(KEYS.cache, { doc, updatedAt, gistId: activeGistId() }); }

export async function bundledDoc() {
  const res = await fetch(new URL('../../data/site.json', import.meta.url), { cache: 'no-cache' });
  return normalize(await res.json());
}

/**
 * Roept `render(doc, meta)` aan zodra er iets beschikbaar is, en nog eens als
 * er versere data binnenkomt. Bezoekers wachten nooit op GitHub.
 */
export async function loadForVisitors(render) {
  const demo = demoDoc();
  if (demo) {
    render(normalize(demo), { source: 'demo' });
    return;
  }

  const gistId = activeGistId();
  const cached = storageGet(KEYS.cache);
  const cachedValid = cached?.doc && cached.gistId === gistId;
  let shown = false;
  if (cachedValid) {
    render(normalize(cached.doc), { source: 'cache' });
    shown = true;
  }

  if (gistId) {
    try {
      const { doc, updatedAt } = await readGist(gistId, CONFIG.gistFile);
      if (!cachedValid || cached.updatedAt !== updatedAt) {
        cacheDoc(doc, updatedAt);
        render(normalize(doc), { source: 'gist' });
      }
      return;
    } catch (err) {
      console.warn('Live data (API) niet beschikbaar:', err.message);
    }
    if (CONFIG.gistOwner && gistId === CONFIG.gistId) {
      try {
        const { doc } = await readGistRaw(CONFIG.gistOwner, gistId, CONFIG.gistFile);
        if (!cachedValid || JSON.stringify(doc) !== JSON.stringify(cached.doc)) {
          cacheDoc(doc, cached?.updatedAt ?? null);
          render(normalize(doc), { source: 'gist-raw' });
        }
        return;
      } catch (err) {
        console.warn('Live data (CDN) niet beschikbaar, terugval:', err.message);
      }
    }
    if (shown) return;
  }

  if (!shown) render(await bundledDoc(), { source: 'bundled' });
}

/* ------------------------------------------------------------- het model */

export const REVIEW_TYPES = ['Bruiloft', 'Verjaardag', 'Zakelijk event', 'Feest'];
export const MEDIA_CATEGORIES = ['Bruiloft', 'Verjaardag', 'Zakelijk', 'Feest', 'Setup'];
export const FAQ_TYPES = ['Algemeen', 'Bruiloft', 'Verjaardag', 'Zakelijk'];

const str = (v, d = '') => (typeof v === 'string' ? v : v === null || v === undefined ? d : String(v));
const num = (v, d = null) => {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(typeof v === 'string' ? v.replace(',', '.') : v);
  return Number.isFinite(n) ? n : d;
};
const int = (v, d = 0) => Math.round(num(v, d) ?? d);
const arr = (v) => (Array.isArray(v) ? v : []);
const strList = (v) => arr(v).map((x) => str(x)).filter(Boolean);
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : '');
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
export const HERKOMST = ['eigen', 'bureau'];
export const BUREAU_BRON = 'The DJ Company';
/** Herkomst-veld (§1a): expliciet, anders "bureau" bij bron The DJ Company, anders "eigen". */
const herkomst = (v, bron) => (HERKOMST.includes(v) ? v : bron === BUREAU_BRON ? 'bureau' : 'eigen');
let counter = 0;
const ensureId = (v, prefix) => (v === 0 || v ? String(v) : `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`);

/** Stabiele id uit een tekst (zelfde algoritme als in de Python-generator): "faq-kun-je-ook-karaoke-doen". */
export function slug(text, prefix = '') {
  const base = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
  return `${prefix}${base || 'item'}`;
}
/** Tekstregel met id: accepteert een platte string (migratie) of {id, tekst}. */
const tekstItem = (v, prefix) => {
  const tekst = typeof v === 'string' ? v : str(v?.tekst);
  const id = typeof v === 'string' ? '' : str(v?.id);
  return { id: id || slug(tekst, prefix), tekst };
};

/** Cijfer 1–10, één decimaal. */
export const cijfer = (v) => {
  const n = num(v, null);
  if (n === null) return null;
  return Math.round(Math.min(10, Math.max(1, n)) * 10) / 10;
};

/** Vult alles aan met standaardwaarden, zodat de renderers nooit hoeven te guarden. */
export function normalize(input) {
  const doc = input && typeof input === 'object' ? input : {};
  const info = doc.info || {};
  const kg = info.kengetallen || {};
  return {
    version: 1,
    info: {
      name: str(info.name, 'DJ Roggy') || 'DJ Roggy',
      tagline: str(info.tagline),
      kop: str(info.kop),
      intro: str(info.intro),
      announcement: str(info.announcement),
      phone: str(info.phone),
      whatsapp: str(info.whatsapp),
      email: str(info.email),
      kvk: str(info.kvk),
      btw: str(info.btw),
      address: str(info.address),
      instagram: str(info.instagram),
      facebook: str(info.facebook),
      tiktok: str(info.tiktok),
      linkedin: str(info.linkedin),
      regio: str(info.regio, 'Rotterdam & Zuid-Holland'),
      straalKm: int(info.straalKm, 40),
      verzekerd: !!info.verzekerd,
      verzekerdTekst: str(info.verzekerdTekst),
      // Schakelaar uit §1a: materiaal uit opdrachten via The DJ Company tonen (standaard uit).
      bureauMateriaal: !!info.bureauMateriaal,
      googleReviewUrl: str(info.googleReviewUrl),
      apparatuur: arr(info.apparatuur).map((a) => tekstItem(a, 'app-')).filter((a) => a.tekst),
      overTekst: str(info.overTekst),
      werkwijze: arr(info.werkwijze).map((s) => ({ id: str(s?.id) || slug(s?.titel, 'ww-'), titel: str(s?.titel), tekst: str(s?.tekst) })),
      faq: arr(info.faq).map((f) => ({
        id: str(f?.id) || slug(f?.vraag, 'faq-'),
        type: oneOf(str(f?.type), FAQ_TYPES, 'Algemeen'),
        vraag: str(f?.vraag),
        antwoord: str(f?.antwoord),
      })),
      kengetallen: {
        auto: kg.auto === undefined ? true : !!kg.auto,
        feesten: int(kg.feesten, 0),
        gasten: int(kg.gasten, 0),
        uren: int(kg.uren, 0),
        locaties: int(kg.locaties, 0),
      },
      media: { gistId: str(info.media?.gistId), owner: str(info.media?.owner) },
    },
    pakketten: arr(doc.pakketten).map((p) => ({
      id: ensureId(p?.id, 'pak'),
      naam: str(p?.naam),
      prijs: num(p?.prijs, null),
      vanaf: !!p?.vanaf,
      populair: !!p?.populair,
      inhoud: strList(p?.inhoud),
      hidden: !!p?.hidden,
    })),
    opties: arr(doc.opties).map((o) => ({
      id: ensureId(o?.id, 'opt'),
      naam: str(o?.naam),
      prijs: num(o?.prijs, null),
      eenheid: str(o?.eenheid),
      tekst: str(o?.tekst),
      hidden: !!o?.hidden,
    })),
    zekerheden: arr(doc.zekerheden).map((z) => tekstItem(z, 'zek-')).filter((z) => z.tekst),
    agenda: arr(doc.agenda)
      .map((a) => ({ datum: isoDate(a?.datum), label: str(a?.label, 'Bezet') || 'Bezet' }))
      .filter((a) => a.datum)
      .sort((a, b) => a.datum.localeCompare(b.datum)),
    media: arr(doc.media).map((m) => ({
      id: ensureId(m?.id, 'm'),
      bron: m?.bron === 'gist' ? 'gist' : 'repo',
      pad: str(m?.pad),
      thumb: str(m?.thumb),
      shortcode: str(m?.shortcode),
      soort: m?.soort === 'reel' ? 'reel' : 'post',
      bijschrift: str(m?.bijschrift),
      categorie: oneOf(str(m?.categorie), MEDIA_CATEGORIES, 'Feest'),
      herkomst: herkomst(m?.herkomst, ''),
      home: !!m?.home,
      hidden: !!m?.hidden,
    })),
    locaties: arr(doc.locaties).map((l) => ({
      id: str(l?.id) || slug(`${str(typeof l === 'string' ? l : l?.naam)} ${str(l?.plaats)}`, 'loc-'),
      naam: str(typeof l === 'string' ? l : l?.naam),
      plaats: str(l?.plaats),
      herkomst: herkomst(l?.herkomst, ''),
    })).filter((l) => l.naam),
    // Ids die de beheerder bewust verwijderde: mergeDefaults zet ze niet terug.
    verwijderdeIds: [...new Set(strList(doc.verwijderdeIds))],
    hero: str(doc.hero),
    portret: str(doc.portret),
    videos: arr(doc.videos).map((v) => ({
      id: ensureId(v?.id, 'v'),
      pad: str(v?.pad),
      poster: str(v?.poster),
      bijschrift: str(v?.bijschrift),
      hero: !!v?.hero,
      hidden: !!v?.hidden,
    })),
    reviews: arr(doc.reviews).map((r) => ({
      id: ensureId(r?.id, 'r'),
      naam: str(r?.naam),
      datum: isoDate(r?.datum),
      cijfer: cijfer(r?.cijfer),
      titel: str(r?.titel),
      tekst: str(r?.tekst),
      plaats: str(r?.plaats),
      locatie: str(r?.locatie),
      type: oneOf(str(r?.type), REVIEW_TYPES, 'Feest'),
      bron: str(r?.bron, 'Direct') || 'Direct',
      herkomst: herkomst(r?.herkomst, str(r?.bron)),
      uitgelicht: !!r?.uitgelicht,
      hidden: !!r?.hidden,
    })),
  };
}

/* -------------------------------------------- standaardteksten samenvoegen */

/** Lijsten met id-items die mergeDefaults bijhoudt: pad in het document en hoe een item heet in het rapport. */
export const MERGE_LISTS = [
  { lijst: 'pakketten', pad: ['pakketten'], label: (x) => x.naam },
  { lijst: 'opties', pad: ['opties'], label: (x) => x.naam },
  { lijst: 'zekerheden', pad: ['zekerheden'], label: (x) => x.tekst },
  { lijst: 'faq', pad: ['info', 'faq'], label: (x) => x.vraag },
  { lijst: 'werkwijze', pad: ['info', 'werkwijze'], label: (x) => x.titel },
  { lijst: 'apparatuur', pad: ['info', 'apparatuur'], label: (x) => x.tekst },
  { lijst: 'media', pad: ['media'], label: (x) => x.bijschrift || x.pad },
  { lijst: 'locaties', pad: ['locaties'], label: (x) => x.naam },
  { lijst: 'reviews', pad: ['reviews'], label: (x) => x.naam },
];
const getPath = (obj, pad) => pad.reduce((o, k) => (o ? o[k] : undefined), obj);
const setPath = (obj, pad, value) => { const parent = pad.slice(0, -1).reduce((o, k) => o[k], obj); parent[pad[pad.length - 1]] = value; };
const leeg = (v) => v === '' || v === null || v === undefined;
/** Info-velden die mergeDefaults nooit invult: de schakelaar, en contactgegevens die in de standaarddata placeholders zijn. */
export const MERGE_SKIP_FIELDS = ['bureauMateriaal', 'phone', 'whatsapp', 'email', 'kvk', 'btw', 'address'];

/**
 * Voegt nieuwe standaardteksten uit het gebundelde data/site.json toe aan een
 * (genormaliseerd) document zonder de invullingen van de beheerder te overschrijven.
 * - Lijstitems: alleen ids die ontbreken worden toegevoegd (op de plek van bundled als
 *   de buurman ervoor bestaat, anders achteraan); bestaande items blijven ongewijzigd;
 *   ids in doc.verwijderdeIds komen niet terug.
 * - info-velden: alleen lege velden worden gevuld; bureauMateriaal blijft altijd zoals in doc en
 *   contactgegevens (placeholders in de standaarddata) worden nooit ingevuld.
 * Puur: geeft een nieuw document en een rapport terug.
 */
export function mergeDefaults(doc, bundled) {
  const out = JSON.parse(JSON.stringify(doc));
  const rapport = { toegevoegd: [], ingevuld: [], overgeslagen: [] };
  const verwijderd = new Set(out.verwijderdeIds || []);

  for (const { lijst, pad, label } of MERGE_LISTS) {
    const huidig = [...(getPath(out, pad) || [])];
    const standaard = getPath(bundled, pad) || [];
    const ids = () => new Set(huidig.map((x) => String(x.id)));
    standaard.forEach((item, i) => {
      const id = String(item.id);
      if (ids().has(id)) return;
      if (verwijderd.has(id)) { rapport.overgeslagen.push(id); return; }
      const kopie = JSON.parse(JSON.stringify(item));
      const buurman = i > 0 ? String(standaard[i - 1].id) : null;
      const plek = buurman ? huidig.findIndex((x) => String(x.id) === buurman) : -1;
      if (plek >= 0) huidig.splice(plek + 1, 0, kopie); else huidig.push(kopie);
      rapport.toegevoegd.push({ lijst, id, label: label(item) });
    });
    setPath(out, pad, huidig);
  }

  for (const [key, value] of Object.entries(bundled.info || {})) {
    if (MERGE_SKIP_FIELDS.includes(key) || Array.isArray(value) || (value && typeof value === 'object')) continue;
    if (leeg(out.info[key]) && !leeg(value)) { out.info[key] = value; rapport.ingevuld.push(key); }
  }
  out.info.bureauMateriaal = !!doc.info.bureauMateriaal;
  return { doc: out, rapport };
}

/* ---------------------------------------------------------- afgeleiden */

/**
 * De enige plek die bepaalt wat de site te zien krijgt (§1a, §4.6): alles met
 * herkomst "bureau" valt weg zolang info.bureauMateriaal uit staat. Hero en
 * portret die naar weggefilterd materiaal wijzen worden leeg, zodat de
 * renderers op de (eigen) standaard terugvallen. Alle renderers werken op het
 * resultaat van deze functie, nooit op het ruwe document.
 */
export function filter(doc) {
  const toon = (x) => x.herkomst === 'eigen' || doc.info.bureauMateriaal;
  const media = doc.media.filter(toon);
  return {
    ...doc,
    reviews: doc.reviews.filter(toon),
    media,
    locaties: doc.locaties.filter(toon),
    hero: zichtbareKeuze(doc, media, doc.hero),
    portret: zichtbareKeuze(doc, media, doc.portret),
  };
}

const mediaRef = (m) => (m.bron === 'gist' ? m.id : m.pad);
const vindMedia = (list, ref) => list.find((m) => m.pad === ref || m.id === ref);

/**
 * Hero/portret zoals de site hem mag tonen: de gekozen foto als die door de filter
 * komt (of geen galerij-item is), anders de eerste eigen foto met "op homepage",
 * anders de eerste zichtbare eigen foto, anders leeg (de HTML-standaard blijft dan staan).
 */
function zichtbareKeuze(doc, zichtbaar, ref) {
  if (!ref) return '';
  if (vindMedia(zichtbaar, ref) || !vindMedia(doc.media, ref)) return ref;
  const terugval = zichtbaar.find((m) => m.home && !m.hidden) || zichtbaar.find((m) => !m.hidden);
  return terugval ? mediaRef(terugval) : '';
}

/** Welke hero/portret-keuze nu verborgen is door de schakelaar (voor de waarschuwing in beheer). */
export function verborgenKeuzes(doc) {
  const out = [];
  if (doc.info.bureauMateriaal) return out;
  for (const [veld, ref] of [['hero', doc.hero], ['portret', doc.portret]]) {
    const item = vindMedia(doc.media, ref);
    if (item && item.herkomst === 'bureau') out.push({ veld, item, terugval: vindMedia(doc.media, zichtbareKeuze(doc, doc.media.filter((m) => m.herkomst === 'eigen'), ref)) || null });
  }
  return out;
}

/** Hoeveel bureau-items er verborgen zijn (voor de gele balk in beheer). */
export function verborgenBureau(doc) {
  if (doc.info.bureauMateriaal) return { reviews: 0, media: 0, locaties: 0 };
  const n = (list) => list.filter((x) => x.herkomst === 'bureau').length;
  return { reviews: n(doc.reviews), media: n(doc.media), locaties: n(doc.locaties) };
}

/** Zichtbare reviews, nieuwste eerst. */
export function visibleReviews(doc) {
  return doc.reviews.filter((r) => !r.hidden && r.cijfer !== null).sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Gemiddelde (1 decimaal) en aantal over de zichtbare reviews. */
export function reviewStats(doc, type = '') {
  const list = visibleReviews(doc).filter((r) => !type || r.type === type);
  const n = list.length;
  const sum = list.reduce((s, r) => s + r.cijfer, 0);
  const avg = n ? Math.round((sum / n) * 10) / 10 : 0;
  const verdeling = {};
  for (const r of list) {
    const k = String(Math.max(1, Math.min(10, Math.floor(r.cijfer))));
    verdeling[k] = (verdeling[k] || 0) + 1;
  }
  return { n, avg, verdeling };
}

/**
 * Kengetallen zoals de site ze toont. Met `auto` aan worden cijfer, aantal
 * reviews en het aantal locaties uit de reviews afgeleid; feesten, gasten en
 * uren komen uit Info (daar zegt een review weinig over). Staat feesten op 0,
 * dan geldt het aantal reviews.
 */
export function kengetallen(doc) {
  const kg = doc.info.kengetallen;
  const { n, avg } = reviewStats(doc);
  const out = { cijfer: avg, reviews: n, feesten: kg.feesten, gasten: kg.gasten, uren: kg.uren, locaties: kg.locaties };
  if (kg.auto) {
    const uniek = new Set(visibleReviews(doc).map((r) => r.locatie.trim().toLowerCase()).filter((l) => l && l !== 'privé locatie'));
    out.locaties = Math.max(kg.locaties, uniek.size);
    if (!kg.feesten) out.feesten = n;
  }
  return out;
}

/** Uitgelichte reviews voor de homepage, nieuwste eerst. */
export function featuredReviews(doc, max = 8) {
  const list = visibleReviews(doc).filter((r) => r.uitgelicht);
  return (list.length ? list : visibleReviews(doc).filter((r) => r.cijfer >= 9.5)).slice(0, max);
}

/** Zichtbare galerijfoto's in volgorde. */
export function visibleMedia(doc) { return doc.media.filter((m) => (m.pad || m.bron === 'gist') && !m.hidden); }

/** Zichtbare locaties ("Locaties waar ik draaide"). */
export function visibleLocaties(doc) { return doc.locaties; }

/** Laagste zichtbare pakketprijs ("Vanaf € …"). */
export function vanafPrijs(doc) {
  const prijzen = doc.pakketten.filter((p) => !p.hidden && p.prijs !== null).map((p) => p.prijs);
  return prijzen.length ? Math.min(...prijzen) : null;
}

/** Vandaag als YYYY-MM-DD in de tijdzone van de bezoeker. */
export function todayIso(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Agenda-item voor een datum, of null als die (nog) vrij is. */
export function agendaOp(doc, datum) {
  return doc.agenda.find((a) => a.datum === datum) || null;
}

/** Datum als "zaterdag 10 juli 2026". */
export function formatDatum(iso, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!isoDate(iso)) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', opts);
}

/** Cijfer als "9,3". */
export const formatCijfer = (n) => (n === null || n === undefined ? '' : String(Math.round(n * 10) / 10).replace('.', ','));

/** Groot getal als "5.600". */
export const formatAantal = (n) => Number(n || 0).toLocaleString('nl-NL');
