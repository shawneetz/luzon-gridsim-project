/*
 * layout.tsx
 * Root layout of the app. It loads the Geist font, sets the page title,
 * and wraps every page in the <html> and <body> tags.
 */

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Load the Geist font and expose it as a CSS variable
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Title and description shown in the browser tab
export const metadata: Metadata = {
  title: "Luzon GridSim",
  description: "Find the cheapest way to run the Luzon grid for a day, solved with the simplex method",
};

// Every page is rendered inside this layout
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
    //sawh
  );
}
