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
      regio: str(info.regio, 'Rotterdam & Zuid-Holland'),
      straalKm: int(info.straalKm, 40),
      verzekerd: !!info.verzekerd,
      verzekerdTekst: str(info.verzekerdTekst),
      // Schakelaar uit §1a: materiaal uit opdrachten via The DJ Company tonen (standaard uit).
      bureauMateriaal: !!info.bureauMateriaal,
      googleReviewUrl: str(info.googleReviewUrl),
      apparatuur: strList(info.apparatuur),
      overTekst: str(info.overTekst),
      werkwijze: arr(info.werkwijze).map((s) => ({ titel: str(s?.titel), tekst: str(s?.tekst) })),
      faq: arr(info.faq).map((f) => ({
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
    zekerheden: strList(doc.zekerheden),
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
      naam: str(typeof l === 'string' ? l : l?.naam),
      plaats: str(l?.plaats),
      herkomst: herkomst(l?.herkomst, ''),
    })).filter((l) => l.naam),
    hero: str(doc.hero),
    portret: str(doc.portret),
    videos: arr(doc.videos).map((v) => ({
      id: ensureId(v?.id, 'v'),
      pad: str(v?.pad),
      poster: str(v?.poster),
      bijschrift: str(v?.bijschrift),
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
  const ok = (pad) => !pad || media.some((m) => m.pad === pad || m.id === pad) || !doc.media.some((m) => m.pad === pad || m.id === pad);
  return {
    ...doc,
    reviews: doc.reviews.filter(toon),
    media,
    locaties: doc.locaties.filter(toon),
    hero: ok(doc.hero) ? doc.hero : '',
    portret: ok(doc.portret) ? doc.portret : '',
  };
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
