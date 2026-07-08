export const CRM_STATUSES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE"
] as const;

export const DATA_SOURCES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots"
] as const;

export type CrmRecord = {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
};

export type SkippedRecord = {
  sourceRow: number;
  reason: string;
  original: Record<string, string>;
};

export type ImportJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  totalRows: number;
  processedRows: number;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  error?: string;
  createdAt: number;
};
