"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProgram, updateProgram, deleteProgram, ProgramInput } from "./actions";

type Teacher = { id: string; name: string };

type Program = {
  id: string;
  program_name: string;
  session: string | null;
  year: number | null;
  fee_amount: number;
  teacher_id: string | null;
  teacher_name: string | null;
};

function ProgramForm({
  initial,
  teachers,
  onDone,
}: {
  initial?: Program;
  teachers: Teacher[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<ProgramInput>({
    program_name: initial?.program_name ?? "",
    session: initial?.session ?? "",
    year: initial?.year ?? new Date().getFullYear(),
    fee_amount: initial?.fee_amount ?? 0,
    teacher_id: initial?.teacher_id ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.program_name.trim()) {
      setError("Program name is required.");
      return;
    }
    setSaving(true);
    const result = initial
      ? await updateProgram(initial.id, form)
      : await createProgram(form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Program Name *
        </label>
        <input
          value={form.program_name}
          onChange={(e) => setForm({ ...form, program_name: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Session</label>
          <input
            value={form.session ?? ""}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
            placeholder="Morning / Evening"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Year</label>
          <input
            type="number"
            value={form.year ?? ""}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Fee Amount (Rs.) *
        </label>
        <input
          type="number"
          step="0.01"
          value={form.fee_amount}
          onChange={(e) => setForm({ ...form, fee_amount: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Assigned Teacher
        </label>
        <select
          value={form.teacher_id ?? ""}
          onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">— None —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : initial ? "Update Program" : "Add Program"}
      </button>
    </form>
  );
}

export function ProgramsClient({
  programs,
  teachers,
}: {
  programs: Program[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; program: Program }>(
    null
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function close() {
    setModal(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this program?")) return;
    setDeleting(id);
    setDeleteError(null);
    const result = await deleteProgram(id);
    setDeleting(null);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Programs</h1>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Program
        </button>
      </div>

      {deleteError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Session</th>
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">Fee</th>
              <th className="px-4 py-2">Teacher</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No programs yet.
                </td>
              </tr>
            ) : (
              programs.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{p.program_name}</td>
                  <td className="px-4 py-2 text-slate-600">{p.session || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{p.year || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    Rs. {Number(p.fee_amount).toFixed(0)}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.teacher_name || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setModal({ mode: "edit", program: p })}
                      className="mr-3 text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deleting === p.id ? "Deleting..." : "Delete"}
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {modal.mode === "add" ? "Add Program" : "Edit Program"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <ProgramForm
              initial={modal.mode === "edit" ? modal.program : undefined}
              teachers={teachers}
              onDone={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
