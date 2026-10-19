import { CHAINS, CHAIN_BY_ID, DEFAULT_STATE } from './chains.js?v=6';
import { normalize, clone, loadLocal, saveLocal, encodeState, decodeState } from './state.js?v=6';
import { renderPoster } from './export.js?v=6';

const $ = (sel) => document.querySelector(sel);
const board = $('#board');
const itemsEl = $('#items');
const tilesEl = $('#tiles');
const poster = $('#poster');

let state = clone(DEFAULT_STATE);
let selected = null;

// ---------- Helpers ----------

const getItem = (id) => CHAIN_BY_ID.get(id) || state.c.find((c) => c.id === id);
const isPlaced = (id) => state.p.some((p) => p[0] === id);

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') node.style.cssText = v;
    else if (k.startsWith('data')) node.setAttribute(k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()), v);
    else node[k] = v;
  }
  node.append(...children.filter(Boolean));
  return node;
}

function badgeText(name) {
  if (name.length <= 10) return name.toUpperCase();
  return name.split(/\s+/).slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

function logoFor(item) {
  if (item.img) {
    return el('div', { class: 'logo', dataPaint: 'box' },
      el('img', { src: item.img, alt: '', draggable: false, dataPaint: 'img' }));
  }
  const b = item.badge || { bg: item.color, fg: '#fff', text: badgeText(item.name) };
  const size = Math.min(30, 140 / Math.max(b.text.length, 1));
  return el('div', { class: 'logo badge', dataPaint: 'box', style: `background:${b.bg};container-type:size` },
    el('span', { dataPaint: 'text', style: `color:${b.fg};font-size:${size}cqw`, textContent: b.text }));
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

let saveTimer;
function commit() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveLocal(state), 250);
  // Once you start editing a shared chart it becomes yours; drop the link from the address bar.
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  $('#banner').hidden = true;
}

// ---------- Rendering ----------

function renderText() {
  for (const node of document.querySelectorAll('[data-bind]')) {
    if (node === document.activeElement) continue;
    node.textContent = readPath(node.dataset.bind);
  }
}

function readPath(path) {
  return path.split('.').reduce((o, k) => o?.[k], state) ?? '';
}

function writePath(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], state)[last] = value;
}

function renderQuads() {
  document.querySelectorAll('.quad').forEach((quad, i) => {
    quad.replaceChildren(
      ...['qt', 'qc', 'qc'].map((cls, j) =>
        el('div', { class: cls, dataPaint: 'text', contentEditable: 'plaintext-only', spellcheck: false, dataBind: `q.${i}.${j}` }))
    );
  });
}

function renderItems() {
  itemsEl.replaceChildren(...state.p.map(([id, x, y]) => {
    const item = getItem(id);
    const node = el('div', { class: 'item' + (id === selected ? ' sel' : ''), dataId: id, style: `left:${x * 100}%;top:${y * 100}%` },
      logoFor(item),
      el('div', { class: 'name', dataPaint: 'text', textContent: item.name }),
      el('button', { class: 'remove', type: 'button', textContent: '×', title: 'Remove from chart', ariaLabel: `Remove ${item.name}` }));
    return node;
  }));
}

function renderTray() {
  const q = $('#search').value.trim().toLowerCase();
  const pool = [...state.c, ...CHAINS].filter((c) => !isPlaced(c.id) && c.name.toLowerCase().includes(q));
  tilesEl.replaceChildren(...pool.map((item) =>
    el('div', { class: 'tile', role: 'button', tabIndex: 0, dataId: item.id, title: `Add ${item.name}` },
      logoFor(item),
      el('span', { class: 'tname', textContent: item.name }),
      item.id.startsWith('c') && !CHAIN_BY_ID.has(item.id)
        ? el('button', { class: 'del', type: 'button', textContent: '×', title: 'Delete this custom item' }) : null)));
  if (!pool.length) tilesEl.append(el('div', { class: 'empty', textContent: q ? 'No matches.' : "Everything's on the chart!" }));
}

function render() {
  renderText();
  renderItems();
  renderTray();
  $('#names').checked = state.names;
  board.classList.toggle('hide-names', !state.names);
}

