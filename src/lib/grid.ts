/*
 * grid.ts
 * Shared constants about the day and the grid, so no component has to
 * hardcode them. Anything that needs the demand, the block hours, or the
 * block icons should import it from here.
 *
 */

/**
 * number of blocks in one day (the day is split into 4-hour blocks, B1 to B6)
 */
export const BLOCK_COUNT = 6;

/**
 * hours covered by each block, from Table 2 of the spec
 *
 * @remarks
 * index 0 is B1 and index 5 is B6; the length must equal {@link BLOCK_COUNT}
 */
export const blockHours: readonly string[] = [
  "12–4 AM",
  "4–8 AM",
  "8 AM–12 NN",
  "12–4 PM",
  "4–8 PM",
  "8 PM–12 MN",
];

/**
 * demand in MW per block (Table 2 of the spec)
 *
 * @remarks
 * index 0 is B1 and index 5 is B6; must stay in sync with `demand` in
 * `next-app/api/R/data.R`, otherwise the dashed demand line in the chart
 * would disagree with what the solver used
 */
export const demand: readonly number[] = [6300, 8600, 11800, 12300, 14000, 10600];

/**
 * time of day icon for each block, shown on the chart and the price slots
 *
 * @remarks
 * same indexing as {@link blockHours}
 */
export const blockIcons: readonly string[] = ["🌙", "🌅", "☀️", "☀️", "🌇", "🌙"];