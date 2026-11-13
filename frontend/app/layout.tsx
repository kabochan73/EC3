import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import { CartHydration } from "@/shared/components/providers/CartHydration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EC3",
  description: "Minimal apparel brand.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartHydration />
        {children}
      </body>
    </html>
  );
}