// ---------- Placing & dragging ----------

function place(id, x, y) {
  state.p = state.p.filter((p) => p[0] !== id);
  state.p.push([id, x, y]);
  selected = null;
  commit();
  render();
  itemsEl.querySelector(`[data-id="${CSS.escape(id)}"]`)?.classList.add('pop');
}

function placeNearCenter(id) {
  const jitter = () => 0.5 + (Math.random() - 0.5) * 0.16;
  place(id, jitter(), jitter());
  toast(`Added ${getItem(id).name} — drag it into place`);
}

function boardPoint(clientX, clientY) {
  const r = board.getBoundingClientRect();
  const clamp = (v) => Math.min(0.98, Math.max(0.02, v));
  return [clamp((clientX - r.left) / r.width), clamp((clientY - r.top) / r.height)];
}

function removeItem(id) {
  state.p = state.p.filter((p) => p[0] !== id);
  if (selected === id) selected = null;
  commit();
  render();
}

itemsEl.addEventListener('pointerdown', (e) => {
  const node = e.target.closest('.item');
  if (!node || e.button > 0) return;
  if (e.target.closest('.remove')) return;
  e.preventDefault();
  const id = node.dataset.id;
  const rect = node.querySelector('.logo').getBoundingClientRect();
  const off = [e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2)];
  const start = [e.clientX, e.clientY];
  let dragging = false;
  node.setPointerCapture(e.pointerId);
  node.classList.add('pressed');

  const move = (ev) => {
    if (!dragging && Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) < 4) return;
    if (!dragging) {
      dragging = true;
      node.classList.add('dragging');
      itemsEl.append(node); // bring to front
    }
    const [x, y] = boardPoint(ev.clientX - off[0], ev.clientY - off[1]);
    node.style.left = `${x * 100}%`;
    node.style.top = `${y * 100}%`;
    node._pos = [x, y];
  };
  const end = () => {
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerup', end);
    node.removeEventListener('pointercancel', end);
    node.classList.remove('dragging', 'pressed');
    if (dragging && node._pos) {
      state.p = state.p.filter((p) => p[0] !== id);
      state.p.push([id, ...node._pos]); // last in the list renders on top
      commit();
    } else {
      selected = selected === id ? null : id;
    }
    renderItems();
  };
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
});

itemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove');
  if (btn) removeItem(btn.closest('.item').dataset.id);
});

board.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.item') && selected) { selected = null; renderItems(); }
});

document.addEventListener('keydown', (e) => {
  if (!selected || e.target.closest('[contenteditable], input, dialog')) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeItem(selected); }
  if (e.key === 'Escape') { selected = null; renderItems(); }
});

// Tray: tap to add, or drag a tile onto the chart. Mouse drags use pointer events.
// Touch drags use touch events, because iOS Safari ignores touch-action inside a
// scrolling strip and cancels the pointer as soon as the finger moves. The strip
// scrolls one way, so a touch drag starts only when the finger goes the other way
// (up out of the bottom bar, sideways out of the sidebar).
const dockedTray = matchMedia('(max-width: 860px)');
const TOUCH_LIFT = 44; // keep the logo visible above the finger

function trayDrag(id) {
  const ghost = el('div', { class: 'ghost-drag' }, logoFor(getItem(id)));
  document.body.append(ghost);
  return {
    move(x, y) { ghost.style.left = `${x}px`; ghost.style.top = `${y}px`; },
    drop(x, y) {
      ghost.remove();
      const r = board.getBoundingClientRect();
      if (x > r.left && x < r.right && y > r.top && y < r.bottom) place(id, ...boardPoint(x, y));
    },
    cancel() { ghost.remove(); },
  };
}

tilesEl.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button > 0 || e.target.closest('.del')) return;
  const tile = e.target.closest('.tile');
  if (!tile) return;
  const id = tile.dataset.id;
  const start = [e.clientX, e.clientY];
  let drag = null;

  const move = (ev) => {
    if (!drag && Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) < 5) return;
    drag ??= trayDrag(id);
    drag.move(ev.clientX, ev.clientY);
  };
  const end = (ev) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    if (drag) drag.drop(ev.clientX, ev.clientY);
    else placeNearCenter(id);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
});

