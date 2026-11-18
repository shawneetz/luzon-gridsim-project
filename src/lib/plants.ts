// plants.ts
// one place that holds the color, image, tag and capacity of each plant group
// the slots, the chart, and the legend all read from here, so colors stay consistent
// colors are loosely inspired by minecraft materials (lava, water, gold, ...)
//
// images live in src/assets/ and are imported like code, so next.js
// bundles them and gives each one the right url (no manual paths, no base path)
// a wrong file name here shows up as a "module not found" error at build time
//

import coal from "@/assets/minecraft-coal.webp";
import fire from "@/assets/minecraft-fire.webp";
import lava from "@/assets/minecraft-lava.webp";
import water from "@/assets/minecraft-water.webp";
import barrel from "@/assets/minecraft-barrel.webp";
import sun from "@/assets/minecraft-sun.webp";
import wind from "@/assets/minecraft-wind.webp";

// blockIcons moved to lib/grid.ts; re-exported here so existing imports
// (like ResultsTab) keep working until they are updated in a later task
export { blockIcons } from "./grid";

/** how one plant group looks in the ui */
export interface PlantStyle {
  /** main color of the group, as a hex string, used by the chart and legend */
  color: string;
  /** image url shown in the inventory slot */
  image: string;
  /** short label shown under the name, e.g. "LAVA" */
  tag: string;
  /**
   * capacity of the group in MW, shown as a hint on the slot
   * 0 means the capacity is unknown, so the ui hides the hint
   */
  capMw: number;
}

/**
 * look of every plant group, keyed by the exact name the api sends
 *
 * @remarks
 * an imported image is an object, so `.src` is the url the `<img>` tag needs
 * if the api ever adds a group that is not listed here, use {@link styleOf}
 * so it falls back to {@link defaultStyle} instead of crashing
 *
 * `capMw` mirrors the capacity column of Table 1 in the project spec
 * (and `Cap` in `next-app/api/R/data.R`), it is only a display hint,
 * the solver always uses its own values
 */
export const plantStyles: Record<string, PlantStyle> = {
  "Coal":        { color: "#6b6b6b", image: coal.src,   tag: "FUEL",     capMw: 7000 },
  "Natural Gas": { color: "#e8833a", image: fire.src,   tag: "BLAZE",    capMw: 3300 },
  "Geothermal":  { color: "#e03c1f", image: lava.src,   tag: "LAVA",     capMw: 800 },
  "Hydro":       { color: "#3f76e4", image: water.src,  tag: "WATER",    capMw: 2500 },
  "Oil-based":   { color: "#8e4fc7", image: barrel.src, tag: "BARREL",   capMw: 1500 },
  "Solar":       { color: "#f9d835", image: sun.src,    tag: "DAYLIGHT", capMw: 2500 },
  "Wind":        { color: "#7fe3d8", image: wind.src,   tag: "AIR",      capMw: 400 },
};

/**
 * fallback style for a group this file does not know about
 *
 * @remarks
 * the image is a 1x1 transparent gif, so no extra file is needed
 * `capMw` is 0, which hides the capacity hint on the slot
 */
export const defaultStyle: PlantStyle = {
  color: "#adb5bd",
  image: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  tag: "POWER",
  capMw: 0,
};

/**
 * gets the style of a plant group, with a safe fallback
 *
 * @param group - plant group name, e.g. "Hydro"
 * @returns the matching {@link PlantStyle}, or {@link defaultStyle} for unknown names
 *
 * @example
 * ```ts
 * styleOf("Hydro").color; // "#3f76e4"
 * styleOf("Hydro").capMw; // 2500
 * styleOf("Nuclear").tag; // "POWER"
 * ```
 */
export function styleOf(group: string): PlantStyle {
  return plantStyles[group] ?? defaultStyle;
}

// references:
// next.js, static image imports: https://nextjs.org/docs/app/getting-started/images
// typescript, record type: https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
// typescript re-exports (export { x } from): https://www.typescriptlang.org/docs/handbook/modules/reference.html
// cmsc 150 final project spec, table 1 (plant groups and capacities)
// tsdoc standard: https://tsdoc.org