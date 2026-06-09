#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function printHelp() {
  console.log(`Usage:
  node scripts/project/create-continuity-snapshot.js [--with-qa] [--clean] [--allow-dirty]

Creates a continuity bundle under .puntaventa_diagnostics/:
  - diagnostics log
  - next-chat handoff markdown
  - sanitized project tar.gz

Options:
  --with-qa      Run the main validation commands and include their output in the log.
  --clean        Remove previous files inside .puntaventa_diagnostics before generating new ones.
  --allow-dirty  Allow archive generation when Git has local changes. Uses tar with strict excludes.
  --help, -h     Show this help.
`);
}

const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(['--with-qa', '--clean', '--allow-dirty', '--help', '-h']);

for (const arg of args) {
  if (!allowedArgs.has(arg)) {
    console.error(`Unknown option: ${arg}`);
    printHelp();
    process.exit(2);
  }
}

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

function runCapture(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: 'utf8',
    shell: false,
  });
}

function getRepoRoot() {
  const result = runCapture('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd() });
  if (result.status === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }

  return process.cwd();
}

const repoRoot = getRepoRoot();
const outDir = path.join(repoRoot, '.puntaventa_diagnostics');
const runQa = args.has('--with-qa');
const cleanBefore = args.has('--clean');
const allowDirty = args.has('--allow-dirty');

function pad(value) {
  return String(value).padStart(2, '0');
}

function createStamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}

function safeRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/gu, '/');
}

function cleanDiagnosticsDirectory() {
  if (!fs.existsSync(outDir)) {
    return 0;
  }

  let removed = 0;

  for (const entry of fs.readdirSync(outDir)) {
    if (entry === '.gitkeep') {
      continue;
    }

    fs.rmSync(path.join(outDir, entry), { recursive: true, force: true });
    removed += 1;
  }

  return removed;
}

function append(text) {
  fs.appendFileSync(logPath, text);
}

function appendLine(text = '') {
  append(`${text}\n`);
}

function runLogged(command, commandArgs, options = {}) {
  const printable = [command, ...commandArgs].join(' ');
  appendLine('');
  appendLine('============================================================');
  appendLine(`$ ${printable}`);
  appendLine('============================================================');

  const result = runCapture(command, commandArgs, { cwd: options.cwd || repoRoot, env: options.env });

  if (result.stdout) {
    append(result.stdout);
    if (!result.stdout.endsWith('\n')) {
      appendLine();
    }
  }

  if (result.stderr) {
    append(result.stderr);
    if (!result.stderr.endsWith('\n')) {
      appendLine();
    }
  }

  if (result.error) {
    appendLine(`ERROR=${result.error.message}`);
  }

  appendLine(`EXIT_CODE=${result.status ?? 1}`);
  return result;
}

fs.mkdirSync(outDir, { recursive: true });

if (cleanBefore) {
  const removed = cleanDiagnosticsDirectory();
  console.log(`Cleaned ${removed} previous diagnostic artifact(s) from .puntaventa_diagnostics/.`);
  fs.mkdirSync(outDir, { recursive: true });
}

const stamp = createStamp();
const logPath = path.join(outDir, `punta-venta-current-diagnostics-${stamp}.txt`);
const handoffPath = path.join(outDir, `punta-venta-continuity-${stamp}.md`);
const archivePath = path.join(outDir, `Punta_Venta_current_${stamp}.tar.gz`);

appendLine('PUNTA VENTA CURRENT DIAGNOSTICS');
appendLine(`DATE: ${new Date().toString()}`);
appendLine(`PWD: ${repoRoot}`);
appendLine(`RUN_QA: ${runQa}`);
appendLine(`ALLOW_DIRTY_ARCHIVE: ${allowDirty}`);
appendLine('');

runLogged('git', ['--no-pager', 'status', '--short', '--untracked-files=all']);
runLogged('git', ['--no-pager', 'log', '--oneline', '-30']);
runLogged('git', ['--no-pager', 'diff', '--stat']);
runLogged('git', ['--no-pager', 'diff', '--check']);
runLogged('node', ['-v']);
runLogged('npm', ['-v']);
runLogged('docker', ['--version']);
runLogged('docker', ['compose', 'version']);

if (runQa) {
  const qaCommands = [
    ['npm', ['run', 'ci:validate-lockfiles']],
    ['npm', ['run', 'qa:guardrails']],
    ['npm', ['run', 'api:prisma:validate']],
    ['npm', ['run', 'api:build']],
    ['npm', ['run', 'api:test:critical']],
    ['npm', ['run', 'web:build']],
    ['npm', ['run', 'web:test']],
    ['npm', ['run', 'web:e2e']],
    ['npm', ['run', 'web:e2e:integration']],
    ['npm', ['run', 'docker:config']],
    ['npm', ['run', 'docker:build']],
  ];

  for (const [command, commandArgs] of qaCommands) {
    runLogged(command, commandArgs);
  }
} else {
  appendLine('');
  appendLine('QA commands skipped. Re-run with --with-qa to include validation output.');
}

appendLine('');
appendLine('============================================================');
appendLine('PROJECT STRUCTURE');
appendLine('============================================================');
runLogged('node', [
  '-e',
  `const fs=require('fs'); const roots=['apps/api/src','apps/web/src','docs','scripts','.github']; for (const root of roots) { if (!fs.existsSync(root)) continue; const walk=(dir)=>{ for (const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) { const p=dir+'/'+entry.name; if (entry.isDirectory()) walk(p); else console.log(p); } }; walk(root); }`,
]);

