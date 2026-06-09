#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');

const generatedDirectorySegments = new Set([
  'dist',
  'build',
  '.vite',
  '.cache',
  'coverage',
  'test-results',
  'playwright-report',
  '.puntaventa_diagnostics',
]);

const generatedFilePatterns = [
  {
    label: 'TypeScript incremental build cache',
    test: (filePath) => filePath.endsWith('.tsbuildinfo'),
  },
  {
    label: 'Punta Venta continuity snapshot archive',
    test: (filePath) =>
      /(^|\/)(?:Punta_Venta_(?:current|after_patch)_.*|punta-venta-current-before-p\d+-.*)\.tar\.gz$/u.test(
        filePath,
      ),
  },
  {
    label: 'Punta Venta diagnostics/status text output',
    test: (filePath) =>
      /(^|\/)(?:punta-venta-(?:local-diagnostics|post-patches-diagnostics|after-patch|current-diagnostics|project-status-update)-.*|(?:status|log|diff-files|diff-stat)-before-p\d+-.*)\.txt$/u.test(
        filePath,
      ),
  },
  {
    label: 'Punta Venta continuity markdown output',
    test: (filePath) => /(^|\/)punta-venta-continuity-.*\.md$/u.test(filePath),
  },
  {
    label: 'accidental command output file',
    test: (filePath) => /^(?:eslint|jest|node|npm|playwright|tsc|punta-venta@.*|punta-venta-api@.*|punta-venta-web@.*)$/u.test(filePath),
  },
];

function listTrackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
    return output.split('\0').filter(Boolean);
  } catch (error) {
    throw new Error(`No se pudieron listar archivos versionados con git ls-files: ${error.message}`);
  }
}

function normalizePath(filePath) {
  return filePath.replace(/\\/gu, '/');
}

function hasGeneratedDirectorySegment(filePath) {
  return normalizePath(filePath)
    .split('/')
    .some((segment) => generatedDirectorySegments.has(segment));
}

function getGeneratedReason(filePath) {
  if (hasGeneratedDirectorySegment(filePath)) {
    return 'generated/local artifact directory';
  }

  const matchedPattern = generatedFilePatterns.find((pattern) => pattern.test(normalizePath(filePath)));
  return matchedPattern?.label ?? null;
}

const trackedGeneratedFiles = listTrackedFiles()
  .map(normalizePath)
  .map((filePath) => ({ filePath, reason: getGeneratedReason(filePath) }))
  .filter(({ reason }) => reason !== null)
  .sort((left, right) => left.filePath.localeCompare(right.filePath));

if (trackedGeneratedFiles.length > 0) {
  console.error('Generated artifacts are tracked in Git. Remove them before committing:');
  for (const { filePath, reason } of trackedGeneratedFiles) {
    console.error(`- ${filePath} (${reason})`);
  }
  console.error('\nSuggested cleanup: npm run clean:generated && git rm --cached <tracked-artifact-path>');
  process.exit(1);
}

console.log('No generated artifacts are tracked in Git.');
