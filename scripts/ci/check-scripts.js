#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function normalizePath(filePath) {
  return filePath.replace(/\\/gu, '/');
}

function listTrackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: repoRoot,
      encoding: 'utf8'
    });

    return output.split('\0').filter(Boolean).map(normalizePath);
  } catch (error) {
    throw new Error(`No se pudieron listar archivos versionados con git ls-files: ${error.message}`);
  }
}


function hasCarriageReturn(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath)).includes(0x0d);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'ignore'
  });

  return result.error === undefined && result.status === 0;
}

function runSyntaxCheck(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.error) {
    return {
      label,
      command: [command, ...args].join(' '),
      details: result.error.message
    };
  }

  if (result.status !== 0) {
    return {
      label,
      command: [command, ...args].join(' '),
      details: [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    };
  }

  return null;
}

function getShellChecker() {
  if (commandExists('bash')) {
    return { command: 'bash', argsPrefix: ['-n'] };
  }

  if (commandExists('sh')) {
    return { command: 'sh', argsPrefix: ['-n'] };
  }

  return null;
}

const trackedFiles = listTrackedFiles();
const javascriptScripts = trackedFiles
  .filter((filePath) => /^scripts\/.*\.js$/u.test(filePath))
  .sort((left, right) => left.localeCompare(right));
const shellScripts = trackedFiles
  .filter((filePath) => /^scripts\/.*\.sh$/u.test(filePath))
  .sort((left, right) => left.localeCompare(right));

const failures = [];

for (const scriptPath of javascriptScripts) {
  const failure = runSyntaxCheck(scriptPath, process.execPath, ['--check', scriptPath]);
  if (failure) {
    failures.push(failure);
  }
}

const shellChecker = getShellChecker();

if (!shellChecker && shellScripts.length > 0) {
  failures.push({
    label: 'shell-script-checker',
    command: 'bash -n | sh -n',
    details: 'No se encontró bash ni sh para validar scripts shell.'
  });
} else if (shellChecker) {
  for (const scriptPath of shellScripts) {
    if (hasCarriageReturn(scriptPath)) {
      failures.push({
        label: scriptPath,
        command: 'line-ending-check',
        details:
          'El script contiene CRLF. Normalízalo a LF para que funcione igual en Git Bash, Linux y Docker.'
      });
      continue;
    }

    const failure = runSyntaxCheck(scriptPath, shellChecker.command, [
      ...shellChecker.argsPrefix,
      scriptPath
    ]);

    if (failure) {
      failures.push(failure);
    }
  }
}

if (failures.length > 0) {
  console.error('Automation script syntax checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure.label}`);
    console.error(`  Command: ${failure.command}`);
    if (failure.details) {
      console.error(`  ${failure.details}`);
    }
  }
  process.exit(1);
}

console.log(`Automation script syntax OK: ${javascriptScripts.length} JS, ${shellScripts.length} shell.`);
