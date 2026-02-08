import { EditorTool, PLAYER_COLORS, FIELD_COLORS } from '@/types/customDrill';
import { cn } from '@/lib/utils';
import { 
  MousePointer, 
  Circle, 
  Triangle, 
  Target,
  ArrowRight,
  Minus,
  Goal
} from 'lucide-react';

interface ToolsPanelProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  pendingActionFrom: string | null;
}

const toolGroups = [
  {
    label: 'Players',
    tools: [
      { id: 'attacker' as const, label: 'Attacker', color: PLAYER_COLORS.ATTACKER },
      { id: 'defender' as const, label: 'Defender', color: PLAYER_COLORS.DEFENDER },
      { id: 'goalkeeper' as const, label: 'Goalkeeper', color: PLAYER_COLORS.GOALKEEPER },
      { id: 'neutral' as const, label: 'Neutral', color: PLAYER_COLORS.NEUTRAL },
    ],
  },
  {
    label: 'Equipment',
    tools: [
      { id: 'cone' as const, label: 'Cone', color: FIELD_COLORS.CONE },
      { id: 'ball' as const, label: 'Ball', color: '#ffffff' },
      { id: 'goal' as const, label: 'Goal', color: '#ffffff' },
      { id: 'minigoal' as const, label: 'Mini Goal', color: '#ffffff' },
    ],
  },
  {
    label: 'Lines',
    tools: [
      { id: 'coneline' as const, label: 'Cone Line', color: FIELD_COLORS.CONE },
    ],
  },
  {
    label: 'Actions',
    tools: [
      { id: 'pass' as const, label: 'Pass', color: '#ffffff' },
      { id: 'run' as const, label: 'Run', color: '#facc15' },
      { id: 'dribble' as const, label: 'Dribble', color: '#ffffff' },
      { id: 'shot' as const, label: 'Shot', color: '#ef4444' },
    ],
  },
];

export function ToolsPanel({ activeTool, onToolChange, pendingActionFrom }: ToolsPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Select tool */}
      <div className="space-y-2">
        <button
          onClick={() => onToolChange('select')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
            activeTool === 'select'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80 text-foreground'
          )}
        >
          <MousePointer className="h-4 w-4" />
          <span className="text-sm font-medium">Select / Move</span>
        </button>
      </div>

      {/* Tool groups */}
      {toolGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h4>
          <div className="grid grid-cols-2 gap-1">
            {group.tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left',
                  activeTool === tool.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                )}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tool.color }}
                />
                <span className="text-xs">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Pending action indicator */}
      {pendingActionFrom && (
        <div className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <p className="text-xs text-yellow-300">
            Click target to complete action
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="border-t border-border pt-3 mt-2">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Select a tool, then click on the field to place.
          Use Select to drag entities.
        </p>
      </div>
    </div>
  );
}
