/* De website opbouwen uit het databestand. Elke pagina bevat al de standaard-
   inhoud (zodat de site zonder JavaScript werkt); dit script vervangt die zodra
   de data uit de cache, de Gist of data/site.json binnen is. Alles via textContent. */

import { CONFIG } from './config.js';
import { el, $, $$, clear, formatPrice, telLink, whatsappLink } from './dom.js';
import {
  loadForVisitors, kengetallen, reviewStats, featuredReviews, visibleReviews, visibleMedia, vanafPrijs,
  agendaOp, formatDatum, formatCijfer, formatAantal, todayIso, FAQ_TYPES,
} from './store.js';
import { mediaUrl } from './media.js';

const page = document.body.dataset.page || 'home';

/** Een telefoonnummer is "echt" als er minstens 9 cijfers in staan en geen x-placeholders. */
const isRealPhone = (p) => /\d{9,}/.test(String(p || '').replace(/\D/g, '')) && !/x/i.test(p);
const isRealEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '') && !/voorbeeld\.nl$/i.test(e);

/** Nederlands mobiel nummer naar internationaal voor wa.me. */
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

function render(doc, meta) {
  const info = doc.info;
  $('#demo-banner') && ($('#demo-banner').hidden = meta.source !== 'demo');
  const ann = $('#announcement');
  if (ann) { ann.textContent = info.announcement; ann.hidden = !info.announcement; }
  $('#jaar') && ($('#jaar').textContent = String(new Date().getFullYear()));

  // Losse velden overal waar data-k staat.
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
  const all = reviewStats(doc);
  for (const node of $$('#avg-cijfer')) node.textContent = formatCijfer(all.avg);
  for (const node of $$('#avg-n')) node.textContent = String(all.n);
  const tagline = $('#footer-tagline');
  if (tagline && info.tagline) tagline.textContent = info.tagline;

  renderContactLinks(doc);
  renderSocial(doc);
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
  const { instagram, facebook, tiktok } = doc.info;
  const links = [
    instagram && ['Instagram', `https://www.instagram.com/${encodeURIComponent(instagram.replace(/^@/, ''))}`],
    facebook && ['Facebook', `https://www.facebook.com/${encodeURIComponent(facebook)}`],
    tiktok && ['TikTok', `https://www.tiktok.com/@${encodeURIComponent(tiktok.replace(/^@/, ''))}`],
  ].filter(Boolean);
  if (!links.length) return;
  clear(box).append(...links.map(([name, href]) => el('li', {}, el('a', { href, rel: 'noopener', target: '_blank', text: name }))));
}

/** Datumcheck-formulier (onderaan elke pagina): meteen "nog vrij" of "bezet" tonen. */
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

/** "Lees meer" alleen tonen als de tekst echt is afgekapt. */
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

