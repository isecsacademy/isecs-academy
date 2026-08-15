"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFeeHead, updateFeeHead, deleteFeeHead, FeeHeadInput } from "./actions";

type FeeHead = {
  id: string;
  head_name: string;
  amount: number;
  apply_to_all: boolean;
  created_date: string | null;
};

function FeeHeadForm({
  initial,
  onDone,
}: {
  initial?: FeeHead;
  onDone: () => void;
}) {
  const [form, setForm] = useState<FeeHeadInput>({
    head_name: initial?.head_name ?? "",
    amount: initial?.amount ?? 0,
    apply_to_all: false, // only relevant on create — editing never re-imposes
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.head_name.trim()) {
      setError("Head name is required.");
      return;
    }
    if (initial && form.apply_to_all) {
      // shouldn't happen since checkbox is hidden on edit, but guard anyway
      form.apply_to_all = false;
    }
    if (!initial && form.apply_to_all) {
      const confirmed = confirm(
        `This will immediately create a Rs. ${form.amount} charge for every current student (except any currently struck off). Continue?`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError(null);
    if (initial) {
      const result = await updateFeeHead(initial.id, form);
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    } else {
      const result = await createFeeHead(form);
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (form.apply_to_all) {
        setSuccessMsg(`Charged ${result.imposedCount} student(s).`);
        setTimeout(onDone, 1200);
      } else {
        onDone();
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Head Name *
        </label>
        <input
          value={form.head_name}
          onChange={(e) => setForm({ ...form, head_name: e.target.value })}
          placeholder="Monthly Fee - August"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Amount (Rs.) *
        </label>
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {!initial && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.apply_to_all}
            onChange={(e) => setForm({ ...form, apply_to_all: e.target.checked })}
          />
          Impose on all students immediately
        </label>
      )}

      {initial && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Editing the amount only changes the default for future charges —
          students already charged from this head keep their original amount.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : initial ? "Update Fee Head" : "Add Fee Head"}
      </button>
    </form>
  );
}

export function FeeHeadsClient({ feeHeads }: { feeHeads: FeeHead[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; head: FeeHead }>(
    null
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function close() {
    setModal(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee head?")) return;
    setDeleting(id);
    setDeleteError(null);
    const result = await deleteFeeHead(id);
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
        <h1 className="text-2xl font-bold text-brand-700">Fee Detail</h1>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Fee Head
        </button>
      </div>

      {deleteError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Head Name</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeHeads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No fee heads yet.
                </td>
              </tr>
            ) : (
              feeHeads.map((h) => (
                <tr key={h.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{h.head_name}</td>
                  <td className="px-4 py-2 text-slate-600">Rs. {Number(h.amount).toFixed(0)}</td>
                  <td className="px-4 py-2 text-slate-600">{h.created_date || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setModal({ mode: "edit", head: h })}
                      className="mr-3 text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      disabled={deleting === h.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deleting === h.id ? "Deleting..." : "Delete"}
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
                {modal.mode === "add" ? "Add Fee Head" : "Edit Fee Head"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <FeeHeadForm
              initial={modal.mode === "edit" ? modal.head : undefined}
              onDone={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
