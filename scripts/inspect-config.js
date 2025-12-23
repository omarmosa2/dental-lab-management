// Small script to inspect exports of TypeScript webpack config
require('ts-node').register();
const c = require('../webpack.main.config.ts');
console.log('exports:', Object.keys(c));
console.log('hasDefault:', !!c.default);
if (c.default) console.log('defaultKeys:', Object.keys(c.default));
console.log('entry (default):', c.default ? c.default.entry : c.entry);
