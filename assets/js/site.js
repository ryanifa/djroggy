/* De website opbouwen uit het databestand. De HTML bevat al de standaardinhoud
   (zodat de site zonder JavaScript werkt); dit script vervangt die zodra de
   data uit de cache, de Gist of data/site.json binnen is. Alles via textContent. */

import { CONFIG } from './config.js';
import { el, $, $$, clear, formatPrice, telLink, whatsappLink } from './dom.js';
import {
  loadForVisitors, kengetallen, reviewStats, featuredReviews, visibleMedia, vanafPrijs,
  agendaOp, formatDatum, formatCijfer, formatAantal, todayIso,
} from './store.js';

const page = document.body.dataset.page || (location.pathname.endsWith('contact.html') ? 'contact' : 'home');

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

/* --------------------------------------------------------------- render */

function render(doc, meta) {
  const info = doc.info;
  $('#demo-banner').hidden = meta.source !== 'demo';
  const ann = $('#announcement');
  if (ann) { ann.textContent = info.announcement; ann.hidden = !info.announcement; }
  $('#jaar') && ($('#jaar').textContent = String(new Date().getFullYear()));

  // Losse velden (telefoon, e-mail, KvK, straal) overal waar data-k staat.
  const kg = kengetallen(doc);
  const values = {
    phone: info.phone, whatsapp: info.whatsapp || info.phone, email: info.email, kvk: info.kvk, straalKm: String(info.straalKm),
    cijfer: formatCijfer(kg.cijfer), reviews: String(kg.reviews), feesten: formatAantal(kg.feesten), gasten: formatAantal(kg.gasten),
  };
  for (const node of $$('[data-k]')) {
    const v = values[node.dataset.k];
    if (v !== undefined) node.textContent = v;
  }
  for (const node of $$('#avg-cijfer')) node.textContent = formatCijfer(reviewStats(doc).avg);
  for (const node of $$('#avg-n')) node.textContent = String(reviewStats(doc).n);

  const tagline = $('#footer-tagline');
  if (tagline && info.tagline) tagline.textContent = info.tagline;
  renderContactLinks(doc);
  renderSocial(doc);
  if (page === 'home') renderHome(doc);
  if (page === 'contact') renderContact(doc);
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

/* ----------------------------------------------------------------- home */

function renderHome(doc) {
  const info = doc.info;
  if (info.intro) $('#hero-intro').textContent = info.intro;

  // Hero-foto
  const heroImg = $('#hero-media img');
  if (heroImg && doc.hero && !heroImg.getAttribute('src').endsWith(doc.hero)) {
    for (const source of $$('#hero-media source')) source.remove(); // de WebP-varianten horen bij de standaardfoto
    heroImg.src = doc.hero;
    heroImg.removeAttribute('width'); heroImg.removeAttribute('height');
  }

  // Reviews
  const list = featuredReviews(doc, 8);
  if (list.length) {
    clear($('#review-carousel')).append(...list.map(reviewCard));
  }

  // Fotostrip (6 tegels met "op homepage")
  const media = visibleMedia(doc);
  const tiles = (media.filter((m) => m.home).length ? media.filter((m) => m.home) : media).slice(0, 6);
  if (tiles.length) {
    clear($('#strip')).append(...tiles.map((m) => el('a', { href: 'foto-video.html' }, [
      el('img', { src: m.bron === 'repo' ? (m.thumb || m.pad) : '', alt: '', loading: 'lazy', decoding: 'async' }),
      m.bijschrift ? el('span', { class: 'cap', text: m.bijschrift }) : null,
    ])));
  }

  // Werkwijze (eerste 4 stappen)
  if (info.werkwijze.length) {
    clear($('#steps')).append(...info.werkwijze.slice(0, 4).map((s) => el('li', { class: 'step' }, [el('h3', { text: s.titel }), el('p', { text: s.tekst })])));
  }

  // Locaties
  if (info.locaties.length) clear($('#locaties')).append(...info.locaties.map((l) => el('li', { text: l })));

  // Prijs
  const vanaf = vanafPrijs(doc);
  if (vanaf !== null) $('#vanaf').textContent = formatPrice(vanaf);
  if (doc.zekerheden.length) clear($('#zekerheden')).append(...doc.zekerheden.map((z) => el('li', { text: z })));

  // Datumcheck
  const input = $('#datum-home');
  const out = $('#availability');
  if (input && out) {
    input.min = todayIso();
    input.addEventListener('change', () => {
      out.className = 'availability';
      out.textContent = '';
      if (!input.value) return;
      const bezet = agendaOp(doc, input.value);
      if (bezet) { out.classList.add('busy'); out.textContent = `${formatDatum(input.value)}: helaas, die datum is al ${bezet.label.toLowerCase()}. Kies een andere datum of vraag toch aan.`; }
      else { out.classList.add('free'); out.textContent = `${formatDatum(input.value)}: nog vrij. Vraag hem snel aan!`; }
    });
  }
}

function reviewCard(r) {
  const where = [r.locatie, r.plaats].filter((x) => x && x !== '—').join(', ');
  const text = el('p', { text: r.tekst });
  const long = r.tekst.length > 330;
  const toggle = long ? el('button', { type: 'button', class: 'toggle', text: 'Lees meer', onclick: () => {
    const open = text.classList.toggle('open');
    toggle.textContent = open ? 'Minder' : 'Lees meer';
  } }) : null;
  return el('article', { class: 'card review' }, [
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
loadForVisitors(render).catch((err) => console.warn('Data laden mislukt:', err));
