#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    shell: false,
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function fail(message, details = '') {
  console.error(`ERROR: ${message}`);
  if (details.trim()) {
    console.error(details.trim());
  }
  process.exit(1);
}

function requireGitRoot() {
  const result = run('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd() });
  if (result.status !== 0) {
    fail('Este comando debe ejecutarse dentro de un repositorio Git.', result.stderr);
  }

  return result.stdout.trim();
}

function normalizePath(value) {
  return value.replace(/^a\//, '').replace(/^b\//, '');
}

function parsePatchFiles(patchText) {
  const entries = [];
  const blocks = patchText.split(/^diff --git /m).slice(1);

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const header = lines[0] ?? '';
    const match = header.match(/^a\/(.+?) b\/(.+)$/);
    if (!match) {
      continue;
    }

    let oldPath = match[1];
    let newPath = match[2];
    let status = 'M';

    for (const line of lines) {
      if (line.startsWith('new file mode ')) {
        status = 'A';
      } else if (line.startsWith('deleted file mode ')) {
        status = 'D';
      } else if (line.startsWith('rename from ')) {
        status = 'R';
        oldPath = line.slice('rename from '.length);
      } else if (line.startsWith('rename to ')) {
        status = 'R';
        newPath = line.slice('rename to '.length);
      }
    }

    entries.push({
      status,
      oldPath: normalizePath(oldPath),
      newPath: normalizePath(newPath),
    });
  }

  return entries;
}

function assertPatchHasDiffs(patchText) {
  if (!/^diff --git /m.test(patchText)) {
    fail('El archivo no parece ser un patch Git unificado válido: no contiene bloques diff --git.');
  }
}

function printPatchSummary(entries) {
  console.log('Archivos detectados en el patch:');
  for (const entry of entries) {
    if (entry.status === 'R') {
      console.log(`  R ${entry.oldPath} -> ${entry.newPath}`);
      continue;
    }
    console.log(`  ${entry.status} ${entry.newPath}`);
  }
}

function main() {
  const patchArg = process.argv[2];
  if (!patchArg) {
    fail('Uso: npm run patch:check -- RUTA/AL/PATCH.patch');
  }

  const repoRoot = requireGitRoot();
  const patchPath = path.resolve(process.cwd(), patchArg);

  if (!fs.existsSync(patchPath)) {
    fail(`No existe el patch: ${patchPath}`);
  }

  const patchText = fs.readFileSync(patchPath, 'utf8');
  assertPatchHasDiffs(patchText);

  const entries = parsePatchFiles(patchText);
  if (entries.length === 0) {
    fail('No se pudieron detectar archivos modificados dentro del patch.');
  }

  printPatchSummary(entries);

  const whitespaceCheck = run('git', ['apply', '--check', '--whitespace=error', patchPath], { cwd: repoRoot });
  if (whitespaceCheck.status !== 0) {
    fail('El patch no pasa git apply --check --whitespace=error.', `${whitespaceCheck.stdout}\n${whitespaceCheck.stderr}`);
  }

  const currentWhitespace = run('git', ['diff', '--check'], { cwd: repoRoot });
  if (currentWhitespace.status !== 0 || currentWhitespace.stdout.trim() || currentWhitespace.stderr.trim()) {
    fail('El working tree actual tiene errores de whitespace antes de aplicar el patch.', `${currentWhitespace.stdout}\n${currentWhitespace.stderr}`);
  }

  const newFiles = entries.filter((entry) => entry.status === 'A');
  if (newFiles.length > 0) {
    console.log('Archivos nuevos incluidos:');
    for (const entry of newFiles) {
      console.log(`  A ${entry.newPath}`);
    }
  }

  console.log('Patch válido: aplica limpio con whitespace estricto.');
}

main();
