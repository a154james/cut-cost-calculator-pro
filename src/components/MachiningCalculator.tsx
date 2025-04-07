
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Box, FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResultCard from "./ResultCard";
import TimeInput from "./TimeInput";
import { Switch } from "@/components/ui/switch";
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

// Material density in g/cm³
const materialDensities: { [key: string]: number } = {
  "aluminum": 2.7,
  "steel": 7.85,
  "stainless-steel": 8.0,
  "brass": 8.5,
  "copper": 8.96,
  "titanium": 4.5,
  "plastic-pom": 1.41,
  "plastic-abs": 1.04,
  "plastic-nylon": 1.15
};

// Material cost per kg in USD
const materialCosts: { [key: string]: number } = {
  "aluminum": 4.5,
  "steel": 2.5,
  "stainless-steel": 5.0,
  "brass": 8.0,
  "copper": 9.0,
  "titanium": 35.0,
  "plastic-pom": 6.0,
  "plastic-abs": 5.0,
  "plastic-nylon": 7.0
};

// Surface finishing options and costs in USD
const finishingOptions: { [key: string]: number } = {
  "none": 0,
  "deburring": 15, 
  "brushing": 20,
  "polishing": 45,
  "anodizing": 50,
  "nickel-plating": 65,
  "powder-coating": 40,
  "chromate": 30
};

