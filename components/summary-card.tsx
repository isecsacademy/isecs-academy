export function SummaryCard({
  label,
  value,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  accent?: "brand" | "gold" | "red" | "green";
}) {
  const accentClasses: Record<string, string> = {
    brand: "text-brand-600",
    gold: "text-gold-600",
    red: "text-red-600",
    green: "text-green-600",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accentClasses[accent]}`}>{value}</p>
    </div>
  );
}
