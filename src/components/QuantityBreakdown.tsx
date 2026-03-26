import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface QuantityBreakdownProps {
  machineTimePerPiece: number;
  machineHourlyCost: number;
  setupTimeTotal: number;
  setupHourlyCost: number;
  programmingTimeTotal: number;
  programmingHourlyCost: number;
  includeProgramming: boolean;
  finishingCostPerPiece: number;
  materialCostPerPiece: number;
  toolCost: number;
  addMarkup: boolean;
  markupPercentage: number;
  currentQuantity: number;
}

const QuantityBreakdown = ({
  machineTimePerPiece,
  machineHourlyCost,
  setupTimeTotal,
  setupHourlyCost,
  programmingTimeTotal,
  programmingHourlyCost,
  includeProgramming,
  finishingCostPerPiece,
  materialCostPerPiece,
  toolCost,
  addMarkup,
  markupPercentage,
  currentQuantity,
}: QuantityBreakdownProps) => {
  const breakdowns = useMemo(() => {
    const quantities = generateQuantities(currentQuantity);
    const setupCostTotal = setupTimeTotal * setupHourlyCost;
    const programmingCostTotal = includeProgramming
      ? programmingTimeTotal * programmingHourlyCost
      : 0;
    const fixedCosts = setupCostTotal + programmingCostTotal + toolCost;
    const markupMult = addMarkup ? 1 + markupPercentage / 100 : 1;

    return quantities.map((qty) => {
      const machineCpp = machineTimePerPiece * machineHourlyCost;
      const fixedCpp = fixedCosts / qty;
      const variableCpp = machineCpp + finishingCostPerPiece + materialCostPerPiece;
      const totalCpp = (fixedCpp + variableCpp) * markupMult;
      const totalLot = totalCpp * qty;

      return {
        qty,
        setupProgramPct: totalCpp > 0 ? (fixedCpp / (fixedCpp + variableCpp)) * 100 : 0,
        fixedCpp,
        variableCpp,
        totalCpp,
        totalLot,
      };
    });
  }, [
    machineTimePerPiece, machineHourlyCost, setupTimeTotal, setupHourlyCost,
    programmingTimeTotal, programmingHourlyCost, includeProgramming,
    finishingCostPerPiece, materialCostPerPiece, toolCost,
    addMarkup, markupPercentage, currentQuantity,
  ]);

  if (machineHourlyCost <= 0 && setupHourlyCost <= 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Quantity Cost Breakdown
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how setup &amp; programming costs spread across different quantities
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Setup/Prog per pc</TableHead>
                <TableHead className="text-right">Variable per pc</TableHead>
                <TableHead className="text-right">Cost/Piece</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Fixed %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdowns.map((row) => (
                <TableRow
                  key={row.qty}
                  className={row.qty === currentQuantity ? "bg-primary/10 font-semibold" : ""}
                >
                  <TableCell className="text-right">{row.qty}</TableCell>
                  <TableCell className="text-right">${row.fixedCpp.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${row.variableCpp.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${row.totalCpp.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${row.totalLot.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${Math.min(row.setupProgramPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs w-10 text-right">{row.setupProgramPct.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <strong>Fixed %</strong> shows how much of per-piece cost comes from setup &amp; programming.
          Lower is better — large runs amortize fixed costs more effectively.
        </p>
      </CardContent>
    </Card>
  );
};

function generateQuantities(current: number): number[] {
  const set = new Set<number>();
  set.add(1);
  set.add(5);
  set.add(10);
  set.add(25);
  set.add(50);
  set.add(100);
  set.add(250);
  set.add(500);
  set.add(1000);
  if (current > 0) set.add(current);
  return Array.from(set).sort((a, b) => a - b);
}

export default QuantityBreakdown;
