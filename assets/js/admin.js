/* Beheer: inloggen met een GitHub-sleutel en de website-gegevens bewerken.
   De gegevens staan als één JSON-bestand in een Gist; bezoekers lezen die
   zonder sleutel, alleen de beheerder kan schrijven. Zelfde flow als
   passthedutchie: concept in localStorage, Publiceren met conflictcheck,
   back-up, demo zonder sleutel, beheerlink voor op de telefoon. */

import { CONFIG } from './config.js';
import { el, $, clear, formatPrice, uid, toast } from './dom.js';
import { checkToken, readGist, createGist, writeGist, createFilesGist, writeFiles, GistError } from './gist.js';
import { compressImage, mediaFile, mediaUrl, rememberMedia, setDemoMedia, clearDemoMedia } from './media.js';
import {
  normalize, bundledDoc, activeGistId, setLocalGistId, demoDoc, setDemoDoc, cacheDoc, storageGet, storageSet,
  todayIso, filter, verborgenBureau, reviewStats, formatCijfer, formatDatum, REVIEW_TYPES, MEDIA_CATEGORIES, FAQ_TYPES, BUREAU_BRON,
} from './store.js';

const SESSION_KEY = 'djr.admin';
const DRAFT_KEY = 'djr.draft';

const state = {
  session: null,       // { token, login } of { demo: true }
  gistId: '',
  doc: null,           // werkversie
  savedJson: '',       // laatst gepubliceerde versie, om "gewijzigd" te bepalen
  baseUpdatedAt: null, // updated_at van de Gist toen we hem lazen
  gistOwner: '',
  tab: 'reviews',
  saving: false,
  reviewFilter: { type: '', herkomst: '' },
  mediaFilter: '',
};

const app = () => $('#app');

/* =============================================================== helpers */

const isDirty = () => state.doc && JSON.stringify(state.doc) !== state.savedJson;
const draftKey = () => (state.session?.demo ? 'demo' : state.gistId);
const euro = (v) => (v === null || v === undefined ? '—' : formatPrice(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
const nlDate = (iso) => (iso ? formatDatum(iso, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function changed({ rerender = true } = {}) {
  storageSet(DRAFT_KEY, { key: draftKey(), doc: state.doc, base: state.baseUpdatedAt });
  if (rerender) renderTab();
  renderSaveBar();
}

function move(list, index, delta) {
  const to = index + delta;
  if (to < 0 || to >= list.length) return;
  const [x] = list.splice(index, 1);
  list.splice(to, 0, x);
}

function errorText(err) {
  return err instanceof GistError ? err.message : (err?.message || 'Er ging iets mis.');
}

function iconBtn(label, symbol, onclick, extra = '') {
  return el('button', { type: 'button', class: `icon-btn ${extra}`, title: label, 'aria-label': label, text: symbol, onclick });
}

function field(label, input, help) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field-label', text: label }),
    input,
    help ? el('span', { class: 'field-help', text: help }) : null,
  ]);
}

function toggle(label, checked, onchange, extra = '') {
  return el('label', { class: `switch ${extra}` }, [
    el('input', { type: 'checkbox', checked, onchange: (e) => onchange(e.target.checked) }),
    el('span', { class: 'switch-track', 'aria-hidden': 'true' }),
    el('span', { class: 'switch-label', text: label }),
  ]);
}

const badge = (text, cls = '') => el('span', { class: `badge ${cls}`, text });
const herkomstBadge = (h) => badge(h === 'bureau' ? 'Bureau' : 'Eigen', h === 'bureau' ? 'bureau' : 'eigen');

/* ================================================================= modal */

/**
 * Generiek formulier in een dialoog.
 * fields: [{ key, label, type: text|textarea|price|number|cijfer|checkbox|select|date|url|custom|static, value, placeholder, help, options, disabled }]
 * Een 'custom'-veld levert zelf { node, get } via f.render().
 */
function openForm({ title, fields, submitText = 'Opslaan', onSave, onDelete, deleteText = 'Verwijderen' }) {
  const dialog = $('#modal');
  const form = clear($('#modal-form'));
  const inputs = {};

  const body = el('div', { class: 'modal-body' });
  for (const f of fields) {
    let input;
    if (f.type === 'textarea') {
      input = el('textarea', { rows: f.rows || 3, class: f.tall ? 'tall' : null, placeholder: f.placeholder || '', value: f.value ?? '' });
    } else if (f.type === 'checkbox') {
      input = el('input', { type: 'checkbox', checked: !!f.value });
      body.append(el('label', { class: 'switch' }, [input, el('span', { class: 'switch-track' }), el('span', { class: 'switch-label', text: f.label })]));
      inputs[f.key] = input;
      continue;
    } else if (f.type === 'static') {
      body.append(el('div', { class: 'field' }, [el('span', { class: 'field-label', text: f.label }), el('span', { text: f.value || '—' }), f.help ? el('span', { class: 'field-help', text: f.help }) : null]));
      continue;
    } else if (f.type === 'custom') {
      const part = f.render();
      inputs[f.key] = part;
      // Geen <label>: die zou elke klik doorsturen naar de eerste knop erin.
      body.append(el('div', { class: 'field' }, [
        el('span', { class: 'field-label', text: f.label }),
        part.node,
        f.help ? el('span', { class: 'field-help', text: f.help }) : null,
      ]));
      continue;
    } else if (f.type === 'date') {
      input = el('input', { type: 'date', value: f.value || '' });
    } else if (f.type === 'select') {
      input = el('select', { value: f.value, disabled: !!f.disabled }, f.options.map((o) => el('option', { value: o.value, text: o.label })));
    } else if (f.type === 'price' || f.type === 'number' || f.type === 'cijfer') {
      input = el('input', {
        type: 'text', inputmode: 'decimal', placeholder: f.placeholder || (f.type === 'cijfer' ? 'bijv. 9,5' : 'bijv. 745'),
        value: f.value === null || f.value === undefined ? '' : String(f.value).replace('.', ','),
      });
    } else if (f.type === 'url') {
      input = el('input', { type: 'url', inputmode: 'url', placeholder: f.placeholder || 'https://…', value: f.value ?? '', spellcheck: 'false' });
    } else {
      input = el('input', { type: 'text', placeholder: f.placeholder || '', value: f.value ?? '', maxlength: f.maxlength || null, disabled: !!f.disabled });
    }
    inputs[f.key] = input;
    body.append(field(f.label, input, f.help));
  }

  const error = el('p', { class: 'form-error', hidden: true });

  form.append(
    el('header', { class: 'modal-head' }, [
      el('h2', { text: title }),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Sluiten', text: '✕', onclick: () => dialog.close() }),
    ]),
    body,
    error,
    el('footer', { class: 'modal-foot' }, [
      onDelete ? el('button', {
        type: 'button', class: 'btn btn-danger btn-sm', text: deleteText,
        onclick: () => { dialog.close(); onDelete(); },
      }) : null,
      el('span', { class: 'spacer' }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Annuleren', onclick: () => dialog.close() }),
      el('button', { type: 'submit', class: 'btn btn-amber btn-sm', text: submitText }),
    ]),
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    const values = {};
    for (const f of fields) {
      const input = inputs[f.key];
      if (f.type === 'static') continue;
      if (f.type === 'checkbox') values[f.key] = input.checked;
      else if (f.type === 'custom') values[f.key] = input.get();
      else if (f.type === 'price' || f.type === 'number' || f.type === 'cijfer') {
        const raw = input.value.trim().replace(',', '.').replace(/^€\s*/, '');
        if (raw === '') values[f.key] = f.type === 'number' ? 0 : null;
        else if (!Number.isFinite(Number(raw)) || Number(raw) < 0) {
          error.textContent = `"${f.label}" moet een getal zijn, bijvoorbeeld 745 of 9,5.`;
          error.hidden = false;
          input.focus();
          return;
        } else if (f.type === 'cijfer' && (Number(raw) < 1 || Number(raw) > 10)) {
          error.textContent = 'Het cijfer moet tussen 1 en 10 liggen.';
          error.hidden = false;
          input.focus();
          return;
        } else values[f.key] = f.type === 'cijfer' ? Math.round(Number(raw) * 10) / 10 : f.type === 'number' ? Math.round(Number(raw)) : Math.round(Number(raw) * 100) / 100;
      } else if (f.type === 'date') {
        values[f.key] = /^\d{4}-\d{2}-\d{2}$/.test(input.value) ? input.value : '';
      } else values[f.key] = input.value.trim();
    }
    const problem = onSave(values);
    if (typeof problem === 'string') {
      error.textContent = problem;
      error.hidden = false;
      return;
    }
    dialog.close();
  };

  dialog.showModal();
  const first = form.querySelector('input:not([type=checkbox]):not([disabled]), textarea, select');
  if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
}

function confirmBox(message, { okText = 'Doorgaan', danger = false } = {}) {
  return new Promise((resolve) => {
    const dialog = $('#modal');
    const form = clear($('#modal-form'));
    // Bewust niet op het 'close'-event wachten: dat komt asynchroon binnen en kan
    // nog van de vorige dialoog zijn.
    const finish = (answer) => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.close();
      resolve(answer);
    };
    const onCancel = () => finish(false);
    form.append(
      el('div', { class: 'modal-body' }, [el('p', { class: 'confirm-text', text: message })]),
      el('footer', { class: 'modal-foot' }, [
        el('span', { class: 'spacer' }),
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Annuleren', onclick: () => finish(false) }),
        el('button', {
          type: 'button', class: `btn ${danger ? 'btn-danger' : 'btn-amber'} btn-sm`, text: okText,
          onclick: () => finish(true),
        }),
      ]),
    );
    form.onsubmit = (e) => e.preventDefault();
    dialog.addEventListener('cancel', onCancel);
    if (!dialog.open) dialog.showModal();
  });
}

/* ================================================================= login */

function renderLogin(message = '') {
  const keyInput = el('input', {
    type: 'password', id: 'key', autocomplete: 'current-password', spellcheck: 'false',
    placeholder: 'github_pat_… of ghp_…',
  });
  const btn = el('button', { type: 'submit', class: 'btn btn-amber', text: 'Inloggen' });

  const submit = async (e) => {
    e.preventDefault();
    const token = keyInput.value.trim();
    if (!token) return keyInput.focus();
    btn.disabled = true;
    btn.textContent = 'Controleren…';
    try {
      await login(token);
    } catch (err) {
      renderLogin(errorText(err));
      $('#key').value = token;
    }
  };

  clear(app()).append(el('div', { class: 'login' }, [
    el('form', { class: 'login-card', onsubmit: submit }, [
      el('img', { src: 'assets/logo/logo-horizontal.svg', alt: 'DJ Roggy', class: 'login-logo', width: 180, height: 48 }),
      el('h1', { text: 'Beheer' }),
      el('p', { class: 'muted', text: 'Log in met je sleutel om reviews, foto\'s, prijzen, agenda en info aan te passen.' }),
      field('Sleutel', keyInput),
      message ? el('p', { class: 'form-error', text: message }) : null,
      btn,
      el('details', { class: 'help' }, [
        el('summary', { text: 'Hoe kom ik aan een sleutel?' }),
        el('ol', {}, [
          el('li', {}, ['Ga naar ', el('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener', text: 'GitHub → Fine-grained token' }), '.']),
          el('li', {}, ['Zet bij ', el('strong', { text: 'Account permissions → Gists' }), ' de waarde op ', el('strong', { text: 'Read and write' }), '. De rest mag uit.']),
          el('li', { text: 'Kies een vervaldatum, maak de sleutel en plak hem hierboven.' }),
        ]),
        el('p', { class: 'muted small', text: 'De sleutel blijft alleen op dit apparaat bewaard en gaat rechtstreeks naar GitHub, nergens anders heen.' }),
      ]),
    ]),
    el('div', { class: 'login-alt' }, [
      el('p', { class: 'muted small', text: 'Eerst rondkijken? In de demo werkt alles, maar blijven wijzigingen in deze browser.' }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: '🧪 Demo zonder sleutel', onclick: () => startDemo() }),
      el('a', { class: 'btn btn-ghost btn-sm', href: './', text: '← Naar de website' }),
    ]),
  ]));
  setTimeout(() => keyInput.focus(), 50);
}

