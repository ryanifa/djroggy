/* De website opbouwen uit het databestand. Elke pagina bevat al de opstartversie
   (zonder bureau-materiaal, §1a); dit script vervangt die zodra de data uit de
   cache, de Gist of data/site.json binnen is. Alle renderers werken op
   filter(doc) uit store.js, nooit op het ruwe document. Alles via textContent. */

import { CONFIG } from './config.js';
import { el, $, $$, clear, formatPrice, telLink, whatsappLink } from './dom.js';
import {
  loadForVisitors, filter, kengetallen, reviewStats, featuredReviews, visibleReviews, visibleMedia, visibleLocaties,
  vanafPrijs, agendaOp, formatDatum, formatCijfer, formatAantal, todayIso, BUREAU_BRON,
} from './store.js';
import { mediaUrl } from './media.js';

const page = document.body.dataset.page || 'home';

const isRealPhone = (p) => /\d{9,}/.test(String(p || '').replace(/\D/g, '')) && !/x/i.test(p);
const isRealEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '') && !/voorbeeld\.nl$/i.test(e);
const isUrl = (u) => /^https?:\/\//i.test(u || '');

function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `31${d.slice(1)}`;
  return d;
}

const stars = (n) => '★'.repeat(Math.max(1, Math.min(5, Math.round((n || 0) / 2))));
const maandJaar = (iso) => formatDatum(iso, { month: 'long', year: 'numeric' });
const euro = (n) => formatPrice(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* --------------------------------------------------------------- render */

function render(raw, meta) {
  const doc = filter(raw); // de enige weg: alles hieronder ziet alleen wat getoond mag worden
  const info = doc.info;
  $('#demo-banner') && ($('#demo-banner').hidden = meta.source !== 'demo');
  const ann = $('#announcement');
  if (ann) { ann.textContent = info.announcement; ann.hidden = !info.announcement; }
  $('#jaar') && ($('#jaar').textContent = String(new Date().getFullYear()));

  const kg = kengetallen(doc);
  const values = {
    phone: info.phone, whatsapp: info.whatsapp || info.phone, email: info.email, kvk: info.kvk, btw: info.btw,
    straalKm: String(info.straalKm), verzekerdTekst: info.verzekerdTekst,
    cijfer: formatCijfer(kg.cijfer), reviews: String(kg.reviews), feesten: formatAantal(kg.feesten),
    gasten: formatAantal(kg.gasten), uren: formatAantal(kg.uren), locaties: String(kg.locaties),
  };
  for (const node of $$('[data-k]')) {
    const v = values[node.dataset.k];
    if (v !== undefined && v !== '') node.textContent = v;
  }
  const tagline = $('#footer-tagline');
  if (tagline && info.tagline) tagline.textContent = info.tagline;

  renderTrustbar(doc);
  renderGoogle(doc);
  renderContactLinks(doc);
  renderSocial(doc);
  renderLocaties(doc);
  setupDateCheck(doc);
  if (page === 'home') renderHome(doc, meta);
  if (['bruiloft', 'verjaardag', 'bedrijfsfeest'].includes(page)) renderLanding(doc);
  if (page === 'werkwijze') renderWerkwijze(doc);
  if (page === 'reviews') renderReviews(doc);
  if (page === 'foto-video') renderGallery(doc, meta);
  if (page === 'prijzen') renderPrijzen(doc);
  if (page === 'over') renderOver(doc, meta);
  if (page === 'contact') renderContact(doc);
  if (page !== 'reviews') renderFaq(doc);
  setupReadMore();
}

/** Trustbar: cijfer en aantal reviews alleen als er reviews door de filter komen; anders ervaring. */
function renderTrustbar(doc) {
  const { n } = reviewStats(doc);
  for (const li of $$('[data-stat-item="cijfer"], [data-stat-item="reviews"]')) li.hidden = n === 0;
  for (const li of $$('[data-stat-item="uren"], [data-stat-item="locaties"]')) li.hidden = n > 0 && li.closest('#trustbar') && page === 'home';
}

/** Google-reviewknoppen: alleen als er een URL is. */
function renderGoogle(doc) {
  const url = doc.info.googleReviewUrl;
  for (const box of $$('#google-reviews')) {
    box.hidden = !isUrl(url);
    if (!isUrl(url)) continue;
    const lees = $('#google-lees', box);
    const schrijf = $('#google-schrijf', box);
    if (lees) lees.href = url;
    if (schrijf) schrijf.href = url;
  }
}

function renderContactLinks(doc) {
  const { phone, whatsapp, email } = doc.info;
  const wa = whatsapp || phone;
  const waText = 'Hoi Roggy, ik wil graag de beschikbaarheid checken voor ';
  const set = (sel, ok, href) => {
    for (const a of $$(sel)) {
      a.href = ok ? href : 'contact.html#aanvraag';
      if (!ok) a.title = 'Nummer volgt; gebruik het formulier';
    }
  };
  set('#sticky-wa, #btn-wa', isRealPhone(wa), whatsappLink(waNumber(wa), waText));
  set('#btn-tel', isRealPhone(phone), telLink(phone));
  set('#btn-mail', isRealEmail(email), `mailto:${email}?subject=${encodeURIComponent('Aanvraag DJ Roggy')}`);
  const note = $('#placeholder-note');
  if (note) note.hidden = isRealPhone(wa) && isRealEmail(email);
}

function renderSocial(doc) {
  const box = $('#footer-social');
  if (!box) return;
  const { instagram, facebook, tiktok, linkedin } = doc.info;
  const links = [
    instagram && ['Instagram', `https://www.instagram.com/${encodeURIComponent(instagram.replace(/^@/, ''))}`],
    facebook && ['Facebook', `https://www.facebook.com/${encodeURIComponent(facebook)}`],
    linkedin && ['LinkedIn', /^https?:\/\//.test(linkedin) ? linkedin : `https://www.linkedin.com/in/${encodeURIComponent(linkedin.replace(/^\/?in\//, ''))}/`],
    tiktok && ['TikTok', `https://www.tiktok.com/@${encodeURIComponent(tiktok.replace(/^@/, ''))}`],
  ].filter(Boolean);
  if (!links.length) return;
  clear(box).append(...links.map(([name, href]) => el('li', {}, el('a', { href, rel: 'noopener', target: '_blank', text: name }))));
}

/** "Locaties waar ik draaide": uitsluitend wat door filter(doc) komt. */
function renderLocaties(doc) {
  const box = $('#locaties');
  if (!box) return;
  clear(box).append(...visibleLocaties(doc).map((l) => el('li', { text: l.plaats ? `${l.naam} · ${l.plaats}` : l.naam })));
}

function setupDateCheck(doc) {
  const input = $('#datum-home');
  const out = $('#availability');
  if (!input || !out) return;
  input.min = todayIso();
  input.onchange = () => {
    out.className = 'availability';
    out.textContent = '';
    if (!input.value) return;
    const bezet = agendaOp(doc, input.value);
    if (bezet) { out.classList.add('busy'); out.textContent = `${formatDatum(input.value)}: helaas, die datum is al ${bezet.label.toLowerCase()}. Kies een andere datum of vraag toch aan.`; }
    else { out.classList.add('free'); out.textContent = `${formatDatum(input.value)}: nog vrij. Vraag hem snel aan!`; }
  };
}

function setupReadMore() {
  for (const p of $$('.review p')) {
    const btn = p.nextElementSibling?.classList.contains('toggle') ? p.nextElementSibling : null;
    if (!btn) continue;
    btn.hidden = !(p.scrollHeight > p.clientHeight + 2) && !p.classList.contains('open');
    btn.onclick = () => {
      const open = p.classList.toggle('open');
      btn.textContent = open ? 'Minder' : 'Lees meer';
    };
  }
}

/** Reviewkaart (§4.6): originele tekst, plaats · locatie, en bij bureau-reviews de bronregel. */
function reviewCard(r) {
  const where = [r.plaats, r.locatie].filter((x) => x && x !== '—' && x !== 'Privé locatie').join(' · ');
  const text = el('p', { text: r.tekst });
  const toggle = r.tekst ? el('button', { type: 'button', class: 'toggle', text: 'Lees meer', hidden: true }) : null;
  return el('article', { class: `card review${r.tekst ? '' : ' compact'}`, dataset: { type: r.type, datum: r.datum, cijfer: String(r.cijfer) } }, [
    el('div', { class: 'review-top' }, [
      el('div', { class: 'avatar', 'aria-hidden': 'true', text: (r.naam[0] || '?').toUpperCase() }),
      el('div', { class: 'review-who' }, [el('strong', { text: r.naam }), el('span', { text: [r.type, where, maandJaar(r.datum)].filter(Boolean).join(' · ') })]),
      el('div', { class: 'review-score' }, [el('span', { class: 'score', text: formatCijfer(r.cijfer) }), el('span', { class: 'stars', 'aria-hidden': 'true', text: stars(r.cijfer) })]),
    ]),
    r.titel ? el('h3', { text: r.titel }) : null,
    r.tekst ? text : null,
    toggle,
    r.herkomst === 'bureau' ? el('div', { class: 'bron', text: `via ${r.bron}` }) : null,
  ]);
}

/** Vult een reviewblok (home/landingspagina's/laag 1): lijst, statistiek, lege staat. */
function fillReviewBlock(list, { listBox, statsBox, emptyBox }) {
  const n = list.length;
  if (listBox) { clear(listBox).append(...list.map(reviewCard)); listBox.hidden = n === 0; }
  if (emptyBox) emptyBox.hidden = n > 0;
  if (statsBox) {
    statsBox.hidden = n === 0;
    const avg = n ? Math.round((list.reduce((s, r) => s + r.cijfer, 0) / n) * 10) / 10 : 0;
    for (const node of $$('[data-stat="avg"]', statsBox)) node.textContent = formatCijfer(avg);
    for (const node of $$('[data-stat="n"]', statsBox)) node.textContent = String(n);
  }
}

function faqItem(f) {
  return el('details', { class: 'faq' }, [el('summary', { text: f.vraag }), el('p', { text: f.antwoord })]);
}

const FAQ_FOR = { bruiloft: ['Bruiloft', 'Algemeen'], verjaardag: ['Verjaardag', 'Algemeen'], bedrijfsfeest: ['Zakelijk', 'Algemeen'], werkwijze: ['Algemeen'], prijzen: ['Algemeen'] };
function renderFaq(doc) {
  const box = $('#faq');
  const types = FAQ_FOR[page];
  if (!box || !types) return;
  const items = doc.info.faq.filter((f) => types.includes(f.type) && f.vraag);
  if (items.length) clear(box).append(...items.map(faqItem));
}

/* ----------------------------------------------------------------- home */

/** Kop met *amber* delen: tekst tussen sterretjes wordt gekleurd. Alles via textContent. */
function renderKop(node, text) {
  const parts = text.split('*');
  clear(node).append(...parts.map((part, i) => (i % 2 ? el('em', { text: part }) : part)));
}

function renderHome(doc, meta) {
  const info = doc.info;
  if (info.kop) renderKop($('#hero-title'), info.kop);
  if (info.intro) $('#hero-intro').textContent = info.intro;

  const heroVideo = doc.videos.find((v) => v.hero && !v.hidden && v.pad);
  if (heroVideo && $('#hero-media') && !$('#hero-media video') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const video = el('video', { autoplay: true, muted: true, loop: true, playsinline: true, preload: 'metadata', poster: heroVideo.poster || doc.hero || '', 'aria-hidden': 'true' },
      el('source', { src: heroVideo.pad, type: heroVideo.pad.endsWith('.webm') ? 'video/webm' : 'video/mp4' }));
    video.muted = true;
    video.addEventListener('canplay', () => { $('#hero-media picture')?.remove(); }, { once: true });
    video.addEventListener('error', () => video.remove(), { once: true });
    $('#hero-media').append(video);
  }
  const heroImg = $('#hero-media img');
  if (heroImg && doc.hero && !heroImg.getAttribute('src').endsWith(doc.hero)) {
    for (const source of $$('#hero-media source')) source.remove();
    const item = doc.media.find((m) => m.pad === doc.hero || m.id === doc.hero);
    mediaUrl(item || { bron: 'repo', pad: doc.hero }, doc, { demo: meta.source === 'demo' }).then((url) => { if (url) heroImg.src = url; });
    heroImg.removeAttribute('width'); heroImg.removeAttribute('height');
  }

  // Carrousel alleen met reviews die door filter(doc) komen; anders ervaring + Google + lege staat.
  const list = featuredReviews(doc, 8);
  const { n } = reviewStats(doc);
  const track = $('#review-carousel');
  clear(track).append(...list.map(reviewCard));
  track.hidden = list.length === 0;
  $('#carousel-nav').hidden = list.length === 0;
  $('#ervaring').hidden = n > 0;
  $('#reviews-leeg').hidden = n > 0;
  fillReviewBlock(visibleReviews(doc), { statsBox: $('#review-stats') });
  const src = $('#review-source');
  const bureau = list.some((r) => r.herkomst === 'bureau');
  src.hidden = !bureau;
  if (bureau) clear(src).append(`Reviews uit 2021–2026 van feesten via ${BUREAU_BRON}, ongewijzigd overgenomen. `, el('a', { href: 'reviews.html', text: 'Lees alle reviews →' }));

  const media = visibleMedia(doc);
  const tiles = (media.filter((m) => m.home).length ? media.filter((m) => m.home) : media).slice(0, 6);
  if (tiles.length) {
    clear($('#strip')).append(...tiles.map((m) => {
      const img = el('img', { alt: '', loading: 'lazy', decoding: 'async' });
      mediaUrl(m, doc, { demo: meta.source === 'demo' }).then((url) => { if (url) img.src = m.thumb && m.bron === 'repo' ? m.thumb : url; });
      return el('a', { href: 'foto-video.html' }, [img, m.bijschrift ? el('span', { class: 'cap', text: m.bijschrift }) : null]);
    }));
  }

  if (info.werkwijze.length) {
    clear($('#steps')).append(...info.werkwijze.slice(0, 4).map((s) => el('li', { class: 'step' }, [el('h3', { text: s.titel }), el('p', { text: s.tekst })])));
  }
  const vanaf = vanafPrijs(doc);
  if (vanaf !== null) $('#vanaf').textContent = euro(vanaf);
  if (doc.zekerheden.length) clear($('#zekerheden')).append(...doc.zekerheden.map((z) => el('li', { text: z })));
}

function setupCarousel() {
  const track = $('#review-carousel');
  if (!track) return;
  for (const btn of $$('.carousel-nav button')) {
    btn.addEventListener('click', () => {
      const card = track.firstElementChild;
      const step = card ? card.getBoundingClientRect().width + 14 : 320;
      track.scrollBy({ left: Number(btn.dataset.dir) * step * 2, behavior: 'smooth' });
    });
  }
}

/* --------------------------------------------- bruiloft / verjaardag / zakelijk */

function renderLanding(doc) {
  const box = $('#review-list');
  if (!box) return;
  const type = box.dataset.type;
  const max = Number(box.dataset.max) || 6;
  const all = visibleReviews(doc).filter((r) => r.type === type);
  const list = all.filter((r) => r.tekst.length >= 40 || all.length < max)
    .sort((a, b) => Number(b.uitgelicht) - Number(a.uitgelicht) || b.datum.localeCompare(a.datum)).slice(0, max);
  fillReviewBlock(list, { listBox: box, statsBox: $('#review-stats'), emptyBox: $('#reviews-leeg') });
  $('#ervaring').hidden = all.length > 0;
  // Statistiek per type in de trustbar bovenaan
  const n = all.length;
  const avg = n ? Math.round((all.reduce((s, r) => s + r.cijfer, 0) / n) * 10) / 10 : 0;
  for (const node of $$('.trustbar [data-stat="avg"]')) node.textContent = formatCijfer(avg);
  for (const node of $$('.trustbar [data-stat="n"]')) node.textContent = String(n);
  for (const li of $$('.trustbar [data-stat-item]')) li.hidden = n === 0;
}

/* ------------------------------------------------------------- werkwijze */

function renderWerkwijze(doc) {
  const items = $$('#werkwijze-lijst .tl-step');
  doc.info.werkwijze.forEach((s, i) => {
    const li = items[i];
    if (li) { $('h2', li).textContent = s.titel; $('p', li).textContent = s.tekst; }
    else $('#werkwijze-lijst').append(el('li', { class: 'tl-step' }, [el('div', { class: 'tl-num', 'aria-hidden': 'true', text: String(i + 1) }), el('div', {}, [el('h2', { text: s.titel }), el('p', { text: s.tekst })])]));
  });
  items.slice(doc.info.werkwijze.length).forEach((li) => li.remove());
}

/* --------------------------------------------------------------- reviews */

let reviewState = { type: new URLSearchParams(location.search).get('type') || '', sort: 'nieuw' };
function renderReviews(doc) {
  const all = visibleReviews(doc);
  // Laag 1: eigen reviews (altijd)
  const eigen = all.filter((r) => r.herkomst === 'eigen');
  fillReviewBlock(eigen, { listBox: $('#eigen-list'), emptyBox: $('#reviews-leeg') });

  // Laag 2: bureau-reviews, alleen aanwezig als de schakelaar aan staat (filter laat ze dan door)
  const bureau = all.filter((r) => r.herkomst === 'bureau');
  const laag2 = $('#laag2');
  laag2.hidden = bureau.length === 0;
  const kop = $('#reviews-kop');
  const sub = $('#reviews-sub');
  const oldLd = $('#reviews-jsonld');
  if (oldLd) oldLd.remove();
  if (!bureau.length) {
    kop.textContent = 'Wat klanten zeggen';
    return;
  }
  const n = bureau.length;
  const avg = Math.round((bureau.reduce((s, r) => s + r.cijfer, 0) / n) * 10) / 10;
  kop.textContent = `${n} keer eerlijk beoordeeld`;
  sub.textContent = `Alle reviews, ongefilterd, zoals klanten ze achterlieten. Gemiddeld een ${formatCijfer(avg)}.`;
  $('#l2-n').textContent = String(n);
  $('#avg-cijfer').textContent = formatCijfer(avg);
  $('#avg-n').textContent = String(n);
  $('#l2-bron').textContent = `Reviews uit 2021–2026 van feesten via ${BUREAU_BRON}, ongewijzigd overgenomen.`;
  const verdeling = {};
  for (const r of bureau) { const k = Math.max(7, Math.min(10, Math.floor(r.cijfer))); verdeling[k] = (verdeling[k] || 0) + 1; }
  clear($('#histogram')).append(...[10, 9, 8, 7].map((k) => el('li', {}, [
    el('span', { class: 'h-lbl', text: String(k) }),
    el('span', { class: 'h-bar' }, el('span', { style: { width: `${Math.round(((verdeling[k] || 0) / n) * 100)}%` } })),
    el('span', { class: 'h-n', text: String(verdeling[k] || 0) }),
  ])));

  const box = $('#review-list');
  const draw = () => {
    let list = bureau.filter((r) => !reviewState.type || r.type === reviewState.type);
    if (reviewState.sort === 'hoog') list.sort((a, b) => b.cijfer - a.cijfer || b.datum.localeCompare(a.datum));
    else if (reviewState.sort === 'oud') list.sort((a, b) => a.datum.localeCompare(b.datum));
    clear(box).append(...list.map(reviewCard));
    const count = $('#filter-count');
    if (count) count.textContent = reviewState.type ? `${list.length} reviews van het type ${reviewState.type === 'Zakelijk event' ? 'Bedrijfsfeest' : reviewState.type}` : `Alle ${list.length} reviews`;
    for (const chip of $$('#filterbar .chip')) {
      chip.classList.toggle('active', chip.dataset.type === reviewState.type);
      const t = chip.dataset.type;
      const span = $('.muted', chip);
      if (span) span.textContent = `(${bureau.filter((r) => !t || r.type === t).length})`;
    }
    setupReadMore();
  };
  for (const chip of $$('#filterbar .chip')) chip.onclick = () => { reviewState.type = chip.dataset.type; draw(); };
  const sort = $('#sort');
  if (sort) sort.onchange = () => { reviewState.sort = sort.value; draw(); };
  draw();

  // AggregateRating + Review alleen in laag 2 (§4.6)
  const ld = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': `${location.origin}/#dj-roggy`, name: 'DJ Roggy', url: `${location.origin}/`,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: String(avg), bestRating: '10', worstRating: '1', ratingCount: n },
    review: bureau.filter((r) => r.uitgelicht).map((r) => ({
      '@type': 'Review', author: { '@type': 'Person', name: r.naam }, datePublished: r.datum,
      reviewRating: { '@type': 'Rating', ratingValue: r.cijfer, bestRating: 10, worstRating: 1 }, name: r.titel, reviewBody: r.tekst,
    })),
  };
  const script = el('script', { type: 'application/ld+json', id: 'reviews-jsonld' });
  script.textContent = JSON.stringify(ld).replace(/<\//g, '<\\/');
  document.head.append(script);
}

/* --------------------------------------------------------------- galerij */

function renderGallery(doc, meta) {
  const box = $('#gallery');
  if (!box) return;
  const media = visibleMedia(doc);
  const instaUrl = (m) => (m.shortcode ? `https://www.instagram.com/${m.soort === 'reel' ? 'reel' : 'p'}/${encodeURIComponent(m.shortcode)}/` : '');
  clear(box).append(...media.map((m) => {
    const img = el('img', { alt: '', loading: 'lazy', decoding: 'async' });
    mediaUrl(m, doc, { demo: meta.source === 'demo' }).then((url) => {
      const src = m.bron === 'repo' && m.thumb ? m.thumb : url;
      if (src) img.src = src; else img.closest('.tile')?.remove();
    });
    const reel = m.soort === 'reel' && m.shortcode;
    const href = reel ? instaUrl(m) : (m.bron === 'repo' ? m.pad : '#');
    const a = el('a', { href, rel: reel ? 'noopener' : null, target: reel ? '_blank' : null, 'aria-label': `${m.bijschrift} – ${reel ? 'Bekijk reel op Instagram' : 'Bekijk foto'}` }, img);
    if (m.bron === 'gist') mediaUrl(m, doc, { demo: meta.source === 'demo' }).then((url) => { if (url) a.href = url; });
    return el('figure', { class: 'tile', dataset: { cat: m.categorie } }, [a, el('figcaption', {}, [m.bijschrift, reel ? el('span', { class: 'tag', text: 'reel' }) : null])]);
  }));
  const cats = ['Bruiloft', 'Verjaardag', 'Zakelijk', 'Feest', 'Setup'].filter((c) => media.some((m) => m.categorie === c));
  const chips = $('#gallery-chips');
  const draw = (cat) => {
    for (const tile of $$('#gallery .tile')) tile.hidden = !!cat && tile.dataset.cat !== cat;
    for (const chip of $$('.chip', chips)) {
      chip.classList.toggle('active', chip.dataset.cat === cat);
      const num = media.filter((m) => !chip.dataset.cat || m.categorie === chip.dataset.cat).length;
      const span = $('.muted', chip);
      if (span) span.textContent = `(${num})`;
    }
  };
  clear(chips).append(el('button', { type: 'button', class: 'chip', dataset: { cat: '' } }, ['Alles ', el('span', { class: 'muted' })]),
    ...cats.map((c) => el('button', { type: 'button', class: 'chip', dataset: { cat: c } }, [`${c === 'Setup' ? 'Setup & lichtshow' : c} `, el('span', { class: 'muted' })])));
  for (const chip of $$('.chip', chips)) chip.onclick = () => draw(chip.dataset.cat);
  draw('');
}

/* --------------------------------------------------------------- prijzen */

function renderPrijzen(doc) {
  const box = $('#pakketten');
  if (!box) return;
  const pakketten = doc.pakketten.filter((p) => !p.hidden);
  if (pakketten.length) {
    clear(box).append(...pakketten.map((p) => el('div', { class: `card pakket${p.populair ? ' populair' : ''}`, dataset: { id: p.id } }, [
      p.populair ? el('span', { class: 'tag tag-amber', text: 'Meest gekozen' }) : null,
      el('h3', { text: p.naam }),
      el('div', { class: 'prijs', text: p.prijs === null ? 'Op aanvraag' : `${p.vanaf ? 'vanaf ' : ''}${euro(p.prijs)}` }),
      el('div', { class: 'muted small', text: `all-in, incl. btw${p.vanaf ? ' · offerte' : ''}` }),
      el('ul', {}, p.inhoud.map((x) => el('li', { text: x }))),
      el('a', { class: `btn ${p.populair ? 'btn-amber' : 'btn-ghost'}`, href: `contact.html?pakket=${encodeURIComponent(p.id)}${p.id === 'zakelijk' ? '&type=Bedrijfsfeest' : ''}#aanvraag`, text: p.vanaf ? 'Vraag offerte aan' : 'Check beschikbaarheid' }),
    ])));
  }
  const tbody = $('#opties tbody');
  const opties = doc.opties.filter((o) => !o.hidden);
  if (tbody && opties.length) {
    clear(tbody).append(...opties.map((o) => el('tr', {}, [
      el('th', { scope: 'row', text: o.naam }),
      el('td', { text: o.prijs === null ? o.tekst : `${euro(o.prijs)}${o.eenheid ? ` ${o.eenheid}` : ''}` }),
    ])));
  }
  if (doc.zekerheden.length) clear($('#zekerheden')).append(...doc.zekerheden.map((z) => el('li', { text: z })));
}

/* ------------------------------------------------------------------ over */

function renderOver(doc, meta) {
  const info = doc.info;
  if (info.overTekst) clear($('#over-tekst')).append(...info.overTekst.split(/\n\s*\n/).map((p) => el('p', { text: p.trim() })));
  if (info.apparatuur.length) clear($('#apparatuur')).append(...info.apparatuur.map((a) => el('li', { text: a })));
  const img = $('#portret');
  if (img && doc.portret && !img.getAttribute('src').endsWith(doc.portret)) {
    for (const s of $$('.about-photo source')) s.remove();
    const item = doc.media.find((m) => m.pad === doc.portret || m.id === doc.portret);
    mediaUrl(item || { bron: 'repo', pad: doc.portret }, doc, { demo: meta.source === 'demo' }).then((url) => { if (url) img.src = url; });
  }
}

/* -------------------------------------------------------------- contact */

let contactDoc = null;
function renderContact(doc) {
  const form = $('#aanvraag');
  if (!form) return;
  contactDoc = doc;
  const datum = $('#f-datum');
  const hint = $('#f-datum-hint');
  datum.min = todayIso();
  const check = () => {
    hint.textContent = '';
    hint.style.color = '';
    if (!datum.value) return;
    const bezet = agendaOp(doc, datum.value);
    if (bezet) { hint.textContent = `${formatDatum(datum.value)} is helaas al ${bezet.label.toLowerCase()}. Vraag gerust een andere datum aan.`; hint.style.color = 'var(--warn)'; }
    else { hint.textContent = `${formatDatum(datum.value)}: nog vrij.`; hint.style.color = 'var(--ok)'; }
  };
  datum.addEventListener('change', check);
  check();
}

function setupContactForm() {
  const form = $('#aanvraag');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const datum = $('#f-datum');
  const type = $('#f-type');
  const pakket = $('#f-pakket');
  if (params.get('datum') && /^\d{4}-\d{2}-\d{2}$/.test(params.get('datum'))) datum.value = params.get('datum');
  if (params.get('type')) type.value = params.get('type');
  if (params.get('pakket')) pakket.value = params.get('pakket');

  const bedrijf = $('#f-bedrijf-wrap');
  const zakelijk = $('#f-zakelijk');
  const syncType = () => { const z = type.value === 'Bedrijfsfeest'; bedrijf.hidden = !z; if (zakelijk) zakelijk.hidden = !z; };
  const next = $('#f-next');
  if (next) next.value = new URL('bedankt.html', location.href).href;
  setupTurnstile(form);
  type.addEventListener('change', syncType);
  syncType();

  const id = CONFIG.formspreeId;
  const configured = id && !/FORMSPREE_ID/.test(id);
  if (configured) form.action = `https://formspree.io/f/${encodeURIComponent(id)}`;

  const status = $('#f-status');
  const submit = $('#f-submit');
  const mailBtn = $('#f-mail-submit');
  if (mailBtn) mailBtn.hidden = !configured;

  /** Alle velden als leesbaar WhatsApp-bericht. */
  const bericht = () => {
    const v = (id) => ($(id)?.value || '').trim();
    const opt = (label, val) => (val ? `${label}${val}` : null);
    const regels = [
      'Hoi Roggy, ik wil graag de beschikbaarheid checken.',
      '',
      `📅 Datum: ${v('#f-datum') ? formatDatum(v('#f-datum')) : '-'}`,
      `🎉 Type feest: ${$('#f-type').selectedOptions[0]?.text || '-'}`,
      `👤 Naam: ${v('#f-naam')}`,
      opt('🏢 Bedrijf: ', v('#f-bedrijf')),
      opt('📍 Locatie: ', v('#f-locatie')),
      opt('👥 Gasten: ', v('#f-gasten')),
      opt('⏰ Tijden: ', v('#f-tijden')),
      opt('💶 Budget: ', v('#f-budget')),
      opt('🧾 Factuuradres: ', v('#f-factuur')),
      opt('📧 E-mail: ', v('#f-email')),
      opt('📞 Telefoon: ', v('#f-tel')),
      opt('📦 Pakket: ', v('#f-pakket')),
      opt('🔎 Hoe ken ik je: ', v('#f-bron')),
      opt('\n💬 ', v('#f-bericht')),
    ];
    return regels.filter((r) => r !== null).join('\n');
  };

  const valideer = () => {
    status.className = 'form-status';
    if (!form.checkValidity()) {
      form.reportValidity();
      status.classList.add('error');
      status.textContent = 'Vul de verplichte velden in.';
      return false;
    }
    return true;
  };

  // Primair: via WhatsApp (het bericht opent in de app, de klant verstuurt hem daar).
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!valideer()) return;
    const info = contactDoc?.info || {};
    const nummer = info.whatsapp || info.phone;
    if (!isRealPhone(nummer)) {
      status.classList.add('error');
      status.textContent = 'Het WhatsApp-nummer is nog niet ingevuld (beheer → Info). Bel of mail voorlopig, of probeer het later nog eens.';
      return;
    }
    status.classList.add('ok');
    status.textContent = 'WhatsApp wordt geopend met je bericht. Druk daar op verzenden.';
    try { sessionStorage.setItem('djr.aanvraag', '1'); } catch { /* privémodus */ }
    location.href = whatsappLink(waNumber(nummer), bericht());
  });

  // Secundair: per e-mail via Formspree, alleen als het id is ingevuld.
  if (mailBtn) mailBtn.addEventListener('click', async () => {
    if (!valideer()) return;
    submit.disabled = true; mailBtn.disabled = true;
    status.textContent = 'Versturen…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      syncType();
      location.href = new URL('bedankt.html', location.href).href;
    } catch {
      status.classList.add('error');
      status.textContent = 'Versturen lukte niet. Probeer het via WhatsApp, of app of bel me.';
    } finally {
      submit.disabled = false; mailBtn.disabled = false;
    }
  });
}

