"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument, InvoiceData } from "@/components/pdf/invoice";
import { recordPayment } from "../fee-collection/actions";
import { getArrears } from "./actions";

type ArrearRow = {
  charge_id: string;
  student_id: string;
  student_name: string;
  registration_number: string;
  head_id: string;
  head_name: string;
  charged_amount: number;
  paid_amount: number;
  balance: number;
  date_imposed: string;
};

async function downloadInvoice(data: InvoiceData) {
  const blob = await pdf(<InvoiceDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${data.receiptNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ArrearsClient({ initialArrears }: { initialArrears: ArrearRow[] }) {
  const [arrears, setArrears] = useState(initialArrears);
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    const data = await getArrears();
    setArrears(data as ArrearRow[]);
    setRefreshing(false);
  }

  async function handlePay(row: ArrearRow) {
    const amountStr = payAmounts[row.charge_id];
    const amount = amountStr ? Number(amountStr) : row.balance;
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setPayingId(row.charge_id);
    setError(null);
    const result = await recordPayment(row.charge_id, amount);
    setPayingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.payment) {
      await downloadInvoice({
        receiptNumber: result.payment.receipt_number,
        paymentDate: result.payment.payment_date,
        studentName: row.student_name,
        registrationNumber: row.registration_number,
        headName: row.head_name,
        amountPaid: result.payment.amount_paid,
        remainingBalance: Math.max(row.balance - amount, 0),
        logoUrl: `${window.location.origin}/logo.png`,
      });
    }
    setPayAmounts((p) => ({ ...p, [row.charge_id]: "" }));
    refresh();
  }

  const totalOutstanding = arrears.reduce((sum, r) => sum + Number(r.balance), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Arrears Management</h1>
          <p className="text-sm text-slate-500">
            Every unpaid or partly-paid charge across all students
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-slate-500">Total Outstanding</p>
          <p className="text-xl font-bold text-red-600">
            Rs. {totalOutstanding.toFixed(0)}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Reg. No.</th>
              <th className="px-4 py-2">Fee Head</th>
              <th className="px-4 py-2">Charged</th>
              <th className="px-4 py-2">Paid</th>
              <th className="px-4 py-2">Balance</th>
              <th className="px-4 py-2 text-right">Pay Off</th>
            </tr>
          </thead>
          <tbody>
            {arrears.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  {refreshing ? "Refreshing..." : "No outstanding arrears. Everyone's clear."}
                </td>
              </tr>
            ) : (
              arrears.map((row) => (
                <tr key={row.charge_id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{row.student_name}</td>
                  <td className="px-4 py-2 text-slate-600">{row.registration_number}</td>
                  <td className="px-4 py-2 text-slate-600">{row.head_name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    Rs. {Number(row.charged_amount).toFixed(0)}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    Rs. {Number(row.paid_amount).toFixed(0)}
                  </td>
                  <td className="px-4 py-2 font-medium text-red-600">
                    Rs. {Number(row.balance).toFixed(0)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        placeholder={String(row.balance)}
                        value={payAmounts[row.charge_id] ?? ""}
                        onChange={(e) =>
                          setPayAmounts((p) => ({ ...p, [row.charge_id]: e.target.value }))
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handlePay(row)}
                        disabled={payingId === row.charge_id}
                        className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {payingId === row.charge_id ? "Paying..." : "Pay"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
