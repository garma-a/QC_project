import { ThemeProvider } from "../contexts/ThemeContext";
import { AppShell } from "../components/layout/AppShell";
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
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
