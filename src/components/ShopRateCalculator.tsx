import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calculator } from "lucide-react";

interface ShopRateCalculatorProps {
  onApplyRate: (rate: number) => void;
  trigger?: React.ReactNode;
}

const ShopRateCalculator = ({ onApplyRate, trigger }: ShopRateCalculatorProps) => {
  const [open, setOpen] = useState(false);
  const [overhead, setOverhead] = useState("3000");
  const [labor, setLabor] = useState("5000");
  const [equipment, setEquipment] = useState("2000");
  const [workingHours, setWorkingHours] = useState("160");
  const [profitMargin, setProfitMargin] = useState("15");

  const hours = parseFloat(workingHours) || 1;
  const totalMonthlyCost = (parseFloat(overhead) || 0) + (parseFloat(labor) || 0) + (parseFloat(equipment) || 0);
  const baseCostPerHour = totalMonthlyCost / hours;
  const margin = (parseFloat(profitMargin) || 0) / 100;
  const shopRate = baseCostPerHour * (1 + margin);

  const handleApply = () => {
    onApplyRate(Math.round(shopRate * 100) / 100);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Shop Rate Calculator">
            <Calculator className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Shop Rate Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate your hourly shop rate based on monthly costs and desired profit margin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Monthly Overhead ($)</Label>
              <Input type="number" min="0" value={overhead} onChange={(e) => setOverhead(e.target.value)} placeholder="Rent, utilities, insurance" />
            </div>
            <div>
              <Label className="text-xs">Monthly Labor ($)</Label>
              <Input type="number" min="0" value={labor} onChange={(e) => setLabor(e.target.value)} placeholder="Wages + benefits" />
            </div>
            <div>
              <Label className="text-xs">Equipment Cost/mo ($)</Label>
              <Input type="number" min="0" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Depreciation, lease" />
            </div>
            <div>
              <Label className="text-xs">Working Hours/mo</Label>
              <Input type="number" min="1" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Desired Profit Margin (%)</Label>
            <Input type="number" min="0" max="500" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total monthly cost</span>
              <span className="font-medium">${totalMonthlyCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base cost/hour</span>
              <span className="font-medium">${baseCostPerHour.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit margin</span>
              <span className="font-medium">+{(parseFloat(profitMargin) || 0).toFixed(0)}%</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Calculated Shop Rate</span>
              <span className="text-xl font-bold text-primary">${shopRate.toFixed(2)}/hr</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply Rate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShopRateCalculator;
