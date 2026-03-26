import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import TimeInput from "./TimeInput";
import { Plus, Trash2 } from "lucide-react";

export type Operation = {
  id: string;
  name: string;
  machineTimeHours: string;
  machineTimeMinutes: string;
  setupTimeHours: string;
  setupTimeMinutes: string;
  machineHourlyCost: string;
  setupHourlyCost: string;
};

export const createDefaultOperation = (index = 1): Operation => ({
  id: crypto.randomUUID(),
  name: `Operation ${index}`,
  machineTimeHours: "",
  machineTimeMinutes: "",
  setupTimeHours: "",
  setupTimeMinutes: "",
  machineHourlyCost: "",
  setupHourlyCost: "",
});

interface OperationsManagerProps {
  operations: Operation[];
  onChange: (operations: Operation[]) => void;
  onApplyRate?: (operationId: string, rate: number) => void;
  renderRateButton?: (operationId: string) => React.ReactNode;
}

const OperationsManager = ({ operations, onChange, renderRateButton }: OperationsManagerProps) => {
  const updateOperation = (id: string, field: keyof Operation, value: string) => {
    onChange(operations.map(op => op.id === id ? { ...op, [field]: value } : op));
  };

  const addOperation = () => {
    onChange([...operations, createDefaultOperation(operations.length + 1)]);
  };

  const removeOperation = (id: string) => {
    if (operations.length <= 1) return;
    onChange(operations.filter(op => op.id !== id));
  };

  const calcTime = (h: string, m: string) => (parseFloat(h) || 0) + (parseFloat(m) || 0) / 60;

  const totalMachineTime = operations.reduce((s, op) => s + calcTime(op.machineTimeHours, op.machineTimeMinutes), 0);
  const totalSetupTime = operations.reduce((s, op) => s + calcTime(op.setupTimeHours, op.setupTimeMinutes), 0);

  return (
    <div className="space-y-4">
      {operations.map((op, idx) => (
        <Card key={op.id} className="border-dashed">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={op.name}
                onChange={(e) => updateOperation(op.id, "name", e.target.value)}
                className="font-semibold text-sm max-w-[200px]"
                placeholder={`Operation ${idx + 1}`}
              />
              {operations.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeOperation(op.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="flex items-center text-xs">
                    Machine Time <span className="text-xs ml-1 text-muted-foreground">(per piece)</span>
                  </Label>
                  <TimeInput
                    hoursValue={op.machineTimeHours}
                    minutesValue={op.machineTimeMinutes}
                    onHoursChange={(e) => updateOperation(op.id, "machineTimeHours", e.target.value)}
                    onMinutesChange={(e) => updateOperation(op.id, "machineTimeMinutes", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="flex items-center text-xs">
                    Setup Time <span className="text-xs ml-1 text-muted-foreground">(per setup)</span>
                  </Label>
                  <TimeInput
                    hoursValue={op.setupTimeHours}
                    minutesValue={op.setupTimeMinutes}
                    onHoursChange={(e) => updateOperation(op.id, "setupTimeHours", e.target.value)}
                    onMinutesChange={(e) => updateOperation(op.id, "setupTimeMinutes", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Machine Rate ($/hr)</Label>
                    {renderRateButton && renderRateButton(op.id)}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={op.machineHourlyCost}
                    onChange={(e) => updateOperation(op.id, "machineHourlyCost", e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Setup Rate ($/hr)</Label>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={op.setupHourlyCost}
                    onChange={(e) => updateOperation(op.id, "setupHourlyCost", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={addOperation} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Add Operation
      </Button>

      {operations.length > 1 && (
        <div className="flex gap-4 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
          <span>Total Machine: <strong className="text-foreground">{totalMachineTime.toFixed(2)} hr</strong></span>
          <span>Total Setup: <strong className="text-foreground">{totalSetupTime.toFixed(2)} hr</strong></span>
        </div>
      )}
    </div>
  );
};

export default OperationsManager;
