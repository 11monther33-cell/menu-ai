/**
 * snapCard.ts — VISIONO Snap Card Generator
 * Takes the Three.js canvas frame + branding → exports a 9:16 PNG
 * ready to share directly to Snapchat, Instagram Stories, or download.
 *
 * Runs entirely in the browser (Canvas API). Zero server call.
 *
 * Security: sanitizes all text inputs before drawing on canvas.
 */

export interface SnapCardOptions {
  dishFrame      : string;   // base64 PNG from Three.js captureFrame()
  dishName       : string;
  price          : string;
  primaryColor   : string;
  streakCount   ?: number;   // optional streak badge
  restaurantName?: string;
}

// Sanitize text to prevent canvas injection of control chars
function sanitize(text: string, maxLen: number = 100): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, '')   // strip control characters
    .substring(0, maxLen)
    .trim();
}

/**
 * buildSnapCard
 * Returns a Blob of the 1080×1920 PNG card.
 */
export async function buildSnapCard(opts: SnapCardOptions): Promise<Blob> {
  const {
    dishFrame,
    primaryColor,
    streakCount,
  } = opts;

  const dishName       = sanitize(opts.dishName, 80);
  const price          = sanitize(opts.price, 30);
  const restaurantName = opts.restaurantName ? sanitize(opts.restaurantName, 60) : undefined;

  // ── Parse color ─────────────────────────────────────────────────
  const hex      = primaryColor.replace('#', '');
  const r        = parseInt(hex.substring(0, 2), 16) || 0;
  const g        = parseInt(hex.substring(2, 4), 16) || 0;
  const b        = parseInt(hex.substring(4, 6), 16) || 0;
  const rgbStr   = `${r},${g},${b}`;
  const darkBg   = `rgb(${Math.max(r - 90, 0)},${Math.max(g - 90, 0)},${Math.max(b - 90, 0)})`;

  // ── Canvas setup ────────────────────────────────────────────────
  const W = 1080;
  const H = 1920;
  const canvas  = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext('2d')!;

  // ── Background: dark gradient ────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0,   '#07070a');
  bgGrad.addColorStop(0.6, '#0e0c0a');
  bgGrad.addColorStop(1,   darkBg);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Decorative circle glow (brand color) ─────────────────────────
  const radial = ctx.createRadialGradient(W/2, H*0.45, 0, W/2, H*0.45, 600);
  radial.addColorStop(0,   `rgba(${rgbStr},0.18)`);
  radial.addColorStop(1,   `rgba(${rgbStr},0)`);
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // ── Dish 3D render (centered) ─────────────────────────────────────
  if (dishFrame) {
    await new Promise<void>((resolve) => {
      const img   = new Image();
      img.onload  = () => {
        const size = 860;
        const x    = (W - size) / 2;
        const y    = H * 0.22;

        // Subtle drop shadow beneath dish
        ctx.save();
        ctx.shadowColor   = `rgba(${rgbStr},0.5)`;
        ctx.shadowBlur    = 90;
        ctx.shadowOffsetY = 30;
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();

        resolve();
      };
      img.onerror = () => resolve(); // Don't block on failed image
      img.src = dishFrame;
    });
  }

  // ── Top branding bar ─────────────────────────────────────────────
  ctx.fillStyle = primaryColor;
  roundRect(ctx, 0, 0, W, 130, 0);
  ctx.fill();

  // Restaurant name (top)
  if (restaurantName) {
    ctx.fillStyle    = 'rgba(0,0,0,0.6)';
    ctx.font         = 'bold 40px "IBM Plex Sans Arabic", Cairo, Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(restaurantName, W / 2, 65);
  }

  // ── VISIONO logo badge (top-right) ─────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, W - 160, 20, 140, 56, 14);
  ctx.fill();
  ctx.fillStyle    = 'white';
  ctx.font         = 'bold 30px "DM Sans", "Space Grotesk", Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VISIONO', W - 90, 48);

  // ── Dish name ─────────────────────────────────────────────────────
  ctx.fillStyle    = 'white';
  ctx.font         = 'bold 88px "IBM Plex Sans Arabic", Cairo, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';

  // Auto-shrink text if too long
  let fontSize = 88;
  while (ctx.measureText(dishName).width > W - 80 && fontSize > 40) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px "IBM Plex Sans Arabic", Cairo, Arial`;
  }
  ctx.fillText(dishName, W / 2, H * 0.78);

  // ── Price pill ────────────────────────────────────────────────────
  const priceW = Math.max(ctx.measureText(price).width + 80, 260);
  const priceX = (W - priceW) / 2;
  const priceY = H * 0.82;

  ctx.fillStyle = primaryColor;
  roundRect(ctx, priceX, priceY, priceW, 90, 45);
  ctx.fill();

  ctx.fillStyle    = '#0a0a0e';
  ctx.font         = 'bold 52px "DM Sans", "Space Grotesk", Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(price, W / 2, priceY + 45);

  // ── Streak badge (if user has a streak) ───────────────────────────
  if (streakCount && streakCount >= 2) {
    ctx.fillStyle = '#ff6b00';
    roundRect(ctx, 50, H * 0.82, 200, 90, 20);
    ctx.fill();

    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 44px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔥 ${streakCount}`, 150, H * 0.82 + 45);
  }

  // ── Bottom CTA strip ──────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, H - 120, W, 120);

  ctx.fillStyle    = 'rgba(255,255,255,0.35)';
  ctx.font         = '34px "IBM Plex Sans Arabic", Cairo, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('امسح الكود لترى الطبق بتقنية 3D على طاولتك!', W / 2, H - 80);

  ctx.fillStyle    = 'rgba(255,255,255,0.18)';
  ctx.font         = '26px "DM Sans", "Space Grotesk", Arial';
  ctx.fillText('VISIONOapp.com', W / 2, H - 40);

  // ── Export to Blob ─────────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Failed to export snap card')),
      'image/png',
      0.95
    );
  });
}

// Helper: rounded rect
function roundRect(
  ctx  : CanvasRenderingContext2D,
  x    : number, y: number,
  w    : number, h: number,
  r    : number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
