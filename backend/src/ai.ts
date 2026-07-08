import { GoogleGenAI } from "@google/genai";
import { aiResponseSchema } from "./schema.js";
import { SYSTEM_PROMPT, buildBatchPrompt } from "./prompt.js";
import { CrmRecord } from "./types.js";
import { normalizeRecord } from "./normalize.js";

type Extracted = { sourceRow: number; crm: CrmRecord };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function extractBatch(rows: Array<{ sourceRow: number; data: Record<string, string> }>): Promise<Extracted[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: buildBatchPrompt(rows),
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0, responseMimeType: "application/json" }
      });
      const content = response.text;
      if (!content) throw new Error("Gemini returned an empty response");
      const parsed = aiResponseSchema.parse(JSON.parse(content));
      const allowedRows = new Set(rows.map((row) => row.sourceRow));
      return parsed.records.filter((item) => allowedRows.has(item.sourceRow))
        .map((item) => ({ ...item, crm: normalizeRecord(item.crm) }));
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(500 * 2 ** (attempt - 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini batch failed");
}
