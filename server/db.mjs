import pg from "pg";
import { config } from "./config.mjs";

const { Pool } = pg;

export function createDatabase(poolOverride) {
  const pool = poolOverride || new Pool({
    connectionString: config.database.url,
    max: config.database.poolMax,
    ssl: config.database.ssl ? { rejectUnauthorized: true } : false,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

  return {
    pool,
    query(text, values = []) {
      return pool.query(text, values);
    },
    async transaction(callback) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close() {
      return pool.end();
    },
  };
}