const MachiningCalculator = () => {
  const { toast } = useToast();

  // Time inputs
  const [machineTimeHours, setMachineTimeHours] = useState<string>("");
  const [machineTimeMinutes, setMachineTimeMinutes] = useState<string>("");
  const [setupTimeHours, setSetupTimeHours] = useState<string>("");
  const [setupTimeMinutes, setSetupTimeMinutes] = useState<string>("");
  const [programmingTimeHours, setProgrammingTimeHours] = useState<string>("");
  const [programmingTimeMinutes, setProgrammingTimeMinutes] = useState<string>("");

  // Cost inputs
  const [machineHourlyCost, setMachineHourlyCost] = useState<string>("");
  const [setupHourlyCost, setSetupHourlyCost] = useState<string>("");
  const [programmingHourlyCost, setProgrammingHourlyCost] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");

  // Material inputs
  const [selectedMaterial, setSelectedMaterial] = useState<string>("aluminum");
  const [materialVolume, setMaterialVolume] = useState<string>("");
  const [materialCostPerKg, setMaterialCostPerKg] = useState<string>(
    materialCosts[selectedMaterial].toString()
  );
  const [customDensity, setCustomDensity] = useState<string>("2.7");

  // Dimension inputs
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [thickness, setThickness] = useState<string>("");
  const [diameter, setDiameter] = useState<string>("");

  // Unit system toggle (Metric / SAE)
  const [isMetric, setIsMetric] = useState<boolean>(true);

  // Results
  const [totalMachineTime, setTotalMachineTime] = useState<string>("0");
  const [costPerPiece, setCostPerPiece] = useState<string>("0");
  const [totalLotCost, setTotalLotCost] = useState<string>("0");
  const [materialCost, setMaterialCost] = useState<string>("0");

  // New features
  const [setupCount, setSetupCount] = useState<string>("1");
  const [selectedFinishing, setSelectedFinishing] = useState<string>("none");
  const [batchSizes, setBatchSizes] = useState<string[]>([]);
  const [toolCost, setToolCost] = useState<string>("0");
  const [materialComparison, setMaterialComparison] = useState<boolean>(false);
  const [addMarkup, setAddMarkup] = useState<boolean>(false);
  const [markupPercentage, setMarkupPercentage] = useState<string>("20");
  const [includeProgramming, setIncludeProgramming] = useState<boolean>(true);
  
  // Calculated batch sizes
  const calculateOptimalBatchSizes = () => {
    const qtyNum = parseInt(quantity);
    const setupsNum = parseInt(setupCount) || 1;
    const sizes: string[] = [];
    
    if (qtyNum <= setupsNum) {
      sizes.push(`${qtyNum} pieces in 1 batch`);
    } else {
      // Simple batch distribution
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

  const calculateVolume = () => {
    let volume = 0;
    
    // Convert input strings to numbers, defaulting to 0 if empty
    const lengthVal = parseFloat(length) || 0;
    const widthVal = parseFloat(width) || 0;
    const thicknessVal = parseFloat(thickness) || 0;
    const diameterVal = parseFloat(diameter) || 0;
    
    if (diameterVal > 0 && lengthVal > 0) {
      // Cylindrical part: π × r² × length
      volume = Math.PI * Math.pow(diameterVal / 2, 2) * lengthVal;
    } else if (lengthVal > 0 && widthVal > 0 && thicknessVal > 0) {
      // Rectangular part: length × width × thickness
      volume = lengthVal * widthVal * thicknessVal;
    }
    
    // Convert from cubic inches to cubic cm if SAE units
    if (!isMetric && volume > 0) {
      volume *= 16.387064; // 1 in³ = 16.387064 cm³
    }
    
    if (volume > 0) {
      setMaterialVolume(volume.toFixed(2));
    }
  };

  const calculateCosts = () => {
    // Validate inputs
    if (
      !machineHourlyCost || 
      !setupHourlyCost || 
      !programmingHourlyCost || 
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

    // Calculate total times
    const totalMachineTimeValue = calculateTotalTime(machineTimeHours, machineTimeMinutes);
    const totalSetupTimeValue = calculateTotalTime(setupTimeHours, setupTimeMinutes);
    const totalProgrammingTimeValue = calculateTotalTime(programmingTimeHours, programmingTimeMinutes);

    // Calculate costs
    const machineCost = totalMachineTimeValue * parseFloat(machineHourlyCost);
    const setupCostValue = totalSetupTimeValue * parseFloat(setupHourlyCost) * parseInt(setupCount || "1");
    const programmingCostValue = includeProgramming ? totalProgrammingTimeValue * parseFloat(programmingHourlyCost) : 0;
    
    const quantityNum = parseInt(quantity);
    
    // Calculate material cost if material info is provided
    let materialCostValue = 0;
    if (materialVolume && parseFloat(materialVolume) > 0) {
      const volumeCm3 = parseFloat(materialVolume);
      const density = parseFloat(customDensity);
      const costPerKg = parseFloat(materialCostPerKg);
      
      // Volume (cm³) * density (g/cm³) / 1000 = weight in kg
      const weightKg = volumeCm3 * density / 1000;
      // Weight (kg) * cost per kg
      materialCostValue = weightKg * costPerKg * quantityNum;
      setMaterialCost(materialCostValue.toFixed(2));
    }

    // Get finishing cost
    const finishingCostPerPiece = finishingOptions[selectedFinishing] || 0;
    const totalFinishingCost = finishingCostPerPiece * quantityNum;
    
    // Tool cost per piece
    const toolCostValue = parseFloat(toolCost) || 0;
    const toolCostPerPiece = toolCostValue / quantityNum;

    // Fixed costs (setup and programming) are divided by quantity
    // Variable costs (machine time) are per piece
    const fixedCostsPerPiece = (setupCostValue + programmingCostValue) / quantityNum;
    const variableCostsPerPiece = machineCost + finishingCostPerPiece + toolCostPerPiece;
    const materialCostPerPiece = materialCostValue / quantityNum;
    
    let totalCostPerPiece = fixedCostsPerPiece + variableCostsPerPiece + materialCostPerPiece;
    
    // Apply markup if needed
    if (addMarkup) {
      const markup = parseFloat(markupPercentage) / 100;
      totalCostPerPiece = totalCostPerPiece * (1 + markup);
    }
    
    const totalBatchCost = totalCostPerPiece * quantityNum;

    // Calculate optimal batch sizes
    calculateOptimalBatchSizes();

    // Format and set result values
    setTotalMachineTime(totalMachineTimeValue.toFixed(2));
    setCostPerPiece(totalCostPerPiece.toFixed(2));
    setTotalLotCost(totalBatchCost.toFixed(2));

    toast({
      title: "Calculation Complete",
      description: "The machining costs have been calculated successfully.",
    });
  };

  const handleMaterialChange = (value: string) => {
    setSelectedMaterial(value);
    if (value in materialCosts) {
      setMaterialCostPerKg(materialCosts[value].toString());
      setCustomDensity(materialDensities[value].toString());
    }
  };

  const resetForm = () => {
    // Reset time inputs
    setMachineTimeHours("");
    setMachineTimeMinutes("");
    setSetupTimeHours("");
    setSetupTimeMinutes("");
    setProgrammingTimeHours("");
    setProgrammingTimeMinutes("");

    // Reset cost inputs
    setMachineHourlyCost("");
    setSetupHourlyCost("");
    setProgrammingHourlyCost("");
    setQuantity("1");

    // Reset material inputs
    setSelectedMaterial("aluminum");
    setMaterialVolume("");
    setMaterialCostPerKg(materialCosts["aluminum"].toString());
    setCustomDensity(materialDensities["aluminum"].toString());

    // Reset dimension inputs
    setLength("");
    setWidth("");
    setThickness("");
    setDiameter("");
    
    // Reset new features
    setSetupCount("1");
    setSelectedFinishing("none");
    setBatchSizes([]);
    setToolCost("0");
    setMaterialComparison(false);
    setAddMarkup(false);
    setMarkupPercentage("20");
    setIncludeProgramming(true);

    // Reset results
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
    
    printWindow.document.write(`
      <html>
        <head>
          <title>CNC Machining Quote</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1, h2 { color: #333; }
            .quote-header { margin-bottom: 30px; }
            .quote-section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
            .footer { margin-top: 50px; font-size: 0.8em; color: #666; }
            @media print {
              body { margin: 0.5cm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="quote-header">
            <h1>CNC Machining Quote</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Quote Reference: QT-${Date.now().toString().substring(6)}</p>
          </div>
          
          <div class="quote-section">
            <h2>Job Details</h2>
            <table>
              <tr><th>Quantity:</th><td>${quantity} pieces</td></tr>
              <tr><th>Material:</th><td>${selectedMaterial}</td></tr>
              <tr><th>Finishing:</th><td>${selectedFinishing}</td></tr>
              <tr><th>Setup Count:</th><td>${setupCount}</td></tr>
            </table>
          </div>
          
          <div class="quote-section">
            <h2>Cost Breakdown</h2>
            <table>
              <tr><th>Machine Time:</th><td>${totalMachineTime} hours</td></tr>
              <tr><th>Material Cost:</th><td>$${materialCost}</td></tr>
              <tr><th>Cost Per Piece:</th><td>$${costPerPiece}</td></tr>
              <tr><th class="total">Total Lot Cost:</th><td class="total">$${totalLotCost}</td></tr>
            </table>
          </div>
          
          <div class="quote-section">
            <h2>Batch Information</h2>
            <table>
              <tr><th>Batch Distribution:</th></tr>
              ${batchSizes.map(batch => `<tr><td>${batch}</td></tr>`).join('')}
            </table>
          </div>
          
          <div class="footer">
            <p>This quote is valid for 30 days from the date issued.</p>
            <p>Terms and conditions apply.</p>
          </div>
          
          <button onclick="window.print();setTimeout(window.close, 500)">Print Quote</button>
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
  
  const renderMaterialComparison = () => {
    if (!materialComparison) return null;
    
    // Get volume and calculate weight for each material
    const volumeCm3 = parseFloat(materialVolume) || 0;
    if (volumeCm3 <= 0) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Material Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(materialDensities).map(([material, density]) => {
                // Calculate weight: volume (cm³) * density (g/cm³) / 1000 = weight in kg
                const weightKg = volumeCm3 * density / 1000;
                // Calculate cost: weight (kg) * cost per kg * quantity
                const cost = weightKg * materialCosts[material] * parseInt(quantity || "1");
                
                return (
                  <TableRow key={material} className={material === selectedMaterial ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{material.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                    <TableCell>{weightKg.toFixed(3)}</TableCell>
                    <TableCell>${cost.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="machining" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="machining">Machining Calculator</TabsTrigger>
          <TabsTrigger value="material">Material Calculator</TabsTrigger>
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
                    <Label htmlFor="machine-time">Machine Time:</Label>
                    <TimeInput
                      hoursValue={machineTimeHours}
                      minutesValue={machineTimeMinutes}
                      onHoursChange={(e) => setMachineTimeHours(e.target.value)}
                      onMinutesChange={(e) => setMachineTimeMinutes(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="setup-time">Setup Time:</Label>
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
              <div className="flex items-center justify-end mb-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="unit-system" className="text-sm font-medium">SAE</Label>
                  <Switch 
                    id="unit-system" 
                    checked={isMetric}
                    onCheckedChange={setIsMetric}
                  />
                  <Label htmlFor="unit-system" className="text-sm font-medium">Metric</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="material-type">Material Type:</Label>
                    <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluminum">Aluminum</SelectItem>
                        <SelectItem value="steel">Steel</SelectItem>
                        <SelectItem value="stainless-steel">Stainless Steel</SelectItem>
                        <SelectItem value="brass">Brass</SelectItem>
                        <SelectItem value="copper">Copper</SelectItem>
                        <SelectItem value="titanium">Titanium</SelectItem>
                        <SelectItem value="plastic-pom">Plastic (POM)</SelectItem>
                        <SelectItem value="plastic-abs">Plastic (ABS)</SelectItem>
                        <SelectItem value="plastic-nylon">Plastic (Nylon)</SelectItem>
                        <SelectItem value="custom">Custom Material</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" type="button">
                        <Box className="mr-2 h-4 w-4" />
                        Enter Part Dimensions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Enter Part Dimensions</DialogTitle>
                        <DialogDescription>
                          Enter the dimensions of your part to calculate the volume.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <DialogTabs defaultValue="rectangular">
                          <DialogTabsList className="grid w-full grid-cols-2">
                            <DialogTabsTrigger value="rectangular">Rectangular</DialogTabsTrigger>
                            <DialogTabsTrigger value="cylindrical">Cylindrical</DialogTabsTrigger>
                          </DialogTabsList>
                          
                          <DialogTabsContent value="rectangular" className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="length">Length ({isMetric ? "mm" : "in"}):</Label>
                              <Input
                                id="length"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="width">Width ({isMetric ? "mm" : "in"}):</Label>
                              <Input
                                id="width"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="thickness">Thickness ({isMetric ? "mm" : "in"}):</Label>
                              <Input
                                id="thickness"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={thickness}
                                onChange={(e) => setThickness(e.target.value)}
                              />
                            </div>
                          </DialogTabsContent>
                          
                          <DialogTabsContent value="cylindrical" className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="diameter">Diameter ({isMetric ? "mm" : "in"}):</Label>
                              <Input
                                id="diameter"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={diameter}
                                onChange={(e) => setDiameter(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="cyl-length">Length ({isMetric ? "mm" : "in"}):</Label>
                              <Input
                                id="cyl-length"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                              />
                            </div>
                          </DialogTabsContent>
                        </DialogTabs>
                      </div>
                      
                      <DialogFooter>
                        <Button type="button" onClick={() => calculateVolume()}>
                          Calculate Volume
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <div>
                    <Label htmlFor="material-volume">Material Volume ({isMetric ? "cm³" : "in³ → cm³"}):</Label>
                    <Input
                      id="material-volume"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={materialVolume}
                      onChange={(e) => setMaterialVolume(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        id="compare-materials"
                        checked={materialComparison}
                        onCheckedChange={(checked) => setMaterialComparison(checked as boolean)}
                      />
                      <Label htmlFor="compare-materials" className="text-sm">Show material cost comparison</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="material-cost">Material Cost per kg ($):</Label>
                    <Input
                      id="material-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={materialCostPerKg}
                      onChange={(e) => setMaterialCostPerKg(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="material-density">Material Density (g/cm³):</Label>
                    <Input
                      id="material-density"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={customDensity}
                      onChange={(e) => setCustomDensity(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="finishing">Surface Finishing:</Label>
                    <Select value={selectedFinishing} onValueChange={setSelectedFinishing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select finishing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="deburring">Deburring (+$15)</SelectItem>
                        <SelectItem value="brushing">Brushing (+$20)</SelectItem>
                        <SelectItem value="polishing">Polishing (+$45)</SelectItem>
                        <SelectItem value="anodizing">Anodizing (+$50)</SelectItem>
                        <SelectItem value="nickel-plating">Nickel Plating (+$65)</SelectItem>
                        <SelectItem value="powder-coating">Powder Coating (+$40)</SelectItem>
                        <SelectItem value="chromate">Chromate (+$30)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {renderMaterialComparison()}
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

