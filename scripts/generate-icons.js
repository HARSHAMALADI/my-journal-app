const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

const generateIcon = async (size) => {
  const fontSize = Math.round(size * 0.28);
  const smallFontSize = Math.max(8, Math.round(size * 0.065));
  const yearY = size * 0.55;
  const subtitleY = size * 0.69;
  const r = Math.round(size * 0.18);
  const year = new Date().getFullYear();

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2d3436"/>
        <stop offset="50%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
    <line x1="${size*0.2}" y1="${size*0.28}" x2="${size*0.8}" y2="${size*0.28}" stroke="#c4a265" stroke-width="0.8" opacity="0.25"/>
    <line x1="${size*0.2}" y1="${size*0.76}" x2="${size*0.8}" y2="${size*0.76}" stroke="#c4a265" stroke-width="0.8" opacity="0.25"/>
    <rect x="${size*0.18}" y="${size*0.26}" width="${size*0.05}" height="${size*0.05}" fill="none" stroke="#c4a265" stroke-width="0.6" opacity="0.2"/>
    <rect x="${size*0.77}" y="${size*0.26}" width="${size*0.05}" height="${size*0.05}" fill="none" stroke="#c4a265" stroke-width="0.6" opacity="0.2"/>
    <rect x="${size*0.18}" y="${size*0.73}" width="${size*0.05}" height="${size*0.05}" fill="none" stroke="#c4a265" stroke-width="0.6" opacity="0.2"/>
    <rect x="${size*0.77}" y="${size*0.73}" width="${size*0.05}" height="${size*0.05}" fill="none" stroke="#c4a265" stroke-width="0.6" opacity="0.2"/>
    <text x="50%" y="${yearY}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${fontSize}" fill="#c4a265">${year}</text>
    <text x="50%" y="${subtitleY}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="${smallFontSize}" fill="#c4a265" opacity="0.6">My Journal</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
};

(async () => {
  for (const size of sizes) {
    await generateIcon(size);
  }
  // Copy 180 as apple-touch-icon
  const fs = require('fs');
  fs.copyFileSync(
    path.join(iconsDir, 'icon-180.png'),
    path.join(iconsDir, 'apple-touch-icon.png')
  );
  console.log('✓ apple-touch-icon.png');
  console.log('\nAll icons generated!');
})();
