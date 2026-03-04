import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import Sidebar from "@/components/layout/Sidebar";

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
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
