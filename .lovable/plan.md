

## Plan: Multi-Operation Job Support + Shop Rate Calculator

### Feature 6: Multi-Operation Job Support

Allow users to define multiple machining operations (e.g., Op 1: Mill, Op 2: Turn, Op 3: Drill), each with its own machine time, setup time, and hourly rate. All operations sum into the total job cost.

**New component: `src/components/OperationsManager.tsx`**
- A card/section within the Machining tab that replaces the single set of time/cost inputs
- Each operation has: name (text input), machine time (hours/min), setup time (hours/min), machine hourly rate, setup hourly rate
- Default starts with one operation; "Add Operation" button adds more
- Each operation has a delete button (except when only one remains)
- Shows a summary row with total machine time and total cost across all operations

**Changes to `MachiningCalculator.tsx`:**
- Replace individual machine time, setup time, machine hourly cost, and setup hourly cost state with an `operations` array state
- Each operation: `{ id, name, machineTimeHours, machineTimeMinutes, setupTimeHours, setupTimeMinutes, machineHourlyCost, setupHourlyCost }`
- Update `calculateCosts()` to loop through all operations, summing machine costs and setup costs
- Update `resetForm()` to reset operations array
- Update `printQuote()` to list each operation in the quote
- Update `QuantityBreakdown` props to pass aggregated values
- Programming time stays global (not per-operation) since programming applies to the whole job

### Feature 8: Shop Rate Calculator

A utility dialog/tool that helps users calculate their hourly shop rate based on overhead costs and desired profit.

**New component: `src/components/ShopRateCalculator.tsx`**
- Accessible via a button/icon in the Machining tab near the hourly rate inputs
- Opens a Dialog with inputs:
  - Monthly overhead costs (rent, utilities, insurance, etc.)
  - Monthly labor cost (wages + benefits)
  - Equipment cost per month (depreciation/lease)
  - Working hours per month (default 160)
  - Desired profit margin (%)
- Calculates: `shopRate = (overhead + labor + equipment) / workingHours * (1 + profitMargin/100)`
- "Apply Rate" button that populates the machine hourly cost field in the parent calculator
- Shows breakdown of cost components per hour

**Changes to `MachiningCalculator.tsx`:**
- Import and render `ShopRateCalculator` with a callback to set the hourly rate on an operation
- Small calculator icon button next to hourly cost inputs that opens the shop rate calculator

### Technical Details

- Operations stored as: `useState<Operation[]>([defaultOperation])`
- Operation type defined inline or in a types file
- Use `crypto.randomUUID()` or simple counter for operation IDs
- Shop rate calculator is a self-contained dialog component with local state
- Both features use existing UI components (Card, Input, Label, Button, Dialog)
- The tabs grid changes from `grid-cols-4` to accommodate or stays the same (shop rate is a dialog, not a tab)

### Files to create:
1. `src/components/OperationsManager.tsx` -- multi-operation UI
2. `src/components/ShopRateCalculator.tsx` -- shop rate calculator dialog

### Files to modify:
1. `src/components/MachiningCalculator.tsx` -- integrate both features, refactor state
2. `src/components/QuantityBreakdown.tsx` -- no changes needed if aggregated values are passed

