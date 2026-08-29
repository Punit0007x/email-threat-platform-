// esbuild build script for ShieldMail Extension

import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXT_DIR = join(__dirname, 'extension');
const DIST_DIR = join(__dirname, 'extension_dist');

// Clean and create dist
if (existsSync(DIST_DIR)) rmSync(DIST_DIR, { recursive: true });
mkdirSync(DIST_DIR, { recursive: true });

// Copy static assets
const staticFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'gmail_inject.css',
  'extract_ik.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'sidepanel.html',
];

for (const file of staticFiles) {
  const src = join(EXT_DIR, file);
  const dest = join(DIST_DIR, file);
  if (existsSync(src)) {
    mkdirSync(join(dest, '..'), { recursive: true });
    copyFileSync(src, dest);
  }
}

// Build TypeScript entry points
const entryPoints = [
  'background.ts',
  'gmail_content.ts',
  'popup.ts',
  'sidepanel.ts',
];

async function buildAll() {
  await Promise.all(entryPoints.map((entry) =>
    build({
      entryPoints: [join(EXT_DIR, entry)],
      bundle: true,
      outfile: join(DIST_DIR, entry.replace('.ts', '.js')),
      platform: 'browser',
      target: 'chrome100',
      format: 'iife',
      globalName: entry.replace('.ts', '').replace(/([A-Z])/g, '_$1').toUpperCase(),
      sourcemap: true,
      minify: true,
      treeShaking: true,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    })
  ));

  console.log('Build complete! Extension ready at:', DIST_DIR);
}

buildAll();