async function login(token) {
  const login = await checkToken(token);
  state.session = { token, login };
  storageSet(SESSION_KEY, state.session);
  await openGistOrSetup();
}

async function openGistOrSetup() {
  state.gistId = activeGistId();
  if (!state.gistId) return renderSetup();
  clear(app()).append(el('p', { class: 'loading', text: 'Gegevens ophalen…' }));
  try {
    const remote = await readGist(state.gistId, CONFIG.gistFile, state.session.token);
    if (remote.owner && state.session.login && remote.owner !== state.session.login) {
      toast(`Let op: deze Gist is van ${remote.owner}, je sleutel van ${state.session.login}. Publiceren gaat dan niet.`, 'error', 8000);
    }
    state.gistOwner = remote.owner || '';
    loadDoc(normalize(remote.doc), remote.updatedAt);
  } catch (err) {
    if (err.status === 404 && !CONFIG.gistId) {
      setLocalGistId('');
      toast('De gekoppelde Gist bestaat niet meer.', 'error', 5000);
      return renderSetup();
    }
    renderLogin(errorText(err));
  }
}

async function startDemo({ fresh = true } = {}) {
  state.session = { demo: true };
  storageSet(SESSION_KEY, state.session);
  let doc = demoDoc();
  if (!doc) {
    doc = await bundledDoc();
    setDemoDoc(doc);
  }
  loadDoc(normalize(doc), null);
  if (fresh) toast('Demo gestart. "Publiceren" toont je wijzigingen op de website in déze browser.', 'ok', 5000);
}

function loadDoc(doc, updatedAt) {
  state.doc = doc;
  state.savedJson = JSON.stringify(doc);
  state.baseUpdatedAt = updatedAt;

  const draft = storageGet(DRAFT_KEY);
  if (draft?.key === draftKey() && draft.doc) {
    const draftDoc = normalize(draft.doc);
    if (JSON.stringify(draftDoc) !== state.savedJson) {
      state.doc = draftDoc;
      toast('Je niet-gepubliceerde wijzigingen zijn teruggezet.', 'ok', 4000);
    }
  }
  renderShell();
}

/* ================================================================= setup */

function renderSetup() {
  const idInput = el('input', { type: 'text', placeholder: 'bijv. 3f9a2c…', spellcheck: 'false' });
  clear(app()).append(el('div', { class: 'login' }, [
    el('div', { class: 'login-card wide' }, [
      el('p', { class: 'eyebrow', text: `Ingelogd als ${state.session.login || 'beheerder'}` }),
      el('h1', { text: 'Nog één stap' }),
      el('p', { class: 'muted', text: 'De gegevens worden bewaard in een Gist op GitHub. Die is er nog niet. Maak er één aan (hij wordt gevuld met de huidige gegevens van de site) of koppel een bestaande.' }),
      el('button', {
        type: 'button', class: 'btn btn-amber', id: 'create', text: '✨ Nieuwe Gist aanmaken',
        onclick: async (e) => {
          e.target.disabled = true;
          e.target.textContent = 'Bezig…';
          try {
            const doc = await bundledDoc();
            const { id, updatedAt } = await createGist(state.session.token, CONFIG.gistFile, doc);
            setLocalGistId(id);
            state.gistId = id;
            state.gistOwner = state.session.login || '';
            loadDoc(doc, updatedAt);
            state.tab = 'settings';
            renderShell();
            toast('Gist aangemaakt! Zet het id nog in config.js (zie Instellingen).', 'ok', 7000);
          } catch (err) {
            e.target.disabled = false;
            e.target.textContent = '✨ Nieuwe Gist aanmaken';
            toast(errorText(err), 'error', 6000);
          }
        },
      }),
      el('div', { class: 'divider', text: 'of' }),
      field('Bestaande Gist-id', idInput, 'Het laatste stuk van de Gist-link: gist.github.com/<naam>/<id>'),
      el('button', {
        type: 'button', class: 'btn btn-ghost', text: 'Koppelen',
        onclick: async () => {
          const id = idInput.value.trim().split('/').pop();
          if (!id) return idInput.focus();
          setLocalGistId(id);
          await openGistOrSetup();
        },
      }),
      el('button', { type: 'button', class: 'linkish', text: 'Uitloggen', onclick: logout }),
    ]),
  ]));
}

