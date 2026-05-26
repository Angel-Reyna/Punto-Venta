#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

function normalizePath(filePath) {
  return filePath.replace(/\\/gu, '/');
}

function listTrackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
    return output.split('\0').filter(Boolean).map(normalizePath);
  } catch (error) {
    throw new Error(`No se pudieron listar archivos versionados con git ls-files: ${error.message}`);
  }
}

function getBaseName(filePath) {
  return path.posix.basename(normalizePath(filePath));
}

function isAllowedExample(filePath) {
  const normalized = normalizePath(filePath);
  const baseName = getBaseName(normalized);

  return (
    baseName === '.env.example' ||
    /^\.env\.[a-z0-9_-]+\.example$/iu.test(baseName) ||
    /^docker\.env(?:\.[a-z0-9_-]+)?\.example$/iu.test(baseName)
  );
}

const sensitivePatterns = [
  {
    label: 'private environment file',
    test: (filePath) => /^\.env(?:\.|$)/u.test(getBaseName(filePath)) && !isAllowedExample(filePath),
  },
  {
    label: 'private key or certificate bundle',
    test: (filePath) => /\.(?:pem|key|p12|pfx|jks|keystore)$/iu.test(filePath),
  },
  {
    label: 'SSH private key',
    test: (filePath) => /(^|\/)(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:\.[^/]*)?$/iu.test(filePath),
  },
  {
    label: 'cloud/service account credentials',
    test: (filePath) =>
      /(^|\/)(?:service-account|credentials|google-credentials|gcp-credentials|firebase-adminsdk)[^/]*\.json$/iu.test(
        filePath,
      ),
  },
  {
    label: 'local database file',
    test: (filePath) => /\.(?:sqlite|sqlite3|db|db-journal)$/iu.test(filePath),
  },
  {
    label: 'database backup/dump',
    test: (filePath) =>
      /(^|\/)backups\/(?!\.gitkeep$).+/iu.test(filePath) || /\.(?:dump|backup|bak)$/iu.test(filePath),
  },
];

const trackedSensitiveFiles = listTrackedFiles()
  .map((filePath) => ({
    filePath,
    reason: sensitivePatterns.find((pattern) => pattern.test(filePath))?.label ?? null,
  }))
  .filter(({ reason }) => reason !== null)
  .sort((left, right) => left.filePath.localeCompare(right.filePath));

if (trackedSensitiveFiles.length > 0) {
  console.error('Sensitive/local files are tracked in Git. Remove them before committing:');
  for (const { filePath, reason } of trackedSensitiveFiles) {
    console.error(`- ${filePath} (${reason})`);
  }
  console.error('\nSuggested cleanup: git rm --cached <sensitive-file-path>');
  console.error('Keep only sanitized examples such as .env.example or docker.env.example.');
  process.exit(1);
}

console.log('No sensitive local files are tracked in Git.');
