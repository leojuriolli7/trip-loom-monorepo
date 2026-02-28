import { spawnSync } from "node:child_process";
import { Client } from "pg";

const getDatabaseNameFromUrl = (databaseUrl: string): string => {
  const parsed = new URL(databaseUrl);
  const pathname = parsed.pathname.replace(/^\/+/, "");
  if (!pathname) {
    throw new Error("DATABASE_URL must include a database name in the path");
  }
  return decodeURIComponent(pathname);
};

const withDatabaseName = (
  databaseUrl: string,
  databaseName: string,
): string => {
  const parsed = new URL(databaseUrl);
  parsed.pathname = `/${encodeURIComponent(databaseName)}`;
  return parsed.toString();
};

const isLocalDatabaseHost = (databaseUrl: string): boolean => {
  const host = new URL(databaseUrl).hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "postgres"
  );
};

const quoteIdentifier = (value: string): string =>
  `"${value.replace(/"/g, '""')}"`;
const quoteLiteral = (value: string): string =>
  `'${value.replace(/'/g, "''")}'`;

const runOrExit = (
  command: string,
  args: string[],
  extraEnv: NodeJS.ProcessEnv,
) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const recreateTestDatabase = async (
  baseDatabaseUrl: string,
  testDatabaseName: string,
) => {
  const adminDatabaseUrl = withDatabaseName(baseDatabaseUrl, "postgres");
  const admin = new Client({ connectionString: adminDatabaseUrl });
  await admin.connect();

  const dbNameLiteral = quoteLiteral(testDatabaseName);
  const dbNameIdentifier = quoteIdentifier(testDatabaseName);

  try {
    await admin.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ${dbNameLiteral}
        AND pid <> pg_backend_pid();
    `);

    await admin.query(`DROP DATABASE IF EXISTS ${dbNameIdentifier};`);
    await admin.query(`CREATE DATABASE ${dbNameIdentifier};`);
  } finally {
    await admin.end();
  }
};

const run = async () => {
  const baseDatabaseUrl = process.env.DATABASE_URL;
  if (!baseDatabaseUrl) {
    throw new Error("DATABASE_URL is required to run API tests");
  }

  const sourceDatabaseName = getDatabaseNameFromUrl(baseDatabaseUrl);
  const testDatabaseName = `${sourceDatabaseName}_test`;

  if (!isLocalDatabaseHost(baseDatabaseUrl)) {
    throw new Error("Refusing to run tests on non-local DATABASE_URL host.");
  }

  if (sourceDatabaseName === testDatabaseName) {
    throw new Error(
      "Source database and test database names must differ. Refusing to continue.",
    );
  }

  const testDatabaseUrl = withDatabaseName(baseDatabaseUrl, testDatabaseName);

  await recreateTestDatabase(baseDatabaseUrl, testDatabaseName);

  runOrExit("pnpm", ["exec", "drizzle-kit", "migrate"], {
    DATABASE_URL: testDatabaseUrl,
    NODE_ENV: "test",
    TZ: "UTC",
  });

  runOrExit("bun", ["test", "--preload", "./src/__tests__/setup.ts"], {
    DATABASE_URL: testDatabaseUrl,
    NODE_ENV: "test",
    TZ: "UTC",
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
