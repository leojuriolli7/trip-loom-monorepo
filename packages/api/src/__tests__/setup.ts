/**
 * Setup file configured on vitest.config.ts
 *
 * Goal is to validate we are running tests against a test database, to avoid
 * running it against future staging or production DB.
 */
const ensureTestDatabase = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for tests");
  }

  const parsed = new URL(url);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));

  if (!dbName) {
    throw new Error("DATABASE_URL must include a database name");
  }

  if (!dbName.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against non-test database '${dbName}'. DATABASE_URL must target a '*_test' database.`,
    );
  }
};

ensureTestDatabase();