/* ------------------------------------------- spam (Turnstile) en statistieken */

/** Cloudflare Turnstile op het formulier, alleen als er een site-key in config.js staat. Anders alleen de honeypot. */
function setupTurnstile(form) {
  const key = CONFIG.turnstileSiteKey;
  if (!key || /TURNSTILE/.test(key) || $('#cf-turnstile')) return;
  const box = el('div', { id: 'cf-turnstile', class: 'cf-turnstile', dataset: { sitekey: key, theme: 'dark', language: 'nl' }, style: { margin: '0 0 18px' } });
  $('#f-submit').before(box);
  document.head.append(el('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', async: true, defer: true }));
}

/** GoatCounter (cookieloos, geen banner nodig), alleen als er een code in config.js staat. */
function setupAnalytics() {
  const code = CONFIG.goatcounter;
  if (!code || location.hostname === 'localhost') return;
  document.head.append(el('script', { 'data-goatcounter': `https://${code}.goatcounter.com/count`, async: true, src: 'https://gc.zgo.at/count.js' }));
}

/* --------------------------------------------------------- versiecheck */

/**
 * Vergelijkt de versie in de pagina (meta name=version) met VERSION op de server,
 * zonder cache. Nieuwer? Dan één keer automatisch verversen; op de contactpagina
 * (formulier) alleen een balk met een knop, zodat niets verloren gaat.
 */
