"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TeacherInput = {
  name: string;
  cnic?: string;
  contact?: string;
  address?: string;
  date_of_joining?: string;
};

export async function createTeacher(input: TeacherInput) {
  const supabase = createClient();
  const { error } = await supabase.from("teachers").insert({
    name: input.name,
    cnic: input.cnic || null,
    contact: input.contact || null,
    address: input.address || null,
    date_of_joining: input.date_of_joining || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teachers");
  return { error: null };
}

export async function updateTeacher(id: string, input: TeacherInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from("teachers")
    .update({
      name: input.name,
      cnic: input.cnic || null,
      contact: input.contact || null,
      address: input.address || null,
      date_of_joining: input.date_of_joining || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/teachers");
  return { error: null };
}

export async function deleteTeacher(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/teachers");
  return { error: null };
}
