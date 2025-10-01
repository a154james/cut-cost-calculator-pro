import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Box, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MaterialCost {
  [key: string]: number;
}

interface MaterialDensity {
  [key: string]: number;
}

const defaultMaterialDensities: MaterialDensity = {
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

// SAE densities in lb/in³
const saeMaterialDensities: MaterialDensity = {
  "aluminum": 0.0975,
  "steel": 0.284,
  "stainless-steel": 0.289,
  "brass": 0.307,
  "copper": 0.324,
  "titanium": 0.163,
  "plastic-pom": 0.051,
  "plastic-abs": 0.0376,
  "plastic-nylon": 0.0416
};

const defaultMaterialCosts: MaterialCost = {
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

interface MaterialCalculatorProps {
  standalone?: boolean;
  externalQuantity?: string;
  onMaterialCostChange?: (cost: string) => void;
}

const MaterialCalculator = ({ 
  standalone = false, 
  externalQuantity, 
  onMaterialCostChange 
}: MaterialCalculatorProps) => {
  const { toast } = useToast();

  // Load material costs from localStorage or use defaults
  const [materialCosts, setMaterialCosts] = useState<MaterialCost>(() => {
    const saved = localStorage.getItem('materialCosts');
    return saved ? JSON.parse(saved) : defaultMaterialCosts;
  });
  const [materialDensities] = useState<MaterialDensity>(defaultMaterialDensities);

  const [selectedMaterial, setSelectedMaterial] = useState<string>("aluminum");
  const [materialVolume, setMaterialVolume] = useState<string>("");
  const [materialCostPerKg, setMaterialCostPerKg] = useState<string>(() => {
    const costPerKg = materialCosts["aluminum"];
    return costPerKg.toString();
  });
  const [customDensity, setCustomDensity] = useState<string>("2.7");
  const [quantity, setQuantity] = useState<string>("1");

  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [thickness, setThickness] = useState<string>("");
  const [diameter, setDiameter] = useState<string>("");

  const [isMetric, setIsMetric] = useState<boolean>(false);
  const [materialComparison, setMaterialComparison] = useState<boolean>(false);
  const [materialCost, setMaterialCost] = useState<string>("0");

  // Configuration dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [tempMaterialCosts, setTempMaterialCosts] = useState<MaterialCost>(materialCosts);

  // Use external quantity if provided (for integration with main calculator)
  const effectiveQuantity = standalone ? quantity : (externalQuantity || "1");

  // Get current density values based on unit system
  const currentDensities = isMetric ? defaultMaterialDensities : saeMaterialDensities;

  // Handle unit system changes
  useEffect(() => {
    const newDensity = currentDensities[selectedMaterial];
    if (newDensity) {
      setCustomDensity(newDensity.toString());
    }
    
    // Convert volume when switching units
    if (materialVolume && parseFloat(materialVolume) > 0) {
      const currentVolume = parseFloat(materialVolume);
      let convertedVolume: number;
      
      if (isMetric) {
        // Converting from in³ to cm³
        convertedVolume = currentVolume * 16.387064;
      } else {
        // Converting from cm³ to in³
        convertedVolume = currentVolume / 16.387064;
      }
      
      setMaterialVolume(convertedVolume.toFixed(2));
    }
    
    // Convert material cost when switching units
    const currentCost = parseFloat(materialCostPerKg);
    if (!isNaN(currentCost)) {
      let convertedCost: number;
      if (isMetric) {
        // Converting from $/lb to $/kg
        convertedCost = currentCost * 2.20462;
      } else {
        // Converting from $/kg to $/lb
        convertedCost = currentCost / 2.20462;
      }
      setMaterialCostPerKg(convertedCost.toFixed(2));
    }
  }, [isMetric, selectedMaterial, currentDensities]);

  const calculateVolume = () => {
    let volume = 0;
    
    const lengthVal = parseFloat(length) || 0;
    const widthVal = parseFloat(width) || 0;
    const thicknessVal = parseFloat(thickness) || 0;
    const diameterVal = parseFloat(diameter) || 0;
    
    if (diameterVal > 0 && lengthVal > 0) {
      volume = Math.PI * Math.pow(diameterVal / 2, 2) * lengthVal;
    } else if (lengthVal > 0 && widthVal > 0 && thicknessVal > 0) {
      volume = lengthVal * widthVal * thicknessVal;
    }
    
    if (isMetric && volume > 0) {
      // Convert from cubic mm to cubic cm
      volume /= 1000;
    }
    // If SAE mode, keep as cubic inches - no conversion needed
    
    if (volume > 0) {
      setMaterialVolume(volume.toFixed(2));
      const volumeUnit = isMetric ? "cm³" : "in³";
      toast({
        title: "Volume Calculated",
        description: `Material volume: ${volume.toFixed(2)} ${volumeUnit}`,
      });
    } else {
      toast({
        title: "Invalid Dimensions",
        description: "Please enter valid dimensions to calculate volume.",
        variant: "destructive",
      });
    }
  };

  const calculateMaterialCost = () => {
    if (!materialVolume || parseFloat(materialVolume) <= 0) {
      toast({
        title: "Missing Volume",
        description: "Please enter or calculate the material volume first.",
        variant: "destructive",
      });
      return;
    }

    if (!effectiveQuantity || parseFloat(effectiveQuantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    const volume = parseFloat(materialVolume);
    const density = parseFloat(customDensity);
    const costPerUnit = parseFloat(materialCostPerKg);
    const quantityNum = parseInt(effectiveQuantity);
    
    // Calculate weight and cost based on unit system
    let totalMaterialCost: number;
    if (isMetric) {
      // Metric: volume in cm³, density in g/cm³, cost per kg
      const weightKg = volume * density / 1000;
      totalMaterialCost = weightKg * costPerUnit * quantityNum;
    } else {
      // SAE: volume in in³, density in lb/in³, cost per lb
      const weightLbs = volume * density;
      totalMaterialCost = weightLbs * costPerUnit * quantityNum;
    }
    
    setMaterialCost(totalMaterialCost.toFixed(2));
    
    // Notify parent component if callback is provided
    if (onMaterialCostChange) {
      onMaterialCostChange(totalMaterialCost.toFixed(2));
    }

    toast({
      title: "Material Cost Calculated",
      description: `Total material cost: $${totalMaterialCost.toFixed(2)}`,
    });
  };

  const handleMaterialChange = (value: string) => {
    setSelectedMaterial(value);
    if (value in materialCosts) {
      const costPerKg = materialCosts[value];
      // Convert to $/lb if in SAE mode
      const displayCost = isMetric ? costPerKg : costPerKg / 2.20462;
      setMaterialCostPerKg(displayCost.toFixed(2));
      setCustomDensity(currentDensities[value].toString());
    }
  };

  const saveMaterialCosts = () => {
    setMaterialCosts(tempMaterialCosts);
    // Save to localStorage
    localStorage.setItem('materialCosts', JSON.stringify(tempMaterialCosts));
    // Update current material cost if it's selected
    if (selectedMaterial in tempMaterialCosts) {
      const costPerKg = tempMaterialCosts[selectedMaterial];
      const displayCost = isMetric ? costPerKg : costPerKg / 2.20462;
      setMaterialCostPerKg(displayCost.toFixed(2));
    }
    setConfigDialogOpen(false);
    toast({
      title: "Material Costs Updated",
      description: "Material costs have been saved.",
    });
  };

  const resetMaterialCosts = () => {
    setTempMaterialCosts(defaultMaterialCosts);
  };

  const renderMaterialComparison = () => {
    if (!materialComparison) return null;
    
    const volume = parseFloat(materialVolume) || 0;
    if (volume <= 0) return null;
    
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
                <TableHead>Weight</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(currentDensities).map(([material, density]) => {
                let weight: number;
                let costPerUnit: number;
                if (isMetric) {
                  // Metric: volume in cm³, density in g/cm³
                  const weightKg = volume * density / 1000;
                  weight = weightKg;
                  costPerUnit = weightKg * materialCosts[material];
                } else {
                  // SAE: volume in in³, density in lb/in³
                  const weightLbs = volume * density;
                  weight = weightLbs;
                  costPerUnit = weightLbs * (materialCosts[material] / 2.20462);
                }
                const totalCost = costPerUnit * parseInt(effectiveQuantity || "1");
                
                return (
                  <TableRow key={material} className={material === selectedMaterial ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{material.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                    <TableCell>{weight.toFixed(3)} {isMetric ? "kg" : "lb"}</TableCell>
                    <TableCell>${costPerUnit.toFixed(2)}</TableCell>
                    <TableCell>${totalCost.toFixed(2)}</TableCell>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="unit-system" className="text-sm font-medium">SAE</Label>
          <Switch 
            id="unit-system" 
            checked={isMetric}
            onCheckedChange={setIsMetric}
          />
          <Label htmlFor="unit-system" className="text-sm font-medium">Metric</Label>
        </div>
        
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configure Material Costs
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Material Costs</DialogTitle>
              <DialogDescription>
                Edit the cost per kg for each material type.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(tempMaterialCosts).map(([material, cost]) => (
                <div key={material} className="flex items-center space-x-2">
                  <Label className="min-w-[120px] text-sm">
                    {material.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setTempMaterialCosts(prev => ({
                      ...prev,
                      [material]: parseFloat(e.target.value) || 0
                    }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{isMetric ? "$/kg" : "$/lb"}</span>
                </div>
              ))}
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={resetMaterialCosts}>
                Reset to Defaults
              </Button>
              <Button onClick={saveMaterialCosts}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <Tabs defaultValue="rectangular">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rectangular">Rectangular</TabsTrigger>
                    <TabsTrigger value="cylindrical">Cylindrical</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="rectangular" className="space-y-4 mt-4">
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
                  </TabsContent>
                  
                  <TabsContent value="cylindrical" className="space-y-4 mt-4">
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
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter>
                <Button type="button" onClick={calculateVolume}>
                  Calculate Volume
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div>
            <Label htmlFor="material-volume">Material Volume ({isMetric ? "cm³" : "in³"}):</Label>
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
          
          {standalone && (
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
          )}
          
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
            <Label htmlFor="material-cost">Material Cost per {isMetric ? "kg" : "lb"} ($):</Label>
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
            <Label htmlFor="material-density">Material Density ({isMetric ? "g/cm³" : "lb/in³"}):</Label>
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
          
          <div className="mt-6">
            <Button onClick={calculateMaterialCost} className="w-full">
              Calculate Material Cost
            </Button>
          </div>
          
          {parseFloat(materialCost) > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Material Cost Result:</Label>
              <p className="text-2xl font-bold text-primary">${materialCost}</p>
              <p className="text-sm text-muted-foreground">
                For {effectiveQuantity} piece{parseInt(effectiveQuantity) !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {renderMaterialComparison()}
    </div>
  );
};

export default MaterialCalculator;