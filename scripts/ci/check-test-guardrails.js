#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const SCAN_ROOTS = [
  'apps/api/tests',
  'apps/web/src',
  'apps/web/e2e'
];

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
  '.vite',
  '.cache'
]);

function isE2EPath(relativePath) {
  return relativePath.startsWith('apps/web/e2e/') && !relativePath.startsWith('apps/web/e2e/support/');
}

function isMockedE2EPath(relativePath) {
  return isE2EPath(relativePath) && !relativePath.startsWith('apps/web/e2e/integration/');
}

const RISKY_GLOBAL_TEXT_PATTERN = String.raw`\bpage\.getByText\s*\(\s*(?:[\"'\`])(?=[^\"'\`]*(?:PV-|Venta neta|Merma por caducidad|Utilidad operativa|Margen operativo|Bajo inventario|Devuelta|Ajuste pendiente))`;

const RULES = [
  {
    id: 'focused-test',
    message: 'Focused tests must not be committed. Remove .only before pushing.',
    pattern: /\b(?:describe|it|test)\.only\s*\(/,
    appliesTo: (relativePath) => isTestPath(relativePath)
  },
  {
    id: 'skipped-test',
    message: 'Skipped tests hide regressions. Remove .skip or replace it with an explicit tracked issue before pushing.',
    pattern: /\b(?:describe|it|test)\.skip\s*\(/,
    appliesTo: (relativePath) => isTestPath(relativePath)
  },
  {
    id: 'debugger',
    message: 'Debugger statements must not be committed.',
    pattern: /\bdebugger\b/,
    appliesTo: () => true
  },
  {
    id: 'playwright-force-true',
    message: 'Avoid Playwright force:true because it can hide real UX or selector bugs.',
    pattern: /\bforce\s*:\s*true\b/,
    appliesTo: (relativePath) => relativePath.startsWith('apps/web/e2e/')
  },
  {
    id: 'playwright-risky-global-text',
    message:
      'Scope repeated business text with a stable container/test id. Use byTestId(...).toContainText(...) instead of page.getByText(...).',
    pattern: new RegExp(RISKY_GLOBAL_TEXT_PATTERN),
    appliesTo: isMockedE2EPath
  },
  {
    id: 'playwright-global-text-position',
    message:
      'Avoid page.getByText(...).first()/last()/nth() in mocked E2E. Scope the locator to the owning card, row or panel.',
    pattern: /\bpage\.getByText\s*\([^)]*\)\.(?:first|last|nth)\s*\(/,
    appliesTo: isMockedE2EPath
  }
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function isTestPath(relativePath) {
  return (
    relativePath.includes('/tests/') ||
    relativePath.includes('/e2e/') ||
    /(?:^|\.)test\.[cm]?[jt]sx?$/.test(relativePath) ||
    /(?:^|\.)spec\.[cm]?[jt]sx?$/.test(relativePath)
  );
}

function shouldSkipDirectory(directoryName) {
  return SKIP_DIRS.has(directoryName);
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        walk(absolutePath, files);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function scanFile(absolutePath) {
  const relativePath = toPosix(path.relative(repoRoot, absolutePath));
  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  const violations = [];

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (!rule.appliesTo(relativePath)) {
        continue;
      }

      if (rule.pattern.test(line)) {
        violations.push({
          rule: rule.id,
          message: rule.message,
          path: relativePath,
          line: index + 1,
          source: line.trim()
        });
      }
    }
  });

  return violations;
}

const files = SCAN_ROOTS.flatMap((scanRoot) => walk(path.join(repoRoot, scanRoot)));
const violations = files.flatMap(scanFile);

if (violations.length > 0) {
  console.error('Unsafe test shortcuts or E2E overrides were detected:');
  for (const violation of violations) {
    console.error(`- ${violation.path}:${violation.line} [${violation.rule}] ${violation.message}`);
    console.error(`  ${violation.source}`);
  }
  process.exit(1);
}

console.log('No focused/skipped tests, debugger statements, unsafe Playwright force:true overrides or risky global E2E text locators detected.');
