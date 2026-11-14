// plants.ts
// one place that holds the color, image, and tag of each plant group.
// the slots, the chart, and the legend all read from here, so colors stay consistent.
// colors are loosely inspired by minecraft materials (lava, water, gold, ...).
//
// images live in src/assets/ and are imported like code, so next.js
// bundles them and gives each one the right url (no manual paths, no base path).
// a wrong file name here shows up as a "module not found" error at build time.

import coal from "@/assets/minecraft-coal.webp";
import fire from "@/assets/minecraft-fire.webp";
import lava from "@/assets/minecraft-lava.webp";
import water from "@/assets/minecraft-water.webp";
import barrel from "@/assets/minecraft-barrel.webp";
import sun from "@/assets/minecraft-sun.webp";
import wind from "@/assets/minecraft-wind.webp";

export interface PlantStyle {
  color: string; // main color of the group
  image: string; // image url shown in the inventory slot
  tag: string;   // short label shown under the name
}

// an imported image is an object; its .src is the url the <img> tag needs
export const plantStyles: Record<string, PlantStyle> = {
  "Coal":        { color: "#6b6b6b", image: coal.src,   tag: "FUEL" },
  "Natural Gas": { color: "#e8833a", image: fire.src,   tag: "BLAZE" },
  "Geothermal":  { color: "#e03c1f", image: lava.src,   tag: "LAVA" },
  "Hydro":       { color: "#3f76e4", image: water.src,  tag: "WATER" },
  "Oil-based":   { color: "#8e4fc7", image: barrel.src, tag: "BARREL" },
  "Solar":       { color: "#f9d835", image: sun.src,    tag: "DAYLIGHT" },
  "Wind":        { color: "#7fe3d8", image: wind.src,   tag: "AIR" },
};

// fallback in case the api ever sends a group we do not know.
// a 1x1 transparent image, so no extra file is needed.
export const defaultStyle: PlantStyle = {
  color: "#adb5bd",
  image: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  tag: "POWER",
};

export function styleOf(group: string): PlantStyle {
  return plantStyles[group] ?? defaultStyle;
}

// time of day for each 4-hour block (b1 to b6), shown on the chart and the price slots
export const blockIcons = ["🌙", "🌅", "☀️", "☀️", "🌇", "🌙"];