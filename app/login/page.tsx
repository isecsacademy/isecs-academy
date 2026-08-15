import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="ISECS Academy logo"
            width={90}
            height={90}
            className="mb-3"
            priority
          />
          <h1 className="text-lg font-bold text-brand-700">
            The Institute of Spoken English
            <br />
            and Computer Science
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-gold-600">
            Come, Learn and Inspire
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Developed by Aimal Khan — Software Developer &amp; IT Instructor
        </p>
      </div>
    </div>
  );
}