function reviewCard(r) {
  const where = r.plaats && r.plaats !== '—' ? r.plaats : '';
  const text = el('p', { text: r.tekst });
  const toggle = r.tekst ? el('button', { type: 'button', class: 'toggle', text: 'Lees meer', hidden: true }) : null;
  return el('article', { class: 'card review', dataset: { type: r.type, datum: r.datum, cijfer: String(r.cijfer) } }, [
    el('div', { class: 'review-top' }, [
      el('div', { class: 'avatar', 'aria-hidden': 'true', text: (r.naam[0] || '?').toUpperCase() }),
      el('div', { class: 'review-who' }, [el('strong', { text: r.naam }), el('span', { text: [r.type, where, maandJaar(r.datum)].filter(Boolean).join(' · ') })]),
      el('div', { class: 'review-score' }, [el('span', { class: 'score', text: formatCijfer(r.cijfer) }), el('span', { class: 'stars', 'aria-hidden': 'true', text: stars(r.cijfer) })]),
    ]),
    r.titel ? el('h3', { text: r.titel }) : null,
    r.tekst ? text : null,
    toggle,
  ]);
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

function renderHome(doc, meta) {
  const info = doc.info;
  if (info.intro) $('#hero-intro').textContent = info.intro;

  const heroImg = $('#hero-media img');
  if (heroImg && doc.hero && !heroImg.getAttribute('src').endsWith(doc.hero)) {
    for (const source of $$('#hero-media source')) source.remove(); // de WebP-varianten horen bij de standaardfoto
    const item = doc.media.find((m) => m.pad === doc.hero || m.id === doc.hero);
    mediaUrl(item || { bron: 'repo', pad: doc.hero }, doc, { demo: meta.source === 'demo' }).then((url) => { if (url) heroImg.src = url; });
    heroImg.removeAttribute('width'); heroImg.removeAttribute('height');
  }

  const list = featuredReviews(doc, 8);
  if (list.length) clear($('#review-carousel')).append(...list.map(reviewCard));

  const media = visibleMedia(doc);
  const tiles = (media.filter((m) => m.home).length ? media.filter((m) => m.home) : media).slice(0, 6);
  if (tiles.length) {
    clear($('#strip')).append(...tiles.map((m) => {
      const img = el('img', { alt: '', loading: 'lazy', decoding: 'async' });
      mediaUrl(m, doc).then((url) => { if (url) img.src = m.thumb && m.bron === 'repo' ? m.thumb : url; });
      return el('a', { href: 'foto-video.html' }, [img, m.bijschrift ? el('span', { class: 'cap', text: m.bijschrift }) : null]);
    }));
  }

  if (info.werkwijze.length) {
    clear($('#steps')).append(...info.werkwijze.slice(0, 4).map((s) => el('li', { class: 'step' }, [el('h3', { text: s.titel }), el('p', { text: s.tekst })])));
  }
  if (info.plaatsen.length && $('#plaatsen')) clear($('#plaatsen')).append(...info.plaatsen.map((l) => el('li', { text: l })));

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
  const { n, avg } = reviewStats(doc, type);
  for (const node of $$('[data-stat="avg"]')) node.textContent = formatCijfer(avg);
  for (const node of $$('[data-stat="n"]')) node.textContent = String(n);
  const list = visibleReviews(doc).filter((r) => r.type === type && r.tekst.length >= 40)
    .sort((a, b) => Number(b.uitgelicht) - Number(a.uitgelicht) || b.datum.localeCompare(a.datum)).slice(0, max);
  if (list.length) clear(box).append(...list.map(reviewCard));
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
  const box = $('#review-list');
  const all = visibleReviews(doc);
  const { verdeling, n } = reviewStats(doc);
  const hist = $('#histogram');
  if (hist && n) {
    clear(hist).append(...[10, 9, 8, 7].map((k) => {
      const count = k === 7 ? Object.entries(verdeling).filter(([c]) => Number(c) <= 7).reduce((s, [, v]) => s + v, 0) : (verdeling[String(k)] || 0);
      return el('li', {}, [el('span', { class: 'h-lbl', text: String(k) }), el('span', { class: 'h-bar' }, el('span', { style: { width: `${Math.round((count / n) * 100)}%` } })), el('span', { class: 'h-n', text: String(count) })]);
    }));
  }
  const draw = () => {
    let list = all.filter((r) => !reviewState.type || r.type === reviewState.type);
    if (reviewState.sort === 'hoog') list.sort((a, b) => b.cijfer - a.cijfer || b.datum.localeCompare(a.datum));
    else if (reviewState.sort === 'oud') list.sort((a, b) => a.datum.localeCompare(b.datum));
    clear(box).append(...list.map(reviewCard));
    const count = $('#filter-count');
    if (count) count.textContent = reviewState.type ? `${list.length} reviews van het type ${reviewState.type === 'Zakelijk event' ? 'Bedrijfsfeest' : reviewState.type}` : `Alle ${list.length} reviews`;
    for (const chip of $$('#filterbar .chip')) {
      chip.classList.toggle('active', chip.dataset.type === reviewState.type);
      const t = chip.dataset.type;
      const num = all.filter((r) => !t || r.type === t).length;
      const span = $('.muted', chip);
      if (span) span.textContent = `(${num})`;
    }
    setupReadMore();
  };
  for (const chip of $$('#filterbar .chip')) chip.onclick = () => { reviewState.type = chip.dataset.type; draw(); };
  const sort = $('#sort');
  if (sort) sort.onchange = () => { reviewState.sort = sort.value; draw(); };
  draw();
}

/* --------------------------------------------------------------- galerij */

function renderGallery(doc, meta) {
  const box = $('#gallery');
  if (!box) return;
  const media = visibleMedia(doc);
  const instaUrl = (m) => (m.shortcode ? `https://www.instagram.com/${m.soort === 'reel' ? 'reel' : 'p'}/${encodeURIComponent(m.shortcode)}/` : '');
  if (media.length) {
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
  }
  const draw = (cat) => {
    for (const tile of $$('#gallery .tile')) tile.hidden = !!cat && tile.dataset.cat !== cat;
    for (const chip of $$('#gallery-chips .chip')) {
      chip.classList.toggle('active', chip.dataset.cat === cat);
      const num = $$('#gallery .tile').filter((t) => !chip.dataset.cat || t.dataset.cat === chip.dataset.cat).length;
      const span = $('.muted', chip);
      if (span) span.textContent = `(${num})`;
    }
  };
  for (const chip of $$('#gallery-chips .chip')) chip.onclick = () => draw(chip.dataset.cat);
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

function renderContact(doc) {
  const form = $('#aanvraag');
  if (!form) return;
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
  const syncType = () => { bedrijf.hidden = type.value !== 'Bedrijfsfeest'; };
  type.addEventListener('change', syncType);
  syncType();

  const id = CONFIG.formspreeId;
  const configured = id && !/FORMSPREE_ID/.test(id);
  if (configured) form.action = `https://formspree.io/f/${encodeURIComponent(id)}`;

  const status = $('#f-status');
  const submit = $('#f-submit');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    status.className = 'form-status';
    if (!form.checkValidity()) {
      form.reportValidity();
      status.classList.add('error');
      status.textContent = 'Vul de verplichte velden in.';
      return;
    }
    if (!configured) {
      status.classList.add('error');
      status.textContent = 'Het formulier is nog niet gekoppeld (Formspree-id ontbreekt in config.js). Gebruik voorlopig WhatsApp of e-mail.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Versturen…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      syncType();
      status.classList.add('ok');
      status.textContent = 'Bedankt! Je aanvraag is verstuurd. Je hoort binnen 24 uur van me.';
    } catch {
      status.classList.add('error');
      status.textContent = 'Versturen lukte niet. Probeer het nog eens, of app of bel me.';
    } finally {
      submit.disabled = false;
    }
  });
}

/* ------------------------------------------------------------- opstart */

setupCarousel();
setupContactForm();
setupReadMore();
loadForVisitors(render).catch((err) => console.warn('Data laden mislukt:', err));
