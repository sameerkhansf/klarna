import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChecklistItem, Checklist } from "@/types/company.types";
import { Badge } from "@/components/ui/badge";
import { checklistService } from "@/lib/checklistService";

interface CompanyChecklistProps {
  companyId: string;
  className?: string;
}

export const CompanyChecklist: React.FC<CompanyChecklistProps> = ({
  companyId,
  className,
}) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Load checklist data
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const data = await checklistService.getChecklist(companyId);
        setChecklist(data);
      } catch (error) {
        console.error("Error loading checklist:", error);
      }
    };

    loadChecklist();
  }, [companyId]);

  const completedCount = checklist?.items.filter(item => item.completed).length || 0;
  const totalCount = checklist?.items.length || 0;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleItem = async (itemId: string) => {
    if (!checklist) return;
    
    try {
      const updatedItem = await checklistService.toggleChecklistItem(itemId);
      setChecklist({
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? updatedItem : item
        ),
      });
    } catch (error) {
      console.error("Error toggling checklist item:", error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim() || !checklist) return;

    try {
      const newItem = await checklistService.addChecklistItem(checklist.id, newItemText.trim());
      setChecklist({
        ...checklist,
        items: [...checklist.items, newItem],
      });

      setNewItemText("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!checklist) return;
    
    try {
      await checklistService.deleteChecklistItem(itemId);
      setChecklist({
        ...checklist,
        items: checklist.items.filter(item => item.id !== itemId),
      });
    } catch (error) {
      console.error("Error deleting checklist item:", error);
    }
  };

  const handleEditItem = async (itemId: string, newText: string) => {
    if (!checklist || !newText.trim()) return;
    
    try {
      const updatedItem = await checklistService.updateChecklistItem(itemId, { text: newText.trim() });
      setChecklist({
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? updatedItem : item
        ),
      });
      
      setEditingItem(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating checklist item:", error);
    }
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingItem(item.id);
    setEditText(item.text);
  };

  const filteredItems = checklist?.items.filter(item => !hideCompleted || !item.completed) || [];

  if (!checklist) return null;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
            {checklist.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHideCompleted(!hideCompleted)}
              className="text-xs"
            >
              {hideCompleted ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show completed
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide completed
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Checklist Items */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-gray-50 group",
                item.completed && "bg-gray-50/50"
              )}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                className="mt-0.5"
              />
              
              <div className="flex-1 min-w-0">
                {editingItem === item.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEditItem(item.id, editText);
                        } else if (e.key === "Escape") {
                          setEditingItem(null);
                          setEditText("");
                        }
                      }}
                      className="text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleEditItem(item.id, editText)}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "text-sm leading-relaxed break-words",
                      item.completed && "line-through text-gray-500"
                    )}
                  >
                    {item.text}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startEditing(item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {/* Add New Item */}
        {isAdding ? (
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Add checklist item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddItem();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewItemText("");
                }
              }}
              className="text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleAddItem} disabled={!newItemText.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewItemText("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full mt-2 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Button>
        )}
      </CardContent>
    </Card>
  );
};