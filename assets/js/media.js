/* Foto's: afbeeldingen als data-URL-tekstbestanden in een eigen Gist, zodat
   het databestand zelf klein en snel blijft. Elke foto krijgt een nieuw id en
   verandert nooit, dus cachen is veilig. (Zelfde opzet als posters.js in
   passthedutchie; hier max. 1600 px.) */

import { readRawFile } from './gist.js';
import { storageGet, storageSet } from './store.js';

const DEMO_KEY = 'djr.demo.media';
const memory = new Map();

export const mediaFile = (id) => `${id}.txt`;

export function demoMedia() { return storageGet(DEMO_KEY, {}) || {}; }
export function setDemoMedia(id, dataUrl) {
  const all = demoMedia();
  if (dataUrl === null) delete all[id];
  else all[id] = dataUrl;
  storageSet(DEMO_KEY, Object.keys(all).length ? all : null);
}
export function clearDemoMedia() { storageSet(DEMO_KEY, null); }

export function rememberMedia(id, dataUrl) { memory.set(id, Promise.resolve(dataUrl)); }

/** Lost op naar een data-URL, of null als de foto niet te vinden is. */
export function loadMedia(id, media, { demo = false } = {}) {
  if (!id) return Promise.resolve(null);
  if (memory.has(id)) return memory.get(id);
  let job;
  if (demo) job = Promise.resolve(demoMedia()[id] || null);
  else if (media?.gistId && media?.owner) {
    job = readRawFile(media.owner, media.gistId, mediaFile(id))
      .then((text) => (text.startsWith('data:image/') ? text : null))
      .catch(() => null);
  } else job = Promise.resolve(null);
  memory.set(id, job);
  job.then((v) => { if (v === null) memory.delete(id); });
  return job;
}

/**
 * De URL van een galerij-item: foto's uit de repo direct, foto's uit de
 * media-Gist via loadMedia. Geeft een Promise naar een string of null.
 */
export function mediaUrl(item, doc, { demo = false } = {}) {
  if (!item) return Promise.resolve(null);
  if (item.bron === 'gist') return loadMedia(item.id, doc.info.media, { demo });
  return Promise.resolve(item.pad || null);
}

/** Verkleint een foto in de browser tot een JPEG-data-URL van hoogstens ~600 kB. */
export async function compressImage(file, { maxSide = 1600, maxBytes = 600_000 } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Dit bestand is geen afbeelding die de browser kan openen.'));
      i.src = url;
    });
    let side = maxSide;
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0E0E11'; // transparante PNG's op de sitekleur zetten
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', attempt < 3 ? 0.82 : 0.7);
      if (dataUrl.length <= maxBytes || attempt === 5) return dataUrl;
      side = Math.round(side * 0.8);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
  return null;
}