/* ================================================================= shell */

const TABS = [
  ['reviews', 'Reviews', '💬'],
  ['media', 'Foto\'s', '📷'],
  ['pakketten', 'Pakketten', '💶'],
  ['agenda', 'Agenda', '📅'],
  ['info', 'Info', 'ℹ️'],
  ['settings', 'Instellingen', '⚙️'],
];

function renderShell() {
  const demo = !!state.session.demo;
  clear(app()).append(...[
    demo ? el('div', { class: 'demo-strip', text: '🧪 Demo — wijzigingen blijven in deze browser' }) : null,
    el('header', { class: 'admin-top' }, [
      el('a', { class: 'admin-brand', href: './', title: 'Naar de website' }, [
        el('img', { src: 'assets/logo/logo-mark.svg', alt: '', width: 32, height: 32 }),
        el('span', {}, [el('strong', { text: 'Beheer' }), el('small', { text: state.doc.info.name })]),
      ]),
      el('span', { class: 'status', id: 'status' }),
      el('a', { class: 'btn btn-ghost btn-xs hide-sm', href: './', target: '_blank', rel: 'noopener', text: 'Bekijk site ↗' }),
    ]),
    el('nav', { class: 'tabs', role: 'tablist' }, TABS.map(([id, label, emoji]) => el('button', {
      type: 'button', role: 'tab', class: state.tab === id ? 'active' : '', 'aria-selected': String(state.tab === id),
      onclick: () => { state.tab = id; renderShell(); window.scrollTo(0, 0); },
    }, [el('span', { class: 'tab-emoji', text: emoji, 'aria-hidden': 'true' }), el('span', { text: label })]))),
    el('main', { class: 'admin-main', id: 'tab' }),
    el('div', { class: 'savebar', id: 'savebar' }),
  ].filter(Boolean));
  renderTab();
  renderSaveBar();
}

function renderTab() {
  const main = $('#tab');
  if (!main) return;
  const y = window.scrollY;
  clear(main);
  if (state.tab === 'reviews') renderReviewsTab(main);
  else if (state.tab === 'media') renderMediaTab(main);
  else if (state.tab === 'pakketten') renderPakkettenTab(main);
  else if (state.tab === 'agenda') renderAgendaTab(main);
  else if (state.tab === 'info') renderInfoTab(main);
  else renderSettingsTab(main);
  window.scrollTo(0, y);
}

function renderSaveBar() {
  const dirty = isDirty();
  const status = $('#status');
  if (status) {
    status.textContent = dirty ? 'Niet gepubliceerd' : 'Alles gepubliceerd';
    status.className = `status ${dirty ? 'dirty' : 'clean'}`;
  }
  const bar = $('#savebar');
  if (!bar) return;
  bar.classList.toggle('show', dirty);
  clear(bar).append(el('div', { class: 'savebar-inner' }, [
    el('span', { class: 'savebar-text', text: 'Je hebt wijzigingen die nog niet op de website staan.' }),
    el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Ongedaan maken', disabled: state.saving, onclick: revert }),
    el('button', { type: 'button', class: 'btn btn-amber btn-sm', text: state.saving ? 'Publiceren…' : 'Publiceren', disabled: state.saving, onclick: publish }),
  ]));
}

async function revert() {
  if (!(await confirmBox('Alle wijzigingen sinds de laatste keer publiceren weggooien?', { okText: 'Weggooien', danger: true }))) return;
  state.doc = JSON.parse(state.savedJson);
  storageSet(DRAFT_KEY, null);
  renderShell();
}

async function publish() {
  if (state.saving) return;
  state.saving = true;
  renderSaveBar();
  try {
    if (state.session.demo) {
      setDemoDoc(state.doc);
    } else {
      // Kijk eerst of iemand anders intussen iets heeft gepubliceerd.
      const remote = await readGist(state.gistId, CONFIG.gistFile, state.session.token);
      const remoteJson = JSON.stringify(normalize(remote.doc));
      if (state.baseUpdatedAt && remote.updatedAt !== state.baseUpdatedAt && remoteJson !== state.savedJson) {
        const ok = await confirmBox('De gegevens zijn intussen op een ander apparaat aangepast. Als je nu publiceert, overschrijf je die wijzigingen.', { okText: 'Toch publiceren', danger: true });
        if (!ok) return;
      }
      const { updatedAt } = await writeGist(state.session.token, state.gistId, CONFIG.gistFile, state.doc);
      state.baseUpdatedAt = updatedAt;
      cacheDoc(state.doc, updatedAt);
      await cleanupMedia(JSON.parse(state.savedJson), state.doc);
    }
    state.savedJson = JSON.stringify(state.doc);
    storageSet(DRAFT_KEY, null);
    toast('Gepubliceerd! De website is bijgewerkt.', 'ok');
  } catch (err) {
    toast(`Publiceren mislukt: ${errorText(err)}`, 'error', 7000);
  } finally {
    state.saving = false;
    renderSaveBar();
  }
}

/** Foto's uit de media-Gist die bij deze publicatie niet meer gebruikt worden, weghalen. */
async function cleanupMedia(before, after) {
  const used = (doc) => new Set((doc.media || []).filter((m) => m.bron === 'gist').map((m) => m.id));
  const now = used(after);
  const gone = [...used(before)].filter((id) => !now.has(id));
  const gistId = after.info.media.gistId;
  if (!gone.length || !gistId) return;
  try {
    await writeFiles(state.session.token, gistId, Object.fromEntries(gone.map((id) => [mediaFile(id), null])));
  } catch {
    // Niet erg: een overgebleven foto kost alleen wat ruimte in de Gist.
  }
}

/* =========================================================== reviews tab */

const TYPE_OPTIONS = REVIEW_TYPES.map((t) => ({ value: t, label: t === 'Zakelijk event' ? 'Bedrijfsfeest / zakelijk' : t }));
const HERKOMST_OPTIONS = [{ value: 'eigen', label: 'Eigen (directe boeking)' }, { value: 'bureau', label: `Bureau (via ${BUREAU_BRON})` }];

function renderReviewsTab(main) {
  const doc = state.doc;
  const zichtbaar = filter(doc);
  const { n, avg } = reviewStats(zichtbaar);
  const verborgen = verborgenBureau(doc);

  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Zoals de site het nú toont' }),
    el('div', { class: 'stats-strip' }, [
      el('span', {}, [el('strong', { text: n ? formatCijfer(avg) : '–' }), ' gemiddeld']),
      el('span', {}, [el('strong', { text: String(n) }), ' reviews zichtbaar']),
      el('span', {}, [el('strong', { text: String(doc.reviews.length) }), ' in totaal']),
    ]),
    verborgen.reviews ? el('div', { class: 'notice', text: `Bureau-reviews staan uit — ${verborgen.reviews} verborgen. Aanzetten kan onder Info (alleen na toestemming of juridisch advies).` }) : null,
  ]));

  const { type, herkomst } = state.reviewFilter;
  const typeSel = el('select', { value: type, onchange: (e) => { state.reviewFilter.type = e.target.value; renderTab(); } },
    [el('option', { value: '', text: 'Alle types' }), ...TYPE_OPTIONS.map((o) => el('option', { value: o.value, text: o.label }))]);
  const herkomstSel = el('select', { value: herkomst, onchange: (e) => { state.reviewFilter.herkomst = e.target.value; renderTab(); } },
    [el('option', { value: '', text: 'Eigen + bureau' }), el('option', { value: 'eigen', text: 'Alleen eigen' }), el('option', { value: 'bureau', text: 'Alleen bureau' })]);
  main.append(el('div', { class: 'toolbar' }, [typeSel, herkomstSel,
    el('button', { type: 'button', class: 'btn btn-amber btn-sm', text: '+ Review toevoegen', onclick: () => editReview(null) })]));

  const list = doc.reviews
    .filter((r) => (!type || r.type === type) && (!herkomst || r.herkomst === herkomst))
    .sort((a, b) => b.datum.localeCompare(a.datum));
  main.append(el('div', { class: 'list-head' }, [el('h2', { text: `${list.length} reviews, nieuwste eerst` })]));
  if (!list.length) {
    main.append(el('p', { class: 'empty', text: 'Nog geen reviews in deze selectie. Voeg na elk direct geboekt feest een review toe.' }));
    return;
  }
  main.append(el('ul', { class: 'item-list boxed' }, list.map((r) => {
    const off = r.hidden || (r.herkomst === 'bureau' && !doc.info.bureauMateriaal);
    return el('li', { class: `item-row${r.hidden ? ' is-hidden' : off ? ' is-off' : ''}` }, [
      el('button', { type: 'button', class: 'item-main', onclick: () => editReview(r) }, [
        el('span', { class: 'item-top' }, [
          el('span', { class: 'score-pill', text: formatCijfer(r.cijfer) }),
          el('strong', { text: r.naam || '(naamloos)' }),
          herkomstBadge(r.herkomst),
          r.uitgelicht ? badge('Uitgelicht', 'hot') : null,
          r.hidden ? badge('Verborgen') : null,
        ]),
        el('small', { text: [r.type, r.plaats, nlDate(r.datum)].filter(Boolean).join(' · ') }),
        r.titel || r.tekst ? el('small', { class: 'clamp', text: r.titel || r.tekst }) : null,
      ]),
      el('div', { class: 'row-actions' }, [
        toggle('Uitgelicht', r.uitgelicht, (v) => { r.uitgelicht = v; changed({ rerender: false }); }),
      ]),
    ]);
  })));
}

