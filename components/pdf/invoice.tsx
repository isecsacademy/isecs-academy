"use client";

import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const BRAND_BLUE = "#2596e8";
const GOLD = "#b8942f";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
    paddingBottom: 12,
    marginBottom: 16,
  },
  logo: { width: 48, height: 48, marginRight: 12 },
  academyName: { fontSize: 14, fontWeight: 700, color: BRAND_BLUE },
  tagline: { fontSize: 9, color: GOLD, marginTop: 2 },
  contact: { fontSize: 8, color: "#64748b", marginTop: 2 },
  title: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
    textAlign: "center",
    color: "#1e293b",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#64748b" },
  value: { fontWeight: 700 },
  table: { marginTop: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontWeight: 700,
    backgroundColor: "#eef8ff",
    fontSize: 9,
  },
  tableCell: { flex: 1, padding: 6, fontSize: 9 },
  balanceBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fbf7ec",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureRow: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 4,
    textAlign: "center",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 7,
    color: "#94a3b8",
  },
});

export type InvoiceData = {
  receiptNumber: string;
  paymentDate: string;
  studentName: string;
  registrationNumber: string;
  headName: string;
  amountPaid: number;
  remainingBalance: number;
  logoUrl?: string;
};

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          <View>
            <Text style={styles.academyName}>
              The Institute of Spoken English and Computer Science
            </Text>
            <Text style={styles.tagline}>Come, Learn and Inspire</Text>
            <Text style={styles.contact}>Contact: 0331-9170009</Text>
          </View>
        </View>

        <Text style={styles.title}>Payment Receipt</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Receipt No.</Text>
          <Text style={styles.value}>{data.receiptNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{data.paymentDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>{data.studentName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Registration No.</Text>
          <Text style={styles.value}>{data.registrationNumber}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeaderCell}>Fee Head</Text>
            <Text style={styles.tableHeaderCell}>Amount Paid</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{data.headName}</Text>
            <Text style={styles.tableCell}>Rs. {data.amountPaid.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.balanceBox}>
          <Text>Remaining Balance (this head)</Text>
          <Text style={{ fontWeight: 700 }}>Rs. {data.remainingBalance.toFixed(0)}</Text>
        </View>

        <View style={styles.signatureRow}>
          <Text style={styles.signatureLine}>Managing Director{"\n"}Amjid Ali</Text>
        </View>

        <Text style={styles.footer}>
          ISECS Academy — Developed by Aimal Khan, Software Developer & IT Instructor
          — WhatsApp 0332-5674270
        </Text>
      </Page>
    </Document>
  );
}
