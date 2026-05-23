#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const targets = [
  'apps/api/dist',
  'apps/web/dist',
  'apps/web/test-results',
  'apps/web/playwright-report',
  'test-results',
  'playwright-report',
  '.puntaventa_diagnostics',
  'apps/web/tsconfig.tsbuildinfo',
  'punta-venta-local-diagnostics-*.txt',
  'punta-venta-post-patches-diagnostics-*.txt',
  'npm',
  'playwright',
  'punta-venta@1.0.0',
  'punta-venta-web@1.0.0',
];

function removeLiteral(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  fs.rmSync(absolutePath, { recursive: true, force: true });
  console.log(`removed ${relativePath}`);
  return true;
}

function removeSimpleGlob(pattern) {
  const directory = path.dirname(pattern);
  const basename = path.basename(pattern);
  const [prefix, suffix] = basename.split('*');
  const absoluteDirectory = path.join(repoRoot, directory === '.' ? '' : directory);

  if (!prefix || suffix === undefined) {
    throw new Error(`Unsupported clean pattern: ${pattern}`);
  }

  if (!fs.existsSync(absoluteDirectory)) {
    return 0;
  }

  let count = 0;

  for (const entry of fs.readdirSync(absoluteDirectory)) {
    if (!entry.startsWith(prefix) || !entry.endsWith(suffix)) {
      continue;
    }

    const relativePath = path.join(directory, entry).replace(/^\.\//, '');
    if (removeLiteral(relativePath)) {
      count += 1;
    }
  }

  return count;
}

let removed = 0;

for (const target of targets) {
  if (target.includes('*')) {
    removed += removeSimpleGlob(target);
    continue;
  }

  if (removeLiteral(target)) {
    removed += 1;
  }
}

if (removed === 0) {
  console.log('No generated artifacts found.');
} else {
  console.log(`Cleaned ${removed} generated artifact target(s).`);
}
