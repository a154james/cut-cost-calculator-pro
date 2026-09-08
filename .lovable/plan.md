# Shareable Calculator Links

Add a "Share Link" button that packs every value you've entered into a web address you can copy, bookmark, or send. Opening that address restores the calculator exactly as it was — no export, no account, no backend.

## What it does

- A **Share Link** button next to the Print Quote button.
- Clicking it copies a link to the clipboard and shows a confirmation, plus a small box with the link text and a Copy button for browsers that block auto-copy.
- Opening a shared link fills in every tab: machining operations, programming, quantity, tooling, markup, finishing selections, material entries, and the job scheduler settings (start date, working days, shift hours, buffers, away times, holidays, unattended option).
- After loading, a short notice says the values came from a shared link, with a "Start fresh" button that clears the address back to the plain page.
- The address bar updates without reloading, so the page keeps working normally.

## How the values travel

All values are encoded into the address after a `#` (fragment), so they never get sent to a server and stay private. The data is JSON, compressed and base64url-encoded to keep the link as short as practical. Long jobs (many operations, many away windows) produce longer links; that is expected with self-contained links.

## Technical notes

New file `src/lib/shareState.ts`:
- `ShareState` type — a versioned snapshot (`v: 1`) with three sections: `machining`, `material`, `scheduler`.
- `encodeState(state)` / `decodeState(str)` — JSON → deflate (via `fflate`, added as a dependency) → base64url, and the reverse. Decoding is defensive: unknown version or malformed data returns `null` and the app loads defaults.
- Helpers to read the fragment (`#s=...`) and to write it with `history.replaceState`.

Changes to `src/components/MachiningCalculator.tsx`:
- Lift the shared snapshot: `MaterialCalculator` and `JobScheduler` currently own their own state. Rather than lifting all of it, each gains two optional props: `initialState` (a plain object applied once on mount) and `onStateChange` (called when its values change) so the parent can hold a current snapshot for encoding. Existing behaviour and props stay intact.
- Read `#s=` once on mount and seed initial state from it before first render (lazy `useState` initializers) so nothing flickers.
- `handleShare()` builds the snapshot, encodes it, writes the fragment, and copies `window.location.href` via `navigator.clipboard` with a `document.execCommand` fallback.

Changes to `src/components/MaterialCalculator.tsx` and `src/components/JobScheduler.tsx`:
- Accept the two new optional props; serialize dates as ISO strings for the scheduler.
- No calculation-logic changes.

Not included: shortened links or server-side storage (would require the backend), and saved-quote history.
