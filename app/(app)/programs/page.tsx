import { createClient } from "@/lib/supabase/server";
import { ProgramsClient } from "./programs-client";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const supabase = createClient();

  const [{ data: programsRaw }, { data: teachers }] = await Promise.all([
    supabase
      .from("programs")
      .select("id, program_name, session, year, fee_amount, teacher_id, teachers(name)")
      .order("program_name"),
    supabase.from("teachers").select("id, name").order("name"),
  ]);

  const programs = (programsRaw ?? []).map((p: any) => ({
    id: p.id,
    program_name: p.program_name,
    session: p.session,
    year: p.year,
    fee_amount: p.fee_amount,
    teacher_id: p.teacher_id,
    teacher_name: p.teachers?.name ?? null,
  }));

  return <ProgramsClient programs={programs} teachers={teachers ?? []} />;
}
