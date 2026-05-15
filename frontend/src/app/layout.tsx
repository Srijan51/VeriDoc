import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VERIDOC — Enterprise Knowledge Truth Engine",
  description:
    "VERIDOC detects conflicts, outdated policies, and inconsistencies across enterprise knowledge systems using AI. Your company's documents shouldn't contradict each other.",
  keywords: [
    "document verification",
    "enterprise AI",
    "contradiction detection",
    "knowledge management",
    "policy compliance",
  ],
};

import Sidebar from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${sourceSans3.variable} ${montserrat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-transparent">
        {/* Animated Glassmorphism Orbs */}
        <div className="bg-orb-1" />
        <div className="bg-orb-2" />

        <div className="flex min-h-screen w-full">
          {/* Global Sidebar */}
          <Sidebar />

          {/* Main Layout Area */}
          <div className="flex-1 flex flex-col ml-[240px] relative">
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </div>

      </body>
    </html>
  );
}
