import { describe, expect, it } from "vitest";
import { hasContact, normalizeRecord } from "./normalize.js";
import { CrmRecord } from "./types.js";

const base: CrmRecord = {
  created_at: "", name: "", email: "", country_code: "",
  mobile_without_country_code: "", company: "", city: "", state: "",
  country: "", lead_owner: "", crm_status: "", crm_note: "",
  data_source: "", possession_time: "", description: ""
};

describe("normalizeRecord", () => {
  it("normalizes phone fields and escaped line breaks", () => {
    const result = normalizeRecord({
      ...base,
      country_code: "91",
      mobile_without_country_code: "987-654-3210",
      crm_note: "call\nlater"
    });
    expect(result.country_code).toBe("+91");
    expect(result.mobile_without_country_code).toBe("9876543210");
    expect(result.crm_note).toBe("call\\nlater");
  });

  it("clears invalid dates", () => {
    expect(normalizeRecord({ ...base, created_at: "not-a-date" }).created_at).toBe("");
  });
});

describe("hasContact", () => {
  it("rejects records without email and mobile", () => {
    expect(hasContact(base)).toBe(false);
  });

  it("accepts an email", () => {
    expect(hasContact({ ...base, email: "lead@example.com" })).toBe(true);
  });
});
