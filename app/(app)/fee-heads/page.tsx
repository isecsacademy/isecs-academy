import { createClient } from "@/lib/supabase/server";
import { FeeHeadsClient } from "./fee-heads-client";

export const dynamic = "force-dynamic";

export default async function FeeHeadsPage() {
  const supabase = createClient();
  const { data: feeHeads } = await supabase
    .from("fee_heads")
    .select("id, head_name, amount, apply_to_all, created_date")
    .order("created_date", { ascending: false });

  return <FeeHeadsClient feeHeads={feeHeads ?? []} />;
}
