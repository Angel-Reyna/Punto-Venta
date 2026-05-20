#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { execSync } = require("node:child_process");

const apiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(apiRoot, "../..");
const envPath = path.join(apiRoot, ".env");
const DEFAULT_PORT = 4000;
const EXPECTED_CORS_ORIGIN = "http://localhost:5173";
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function fail(message, details = []) {
  console.error(`\n[preflight] ${message}`);

  for (const detail of details) {
    console.error(`  - ${detail}`);
  }

  console.error("");
  process.exit(1);
}

function warn(message) {
  console.warn(`[preflight] ${message}`);
}

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    fail("No existe apps/api/.env.", [
      "Copia apps/api/.env.example a apps/api/.env.",
      "Para desarrollo local recomendado ejecuta desde la raíz: npm run dev:bootstrap"
    ]);
  }

  require("dotenv").config({ path: envPath });
}

function normalize(value) {
  return String(value ?? "").trim().replace(/^['\"]|['\"]$/g, "");
}

function parseDatabaseHost(databaseUrl) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return null;
  }
}

function getDockerPortOwners(port) {
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
      .filter((line) => line.includes(`:${port}->`))
      .map((line) => {
        const [name, ports] = line.split("|");
        return `${name} (${ports})`;
      });
  } catch {
    return [];
  }
}

function assertLocalEnv() {
  const nodeEnv = normalize(process.env.NODE_ENV || "development");
  const databaseUrl = normalize(process.env.DATABASE_URL);
  const corsOrigin = normalize(process.env.CORS_ORIGIN);
  const cookieSecure = normalize(process.env.COOKIE_SECURE || "false").toLowerCase();
  const cookieSameSite = normalize(process.env.COOKIE_SAME_SITE || "lax").toLowerCase();

  if (nodeEnv !== "development") {
    warn(`NODE_ENV=${nodeEnv}. El preflight está diseñado para npm run dev local.`);
  }

  if (!databaseUrl) {
    fail("DATABASE_URL no está definido en apps/api/.env.");
  }

  const databaseHost = parseDatabaseHost(databaseUrl);

  if (!databaseHost) {
    fail("DATABASE_URL no es una URL PostgreSQL válida.");
  }

  if (databaseHost === "postgres") {
    fail("DATABASE_URL apunta al host Docker interno 'postgres'.", [
      "Ese host solo funciona dentro de Docker Compose.",
      "Para API local usa: postgresql://postgres:postgres@localhost:5432/pos_senior_db?schema=public"
    ]);
  }

  if (!LOCAL_DATABASE_HOSTS.has(databaseHost)) {
    warn(
      `DATABASE_URL usa host '${databaseHost}'. Asegúrate de que sea intencional para desarrollo local.`
    );
  }

  if (corsOrigin !== EXPECTED_CORS_ORIGIN) {
    fail("CORS_ORIGIN no coincide con el frontend local esperado.", [
      `Valor actual: ${corsOrigin || "<vacío>"}`,
      `Valor recomendado: ${EXPECTED_CORS_ORIGIN}`,
      "Si abres el frontend en 127.0.0.1 en vez de localhost, cookies/CORS pueden fallar."
    ]);
  }

  if (["true", "1", "yes", "y", "on"].includes(cookieSecure)) {
    fail("COOKIE_SECURE=true no es válido para desarrollo local por HTTP.", [
      "Usa COOKIE_SECURE=false en apps/api/.env.",
      "Las cookies Secure no se envían por http://localhost."
    ]);
  }

  if (cookieSameSite === "none") {
    fail("COOKIE_SAME_SITE=none no es necesario ni recomendable para desarrollo local.", [
      "Usa COOKIE_SAME_SITE=lax con http://localhost:5173 y http://localhost:4000."
    ]);
  }
}

function assertPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error.code !== "EADDRINUSE") {
        fail(`No se pudo validar el puerto ${port}.`, [error.message]);
      }

      const dockerOwners = getDockerPortOwners(port);
      const details = [
        `El puerto ${port} ya está ocupado.`,
        "No levantes API Docker y API local al mismo tiempo."
      ];

      if (dockerOwners.length > 0) {
        details.push(`Contenedor Docker detectado: ${dockerOwners.join(", ")}`);
        details.push("Ejecuta desde la raíz: docker compose stop api web && docker compose up -d postgres");
      } else {
        details.push("En Windows revisa: netstat -ano | findstr :4000");
      }

      fail("No se puede iniciar la API local porque el puerto está ocupado.", details);
    });

    server.once("listening", () => {
      server.close(() => resolve());
    });

    server.listen(port);
  });
}

async function main() {
  loadEnv();
  assertLocalEnv();

  const port = Number.parseInt(normalize(process.env.PORT || DEFAULT_PORT), 10);

  if (!Number.isInteger(port) || port <= 0) {
    fail("PORT inválido en apps/api/.env.", [`Valor actual: ${process.env.PORT}`]);
  }

  await assertPortAvailable(port);
}

main().catch((error) => {
  fail("Preflight de desarrollo falló inesperadamente.", [error?.message ?? String(error)]);
});
