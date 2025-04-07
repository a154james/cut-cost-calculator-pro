
import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";

interface TimeInputProps {
  hoursValue: string;
  minutesValue: string;
  onHoursChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onMinutesChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const TimeInput = ({ 
  hoursValue, 
  minutesValue, 
  onHoursChange, 
  onMinutesChange 
}: TimeInputProps) => {
  return (
    <div className="flex space-x-2 mt-1">
      <div className="w-full">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Hours"
          value={hoursValue}
          onChange={onHoursChange}
        />
      </div>
      <div className="w-full">
        <Input
          type="number"
          min="0"
          max="59"
          placeholder="Minutes"
          value={minutesValue}
          onChange={onMinutesChange}
        />
      </div>
    </div>
  );
};

export default TimeInput;
