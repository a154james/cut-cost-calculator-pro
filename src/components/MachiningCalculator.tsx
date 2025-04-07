
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Box } from "lucide-react";
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
    const setupCost = totalSetupTimeValue * parseFloat(setupHourlyCost);
    const programmingCost = totalProgrammingTimeValue * parseFloat(programmingHourlyCost);
    
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

    // Fixed costs (setup and programming) are divided by quantity
    // Variable costs (machine time) are per piece
    const fixedCostsPerPiece = (setupCost + programmingCost) / quantityNum;
    const variableCostsPerPiece = machineCost;
    const materialCostPerPiece = materialCostValue / quantityNum;
    
    const totalCostPerPiece = fixedCostsPerPiece + variableCostsPerPiece + materialCostPerPiece;
    const totalBatchCost = totalCostPerPiece * quantityNum;

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

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="machining" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="machining">Machining Calculator</TabsTrigger>
          <TabsTrigger value="material">Material Calculator</TabsTrigger>
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
                    <TimeInput
                      hoursValue={programmingTimeHours}
                      minutesValue={programmingTimeMinutes}
                      onHoursChange={(e) => setProgrammingTimeHours(e.target.value)}
                      onMinutesChange={(e) => setProgrammingTimeMinutes(e.target.value)}
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
                    />
                  </div>
                  
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
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default MachiningCalculator;
