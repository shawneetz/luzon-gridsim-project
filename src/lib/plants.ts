// plants.ts
// one place that holds the color, image, and tag of each plant group.
// the slots, the chart, and the legend all read from here, so colors stay consistent.
// colors are loosely inspired by minecraft materials (lava, water, gold, ...).
//
// images live in next-app/public/plants/. a path starting with "/" is served
// straight from the public folder, so "/plants/coal.webp" is public/plants/coal.webp.

export interface PlantStyle {
  color: string; // main color of the group
  image: string; // image shown in the inventory slot
  tag: string;   // short label shown under the name
}

export const plantStyles: Record<string, PlantStyle> = {
  "Coal":        { color: "#6b6b6b", image: "/plants/coal.webp",        tag: "FUEL" },
  "Natural Gas": { color: "#e8833a", image: "/plants/natural-gas.webp", tag: "BLAZE" },
  "Geothermal":  { color: "#e03c1f", image: "/plants/geothermal.webp",  tag: "LAVA" },
  "Hydro":       { color: "#3f76e4", image: "/plants/hydro.webp",       tag: "WATER" },
  "Oil-based":   { color: "#8e4fc7", image: "/plants/oil-based.webp",   tag: "BARREL" },
  "Solar":       { color: "#f9d835", image: "/plants/solar.webp",       tag: "DAYLIGHT" },
  "Wind":        { color: "#7fe3d8", image: "/plants/wind.webp",        tag: "AIR" },
};

// fallback in case the api ever sends a group we do not know
export const defaultStyle: PlantStyle = { color: "#adb5bd", image: "/plants/default.webp", tag: "POWER" };

export function styleOf(group: string): PlantStyle {
  return plantStyles[group] ?? defaultStyle;
}

// time of day for each 4-hour block (b1 to b6), shown on the chart and the price slots
export const blockIcons = ["🌙", "🌅", "☀️", "☀️", "🌇", "🌙"];