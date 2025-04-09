
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

const TimeCalculator = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeValue, setTimeValue] = useState<string>("1");
  const [timeUnit, setTimeUnit] = useState<string>("days");
  const [resultDate, setResultDate] = useState<Date | null>(null);

  const calculateFutureDate = () => {
    if (!selectedDate) return;

    const value = parseInt(timeValue) || 0;
    let newDate = new Date(selectedDate);

    switch (timeUnit) {
      case "days":
        newDate = addDays(selectedDate, value);
        break;
      case "weeks":
        newDate = addWeeks(selectedDate, value);
        break;
      case "months":
        newDate = addMonths(selectedDate, value);
        break;
      case "years":
        newDate = addYears(selectedDate, value);
        break;
    }

    setResultDate(newDate);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="start-date">Start Date:</Label>
              <div className="flex mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-value">Add Time:</Label>
                <Input
                  id="time-value"
                  type="number"
                  min="1"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time-unit">Time Unit:</Label>
                <Select value={timeUnit} onValueChange={setTimeUnit}>
                  <SelectTrigger id="time-unit" className="mt-1">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={calculateFutureDate} className="w-full">
              Calculate Date
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="border rounded-md p-6 bg-muted/20 h-full flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium mb-2">Result</h3>
              {resultDate ? (
                <>
                  <p className="text-2xl font-bold">{format(resultDate, "PPP")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(resultDate, "EEEE")} at {format(resultDate, "p")}
                  </p>
                  <p className="text-sm mt-4">
                    {timeValue} {parseInt(timeValue) === 1 ? timeUnit.slice(0, -1) : timeUnit} from{" "}
                    {format(selectedDate || new Date(), "PP")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Click Calculate to see result</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeCalculator;
