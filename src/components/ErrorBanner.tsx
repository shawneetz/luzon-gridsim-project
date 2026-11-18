// ErrorBanner.tsx
// a clear red banner for when the solver api cannot be reached
// it shows a title, the message, and a retry button on the right
// it is used by the page for both cases: the options request failing on load,
// and a solve request failing
// it holds no state, the page owns the retry action and the retrying flag
//
// layout (edit the tailwind classes below):
//   one row from sm up (message left, button right), stacked on phones

/** props for the {@link ErrorBanner} component */
interface ErrorBannerProps {
  /** what went wrong, shown under the title */
  message: string;
  /** called when the player presses "Retry" */
  onRetry: () => void;
  /** true while a retry is running, disables the button and changes its text (default: false) */
  retrying?: boolean;
}

/**
 * red banner with a retry button, for an unreachable solver api
 *
 * @param props - see {@link ErrorBannerProps}
 *
 * @remarks
 * has no state and no hooks, so it needs no "use client" of its own
 *
 * edge cases:
 * - `role="alert"` makes screen readers read the banner as soon as it appears
 * - the retry button is disabled while `retrying` is true, so a double click
 *   cannot send two requests
 * - the title is always "Connection lost" (the in-game wording), the real reason
 *   is the `message` under it, so a server side error still reads correctly
 *
 * @example
 * ```tsx
 * <ErrorBanner message="Could not reach the solver API." onRetry={handleSolve} retrying={loading} />
 * ```
 */
export default function ErrorBanner({ message, onRetry, retrying = false }: ErrorBannerProps) {
  return (
    // .banner comes from globals.css, border-red turns the frame red
    <div role="alert" className="banner flex flex-col gap-3 border-red sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="mb-1 block font-pixel text-pixel-button text-red">Connection lost</span>
        <span>{message}</span>
      </div>
      <button type="button" className="btn shrink-0" onClick={onRetry} disabled={retrying}>
        {retrying ? "Retrying..." : "Retry"}
      </button>
    </div>
  );
}

// references:
// mdn, alert role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role
// tailwind css v4, flex direction: https://tailwindcss.com/docs/flex-direction
// tailwind css v4, border-color: https://tailwindcss.com/docs/border-color
// tsdoc standard: https://tsdoc.org