function getGitStatus() {
  const result = runCapture('git', ['--no-pager', 'status', '--short', '--untracked-files=all'], {
    cwd: repoRoot,
  });

  if (result.status !== 0) {
    throw new Error(`Could not read git status: ${result.stderr || result.stdout}`);
  }

  return result.stdout.trim();
}

function getArchiveOutputPath() {
  // Git Bash tar treats Windows absolute paths with a drive letter as a remote archive target.
  // Keep the archive path relative to repoRoot because archive commands run with cwd=repoRoot.
  return safeRelative(archivePath);
}

function createArchiveFromGit() {
  return runCapture('git', ['archive', '--format=tar.gz', '--output', getArchiveOutputPath(), 'HEAD'], {
    cwd: repoRoot,
  });
}

function createArchiveFromWorkingTree() {
  const excludes = [
    './.git',
    './node_modules',
    './apps/api/node_modules',
    './apps/web/node_modules',
    './dist',
    './apps/api/dist',
    './apps/web/dist',
    './coverage',
    './apps/api/coverage',
    './apps/web/coverage',
    './test-results',
    './apps/web/test-results',
    './playwright-report',
    './apps/web/playwright-report',
    './.puntaventa_diagnostics',
    './.env',
    './.env.*',
    './apps/api/.env',
    './apps/api/.env.*',
    './apps/web/.env',
    './apps/web/.env.*',
    './uploads',
    './exports',
    './backups/*',
    './*.log',
    './*.xlsx',
    './*.pdf',
    '*.tsbuildinfo',
  ];

  const tarArgs = [...excludes.map((pattern) => `--exclude=${pattern}`), '-czf', getArchiveOutputPath(), '.'];
  return runCapture('tar', tarArgs, { cwd: repoRoot });
}

const gitStatus = getGitStatus();
let archiveResult;
let archiveMode;

if (!gitStatus) {
  archiveMode = 'git archive HEAD';
  archiveResult = createArchiveFromGit();
} else if (allowDirty) {
  archiveMode = 'working tree tar with strict excludes';
  archiveResult = createArchiveFromWorkingTree();
} else {
  appendLine('');
  appendLine('ARCHIVE_SKIPPED=Git working tree is not clean. Commit/stash changes or rerun with --allow-dirty.');
  archiveResult = { status: 1, stdout: '', stderr: 'Git working tree is not clean.' };
}

appendLine('');
appendLine('============================================================');
appendLine('ARCHIVE');
appendLine('============================================================');
appendLine(`MODE=${archiveMode || 'skipped'}`);
appendLine(`PATH=${safeRelative(archivePath)}`);
if (archiveResult.stdout) append(archiveResult.stdout);
if (archiveResult.stderr) append(archiveResult.stderr);
appendLine(`EXIT_CODE=${archiveResult.status ?? 1}`);

if (archiveResult.status !== 0) {
  console.error('Snapshot archive could not be created. See diagnostics log for details.');
  console.error(safeRelative(logPath));
  process.exit(1);
}

const handoff = `# Punta Venta — Handoff para nuevo chat

Generado: ${new Date().toString()}
Ruta local esperada: \`C:\\Users\\drago\\Proyectos\\Punta_Venta\`
Snapshot: \`${safeRelative(archivePath)}\`
Diagnóstico: \`${safeRelative(logPath)}\`

## Mensaje para pegar

Estoy continuando el proyecto Punta Venta desde un snapshot actual del repositorio.

Adjunto:
- \`${path.basename(archivePath)}\`
- \`${path.basename(logPath)}\`
- \`${path.basename(handoffPath)}\`

Primero reconstruye el estado real desde los adjuntos. No asumas código de chats anteriores ni generes patches antes de revisar el snapshot.

Reglas operativas:
- Responder en español.
- Usar comandos autocerrables; evitar paginadores. Para Git, usar \`git --no-pager\`.
- Indicar si conviene ejecutar comandos con proyecto local levantado o bajado.
- Para Docker Compose completo, proyecto local bajado para evitar conflictos de puertos.
- Antes de generar nuevos diagnósticos/snapshots/patches, limpiar temporales anteriores en \`.puntaventa_diagnostics/\`.
- No crear scripts \`.sh\` ni \`.bak\` nuevos.
- Mantener snapshots sin \`.env\`, secretos, builds, reportes de Playwright ni dependencias.

Modelo funcional obligatorio:
Punta Venta no es un POS clásico dependiente de caja. El flujo vigente es admin/dueño + vendedores. CASHIER puede existir como enum técnico, pero en UI/documentación debe tratarse como Vendedor.

Comandos base:

\`\`\`bash
cd "/c/Users/drago/Proyectos/Punta_Venta"

git --no-pager status --short --untracked-files=all
git --no-pager log --oneline -20
npm run qa:guardrails
npm run api:prisma:validate
npm run api:build
npm run api:test:critical
npm run web:build
npm run web:e2e
\`\`\`

Validación Docker, con proyecto local bajado:

\`\`\`bash
npm run docker:config
npm run docker:build
docker compose up -d postgres api web
docker compose ps
curl -f http://localhost:4001/health
curl -I http://localhost:8080
\`\`\`
`;

fs.writeFileSync(handoffPath, handoff);

console.log('Continuity files generated:');
console.log(safeRelative(handoffPath));
console.log(safeRelative(logPath));
console.log(safeRelative(archivePath));
