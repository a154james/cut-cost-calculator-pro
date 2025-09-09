
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Box, FileText, Printer, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResultCard from "./ResultCard";
import TimeInput from "./TimeInput";
import { Switch } from "@/components/ui/switch";
import ProcessesManager, { ProcessOption } from "./ProcessesManager";
import TimeCalculator from "./TimeCalculator";
import MaterialCalculator from "./MaterialCalculator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs as DialogTabs, TabsContent as DialogTabsContent, TabsList as DialogTabsList, TabsTrigger as DialogTabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const initialFinishingProcesses: ProcessOption[] = [
  { id: "none", name: "None", cost: 0, selected: true },
  { id: "deburring", name: "Deburring", cost: 15, selected: false },
  { id: "brushing", name: "Brushing", cost: 20, selected: false },
  { id: "polishing", name: "Polishing", cost: 45, selected: false },
  { id: "anodizing", name: "Anodizing", cost: 50, selected: false },
  { id: "nickel-plating", name: "Nickel Plating", cost: 65, selected: false },
  { id: "powder-coating", name: "Powder Coating", cost: 40, selected: false },
  { id: "chromate", name: "Chromate", cost: 30, selected: false }
];

const MachiningCalculator = () => {
  const { toast } = useToast();

  const [machineTimeHours, setMachineTimeHours] = useState<string>("");
  const [machineTimeMinutes, setMachineTimeMinutes] = useState<string>("");
  const [setupTimeHours, setSetupTimeHours] = useState<string>("");
  const [setupTimeMinutes, setSetupTimeMinutes] = useState<string>("");
  const [programmingTimeHours, setProgrammingTimeHours] = useState<string>("");
  const [programmingTimeMinutes, setProgrammingTimeMinutes] = useState<string>("");

  const [machineHourlyCost, setMachineHourlyCost] = useState<string>("");
  const [setupHourlyCost, setSetupHourlyCost] = useState<string>("");
  const [programmingHourlyCost, setProgrammingHourlyCost] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");

  const [totalMachineTime, setTotalMachineTime] = useState<string>("0");
  const [costPerPiece, setCostPerPiece] = useState<string>("0");
  const [totalLotCost, setTotalLotCost] = useState<string>("0");
  const [materialCost, setMaterialCost] = useState<string>("0");

  const [setupCount, setSetupCount] = useState<string>("1");
  const [finishingProcesses, setFinishingProcesses] = useState<ProcessOption[]>(initialFinishingProcesses);
  const [batchSizes, setBatchSizes] = useState<string[]>([]);
  const [toolCost, setToolCost] = useState<string>("0");
  const [addMarkup, setAddMarkup] = useState<boolean>(false);
  const [markupPercentage, setMarkupPercentage] = useState<string>("20");
  const [includeProgramming, setIncludeProgramming] = useState<boolean>(true);

  const calculateOptimalBatchSizes = () => {
    const qtyNum = parseInt(quantity);
    const setupsNum = parseInt(setupCount) || 1;
    const sizes: string[] = [];
    
    if (qtyNum <= setupsNum) {
      sizes.push(`${qtyNum} pieces in 1 batch`);
    } else {
      const batchSize = Math.floor(qtyNum / setupsNum);
      const remainder = qtyNum % setupsNum;
      
      for (let i = 0; i < setupsNum; i++) {
        const currentBatchSize = i < remainder ? batchSize + 1 : batchSize;
        sizes.push(`${currentBatchSize} pieces in batch ${i + 1}`);
      }
    }
    
    setBatchSizes(sizes);
    return sizes;
  };

  const calculateTotalTime = (hours: string, minutes: string): number => {
    const hoursNum = parseFloat(hours) || 0;
    const minutesNum = parseFloat(minutes) || 0;
    return hoursNum + minutesNum / 60;
  };

  const calculateCosts = () => {
    if (
      !machineHourlyCost || 
      !setupHourlyCost || 
      (includeProgramming && !programmingHourlyCost) || 
      !quantity ||
      (parseFloat(quantity) <= 0)
    ) {
      toast({
        title: "Missing inputs",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    const setupCountNum = parseInt(setupCount || "1");
    
    // Machine time is per piece, multiply by quantity
    const machineTimePerPiece = calculateTotalTime(machineTimeHours, machineTimeMinutes);
    const totalMachineTimeValue = machineTimePerPiece * quantityNum;
    
    // Setup time is per setup, multiply by setup count
    const setupTimePerSetup = calculateTotalTime(setupTimeHours, setupTimeMinutes);
    const totalSetupTimeValue = setupTimePerSetup * setupCountNum;
    
    const totalProgrammingTimeValue = includeProgramming ? calculateTotalTime(programmingTimeHours, programmingTimeMinutes) : 0;

    const machineCost = totalMachineTimeValue * parseFloat(machineHourlyCost);
    const setupCostValue = totalSetupTimeValue * parseFloat(setupHourlyCost);
    const programmingCostValue = includeProgramming ? totalProgrammingTimeValue * parseFloat(programmingHourlyCost) : 0;
    
    // Material cost comes from the MaterialCalculator component
    const materialCostValue = parseFloat(materialCost) || 0;

    const selectedProcesses = finishingProcesses.filter(p => p.selected && p.id !== "none");
    const finishingCostPerPiece = selectedProcesses.reduce((total, process) => total + process.cost, 0);
    const totalFinishingCost = finishingCostPerPiece * quantityNum;
    
    const toolCostValue = parseFloat(toolCost) || 0;
    const toolCostPerPiece = toolCostValue / quantityNum;

    const fixedCostsPerPiece = (setupCostValue + programmingCostValue) / quantityNum;
    const variableCostsPerPiece = (machineCost / quantityNum) + finishingCostPerPiece + toolCostPerPiece;
    const materialCostPerPiece = materialCostValue / quantityNum;
    
    let totalCostPerPiece = fixedCostsPerPiece + variableCostsPerPiece + materialCostPerPiece;
    
    if (addMarkup) {
      const markup = parseFloat(markupPercentage) / 100;
      totalCostPerPiece = totalCostPerPiece * (1 + markup);
    }
    
    const totalBatchCost = totalCostPerPiece * quantityNum;

    calculateOptimalBatchSizes();

    setTotalMachineTime(totalMachineTimeValue.toFixed(2));
    setCostPerPiece(totalCostPerPiece.toFixed(2));
    setTotalLotCost(totalBatchCost.toFixed(2));

    toast({
      title: "Calculation Complete",
      description: "The machining costs have been calculated successfully.",
    });
  };

  const handleFinishingChange = (processes: ProcessOption[]) => {
    if (processes.find(p => p.id === "none")?.selected) {
      setFinishingProcesses(processes.map(p => ({
        ...p,
        selected: p.id === "none"
      })));
    } else {
      setFinishingProcesses(processes.map(p => ({
        ...p,
        selected: p.id === "none" ? false : p.selected
      })));
    }
  };

  const resetForm = () => {
    setMachineTimeHours("");
    setMachineTimeMinutes("");
    setSetupTimeHours("");
    setSetupTimeMinutes("");
    setProgrammingTimeHours("");
    setProgrammingTimeMinutes("");

    setMachineHourlyCost("");
    setSetupHourlyCost("");
    setProgrammingHourlyCost("");
    setQuantity("1");
    
    setSetupCount("1");
    setFinishingProcesses(initialFinishingProcesses);
    setBatchSizes([]);
    setToolCost("0");
    setAddMarkup(false);
    setMarkupPercentage("20");
    setIncludeProgramming(true);

    setTotalMachineTime("0");
    setCostPerPiece("0");
    setTotalLotCost("0");
    setMaterialCost("0");

    toast({
      title: "Form Reset",
      description: "All inputs have been cleared.",
    });
  };

  const printQuote = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please allow popups for this site.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedProcesses = finishingProcesses.filter(p => p.selected);
    const selectedFinishingText = selectedProcesses.length > 0 
      ? selectedProcesses.map(p => p.name).join(", ") 
      : "None";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>CNC Machining Quote</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Georgia', 'Times New Roman', serif; 
              margin: 0; 
              padding: 40px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              color: #1e293b;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            h1 { 
              color: #0f172a; 
              font-size: 2.5rem;
              font-weight: 700;
              margin: 0 0 8px 0;
              text-align: center;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 16px;
            }
            h2 { 
              color: #334155; 
              font-size: 1.4rem;
              font-weight: 600;
              margin: 32px 0 16px 0;
              padding: 12px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .quote-header { 
              text-align: center;
              margin-bottom: 40px;
              padding: 24px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .quote-header p {
              margin: 4px 0;
              font-size: 1.1rem;
              color: #475569;
            }
            .quote-section { 
              margin-bottom: 32px;
              padding: 20px;
              border-radius: 8px;
              background: #fafafa;
            }
            table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 24px;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            th, td { 
              padding: 16px 20px; 
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            th { 
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              font-weight: 600;
              font-size: 0.95rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              background: white;
              font-size: 1rem;
            }
            tr:hover td {
              background: #f8fafc;
            }
            .total { 
              font-weight: 700;
              color: #0f172a;
              background: #f1f5f9 !important;
              font-size: 1.1rem;
            }
            .footer { 
              margin-top: 60px; 
              padding: 24px;
              font-size: 0.9rem; 
              color: #64748b;
              text-align: center;
              border-top: 2px solid #e2e8f0;
              background: #f8fafc;
              border-radius: 8px;
            }
            .footer p {
              margin: 8px 0;
            }
            .highlight {
              background: #fef3c7;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: 600;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 20px;
                background: white;
              }
              .container {
                box-shadow: none;
                border-radius: 0;
              }
              button { display: none; }
              .quote-header, .quote-section {
                background: white !important;
              }
              th {
                background: #3b82f6 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="quote-header">
              <h1>CNC Machining Quote</h1>
              <p><span class="highlight">Date:</span> ${new Date().toLocaleDateString()}</p>
              <p><span class="highlight">Quote Reference:</span> QT-${Date.now().toString().substring(6)}</p>
            </div>
            
            <div class="quote-section">
              <h2>📋 Job Details</h2>
              <table>
                <tr><th>Quantity</th><td>${quantity} pieces</td></tr>
                <tr><th>Material</th><td>See Material Calculator</td></tr>
                <tr><th>Finishing</th><td>${selectedFinishingText}</td></tr>
                <tr><th>Setup Count</th><td>${setupCount}</td></tr>
              </table>
            </div>
            
            <div class="quote-section">
              <h2>💰 Cost Breakdown</h2>
              <table>
                <tr><th>Machine Time</th><td>${totalMachineTime} hours</td></tr>
                <tr><th>Material Cost</th><td>$${materialCost}</td></tr>
                <tr><th>Cost Per Piece</th><td>$${costPerPiece}</td></tr>
                <tr class="total"><th>Total Lot Cost</th><td><strong>$${totalLotCost}</strong></td></tr>
              </table>
            </div>
            
            <div class="quote-section">
              <h2>📦 Batch Information</h2>
              <table>
                <tr><th colspan="2">Batch Distribution</th></tr>
                ${batchSizes.map((batch, index) => `<tr><td colspan="2">${batch}</td></tr>`).join('')}
              </table>
            </div>
            
            <div class="footer">
              <p><strong>Quote Validity:</strong> This quote is valid for 30 days from the date issued.</p>
              <p><strong>Terms:</strong> Standard terms and conditions apply.</p>
            </div>
            
            <button onclick="window.print();setTimeout(window.close, 500)" style="margin: 20px auto; display: block; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Print Quote</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);
    
    toast({
      title: "Print Ready",
      description: "Quote has been prepared for printing.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="machining" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="machining">Machining Calculator</TabsTrigger>
          <TabsTrigger value="material">Material Calculator</TabsTrigger>
          <TabsTrigger value="time">Time Calculator</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
        </TabsList>
        
        <Card className="mt-6">
          <CardHeader className="bg-muted">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Calculator className="h-6 w-6" />
              CNC Machining Cost Calculator
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <TabsContent value="machining" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="machine-time" className="flex items-center">
                      Machine Time <span className="text-xs ml-2 text-muted-foreground">(per piece)</span>:
                    </Label>
                    <TimeInput
                      hoursValue={machineTimeHours}
                      minutesValue={machineTimeMinutes}
                      onHoursChange={(e) => setMachineTimeHours(e.target.value)}
                      onMinutesChange={(e) => setMachineTimeMinutes(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="setup-time" className="flex items-center">
                      Setup Time <span className="text-xs ml-2 text-muted-foreground">(per setup)</span>:
                    </Label>
                    <TimeInput
                      hoursValue={setupTimeHours}
                      minutesValue={setupTimeMinutes}
                      onHoursChange={(e) => setSetupTimeHours(e.target.value)}
                      onMinutesChange={(e) => setSetupTimeMinutes(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="programming-time">Programming Time:</Label>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        id="include-programming"
                        checked={includeProgramming}
                        onCheckedChange={(checked) => setIncludeProgramming(checked as boolean)}
                      />
                      <Label htmlFor="include-programming" className="text-sm">Include programming cost</Label>
                    </div>
                    <TimeInput
                      hoursValue={programmingTimeHours}
                      minutesValue={programmingTimeMinutes}
                      onHoursChange={(e) => setProgrammingTimeHours(e.target.value)}
                      onMinutesChange={(e) => setProgrammingTimeMinutes(e.target.value)}
                      disabled={!includeProgramming}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="machine-hourly-cost">Machine Hourly Cost ($):</Label>
                    <Input
                      id="machine-hourly-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={machineHourlyCost}
                      onChange={(e) => setMachineHourlyCost(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="setup-hourly-cost">Setup Hourly Cost ($):</Label>
                    <Input
                      id="setup-hourly-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={setupHourlyCost}
                      onChange={(e) => setSetupHourlyCost(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="programming-hourly-cost">Programming Hourly Cost ($):</Label>
                    <Input
                      id="programming-hourly-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={programmingHourlyCost}
                      onChange={(e) => setProgrammingHourlyCost(e.target.value)}
                      disabled={!includeProgramming}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="quantity">Quantity:</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="setup-count">Setup Count:</Label>
                      <Input
                        id="setup-count"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={setupCount}
                        onChange={(e) => setSetupCount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="material" className="space-y-6 mt-0">
              <MaterialCalculator 
                standalone={false}
                externalQuantity={quantity}
                onMaterialCostChange={(cost) => setMaterialCost(cost)}
              />
            </TabsContent>
            
            <TabsContent value="time" className="mt-0">
              <TimeCalculator />
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tool-cost">Tool Cost ($):</Label>
                    <Input
                      id="tool-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={toolCost}
                      onChange={(e) => setToolCost(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Total cost of the tools needed for this job
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        id="add-markup"
                        checked={addMarkup}
                        onCheckedChange={(checked) => setAddMarkup(checked as boolean)}
                      />
                      <Label htmlFor="add-markup" className="text-sm">Add profit markup</Label>
                    </div>
                    
                    {addMarkup && (
                      <div className="mt-2">
                        <Label htmlFor="markup-percentage">Markup Percentage (%):</Label>
                        <Input
                          id="markup-percentage"
                          type="number"
                          min="0"
                          max="500"
                          step="1"
                          value={markupPercentage}
                          onChange={(e) => setMarkupPercentage(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Batch Optimization:</Label>
                    <div className="border rounded-md p-3 mt-1 bg-muted/20">
                      <p className="text-sm mb-2">Split production into multiple batches to optimize machine utilization.</p>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-sm font-medium">Quantity: {quantity}</span>
                        <span className="text-sm font-medium mx-2">|</span>
                        <span className="text-sm font-medium">Setups: {setupCount}</span>
                      </div>
                      
                      {batchSizes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Optimal Batch Distribution:</p>
                          <ul className="text-sm mt-1">
                            {batchSizes.map((size, index) => (
                              <li key={index} className="text-muted-foreground">{size}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <div className="flex gap-4 mt-6 justify-center">
              <Button variant="outline" onClick={resetForm}>Reset</Button>
              <Button 
                className="px-8" 
                onClick={calculateCosts}
              >
                Calculate
              </Button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-bold text-center mb-4">Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ResultCard label="Total Machine Time" value={`${totalMachineTime} hr`} />
                <ResultCard label="Cost Per Piece" value={`$${costPerPiece}`} />
                <ResultCard label="Total Lot Cost" value={`$${totalLotCost}`} />
                {parseFloat(materialCost) > 0 && (
                  <ResultCard label="Material Cost" value={`$${materialCost}`} />
                )}
              </div>
              
              <div className="mt-6 flex justify-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="mr-2">
                      <FileText className="mr-2 h-4 w-4" />
                      Export Options
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="grid gap-2">
                      <Button variant="outline" className="justify-start" onClick={printQuote}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Quote
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default MachiningCalculator;
