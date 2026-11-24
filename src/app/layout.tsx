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
//
// gui scale (fit to screen, 2xl and up):
//   the whole ui is sized in rem, so the root font size scales everything together
//   page.tsx sets data-gui="fit" on <html> while the simulator is open, so the landing
//   page keeps its normal size

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
 * root font size of the simulator on screens at least 1536px wide (2xl)
 *
 * @remarks
 * the root size is the smallest of three limits, the class is written in full so tailwind finds it:
 * - 20px           upper limit, so a very large screen does not get a huge ui
 * - 100dvh / 58    height limit: the simulator is designed to be 58rem tall, a shorter window shrinks it
 * - 100vw / 110    width limit: controls, chart and table need about 110rem side by side
 * and the outer max() keeps it from going under 9px
 *
 * how to tune it:
 * - a column shows a small scrollbar: raise 58 by 2 or 3 (the ui gets a little smaller)
 * - there is empty space at the bottom: lower 58 (the ui gets bigger)
 * - the columns are too tight sideways: raise 110
 * - the same numbers are in the comments of page.tsx, change them together
 *
 * `dvh` is the visible height on phones with a moving address bar, `data-[gui=fit]` is the
 * attribute that page.tsx sets, so the scale is off on the landing page
 */
const guiScale =
  "2xl:data-[gui=fit]:[font-size:max(9px,min(20px,calc(100dvh/58),calc(100vw/110)))]";

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
    <html lang="en" className={`${pixel.variable} ${body.variable} h-full antialiased ${guiScale}`}>
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
// mdn, viewport units (dvh, vw): https://developer.mozilla.org/en-US/docs/Web/CSS/length#relative_length_units_based_on_viewport
// mdn, css min() and max(): https://developer.mozilla.org/en-US/docs/Web/CSS/min
// mdn, rem unit (relative to the root font size): https://developer.mozilla.org/en-US/docs/Web/CSS/length#rem
// tailwind css v4, arbitrary properties: https://tailwindcss.com/docs/adding-custom-styles#arbitrary-properties
// tailwind css v4, data attribute variants: https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes
// tailwind css v4, responsive design (2xl breakpoint): https://tailwindcss.com/docs/responsive-design
// tsdoc standard: https://tsdoc.org
