import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { deckRoutes } from "./routes/deckRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", deckRoutes);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`JobLingo backend listening on ${env.PORT}`);
});
