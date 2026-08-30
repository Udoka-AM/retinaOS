import { createServer } from "node:http";
import { env } from "./config/env.js";
import { log } from "./metrics/log.js";
import { runIngestionLoop } from "./ingestion/loop.js";
import { pool } from "./db/client.js";

const health = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "ok" }));
});
health.listen(env.healthPort, () => log.info("health endpoint up", { port: env.healthPort }));

runIngestionLoop().catch((err) => {
  log.error("ingestion loop crashed", { error: String(err) });
  process.exit(1);
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    log.info("shutting down", { signal: sig });
    health.close();
    await pool.end();
    process.exit(0);
  });
}
