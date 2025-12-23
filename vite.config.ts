import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  base: './',
  plugins: [
    react(),
    // Custom plugin to copy icon to dist
    {
      name: 'copy-icon',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist');
        const assetsDir = path.resolve(__dirname, 'assets');
        const iconSrc = path.join(assetsDir, 'icon.ico');
        const iconDest = path.join(distDir, 'icon.ico');
        
        // Ensure dist directory exists
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        
        // Copy icon.ico to dist root for favicon
        if (fs.existsSync(iconSrc)) {
          fs.copyFileSync(iconSrc, iconDest);
          console.log('✓ Copied icon.ico to dist/');
        }
      }
    }
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  publicDir: path.resolve(__dirname, 'public'),
});