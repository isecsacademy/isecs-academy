"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProgramInput = {
  program_name: string;
  session?: string;
  year?: number | null;
  fee_amount: number;
  teacher_id?: string | null;
};

export async function createProgram(input: ProgramInput) {
  const supabase = createClient();
  const { error } = await supabase.from("programs").insert({
    program_name: input.program_name,
    session: input.session || null,
    year: input.year ?? null,
    fee_amount: input.fee_amount,
    teacher_id: input.teacher_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/programs");
  return { error: null };
}

export async function updateProgram(id: string, input: ProgramInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from("programs")
    .update({
      program_name: input.program_name,
      session: input.session || null,
      year: input.year ?? null,
      fee_amount: input.fee_amount,
      teacher_id: input.teacher_id || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/programs");
  return { error: null };
}

export async function deleteProgram(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) {
    // The prevent_program_delete_if_enrolled trigger raises a Postgres
    // exception when students are actively enrolled — surface it clearly.
    if (error.message.includes("students are currently enrolled")) {
      return {
        error:
          "Can't delete this program — students are currently enrolled in it.",
      };
    }
    return { error: error.message };
  }
  revalidatePath("/programs");
  return { error: null };
}
