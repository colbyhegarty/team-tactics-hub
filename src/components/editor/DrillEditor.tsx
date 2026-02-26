import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { Trash2, Save, ChevronDown, Wrench, Settings, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { fetchFilterOptions } from '@/lib/api';

interface DrillEditorProps {
  initialDrill?: CustomDrill | null;
  basedOnDrillId?: string;
  onSave: (formData: CustomDrillFormData, diagramData: DiagramData) => void;
  onCancel: () => void;
}

const difficulties = ['EASY', 'MEDIUM', 'HARD'] as const;

function DrillDetailsFormContent({ formData, onFormChange, categories }: {
  formData: CustomDrillFormData;
  onFormChange: (key: keyof CustomDrillFormData, value: string) => void;
  categories: string[];
}) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-editor-text-muted">Drill Name *</Label>
          <Input id="name" placeholder="Enter drill name" value={formData.name} onChange={(e) => onFormChange('name', e.target.value)} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs text-editor-text-muted">Category</Label>
          <Select value={formData.category} onValueChange={(value) => onFormChange('category', value)}>
            <SelectTrigger className="bg-editor-surface border-editor-border text-editor-text"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="difficulty" className="text-xs text-editor-text-muted">Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value) => onFormChange('difficulty', value)}>
            <SelectTrigger className="bg-editor-surface border-editor-border text-editor-text"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
            <SelectContent>{difficulties.map((diff) => (<SelectItem key={diff} value={diff}>{diff.charAt(0) + diff.slice(1).toLowerCase()}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ageGroup" className="text-xs text-editor-text-muted">Age Group</Label>
          <Input id="ageGroup" placeholder="e.g., 8+, U12" value={formData.ageGroup} onChange={(e) => onFormChange('ageGroup', e.target.value)} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="playerCount" className="text-xs text-editor-text-muted">Players</Label>
          <Input id="playerCount" placeholder="e.g., 6+, 8-12" value={formData.playerCount} onChange={(e) => onFormChange('playerCount', e.target.value)} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration" className="text-xs text-editor-text-muted">Duration</Label>
          <Input id="duration" placeholder="e.g., 15 min" value={formData.duration} onChange={(e) => onFormChange('duration', e.target.value)} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs text-editor-text-muted">Description</Label>
        <Textarea id="description" placeholder="Describe the drill objective and flow..." value={formData.description} onChange={(e) => onFormChange('description', e.target.value)} rows={2} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="setupText" className="text-xs text-editor-text-muted">Setup Instructions</Label>
          <Textarea id="setupText" placeholder="How to set up the drill..." value={formData.setupText} onChange={(e) => onFormChange('setupText', e.target.value)} rows={2} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instructionsText" className="text-xs text-editor-text-muted">How to Run</Label>
          <Textarea id="instructionsText" placeholder="Step-by-step instructions..." value={formData.instructionsText} onChange={(e) => onFormChange('instructionsText', e.target.value)} rows={2} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coachingPointsText" className="text-xs text-editor-text-muted">Coaching Points</Label>
          <Textarea id="coachingPointsText" placeholder="Key teaching points..." value={formData.coachingPointsText} onChange={(e) => onFormChange('coachingPointsText', e.target.value)} rows={2} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="variationsText" className="text-xs text-editor-text-muted">Variations</Label>
          <Textarea id="variationsText" placeholder="Alternative ways to run the drill..." value={formData.variationsText} onChange={(e) => onFormChange('variationsText', e.target.value)} rows={2} className="bg-editor-surface border-editor-border text-editor-text placeholder:text-editor-text-muted/50" />
        </div>
      </div>
    </div>
  );
}

export function DrillEditor({
  initialDrill,
  basedOnDrillId,
  onSave,
  onCancel,
}: DrillEditorProps) {
  const [tool, setTool] = useState<EditorState['tool']>('select');
  const [diagram, setDiagram] = useState<DiagramData>(
    initialDrill?.diagramData || getEmptyDiagram()
  );
  const [selectedEntity, setSelectedEntity] = useState<EditorState['selectedEntity']>(null);
  const [pendingActionFrom, setPendingActionFrom] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomDrillFormData>(
    initialDrill?.formData || getEmptyFormData()
  );

  const initialStateRef = useRef({
    diagram: JSON.stringify(initialDrill?.diagramData || getEmptyDiagram()),
    form: JSON.stringify(initialDrill?.formData || getEmptyFormData()),
  });

  const hasChanges = useMemo(() => {
    return JSON.stringify(diagram) !== initialStateRef.current.diagram ||
           JSON.stringify(formData) !== initialStateRef.current.form;
  }, [diagram, formData]);

  useEffect(() => {
    if (initialDrill) {
      setDiagram(initialDrill.diagramData);
      setFormData(initialDrill.formData);
      setSelectedEntity(null);
      setPendingActionFrom(null);
      initialStateRef.current = {
        diagram: JSON.stringify(initialDrill.diagramData),
        form: JSON.stringify(initialDrill.formData),
      };
    }
  }, [initialDrill]);

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchFilterOptions().then((options) => {
      setCategories(options.categories);
    });
  }, []);

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
    setFormData(getEmptyFormData());
    setSelectedEntity(null);
    setPendingActionFrom(null);
  };

  const handleFormChange = (key: keyof CustomDrillFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }
    onSave(formData, diagram);
  };

  return (
    <div className="space-y-6">
      {/* Header - hidden on mobile */}
      <div className="hidden md:flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {initialDrill ? 'Edit Custom Drill' : 'Create Custom Drill'}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClearAll} disabled={!hasChanges}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || !formData.name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Drill
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-4">
        {/* Tools Panel - collapsible on mobile */}
        <div className="order-2 lg:order-1">
          <div className="hidden lg:block">
            <ToolsPanel
              activeTool={tool}
              onToolChange={setTool}
              pendingActionFrom={pendingActionFrom}
            />
          </div>
          <Collapsible className="lg:hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between bg-editor-surface text-editor-text border border-editor-border rounded-t-lg data-[state=closed]:rounded-b-lg px-4 py-3 transition-all [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-editor-text-muted" />
                <span className="text-sm font-semibold">Tools</span>
              </div>
              <ChevronDown className="h-4 w-4 text-editor-text-muted transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-editor rounded-b-lg overflow-hidden">
              <ToolsPanel
                activeTool={tool}
                onToolChange={setTool}
                pendingActionFrom={pendingActionFrom}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Canvas */}
        <div className="order-1 lg:order-2">
          <DiagramCanvas
            diagram={diagram}
            tool={tool}
            selectedEntity={selectedEntity}
            pendingActionFrom={pendingActionFrom}
            onDiagramChange={setDiagram}
            onSelectEntity={setSelectedEntity}
            onPendingActionChange={setPendingActionFrom}
          />
        </div>

        {/* Properties Panel - collapsible on mobile */}
        <div className="order-3">
          <div className="hidden lg:block">
            <PropertiesPanel
              diagram={diagram}
              selectedEntity={selectedEntity}
              onDiagramChange={setDiagram}
              onDeleteSelected={handleDeleteSelected}
            />
          </div>
          <Collapsible className="lg:hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between bg-editor-surface text-editor-text border border-editor-border rounded-t-lg data-[state=closed]:rounded-b-lg px-4 py-3 transition-all [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-editor-text-muted" />
                <span className="text-sm font-semibold">Properties</span>
              </div>
              <ChevronDown className="h-4 w-4 text-editor-text-muted transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-editor rounded-b-lg overflow-hidden">
              <PropertiesPanel
                diagram={diagram}
                selectedEntity={selectedEntity}
                onDiagramChange={setDiagram}
                onDeleteSelected={handleDeleteSelected}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Drill Details Form */}
      <div className="hidden lg:block rounded-xl bg-editor p-5 space-y-5">
        <h3 className="text-base font-semibold text-editor-text">Drill Details</h3>
        <DrillDetailsFormContent formData={formData} onFormChange={handleFormChange} categories={categories} />
      </div>
      <Collapsible className="lg:hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between bg-editor-surface text-editor-text border border-editor-border rounded-t-lg data-[state=closed]:rounded-b-lg px-4 py-3 transition-all [&[data-state=open]>svg]:rotate-180">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-editor-text-muted" />
            <span className="text-sm font-semibold">Drill Details</span>
          </div>
          <ChevronDown className="h-4 w-4 text-editor-text-muted transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-editor rounded-b-lg overflow-hidden p-4 pt-0 space-y-4">
          <DrillDetailsFormContent formData={formData} onFormChange={handleFormChange} categories={categories} />
        </CollapsibleContent>
      </Collapsible>

      {/* Bottom Actions - desktop */}
      <div className="hidden md:flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || !formData.name.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {initialDrill ? 'Update Drill' : 'Save Drill'}
        </Button>
      </div>

      {/* Bottom Actions - mobile */}
      <div className="flex md:hidden gap-2 pt-4 pb-2">
        <Button variant="outline" onClick={handleClearAll} disabled={!hasChanges} className="flex-1">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || !formData.name.trim()} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {initialDrill ? 'Update Drill' : 'Save Drill'}
        </Button>
      </div>
    </div>
  );
}
