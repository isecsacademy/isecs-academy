import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/teachers", label: "Teachers" },
  { href: "/programs", label: "Programs" },
  { href: "/students", label: "Students" },
  { href: "/fee-heads", label: "Fee Detail" },
  { href: "/fee-collection", label: "Fee Collection" },
  { href: "/arrears", label: "Arrears" },
  { href: "/donations", label: "Donations" },
  { href: "/expenses", label: "Expenses" },
  { href: "/reports", label: "Monthly Report" },
  { href: "/results", label: "Results" },
  { href: "/strike-off", label: "Strike Off" },
  { href: "/attendance", label: "Attendance" },
];

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="ISECS Academy" width={40} height={40} />
          <div className="leading-tight">
            <p className="text-sm font-bold text-brand-700">ISECS Academy</p>
            <p className="text-[11px] text-gold-600">Come, Learn and Inspire</p>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Sign Out
          </button>
        </form>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