let touchDrag = null;

tilesEl.addEventListener('touchstart', (e) => {
  const tile = e.target.closest('.tile');
  if (!tile || e.touches.length > 1 || e.target.closest('.del')) { touchDrag = null; return; }
  const t = e.touches[0];
  touchDrag = { id: tile.dataset.id, x: t.clientX, y: t.clientY, moved: false, drag: null };
}, { passive: true });

tilesEl.addEventListener('touchmove', (e) => {
  const s = touchDrag;
  if (!s) return;
  const t = e.touches[0];
  const dx = t.clientX - s.x, dy = t.clientY - s.y;
  if (!s.drag) {
    const across = dockedTray.matches ? Math.abs(dy) > Math.abs(dx) : Math.abs(dx) > Math.abs(dy);
    // Claim the gesture from the first move, before iOS commits to scrolling the page.
    if (Math.hypot(dx, dy) < 8) { if (across) e.preventDefault(); return; }
    s.moved = true;
    if (!across) { touchDrag = null; return; } // the user is scrolling the tray
    s.drag = trayDrag(s.id);
  }
  e.preventDefault(); // stop the tray/page from scrolling while dragging
  s.drag.move(t.clientX, t.clientY - TOUCH_LIFT);
}, { passive: false });

tilesEl.addEventListener('touchend', (e) => {
  const s = touchDrag;
  touchDrag = null;
  if (!s) return;
  const t = e.changedTouches[0];
  e.preventDefault(); // no follow-up mouse/click events
  if (s.drag) s.drag.drop(t.clientX, t.clientY - TOUCH_LIFT);
  else if (!s.moved) placeNearCenter(s.id);
});

tilesEl.addEventListener('touchcancel', () => {
  touchDrag?.drag?.cancel();
  touchDrag = null;
});

tilesEl.addEventListener('keydown', (e) => {
  const tile = e.target.closest('.tile');
  if (tile && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); placeNearCenter(tile.dataset.id); }
});

tilesEl.addEventListener('click', (e) => {
  const del = e.target.closest('.del');
  if (!del) return;
  const id = del.closest('.tile').dataset.id;
  if (!confirm(`Delete "${getItem(id).name}"?`)) return;
  state.c = state.c.filter((c) => c.id !== id);
  commit();
  render();
});

$('#search').addEventListener('input', renderTray);
$('#names').addEventListener('change', (e) => { state.names = e.target.checked; commit(); render(); });

// ---------- Editable text ----------

