// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import FloatingChatWidget from "@/components/ui/FloatingChatWidget";
import "./globals.css";

import Navbar from "@/components/ui/Navbar"; // your Navbar (client)
import { AuthProvider } from "@/lib/auth"; // AuthProvider must be a named export (client)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ayush Herbal Garden",
  description:
    "Comprehensive database of Ayurvedic plants with detailed information on medicinal properties, preparations, and traditional uses.",
  generator: "v0.app",
  keywords: ["Ayurveda", "medicinal plants", "herbal medicine", "traditional medicine", "plant database"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* suppressHydrationWarning helps avoid hydration mismatch warnings */}
      <body suppressHydrationWarning className={`font-sans ${geistSans.variable} ${geistMono.variable}`}>
        {/* AuthProvider is a client component — place it high so useAuth works everywhere */}
        <AuthProvider>
          <Navbar />

          {/* Keep Suspense where you had it */}
          <Suspense fallback={null}>{children}</Suspense>
          <FloatingChatWidget />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
