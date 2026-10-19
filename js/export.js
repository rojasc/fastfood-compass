// Paints the poster onto a canvas by walking elements marked with data-paint.
// Every image is same-origin or a data: URL, so the canvas stays exportable.

const GRID_CELLS = 16; // must match background-size in styles.css

export async function renderPoster(root) {
  await document.fonts.ready;
  const R = root.getBoundingClientRect();
  const scale = Math.max(2, 1400 / R.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(R.width * scale);
  canvas.height = Math.round(R.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = getComputedStyle(root).backgroundColor;
  ctx.fillRect(0, 0, R.width, R.height);

  for (const el of root.querySelectorAll('[data-paint]')) await paint(ctx, el, R);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function paint(ctx, el, R) {
  const cs = getComputedStyle(el);
  const b = el.getBoundingClientRect();
  if (cs.display === 'none' || cs.visibility === 'hidden' || !b.width || !b.height) return;
  const x = b.left - R.left, y = b.top - R.top, w = b.width, h = b.height;
  const kind = el.dataset.paint;
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;

  if (kind === 'tri-up' || kind === 'tri-down') {
    ctx.fillStyle = cs.backgroundColor;
    ctx.beginPath();
    if (kind === 'tri-up') { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); }
    else { ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w / 2, y + h); }
    ctx.fill();
    return;
  }

  if (!/rgba\(.*,\s*0\)|transparent/.test(cs.backgroundColor)) {
    ctx.fillStyle = cs.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }

  if (kind === 'grid') {
    ctx.strokeStyle = getComputedStyle(el).getPropertyValue('--grid').trim() || '#e8e4db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID_CELLS; i++) {
      const gx = x + (w * i) / GRID_CELLS, gy = y + (h * i) / GRID_CELLS;
      ctx.moveTo(gx, y); ctx.lineTo(gx, y + h);
      ctx.moveTo(x, gy); ctx.lineTo(x + w, gy);
    }
    ctx.stroke();
  } else if (kind === 'img') {
    if (!el.complete) await el.decode().catch(() => {});
    if (!el.naturalWidth) return;
    const s = Math.min(w / el.naturalWidth, h / el.naturalHeight);
    const iw = el.naturalWidth * s, ih = el.naturalHeight * s;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, radius);
    ctx.clip();
    ctx.drawImage(el, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    ctx.restore();
  } else if (kind === 'text') {
    drawText(ctx, el, cs, x, y, w, h);
  }
}

function drawText(ctx, el, cs, x, y, w, h) {
  let text = el.textContent.trim();
  if (!text) return;
  if (cs.textTransform === 'uppercase') text = text.toUpperCase();
  const pad = (side) => parseFloat(cs[`padding${side}`]) || 0;
  const fs = parseFloat(cs.fontSize);
  const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);

  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
  ctx.fillStyle = cs.color;
  ctx.textBaseline = 'middle';

  const cw = w - pad('Left') - pad('Right');
  const ch = h - pad('Top') - pad('Bottom');
  const lines = h - pad('Top') - pad('Bottom') > lh * 1.5 ? wrap(ctx, text, cw) : [text];
  const align = cs.textAlign;
  let tx = x + pad('Left');
  if (align === 'center') { ctx.textAlign = 'center'; tx += cw / 2; }
  else if (align === 'right' || align === 'end') { ctx.textAlign = 'right'; tx = x + w - pad('Right'); }
  else ctx.textAlign = 'left';

  const top = y + pad('Top') + (ch - lines.length * lh) / 2;
  lines.forEach((line, i) => ctx.fillText(line, tx, top + lh * (i + 0.5)));
}

function wrap(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width + 1) { lines.push(line); line = word; }
    else line = next;
  }
  lines.push(line);
  return lines;
}
