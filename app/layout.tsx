import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CrackTET - Maharashtra Teacher Eligibility Test Preparation",
  description: "Your complete guide to Maharashtra TET success. Access mock tests, study materials, and expert guidance.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="overflow-x-hidden">
        <LanguageProvider>
          <Navbar />
          <div className="w-full overflow-x-hidden">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
