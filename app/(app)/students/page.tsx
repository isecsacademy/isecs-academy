import { createClient } from "@/lib/supabase/server";
import { StudentsClient } from "./students-client";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = createClient();

  const [{ data: students }, { data: programs }] = await Promise.all([
    supabase
      .from("students")
      .select("id, registration_number, name, father_name, contact, admission_date")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("programs").select("id, program_name").order("program_name"),
  ]);

  return (
    <StudentsClient initialStudents={students ?? []} programs={programs ?? []} />
  );
}
