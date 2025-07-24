import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/types/company.types";
import { supabase } from "@/lib/supabaseClient";
import { labelService } from "@/lib/labelService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LabelSelectorProps {
  selectedLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  className?: string;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  selectedLabels,
  onLabelsChange,
  className,
}) => {
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const [isCreating, setIsCreating] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch available labels from database
  useEffect(() => {
    const fetchLabels = async () => {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .order("name");

      if (!error && data) {
        setAvailableLabels(data);
      }
    };

    fetchLabels();
  }, []);

  const handleAddLabel = async (label: Label) => {
    if (!selectedLabels.find((l) => l.id === label.id)) {
      const updatedLabels = [...selectedLabels, label];
      onLabelsChange(updatedLabels);
    }
    setIsOpen(false);
  };

  const handleRemoveLabel = (labelId: string) => {
    const updatedLabels = selectedLabels.filter((l) => l.id !== labelId);
    onLabelsChange(updatedLabels);
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("labels")
        .insert({
          name: newLabelName.trim(),
          color: newLabelColor,
        })
        .select()
        .single();

      if (!error && data) {
        const newLabel: Label = {
          id: data.id,
          name: data.name,
          color: data.color,
          description: data.description,
        };

        setAvailableLabels((prev) => [...prev, newLabel]);
        handleAddLabel(newLabel);
        setNewLabelName("");
        setNewLabelColor("#3B82F6");
      }
    } catch (error) {
      console.error("Error creating label:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLabel = async (label: Label) => {
    setLabelToDelete(label);
  };

  const confirmDeleteLabel = async () => {
    if (!labelToDelete) return;

    setIsDeleting(true);
    try {
      await labelService.deleteLabel(labelToDelete.id);
      
      // Remove from available labels
      setAvailableLabels((prev) => prev.filter((l) => l.id !== labelToDelete.id));
      
      // Remove from selected labels if present
      if (selectedLabels.find((l) => l.id === labelToDelete.id)) {
        const updatedSelectedLabels = selectedLabels.filter((l) => l.id !== labelToDelete.id);
        onLabelsChange(updatedSelectedLabels);
      }
      
      setLabelToDelete(null);
    } catch (error) {
      console.error("Error deleting label:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const predefinedColors = [
    "#EF4444",
    "#F59E0B",
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#06B6D4",
    "#EC4899",
    "#84CC16",
    "#F97316",
    "#14B8A6",
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Labels Display */}
      <div className="flex flex-wrap gap-2">
        {selectedLabels.map((label) => (
          <Badge
            key={label.id}
            className="flex items-center gap-1 text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              type="button"
              onClick={() => handleRemoveLabel(label.id)}
              className="ml-1 hover:bg-black/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Label Selector Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <span>Add labels...</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search labels..." />
            <CommandList style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <CommandEmpty>
                <div className="p-4 space-y-4">
                  <p className="text-sm text-gray-500">No labels found.</p>

                  {/* Create New Label Section */}
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="text-sm font-medium">Create New Label</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Label name"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newLabelName.trim()) {
                            handleCreateLabel();
                          }
                        }}
                      />

                      {/* Color Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Color:</span>
                        <div className="flex gap-1">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
                                newLabelColor === color
                                  ? "border-gray-800 scale-110"
                                  : "border-gray-300 hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewLabelColor(color)}
                            />
                          ))}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleCreateLabel}
                        disabled={!newLabelName.trim() || isCreating}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {isCreating ? "Creating..." : "Create Label"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CommandEmpty>

              <CommandGroup>
                {availableLabels
                  .filter(
                    (label) => !selectedLabels.find((l) => l.id === label.id)
                  )
                  .map((label) => (
                    <CommandItem
                      key={label.id}
                      onSelect={() => handleAddLabel(label)}
                      className="flex items-center gap-2 justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span>{label.name}</span>
                        {label.description && (
                          <span className="text-sm text-gray-500 ml-2">
                            - {label.description}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLabel(label);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        title="Delete label"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!labelToDelete} onOpenChange={() => setLabelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the label "{labelToDelete?.name}"? This action cannot be undone and will remove the label from all companies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLabel}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
