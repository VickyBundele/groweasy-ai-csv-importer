import { z } from "zod";
import { CRM_STATUSES, DATA_SOURCES } from "./types.js";

const emptyOrEmail = z.string().refine(
  (value) => value === "" || z.string().email().safeParse(value).success,
  "Invalid email"
);

export const crmRecordSchema = z.object({
  created_at: z.string(),
  name: z.string(),
  email: emptyOrEmail,
  country_code: z.string(),
  mobile_without_country_code: z.string(),
  company: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lead_owner: z.string(),
  crm_status: z.union([z.enum(CRM_STATUSES), z.literal("")]),
  crm_note: z.string(),
  data_source: z.union([z.enum(DATA_SOURCES), z.literal("")]),
  possession_time: z.string(),
  description: z.string()
});

export const aiResponseSchema = z.object({
  records: z.array(z.object({
    sourceRow: z.number().int().positive(),
    crm: crmRecordSchema
  }))
});