function reviewFields(r) {
  const bureau = r?.herkomst === 'bureau';
  return [
    { key: 'naam', label: 'Voornaam', value: r?.naam, placeholder: 'bijv. Kassidy' },
    { key: 'datum', label: 'Datum van het feest', type: 'date', value: r?.datum || todayIso() },
    { key: 'cijfer', label: 'Cijfer (1–10)', type: 'cijfer', value: r?.cijfer ?? null },
    { key: 'titel', label: 'Titel', value: r?.titel, placeholder: 'bijv. Volle dansvloer de hele avond' },
    { key: 'tekst', label: 'Tekst', type: 'textarea', tall: true, value: r?.tekst, help: bureau ? 'Geïmporteerde reviews blijven ongewijzigd (§1a): tekst niet herschrijven.' : 'Zoals de klant het schreef.' },
    { key: 'plaats', label: 'Plaats', value: r?.plaats, placeholder: 'bijv. Rotterdam' },
    { key: 'locatie', label: 'Locatie', value: r?.locatie, placeholder: 'bijv. Lommerrijk' },
    { key: 'type', label: 'Type feest', type: 'select', value: r?.type || 'Bruiloft', options: TYPE_OPTIONS },
    { key: 'bron', label: 'Bron', value: r?.bron || 'Direct', placeholder: 'Direct, Google, …', disabled: bureau },
    bureau
      ? { key: 'herkomst', label: 'Herkomst', type: 'static', value: `Bureau (via ${BUREAU_BRON}) — alleen-lezen`, help: 'Valt onder de schakelaar in Info.' }
      : { key: 'herkomst', label: 'Herkomst', type: 'select', value: r?.herkomst || 'eigen', options: HERKOMST_OPTIONS },
    { key: 'uitgelicht', label: 'Uitgelicht op de homepage', type: 'checkbox', value: r?.uitgelicht },
    { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: r?.hidden },
  ];
}

function editReview(r) {
  openForm({
    title: r ? 'Review bewerken' : 'Nieuwe review',
    fields: reviewFields(r),
    submitText: r ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.naam) return 'Vul een voornaam in.';
      if (!v.datum) return 'Kies een datum.';
      if (v.cijfer === null) return 'Vul een cijfer in (1–10).';
      if (r?.herkomst === 'bureau') { v.herkomst = 'bureau'; v.bron = r.bron; }
      if (r) Object.assign(r, v);
      else state.doc.reviews.unshift({ id: uid('r'), ...v, bron: v.bron || 'Direct', herkomst: v.herkomst || 'eigen' });
      changed();
    },
    onDelete: r ? async () => {
      if (!(await confirmBox(`Review van ${r.naam} verwijderen?`, { okText: 'Verwijderen', danger: true }))) return;
      state.doc.reviews.splice(state.doc.reviews.indexOf(r), 1);
      changed();
      toast('Review verwijderd');
    } : null,
  });
}

/* ============================================================= media tab */

const CAT_OPTIONS = MEDIA_CATEGORIES.map((c) => ({ value: c, label: c === 'Setup' ? 'Setup & lichtshow' : c }));

function mediaThumb(m) {
  const box = el('div', { class: 'thumb', text: m.soort === 'reel' ? '▶' : '🖼' });
  mediaUrl(m, state.doc, { demo: !!state.session.demo }).then((url) => {
    const src = m.bron === 'repo' && m.thumb ? m.thumb : url;
    if (src) box.append(el('img', { src, alt: '', loading: 'lazy' }));
  });
  return box;
}

const isHero = (m) => state.doc.hero && (state.doc.hero === m.pad || state.doc.hero === m.id);
const isPortret = (m) => state.doc.portret && (state.doc.portret === m.pad || state.doc.portret === m.id);
const mediaRef = (m) => (m.bron === 'gist' ? m.id : m.pad);

function renderMediaTab(main) {
  const doc = state.doc;
  const verborgen = verborgenBureau(doc);
  const hero = doc.media.find(isHero);
  const portret = doc.media.find(isPortret);

  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Hero en portret' }),
    el('div', { class: 'picker-current' }, [hero ? mediaThumb(hero) : el('div', { class: 'thumb', text: '?' }), el('div', {}, [el('strong', { text: 'Hero (homepage)' }), el('br'), el('small', { class: 'muted', text: hero ? hero.bijschrift || hero.pad : 'Geen eigen foto gekozen; de site toont de standaardfoto.' })])]),
    el('div', { class: 'picker-current' }, [portret ? mediaThumb(portret) : el('div', { class: 'thumb', text: '?' }), el('div', {}, [el('strong', { text: 'Portret (Over Roggy)' }), el('br'), el('small', { class: 'muted', text: portret ? portret.bijschrift || portret.pad : 'Geen eigen foto gekozen; de site toont de standaardfoto.' })])]),
    el('p', { class: 'field-help', text: 'Kies een andere foto door hem hieronder te openen en "Gebruik als hero" of "Gebruik als portret" aan te zetten. Alleen eigen foto\'s zijn toegestaan.' }),
    verborgen.media ? el('div', { class: 'notice', text: `Bureau-foto's staan uit — ${verborgen.media} verborgen (art. 7.2). Aanzetten kan onder Info.` }) : null,
  ]));

  const sel = el('select', { value: state.mediaFilter, onchange: (e) => { state.mediaFilter = e.target.value; renderTab(); } },
    [el('option', { value: '', text: 'Eigen + bureau' }), el('option', { value: 'eigen', text: 'Alleen eigen' }), el('option', { value: 'bureau', text: 'Alleen bureau' })]);
  const fileInput = el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (e) => uploadNewMedia(e.target) });
  main.append(el('div', { class: 'toolbar' }, [sel,
    el('button', { type: 'button', class: 'btn btn-amber btn-sm', text: '📷 Foto uploaden', onclick: () => fileInput.click() }), fileInput]));

  const list = doc.media.map((m, i) => [m, i]).filter(([m]) => !state.mediaFilter || m.herkomst === state.mediaFilter);
  main.append(el('div', { class: 'list-head' }, [el('h2', { text: `${list.length} foto's · ${doc.media.filter((m) => m.home && !m.hidden).length} op de homepage` })]));
  main.append(el('ul', { class: 'item-list boxed' }, list.map(([m, i]) => {
    const off = m.hidden || (m.herkomst === 'bureau' && !doc.info.bureauMateriaal);
    return el('li', { class: `item-row${m.hidden ? ' is-hidden' : off ? ' is-off' : ''}` }, [
      el('button', { type: 'button', class: 'item-main with-thumb', onclick: () => editMedia(m) }, [
        mediaThumb(m),
        el('span', { class: 'thumb-text' }, [
          el('span', { class: 'item-top' }, [
            el('strong', { text: m.bijschrift || '(zonder bijschrift)' }),
            herkomstBadge(m.herkomst),
            m.soort === 'reel' ? badge('Reel') : null,
            isHero(m) ? badge('Hero', 'hot') : null,
            isPortret(m) ? badge('Portret', 'hot') : null,
            m.hidden ? badge('Verborgen') : null,
          ]),
          el('small', { text: [m.categorie === 'Setup' ? 'Setup & lichtshow' : m.categorie, m.bron === 'gist' ? 'geüpload' : 'in de repo'].join(' · ') }),
        ]),
      ]),
      el('div', { class: 'row-actions' }, [
        toggle('Home', m.home, (v) => { m.home = v; changed({ rerender: false }); }),
        iconBtn('Omhoog', '↑', () => { move(doc.media, i, -1); changed(); }, i === 0 ? 'off' : ''),
        iconBtn('Omlaag', '↓', () => { move(doc.media, i, 1); changed(); }, i === doc.media.length - 1 ? 'off' : ''),
      ]),
    ]);
  })));

  renderVideos(main);
}

