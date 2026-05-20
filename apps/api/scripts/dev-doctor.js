#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const apiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(apiRoot, "../..");
const webRoot = path.join(repoRoot, "apps", "web");
const apiEnvPath = path.join(apiRoot, ".env");
const webEnvPath = path.join(webRoot, ".env");
const EXPECTED_API_URL = "http://localhost:4000/api";
const EXPECTED_CORS_ORIGIN = "http://localhost:5173";
const EXPECTED_ADMIN_PASSWORD = "Admin12345DevOnly";

const checks = [];

function normalize(value) {
  return String(value ?? "").trim().replace(/^['\"]|['\"]$/g, "");
}

function record(ok, name, details) {
  checks.push({ ok, name, details });
}

function parseDotenvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const result = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = normalize(line.slice(separatorIndex + 1));

    result[key] = value;
  }

  return result;
}

function getDatabaseHost(databaseUrl) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return null;
  }
}

function dockerContainersUsingLocalDevPorts() {
  try {
    const output = execSync(
      "docker ps --format \"{{.Names}}|{{.Ports}}\"",
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }
    );

    return output
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => line.includes(":4000->") || line.includes(":8080->"))
      .map((line) => line.replace("|", " "));
  } catch {
    return [];
  }
}

function loadApiRuntimeEnv(apiEnv) {
  require("dotenv").config({ path: apiEnvPath, override: true });

  for (const [key, value] of Object.entries(apiEnv)) {
    process.env[key] = value;
  }
}

async function checkAdminUser(apiEnv) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcrypt");

    const prisma = new PrismaClient();

    try {
      const adminEmail = normalize(apiEnv.SEED_ADMIN_EMAIL || "admin@pos.local").toLowerCase();
      const expectedPassword = normalize(
        apiEnv.SEED_ADMIN_PASSWORD || EXPECTED_ADMIN_PASSWORD
      );

      const user = await prisma.user.findUnique({
        where: { email: adminEmail },
        select: {
          email: true,
          role: true,
          isActive: true,
          passwordHash: true
        }
      });

      if (!user) {
        record(false, "usuario administrador", `No existe ${adminEmail}. Ejecuta npm run dev:bootstrap.`);
        return;
      }

      record(user.role === "ADMIN", "rol administrador", `Rol actual: ${user.role}`);
      record(user.isActive, "administrador activo", `isActive=${user.isActive}`);

      const passwordMatches = await bcrypt.compare(expectedPassword, user.passwordHash);

      record(
        passwordMatches,
        "contraseña seed del administrador",
        passwordMatches
          ? "Coincide con SEED_ADMIN_PASSWORD."
          : "No coincide con SEED_ADMIN_PASSWORD. Ejecuta npm run dev:bootstrap para resembrar."
      );
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    record(
      false,
      "conexión Prisma/base de datos",
      `${error?.message ?? String(error)}. Ejecuta npm run api:prisma:generate y verifica PostgreSQL.`
    );
  }
}

async function main() {
  const apiEnv = parseDotenvFile(apiEnvPath);
  const webEnv = parseDotenvFile(webEnvPath);

  record(Boolean(apiEnv), "apps/api/.env", apiEnv ? "Existe." : "No existe. Copia apps/api/.env.example.");
  record(Boolean(webEnv), "apps/web/.env", webEnv ? "Existe." : "No existe. Copia apps/web/.env.example.");

  if (!apiEnv || !webEnv) {
    printAndExit();
  }

  const databaseUrl = normalize(apiEnv.DATABASE_URL);
  const databaseHost = getDatabaseHost(databaseUrl);

  record(
    Boolean(databaseHost),
    "DATABASE_URL válida",
    databaseHost ? `Host: ${databaseHost}` : "No se pudo parsear DATABASE_URL."
  );

  record(
    databaseHost !== "postgres",
    "DATABASE_URL para API local",
    databaseHost === "postgres"
      ? "Usa localhost desde npm run dev; 'postgres' solo funciona dentro de Docker Compose."
      : `Host actual: ${databaseHost}`
  );

  record(
    normalize(apiEnv.CORS_ORIGIN) === EXPECTED_CORS_ORIGIN,
    "CORS_ORIGIN local",
    `Actual: ${normalize(apiEnv.CORS_ORIGIN)} | Esperado: ${EXPECTED_CORS_ORIGIN}`
  );

  record(
    normalize(webEnv.VITE_API_URL) === EXPECTED_API_URL,
    "VITE_API_URL local",
    `Actual: ${normalize(webEnv.VITE_API_URL)} | Esperado: ${EXPECTED_API_URL}`
  );

  const cookieSecure = normalize(apiEnv.COOKIE_SECURE || "false").toLowerCase();
  const cookieSameSite = normalize(apiEnv.COOKIE_SAME_SITE || "lax").toLowerCase();

  record(
    !["true", "1", "yes", "on"].includes(cookieSecure),
    "COOKIE_SECURE local",
    `Actual: ${cookieSecure || "<vacío>"}. En http://localhost debe ser false.`
  );

  record(
    cookieSameSite === "lax",
    "COOKIE_SAME_SITE local",
    `Actual: ${cookieSameSite || "<vacío>"}. En desarrollo recomendado: lax.`
  );

  const conflictingContainers = dockerContainersUsingLocalDevPorts();

  record(
    conflictingContainers.length === 0,
    "contenedores Docker api/web detenidos",
    conflictingContainers.length === 0
      ? "No hay contenedores ocupando 4000/8080."
      : `Deténlos con: docker compose stop api web. Detectados: ${conflictingContainers.join("; ")}`
  );

  loadApiRuntimeEnv(apiEnv);
  await checkAdminUser(apiEnv);

  printAndExit();
}

function printAndExit() {
  console.log("\nDev doctor - Punta Venta\n");

  for (const check of checks) {
    const icon = check.ok ? "✓" : "✗";
    console.log(`${icon} ${check.name}`);

    if (check.details) {
      console.log(`  ${check.details}`);
    }
  }

  const failed = checks.filter((check) => !check.ok);

  if (failed.length > 0) {
    console.error(`\n${failed.length} verificación(es) fallaron. Corrige lo anterior antes de depurar la app.\n`);
    process.exit(1);
  }

  console.log("\nEntorno local consistente. Puedes iniciar API y web locales.\n");
}

main().catch((error) => {
  console.error("Dev doctor falló inesperadamente:", error);
  process.exit(1);
});
