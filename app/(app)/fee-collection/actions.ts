"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function searchStudentsForFee(query: string) {
  const supabase = createClient();
  if (!query.trim()) return [];

  const { data } = await supabase
    .from("students")
    .select("id, registration_number, name")
    .or(`name.ilike.%${query}%,registration_number.ilike.%${query}%`)
    .limit(20);
  return data ?? [];
}

export async function getStudentFeeDetail(studentId: string) {
  const supabase = createClient();

  const [{ data: student }, { data: charges }, { data: struckOff }, { data: feeHeads }] =
    await Promise.all([
      supabase
        .from("students")
        .select("id, registration_number, name, father_name, contact")
        .eq("id", studentId)
        .single(),
      supabase
        .from("v_charge_balances")
        .select("*")
        .eq("student_id", studentId)
        .order("date_imposed", { ascending: false }),
      supabase
        .from("strike_offs")
        .select("id, reason, date_struck_off")
        .eq("student_id", studentId)
        .is("date_readmitted", null)
        .maybeSingle(),
      supabase.from("fee_heads").select("id, head_name, amount").order("head_name"),
    ]);

  // Payment history across all of this student's charges
  const chargeIds = (charges ?? []).map((c) => c.charge_id);
  let payments: any[] = [];
  if (chargeIds.length > 0) {
    const { data } = await supabase
      .from("fee_payments")
      .select("id, charge_id, amount_paid, payment_date, receipt_number")
      .in("charge_id", chargeIds)
      .order("payment_date", { ascending: false });
    payments = data ?? [];
  }

  return {
    student,
    charges: charges ?? [],
    payments,
    isStruckOff: !!struckOff,
    strikeOffInfo: struckOff,
    feeHeads: feeHeads ?? [],
  };
}

export async function recordPayment(chargeId: string, amountPaid: number) {
  const supabase = createClient();

  if (amountPaid <= 0) return { error: "Amount must be greater than zero.", payment: null };

  const { data: payment, error } = await supabase
    .from("fee_payments")
    .insert({ charge_id: chargeId, amount_paid: amountPaid })
    .select("id, amount_paid, payment_date, receipt_number")
    .single();

  if (error) return { error: error.message, payment: null };

  revalidatePath("/fee-collection");
  revalidatePath("/arrears");
  revalidatePath("/");
  return { error: null, payment };
}

export async function addManualCharge(
  studentId: string,
  headId: string,
  amountOverride?: number
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("add_manual_charge", {
    p_student_id: studentId,
    p_head_id: headId,
    p_amount_override: amountOverride ?? null,
  });

  if (error) {
    if (error.message.includes("currently struck off")) {
      return {
        error:
          "This student is currently struck off — reinstate them via Strike Off / Readmission before billing new charges.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/fee-collection");
  return { error: null, chargeId: data as string };
}
