import { DiagramData, SelectedEntity, FieldConfig, PLAYER_COLORS } from '@/types/customDrill';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  diagram: DiagramData;
  selectedEntity: SelectedEntity | null;
  onDiagramChange: (diagram: DiagramData) => void;
  onDeleteSelected: () => void;
}

export function PropertiesPanel({
  diagram,
  selectedEntity,
  onDiagramChange,
  onDeleteSelected,
}: PropertiesPanelProps) {
  const updateField = (updates: Partial<FieldConfig>) => {
    onDiagramChange({
      ...diagram,
      field: { ...diagram.field, ...updates },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Field Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Field Settings</h4>

        <div className="space-y-2">
          <Label className="text-xs">Field Type</Label>
          <Select
            value={diagram.field.type}
            onValueChange={(value: 'FULL' | 'HALF') => updateField({ type: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL">Full Field</SelectItem>
              <SelectItem value="HALF">Half Field</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Markings</Label>
          <Switch
            checked={diagram.field.markings}
            onCheckedChange={(checked) => updateField({ markings: checked })}
          />
        </div>
      </div>

      {/* Selected Entity */}
      {selectedEntity && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Selected</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSelected}
              className="h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedEntity.type.charAt(0).toUpperCase() + selectedEntity.type.slice(1)}: {selectedEntity.id}
          </div>
        </div>
      )}

      {/* Entities List */}
      <div className="space-y-2 border-t border-border pt-3">
        <h4 className="text-sm font-semibold text-foreground">
          Entities ({diagram.players.length + diagram.cones.length + diagram.balls.length + diagram.goals.length})
        </h4>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {diagram.players.map((player) => (
            <EntityItem
              key={player.id}
              label={`${player.id} (${player.role.toLowerCase()})`}
              color={PLAYER_COLORS[player.role]}
              isSelected={selectedEntity?.id === player.id}
              onDelete={() => {
                onDiagramChange({
                  ...diagram,
                  players: diagram.players.filter(p => p.id !== player.id),
                  actions: diagram.actions.filter(a => {
                    if (a.type === 'PASS') {
                      return a.fromPlayerId !== player.id && a.toPlayerId !== player.id;
                    }
                    return a.playerId !== player.id;
                  }),
                });
              }}
            />
          ))}
          {diagram.cones.map((cone, index) => (
            <EntityItem
              key={cone.id}
              label={`Cone ${index + 1}`}
              color="#f4a261"
              isSelected={selectedEntity?.id === cone.id}
              onDelete={() => {
                onDiagramChange({
                  ...diagram,
                  cones: diagram.cones.filter(c => c.id !== cone.id),
                  coneLines: diagram.coneLines.filter(
                    l => l.fromConeId !== cone.id && l.toConeId !== cone.id
                  ),
                });
              }}
            />
          ))}
          {diagram.balls.map((ball, index) => (
            <EntityItem
              key={ball.id}
              label={`Ball ${index + 1}`}
              color="#ffffff"
              isSelected={selectedEntity?.id === ball.id}
              onDelete={() => {
                onDiagramChange({
                  ...diagram,
                  balls: diagram.balls.filter(b => b.id !== ball.id),
                });
              }}
            />
          ))}
          {diagram.goals.map((goal, index) => (
            <EntityItem
              key={goal.id}
              label={`${goal.size === 'full' ? 'Goal' : 'Mini Goal'} ${index + 1}`}
              color="#ffffff"
              isSelected={selectedEntity?.id === goal.id}
              onDelete={() => {
                onDiagramChange({
                  ...diagram,
                  goals: diagram.goals.filter(g => g.id !== goal.id),
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions List */}
      {diagram.actions.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <h4 className="text-sm font-semibold text-foreground">
            Actions ({diagram.actions.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {diagram.actions.map((action) => {
              let label = '';
              if (action.type === 'PASS') {
                label = `Pass: ${action.fromPlayerId} → ${action.toPlayerId}`;
              } else {
                label = `${action.type}: ${action.playerId}`;
              }
              return (
                <EntityItem
                  key={action.id}
                  label={label}
                  color={action.type === 'RUN' ? '#facc15' : action.type === 'SHOT' ? '#ef4444' : '#ffffff'}
                  isSelected={selectedEntity?.id === action.id}
                  onDelete={() => {
                    onDiagramChange({
                      ...diagram,
                      actions: diagram.actions.filter(a => a.id !== action.id),
                    });
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Cone Lines List */}
      {diagram.coneLines.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <h4 className="text-sm font-semibold text-foreground">
            Cone Lines ({diagram.coneLines.length})
          </h4>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {diagram.coneLines.map((line, index) => (
              <EntityItem
                key={line.id}
                label={`Line ${index + 1}`}
                color="#f4a261"
                isSelected={selectedEntity?.id === line.id}
                onDelete={() => {
                  onDiagramChange({
                    ...diagram,
                    coneLines: diagram.coneLines.filter(l => l.id !== line.id),
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EntityItem({
  label,
  color,
  isSelected,
  onDelete,
}: {
  label: string;
  color: string;
  isSelected: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-2 py-1 rounded text-xs',
        isSelected ? 'bg-primary/20' : 'hover:bg-secondary'
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-foreground">{label}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