poster.addEventListener('input', (e) => {
  const node = e.target.closest('[data-bind]');
  if (!node) return;
  writePath(node.dataset.bind, node.textContent.replace(/\s+/g, ' ').slice(0, node.dataset.bind === 'title' || node.dataset.bind === 'sub' ? 80 : 40));
  commit();
});
poster.addEventListener('keydown', (e) => {
  if (e.target.closest('[data-bind]') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
});
poster.addEventListener('paste', (e) => {
  if (!e.target.closest('[data-bind]')) return;
  e.preventDefault();
  document.execCommand('insertText', false, (e.clipboardData?.getData('text/plain') || '').replace(/\s+/g, ' '));
});
poster.addEventListener('focusout', (e) => { if (e.target.closest('[data-bind]')) renderText(); });

// ---------- Custom items ----------

const dlgCustom = $('#dlg-custom');
let customImg = null;

async function shrinkImage(file, max = 80) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * s));
    c.height = Math.max(1, Math.round(img.naturalHeight * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    // Small images keep share links short. WebP when the browser can encode it, else the smaller of PNG/JPEG.
    const webp = c.toDataURL('image/webp', 0.8);
    if (webp.startsWith('data:image/webp')) return webp;
    const png = c.toDataURL('image/png');
    const ctx = c.getContext('2d');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    const jpg = c.toDataURL('image/jpeg', 0.82);
    return jpg.length < png.length * 0.7 ? jpg : png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function renderPreview() {
  const name = $('#custom-name').value.trim() || 'Your spot';
  const item = { name, img: customImg, color: $('#custom-color').value };
  $('#custom-preview').replaceChildren(logoFor(item), el('div', { class: 'name', textContent: name }));
}

$('#btn-custom-m').addEventListener('click', () => $('#btn-custom').click());

$('#btn-custom').addEventListener('click', () => {
  $('#form-custom').reset();
  customImg = null;
  $('#custom-color').value = ['#e4572e', '#2e86ab', '#7b2cbf', '#2a9d8f', '#f4a261', '#d62828'][Math.floor(Math.random() * 6)];
  renderPreview();
  dlgCustom.showModal();
});
$('#custom-name').addEventListener('input', renderPreview);
$('#custom-color').addEventListener('input', renderPreview);
$('#custom-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  customImg = null;
  if (file) {
    try { customImg = await shrinkImage(file); } catch { toast("Couldn't read that image"); }
  }
  renderPreview();
});
dlgCustom.addEventListener('close', () => {
  if (dlgCustom.returnValue !== 'ok') return;
  const name = $('#custom-name').value.trim().slice(0, 24);
  if (!name) return;
  const id = 'c' + Date.now().toString(36);
  state.c.push({ id, name, img: customImg, color: $('#custom-color').value });
  placeNearCenter(id);
});

// ---------- Share link ----------

const dlgShare = $('#dlg-share');

$('#btn-share').addEventListener('click', async () => {
  selected = null;
  renderItems();
  const url = `${location.origin}${location.pathname}#s=${await encodeState(state)}`;
  $('#share-url').value = url;
  const warn = $('#share-warn');
  warn.hidden = url.length < 12000;
  warn.textContent = `This link is long (${Math.round(url.length / 1000)}k characters) because your uploaded images travel inside it. Most apps handle it, but if it gets cut off, try fewer or simpler custom images.`;
  $('#btn-native-share').hidden = !navigator.share;
  dlgShare.showModal();
  $('#share-url').select();
});

$('#btn-copy').addEventListener('click', async () => {
  const input = $('#share-url');
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select();
    document.execCommand('copy');
  }
  toast('Link copied');
});

$('#btn-native-share').addEventListener('click', async () => {
  try {
    await navigator.share({ title: state.title, text: 'Look at my chart 🍔', url: $('#share-url').value });
  } catch { /* user dismissed the sheet */ }
});

// ---------- Save image ----------

$('#btn-image').addEventListener('click', async () => {
  selected = null;
  renderItems();
  document.activeElement?.blur();
  const btn = $('#btn-image');
  btn.disabled = true;
  try {
    const blob = await renderPoster(poster);
    const file = new File([blob], 'fast-food-plot.png', { type: 'image/png' });
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: state.title }); } catch { /* dismissed */ }
    } else {
      const a = el('a', { href: URL.createObjectURL(blob), download: file.name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('Image saved');
    }
  } catch (err) {
    console.error(err);
    toast("Couldn't make the image");
  } finally {
    btn.disabled = false;
  }
});

// ---------- Clear / reset ----------

$('#btn-clear').addEventListener('click', () => {
  if (!state.p.length || !confirm('Move everything off the chart?')) return;
  state.p = [];
  selected = null;
  commit();
  render();
});

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Go back to the example chart? Your labels and positions will be replaced (custom items stay in the tray).')) return;
  state = { ...clone(DEFAULT_STATE), c: state.c };
  selected = null;
  commit();
  render();
});

// ---------- Boot ----------

async function loadFromHash() {
  const m = location.hash.match(/^#s=([A-Za-z0-9_-]+)$/);
  if (!m) return false;
  try {
    state = await decodeState(m[1]);
    $('#banner').hidden = false;
    return true;
  } catch (err) {
    console.error(err);
    toast("That share link looks broken, so here's your own chart");
    return false;
  }
}

window.addEventListener('hashchange', async () => {
  if (await loadFromHash()) { selected = null; render(); }
});

renderQuads();
if (!(await loadFromHash())) state = loadLocal() || normalize(clone(DEFAULT_STATE));
render();
