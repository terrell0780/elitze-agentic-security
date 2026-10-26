import type { Pool, PoolClient } from "pg";

type ReleaseClient = (error?: Error | boolean) => void;
type ConnectCallback = (
  error: Error | undefined,
  client: PoolClient | undefined,
  release: ReleaseClient,
) => void;

/**
 * Run SET ROLE before exposing a PostgreSQL pool client to application code.
 * This keeps initialization in the same physical session as later queries.
 * If initialization fails, the client is destroyed and no application query
 * is allowed to proceed on that connection.
 */
export function configureRuntimeRole(targetPool: Pool, configuredRole: string | undefined): void {
  const role = configuredRole?.trim();
  if (!role) return;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(role)) {
    throw new Error("ELITZE_DB_RUNTIME_ROLE must be a valid PostgreSQL role identifier.");
  }

  const originalConnect = targetPool.connect.bind(targetPool);

  targetPool.connect = ((callback?: unknown) => {
    if (typeof callback === "function") {
      originalConnect((error, client, release) => {
        const done = callback as ConnectCallback;
        if (error || !client) {
          done(error ?? new Error("PostgreSQL pool returned no client."), undefined, release);
          return;
        }

        client.query(`SET ROLE "${role}"`, (roleError) => {
          if (roleError) {
            release(roleError);
            done(roleError, undefined, release);
            return;
          }
          done(undefined, client, release);
        });
      });
      return undefined;
    }

    return originalConnect().then(async (client) => {
      try {
        await client.query(`SET ROLE "${role}"`);
        return client;
      } catch (error) {
        client.release(error instanceof Error ? error : new Error("PostgreSQL runtime role initialization failed."));
        throw error;
      }
    });
  }) as typeof targetPool.connect;
}
