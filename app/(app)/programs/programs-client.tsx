"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeacher, updateTeacher, deleteTeacher, TeacherInput } from "./actions";

type Teacher = {
  id: string;
  name: string;
  cnic: string | null;
  contact: string | null;
  address: string | null;
  date_of_joining: string | null;
};

function TeacherForm({
  initial,
  onDone,
}: {
  initial?: Teacher;
  onDone: () => void;
}) {
  const [form, setForm] = useState<TeacherInput>({
    name: initial?.name ?? "",
    cnic: initial?.cnic ?? "",
    contact: initial?.contact ?? "",
    address: initial?.address ?? "",
    date_of_joining: initial?.date_of_joining ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    const result = initial
      ? await updateTeacher(initial.id, form)
      : await createTeacher(form);
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">CNIC</label>
        <input
          value={form.cnic}
          onChange={(e) => setForm({ ...form, cnic: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Contact</label>
        <input
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Date of Joining
        </label>
        <input
          type="date"
          value={form.date_of_joining ?? ""}
          onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : initial ? "Update Teacher" : "Add Teacher"}
      </button>
    </form>
  );
}

export function TeachersClient({ teachers }: { teachers: Teacher[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; teacher: Teacher }>(
    null
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  function close() {
    setModal(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this teacher?")) return;
    setDeleting(id);
    await deleteTeacher(id);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Teachers</h1>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Teacher
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">CNIC</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No teachers yet.
                </td>
              </tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-2 text-slate-600">{t.cnic || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{t.contact || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {t.date_of_joining || "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setModal({ mode: "edit", teacher: t })}
                      className="mr-3 text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deleting === t.id ? "Deleting..." : "Delete"}
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
                {modal.mode === "add" ? "Add Teacher" : "Edit Teacher"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <TeacherForm
              initial={modal.mode === "edit" ? modal.teacher : undefined}
              onDone={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
