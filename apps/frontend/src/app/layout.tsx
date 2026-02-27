import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { PageBackground } from "../components/PageBackground";
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
          <AuthProvider>
            <div className="flex h-screen bg-gradient-to-br from-[#faf8f5] via-[#fff8f0] to-[#fef3e2] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#1e1e1e] transition-colors myc-pattern relative overflow-hidden">
              <PageBackground />
              
              {/* The Sidebar will sit on the left of every page */}
              <Sidebar />
              
              {/* This 'children' variable represents whatever page folder you are currently inside */}
              <main className="flex-1 overflow-auto relative z-10">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}