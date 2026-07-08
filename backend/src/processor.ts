import { extractBatch } from "./ai.js";
import { hasContact } from "./normalize.js";
import { ImportJob } from "./types.js";

export async function processImport(
  job: ImportJob,
  rows: Record<string, string>[]
) {
  job.status = "processing";
  const batchSize = Math.max(1, Number(process.env.AI_BATCH_SIZE || 20));

  try {
    for (let start = 0; start < rows.length; start += batchSize) {
      const sourceBatch = rows.slice(start, start + batchSize).map((data, index) => ({
        sourceRow: start + index + 1,
        data
      }));

      const extracted = await extractBatch(sourceBatch);
      const byRow = new Map(extracted.map((item) => [item.sourceRow, item.crm]));

      for (const source of sourceBatch) {
        const crm = byRow.get(source.sourceRow);
        if (!crm) {
          job.skipped.push({
            sourceRow: source.sourceRow,
            reason: "AI did not return a valid structured record",
            original: source.data
          });
        } else if (!hasContact(crm)) {
          job.skipped.push({
            sourceRow: source.sourceRow,
            reason: "No email or mobile number found",
            original: source.data
          });
        } else {
          job.imported.push(crm);
        }
      }

      job.processedRows = Math.min(start + sourceBatch.length, rows.length);
      job.progress = rows.length
        ? Math.round((job.processedRows / rows.length) * 100)
        : 100;
    }

    job.status = "completed";
    job.progress = 100;
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Import failed";
  }
}
