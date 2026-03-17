import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/telemetry";
import processTreeRouter from "./routes/processTree";
import detectionRouter from "./routes/detection";
import responseRouter from "./routes/response";

const app = express();
const PORT = 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/telemetry", telemetryRouter);
app.use("/api/process-tree", processTreeRouter);
app.use("/api/detection", detectionRouter);
app.use("/api/response", responseRouter);

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  EDR Backend running on http://localhost:${PORT}`);
  console.log(`   Telemetry  : GET  /api/telemetry`);
  console.log(`   SSE Stream : GET  /api/telemetry/stream`);
  console.log(`   Process Tree: GET /api/process-tree`);
  console.log(`   Detection  : GET  /api/detection`);
  console.log(`   Response   : POST /api/response/action\n`);
});

export default app;
