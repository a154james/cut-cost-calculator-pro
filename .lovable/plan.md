## Plan: Job Scheduler Tab (Machining Time → Calendar Days)

Add a new tab to the calculator that turns the total job hours from the Machining tab into an actual finish date on a calendar, based on the user's working schedule and buffer allowances.

### New tab

Add a 5th tab `Job Scheduler` to `MachiningCalculator.tsx` (grid becomes `grid-cols-5`, stacks on mobile). Tab renders a new component `JobScheduler.tsx`.

### Inputs (in `JobScheduler.tsx`)

1. **Total job hours** — pre-filled from the Machining tab's aggregated total (machine time per piece × quantity + total setup time + programming time if included). Editable override field so users can plan a hypothetical job too.
2. **Start date** — date picker (Shadcn Popover + Calendar, with `pointer-events-auto`).
3. **Working days** — 7 checkboxes (Mon–Sun), defaults Mon–Fri.
4. **Shift hours per working day** — start time + end time inputs (e.g. 08:00 → 17:00). Optional lunch break duration (minutes) subtracted from each working day.
5. **Buffer allowances** (all optional, expressed as % of productive time or fixed minutes/day):
   - Operator breaks (default 10%)
   - Machine cleaning / maintenance (default 5%)
   - Changeover / misc downtime (default 5%)
6. **Holidays / skip dates** — multi-select calendar to exclude specific dates.

### Output

- **Effective productive hours per working day** = (shift length − lunch) × (1 − total buffer %).
- **Total working days needed** = ceil(total hours / effective hours per day).
- **Estimated end date** = walk forward from start date, skipping non-working days and holidays, until working days are consumed. Handle partial last day (show end time within the last day's shift).
- Display a results card with: end date, end time, total calendar days span, working days used, productive hours/day, total buffer hours absorbed.
- Render a small calendar (Shadcn `Calendar` in read-only mode) highlighting: start date (primary), working days in range (accent), holidays (muted), end date (destructive/highlight).

### Wiring

- Lift the aggregated total-hours value from `MachiningCalculator` (already computed in `getAggregatedValues`) and pass as a prop `defaultTotalHours` to `JobScheduler`.
- Scheduler keeps its own local state; does not mutate machining state.
- No backend, no persistence beyond component state.

### Files

**Create**
- `src/components/JobScheduler.tsx` — the entire feature (form + calculation + result + mini calendar).

**Modify**
- `src/components/MachiningCalculator.tsx` — add 5th `TabsTrigger` + `TabsContent`, expose total hours to the new tab, change tabs grid to `grid-cols-2 md:grid-cols-5`.

### Technical notes

- Use `date-fns` (already in project): `addDays`, `format`, `isSameDay`, `getDay`, `addMinutes`.
- Working-day walk: simple loop, capped at e.g. 730 days to avoid runaway loops on bad input.
- All colors via existing semantic tokens — no hardcoded colors.
- Mobile: stack inputs single column; calendar full width.
