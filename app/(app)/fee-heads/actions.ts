"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FeeHeadInput = {
  head_name: string;
  amount: number;
  apply_to_all: boolean;
};

export async function createFeeHead(input: FeeHeadInput) {
  const supabase = createClient();

  const { data: head, error } = await supabase
    .from("fee_heads")
    .insert({
      head_name: input.head_name.trim(),
      amount: input.amount,
      apply_to_all: input.apply_to_all,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, imposedCount: 0 };

  let imposedCount = 0;
  if (input.apply_to_all) {
    // Calls the impose_head_on_all_students() Postgres function, which
    // skips any student currently struck off.
    const { data, error: imposeError } = await supabase.rpc(
      "impose_head_on_all_students",
      { p_head_id: head.id }
    );
    if (imposeError) return { error: imposeError.message, imposedCount: 0 };
    imposedCount = data ?? 0;
  }

  revalidatePath("/fee-heads");
  return { error: null, imposedCount };
}

export async function updateFeeHead(id: string, input: Pick<FeeHeadInput, "head_name" | "amount">) {
  const supabase = createClient();
  // Note: amount here only affects the head's default going forward.
  // Existing student_charges keep their snapshot amount, by design.
  const { error } = await supabase
    .from("fee_heads")
    .update({ head_name: input.head_name.trim(), amount: input.amount })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fee-heads");
  return { error: null };
}

export async function deleteFeeHead(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fee_heads").delete().eq("id", id);
  if (error) {
    if (error.message.includes("charges have already been created")) {
      return {
        error: "Can't delete — charges have already been created from this fee head.",
      };
    }
    return { error: error.message };
  }
  revalidatePath("/fee-heads");
  return { error: null };
}
