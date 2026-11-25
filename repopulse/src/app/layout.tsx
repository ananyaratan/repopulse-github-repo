import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const oswald = Oswald({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "RepoPulse — Open-Source Contribution & Issue Matchmaker",
  description:
    "Match your exact tech stack to beginner-friendly GitHub repositories, rank good first issues by difficulty, and draft your first Pull Request with an AI Contribution Mentor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${oswald.variable} dark`}
    >
      <body className="min-h-screen font-sans antialiased bg-[#02010A] text-slate-100">
        {children}
      </body>
    </html>
  );
}
