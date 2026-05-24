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

const apiPort = readPort('E2E_API_PORT', '4010');
const webPort = readPort('E2E_WEB_PORT', '5175');
const postgresPort = readPort('POSTGRES_PORT', '5432');
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

function resolveCommand(command, args) {
  if (isWindows && /\.(cmd|bat)$/i.test(command)) {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', command, ...args],
    };
  }

  return { command, args };
}

function log(message) {
  console.log(`[e2e:integration] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPort(envName, defaultValue) {
  const value = process.env[envName] || defaultValue;
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${envName} must be a valid TCP port between 1 and 65535. Received: ${value}`);
  }

  return String(port);
}

function isTruthy(value) {
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value || '').trim().toLowerCase());
}

function parseDatabaseTarget(connectionUrl) {
  let parsed;

  try {
    parsed = new URL(connectionUrl);
  } catch {
    throw new Error('E2E_DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new Error('E2E_DATABASE_URL must use the postgresql:// or postgres:// protocol.');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, '')).trim();
  const schema = (parsed.searchParams.get('schema') || 'public').trim();
  const host = parsed.hostname.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();

  if (!host) {
    throw new Error('E2E_DATABASE_URL must include a database host.');
  }

  if (!database) {
    throw new Error('E2E_DATABASE_URL must include a database name.');
  }

  if (!schema) {
    throw new Error('E2E_DATABASE_URL must include a non-empty schema query parameter.');
  }

  return {
    host,
    port: parsed.port || '5432',
    database,
    schema,
    redactedUrl: redactDatabaseUrl(parsed),
  };
}

function redactDatabaseUrl(parsedUrl) {
  const redacted = new URL(parsedUrl.toString());

  if (redacted.password) {
    redacted.password = '***';
  }

  return redacted.toString();
}

function isLocalDatabaseHost(host) {
  return ['localhost', '127.0.0.1', '::1'].includes(host);
}

function assertSafeE2EDatabaseReset(connectionUrl) {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();

  if (nodeEnv === 'production') {
    throw new Error('Refusing to run integrated E2E reset while NODE_ENV=production.');
  }

  const target = parseDatabaseTarget(connectionUrl);
  const allowNonLocalReset = isTruthy(process.env.E2E_ALLOW_NON_LOCAL_DB_RESET);
  const allowNonE2ESchemaReset = isTruthy(process.env.E2E_ALLOW_DESTRUCTIVE_RESET);

  log(
    `Using E2E database target host=${target.host}, port=${target.port}, ` +
      `database=${target.database}, schema=${target.schema}.`,
  );
  log(`Using E2E database URL ${target.redactedUrl}.`);

  if (!isLocalDatabaseHost(target.host) && !allowNonLocalReset) {
    throw new Error(
      'Refusing to reset a non-local E2E database. ' +
        'Use localhost/127.0.0.1/::1 or set E2E_ALLOW_NON_LOCAL_DB_RESET=true intentionally.',
    );
  }

  if (target.schema !== 'e2e' && !allowNonE2ESchemaReset) {
    throw new Error(
      `Refusing to reset schema "${target.schema}". Integrated E2E requires schema=e2e. ` +
        'Set E2E_ALLOW_DESTRUCTIVE_RESET=true only when intentionally resetting a disposable schema.',
    );
  }

  if (allowNonLocalReset) {
    log('WARNING: E2E_ALLOW_NON_LOCAL_DB_RESET=true allows resetting a non-local database target.');
  }

  if (allowNonE2ESchemaReset) {
    log('WARNING: E2E_ALLOW_DESTRUCTIVE_RESET=true allows resetting a schema different from e2e.');
  }
}

function runBestEffort(command, args, options = {}) {
  const resolved = resolveCommand(command, args);
  const result = spawnSync(resolved.command, resolved.args, {
    cwd: options.cwd || repoRoot,
    env: normalizeEnv(options.env || process.env),
    encoding: 'utf8',
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
  const resolved = resolveCommand(command, args);

  log(`${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn(resolved.command, resolved.args, {
      cwd,
      env: normalizeEnv(env),
      stdio: 'inherit',
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
  const resolved = resolveCommand(command, args);
  const child = spawn(resolved.command, resolved.args, {
    cwd: options.cwd || repoRoot,
    env: normalizeEnv(options.env || process.env),
    stdio: 'inherit',
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

  assertSafeE2EDatabaseReset(databaseUrl);

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
