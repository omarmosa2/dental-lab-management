const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '..', 'installer', 'icon.ico');
try {
  const buf = fs.readFileSync(p);
  console.log('size:', buf.length);
  console.log('first 8 bytes:', buf.slice(0,8).toString('hex'));
} catch (e) {
  console.error('error reading file:', e.message);
  process.exit(1);
}
