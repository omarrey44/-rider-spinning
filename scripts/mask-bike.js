// Convert Bike.png black background to alpha transparency
const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '..', 'public', 'Bike.png');
const output = path.join(__dirname, '..', 'public', 'bike-masked.png');

sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const pixels = info.width * info.height;
    const channels = info.channels; // 4 = RGBA
    for (let i = 0; i < pixels; i++) {
      const idx = i * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Black pixels become transparent
      const brightness = (r + g + b) / 3;
      if (brightness < 40) {
        data[idx + 3] = 0; // fully transparent
      } else if (brightness < 80) {
        // Soft edge: partial transparency
        data[idx + 3] = Math.round(((brightness - 40) / 40) * 255);
      }
    }
    return sharp(data, { raw: info }).toFile(output);
  })
  .then(() => console.log('Created bike-masked.png with alpha transparency'))
  .catch((err) => console.error('Error:', err));
