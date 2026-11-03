// ROOT LAYOUT
// Wraps every page. It loads the two pixel fonts and exposes them as CSS variables:
//   --font-pixel : Press Start 2P, for titles and buttons (big and chunky, use small sizes)
//   --font-body  : VT323, for text, numbers, and tables (pixel style but easy to read)
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

const body = VT323({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Luzon GridSim",
  description: "Find the cheapest way to run the Luzon grid for a day, solved with the simplex method",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