async function uploadNewMedia(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  toast('Foto verkleinen…', 'info', 20000);
  try {
    const dataUrl = await compressImage(file);
    if (!dataUrl) throw new Error('Verkleinen mislukt.');
    toast('Uploaden…', 'info', 30000);
    const id = uid('m');
    await uploadMedia(id, dataUrl);
    rememberMedia(id, dataUrl);
    const item = { id, bron: 'gist', pad: '', thumb: '', shortcode: '', soort: 'post', bijschrift: '', categorie: 'Feest', herkomst: 'eigen', home: false, hidden: false };
    state.doc.media.unshift(item);
    changed();
    toast(`Geüpload (${Math.round(dataUrl.length / 1024)} kB). Vul nu bijschrift en categorie in en publiceer.`, 'ok', 6000);
    editMedia(item);
  } catch (err) {
    toast(`Uploaden mislukt: ${errorText(err)}`, 'error', 7000);
  }
}

async function uploadMedia(id, dataUrl) {
  if (state.session.demo) {
    try { setDemoMedia(id, dataUrl); } catch { throw new Error('De demo-opslag in deze browser is vol.'); }
    return;
  }
  const media = state.doc.info.media;
  if (!media.gistId) {
    // Eerste foto: maak de aparte media-Gist aan.
    const created = await createFilesGist(state.session.token, 'DJ Roggy — foto\'s bij de website (beheerd via beheer.html)', {
      'leesmij.txt': 'Foto\'s voor de website van DJ Roggy. Beheerd door beheer.html.',
      [mediaFile(id)]: dataUrl,
    });
    media.gistId = created.id;
    media.owner = created.owner || state.session.login || '';
    changed({ rerender: false });
    return;
  }
  await writeFiles(state.session.token, media.gistId, { [mediaFile(id)]: dataUrl });
}

function editMedia(m) {
  const preview = el('div', { class: 'media-preview' });
  mediaUrl(m, state.doc, { demo: !!state.session.demo }).then((url) => { if (url) preview.append(el('img', { src: m.bron === 'repo' && m.thumb ? m.thumb : url, alt: '' })); });
  openForm({
    title: 'Foto bewerken',
    fields: [
      { key: 'preview', label: 'Foto', type: 'custom', render: () => ({ node: preview, get: () => null }) },
      { key: 'bijschrift', label: 'Bijschrift', value: m.bijschrift, placeholder: 'bijv. Personeelsfeest in Rotterdam' },
      { key: 'categorie', label: 'Categorie', type: 'select', value: m.categorie, options: CAT_OPTIONS },
      { key: 'herkomst', label: 'Herkomst', type: 'select', value: m.herkomst, options: HERKOMST_OPTIONS, help: 'Gemaakt op een opdracht via het bureau? Dan "Bureau": de foto valt onder de schakelaar in Info (art. 7.2).' },
      { key: 'home', label: 'Op de homepage (fotostrip)', type: 'checkbox', value: m.home },
      { key: 'hero', label: 'Gebruik als hero-foto (homepage)', type: 'checkbox', value: !!isHero(m) },
      { key: 'portret', label: 'Gebruik als portretfoto (Over Roggy)', type: 'checkbox', value: !!isPortret(m) },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: m.hidden },
    ],
    onSave: (v) => {
      if ((v.hero || v.portret) && v.herkomst !== 'eigen') return 'Hero en portret moeten eigen materiaal zijn (§1a).';
      m.bijschrift = v.bijschrift; m.categorie = v.categorie; m.herkomst = v.herkomst; m.home = v.home; m.hidden = v.hidden;
      if (v.hero) state.doc.hero = mediaRef(m); else if (isHero(m)) state.doc.hero = '';
      if (v.portret) state.doc.portret = mediaRef(m); else if (isPortret(m)) state.doc.portret = '';
      changed();
    },
    onDelete: async () => {
      if (!(await confirmBox('Deze foto van de website halen? Een geüploade foto wordt bij het publiceren ook uit de media-Gist verwijderd.', { okText: 'Verwijderen', danger: true }))) return;
      if (isHero(m)) state.doc.hero = '';
      if (isPortret(m)) state.doc.portret = '';
      state.doc.media.splice(state.doc.media.indexOf(m), 1);
      if (state.session.demo && m.bron === 'gist') setDemoMedia(m.id, null);
      changed();
      toast('Foto verwijderd');
    },
  });
}

function renderVideos(main) {
  const videos = state.doc.videos;
  main.append(el('div', { class: 'list-head spaced' }, [
    el('h2', { text: `Video's (${videos.length})` }),
    el('span', { class: 'muted small', text: 'Het MP4-bestand zelf komt in assets/video/ in de repo; hier alleen de lijst.' }),
  ]));
  if (videos.length) {
    main.append(el('ul', { class: 'item-list boxed' }, videos.map((v, i) => el('li', { class: `item-row${v.hidden ? ' is-hidden' : ''}` }, [
      el('button', { type: 'button', class: 'item-main', onclick: () => editVideo(v) }, [
        el('span', { class: 'item-top' }, [el('strong', { text: v.bijschrift || v.pad || '(video)' }), v.hidden ? badge('Verborgen') : null]),
        el('small', { text: [v.pad, v.poster ? 'met poster' : ''].filter(Boolean).join(' · ') }),
      ]),
      el('div', { class: 'row-actions' }, [
        iconBtn('Omhoog', '↑', () => { move(videos, i, -1); changed(); }, i === 0 ? 'off' : ''),
        iconBtn('Omlaag', '↓', () => { move(videos, i, 1); changed(); }, i === videos.length - 1 ? 'off' : ''),
      ]),
    ]))));
  }
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Video toevoegen', onclick: () => editVideo(null) }));
}

function editVideo(v) {
  openForm({
    title: v ? 'Video bewerken' : 'Nieuwe video',
    fields: [
      { key: 'pad', label: 'Bestand of URL', value: v?.pad, placeholder: 'assets/video/naam.mp4', help: 'Een MP4 in de repo (max ~3 MB) of een volledige URL.' },
      { key: 'poster', label: 'Poster (afbeelding)', value: v?.poster, placeholder: 'assets/img/instagram/djroggy-….jpg' },
      { key: 'bijschrift', label: 'Bijschrift', value: v?.bijschrift },
      { key: 'hero', label: 'Gebruik als video-loop in de hero (homepage)', type: 'checkbox', value: v?.hero },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: v?.hidden },
    ],
    submitText: v ? 'Opslaan' : 'Toevoegen',
    onSave: (vals) => {
      if (!vals.pad) return 'Vul het bestand of de URL in.';
      if (vals.hero) for (const other of state.doc.videos) if (other !== v) other.hero = false;
      if (v) Object.assign(v, vals);
      else state.doc.videos.push({ id: uid('v'), ...vals });
      changed();
    },
    onDelete: v ? () => { state.doc.videos.splice(state.doc.videos.indexOf(v), 1); changed(); } : null,
  });
}

/* ========================================================= pakketten tab */

