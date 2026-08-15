"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument, InvoiceData } from "@/components/pdf/invoice";
import {
  searchStudentsForFee,
  getStudentFeeDetail,
  recordPayment,
  addManualCharge,
} from "./actions";

type SearchResult = { id: string; registration_number: string; name: string };
type ChargeRow = {
  charge_id: string;
  head_name: string;
  charged_amount: number;
  paid_amount: number;
  balance: number;
  date_imposed: string;
};
type PaymentRow = {
  id: string;
  charge_id: string;
  amount_paid: number;
  payment_date: string;
  receipt_number: string;
};
type FeeHead = { id: string; head_name: string; amount: number };

async function downloadInvoice(data: InvoiceData) {
  const blob = await pdf(<InvoiceDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${data.receiptNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FeeCollectionClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getStudentFeeDetail>> | null>(
    null
  );
  const [loadingDetail, startLoadingDetail] = useTransition();

  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [payingChargeId, setPayingChargeId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const [manualHeadId, setManualHeadId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const r = await searchStudentsForFee(query);
      setResults(r);
      setShowResults(true);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function loadStudent(id: string) {
    setSelectedId(id);
    setShowResults(false);
    setQuery("");
    startLoadingDetail(async () => {
      const d = await getStudentFeeDetail(id);
      setDetail(d);
    });
  }

  function refresh() {
    if (!selectedId) return;
    startLoadingDetail(async () => {
      const d = await getStudentFeeDetail(selectedId);
      setDetail(d);
    });
  }

  async function handlePay(charge: ChargeRow) {
    const amountStr = payAmounts[charge.charge_id];
    const amount = amountStr ? Number(amountStr) : charge.balance;
    if (!amount || amount <= 0) {
      setPayError("Enter a valid amount.");
      return;
    }
    setPayingChargeId(charge.charge_id);
    setPayError(null);
    const result = await recordPayment(charge.charge_id, amount);
    setPayingChargeId(null);
    if (result.error) {
      setPayError(result.error);
      return;
    }
    // Generate and download the invoice for this payment
    if (result.payment && detail?.student) {
      await downloadInvoice({
        receiptNumber: result.payment.receipt_number,
        paymentDate: result.payment.payment_date,
        studentName: detail.student.name,
        registrationNumber: detail.student.registration_number,
        headName: charge.head_name,
        amountPaid: result.payment.amount_paid,
        remainingBalance: Math.max(charge.balance - amount, 0),
        logoUrl: `${window.location.origin}/logo.png`,
      });
    }
    setPayAmounts((p) => ({ ...p, [charge.charge_id]: "" }));
    refresh();
  }

  async function handleManualCharge() {
    if (!selectedId || !manualHeadId) {
      setManualError("Select a fee head.");
      return;
    }
    setManualBusy(true);
    setManualError(null);
    const override = manualAmount ? Number(manualAmount) : undefined;
    const result = await addManualCharge(selectedId, manualHeadId, override);
    setManualBusy(false);
    if (result.error) {
      setManualError(result.error);
      return;
    }
    setManualHeadId("");
    setManualAmount("");
    refresh();
  }

  async function reprintInvoice(payment: PaymentRow, charge: ChargeRow | undefined) {
    if (!detail?.student || !charge) return;
    await downloadInvoice({
      receiptNumber: payment.receipt_number,
      paymentDate: payment.payment_date,
      studentName: detail.student.name,
      registrationNumber: detail.student.registration_number,
      headName: charge.head_name,
      amountPaid: payment.amount_paid,
      remainingBalance: charge.balance,
      logoUrl: `${window.location.origin}/logo.png`,
    });
  }

  const totalBalance = (detail?.charges ?? []).reduce(
    (sum, c: ChargeRow) => sum + Number(c.balance),
    0
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-700">Fee Collection</h1>

      <div className="relative max-w-md">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search student by name or registration number..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {showResults && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => loadStudent(r.id)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
              >
                <span className="font-medium text-slate-800">{r.name}</span>{" "}
                <span className="text-slate-500">({r.registration_number})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingDetail && <p className="text-sm text-slate-400">Loading...</p>}

      {detail?.student && !loadingDetail && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-800">{detail.student.name}</p>
                <p className="text-sm text-slate-500">
                  {detail.student.registration_number} · {detail.student.father_name || "—"} ·{" "}
                  {detail.student.contact || "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-slate-500">Total Balance</p>
                <p
                  className={`text-xl font-bold ${
                    totalBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  Rs. {totalBalance.toFixed(0)}
                </p>
              </div>
            </div>
            {detail.isStruckOff && (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                This student is currently struck off ({detail.strikeOffInfo?.reason}). New
                charges are blocked until they're readmitted.
              </p>
            )}
          </div>

          {/* Charge breakdown + pay toward */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Fee Heads Charged</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-2">Head</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Paid</th>
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2 text-right">Pay Toward</th>
                </tr>
              </thead>
              <tbody>
                {detail.charges.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No charges yet.
                    </td>
                  </tr>
                ) : (
                  detail.charges.map((c: ChargeRow) => (
                    <tr key={c.charge_id} className="border-b border-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-800">{c.head_name}</td>
                      <td className="px-4 py-2 text-slate-600">
                        Rs. {Number(c.charged_amount).toFixed(0)}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        Rs. {Number(c.paid_amount).toFixed(0)}
                      </td>
                      <td
                        className={`px-4 py-2 font-medium ${
                          c.balance > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        Rs. {Number(c.balance).toFixed(0)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {c.balance > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              placeholder={String(c.balance)}
                              value={payAmounts[c.charge_id] ?? ""}
                              onChange={(e) =>
                                setPayAmounts((p) => ({
                                  ...p,
                                  [c.charge_id]: e.target.value,
                                }))
                              }
                              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => handlePay(c)}
                              disabled={payingChargeId === c.charge_id}
                              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                            >
                              {payingChargeId === c.charge_id ? "Paying..." : "Pay"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {payError && (
              <p className="border-t border-slate-100 px-4 py-2 text-sm text-red-600">
                {payError}
              </p>
            )}
          </div>

          {/* Manual billing */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Manually Bill an Additional Fee Head
            </h2>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Fee Head</label>
                <select
                  value={manualHeadId}
                  onChange={(e) => setManualHeadId(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">— Select —</option>
                  {detail.feeHeads.map((h: FeeHead) => (
                    <option key={h.id} value={h.id}>
                      {h.head_name} (Rs. {Number(h.amount).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Override Amount (optional)
                </label>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="Uses head's amount if blank"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleManualCharge}
                disabled={manualBusy || detail.isStruckOff}
                className="rounded-md bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-700 disabled:opacity-50"
              >
                {manualBusy ? "Adding..." : "Add Charge"}
              </button>
            </div>
            {manualError && <p className="mt-2 text-sm text-red-600">{manualError}</p>}
          </div>

          {/* Payment history */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Payment History</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-2">Receipt No.</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {detail.payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  detail.payments.map((p: PaymentRow) => {
                    const charge = detail.charges.find(
                      (c: ChargeRow) => c.charge_id === p.charge_id
                    );
                    return (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="px-4 py-2 text-slate-600">{p.receipt_number}</td>
                        <td className="px-4 py-2 text-slate-600">{p.payment_date}</td>
                        <td className="px-4 py-2 text-slate-600">
                          Rs. {Number(p.amount_paid).toFixed(0)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => reprintInvoice(p, charge)}
                            className="text-brand-600 hover:underline"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
