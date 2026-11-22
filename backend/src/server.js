import "dotenv/config";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { assertEnv, env } from "./config/env.js";

const SHUTDOWN_TIMEOUT_MS = 10000;

function listen() {
  return new Promise((resolve, reject) => {
    const server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      resolve(server);
    });
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(`Port ${env.port} is already in use. Set a different PORT in backend/.env.`));
        return;
      }
      reject(error);
    });
  });
}

function registerShutdown(server) {
  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down.`);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

async function start() {
  try {
    assertEnv();
    process.env.TZ = env.timezone;
    await connectDB(env.mongoUri);
    registerShutdown(await listen());
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

start();
