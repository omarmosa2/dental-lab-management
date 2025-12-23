const fs = require('fs');
const path = require('path');

const assetsDir = path.resolve(__dirname, '..', 'assets');
const iconPath = path.join(assetsDir, 'icon.ico');
const backupPng = path.join(assetsDir, 'icon.png');
const outIco = path.join(assetsDir, 'icon_fixed.ico');

if (!fs.existsSync(iconPath)) {
  console.error('assets/icon.ico not found');
  process.exit(1);
}

const buf = fs.readFileSync(iconPath);
// check PNG signature
if (buf.slice(0,8).toString('hex') === '89504e470d0a1a0a') {
  // parse IHDR for width and height
  const ihdrOffset = buf.indexOf(Buffer.from('IHDR'));
  if (ihdrOffset === -1) {
    console.error('IHDR not found in PNG');
    process.exit(1);
  }
  const width = buf.readUInt32BE(ihdrOffset - 4 + 4);
  const height = buf.readUInt32BE(ihdrOffset - 4 + 8);
  console.log('PNG width,height:', width, height);

  // backup original as icon.png
  if (!fs.existsSync(backupPng)) fs.copyFileSync(iconPath, backupPng);

  // Build ICO file with single PNG image
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const dir = Buffer.alloc(16);
  const wByte = width >= 256 ? 0 : width;
  const hByte = height >= 256 ? 0 : height;

  dir.writeUInt8(wByte, 0);
  dir.writeUInt8(hByte, 1);
  dir.writeUInt8(0, 2);
  dir.writeUInt8(0, 3);
  dir.writeUInt16LE(0, 4);
  dir.writeUInt16LE(0, 6);
  dir.writeUInt32LE(buf.length, 8);
  dir.writeUInt32LE(22, 12);

  const icoBuf = Buffer.concat([header, dir, buf]);
  fs.writeFileSync(outIco, icoBuf);
  fs.renameSync(outIco, iconPath);
  console.log('Replaced assets/icon.ico with valid ICO (backup at assets/icon.png)');
} else {
  console.log('assets/icon.ico looks ok (not a PNG)');
}
