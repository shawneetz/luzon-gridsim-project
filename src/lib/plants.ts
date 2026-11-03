// PLANT STYLES
// One place that holds the color, icon, and tag of each plant group.
// The slots, the chart, and the legend all read from here, so colors stay consistent.
// Colors are loosely inspired by Minecraft materials (lava, water, gold, ...).

export interface PlantStyle {
  color: string; // main color of the group
  icon: string;  // emoji shown in the inventory slot
  tag: string;   // short label shown under the name
}

export const plantStyles: Record<string, PlantStyle> = {
  "Coal":        { color: "#6b6b6b", icon: "⚫", tag: "FUEL" },
  "Natural Gas": { color: "#e8833a", icon: "🔥", tag: "BLAZE" },
  "Geothermal":  { color: "#e03c1f", icon: "🌋", tag: "LAVA" },
  "Hydro":       { color: "#3f76e4", icon: "💧", tag: "WATER" },
  "Oil-based":   { color: "#8e4fc7", icon: "🛢️", tag: "BARREL" },
  "Solar":       { color: "#f9d835", icon: "☀️", tag: "DAYLIGHT" },
  "Wind":        { color: "#7fe3d8", icon: "🌬️", tag: "AIR" },
};

// Fallback in case the API ever sends a group we do not know
export const defaultStyle: PlantStyle = { color: "#adb5bd", icon: "⚡", tag: "POWER" };

export function styleOf(group: string): PlantStyle {
  return plantStyles[group] ?? defaultStyle;
}

// Time of day for each 4-hour block (B1 to B6), shown on the chart and the price slots
export const blockIcons = ["🌙", "🌅", "☀️", "☀️", "🌇", "🌙"];