function renderPakkettenTab(main) {
  const doc = state.doc;
  main.append(el('div', { class: 'list-head' }, [el('h2', { text: 'Pakketten' }), el('span', { class: 'muted small', text: 'All-in prijzen, incl. btw. De laagste zichtbare prijs is de "vanaf"-prijs op de homepage.' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.pakketten.map((p, i) => el('li', { class: `item-row${p.hidden ? ' is-hidden' : ''}` }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editPakket(p) }, [
      el('span', { class: 'item-top' }, [
        el('strong', { text: p.naam || '(naamloos)' }),
        p.populair ? badge('Meest gekozen', 'hot') : null,
        p.hidden ? badge('Verborgen') : null,
        el('span', { class: 'item-price', text: `${p.vanaf ? 'vanaf ' : ''}${euro(p.prijs)}` }),
      ]),
      el('small', { class: 'clamp', text: p.inhoud.join(' · ') }),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.pakketten, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.pakketten, i, 1); changed(); }, i === doc.pakketten.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Pakket toevoegen', onclick: () => editPakket(null) }));

  main.append(el('div', { class: 'list-head spaced' }, [el('h2', { text: 'Opties' }), el('span', { class: 'muted small', text: 'Zonder prijs? Vul dan de tekst in (bijv. "+ 10%").' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.opties.map((o, i) => el('li', { class: `item-row${o.hidden ? ' is-hidden' : ''}` }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editOptie(o) }, [
      el('span', { class: 'item-top' }, [
        el('strong', { text: o.naam || '(naamloos)' }),
        o.hidden ? badge('Verborgen') : null,
        el('span', { class: 'item-price', text: o.prijs === null ? (o.tekst || '—') : `${euro(o.prijs)}${o.eenheid ? ` ${o.eenheid}` : ''}` }),
      ]),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.opties, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.opties, i, 1); changed(); }, i === doc.opties.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Optie toevoegen', onclick: () => editOptie(null) }));

  main.append(linesPanel('Zekerheden', 'Eén zekerheid per regel. Staan onder de prijzen op de homepage en de prijzenpagina.', doc, 'zekerheden'));
}

function editPakket(p) {
  openForm({
    title: p ? 'Pakket bewerken' : 'Nieuw pakket',
    fields: [
      { key: 'naam', label: 'Naam', value: p?.naam, placeholder: 'bijv. Feest' },
      { key: 'prijs', label: 'Prijs (€, all-in)', type: 'price', value: p?.prijs ?? null },
      { key: 'vanaf', label: '"Vanaf"-prijs (offerte op maat)', type: 'checkbox', value: p?.vanaf },
      { key: 'populair', label: 'Meest gekozen', type: 'checkbox', value: p?.populair },
      { key: 'inhoud', label: 'Inhoud (één regel per onderdeel)', type: 'textarea', tall: true, value: (p?.inhoud || []).join('\n') },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: p?.hidden },
    ],
    submitText: p ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.naam) return 'Geef het pakket een naam.';
      const vals = { ...v, inhoud: v.inhoud.split('\n').map((s) => s.trim()).filter(Boolean) };
      if (vals.populair) for (const other of state.doc.pakketten) if (other !== p) other.populair = false;
      if (p) Object.assign(p, vals);
      else state.doc.pakketten.push({ id: uid('pak'), ...vals });
      changed();
    },
    onDelete: p ? () => { state.doc.pakketten.splice(state.doc.pakketten.indexOf(p), 1); changed(); } : null,
  });
}

function editOptie(o) {
  openForm({
    title: o ? 'Optie bewerken' : 'Nieuwe optie',
    fields: [
      { key: 'naam', label: 'Naam', value: o?.naam, placeholder: 'bijv. Extra uur draaien' },
      { key: 'prijs', label: 'Prijs (€)', type: 'price', value: o?.prijs ?? null, help: 'Leeg laten als er geen vast bedrag is; vul dan de tekst in.' },
      { key: 'eenheid', label: 'Eenheid', value: o?.eenheid, placeholder: 'bijv. per uur' },
      { key: 'tekst', label: 'Tekst in plaats van prijs', value: o?.tekst, placeholder: 'bijv. Gratis binnen 40 km; daarbuiten € 0,35 per km' },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: o?.hidden },
    ],
    submitText: o ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.naam) return 'Geef de optie een naam.';
      if (v.prijs === null && !v.tekst) return 'Vul een prijs of een tekst in.';
      if (o) Object.assign(o, v);
      else state.doc.opties.push({ id: uid('opt'), ...v });
      changed();
    },
    onDelete: o ? () => { state.doc.opties.splice(state.doc.opties.indexOf(o), 1); changed(); } : null,
  });
}

/** Paneel met een tekstvak waarin elke regel één item van een lijst is. */
function linesPanel(title, help, obj, key) {
  const ta = el('textarea', { rows: 4, value: obj[key].join('\n'), oninput: (e) => { obj[key] = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); changed({ rerender: false }); } });
  return el('section', { class: 'panel' }, [el('h3', { text: title }), field('', ta, help)]);
}

/* ============================================================ agenda tab */

function renderAgendaTab(main) {
  const doc = state.doc;
  const today = todayIso();
  const dateInput = el('input', { type: 'date', min: today });
  const labelInput = el('input', { type: 'text', placeholder: 'bijv. Bezet, Geblokkeerd, Vakantie', value: 'Bezet' });
  const add = () => {
    const datum = dateInput.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return toast('Kies een datum.', 'error');
    const bestaand = doc.agenda.find((a) => a.datum === datum);
    if (bestaand) bestaand.label = labelInput.value.trim() || 'Bezet';
    else doc.agenda.push({ datum, label: labelInput.value.trim() || 'Bezet' });
    doc.agenda.sort((a, b) => a.datum.localeCompare(b.datum));
    dateInput.value = '';
    changed();
  };
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Datum blokkeren' }),
    el('p', { class: 'muted', text: 'Bij de datumcheck op de site ziet de bezoeker dan meteen "helaas bezet". Geboekte én privé-geblokkeerde dagen.' }),
    el('div', { class: 'pair triple' }, [dateInput, labelInput, el('button', { type: 'button', class: 'btn btn-amber btn-sm', text: 'Toevoegen', onclick: add })]),
  ]));

  const komend = doc.agenda.filter((a) => a.datum >= today);
  const voorbij = doc.agenda.filter((a) => a.datum < today);
  const row = (a) => el('li', { class: 'item-row' }, [
    el('div', { class: 'item-main' }, [el('span', { class: 'item-top' }, [el('strong', { text: formatDatum(a.datum) }), badge(a.label)])]),
    el('div', { class: 'row-actions' }, [iconBtn('Verwijderen', '✕', () => { doc.agenda.splice(doc.agenda.indexOf(a), 1); changed(); })]),
  ]);
  main.append(el('div', { class: 'list-head' }, [el('h2', { text: `${komend.length} komende data` })]));
  main.append(komend.length ? el('ul', { class: 'item-list boxed' }, komend.map(row)) : el('p', { class: 'empty', text: 'Nog geen geblokkeerde data. Alle dagen tonen "nog vrij".' }));
  if (voorbij.length) {
    main.append(el('details', { class: 'past' }, [
      el('summary', { text: `${voorbij.length} voorbije data` }),
      el('ul', { class: 'item-list boxed' }, voorbij.map(row)),
      el('button', { type: 'button', class: 'btn btn-ghost btn-xs', text: 'Voorbije data opruimen', onclick: () => { doc.agenda = komend; changed(); } }),
    ]));
  }
}

/* ============================================================== info tab */

function bound(obj, key, { textarea = false, placeholder = '', type = 'text', tall = false } = {}) {
  return el(textarea ? 'textarea' : 'input', {
    type: textarea ? null : type, rows: textarea ? 3 : null, class: tall ? 'tall' : null, placeholder, value: obj[key] ?? '',
    inputmode: type === 'number' ? 'numeric' : null,
    oninput: (e) => {
      obj[key] = type === 'number' ? (Math.max(0, Math.round(Number(e.target.value.replace(',', '.')))) || 0) : e.target.value;
      changed({ rerender: false });
    },
  });
}

