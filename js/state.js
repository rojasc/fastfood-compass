import { CHAIN_BY_ID, DEFAULT_STATE } from './chains.js?v=7';

const STORE_KEY = 'ffplot:v1';
const IMG_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const COLOR_RE = /^#[0-9a-f]{6}$/i;

const str = (v, fallback, max = 80) => (typeof v === 'string' ? v.slice(0, max) : fallback);
const num01 = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5);

export const clone = (s) => JSON.parse(JSON.stringify(s));

// Coerce anything (localStorage, a shared link) into a valid state.
// Shared links come from other people, so nothing is trusted as-is.
export function normalize(raw) {
  const d = DEFAULT_STATE;
  const r = raw && typeof raw === 'object' ? raw : {};
  const ax = Array.isArray(r.ax) ? r.ax : [];
  const q = Array.isArray(r.q) ? r.q : [];

  const c = (Array.isArray(r.c) ? r.c : [])
    .filter((x) => x && /^c[a-z0-9]{1,20}$/.test(x.id) && typeof x.name === 'string')
    .slice(0, 60)
    .map((x) => ({
      id: x.id,
      name: x.name.slice(0, 24),
      img: typeof x.img === 'string' && x.img.length < 200_000 && IMG_RE.test(x.img) ? x.img : null,
      color: COLOR_RE.test(x.color) ? x.color : '#e4572e',
    }));
  const customIds = new Set(c.map((x) => x.id));

  const seen = new Set();
  const p = (Array.isArray(r.p) ? r.p : [])
    .filter((x) => Array.isArray(x) && (CHAIN_BY_ID.has(x[0]) || customIds.has(x[0])))
    .filter((x) => !seen.has(x[0]) && seen.add(x[0]))
    .map(([id, x, y]) => [id, num01(x), num01(y)]);

  return {
    title: str(r.title, d.title),
    sub: str(r.sub, d.sub),
    ax: d.ax.map((v, i) => str(ax[i], v, 40)),
    q: d.q.map((lines, i) => lines.map((v, j) => str(Array.isArray(q[i]) ? q[i][j] : undefined, v, 40))),
    names: typeof r.names === 'boolean' ? r.names : true,
    c,
    p,
  };
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLocal(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or quota full: the chart still works, it just won't persist.
  }
}

// --- Share links: state → compact JSON → deflate → base64url in the URL hash ---

const round = (v) => Math.round(v * 1000);

function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export async function encodeState(state) {
  const compact = { ...state, p: state.p.map(([id, x, y]) => [id, round(x), round(y)]) };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  if ('CompressionStream' in window) return 'z' + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
  return 'j' + toBase64Url(bytes);
}

export async function decodeState(code) {
  let bytes = fromBase64Url(code.slice(1));
  if (code[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (code[0] !== 'j') throw new Error('Unknown link format');
  const raw = JSON.parse(new TextDecoder().decode(bytes));
  if (Array.isArray(raw.p)) raw.p = raw.p.map((x) => (Array.isArray(x) ? [x[0], x[1] / 1000, x[2] / 1000] : x));
  return normalize(raw);
}
