"use client";

// Tooltip.tsx
// a css-only item tooltip, like the purple one you see in minecraft when you
// hover an item in the inventory
// it wraps one trigger (a button) and shows the tooltip under it on mouse hover
// or keyboard focus, with no state and no event handlers
//
// how it works:
//   the wrapper is a "group", so the tooltip can react to the hover and the focus
//   of the trigger inside it with group-hover and group-has-[:focus-visible]
//   the tooltip is always in the dom (just invisible), so screen readers can read it
//   through aria-describedby
//
// layout (edit the tailwind classes below):
//   tooltip width: w-64 (256px), it must fit inside the panel it sits in
//   position: right under the trigger, anchored to the left or the right edge
//   (see the `align` prop)

import { useId, type ReactNode } from "react";

/** props for the {@link Tooltip} component */
interface TooltipProps {
  /** what the tooltip shows, usually a few lines of text */
  content: ReactNode;
  /**
   * which edge of the trigger the tooltip lines up with (default: "left")
   * use "right" for triggers in the right column, so the tooltip does not leave the panel
   */
  align?: "left" | "right";
  /** extra tailwind classes for the wrapper, e.g. "h-full" so it fills a grid cell */
  className?: string;
  /**
   * the trigger, written as a function so it can receive the tooltip id
   * put the id on the trigger as `aria-describedby`
   */
  children: (describedBy: string) => ReactNode;
}

// look of the tooltip box: near black purple, purple frame, black outline
// opacity-0 (not hidden) keeps it readable for screen readers
// pointer-events-none so it never blocks a click on the slots next to it
const box =
  "pointer-events-none absolute top-full z-30 mt-1 w-64 max-w-[calc(100vw-4rem)] border-2 border-tooltip-border bg-tooltip-bg px-3 py-2 text-left text-small leading-tight text-white opacity-0 outline-2 outline-black transition-opacity motion-reduce:transition-none";

// shown on mouse hover, or on keyboard focus only (:focus-visible), so it does not
// stay open after a mouse click moves the focus to the button
const shown = "group-hover:opacity-100 group-has-[:focus-visible]:opacity-100";

/**
 * wraps a trigger and shows a purple item tooltip under it on hover or keyboard focus
 *
 * @param props - see {@link TooltipProps}
 *
 * @remarks
 * `"use client"` is here because `useId` is a hook
 *
 * edge cases:
 * - the tooltip is `absolute`, so a parent with `overflow` set (like the sticky
 *   control panel) clips it if it sticks out, keep the tooltip inside the parent
 * - the wrapper raises its own z-index on hover and focus, so the tooltip draws
 *   above the slots after it in the dom
 * - on touch screens a tap shows the tooltip, because a tap counts as hover
 * - the tooltip cannot be dismissed with Esc, this is the one part of the aria
 *   tooltip pattern that needs javascript, it is left out to keep this css-only
 *
 * @example
 * ```tsx
 * <Tooltip content="Cheap and steady" align="right">
 *   {(describedBy) => <button aria-describedby={describedBy}>Geothermal</button>}
 * </Tooltip>
 * ```
 */
export default function Tooltip({ content, align = "left", className = "", children }: TooltipProps) {
  // links the trigger to the tooltip text
  const id = useId();

  return (
    <div className={`group relative hover:z-20 focus-within:z-20 ${className}`}>
      {children(id)}
      <div id={id} role="tooltip" className={`${box} ${shown} ${align === "right" ? "right-0" : "left-0"}`}>
        {content}
      </div>
    </div>
  );
}

// references:
// wai-aria authoring practices, tooltip pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
// react, useId: https://react.dev/reference/react/useId
// tailwind css v4, hover, focus and other states (group, has): https://tailwindcss.com/docs/hover-focus-and-other-states
// tailwind css v4, opacity: https://tailwindcss.com/docs/opacity
// mdn, :focus-visible: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
// mdn, aria-describedby: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby
// next.js, server and client components: https://nextjs.org/docs/app/getting-started/server-and-client-components
// tsdoc standard: https://tsdoc.org