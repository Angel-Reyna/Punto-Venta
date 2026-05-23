#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const apiRoot = path.join(repoRoot, 'apps', 'api');
const webRoot = path.join(repoRoot, 'apps', 'web');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const dockerCmd = isWindows ? 'docker.exe' : 'docker';

const apiPort = process.env.E2E_API_PORT || '4010';
const webPort = process.env.E2E_WEB_PORT || '5175';
const postgresPort = process.env.POSTGRES_PORT || '5432';
const webUrl = process.env.E2E_WEB_URL || `http://127.0.0.1:${webPort}`;
const apiUrl = process.env.E2E_API_URL || `http://127.0.0.1:${apiPort}`;
const databaseUrl =
  process.env.E2E_DATABASE_URL ||
  `postgresql://postgres:postgres@127.0.0.1:${postgresPort}/pos_senior_db?schema=e2e`;

const commonApiEnv = {
  ...process.env,
  NODE_ENV: 'test',
  LOG_LEVEL: process.env.LOG_LEVEL || 'error',
  PORT: apiPort,
  DATABASE_URL: databaseUrl,
  CORS_ORIGIN: webUrl,
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',
  COOKIE_DOMAIN: '',
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || 'e2e_access_secret_change_me_min_32_chars',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'e2e_refresh_secret_change_me_min_32_chars',
  TOKEN_HASH_PEPPER:
    process.env.TOKEN_HASH_PEPPER || 'e2e_token_pepper_change_me_min_32_chars',
  JWT_ACCESS_EXPIRES_IN_SECONDS: process.env.JWT_ACCESS_EXPIRES_IN_SECONDS || '900',
  REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS || '1',
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '4',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin.e2e@puntaventa.test',
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Admin E2E',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'Admin12345DevOnly',
  SEED_DEMO_DATA: 'false',
  E2E_SELLER_EMAIL: process.env.E2E_SELLER_EMAIL || 'vendedor.e2e@puntaventa.test',
  E2E_SELLER_NAME: process.env.E2E_SELLER_NAME || 'Vendedor E2E',
  E2E_SELLER_PASSWORD: process.env.E2E_SELLER_PASSWORD || 'Vendedor12345DevOnly',
};

const childProcesses = new Set();

function normalizeEnv(env) {
  const normalized = {};

  for (const [key, value] of Object.entries(env || {})) {
    if (value === undefined || value === null) {
      continue;
    }

    normalized[key] = String(value);
  }

  return normalized;
}

function shouldUseShell(command) {
  return isWindows && /\.cmd$/i.test(command);
}

function log(message) {
  console.log(`[e2e:integration] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runBestEffort(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    env: normalizeEnv(options.env || process.env),
    encoding: 'utf8',
    shell: shouldUseShell(command),
    windowsHide: true,
  });

  if (result.status !== 0 && result.error) {
    log(`Best-effort command failed: ${command} ${args.join(' ')} (${result.error.message})`);
  }
}

async function cleanupPreviousE2EProcesses() {
  if (!isWindows) {
    return;
  }

  const ports = [apiPort, webPort]
    .map((port) => Number(port))
    .filter((port) => Number.isInteger(port) && port > 0);

  if (ports.length === 0) {
    return;
  }

  const portsLiteral = ports.join(',');

  log(`Cleaning up previous E2E processes listening on ports ${ports.join(', ')}.`);

  runBestEffort('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `$ports = @(${portsLiteral}); ` +
      '$pids = Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue | ' +
      'Select-Object -ExpandProperty OwningProcess -Unique; ' +
      'foreach ($processId in $pids) { ' +
      'if ($processId -and $processId -ne $PID) { ' +
      'Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue ' +
      '} }',
  ]);

  await sleep(1_000);
}

function run(command, args, options = {}) {
  const cwd = options.cwd || repoRoot;
  const env = options.env || process.env;

  log(`${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: normalizeEnv(env),
      stdio: 'inherit',
      shell: shouldUseShell(command),
      windowsHide: true,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `code ${code}`}`,
        ),
      );
    });
  });
}

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || repoRoot,
    env: normalizeEnv(options.env || process.env),
    stdio: 'inherit',
    shell: shouldUseShell(command),
    windowsHide: true,
  });

  childProcesses.add(child);

  child.on('exit', () => {
    childProcesses.delete(child);
  });

  return child;
}

async function waitForUrl(url, label, timeoutMs = 60_000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }

      lastError = new Error(`${label} responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Timed out waiting for ${label} at ${url}. Last error: ${lastError?.message ?? lastError}`,
  );
}

async function waitForPostgres(timeoutMs = 60_000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await run(dockerCmd, [
        'compose',
        'exec',
        '-T',
        'postgres',
        'pg_isready',
        '-U',
        process.env.POSTGRES_USER || 'postgres',
        '-d',
        process.env.POSTGRES_DB || 'pos_senior_db',
      ]);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  }

  throw new Error(`Timed out waiting for PostgreSQL. Last error: ${lastError?.message ?? lastError}`);
}

function stopChild(child) {
  if (!child || child.killed) {
    return;
  }

  if (isWindows) {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
}

function stopChildren() {
  for (const child of childProcesses) {
    stopChild(child);
  }
}

async function generatePrismaClient() {
  try {
    await run(npmCmd, ['--prefix', 'apps/api', 'run', 'prisma:generate'], {
      cwd: repoRoot,
      env: commonApiEnv,
    });
    return;
  } catch (error) {
    if (!isWindows) {
      throw error;
    }

    log('Prisma generate failed on Windows. Retrying after cleaning up stale E2E processes.');
    await cleanupPreviousE2EProcesses();
    await sleep(1_500);

    await run(npmCmd, ['--prefix', 'apps/api', 'run', 'prisma:generate'], {
      cwd: repoRoot,
      env: commonApiEnv,
    });
  }
}

async function main() {
  process.on('SIGINT', () => {
    stopChildren();
    process.exit(130);
  });

  process.on('SIGTERM', () => {
    stopChildren();
    process.exit(143);
  });

  await cleanupPreviousE2EProcesses();

  log('Starting PostgreSQL with Docker Compose.');
  await run(dockerCmd, ['compose', 'up', '-d', 'postgres']);
  await waitForPostgres();

  log('Preparing isolated PostgreSQL schema for E2E.');
  await generatePrismaClient();
  await run(npxCmd, ['prisma', 'migrate', 'reset', '--force', '--skip-generate', '--skip-seed'], {
    cwd: apiRoot,
    env: commonApiEnv,
  });
  await run(npmCmd, ['run', 'seed:e2e'], {
    cwd: apiRoot,
    env: commonApiEnv,
  });

  log('Starting API and Web servers.');
  start(npmCmd, ['run', 'dev:e2e'], {
    cwd: apiRoot,
    env: commonApiEnv,
  });

  await waitForUrl(`${apiUrl}/health`, 'API');

  start(npmCmd, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', webPort, '--strictPort'], {
    cwd: webRoot,
    env: {
      ...process.env,
      VITE_API_URL: `${apiUrl}/api`,
    },
  });

  await waitForUrl(webUrl, 'Web');

  log('Running integrated Playwright suite.');
  await run(npmCmd, ['run', 'e2e:integration'], {
    cwd: webRoot,
    env: {
      ...process.env,
      E2E_WEB_URL: webUrl,
      E2E_API_URL: apiUrl,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    stopChildren();
  });
