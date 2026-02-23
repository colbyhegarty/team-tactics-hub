import { DiagramData, SelectedEntity, FieldConfig, PLAYER_COLORS } from '@/types/customDrill';
import { Trash2, Settings, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertiesPanelProps {
  diagram: DiagramData;
  selectedEntity: SelectedEntity | null;
  onDiagramChange: (diagram: DiagramData) => void;
  onDeleteSelected: () => void;
}

const getEntityColor = (role: string) => {
  switch (role) {
    case 'ATTACKER': return 'text-red-400';
    case 'DEFENDER': return 'text-blue-400';
    case 'GOALKEEPER': return 'text-yellow-400';
    case 'NEUTRAL': return 'text-orange-400';
    default: return 'text-gray-300';
  }
};

const getActionColor = (type: string) => {
  switch (type) {
    case 'PASS': return 'text-blue-400';
    case 'RUN': return 'text-yellow-400';
    case 'DRIBBLE': return 'text-purple-400';
    case 'SHOT': return 'text-red-400';
    default: return 'text-gray-300';
  }
};

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

  const totalEntities = diagram.players.length + diagram.cones.length + diagram.balls.length + diagram.goals.length;

  return (
    <div className="bg-[#1a2332] text-white rounded-lg p-4 overflow-y-auto max-h-[80vh] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-purple-400">Properties</h2>
      </div>

      {/* Field Type */}
      <div>
        <label className="text-gray-400 text-sm mb-1.5 block">Field Type</label>
        <select
          value={diagram.field.type}
          onChange={(e) => updateField({ type: e.target.value as 'FULL' | 'HALF' })}
          className="w-full bg-[#243044] border border-[#3d4f6f] rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-400 transition-colors"
        >
          <option value="FULL">Full Field</option>
          <option value="HALF">Half Field</option>
        </select>
      </div>

      {/* Goals */}
      <div>
        <label className="text-gray-400 text-sm mb-1.5 block">Goals</label>
        <select
          value={diagram.field.goals}
          onChange={(e) => updateField({ goals: Number(e.target.value) as 0 | 1 | 2 })}
          className="w-full bg-[#243044] border border-[#3d4f6f] rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-400 transition-colors"
        >
          <option value={0}>No Goals</option>
          <option value={1}>1 Goal (Top)</option>
          <option value={2}>2 Goals</option>
        </select>
      </div>

      {/* Show Markings */}
      <label className="flex items-center gap-3 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={diagram.field.markings}
          onChange={(e) => updateField({ markings: e.target.checked })}
          className="w-4 h-4 rounded bg-[#243044] border-[#3d4f6f] text-purple-500 focus:ring-purple-500 accent-purple-500"
        />
        <span className="text-gray-300 text-sm">Show Field Markings</span>
      </label>

      <hr className="border-[#3d4f6f]" />

      {/* Selected Entity */}
      {selectedEntity && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Selected</h3>
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded text-xs transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
          <div className="bg-[#243044] rounded-lg p-3 border border-purple-400/30 text-sm text-gray-300">
            {(() => {
              if (selectedEntity.type === 'player') {
                return `Player: ${selectedEntity.id}`;
              }
              if (selectedEntity.type === 'goal') {
                const goalIndex = diagram.goals.findIndex(g => g.id === selectedEntity.id);
                const goal = diagram.goals[goalIndex];
                return `${goal?.size === 'mini' ? 'Mini Goal' : 'Goal'} ${goalIndex + 1}`;
              }
              if (selectedEntity.type === 'cone') {
                const idx = diagram.cones.findIndex(c => c.id === selectedEntity.id);
                return `Cone ${idx + 1}`;
              }
              if (selectedEntity.type === 'ball') {
                const idx = diagram.balls.findIndex(b => b.id === selectedEntity.id);
                return `Ball ${idx + 1}`;
              }
              if (selectedEntity.type === 'action') {
                const idx = diagram.actions.findIndex(a => a.id === selectedEntity.id);
                const action = diagram.actions[idx];
                return `Action ${idx + 1}: ${action?.type}`;
              }
              if (selectedEntity.type === 'coneline') {
                const idx = diagram.coneLines.findIndex(l => l.id === selectedEntity.id);
                return `Cone Line ${idx + 1}`;
              }
              return `${selectedEntity.type}: ${selectedEntity.id}`;
            })()}
          </div>
          {selectedEntity.type === 'goal' && (() => {
            const goal = diagram.goals.find(g => g.id === selectedEntity.id);
            if (!goal) return null;
            return (
              <button
                onClick={() => {
                  onDiagramChange({
                    ...diagram,
                    goals: diagram.goals.map(g =>
                      g.id === selectedEntity.id
                        ? { ...g, rotation: (g.rotation + 90) % 360 }
                        : g
                    ),
                  });
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#243044] border border-[#3d4f6f] rounded-lg hover:bg-[#2d3a4f] transition-colors"
              >
                <RotateCw className="h-4 w-4 text-blue-400" />
                <span className="text-white text-sm">Rotate 90°</span>
                <span className="text-gray-500 text-xs ml-1">({goal.rotation}°)</span>
              </button>
            );
          })()}
          <hr className="border-[#3d4f6f]" />
        </>
      )}

      {/* Players & Equipment */}
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Players & Equipment ({totalEntities})
      </h3>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {diagram.players.map((player) => (
          <EntityItem
            key={player.id}
            label={player.id}
            detail={player.role.toLowerCase()}
            colorClass={getEntityColor(player.role)}
            dotColor={PLAYER_COLORS[player.role]}
            isSelected={selectedEntity?.id === player.id}
            onDelete={() => {
              onDiagramChange({
                ...diagram,
                players: diagram.players.filter(p => p.id !== player.id),
                actions: diagram.actions.filter(a => {
                  if (a.type === 'PASS') return a.fromPlayerId !== player.id && a.toPlayerId !== player.id;
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
            colorClass="text-orange-400"
            dotColor="#f4a261"
            isSelected={selectedEntity?.id === cone.id}
            onDelete={() => {
              onDiagramChange({
                ...diagram,
                cones: diagram.cones.filter(c => c.id !== cone.id),
                coneLines: diagram.coneLines.filter(l => l.fromConeId !== cone.id && l.toConeId !== cone.id),
              });
            }}
          />
        ))}
        {diagram.balls.map((ball, index) => (
          <EntityItem
            key={ball.id}
            label={`Ball ${index + 1}`}
            colorClass="text-white"
            dotColor="#ffffff"
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
            colorClass="text-gray-300"
            dotColor="#ffffff"
            isSelected={selectedEntity?.id === goal.id}
            onDelete={() => {
              onDiagramChange({
                ...diagram,
                goals: diagram.goals.filter(g => g.id !== goal.id),
              });
            }}
          />
        ))}
        {totalEntities === 0 && (
          <p className="text-gray-500 text-xs italic py-2">No entities placed yet</p>
        )}
      </div>

      {/* Actions */}
      {diagram.actions.length > 0 && (
        <>
          <hr className="border-[#3d4f6f]" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Actions ({diagram.actions.length})
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {diagram.actions.map((action, index) => {
              let label = '';
              if (action.type === 'PASS') {
                label = `${action.fromPlayerId} → ${action.toPlayerId}`;
              } else {
                label = action.playerId;
              }
              return (
                <div
                  key={action.id}
                  className={cn(
                    'flex items-center justify-between bg-[#243044] rounded-lg p-2.5 border border-[#3d4f6f] text-sm',
                    selectedEntity?.id === action.id && 'border-purple-400/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{index + 1}.</span>
                    <span className={cn('font-medium', getActionColor(action.type))}>{action.type}</span>
                    <span className="text-white">{label}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDiagramChange({
                        ...diagram,
                        actions: diagram.actions.filter(a => a.id !== action.id),
                      });
                    }}
                    className="w-6 h-6 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Cone Lines */}
      {diagram.coneLines.length > 0 && (
        <>
          <hr className="border-[#3d4f6f]" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Cone Lines ({diagram.coneLines.length})
          </h3>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {diagram.coneLines.map((line, index) => (
              <div
                key={line.id}
                className={cn(
                  'flex items-center justify-between bg-[#243044] rounded-lg p-2.5 border border-[#3d4f6f] text-sm',
                  selectedEntity?.id === line.id && 'border-purple-400/50'
                )}
              >
                <span className="text-orange-400 font-medium">Line {index + 1}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiagramChange({
                      ...diagram,
                      coneLines: diagram.coneLines.filter(l => l.id !== line.id),
                    });
                  }}
                  className="w-6 h-6 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded flex items-center justify-center transition-colors flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EntityItem({
  label,
  detail,
  colorClass,
  dotColor,
  isSelected,
  onDelete,
}: {
  label: string;
  detail?: string;
  colorClass: string;
  dotColor: string;
  isSelected: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between bg-[#243044] rounded-lg p-2.5 border border-[#3d4f6f] text-sm',
        isSelected && 'border-purple-400/50'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className={cn('font-medium', colorClass)}>{label}</span>
        {detail && <span className="text-gray-500 text-xs">({detail})</span>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-6 h-6 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded flex items-center justify-center transition-colors flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}
