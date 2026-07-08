import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { parseCsv } from "./csv.js";
import { createJob, getJob } from "./jobs.js";
import { processImport } from "./processor.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(",") || "http://localhost:3000"
}));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/imports", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "CSV file is required" });
      return;
    }

    const isCsv =
      req.file.originalname.toLowerCase().endsWith(".csv") ||
      ["text/csv", "application/vnd.ms-excel"].includes(req.file.mimetype);

    if (!isCsv) {
      res.status(400).json({ message: "Only CSV files are accepted" });
      return;
    }

    const rows = parseCsv(req.file.buffer);
    if (!rows.length) {
      res.status(400).json({ message: "CSV has no data rows" });
      return;
    }

    const job = createJob(rows.length);
    void processImport(job, rows);

    res.status(202).json({ jobId: job.id, status: job.status });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Invalid CSV"
    });
  }
});

app.get("/api/imports/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ message: "Import job not found or expired" });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    totalImported: job.imported.length,
    totalSkipped: job.skipped.length,
    imported: job.status === "completed" ? job.imported : [],
    skipped: job.status === "completed" ? job.skipped : [],
    error: job.error
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.status(500).json({ message: "Unexpected server error" });
});

const host = "0.0.0.0";

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "GrowEasy AI CSV Importer API"
  });
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(port, host, () => {
  console.log(`GrowEasy importer API running on ${host}:${port}`);
});
