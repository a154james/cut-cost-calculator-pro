
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Check } from "lucide-react";

export type ProcessOption = {
  id: string;
  name: string;
  cost: number;
  selected: boolean;
};

interface ProcessesManagerProps {
  processes: ProcessOption[];
  onChange: (processes: ProcessOption[]) => void;
}

const ProcessesManager = ({ processes, onChange }: ProcessesManagerProps) => {
  const [editableProcesses, setEditableProcesses] = useState<ProcessOption[]>([...processes]);
  
  const handleSelectionChange = (id: string, checked: boolean) => {
    const updatedProcesses = processes.map(process => 
      process.id === id ? { ...process, selected: checked } : process
    );
    onChange(updatedProcesses);
  };

  const handleEditChange = (id: string, cost: number) => {
    setEditableProcesses(
      editableProcesses.map(process => 
        process.id === id ? { ...process, cost } : process
      )
    );
  };

  const saveChanges = () => {
    onChange(editableProcesses);
  };

  const getSelectedProcessesText = () => {
    const selected = processes.filter(p => p.selected);
    if (selected.length === 0) return "None";
    if (selected.length === 1) return selected[0].name;
    return `${selected.length} processes selected`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Surface Finishing:</Label>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Finishing Processes</DialogTitle>
              <DialogDescription>
                Edit costs and select finishing processes for your project.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">Cost ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell className="pt-2">
                        <Checkbox
                          checked={process.selected}
                          onCheckedChange={(checked) => {
                            setEditableProcesses(
                              editableProcesses.map(p => 
                                p.id === process.id ? { ...p, selected: checked as boolean } : p
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>{process.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={process.cost}
                          onChange={(e) => handleEditChange(process.id, parseFloat(e.target.value) || 0)}
                          className="w-20 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter>
              <Button onClick={saveChanges}>
                <Check className="h-4 w-4 mr-1" /> 
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border border-input rounded-md px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{getSelectedProcessesText()}</span>
        <span className="text-sm font-medium">
          {processes.filter(p => p.selected).length > 0 ? 
            `$${processes.filter(p => p.selected).reduce((sum, p) => sum + p.cost, 0)}` : 
            '$0'}
        </span>
      </div>
    </div>
  );
};

export default ProcessesManager;
