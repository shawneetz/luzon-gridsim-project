// layout.tsx
// root layout, wraps every page in the app.
// it loads the two pixel fonts and exposes them as css variables:
//   --next-font-pixel : press start 2p, for titles and buttons (chunky, use small sizes)
//   --next-font-body  : vt323, for text, numbers, and tables (pixel style but easy to read)
// globals.css turns these into the tailwind classes font-pixel and font-body.

import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

// font for titles and buttons
const pixel = Press_Start_2P({
  variable: "--next-font-pixel",
  subsets: ["latin"],
  weight: "400",
});

// font for body text and numbers
const body = VT323({
  variable: "--next-font-body",
  subsets: ["latin"],
  weight: "400",
});

// browser tab title and description
export const metadata: Metadata = {
  title: "Luzon GridSim",
  description: "Find the cheapest way to run the Luzon grid for a day, solved with the simplex method",
};

// the shell around every page; children is whatever page is being shown
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}