import { parse } from "csv-parse/sync";

export function parseCsv(buffer: Buffer): Record<string, string>[] {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  }) as Record<string, unknown>[];

  return records.map((record) =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [
        String(key).trim(),
        value == null ? "" : String(value).trim()
      ])
    )
  );
}
