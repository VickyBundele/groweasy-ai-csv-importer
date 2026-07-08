import { randomUUID } from "node:crypto";
import { ImportJob } from "./types.js";

const jobs = new Map<string, ImportJob>();

export function createJob(totalRows: number): ImportJob {
  cleanupJobs();
  const job: ImportJob = {
    id: randomUUID(),
    status: "queued",
    progress: 0,
    totalRows,
    processedRows: 0,
    imported: [],
    skipped: [],
    createdAt: Date.now()
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string) {
  return jobs.get(id);
}

function cleanupJobs() {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > oneHour) jobs.delete(id);
  }
}
