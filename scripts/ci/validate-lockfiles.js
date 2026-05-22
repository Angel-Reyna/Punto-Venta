#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const apps = ["apps/api", "apps/web"];
const dependencySections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const forbiddenLocalSpecifiers = [/^file:\.\.\/?/, /^file:\.\.\/\.\./];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`No se pudo leer JSON en ${relativePath}: ${error.message}`);
  }
}

function assertFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Falta ${relativePath}. Docker usa npm ci y requiere lockfile.`);
  }
}

function collectDependencies(pkg) {
  const entries = [];

  for (const section of dependencySections) {
    const dependencies = pkg[section] ?? {};
    for (const [name, specifier] of Object.entries(dependencies)) {
      entries.push({ section, name, specifier: String(specifier) });
    }
  }

  return entries;
}

function assertNoInvalidLocalDependencies(appDir, pkg, lock) {
  const invalidPackageDeps = collectDependencies(pkg).filter(({ specifier }) =>
    forbiddenLocalSpecifiers.some((pattern) => pattern.test(specifier)),
  );

  if (invalidPackageDeps.length > 0) {
    const details = invalidPackageDeps
      .map(({ section, name, specifier }) => `${appDir}/package.json ${section}.${name}=${specifier}`)
      .join("\n");
    throw new Error(`Dependencias locales inválidas detectadas:\n${details}`);
  }

  const packages = lock.packages ?? {};
  for (const [packagePath, metadata] of Object.entries(packages)) {
    const dependencyEntries = collectDependencies(metadata ?? {});
    const invalidLockDeps = dependencyEntries.filter(({ specifier }) =>
      forbiddenLocalSpecifiers.some((pattern) => pattern.test(specifier)),
    );

    if (invalidLockDeps.length > 0 || packagePath === "../.." || packagePath === "node_modules/punta-venta") {
      const details = invalidLockDeps
        .map(({ section, name, specifier }) => `${appDir}/package-lock.json packages[${packagePath}] ${section}.${name}=${specifier}`)
        .join("\n");
      throw new Error(
        `Lockfile contiene dependencias locales inválidas en ${appDir}.` +
          (details ? `\n${details}` : `\nEntrada inválida: ${packagePath}`),
      );
    }
  }
}

function assertLockMatchesPackage(appDir, pkg, lock) {
  if (lock.name !== pkg.name) {
    throw new Error(`${appDir}/package-lock.json name=${lock.name} no coincide con package.json name=${pkg.name}`);
  }

  if (lock.version !== pkg.version) {
    throw new Error(`${appDir}/package-lock.json version=${lock.version} no coincide con package.json version=${pkg.version}`);
  }

  if (!Number.isInteger(lock.lockfileVersion) || lock.lockfileVersion < 1) {
    throw new Error(`${appDir}/package-lock.json debe tener lockfileVersion >= 1`);
  }

  const rootPackage = lock.packages?.[""];
  if (!rootPackage) {
    throw new Error(`${appDir}/package-lock.json no contiene packages[""]. Regenera el lockfile con npm install.`);
  }

  for (const { section, name, specifier } of collectDependencies(pkg)) {
    const lockedSpecifier = rootPackage[section]?.[name];
    if (lockedSpecifier !== specifier) {
      throw new Error(
        `${appDir}/package-lock.json no coincide con package.json para ${section}.${name}. ` +
          `package.json=${specifier}, lockfile=${lockedSpecifier ?? "<faltante>"}`,
      );
    }
  }
}

try {
  for (const appDir of apps) {
    const packageJsonPath = `${appDir}/package.json`;
    const packageLockPath = `${appDir}/package-lock.json`;

    assertFile(packageJsonPath);
    assertFile(packageLockPath);

    const pkg = readJson(packageJsonPath);
    const lock = readJson(packageLockPath);

    assertLockMatchesPackage(appDir, pkg, lock);
    assertNoInvalidLocalDependencies(appDir, pkg, lock);
  }

  console.log("Lockfiles válidos para CI/Docker.");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
