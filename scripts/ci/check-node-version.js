#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

function normalizePath(filePath) {
  return filePath.replace(/\\/gu, '/');
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function parseNodeMajor(value, label) {
  const normalized = String(value).trim().replace(/^v/iu, '');
  const match = normalized.match(/^(\d+)(?:\.\d+){0,2}$/u);

  if (!match) {
    throw new Error(`${label} must contain a Node major version or full semver version. Received: ${JSON.stringify(value)}`);
  }

  return Number.parseInt(match[1], 10);
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

function fail(failures, label, expected, actual) {
  failures.push({ label, expected, actual });
}

function checkPackageEngines(expectedMajor, failures) {
  const rootPackage = JSON.parse(readText('package.json'));
  const range = rootPackage.engines?.node;

  if (typeof range !== 'string' || range.trim() === '') {
    fail(failures, 'package.json engines.node', `>=${expectedMajor} <next-major`, range ?? '<missing>');
    return;
  }

  const lowerBound = range.match(/>=\s*v?(\d+)/u);
  const upperBound = range.match(/<\s*v?(\d+)/u);

  if (!lowerBound || Number.parseInt(lowerBound[1], 10) !== expectedMajor) {
    fail(failures, 'package.json engines.node lower bound', `>=${expectedMajor}`, range);
  }

  if (!upperBound || Number.parseInt(upperBound[1], 10) <= expectedMajor) {
    fail(failures, 'package.json engines.node upper bound', `>${expectedMajor}`, range);
  }
}

function checkWorkflowNodeVersions(expectedMajor, trackedFiles, failures) {
  const workflowFiles = trackedFiles.filter((filePath) => /^\.github\/workflows\/[^/]+\.ya?ml$/u.test(filePath));

  for (const workflowFile of workflowFiles) {
    const lines = readText(workflowFile).split(/\r?\n/u);

    lines.forEach((line, index) => {
      const match = line.match(/^\s*node-version:\s*["']?([^"'\s#]+)["']?/u);
      if (!match) {
        return;
      }

      const actualMajor = parseNodeMajor(match[1], `${workflowFile}:${index + 1}`);
      if (actualMajor !== expectedMajor) {
        fail(failures, `${workflowFile}:${index + 1} node-version`, expectedMajor, match[1]);
      }
    });
  }
}

function checkDockerNodeVersions(expectedMajor, trackedFiles, failures) {
  const dockerFiles = trackedFiles.filter((filePath) => /(^|\/)Dockerfile$/u.test(filePath));

  for (const dockerFile of dockerFiles) {
    const lines = readText(dockerFile).split(/\r?\n/u);

    lines.forEach((line, index) => {
      const match = line.match(/^\s*FROM\s+node:(\d+)(?:[-.:@\w]*)?(?:\s+AS\s+\S+)?\s*$/iu);
      if (!match) {
        return;
      }

      const actualMajor = Number.parseInt(match[1], 10);
      if (actualMajor !== expectedMajor) {
        fail(failures, `${dockerFile}:${index + 1} Node Docker image`, expectedMajor, match[1]);
      }
    });
  }
}

const failures = [];
const expectedMajor = parseNodeMajor(readText('.node-version'), '.node-version');
const nvmMajor = parseNodeMajor(readText('.nvmrc'), '.nvmrc');

if (nvmMajor !== expectedMajor) {
  fail(failures, '.nvmrc', expectedMajor, nvmMajor);
}

const trackedFiles = listTrackedFiles();
checkPackageEngines(expectedMajor, failures);
checkWorkflowNodeVersions(expectedMajor, trackedFiles, failures);
checkDockerNodeVersions(expectedMajor, trackedFiles, failures);

if (failures.length > 0) {
  console.error('Node version guardrail failed. Keep Node major versions synchronized:');
  for (const failure of failures) {
    console.error(`- ${failure.label}: expected ${failure.expected}, received ${failure.actual}`);
  }
  console.error('\nUpdate .node-version, .nvmrc, package.json engines.node, GitHub Actions and Dockerfiles together.');
  process.exit(1);
}

console.log(`Node version guardrail OK: Node ${expectedMajor}.`);
