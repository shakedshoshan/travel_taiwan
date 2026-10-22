import type { Metadata, Viewport } from "next";
import { Heebo, Rubik } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { CommandSearch } from "@/components/ui/CommandSearch";
import { BudgetWidget } from "@/components/ui/BudgetWidget";
import { PwaRegister } from "@/components/ui/PwaRegister";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0a101d" },
  ],
};

export const metadata: Metadata = {
  title: "טייוואן 3D | מסע אינטראקטיבי בטייוואן (6.11 – 8.12.2026)",
  description:
    "מפת תלת-ממד אינטראקטיבית לטיול בטייוואן: 18 ערים, 10 מקטעי מסלול, 147 אטרקציות, 80 מקומות אוכל ושווקי לילה ו-37 מלונות.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "טייוואן 3D",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
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
        <PwaRegister />
        <Navbar />
        <CommandSearch />
        <BudgetWidget />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
