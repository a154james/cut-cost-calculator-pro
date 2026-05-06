import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, CalendarClock, ChevronRight, Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobSchedulerProps {
  defaultTotalHours: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const JobScheduler: React.FC<JobSchedulerProps> = ({ defaultTotalHours }) => {
  const [totalHours, setTotalHours] = useState<string>(defaultTotalHours.toFixed(2));
  const [useAutoHours, setUseAutoHours] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [workingDays, setWorkingDays] = useState<boolean[]>([false, true, true, true, true, true, false]);
  const [shiftStart, setShiftStart] = useState<string>("08:00");
  const [shiftEnd, setShiftEnd] = useState<string>("17:00");
  const [lunchMinutes, setLunchMinutes] = useState<string>("30");
  const [breakPct, setBreakPct] = useState<string>("10");
  const [cleaningPct, setCleaningPct] = useState<string>("5");
  const [miscPct, setMiscPct] = useState<string>("5");
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [runTimePerPart, setRunTimePerPart] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unattendedEnabled, setUnattendedEnabled] = useState<boolean>(false);
  const [useRunQty, setUseRunQty] = useState<boolean>(false);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [awayWindows, setAwayWindows] = useState<
    { start: string; end: string; scope: "every" | "weekday" | "date"; weekday?: number; date?: string }[]
  >([]);

  useEffect(() => {
    if (useRunQty) {
      const rt = parseFloat(runTimePerPart) || 0;
      const qty = parseFloat(quantity) || 0;
      if (rt > 0 && qty > 0) {
        setUseAutoHours(false);
        setTotalHours((rt * qty).toFixed(2));
      }
    }
  }, [runTimePerPart, quantity, useRunQty]);

  useEffect(() => {
    if (useAutoHours) setTotalHours(defaultTotalHours.toFixed(2));
  }, [defaultTotalHours, useAutoHours]);

  const parseTime = (t: string): number => {
    const [h, m] = t.split(":").map((n) => parseInt(n) || 0);
    return h + m / 60;
  };

  const result = useMemo(() => {
    const total = parseFloat(totalHours) || 0;
    if (!startDate || total <= 0) return null;

    const shiftLen = Math.max(0, parseTime(shiftEnd) - parseTime(shiftStart));
    const lunch = (parseFloat(lunchMinutes) || 0) / 60;
    const grossPerDay = Math.max(0, shiftLen - lunch);
    const buffer = ((parseFloat(breakPct) || 0) + (parseFloat(cleaningPct) || 0) + (parseFloat(miscPct) || 0)) / 100;
    const productivePerDay = grossPerDay * (1 - Math.min(buffer, 0.95));

    if (productivePerDay <= 0) return null;

    const isHoliday = (d: Date) => holidays.some((h) => isSameDay(h, d));
    const isWorkingDay = (d: Date) => workingDays[d.getDay()] && !isHoliday(d);

    const unattendedHrs = unattendedEnabled ? Math.max(0, parseFloat(runTimePerPart) || 0) : 0;
    const dailyCapacity = productivePerDay + unattendedHrs;

    const rt = parseFloat(runTimePerPart) || 0;
    const totalQty = useRunQty ? (parseFloat(quantity) || 0) : 0;

    let remaining = total;
    let partsRemaining = totalQty;
    let carryHours = 0;
    let cursor = startOfDay(startDate);
    let workingDaysUsed = 0;
    let endDate = cursor;
    let endHourOfDay = parseTime(shiftStart);
    let unattendedDaysUsed = 0;
    const workingDateList: Date[] = [];
    const unattendedDateList: Date[] = [];
    const breakdown: {
      date: Date;
      hours: number;
      parts: number;
      unattended: boolean;
      startTime: string;
      endTime: string;
      segments: { partNumber: number; startTime: string; endTime: string; hours: number; completed: boolean; unattended: boolean }[];
    }[] = [];
    let safety = 0;
    let partCounter = 1; // index of the part currently being worked on

    const fmt = (h: number) => {
      const hh = Math.floor(h);
      const mm = Math.round((h - hh) * 60);
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };

    // Per-day away windows: filter by scope (every day, specific weekday, or specific date)
    const shiftStartClock = parseTime(shiftStart);
    const shiftEndClock = parseTime(shiftEnd);
    const awaysForDay = (d: Date) =>
      awayWindows
        .filter((w) => {
          if (w.scope === "every") return true;
          if (w.scope === "weekday") return w.weekday === d.getDay();
          if (w.scope === "date" && w.date) {
            const [y, m, day] = w.date.split("-").map((n) => parseInt(n));
            return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
          }
          return false;
        })
        .map((w) => ({ s: parseTime(w.start), e: parseTime(w.end) }))
        .filter((w) => w.e > w.s && w.e > shiftStartClock && w.s < shiftEndClock)
        .map((w) => ({ s: Math.max(w.s, shiftStartClock), e: Math.min(w.e, shiftEndClock) }))
        .sort((a, b) => a.s - b.s);

    while (remaining > 0 && safety < 730) {
      if (isWorkingDay(cursor)) {
        workingDateList.push(cursor);
        endDate = cursor;
        const segments: typeof breakdown[number]["segments"] = [];
        let dayProductiveUsed = 0; // counts toward productivePerDay cap
        let dayHoursTotal = 0;
        let dayParts = 0;
        let dayUnattended = false;
        let clock = shiftStartClock;
        let lastEndClock = shiftStartClock;

        const tryStartNewPart = (c: number): number | null => {
          // Find the earliest clock >= c where no away window blocks the start
          let t = c;
          for (const w of aways) {
            if (t >= w.s - 1e-9 && t < w.e - 1e-9) t = w.e;
          }
          return t < shiftEndClock ? t : null;
        };

        if (rt > 0) {
          // Continue any carried-over part first; carried parts continue running regardless of away
          if (carryHours > 0) {
            const needed = rt - carryHours;
            const segStart = clock;
            const segEnd = clock + needed;
            const segHrs = needed;
            // Apply against productive capacity (cap at productivePerDay)
            const productiveSpace = Math.max(0, productivePerDay - dayProductiveUsed);
            const productivePortion = Math.min(segHrs, productiveSpace);
            dayProductiveUsed += productivePortion;
            dayHoursTotal += segHrs;
            remaining -= segHrs;
            segments.push({
              partNumber: partCounter,
              startTime: fmt(segStart),
              endTime: fmt(segEnd),
              hours: segHrs,
              completed: true,
              unattended: false,
            });
            dayParts += 1;
            partCounter += 1;
            if (useRunQty) partsRemaining -= 1;
            carryHours = 0;
            clock = segEnd;
            lastEndClock = segEnd;
          }

          // Now repeatedly try to start new parts
          while (
            remaining > 1e-9 &&
            !(useRunQty && partsRemaining <= 0) &&
            clock < shiftEndClock - 1e-9
          ) {
            const startAt = tryStartNewPart(clock);
            if (startAt === null || startAt >= shiftEndClock - 1e-9) break;
            const segStart = startAt;
            const segEnd = segStart + rt;
            const exceedsShift = segEnd > shiftEndClock + 1e-9;

            if (exceedsShift && !unattendedEnabled) {
              // Operator not allowed to leave machine running past shift; defer to next day
              break;
            }

            const segHrs = rt;
            const productiveSpaceNow = Math.max(0, productivePerDay - dayProductiveUsed);
            dayProductiveUsed += Math.min(segHrs, productiveSpaceNow);
            dayHoursTotal += segHrs;
            remaining -= segHrs;
            if (exceedsShift) dayUnattended = true;
            segments.push({
              partNumber: partCounter,
              startTime: fmt(segStart),
              endTime: fmt(segEnd),
              hours: segHrs,
              completed: true,
              unattended: exceedsShift,
            });
            dayParts += 1;
            partCounter += 1;
            if (useRunQty) partsRemaining -= 1;
            clock = segEnd;
            lastEndClock = segEnd;
          }
        } else {
          // No run-time/part info: fall back to bulk hours model with productive cap
          const used = Math.min(productivePerDay, remaining);
          dayProductiveUsed = used;
          dayHoursTotal = used;
          remaining -= used;
          const frac = productivePerDay > 0 ? used / productivePerDay : 0;
          lastEndClock = shiftStartClock + frac * shiftLen;
        }

        if (dayHoursTotal > 0) {
          workingDaysUsed += 1;
          if (dayUnattended) {
            unattendedDaysUsed += 1;
            unattendedDateList.push(cursor);
          }
          breakdown.push({
            date: cursor,
            hours: dayHoursTotal,
            parts: dayParts,
            unattended: dayUnattended,
            startTime: shiftStart,
            endTime: fmt(lastEndClock),
            segments,
          });
          endHourOfDay = lastEndClock;
        }
      }
      if (remaining <= 1e-9) break;
      cursor = addDays(cursor, 1);
      safety += 1;
    }

    const calendarDays = Math.round((endDate.getTime() - startOfDay(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const endH = Math.floor(endHourOfDay);
    const endM = Math.round((endHourOfDay - endH) * 60);
    const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    const bufferHoursAbsorbed = workingDaysUsed * grossPerDay * Math.min(buffer, 0.95);

    return {
      endDate,
      endTimeStr,
      calendarDays,
      workingDaysUsed,
      productivePerDay,
      grossPerDay,
      bufferHoursAbsorbed,
      workingDateList,
      unattendedDateList,
      unattendedDaysUsed,
      unattendedHrs,
      breakdown,
      partsRemaining,
      reachedCap: safety >= 730 && remaining > 0,
    };
  }, [totalHours, startDate, shiftStart, shiftEnd, lunchMinutes, breakPct, cleaningPct, miscPct, workingDays, holidays, unattendedEnabled, runTimePerPart, useRunQty, quantity, awayWindows]);

  const toggleDay = (idx: number) => {
    setWorkingDays((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="auto-hours"
                  checked={useAutoHours}
                  onCheckedChange={(c) => setUseAutoHours(c as boolean)}
                />
                <Label htmlFor="auto-hours" className="text-sm">
                  Auto-fill from Machining tab ({defaultTotalHours.toFixed(2)} hr)
                </Label>
              </div>
              <Label htmlFor="total-hours">Total Job Hours:</Label>
              <Input
                id="total-hours"
                type="number"
                min="0"
                step="0.01"
                value={totalHours}
                onChange={(e) => {
                  setUseAutoHours(false);
                  setTotalHours(e.target.value);
                }}
              />
            </div>

            <div>
              <Label>Start Date:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(startOfDay(d))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="block mb-2">Working Days:</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm border transition-colors",
                      workingDays[i]
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:bg-accent"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="shift-start">Shift Start:</Label>
                <Input id="shift-start" type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="shift-end">Shift End:</Label>
                <Input id="shift-end" type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="lunch">Lunch Break (minutes):</Label>
              <Input
                id="lunch"
                type="number"
                min="0"
                value={lunchMinutes}
                onChange={(e) => setLunchMinutes(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Away Times (no new starts)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAwayWindows((prev) => [...prev, { start: "12:00", end: "14:00" }])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {awayWindows.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Block windows where the operator is unavailable to load a new part. Parts already running continue through the window.
                </p>
              ) : (
                <div className="space-y-2">
                  {awayWindows.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={w.start}
                        onChange={(e) =>
                          setAwayWindows((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, start: e.target.value } : x))
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={w.end}
                        onChange={(e) =>
                          setAwayWindows((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, end: e.target.value } : x))
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setAwayWindows((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-run-qty"
                  checked={useRunQty}
                  onCheckedChange={(c) => setUseRunQty(c as boolean)}
                />
                <Label htmlFor="use-run-qty" className="text-sm">
                  Specify run time per part × quantity
                </Label>
              </div>
              {useRunQty && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="run-time" className="text-xs">Run Time / Part (hr)</Label>
                    <Input id="run-time" type="number" min="0" step="0.01" value={runTimePerPart} onChange={(e) => setRunTimePerPart(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="qty" className="text-xs">Quantity</Label>
                    <Input id="qty" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="unattended"
                  checked={unattendedEnabled}
                  onCheckedChange={(c) => setUnattendedEnabled(c as boolean)}
                />
                <Label htmlFor="unattended" className="text-sm">
                  Allow unattended overnight / past-shift run
                </Label>
              </div>
              {unattendedEnabled && (
                <p className="text-xs text-muted-foreground">
                  Operator sets up the last part of the day; machine finishes one full part ({(parseFloat(runTimePerPart) || 0).toFixed(2)} hr) past shift end unattended.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold block mb-2">Buffer Allowances (%)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="break-pct" className="text-xs">Operator Breaks</Label>
                  <Input id="break-pct" type="number" min="0" max="100" value={breakPct} onChange={(e) => setBreakPct(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="cleaning-pct" className="text-xs">Cleaning</Label>
                  <Input id="cleaning-pct" type="number" min="0" max="100" value={cleaningPct} onChange={(e) => setCleaningPct(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="misc-pct" className="text-xs">Misc / Changeover</Label>
                  <Input id="misc-pct" type="number" min="0" max="100" value={miscPct} onChange={(e) => setMiscPct(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label className="block mb-2">Holidays / Skip Dates:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {holidays.length > 0 ? `${holidays.length} date(s) excluded` : "Add holidays"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="multiple"
                    selected={holidays}
                    onSelect={(dates) => setHolidays((dates as Date[]) || [])}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {holidays.length > 0 && (
                <Button variant="ghost" size="sm" className="mt-1" onClick={() => setHolidays([])}>
                  Clear holidays
                </Button>
              )}
            </div>

            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Schedule Result</h3>
              </div>
              {result ? (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">End date:</span>{" "}
                    <span className="font-bold text-base">{format(result.endDate, "PPP")}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">End time on last day:</span>{" "}
                    <span className="font-medium">{result.endTimeStr}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Calendar days:</span> {result.calendarDays}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Working days used:</span> {result.workingDaysUsed}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Productive hrs/day:</span>{" "}
                    {result.productivePerDay.toFixed(2)} (of {result.grossPerDay.toFixed(2)} gross)
                  </p>
                  <p>
                    <span className="text-muted-foreground">Buffer absorbed:</span>{" "}
                    {result.bufferHoursAbsorbed.toFixed(2)} hr
                  </p>
                  {unattendedEnabled && (
                    <p>
                      <span className="text-muted-foreground">Unattended past-shift days:</span>{" "}
                      {result.unattendedDaysUsed} ({(result.unattendedHrs * result.unattendedDaysUsed).toFixed(2)} hr after hours)
                    </p>
                  )}
                  {result.reachedCap && (
                    <p className="text-destructive text-xs mt-2">
                      Schedule exceeds 2-year horizon; check inputs.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter total hours and a valid shift to see the projected end date.
                </p>
              )}
            </div>
          </div>
        </div>

        {result && startDate && (
          <div>
            <Label className="block mb-2">Schedule Calendar:</Label>
            <div className="border rounded-md p-2 inline-block">
              <Calendar
                mode="multiple"
                selected={result.workingDateList}
                onSelect={() => { /* read-only highlight */ }}
                defaultMonth={startDate}
                modifiers={{
                  start: startDate,
                  end: result.endDate,
                  holiday: holidays,
                }}
                modifiersClassNames={{
                  start: "ring-2 ring-primary",
                  end: "ring-2 ring-destructive",
                  holiday: "line-through opacity-50",
                }}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
          </div>
        )}

        {result && result.breakdown.length > 0 && (
          <div>
            <Label className="block mb-2">Daily Production Breakdown:</Label>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium w-8"></th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Day</th>
                    <th className="px-3 py-2 font-medium">Start</th>
                    <th className="px-3 py-2 font-medium">End</th>
                    <th className="px-3 py-2 font-medium text-right">Hours</th>
                    <th className="px-3 py-2 font-medium text-right">Parts</th>
                    <th className="px-3 py-2 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((row, i) => {
                    const expandable = row.segments && row.segments.length > 0;
                    const isOpen = !!expandedDays[i];
                    return (
                      <React.Fragment key={i}>
                        <tr
                          className={cn("border-t", expandable && "cursor-pointer hover:bg-muted/30")}
                          onClick={() => expandable && setExpandedDays((p) => ({ ...p, [i]: !p[i] }))}
                        >
                          <td className="px-3 py-2 text-muted-foreground">
                            {expandable && (
                              <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                            )}
                          </td>
                          <td className="px-3 py-2">{format(row.date, "MMM d, yyyy")}</td>
                          <td className="px-3 py-2 text-muted-foreground">{format(row.date, "EEE")}</td>
                          <td className="px-3 py-2">{row.startTime}</td>
                          <td className="px-3 py-2">{row.endTime}</td>
                          <td className="px-3 py-2 text-right">{row.hours.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{row.parts > 0 ? row.parts : "—"}</td>
                          <td className="px-3 py-2">
                            {row.unattended ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-accent text-accent-foreground">Unattended</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Attended</span>
                            )}
                          </td>
                        </tr>
                        {isOpen && expandable && (
                          <tr className="bg-muted/20">
                            <td></td>
                            <td colSpan={7} className="px-3 py-2">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Per-part breakdown:</div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-muted-foreground">
                                    <th className="py-1 pr-3">Part #</th>
                                    <th className="py-1 pr-3">Start</th>
                                    <th className="py-1 pr-3">End</th>
                                    <th className="py-1 pr-3 text-right">Hours</th>
                                    <th className="py-1 pr-3">Status</th>
                                    <th className="py-1 pr-3">Mode</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.segments.map((s, j) => (
                                    <tr key={j} className="border-t border-border/50">
                                      <td className="py-1 pr-3">#{s.partNumber}</td>
                                      <td className="py-1 pr-3">{s.startTime}</td>
                                      <td className="py-1 pr-3">{s.endTime}</td>
                                      <td className="py-1 pr-3 text-right">{s.hours.toFixed(2)}</td>
                                      <td className="py-1 pr-3">
                                        {s.completed ? (
                                          <span className="text-primary">Completed</span>
                                        ) : (
                                          <span className="text-muted-foreground">In progress (carries over)</span>
                                        )}
                                      </td>
                                      <td className="py-1 pr-3">
                                        {s.unattended ? (
                                          <span>Unattended</span>
                                        ) : (
                                          <span className="text-muted-foreground">Attended</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobScheduler;
