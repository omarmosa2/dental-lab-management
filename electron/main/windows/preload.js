// Proxy preload wrapper for window-specific preloads
// This file simply delegates to the project's main preload script located at ../../preload.js
// This helps packaged or directory-based builds where window code expects a local preload.js

try {
  require('../../preload.js');
  // eslint-disable-next-line no-console
  console.log('[preload proxy] delegated to ../../preload.js');
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[preload proxy] failed to load ../../preload.js', err);
  throw err;
}
