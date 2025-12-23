const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
// Default project dist (used by dev scripts)
const destDir = path.resolve(__dirname, '..', 'dist');
const dest = path.join(destDir, 'sql-wasm.wasm');
// Also copy to the electron main database directory so it's packaged next to the main code
const destDirElectron = path.resolve(__dirname, '..', 'electron', 'main', 'core', 'database');
const destElectron = path.join(destDirElectron, 'sql-wasm.wasm');

if (!fs.existsSync(src)) {
  console.warn('sql-wasm.wasm not found at', src);
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (!fs.existsSync(destDirElectron)) {
  fs.mkdirSync(destDirElectron, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Copied sql-wasm.wasm to dist/');

fs.copyFileSync(src, destElectron);
console.log(`Copied sql-wasm.wasm to ${destElectron}`);
