// the banner at the top of the results: green style for an optimal solution,
// red "you died" style for an infeasible one
// it holds no state and takes only the status
//
// layout (edit the tailwind classes below):
//   optimal: gray framed banner with a gold title, left aligned
//   infeasible: red banner, centered, shakes twice when it appears (animate-shake, see globals.css)

/** props for the {@link StatusBanner} component */
interface StatusBannerProps {
  /** which banner to draw, only the two statuses that have results to show */
  status: "optimal" | "infeasible";
}

/**
 * success banner or infeasible banner, depending on the status
 *
 * @param props - see {@link StatusBannerProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - "invalid" and "error" are not handled here on purpose, `ResultsTab`
 *   shows their message before it ever renders this component
 * - `animate-shake` is switched off for people who ask for reduced motion
 *   (see the rule in globals.css), the red banner still shows, it just stays still
 *
 * @example
 * ```tsx
 * <StatusBanner status="optimal" />
 * ```
 */
export default function StatusBanner({ status }: StatusBannerProps) {
  if (status === "optimal") {
    return (
      // .banner comes from globals.css, border-slot gives the gray frame
      <div className="banner flex flex-col gap-1 border-slot">
        <span className="font-pixel text-pixel-button text-gold">Advancement Made!</span>
        <span>Optimal solution found</span>
      </div>
    );
  }

  return (
    <div className="banner animate-shake border-black bg-death py-6 text-center">
      <span className="mb-2 block font-pixel text-pixel-death [text-shadow:4px_4px_0_#3f0000]">You Died!</span>
      <span>The problem is infeasible.</span>
    </div>
  );
}

// references:
// react, conditional rendering: https://react.dev/learn/conditional-rendering
// typescript, literal types: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types
// tailwind css v4, animation: https://tailwindcss.com/docs/animation
// tailwind css v4, arbitrary values: https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values
// tsdoc standard: https://tsdoc.org