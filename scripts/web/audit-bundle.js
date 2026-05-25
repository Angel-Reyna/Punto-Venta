#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const repoRoot = path.resolve(__dirname, '../..');
const distRoot = path.join(repoRoot, 'apps', 'web', 'dist');
const assetsRoot = path.join(distRoot, 'assets');

const DEFAULT_WARN_CHUNK_KB = 350;
const DEFAULT_FAIL_CHUNK_KB = 550;
const DEFAULT_WARN_TOTAL_JS_KB = 1200;
const DEFAULT_FAIL_TOTAL_JS_KB = 1800;

const warnChunkKb = readPositiveNumber('BUNDLE_AUDIT_WARN_CHUNK_KB', DEFAULT_WARN_CHUNK_KB);
const failChunkKb = readPositiveNumber('BUNDLE_AUDIT_FAIL_CHUNK_KB', DEFAULT_FAIL_CHUNK_KB);
const warnTotalJsKb = readPositiveNumber('BUNDLE_AUDIT_WARN_TOTAL_JS_KB', DEFAULT_WARN_TOTAL_JS_KB);
const failTotalJsKb = readPositiveNumber('BUNDLE_AUDIT_FAIL_TOTAL_JS_KB', DEFAULT_FAIL_TOTAL_JS_KB);
const strict = readBoolean('BUNDLE_AUDIT_STRICT');

function readPositiveNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} debe ser un número positivo. Recibido: ${raw}`);
  }

  return value;
}

function readBoolean(name) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(value);
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

function toKb(bytes) {
  return bytes / 1024;
}

function collectFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function classifyFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.js') {
    return 'js';
  }
  if (extension === '.css') {
    return 'css';
  }
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(extension)) {
    return 'asset';
  }
  return 'other';
}

function statusFor(rawKb, gzipKb) {
  if (rawKb >= failChunkKb) {
    return 'FAIL';
  }
  if (rawKb >= warnChunkKb) {
    return 'WARN';
  }
  if (gzipKb >= warnChunkKb / 3) {
    return 'WARN';
  }
  return 'OK';
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value).padStart(width, ' ');
}

function main() {
  if (!fs.existsSync(distRoot)) {
    throw new Error('No existe apps/web/dist. Ejecuta primero: npm run web:build');
  }

  const files = collectFiles(assetsRoot)
    .filter((filePath) => ['.js', '.css'].includes(path.extname(filePath).toLowerCase()))
    .map((filePath) => {
      const content = fs.readFileSync(filePath);
      const gzip = zlib.gzipSync(content);
      const rawKb = toKb(content.length);
      const gzipKb = toKb(gzip.length);

      return {
        relativePath: path.relative(distRoot, filePath).split(path.sep).join('/'),
        type: classifyFile(filePath),
        rawBytes: content.length,
        gzipBytes: gzip.length,
        rawKb,
        gzipKb,
        status: statusFor(rawKb, gzipKb),
      };
    })
    .sort((a, b) => b.rawBytes - a.rawBytes);

  if (files.length === 0) {
    throw new Error('No se encontraron chunks JS/CSS en apps/web/dist/assets. Verifica que el build haya terminado correctamente.');
  }

  const jsFiles = files.filter((file) => file.type === 'js');
  const cssFiles = files.filter((file) => file.type === 'css');
  const totalJsBytes = jsFiles.reduce((sum, file) => sum + file.rawBytes, 0);
  const totalJsGzipBytes = jsFiles.reduce((sum, file) => sum + file.gzipBytes, 0);
  const totalCssBytes = cssFiles.reduce((sum, file) => sum + file.rawBytes, 0);
  const totalCssGzipBytes = cssFiles.reduce((sum, file) => sum + file.gzipBytes, 0);

  const totalJsKb = toKb(totalJsBytes);
  const totalJsStatus = totalJsKb >= failTotalJsKb ? 'FAIL' : totalJsKb >= warnTotalJsKb ? 'WARN' : 'OK';
  const chunkFailures = files.filter((file) => file.status === 'FAIL');
  const chunkWarnings = files.filter((file) => file.status === 'WARN');

  console.log('Punta Venta web bundle audit');
  console.log('');
  console.log(`Dist: ${path.relative(repoRoot, distRoot).split(path.sep).join('/')}`);
  console.log(`Modo estricto: ${strict ? 'activo' : 'inactivo'}`);
  console.log(`Umbral chunk WARN/FAIL: ${warnChunkKb} kB / ${failChunkKb} kB`);
  console.log(`Umbral JS total WARN/FAIL: ${warnTotalJsKb} kB / ${failTotalJsKb} kB`);
  console.log('');
  console.log(`JS total: ${formatKb(totalJsBytes)} raw, ${formatKb(totalJsGzipBytes)} gzip [${totalJsStatus}]`);
  console.log(`CSS total: ${formatKb(totalCssBytes)} raw, ${formatKb(totalCssGzipBytes)} gzip`);
  console.log('');
  console.log(`${padRight('Estado', 7)} ${padLeft('Raw', 12)} ${padLeft('Gzip', 12)}  Chunk`);
  console.log(`${'-'.repeat(7)} ${'-'.repeat(12)} ${'-'.repeat(12)}  ${'-'.repeat(40)}`);

  for (const file of files) {
    console.log(
      `${padRight(file.status, 7)} ${padLeft(formatKb(file.rawBytes), 12)} ${padLeft(formatKb(file.gzipBytes), 12)}  ${file.relativePath}`,
    );
  }

  console.log('');

  if (chunkFailures.length > 0 || totalJsStatus === 'FAIL') {
    console.log('Resultado: se detectaron chunks o total JS por encima del umbral FAIL.');
  } else if (chunkWarnings.length > 0 || totalJsStatus === 'WARN') {
    console.log('Resultado: se detectaron warnings de tamaño. Evalúa code splitting antes de más crecimiento frontend.');
  } else {
    console.log('Resultado: bundle dentro de los umbrales iniciales.');
  }

  if (strict && (chunkFailures.length > 0 || totalJsStatus === 'FAIL')) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
