import { ThemeProvider } from "../contexts/ThemeContext";
import { AppShell } from "../components/layout/AppShell";
import { QueryProvider } from "../lib/query/QueryProvider";
import "./globals.css"; // Make sure this matches your global CSS file name

export const metadata = {
  title: "AHC QC Project",
  description: "Quality Control Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* QueryProvider is a 'use client' boundary that makes React Query
            available to all client components without affecting SSR. */}
        <QueryProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
