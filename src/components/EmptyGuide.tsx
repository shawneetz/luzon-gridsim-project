// the short "how to read" guide shown in the right panel before the first solve
// it replaces the old one line "pick your plant slots and press solve"
// it has two parts: four steps to run a solve, and a small key that says
// what each result means, so the first results are easy to read
// it holds no state and takes no props
//
// layout (edit the tailwind classes below):
//   both parts sit on dark "screen" boxes (from globals.css), one under the other
//   on md and up the key is two columns, on small screens it is one column

/** one step of the guide */
interface Step {
  /** short pixel title, e.g. "Pick plants" */
  title: string;
  /** one sentence under the title */
  text: string;
}

// the four steps, in the order the player does them
// the numbers shown in the badges come from the position in this list
const steps: readonly Step[] = [
  { title: "Pick plants", text: "Click slots on the left. Hover one to see its capacity and emissions." },
  { title: "Set the CO₂ cap", text: "Optional. Switch it on and type a daily limit in t/day." },
  { title: "Press Solve", text: "The simplex method finds the cheapest way to meet demand all day." },
  { title: "Read the results", text: "Check the status, the cost, the chart, and the price of each block." },
];

/** one line of the key that explains a result */
interface KeyItem {
  /** the name of the result, shown in gold */
  term: string;
  /** what it means */
  meaning: string;
}

// what the results mean, written to match the labels on the results tab
const key: readonly KeyItem[] = [
  { term: "Total minimum cost, Z", meaning: "the cheapest total cost of the day, in pesos" },
  { term: "Dispatch (MW)", meaning: "how much power each plant group makes in each 4 hour block" },
  { term: "Price (₱ per MWh)", meaning: "the shadow price of demand in a block, S divided by 4 hours" },
  { term: "Simplex Tableau tab", meaning: "every iteration of the solver, step by step" },
];

/**
 * guide shown in the right panel while there is no result yet
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own,
 * the client page renders it
 *
 * edge cases:
 * - the steps are an ordered list (`ol`), so screen readers announce the order,
 *   the number badges are `aria-hidden` to avoid reading the number twice
 * - the key uses a description list (`dl`), the semantic tag for term and meaning pairs
 * - the text is static, so it never goes out of date with the api, but if a
 *   label on the results tab is renamed, update the `key` list too
 *
 * @example
 * ```tsx
 * {!result && <EmptyGuide />}
 * ```
 */
export default function EmptyGuide() {
  return (
    <div className="flex flex-col gap-3.5">
      {/* part 1: how to run a solve */}
      <div className="screen p-4">
        <h3 className="mb-3 font-pixel text-pixel-sub text-gold">How to read this</h3>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3">
              {/* number badge, a small gold block like an item count */}
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center border-2 border-black bg-gold font-pixel text-pixel-label text-ink"
              >
                {i + 1}
              </span>
              <div>
                <span className="block font-pixel text-pixel-label text-green">{step.title}</span>
                <span className="block text-body text-white">{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* part 2: what each result means */}
      <div className="screen p-4">
        <h3 className="mb-3 font-pixel text-pixel-sub text-gold">What the results mean</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
          {key.map((item) => (
            <div key={item.term}>
              <dt className="text-body text-gold">{item.term}</dt>
              <dd className="text-small text-label">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// references:
// mdn, ol element (ordered list): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ol
// mdn, dl element (description list): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl
// mdn, aria-hidden: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
// react, rendering lists (keys): https://react.dev/learn/rendering-lists
// tailwind css v4, grid template columns: https://tailwindcss.com/docs/grid-template-columns
// cmsc 150 final project spec, shadow prices and the price of electricity
// tsdoc standard: https://tsdoc.org