import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISECS Academy",
  description:
    "The Institute of Spoken English and Computer Science — Academy Management System",
  icons: {
    icon: "/favicon.ico", // replace with the ISECS logo once favicon is generated
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
