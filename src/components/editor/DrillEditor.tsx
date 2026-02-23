import { useState, useCallback, useEffect } from 'react';
import { DiagramCanvas } from './DiagramCanvas';
import { ToolsPanel } from './ToolsPanel';
import { PropertiesPanel } from './PropertiesPanel';
import {
  EditorState,
  DiagramData,
  CustomDrillFormData,
  CustomDrill,
} from '@/types/customDrill';
import { getEmptyDiagram, getEmptyFormData } from '@/lib/customDrillStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Save } from 'lucide-react';
import { fetchFilterOptions } from '@/lib/api';

interface DrillEditorProps {
  initialDrill?: CustomDrill | null;
  basedOnDrillId?: string;
  onSave: (formData: CustomDrillFormData, diagramData: DiagramData) => void;
  onCancel: () => void;
}

const difficulties = ['EASY', 'MEDIUM', 'HARD'] as const;

export function DrillEditor({
  initialDrill,
  basedOnDrillId,
  onSave,
  onCancel,
}: DrillEditorProps) {
  // Editor state
  const [tool, setTool] = useState<EditorState['tool']>('select');
  const [diagram, setDiagram] = useState<DiagramData>(
    initialDrill?.diagramData || getEmptyDiagram()
  );
  const [selectedEntity, setSelectedEntity] = useState<EditorState['selectedEntity']>(null);
  const [pendingActionFrom, setPendingActionFrom] = useState<string | null>(null);
  const [goalRotation, setGoalRotation] = useState(0);

  // Form state
  const [formData, setFormData] = useState<CustomDrillFormData>(
    initialDrill?.formData || getEmptyFormData()
  );

  // Sync state when initialDrill prop changes (e.g. loading from existing drill)
  useEffect(() => {
    if (initialDrill) {
      setDiagram(initialDrill.diagramData);
      setFormData(initialDrill.formData);
      setSelectedEntity(null);
      setPendingActionFrom(null);
    }
  }, [initialDrill]);

  // Filter options
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    fetchFilterOptions().then((options) => {
      setCategories(options.categories);
    });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEntity && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
      if (e.key === 'Escape') {
        setSelectedEntity(null);
        setPendingActionFrom(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedEntity) return;

    if (selectedEntity.type === 'player') {
      setDiagram((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== selectedEntity.id),
        actions: prev.actions.filter((a) => {
          if (a.type === 'PASS') {
            return a.fromPlayerId !== selectedEntity.id && a.toPlayerId !== selectedEntity.id;
          }
          return a.playerId !== selectedEntity.id;
        }),
      }));
    } else if (selectedEntity.type === 'cone') {
      setDiagram((prev) => ({
        ...prev,
        cones: prev.cones.filter((c) => c.id !== selectedEntity.id),
        coneLines: prev.coneLines.filter(
          (l) => l.fromConeId !== selectedEntity.id && l.toConeId !== selectedEntity.id
        ),
      }));
    } else if (selectedEntity.type === 'ball') {
      setDiagram((prev) => ({
        ...prev,
        balls: prev.balls.filter((b) => b.id !== selectedEntity.id),
      }));
    } else if (selectedEntity.type === 'goal') {
      setDiagram((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== selectedEntity.id),
      }));
    } else if (selectedEntity.type === 'action') {
      setDiagram((prev) => ({
        ...prev,
        actions: prev.actions.filter((a) => a.id !== selectedEntity.id),
      }));
    } else if (selectedEntity.type === 'coneline') {
      setDiagram((prev) => ({
        ...prev,
        coneLines: prev.coneLines.filter((l) => l.id !== selectedEntity.id),
      }));
    }

    setSelectedEntity(null);
  }, [selectedEntity]);

  const handleClearAll = () => {
    setDiagram(getEmptyDiagram());
    setSelectedEntity(null);
    setPendingActionFrom(null);
  };

  const handleFormChange = (key: keyof CustomDrillFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      // Could add toast here
      return;
    }
    onSave(formData, diagram);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {initialDrill ? 'Edit Custom Drill' : 'Create Custom Drill'}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Drill
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-4">
        {/* Tools Panel */}
        <div className="order-2 lg:order-1">
          <ToolsPanel
            activeTool={tool}
            onToolChange={setTool}
            pendingActionFrom={pendingActionFrom}
            goalRotation={goalRotation}
            onGoalRotationChange={setGoalRotation}
          />
        </div>

        {/* Canvas */}
        <div className="order-1 lg:order-2">
          <DiagramCanvas
            diagram={diagram}
            tool={tool}
            selectedEntity={selectedEntity}
            pendingActionFrom={pendingActionFrom}
            goalRotation={goalRotation}
            onDiagramChange={setDiagram}
            onSelectEntity={setSelectedEntity}
            onPendingActionChange={setPendingActionFrom}
          />
        </div>

        {/* Properties Panel */}
        <div className="order-3">
          <PropertiesPanel
            diagram={diagram}
            selectedEntity={selectedEntity}
            onDiagramChange={setDiagram}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>
      </div>

      {/* Drill Details Form */}
      <div className="rounded-xl bg-[#1a2332] p-5 space-y-5">
        <h3 className="text-base font-semibold text-white">Drill Details</h3>

        <div className="grid gap-4">
          {/* Row 1: Name, Category, Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-gray-400">Drill Name *</Label>
              <Input
                id="name"
                placeholder="Enter drill name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs text-gray-400">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleFormChange('category', value)}
              >
                <SelectTrigger className="bg-[#243044] border-[#3d4f6f] text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="difficulty" className="text-xs text-gray-400">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleFormChange('difficulty', value)}
              >
                <SelectTrigger className="bg-[#243044] border-[#3d4f6f] text-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Age, Players, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ageGroup" className="text-xs text-gray-400">Age Group</Label>
              <Input
                id="ageGroup"
                placeholder="e.g., 8+, U12"
                value={formData.ageGroup}
                onChange={(e) => handleFormChange('ageGroup', e.target.value)}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playerCount" className="text-xs text-gray-400">Players</Label>
              <Input
                id="playerCount"
                placeholder="e.g., 6+, 8-12"
                value={formData.playerCount}
                onChange={(e) => handleFormChange('playerCount', e.target.value)}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs text-gray-400">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 15 min"
                value={formData.duration}
                onChange={(e) => handleFormChange('duration', e.target.value)}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs text-gray-400">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the drill objective and flow..."
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={2}
              className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
            />
          </div>

          {/* Instructions grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="setupText" className="text-xs text-gray-400">Setup Instructions</Label>
              <Textarea
                id="setupText"
                placeholder="How to set up the drill..."
                value={formData.setupText}
                onChange={(e) => handleFormChange('setupText', e.target.value)}
                rows={2}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructionsText" className="text-xs text-gray-400">How to Run</Label>
              <Textarea
                id="instructionsText"
                placeholder="Step-by-step instructions..."
                value={formData.instructionsText}
                onChange={(e) => handleFormChange('instructionsText', e.target.value)}
                rows={2}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coachingPointsText" className="text-xs text-gray-400">Coaching Points</Label>
              <Textarea
                id="coachingPointsText"
                placeholder="Key teaching points..."
                value={formData.coachingPointsText}
                onChange={(e) => handleFormChange('coachingPointsText', e.target.value)}
                rows={2}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variationsText" className="text-xs text-gray-400">Variations</Label>
              <Textarea
                id="variationsText"
                placeholder="Alternative ways to run the drill..."
                value={formData.variationsText}
                onChange={(e) => handleFormChange('variationsText', e.target.value)}
                rows={2}
                className="bg-[#243044] border-[#3d4f6f] text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="border-[#3d4f6f] text-gray-300 hover:bg-[#243044]">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!formData.name.trim()} className="bg-[#3d5a3d] hover:bg-[#4a6d4a] text-white">
          <Save className="h-4 w-4 mr-2" />
          {initialDrill ? 'Update Drill' : 'Save Drill'}
        </Button>
      </div>
    </div>
  );
}
