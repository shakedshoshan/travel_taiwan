import type { Metadata } from "next";
import { Heebo, Rubik } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { CommandSearch } from "@/components/ui/CommandSearch";
import { BudgetWidget } from "@/components/ui/BudgetWidget";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "טייוואן 3D | מסע אינטראקטיבי בטייוואן (6.11 – 8.12.2026)",
  description:
    "מפת תלת-ממד אינטראקטיבית לטיול בטייוואן: 18 ערים, 10 מקטעי מסלול, 147 אטרקציות, 80 מקומות אוכל ושווקי לילה ו-37 מלונות.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${heebo.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <CommandSearch />
        <BudgetWidget />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
