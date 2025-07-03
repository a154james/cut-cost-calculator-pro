
import React from "react";
import { Input } from "@/components/ui/input";

interface TimeInputProps {
  hoursValue: string;
  minutesValue: string;
  onHoursChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMinutesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const TimeInput = ({ hoursValue, minutesValue, onHoursChange, onMinutesChange, disabled }: TimeInputProps) => {
  return (
    <div className="flex space-x-2 mt-1">
      <div className="w-1/2">
        <div className="relative">
          <Input
            type="number"
            min="0"
            step="0.25"
            placeholder="0"
            value={hoursValue}
            onChange={onHoursChange}
            disabled={disabled}
            className="pr-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          />
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <span className="text-xs text-muted-foreground">hr</span>
          </div>
        </div>
      </div>
      <div className="w-1/2">
        <div className="relative">
          <Input
            type="number"
            min="0"
            max="59"
            step="1"
            placeholder="0"
            value={minutesValue}
            onChange={onMinutesChange}
            disabled={disabled}
            className="pr-10 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          />
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeInput;