function faqPanel(list) {
  const wrap = el('div', { class: 'pairs' });
  const draw = () => {
    clear(wrap);
    list.forEach((row, i) => wrap.append(el('div', { class: 'pair stacked' }, [
      el('div', { class: 'pair triple', style: { gridColumn: '1 / -1', padding: 0, border: 0 } }, [
        el('select', { value: row.type, onchange: (e) => { row.type = e.target.value; changed({ rerender: false }); } }, FAQ_TYPES.map((t) => el('option', { value: t, text: t }))),
        bound(row, 'vraag', { placeholder: 'Vraag' }),
        iconBtn('Omhoog', '↑', () => { move(list, i, -1); changed({ rerender: false }); draw(); }, i === 0 ? 'off' : ''),
        iconBtn('Verwijderen', '✕', () => { list.splice(i, 1); changed({ rerender: false }); draw(); }),
      ]),
      bound(row, 'antwoord', { textarea: true, placeholder: 'Antwoord' }),
    ])));
    wrap.append(el('button', {
      type: 'button', class: 'add-row small', text: '+ Vraag toevoegen',
      onclick: () => { list.push({ type: 'Algemeen', vraag: '', antwoord: '' }); changed({ rerender: false }); draw(); wrap.querySelector('.pair:last-of-type input')?.focus(); },
    }));
  };
  draw();
  return el('section', { class: 'panel' }, [el('h3', { text: 'Veelgestelde vragen' }), el('p', { class: 'muted small', text: 'Per feesttype; "Algemeen" staat op alle pagina\'s.' }), wrap]);
}

function werkwijzePanel(list) {
  const wrap = el('div', { class: 'pairs' });
  const draw = () => {
    clear(wrap);
    list.forEach((row, i) => wrap.append(el('div', { class: 'pair stacked' }, [
      bound(row, 'titel', { placeholder: 'Stap, bijv. Aanvraag' }),
      iconBtn('Omhoog', '↑', () => { move(list, i, -1); changed({ rerender: false }); draw(); }, i === 0 ? 'off' : ''),
      iconBtn('Verwijderen', '✕', () => { list.splice(i, 1); changed({ rerender: false }); draw(); }),
      bound(row, 'tekst', { textarea: true, placeholder: 'Wat gebeurt er in deze stap?' }),
    ])));
    wrap.append(el('button', {
      type: 'button', class: 'add-row small', text: '+ Stap toevoegen',
      onclick: () => { list.push({ titel: '', tekst: '' }); changed({ rerender: false }); draw(); wrap.querySelector('.pair:last-of-type input')?.focus(); },
    }));
  };
  draw();
  return el('section', { class: 'panel' }, [el('h3', { text: 'Werkwijze' }), el('p', { class: 'muted small', text: 'De eerste vier stappen staan op de homepage, alle stappen op "Zo werkt het".' }), wrap]);
}

function renderInfoTab(main) {
  const { info } = state.doc;
  const kg = info.kengetallen;

  // Schakelaar bureau-materiaal (§1a / §6a): met waarschuwing en bevestiging.
  const verborgen = verborgenBureau({ ...state.doc, info: { ...info, bureauMateriaal: false } });
  const sw = toggle('Materiaal uit DJ Company-opdrachten tonen', info.bureauMateriaal, async (v) => {
    if (v) {
      const ok = await confirmBox(`Weet je zeker dat je de ${verborgen.reviews} reviews, ${verborgen.media} foto's en ${verborgen.locaties} locatienamen uit opdrachten via ${BUREAU_BRON} op de website wilt tonen?\n\nDoe dit alleen na opzegging van de samenwerkingsovereenkomst én schriftelijke toestemming of juridisch advies (art. 5.1, 7.1, 7.2; boete art. 9.1: € 10.000 per overtreding).`, { okText: 'Ja, tonen', danger: true });
      if (!ok) { renderTab(); return; }
    }
    info.bureauMateriaal = v;
    changed();
  }, 'danger');
  main.append(el('section', { class: `panel ${info.bureauMateriaal ? 'warning' : ''}` }, [
    el('h3', { text: '⚖️ Materiaal van het bureau' }),
    sw,
    el('p', { class: 'muted small', text: `Zet dit alleen aan na opzegging van de samenwerkingsovereenkomst én schriftelijke toestemming of juridisch advies (art. 5.1, 7.1, 7.2, boete art. 9.1). Nu ${info.bureauMateriaal ? 'AAN: de site toont' : 'UIT: de site verbergt'} ${verborgen.reviews} reviews, ${verborgen.media} foto's en ${verborgen.locaties} locatienamen met herkomst "bureau".` }),
    field('Google-reviewlink', bound(info, 'googleReviewUrl', { type: 'url', placeholder: 'https://g.page/r/…/review' }), 'De link "Schrijf een review" van je Google Business Profile. Leeg = de Google-knoppen staan niet op de site.'),
  ]));

  main.append(
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Algemeen' }),
      field('Naam', bound(info, 'name')),
      field('Kop op de homepage', bound(info, 'kop', { placeholder: 'DJ Roggy — *de dansvloer vol*, de hele avond' }), 'De grote titel bovenaan de homepage. Tekst tussen sterretjes (*zo*) wordt amber.'),
      field('Tagline', bound(info, 'tagline', { placeholder: 'De dansvloer vol. De hele avond.' }), 'Staat in de footer van elke pagina.'),
      field('Intro (homepage)', bound(info, 'intro', { textarea: true })),
      field('Mededeling bovenaan', bound(info, 'announcement', { placeholder: 'bijv. December bijna vol: vraag snel aan' }), 'Leeg = geen mededeling. Handig voor tijdelijke berichten.'),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Contact & zakelijk' }),
      field('Telefoon', bound(info, 'phone', { placeholder: '06-12345678' })),
      field('WhatsApp', bound(info, 'whatsapp', { placeholder: '06-12345678' }), 'Wordt de WhatsApp-knop. Leeg = zelfde als telefoon.'),
      field('E-mail', bound(info, 'email', { placeholder: 'info@djroggy.nl' })),
      field('KvK-nummer', bound(info, 'kvk')),
      field('Btw-nummer', bound(info, 'btw', { placeholder: 'NL000000000B00' })),
      field('Postadres', bound(info, 'address', { textarea: true })),
      field('Instagram', bound(info, 'instagram', { placeholder: 'roggydouglas' })),
      field('Facebook', bound(info, 'facebook', { placeholder: 'roggy.douglas' })),
      field('LinkedIn', bound(info, 'linkedin', { placeholder: 'https://www.linkedin.com/in/…' }), 'Volledige link naar je profiel. Leeg = niet tonen.'),
      field('TikTok', bound(info, 'tiktok'), 'Leeg = niet tonen.'),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Werkgebied' }),
      field('Regio', bound(info, 'regio', { placeholder: 'Rotterdam & Zuid-Holland' })),
      field('Gratis reizen binnen (km)', bound(info, 'straalKm', { type: 'number' })),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Apparatuur & verzekering' }),
      field('Apparatuur (één regel per onderdeel)', el('textarea', { rows: 6, value: info.apparatuur.join('\n'), oninput: (e) => { info.apparatuur = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); changed({ rerender: false }); } })),
      toggle('Aansprakelijkheidsverzekering afgesloten', info.verzekerd, (v) => { info.verzekerd = v; changed({ rerender: false }); }),
      field('Tekst over de verzekering', bound(info, 'verzekerdTekst', { textarea: true }), 'Staat op de bedrijfsfeestpagina.'),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Over Roggy' }),
      field('Tekst (lege regel = nieuwe alinea)', bound(info, 'overTekst', { textarea: true, tall: true })),
    ]),
    werkwijzePanel(info.werkwijze),
    faqPanel(info.faq),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Kengetallen (ervaring)' }),
      el('p', { class: 'muted small', text: 'Staan altijd op de site, geformuleerd als eigen ervaring.' }),
      el('div', { class: 'num-grid' }, [
        field('Feesten', bound(kg, 'feesten', { type: 'number' })),
        field('Gasten', bound(kg, 'gasten', { type: 'number' })),
        field('Uren muziek', bound(kg, 'uren', { type: 'number' })),
        field('Locaties', bound(kg, 'locaties', { type: 'number' })),
      ]),
      toggle('Cijfer, aantal reviews en locaties automatisch uit de zichtbare reviews afleiden', kg.auto, (v) => { kg.auto = v; changed({ rerender: false }); }),
    ]),
    locatiesPanel(),
  );
}

