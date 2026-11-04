import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
