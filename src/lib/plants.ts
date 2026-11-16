// plants.ts
// one place that holds the color, image, and tag of each plant group
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
}

/**
 * look of every plant group, keyed by the exact name the api sends
 *
 * @remarks
 * an imported image is an object, so `.src` is the url the `<img>` tag needs
 * if the api ever adds a group that is not listed here, use {@link styleOf}
 * so it falls back to {@link defaultStyle} instead of crashing
 */
export const plantStyles: Record<string, PlantStyle> = {
  "Coal":        { color: "#6b6b6b", image: coal.src,   tag: "FUEL" },
  "Natural Gas": { color: "#e8833a", image: fire.src,   tag: "BLAZE" },
  "Geothermal":  { color: "#e03c1f", image: lava.src,   tag: "LAVA" },
  "Hydro":       { color: "#3f76e4", image: water.src,  tag: "WATER" },
  "Oil-based":   { color: "#8e4fc7", image: barrel.src, tag: "BARREL" },
  "Solar":       { color: "#f9d835", image: sun.src,    tag: "DAYLIGHT" },
  "Wind":        { color: "#7fe3d8", image: wind.src,   tag: "AIR" },
};

/**
 * fallback style for a group this file does not know about
 *
 * @remarks
 * the image is a 1x1 transparent gif, so no extra file is needed
 */
export const defaultStyle: PlantStyle = {
  color: "#adb5bd",
  image: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  tag: "POWER",
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
 * styleOf("Nuclear").tag; // "POWER"
 * ```
 */
export function styleOf(group: string): PlantStyle {
  return plantStyles[group] ?? defaultStyle;
}