function checkVersion() {
  const current = document.querySelector('meta[name="version"]')?.content;
  if (!current) return;
  fetch(new URL('../../VERSION', import.meta.url), { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : ''))
    .then((v) => {
      v = v.trim();
      if (!v || v === current || $('#update-bar')) return;
      const key = `djr.reloaded.${v}`;
      let already = false;
      try { already = sessionStorage.getItem(key) === '1'; } catch { /* privémodus */ }
      if (page !== 'contact' && !already) {
        try { sessionStorage.setItem(key, '1'); } catch { /* privémodus */ }
        location.reload();
        return;
      }
      const bar = el('div', { id: 'update-bar', class: 'update-bar', role: 'status' }, [
        `Er is een nieuwe versie van de site (v${v}). `,
        el('button', { type: 'button', class: 'btn btn-amber btn-sm', text: 'Vernieuwen', onclick: () => location.reload() }),
      ]);
      document.body.prepend(bar);
    })
    .catch(() => { /* offline: niets doen */ });
}
checkVersion();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkVersion(); });
window.addEventListener('pageshow', (ev) => { if (ev.persisted) checkVersion(); });

/* ------------------------------------------------------------- opstart */

setupCarousel();
setupContactForm();
setupReadMore();
setupAnalytics();
loadForVisitors(render).catch((err) => console.warn('Data laden mislukt:', err));
