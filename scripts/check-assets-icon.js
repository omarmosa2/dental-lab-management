const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '..', 'assets', 'icon.ico');
try {
  const buf = fs.readFileSync(p);
  console.log('size:', buf.length);
  console.log('first 4 bytes:', buf.slice(0,4).toString('hex'));
} catch (e) {
  console.error('error reading file:', e.message);
  process.exit(1);
}
