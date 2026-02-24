import { CustomDrill } from '@/types/customDrill';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrillCanvasRenderer, DrillData } from '@/components/editor/DrillCanvasRenderer';
import { cn } from '@/lib/utils';
import { useState, ReactNode } from 'react';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';
import {
  Clock, Users, GraduationCap, ClipboardList, Play, RefreshCw, Lightbulb,
  Maximize2, Download, Edit, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomDrillDetailModalProps {
  drill: CustomDrill | null;
  isOpen: boolean;
  onClose: () => void;
}

// Convert CustomDrill diagram data to DrillCanvasRenderer format
function toRendererData(drill: CustomDrill): DrillData {
  const { diagramData } = drill;

  // Build cone index map for cone lines
  const coneIdToIndex: Record<string, number> = {};
  diagramData.cones.forEach((c, i) => { coneIdToIndex[c.id] = i; });

  // Separate goals and mini goals
  const goals = diagramData.goals.filter(g => g.size === 'full');
  const miniGoals = diagramData.goals.filter(g => g.size === 'mini');

  // Convert actions
  const actions = diagramData.actions.map(action => {
    if (action.type === 'PASS') {
      return { type: 'PASS' as const, from_player: action.fromPlayerId, to_player: action.toPlayerId };
    }
    return {
      type: action.type as 'RUN' | 'DRIBBLE' | 'SHOT',
      player: action.playerId,
      to_position: action.toPosition,
    };
  });

  return {
    field: {
      type: diagramData.field.type,
      markings: diagramData.field.markings,
      goals: diagramData.field.goals,
    },
    players: diagramData.players.map(p => ({
      id: p.id,
      role: p.role,
      position: p.position,
    })),
    cones: diagramData.cones.map(c => ({ position: c.position })),
    cone_lines: diagramData.coneLines.map(cl => ({
      from_cone: coneIdToIndex[cl.fromConeId] ?? 0,
      to_cone: coneIdToIndex[cl.toConeId] ?? 0,
    })),
    balls: diagramData.balls.map(b => ({ position: b.position })),
    goals: goals.map(g => ({ position: g.position, rotation: g.rotation })),
    mini_goals: miniGoals.map(g => ({ position: g.position, rotation: g.rotation })),
    actions,
  };
}

// Format text with bullet points (matches DrillDetailModal)
const formatDrillText = (text?: string): ReactNode => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 mb-4">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-');
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s*(.+)/);
    if (isBullet) {
      listItems.push(<li key={index} className="text-foreground">{trimmed.replace(/^[•*-]\s*/, '')}</li>);
      return;
    }
    if (numberedMatch) {
      listItems.push(<li key={index} className="text-foreground">{numberedMatch[2]}</li>);
      return;
    }
    flushList();
    elements.push(<p key={index} className="mb-3 text-foreground leading-relaxed">{trimmed}</p>);
  });
  flushList();
  return elements.length > 0 ? elements : null;
};

export function CustomDrillDetailModal({ drill, isOpen, onClose }: CustomDrillDetailModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  if (!drill) return null;

  const { formData } = drill;
  const drillData = toRendererData(drill);

  const hasSetup = !!formData.setupText;
  const hasInstructions = !!formData.instructionsText;
  const hasVariations = !!formData.variationsText;
  const hasCoachingPoints = !!formData.coachingPointsText;
  const defaultTab = hasSetup ? 'setup' : hasInstructions ? 'instructions' : hasVariations ? 'variations' : 'coaching';

  const handleEdit = () => {
    onClose();
    navigate(`/?edit=${drill.id}`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl p-0 max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="p-6">
            {/* Header */}
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {formData.name || 'Untitled Drill'}
              </DialogTitle>
            </DialogHeader>

            {/* Badges Bar */}
            <div className="flex flex-wrap gap-2 mb-6">
              {formData.category && (
                <span className={cn('badge-pill font-medium', getCategoryColor(formData.category))}>
                  {formData.category}
                </span>
              )}
              {formData.difficulty && (
                <span className={cn('badge-pill font-medium', getDifficultyColor(formData.difficulty))}>
                  {formData.difficulty.charAt(0) + formData.difficulty.slice(1).toLowerCase()}
                </span>
              )}
              {formData.playerCount && (
                <span className="badge-pill badge-muted">
                  <Users className="h-3 w-3" />
                  {formData.playerCount} players
                </span>
              )}
              {formData.duration && (
                <span className="badge-pill badge-muted">
                  <Clock className="h-3 w-3" />
                  {formData.duration} min
                </span>
              )}
              {formData.ageGroup && (
                <span className="badge-pill badge-muted">
                  <GraduationCap className="h-3 w-3" />
                  {formData.ageGroup}
                </span>
              )}
            </div>

            {/* Diagram Section */}
            <div className="relative bg-card rounded-xl shadow-md border border-border p-4 mb-6">
              <div className="bg-field rounded-xl overflow-hidden">
                <DrillCanvasRenderer
                  drill={drillData}
                  width={900}
                  height={600}
                  className="w-full h-auto rounded-xl"
                />
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(true)}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Overview */}
            {formData.description && (
              <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/10">
                <h2 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                  <span className="text-primary">📋</span> Overview
                </h2>
                <p className="text-muted-foreground leading-relaxed">{formData.description}</p>
              </div>
            )}

            {/* Tabbed Content */}
            {(hasSetup || hasInstructions || hasVariations || hasCoachingPoints) && (
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                  {hasSetup && (
                    <TabsTrigger value="setup" className="flex items-center gap-1 py-2">
                      <ClipboardList className="h-4 w-4" />
                      <span className="hidden sm:inline">Setup</span>
                    </TabsTrigger>
                  )}
                  {hasInstructions && (
                    <TabsTrigger value="instructions" className="flex items-center gap-1 py-2">
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">Instructions</span>
                    </TabsTrigger>
                  )}
                  {hasVariations && (
                    <TabsTrigger value="variations" className="flex items-center gap-1 py-2">
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">Variations</span>
                    </TabsTrigger>
                  )}
                  {hasCoachingPoints && (
                    <TabsTrigger value="coaching" className="flex items-center gap-1 py-2">
                      <Lightbulb className="h-4 w-4" />
                      <span className="hidden sm:inline">Coaching</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                {hasSetup && (
                  <TabsContent value="setup" className="bg-card rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">{formatDrillText(formData.setupText)}</div>
                  </TabsContent>
                )}
                {hasInstructions && (
                  <TabsContent value="instructions" className="bg-card rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">{formatDrillText(formData.instructionsText)}</div>
                  </TabsContent>
                )}
                {hasVariations && (
                  <TabsContent value="variations" className="bg-secondary/30 rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">{formatDrillText(formData.variationsText)}</div>
                  </TabsContent>
                )}
                {hasCoachingPoints && (
                  <TabsContent value="coaching" className="bg-accent/30 rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">{formatDrillText(formData.coachingPointsText)}</div>
                  </TabsContent>
                )}
              </Tabs>
            )}

            {/* Actions Footer */}
            <div className="flex gap-3 pt-6 border-t border-border mt-6">
              <Button variant="outline" onClick={handleEdit} className="flex-1">
                <Edit className="h-4 w-4" />
                Edit Drill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="bg-field rounded-xl overflow-hidden">
            <DrillCanvasRenderer
              drill={drillData}
              width={900}
              height={600}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
