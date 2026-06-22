import pg from "pg";
import dotenv from "dotenv";
import { runMigrations } from "./migrate.js";

dotenv.config();

async function migrateFresh(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log("Dropping public schema...");
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO public");
  } finally {
    await client.end();
  }

  await runMigrations(connectionString);
}

migrateFresh().catch((error) => {
  console.error(error);
  process.exit(1);
});
