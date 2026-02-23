import { EditorTool } from '@/types/customDrill';
import { cn } from '@/lib/utils';
import { 
  MousePointer, 
  Triangle, 
  CircleDot,
  Crosshair,
  ArrowRight,
  MoveRight,
  Zap,
  Target,
  Minus,
} from 'lucide-react';
import { useState } from 'react';

interface ToolsPanelProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  pendingActionFrom: string | null;
  goalRotation?: number;
  onGoalRotationChange?: (rotation: number) => void;
}

const playerTools = [
  { id: 'attacker' as const, label: 'Attacker', color: '#ef4444' },
  { id: 'defender' as const, label: 'Defender', color: '#3b82f6' },
  { id: 'goalkeeper' as const, label: 'Goalkeeper', color: '#facc15' },
  { id: 'neutral' as const, label: 'Neutral', color: '#fb923c' },
];

const equipmentTools = [
  { id: 'cone' as const, label: 'Cone', color: '#fb923c' },
  { id: 'ball' as const, label: 'Ball', color: '#ffffff' },
  { id: 'goal' as const, label: 'Goal', color: '#ffffff' },
  { id: 'minigoal' as const, label: 'Mini Goal', color: '#94a3b8' },
];

const actionTools = [
  { id: 'pass' as const, label: 'Pass', borderColor: 'border-l-blue-400', textColor: 'text-blue-400', icon: ArrowRight },
  { id: 'run' as const, label: 'Run', borderColor: 'border-l-yellow-400', textColor: 'text-yellow-400', icon: MoveRight },
  { id: 'dribble' as const, label: 'Dribble', borderColor: 'border-l-purple-400', textColor: 'text-purple-400', icon: Zap },
  { id: 'shot' as const, label: 'Shot', borderColor: 'border-l-red-500', textColor: 'text-red-500', icon: Target },
];

const rotations = [
  { value: 0, label: '↑ N' },
  { value: 90, label: '→ E' },
  { value: 180, label: '↓ S' },
  { value: 270, label: '← W' },
];

const btnBase = 'bg-[#243044] border border-[#3d4f6f] rounded-lg hover:bg-[#2d3a4f] transition-colors';
const btnActive = 'bg-[#3d5a3d] border-[#5a7a5a]';

export function ToolsPanel({ activeTool, onToolChange, pendingActionFrom, goalRotation = 0, onGoalRotationChange }: ToolsPanelProps) {
  const [localRotation, setLocalRotation] = useState(goalRotation);
  const rotation = goalRotation ?? localRotation;
  const setRotation = onGoalRotationChange ?? setLocalRotation;

  return (
    <div className="flex flex-col gap-5 p-4 bg-[#1a2332] rounded-xl">
      {/* Select tool */}
      <button
        onClick={() => onToolChange('select')}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          activeTool === 'select' ? btnActive : btnBase,
          'text-white'
        )}
      >
        <MousePointer className="h-4 w-4" />
        <span className="text-sm font-medium">Select / Move</span>
      </button>

      {/* ADD PLAYERS */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add Players</h4>
        <div className="grid grid-cols-2 gap-2">
          {playerTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg transition-colors',
                activeTool === tool.id ? btnActive : btnBase
              )}
            >
              <div className="w-4 h-4 rounded-full mb-1.5" style={{ backgroundColor: tool.color }} />
              <span className="text-white text-xs">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ADD EQUIPMENT */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add Equipment</h4>
        <div className="grid grid-cols-2 gap-2">
          {equipmentTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg transition-colors',
                activeTool === tool.id ? btnActive : btnBase
              )}
            >
              {tool.id === 'cone' ? (
                <Triangle className="h-4 w-4 mb-1.5 text-orange-400" />
              ) : tool.id === 'ball' ? (
                <CircleDot className="h-4 w-4 mb-1.5 text-white" />
              ) : tool.id === 'goal' ? (
                <Crosshair className="h-4 w-4 mb-1.5 text-white" />
              ) : (
                <Crosshair className="h-4 w-4 mb-1.5 text-slate-400" />
              )}
              <span className="text-white text-xs">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Goal Rotation */}
        {(activeTool === 'goal' || activeTool === 'minigoal') && (
          <div className="mt-2 p-3 bg-[#243044] rounded-lg border border-[#3d4f6f]">
            <label className="text-gray-400 text-[11px] uppercase tracking-widest font-semibold mb-2 block">Goal Rotation</label>
            <div className="grid grid-cols-4 gap-1.5">
              {rotations.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRotation(r.value)}
                  className={cn(
                    'p-1.5 rounded text-xs font-medium transition-colors',
                    rotation === r.value
                      ? 'bg-[#3d5a3d] text-white'
                      : 'bg-[#1a2332] text-gray-400 hover:bg-[#2d3a4f] hover:text-gray-300'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOUNDARIES */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Boundaries</h4>
        <button
          onClick={() => onToolChange('coneline')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            activeTool === 'coneline' ? btnActive : btnBase,
            'text-white'
          )}
        >
          <Minus className="h-4 w-4 text-orange-400 rotate-[-30deg]" />
          <span className="text-sm">Cone Line</span>
        </button>
      </div>

      {/* ADD ACTIONS */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add Actions</h4>
        <div className="flex flex-col gap-1.5">
          {actionTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 border border-[#3d4f6f] border-l-4 rounded-lg transition-colors text-left',
                  tool.borderColor,
                  activeTool === tool.id ? 'bg-[#3d5a3d]' : 'bg-[#243044] hover:bg-[#2d3a4f]'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', tool.textColor)} />
                <span className="text-white text-xs">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending action indicator */}
      {pendingActionFrom && (
        <div className="p-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
          <p className="text-xs text-yellow-300 font-medium">
            Click target to complete action
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="border-t border-[#3d4f6f] pt-3">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <strong className="text-gray-400">Tip:</strong> Select a tool, then click on the field to place. Use Select to drag entities.
        </p>
      </div>
    </div>
  );
}