const fs = require('fs');
const path = require('path');

const installerDir = path.resolve(__dirname, '..', 'installer');
const iconPath = path.join(installerDir, 'icon.ico'); // currently a PNG
const backupPng = path.join(installerDir, 'icon.png');
const outIco = path.join(installerDir, 'icon_fixed.ico');

if (!fs.existsSync(iconPath)) {
  console.error('icon.ico not found');
  process.exit(1);
}

const buf = fs.readFileSync(iconPath);
// check PNG signature
if (buf.slice(0,8).toString('hex') !== '89504e470d0a1a0a') {
  console.error('icon.ico is not a PNG, aborting');
  process.exit(1);
}
// parse IHDR for width and height
const ihdrOffset = buf.indexOf(Buffer.from('IHDR'));
if (ihdrOffset === -1) {
  console.error('IHDR not found in PNG');
  process.exit(1);
}
const width = buf.readUInt32BE(ihdrOffset - 4 + 4); // careful: IHDR starts at offset, but width is after 4 bytes length and 'IHDR'
const height = buf.readUInt32BE(ihdrOffset - 4 + 8);
console.log('PNG width,height:', width, height);

// backup original as icon.png
if (!fs.existsSync(backupPng)) fs.copyFileSync(iconPath, backupPng);

// Build ICO file with single PNG image
// ICO header: reserved(2)=0, type(2)=1, count(2)=1
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

// Directory entry (16 bytes)
// width (1), height (1), colorCount (1), reserved (1), planes (2), bitCount (2), bytesInRes (4), imageOffset (4)
const dir = Buffer.alloc(16);
const wByte = width >= 256 ? 0 : width;
const hByte = height >= 256 ? 0 : height;

dir.writeUInt8(wByte, 0);
dir.writeUInt8(hByte, 1);
dir.writeUInt8(0, 2); // colorCount
dir.writeUInt8(0, 3); // reserved
// For PNG inside ICO, set planes and bitCount to 0
dir.writeUInt16LE(0, 4);
dir.writeUInt16LE(0, 6);
// bytesInRes
dir.writeUInt32LE(buf.length, 8);
// imageOffset = header.length + dir.length = 6 + 16 = 22
dir.writeUInt32LE(22, 12);

const icoBuf = Buffer.concat([header, dir, buf]);
fs.writeFileSync(outIco, icoBuf);
console.log('Wrote', outIco, 'size', icoBuf.length);

// Replace original icon.ico with fixed file (backup existed as icon.png)
fs.renameSync(outIco, path.join(installerDir, 'icon.ico'));
console.log('Replaced installer/icon.ico with valid ICO (backup at installer/icon.png)');
