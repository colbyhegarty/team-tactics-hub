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

interface ToolsPanelProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  pendingActionFrom: string | null;
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

const btnBase = 'bg-[#243044] border border-[#3d4f6f] rounded-lg hover:bg-[#2d3a4f] transition-colors';
const btnActive = 'bg-[#3d5a3d] border-[#5a7a5a]';

export function ToolsPanel({ activeTool, onToolChange, pendingActionFrom }: ToolsPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-3 bg-transparent lg:bg-[#1a2332] rounded-xl">
      {/* Select tool */}
      <button
        onClick={() => onToolChange('select')}
        className={cn(
          'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors',
          activeTool === 'select' ? btnActive : btnBase,
          'text-white'
        )}
      >
        <MousePointer className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Select / Move</span>
      </button>

      {/* ADD PLAYERS */}
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Players</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {playerTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
                activeTool === tool.id ? btnActive : btnBase
              )}
            >
              <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: tool.color }} />
              <span className="text-white text-[10px]">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ADD EQUIPMENT */}
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Equipment</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {equipmentTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
                activeTool === tool.id ? btnActive : btnBase
              )}
            >
              {tool.id === 'cone' ? (
                <Triangle className="h-3.5 w-3.5 mb-1 text-orange-400" />
              ) : tool.id === 'ball' ? (
                <CircleDot className="h-3.5 w-3.5 mb-1 text-white" />
              ) : tool.id === 'goal' ? (
                <Crosshair className="h-3.5 w-3.5 mb-1 text-white" />
              ) : (
                <Crosshair className="h-3.5 w-3.5 mb-1 text-slate-400" />
              )}
              <span className="text-white text-[10px]">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BOUNDARIES */}
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Boundaries</h4>
        <button
          onClick={() => onToolChange('coneline')}
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors',
            activeTool === 'coneline' ? btnActive : btnBase,
            'text-white'
          )}
        >
          <Minus className="h-3.5 w-3.5 text-orange-400 rotate-[-30deg]" />
          <span className="text-xs">Cone Line</span>
        </button>
      </div>

      {/* ADD ACTIONS */}
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Actions</h4>
        <div className="flex flex-col gap-1">
          {actionTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 border border-[#3d4f6f] border-l-4 rounded-lg transition-colors text-left',
                  tool.borderColor,
                  activeTool === tool.id ? 'bg-[#3d5a3d]' : 'bg-[#243044] hover:bg-[#2d3a4f]'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', tool.textColor)} />
                <span className="text-white text-[11px]">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending action indicator */}
      {pendingActionFrom && (
        <div className="p-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
          <p className="text-[10px] text-yellow-300 font-medium">
            Click target to complete action
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="border-t border-[#3d4f6f] pt-2">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          <strong className="text-gray-400">Tip:</strong> Select a tool, click on field to place.
        </p>
      </div>
    </div>
  );
}
