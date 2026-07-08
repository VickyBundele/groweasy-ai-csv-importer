import { CrmRecord } from "./types.js";

export function normalizeRecord(record: CrmRecord): CrmRecord {
  const clean = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      String(value ?? "").replace(/\r?\n/g, "\\n").trim()
    ])
  ) as CrmRecord;

  if (clean.created_at && Number.isNaN(new Date(clean.created_at).getTime())) {
    clean.created_at = "";
  }

  clean.country_code = clean.country_code
    ? `+${clean.country_code.replace(/\D/g, "")}`
    : "";

  clean.mobile_without_country_code =
    clean.mobile_without_country_code.replace(/\D/g, "");

  return clean;
}

export function hasContact(record: CrmRecord): boolean {
  return Boolean(record.email || record.mobile_without_country_code);
}
