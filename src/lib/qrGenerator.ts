/**
 * qrGenerator.ts — VISIONO QR Code System (Server-side)
 * Generates branded QR code SVG + print-ready PDF A5.
 * Uses: qrcode + pdf-lib + sharp.
 * Adapted for Express + unified storage (local/R2).
 */

import QRCode  from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp   from 'sharp';
import { uploadFile } from './storage';

// ── Types ────────────────────────────────────────────────────────────
export interface QrGenerateInput {
  restaurantId   : string;
  restaurantSlug : string;
  restaurantNameAr: string;
  restaurantNameEn: string;
  primaryColor   : string;
  tableNumber    : string;
  tableLabel    ?: string;
  logoUrl       ?: string;        // restaurant logo URL
}

export interface QrGenerateResult {
  qrUrl     : string;             // the URL encoded in QR
  svgUrl    : string;             // uploaded SVG URL
  pdfUrl    : string;             // uploaded PDF URL
}

// ── Sanitize inputs ──────────────────────────────────────────────────
function sanitize(text: string, maxLen: number = 100): string {
  return text.replace(/[<>"'&]/g, '').substring(0, maxLen).trim();
}

function sanitizeColor(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#C9A84C';
}

// ── Main function ────────────────────────────────────────────────────
export async function generateTableQR(input: QrGenerateInput): Promise<QrGenerateResult> {
  const {
    restaurantId,
    restaurantSlug,
    primaryColor: rawColor,
    tableNumber: rawTable,
    tableLabel: rawLabel,
  } = input;

  const restaurantNameAr = sanitize(input.restaurantNameAr);
  const restaurantNameEn = sanitize(input.restaurantNameEn);
  const primaryColor     = sanitizeColor(rawColor);
  const tableNumber      = sanitize(rawTable, 20);
  const tableLabel       = rawLabel ? sanitize(rawLabel, 50) : undefined;

  // 1. Build the QR target URL
  const slug  = sanitize(restaurantSlug, 50);
  const qrUrl = `${process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:5173'}/menu/${slug}?table=${tableNumber}`;

  // 2. Generate branded SVG
  const svgContent = await buildBrandedQRSvg({ qrUrl, primaryColor, tableNumber, tableLabel });

  // 3. Upload SVG
  const svgKey = `qr/${restaurantId}/table-${tableNumber}.svg`;
  const svgResult = await uploadFile(
    Buffer.from(svgContent, 'utf-8'),
    svgKey,
    'image/svg+xml'
  );

  // 4. Generate A5 print PDF
  const pdfBuffer = await buildPrintPDF({
    svgContent,
    restaurantNameAr,
    restaurantNameEn,
    primaryColor,
    tableNumber,
    tableLabel,
    qrUrl,
  });

  // 5. Upload PDF
  const pdfKey = `qr/${restaurantId}/table-${tableNumber}-print.pdf`;
  const pdfResult = await uploadFile(
    pdfBuffer,
    pdfKey,
    'application/pdf'
  );

  return {
    qrUrl,
    svgUrl: svgResult.url,
    pdfUrl: pdfResult.url,
  };
}

// ── Build branded SVG ────────────────────────────────────────────────
async function buildBrandedQRSvg(opts: {
  qrUrl        : string;
  primaryColor : string;
  tableNumber  : string;
  tableLabel  ?: string;
}): Promise<string> {
  const { qrUrl, primaryColor, tableNumber, tableLabel } = opts;
  const SIZE = 400;

  // QR base SVG (high error correction for logo overlay)
  const baseSvg = await QRCode.toString(qrUrl, {
    type: 'svg',
    width: SIZE,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });

  // ── Inject VISIONO TX badge in center ──────────────────────────────
  const centerX  = SIZE / 2;
  const centerY  = SIZE / 2;
  const badgeR   = SIZE * 0.09;      // radius of center badge
  const badgeX   = centerX - badgeR;
  const badgeY   = centerY - badgeR;
  const badgeW   = badgeR * 2;
  const badgeH   = badgeR * 2;

  // ── Inject bottom branding strip + corner label ───────────────────
  const strip = `
  <!-- Center TX badge -->
  <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}"
        rx="${badgeR * 0.25}" fill="${primaryColor}"/>
  <text x="${centerX}" y="${centerY + badgeR * 0.22}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${badgeR * 0.72}" font-weight="bold" fill="white">VO</text>

  <!-- Table label at bottom -->
  <rect x="0" y="${SIZE - 48}" width="${SIZE}" height="48" fill="${primaryColor}"/>
  <text x="${centerX}" y="${SIZE - 28}"
        text-anchor="middle" font-family="Cairo, Arial, sans-serif"
        font-size="13" font-weight="bold" fill="white">
    ${tableLabel ? sanitize(tableLabel) + ' —' : ''} طاولة ${sanitize(tableNumber)}
  </text>
  <text x="${centerX}" y="${SIZE - 10}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="9" fill="rgba(255,255,255,0.65)">VISIONOapp.com</text>
  `;

  return baseSvg.replace('</svg>', strip + '</svg>');
}

// ── Build print PDF (A5 landscape) ───────────────────────────────────
async function buildPrintPDF(opts: {
  svgContent       : string;
  restaurantNameAr : string;
  restaurantNameEn : string;
  primaryColor     : string;
  tableNumber      : string;
  tableLabel      ?: string;
  qrUrl            : string;
}): Promise<Buffer> {
  const { svgContent, restaurantNameAr, restaurantNameEn, primaryColor, tableNumber, tableLabel } = opts;

  // Convert SVG → PNG (via sharp)
  const pngBuf = await sharp(Buffer.from(svgContent))
    .resize(400, 400)
    .png()
    .toBuffer();

  // Create PDF (A5: 148×210mm → ~419×595pt)
  const doc  = await PDFDocument.create();
  const page = doc.addPage([419, 595]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await doc.embedFont(StandardFonts.Helvetica);

  // Parse hex color
  const h = primaryColor.replace('#', '');
  const pr = parseInt(h.substring(0,2), 16) / 255;
  const pg = parseInt(h.substring(2,4), 16) / 255;
  const pb = parseInt(h.substring(4,6), 16) / 255;

  // Background
  page.drawRectangle({ x:0, y:0, width, height, color: rgb(0.97, 0.97, 0.95) });

  // Header bar
  page.drawRectangle({ x:0, y:height-72, width, height:72, color:rgb(pr,pg,pb) });
  page.drawText(restaurantNameAr, {
    x:16, y:height-30, size:17, font:fontBold, color:rgb(1,1,1),
  });
  page.drawText(restaurantNameEn, {
    x:16, y:height-52, size:12, font:fontReg, color:rgb(1,1,1),
  });

  // QR image (centered)
  const qrImg  = await doc.embedPng(pngBuf);
  const qrSize = 270;
  const qrX    = (width - qrSize) / 2;
  const qrY    = (height - 72 - qrSize) / 2 + 20;
  page.drawImage(qrImg, { x:qrX, y:qrY, width:qrSize, height:qrSize });

  // Instruction text
  const arInstr = 'Scan to view our 3D interactive menu';
  page.drawText(arInstr, {
    x: (width - fontReg.widthOfTextAtSize(arInstr, 9)) / 2,
    y: qrY - 16, size:9, font:fontReg, color:rgb(0.55,0.55,0.55),
  });

  // Table badge
  const tbText = tableLabel ? `${tableLabel} · Table ${tableNumber}` : `Table ${tableNumber}`;
  const tbW    = 200;
  const tbX    = (width - tbW) / 2;
  page.drawRectangle({
    x:tbX, y:14, width:tbW, height:30,
    color:rgb(1,1,1),
    borderColor:rgb(pr,pg,pb), borderWidth:1.5,
  });
  page.drawText(tbText, {
    x: tbX + (tbW - fontBold.widthOfTextAtSize(tbText, 12)) / 2,
    y: 23, size:12, font:fontBold, color:rgb(pr,pg,pb),
  });

  // Powered by footer
  page.drawText('Powered by VISIONO', {
    x: width - 120, y:4, size:7, font:fontReg, color:rgb(0.75,0.75,0.75),
  });

  return Buffer.from(await doc.save());
}

// ── Bulk PDF: multiple tables on A4 (4 per page) ─────────────────────
export async function generateBulkPDF(
  tables: Array<{ svgContent: string; tableNumber: string; tableLabel?: string }>,
  restaurantNameEn: string,
  primaryColor: string
): Promise<Buffer> {
  const safePrimary = sanitizeColor(primaryColor);
  const doc  = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const COLS      = 2;
  const ROWS      = 2;
  const PER_PAGE  = COLS * ROWS;
  const PAGE_W    = 595;  // A4
  const PAGE_H    = 842;
  const CELL_W    = PAGE_W / COLS;
  const CELL_H    = PAGE_H / ROWS;

  for (let i = 0; i < tables.length; i += PER_PAGE) {
    const page  = doc.addPage([PAGE_W, PAGE_H]);
    const batch = tables.slice(i, i + PER_PAGE);

    for (let j = 0; j < batch.length; j++) {
      const col   = j % COLS;
      const row   = Math.floor(j / COLS);
      const cellX = col * CELL_W;
      const cellY = PAGE_H - (row + 1) * CELL_H;

      try {
        const pngBuf = await sharp(Buffer.from(batch[j].svgContent)).resize(240,240).png().toBuffer();
        const img    = await doc.embedPng(pngBuf);

        const pad  = 20;
        const size = 200;
        page.drawImage(img, { x: cellX + pad, y: cellY + pad + 30, width: size, height: size });

        const t = batch[j].tableLabel || `Table ${batch[j].tableNumber}`;
        page.drawText(sanitize(t), { x: cellX + pad, y: cellY + pad + 10, size: 11, font: fontBold, color: rgb(0.15,0.15,0.15) });
      } catch {
        // Skip failed image
      }

      // Cell border
      const h = safePrimary.replace('#','');
      const pR = parseInt(h.substring(0,2),16)/255;
      const pG = parseInt(h.substring(2,4),16)/255;
      const pB = parseInt(h.substring(4,6),16)/255;
      page.drawRectangle({ x:cellX+5, y:cellY+5, width:CELL_W-10, height:CELL_H-10, borderColor:rgb(pR,pG,pB), borderWidth:0.5 });
    }
  }

  return Buffer.from(await doc.save());
}
