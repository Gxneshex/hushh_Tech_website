import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/20260528033000_add_nda_metadata_v2_rpc.sql"
  ),
  "utf8"
);

describe("NDA PDF generation SQL contract", () => {
  it("keeps the Cloud Run metadata RPC available", () => {
    expect(migrationSql).toContain(
      "CREATE OR REPLACE FUNCTION public.get_nda_metadata_v2"
    );
    expect(migrationSql).toContain("p_current_gmt TEXT");
    expect(migrationSql).toContain("p_ip TEXT");
    expect(migrationSql).toContain("NOTIFY pgrst, 'reload schema'");
  });

  it("returns the response shape consumed by the deployed PDF generator", () => {
    expect(migrationSql).toContain("'status', 'success'");
    expect(migrationSql).toContain("'investor_type', 'Individual'");
    expect(migrationSql).toContain("'metadata', v_metadata");
    expect(migrationSql).toContain("'legal_email'");
    expect(migrationSql).toContain("'mobile_telephone'");
    expect(migrationSql).toContain("'individual_address'");
  });
});
