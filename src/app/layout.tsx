// root layout, wraps every page in the app.
// it loads the two pixel fonts and exposes them as css variables:
//   --next-font-pixel : press start 2p, for titles and buttons (chunky, use small sizes)
//   --next-font-body  : vt323, for text, numbers, and tables (pixel style but easy to read)
// globals.css turns these into the tailwind classes font-pixel and font-body.
//
// it also holds the page metadata (task 6.4):
//   - title and description for the browser tab and search results
//   - open graph tags for link previews, the image itself comes from opengraph-image.tsx
//   - the tab icon comes from icon.svg, both files are found by next.js by their names
//   - the theme color tints the browser bar on phones (the grass green of the header)

import type { Metadata, Viewport } from "next";
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

const TITLE = "Luzon GridSim";
const DESCRIPTION = "Find the cheapest way to run the Luzon grid for a day, solved with the simplex method";

/**
 * browser tab title, description and open graph tags
 *
 * @remarks
 * `metadataBase` is the site address that next.js puts in front of the relative image
 * url of the open graph tags, because those tags need a full address to work in chat apps
 * set `NEXT_PUBLIC_SITE_URL` (like `https://example.com`) in the deployed environment,
 * without it the fallback is the local dev address, so link previews only work after deploying
 * if the app runs under a base path (the api is at `/next-app/api`), keep `metadataBase`
 * as the plain origin and check the og:image tag in the page source once
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    type: "website",
    locale: "en_PH",
  },
};

/**
 * viewport settings, a separate export since next.js 14 (theme color no longer lives in metadata)
 *
 * @remarks
 * the color is `--color-grass` from globals.css, written out because css variables
 * are not available in this file
 */
export const viewport: Viewport = {
  themeColor: "#5fa83a",
};

// the shell around every page; children is whatever page is being shown
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

// references:
// next.js, metadata and the metadata object: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// next.js, metadatabase: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase
// next.js, viewport and themecolor: https://nextjs.org/docs/app/api-reference/functions/generate-viewport
// next.js, icon file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
// next.js, font optimization (next/font/google): https://nextjs.org/docs/app/api-reference/components/font
// next.js, environment variables (NEXT_PUBLIC_): https://nextjs.org/docs/app/guides/environment-variables
// open graph protocol: https://ogp.me
// mdn, meta theme-color: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color
// tsdoc standard: https://tsdoc.org