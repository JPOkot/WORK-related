import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import AuthGuard from "@/components/layout/AuthGuard";

export const metadata: Metadata = {
  title: "ExitFlow – Approval Workflow",
  description: "Exit Checklist Approval Workflow MVP for internal control processes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AppProvider>
          <AuthGuard>{children}</AuthGuard>
        </AppProvider>
      </body>
    </html>
  );
}
