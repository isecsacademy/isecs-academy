"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type StudentInput = {
  registration_number: string;
  name: string;
  father_name?: string;
  cnic_or_formb?: string;
  contact?: string;
  address?: string;
  admission_date?: string;
  program_id?: string; // only used on create, to set the initial enrollment
};

export async function createStudent(input: StudentInput) {
  const supabase = createClient();

  const { data: student, error } = await supabase
    .from("students")
    .insert({
      registration_number: input.registration_number.trim(),
      name: input.name.trim(),
      father_name: input.father_name || null,
      cnic_or_formb: input.cnic_or_formb || null,
      contact: input.contact || null,
      address: input.address || null,
      admission_date: input.admission_date || new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("duplicate key") || error.code === "23505") {
      return { error: "That registration number is already in use." };
    }
    return { error: error.message };
  }

  // Enroll into the admitted program, if one was chosen.
  if (input.program_id) {
    const { data: program } = await supabase
      .from("programs")
      .select("fee_amount")
      .eq("id", input.program_id)
      .single();

    const { error: enrollError } = await supabase.from("student_programs").insert({
      student_id: student.id,
      program_id: input.program_id,
      fee_amount: program?.fee_amount ?? 0, // snapshot at enrollment time
      admission_date: input.admission_date || new Date().toISOString().slice(0, 10),
      status: "active",
    });
    if (enrollError) return { error: enrollError.message };
  }

  revalidatePath("/students");
  return { error: null };
}

export async function updateStudent(id: string, input: Omit<StudentInput, "program_id">) {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({
      registration_number: input.registration_number.trim(),
      name: input.name.trim(),
      father_name: input.father_name || null,
      cnic_or_formb: input.cnic_or_formb || null,
      contact: input.contact || null,
      address: input.address || null,
      admission_date: input.admission_date || null,
    })
    .eq("id", id);

  if (error) {
    if (error.message.includes("duplicate key") || error.code === "23505") {
      return { error: "That registration number is already in use." };
    }
    return { error: error.message };
  }
  revalidatePath("/students");
  return { error: null };
}

export async function deleteStudent(id: string) {
  const supabase = createClient();
  // Cascades to student_programs, student_charges, fee_payments per schema.
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/students");
  return { error: null };
}

export async function searchStudents(query: string) {
  const supabase = createClient();
  if (!query.trim()) {
    const { data } = await supabase
      .from("students")
      .select("id, registration_number, name, father_name, contact, admission_date")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  }

  const { data } = await supabase
    .from("students")
    .select("id, registration_number, name, father_name, contact, admission_date")
    .or(`name.ilike.%${query}%,registration_number.ilike.%${query}%`)
    .limit(50);
  return data ?? [];
}
