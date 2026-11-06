import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { assertEnv, env } from "./config/env.js";

const start = async () => {
  try {
    assertEnv();
    await connectDB(env.mongoUri);
    app.listen(env.port, () => console.log(`Server running on port ${env.port}`));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

start();
