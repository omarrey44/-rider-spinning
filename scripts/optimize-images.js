/* eslint-disable */
/**
 * Convierte las imágenes pesadas de /public a WebP para mejorar el LCP.
 * Uso: node scripts/optimize-images.js
 *
 * Genera variantes .webp al lado del archivo original (no las borra).
 * Después actualiza el CSS / componentes para apuntar a las .webp.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Solo convertimos las pesadas (>200KB). Los íconos pequeños no aportan al optimizar.
const TARGETS = [
  { in: 'studio-bg.png',  quality: 78 },
  { in: 'bike-bg.png',    quality: 78 },
  { in: 'bikeMovil.png',  quality: 78 },
  { in: 'logo2.png',      quality: 90 },
];

async function convert() {
  for (const t of TARGETS) {
    const inPath = path.join(PUBLIC_DIR, t.in);
    const outPath = inPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    if (!fs.existsSync(inPath)) {
      console.log(`⚠ Skip (not found): ${t.in}`);
      continue;
    }

    const inSize = fs.statSync(inPath).size;
    await sharp(inPath).webp({ quality: t.quality }).toFile(outPath);
    const outSize = fs.statSync(outPath).size;
    const saved = (((inSize - outSize) / inSize) * 100).toFixed(1);

    console.log(
      `✓ ${t.in.padEnd(20)} ${(inSize / 1024).toFixed(0)}KB → ${(outSize / 1024).toFixed(0)}KB  (-${saved}%)`
    );
  }
  console.log('\nDone. Actualiza referencias en CSS/componentes a .webp.');
}

convert().catch((err) => {
  console.error(err);
  process.exit(1);
});
