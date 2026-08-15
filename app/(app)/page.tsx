import { createClient } from "@/lib/supabase/server";
import { SummaryCard } from "@/components/summary-card";

export const dynamic = "force-dynamic"; // always fetch fresh counts

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { count: totalStudents },
    { count: totalPrograms },
    { count: totalTeachers },
    { data: balances },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true }),
    supabase
      .from("v_student_balances")
      .select("student_id, name, registration_number, total_balance"),
  ]);

  const withArrears = (balances ?? []).filter((b) => Number(b.total_balance) > 0);
  const noDues = (balances ?? []).filter((b) => Number(b.total_balance) <= 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of ISECS Academy</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <SummaryCard label="Total Students" value={totalStudents ?? 0} />
        <SummaryCard label="Total Programs" value={totalPrograms ?? 0} accent="gold" />
        <SummaryCard label="Total Teachers" value={totalTeachers ?? 0} />
        <SummaryCard
          label="Students with Arrears"
          value={withArrears.length}
          accent="red"
        />
        <SummaryCard label="Students with No Dues" value={noDues.length} accent="green" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Students with No Dues
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2">Reg. No.</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {noDues.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No students with a clear balance yet.
                  </td>
                </tr>
              ) : (
                noDues.map((s) => (
                  <tr key={s.student_id} className="border-b border-slate-50">
                    <td className="px-4 py-2 text-slate-600">{s.registration_number}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-2 text-right text-green-600">
                      Rs. {Number(s.total_balance).toFixed(0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
