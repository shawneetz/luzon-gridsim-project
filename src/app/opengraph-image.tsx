// the preview image shown when the site link is shared (chat apps, social media)
// next.js finds this file by its name (the app router file convention), runs it at build
// time, and adds the og:image tags by itself, so layout.tsx does not list an image
//
// how it works:
//   ImageResponse turns jsx into a png with satori, which only understands a small part of css
//   - every div that has more than one child needs display: flex
//   - styles must be inline style objects, tailwind classes are not available here
//   - the font is the built in sans, the pixel fonts would need font files loaded by hand
//
// look (edit the style objects below):
//   dirt colored page, a grass strip on top like the app header, then the logo words,
//   the tagline, and a row of small colored blocks (one per plant group color)

import { ImageResponse } from "next/og";

/** alt text of the image, next.js turns it into the og:image:alt tag */
export const alt = "Luzon GridSim, the cheapest way to power Luzon for one day";

/** size of the image in pixels, 1200 x 630 is the standard open graph size */
export const size = { width: 1200, height: 630 };

/** file type of the image */
export const contentType = "image/png";

// plant group colors, the same hex values as lib/plants.ts (coal, gas, geothermal, hydro, oil, solar, wind)
// they are repeated here on purpose, this file runs in a separate build step and keeps no imports
const plantColors = ["#6b6b6b", "#e8833a", "#e03c1f", "#3f76e4", "#8e4fc7", "#f9d835", "#7fe3d8"];

// hard shadow without blur, like the logo on the landing page
const logoShadow = "6px 6px 0 #1e1e1e, 10px 10px 0 #000000";

/**
 * draws the open graph image
 *
 * @returns a png response, 1200 x 630
 *
 * @remarks
 * the colors are the hex values of the tokens in globals.css (dirt, grass, grass-dark, gold, panel)
 * the strip on top is a grass color with a dark grass border underneath, like `.grass-strip`
 * satori does not support the css `gap` shorthand in every case, so the plant blocks use margins
 *
 * @example
 * ```tsx
 * // no import needed, next.js serves it at /opengraph-image
 * ```
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#6b4a2f",
        }}
      >
        {/* grass strip, like the header of the app */}
        <div style={{ display: "flex", height: 72, background: "#5fa83a", borderBottom: "16px solid #3f7a24" }} />

        {/* logo and tagline */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 120, fontWeight: 900, color: "#c6c6c6", textShadow: logoShadow }}>
            LUZON
          </div>
          <div style={{ display: "flex", fontSize: 120, fontWeight: 900, color: "#ffd83d", textShadow: logoShadow }}>
            GRIDSIM
          </div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 36, color: "#ffffff" }}>
            Craft the cheapest way to power Luzon for one day
          </div>

          {/* one block per plant group */}
          <div style={{ display: "flex", marginTop: 36 }}>
            {plantColors.map((color) => (
              <div
                key={color}
                style={{ width: 48, height: 48, marginLeft: 8, marginRight: 8, background: color, border: "4px solid #000000" }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

// references:
// next.js, opengraph-image file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
// next.js, imageresponse (next/og): https://nextjs.org/docs/app/api-reference/functions/image-response
// vercel satori, supported css and the flexbox rule: https://github.com/vercel/satori#css
// open graph protocol, image properties: https://ogp.me/#structured
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// tsdoc standard: https://tsdoc.org