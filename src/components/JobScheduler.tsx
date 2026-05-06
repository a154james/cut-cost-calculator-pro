import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, CalendarClock } from "lucide-react";
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

    let remaining = total;
    let cursor = startOfDay(startDate);
    let workingDaysUsed = 0;
    let endDate = cursor;
    let endHourOfDay = parseTime(shiftStart);
    let unattendedDaysUsed = 0;
    const workingDateList: Date[] = [];
    const unattendedDateList: Date[] = [];
    let safety = 0;

    while (remaining > 0 && safety < 730) {
      if (isWorkingDay(cursor)) {
        workingDateList.push(cursor);
        const used = Math.min(dailyCapacity, remaining);
        remaining -= used;
        workingDaysUsed += 1;
        endDate = cursor;
        if (used <= productivePerDay) {
          const fractionOfDay = productivePerDay > 0 ? used / productivePerDay : 0;
          endHourOfDay = parseTime(shiftStart) + fractionOfDay * shiftLen;
        } else {
          // ran past shift end with one unattended part
          const overflow = used - productivePerDay;
          endHourOfDay = parseTime(shiftEnd) + overflow;
          unattendedDaysUsed += 1;
          unattendedDateList.push(cursor);
        }
      }
      if (remaining <= 0) break;
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
      reachedCap: safety >= 730 && remaining > 0,
    };
  }, [totalHours, startDate, shiftStart, shiftEnd, lunchMinutes, breakPct, cleaningPct, miscPct, workingDays, holidays]);

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
      </CardContent>
    </Card>
  );
};

export default JobScheduler;
