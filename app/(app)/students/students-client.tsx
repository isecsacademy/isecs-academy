"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
  StudentInput,
} from "./actions";

type Program = { id: string; program_name: string };

type Student = {
  id: string;
  registration_number: string;
  name: string;
  father_name: string | null;
  contact: string | null;
  admission_date: string | null;
};

function StudentForm({
  initial,
  programs,
  onDone,
}: {
  initial?: Student;
  programs: Program[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<StudentInput>({
    registration_number: initial?.registration_number ?? "",
    name: initial?.name ?? "",
    father_name: initial?.father_name ?? "",
    cnic_or_formb: "",
    contact: initial?.contact ?? "",
    address: "",
    admission_date: initial?.admission_date ?? new Date().toISOString().slice(0, 10),
    program_id: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.registration_number.trim() || !form.name.trim()) {
      setError("Registration number and name are required.");
      return;
    }
    if (!initial && !form.program_id) {
      setError("Please select the admitted program.");
      return;
    }
    setSaving(true);
    const result = initial ? await updateStudent(initial.id, form) : await createStudent(form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Registration No. *
          </label>
          <input
            value={form.registration_number}
            onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Father&apos;s Name
          </label>
          <input
            value={form.father_name}
            onChange={(e) => setForm({ ...form, father_name: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            CNIC / Form-B
          </label>
          <input
            value={form.cnic_or_formb}
            onChange={(e) => setForm({ ...form, cnic_or_formb: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Contact</label>
          <input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Admission Date
          </label>
          <input
            type="date"
            value={form.admission_date ?? ""}
            onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {!initial && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Admitted Program *
          </label>
          <select
            value={form.program_id}
            onChange={(e) => setForm({ ...form, program_id: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— Select a program —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.program_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : initial ? "Update Student" : "Add Student"}
      </button>
    </form>
  );
}

export function StudentsClient({
  initialStudents,
  programs,
}: {
  initialStudents: Student[];
  programs: Program[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState(initialStudents);
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; student: Student }>(
    null
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await searchStudents(query);
        setStudents(results);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function close() {
    setModal(null);
    router.refresh();
    // re-run current search to reflect the new/edited row
    startTransition(async () => {
      const results = await searchStudents(query);
      setStudents(results);
    });
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this student? This also deletes their enrollments, charges, and payment history."
      )
    )
      return;
    setDeleting(id);
    await deleteStudent(id);
    setDeleting(null);
    startTransition(async () => {
      const results = await searchStudents(query);
      setStudents(results);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Students</h1>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Student
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or registration number..."
        className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Reg. No.</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Father&apos;s Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Admitted</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {isPending ? "Searching..." : "No students found."}
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 text-slate-600">{s.registration_number}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2 text-slate-600">{s.father_name || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{s.contact || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{s.admission_date || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setModal({ mode: "edit", student: s })}
                      className="mr-3 text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deleting === s.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {modal.mode === "add" ? "Add Student" : "Edit Student"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <StudentForm
              initial={modal.mode === "edit" ? modal.student : undefined}
              programs={programs}
              onDone={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
