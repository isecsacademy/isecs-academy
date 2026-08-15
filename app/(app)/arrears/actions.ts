"use server";

import { createClient } from "@/lib/supabase/server";

export async function getArrears() {
  const supabase = createClient();
  const { data } = await supabase
    .from("v_charge_balances")
    .select("*")
    .gt("balance", 0)
    .order("date_imposed", { ascending: true });
  return data ?? [];
}