function locatiesPanel() {
  const list = state.doc.locaties;
  const wrap = el('div', { class: 'pairs' });
  const draw = () => {
    clear(wrap);
    list.forEach((row, i) => wrap.append(el('div', { class: 'pair triple' }, [
      el('select', { value: row.herkomst, onchange: (e) => { row.herkomst = e.target.value; changed({ rerender: false }); } }, HERKOMST_OPTIONS.map((o) => el('option', { value: o.value, text: o.value === 'bureau' ? 'Bureau' : 'Eigen' }))),
      el('div', { class: 'pair', style: { padding: 0, border: 0, gridTemplateColumns: '1fr 1fr' } }, [bound(row, 'naam', { placeholder: 'Locatie' }), bound(row, 'plaats', { placeholder: 'Plaats' })]),
      iconBtn('Omhoog', '↑', () => { move(list, i, -1); changed({ rerender: false }); draw(); }, i === 0 ? 'off' : ''),
      iconBtn('Verwijderen', '✕', () => { list.splice(i, 1); changed({ rerender: false }); draw(); }),
    ])));
    wrap.append(el('button', {
      type: 'button', class: 'add-row small', text: '+ Locatie toevoegen',
      onclick: () => { list.push({ naam: '', plaats: '', herkomst: 'eigen' }); changed({ rerender: false }); draw(); wrap.querySelector('.pair:last-of-type input')?.focus(); },
    }));
  };
  draw();
  const verborgen = list.filter((l) => l.herkomst === 'bureau').length;
  return el('section', { class: 'panel' }, [
    el('h3', { text: 'Locaties waar ik draaide' }),
    el('p', { class: 'muted small', text: `Locaties met herkomst "Bureau" vallen onder de schakelaar bovenaan (${verborgen} stuks${state.doc.info.bureauMateriaal ? ', nu zichtbaar' : ', nu verborgen'}). Nieuwe directe boekingen: "Eigen".` }),
    wrap,
  ]);
}

/* ========================================================== settings tab */

function renderSettingsTab(main) {
  const demo = !!state.session.demo;
  const siteUrl = new URL('./', location.href).href;
  const owner = state.gistOwner || state.session.login || '';
  const needsConfig = !demo && state.gistId && (CONFIG.gistId !== state.gistId || (owner && CONFIG.gistOwner !== owner));

  if (needsConfig) {
    const line = `  gistId: '${state.gistId}',\n  gistOwner: '${owner}',`;
    main.append(el('section', { class: 'panel attention' }, [
      el('h3', { text: '⚠️ Nog één ding: bezoekers zien de Gist nog niet' }),
      el('p', { text: 'Op dit apparaat leest de site al uit je Gist, maar voor bezoekers moet hij nog in de code staan. Zet deze regels in assets/js/config.js en push:' }),
      el('pre', { class: 'code', text: line }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Kopieer regels', onclick: () => copy(line) }),
    ]));
  }

  const versie = document.querySelector('meta[name="version"]')?.content || '';
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Opslag' }),
    demo
      ? el('p', { class: 'muted', text: 'Je zit in de demo. Alles staat in deze browser; de website toont de demogegevens alleen hier.' })
      : el('dl', { class: 'kv' }, [
        el('dt', { text: 'Ingelogd als' }), el('dd', { text: state.session.login || '—' }),
        el('dt', { text: 'Gist' }), el('dd', {}, [el('a', { href: `https://gist.github.com/${state.gistId}`, target: '_blank', rel: 'noopener', text: state.gistId })]),
        el('dt', { text: 'Media-Gist' }), el('dd', { text: state.doc.info.media.gistId || 'nog niet aangemaakt (gebeurt bij de eerste upload)' }),
        el('dt', { text: 'Laatst gepubliceerd' }), el('dd', { text: state.baseUpdatedAt ? new Date(state.baseUpdatedAt).toLocaleString('nl-NL') : '—' }),
        el('dt', { text: 'Versie site' }), el('dd', { text: versie || '—' }),
      ]),
    el('div', { class: 'btn-row' }, [
      el('a', { class: 'btn btn-ghost btn-sm', href: siteUrl, target: '_blank', rel: 'noopener', text: 'Website openen ↗' }),
      el('a', { class: 'btn btn-ghost btn-sm', href: 'docs/handleiding.html', target: '_blank', rel: 'noopener', text: '📖 Handleiding' }),
      demo ? null : el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Opnieuw ophalen', onclick: reload }),
    ]),
  ]));

  if (!demo) {
    main.append(el('section', { class: 'panel' }, [
      el('h3', { text: 'Inloggen op je telefoon' }),
      el('p', { class: 'muted', text: 'Een link waarin je sleutel zit. Eén keer openen op je telefoon en je bent ingelogd. Deel hem met niemand: wie de link heeft, kan de site aanpassen.' }),
      el('button', {
        type: 'button', class: 'btn btn-ghost btn-sm', text: '🔑 Kopieer beheerlink',
        onclick: () => copy(`${new URL('beheer.html', location.href).href}#k=${encodeURIComponent(state.session.token)}`),
      }),
    ]));
  }

  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Back-up' }),
    el('p', { class: 'muted', text: 'Download alle gegevens als bestand, of zet een eerder bestand terug. Terugzetten wordt pas zichtbaar na publiceren.' }),
    el('div', { class: 'btn-row' }, [
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: '⬇ Download back-up', onclick: exportJson }),
      el('label', { class: 'btn btn-ghost btn-sm' }, [
        '⬆ Back-up terugzetten',
        el('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importJson }),
      ]),
      el('button', {
        type: 'button', class: 'btn btn-ghost btn-sm', text: '↺ Standaardgegevens',
        onclick: async () => {
          if (!(await confirmBox('Alle gegevens vervangen door de standaardgegevens uit de website-code (data/site.json)?', { okText: 'Vervangen', danger: true }))) return;
          state.doc = await bundledDoc();
          changed();
          renderShell();
        },
      }),
    ]),
  ]));

  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: demo ? 'Demo' : 'Afmelden' }),
    el('button', {
      type: 'button', class: 'btn btn-danger btn-sm',
      text: demo ? 'Demo verlaten en gegevens wissen' : 'Uitloggen op dit apparaat',
      onclick: logout,
    }),
  ]));
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Gekopieerd', 'ok');
  } catch {
    window.prompt('Kopieer:', text);
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.doc, null, 1)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `djroggy-site-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importJson(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed?.reviews) || !parsed?.info) throw new Error('Dit bestand bevat geen website-gegevens.');
    state.doc = normalize(parsed);
    changed();
    renderShell();
    toast('Back-up geladen. Controleer en publiceer.', 'ok', 4000);
  } catch (err) {
    toast(`Kon het bestand niet lezen: ${err.message}`, 'error', 5000);
  }
}

async function reload() {
  if (isDirty() && !(await confirmBox('Je niet-gepubliceerde wijzigingen gaan verloren. Doorgaan?', { danger: true }))) return;
  storageSet(DRAFT_KEY, null);
  await openGistOrSetup();
}

async function logout() {
  if (isDirty() && !(await confirmBox('Je hebt niet-gepubliceerde wijzigingen. Toch afmelden?', { okText: 'Afmelden', danger: true }))) return;
  if (state.session?.demo) { setDemoDoc(null); clearDemoMedia(); }
  storageSet(SESSION_KEY, null);
  storageSet(DRAFT_KEY, null);
  state.session = null;
  state.doc = null;
  renderLogin();
}

/* ================================================================== boot */

window.addEventListener('beforeunload', (e) => {
  if (isDirty() && !state.session?.demo) e.preventDefault();
});

async function boot() {
  // Inloggen via een link: beheer.html#k=<sleutel>. Meteen uit de adresbalk halen.
  const hash = new URLSearchParams(location.hash.slice(1));
  const fromLink = hash.get('k');
  if (fromLink) history.replaceState(null, '', location.pathname + location.search);

  const saved = storageGet(SESSION_KEY);
  try {
    if (fromLink) return await login(fromLink);
    if (saved?.demo) return await startDemo({ fresh: false });
    if (saved?.token) {
      state.session = saved;
      return await openGistOrSetup();
    }
  } catch (err) {
    return renderLogin(errorText(err));
  }
  renderLogin();
}

boot();
