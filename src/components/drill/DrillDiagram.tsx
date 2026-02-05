import { DrillJsonData, Position } from '@/types/drill';

interface DrillDiagramProps {
  drillJson: DrillJsonData;
  animatedPositions?: { [entityId: string]: Position };
  className?: string;
}

// Color mapping for player roles
const getPlayerColor = (role: string): string => {
  switch (role) {
    case 'attacker':
      return '#22c55e'; // green-500
    case 'defender':
      return '#ef4444'; // red-500
    case 'goalkeeper':
      return '#eab308'; // yellow-500
    case 'neutral':
      return '#3b82f6'; // blue-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Get position for an entity, using animated position if available
const getPosition = (
  entityId: string,
  defaultPos: Position,
  animatedPositions?: { [entityId: string]: Position }
): Position => {
  if (animatedPositions && animatedPositions[entityId]) {
    return animatedPositions[entityId];
  }
  return defaultPos;
};

export function DrillDiagram({ drillJson, animatedPositions, className }: DrillDiagramProps) {
  const { field, players = [], cones = [], balls = [], goals = [], movements = [], cone_lines = [] } = drillJson;
  
  const isFullField = field?.type === 'FULL';
  const showMarkings = field?.show_markings !== false;
  
  // Calculate viewBox based on field type
  const viewBoxWidth = 100;
  const viewBoxHeight = isFullField ? 65 : 50;
  
  return (
    <svg 
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
      className={className || 'w-full h-auto'}
      style={{ backgroundColor: '#2d5a27' }}
    >
      {/* Field background - grass texture */}
      <defs>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="#2d5a27" />
          <line x1="0" y1="2" x2="4" y2="2" stroke="#3a6b33" strokeWidth="0.5" opacity="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#grass)" />
      
      {/* Field markings */}
      {showMarkings && (
        <g stroke="white" strokeWidth="0.3" fill="none" opacity="0.8">
          {/* Outer boundary */}
          <rect x="5" y="5" width="90" height={viewBoxHeight - 10} />
          
          {/* Center line */}
          <line x1="50" y1="5" x2="50" y2={viewBoxHeight - 5} />
          
          {/* Center circle */}
          <circle cx="50" cy={viewBoxHeight / 2} r="9" />
          <circle cx="50" cy={viewBoxHeight / 2} r="0.5" fill="white" />
          
          {/* Penalty areas */}
          {isFullField && (
            <>
              {/* Left penalty area */}
              <rect x="5" y={(viewBoxHeight - 30) / 2} width="16" height="30" />
              <rect x="5" y={(viewBoxHeight - 16) / 2} width="6" height="16" />
              <circle cx="16" cy={viewBoxHeight / 2} r="0.5" fill="white" />
              <path d={`M 21 ${viewBoxHeight / 2 - 8} A 9 9 0 0 1 21 ${viewBoxHeight / 2 + 8}`} />
              
              {/* Right penalty area */}
              <rect x="79" y={(viewBoxHeight - 30) / 2} width="16" height="30" />
              <rect x="89" y={(viewBoxHeight - 16) / 2} width="6" height="16" />
              <circle cx="84" cy={viewBoxHeight / 2} r="0.5" fill="white" />
              <path d={`M 79 ${viewBoxHeight / 2 - 8} A 9 9 0 0 0 79 ${viewBoxHeight / 2 + 8}`} />
            </>
          )}
          
          {/* Corner arcs */}
          <path d="M 5 7 A 2 2 0 0 0 7 5" />
          <path d={`M 93 5 A 2 2 0 0 0 95 7`} />
          <path d={`M 95 ${viewBoxHeight - 7} A 2 2 0 0 0 93 ${viewBoxHeight - 5}`} />
          <path d={`M 7 ${viewBoxHeight - 5} A 2 2 0 0 0 5 ${viewBoxHeight - 7}`} />
        </g>
      )}
      
      {/* Cone lines - render before cones */}
      {cone_lines.map((line, idx) => {
        const fromCone = cones[line.from_cone];
        const toCone = cones[line.to_cone];
        if (!fromCone || !toCone) return null;
        
        return (
          <line
            key={`cone-line-${idx}`}
            x1={fromCone.position.x}
            y1={viewBoxHeight - fromCone.position.y}
            x2={toCone.position.x}
            y2={viewBoxHeight - toCone.position.y}
            stroke="#f4a261"
            strokeWidth="0.5"
            opacity="0.8"
          />
        );
      })}
      
      {/* Movement arrows */}
      <defs>
        <marker
          id="arrowhead-run"
          markerWidth="4"
          markerHeight="3"
          refX="3"
          refY="1.5"
          orient="auto"
        >
          <polygon points="0 0, 4 1.5, 0 3" fill="#ffffff" />
        </marker>
        <marker
          id="arrowhead-pass"
          markerWidth="4"
          markerHeight="3"
          refX="3"
          refY="1.5"
          orient="auto"
        >
          <polygon points="0 0, 4 1.5, 0 3" fill="#fbbf24" />
        </marker>
        <marker
          id="arrowhead-shot"
          markerWidth="4"
          markerHeight="3"
          refX="3"
          refY="1.5"
          orient="auto"
        >
          <polygon points="0 0, 4 1.5, 0 3" fill="#ef4444" />
        </marker>
      </defs>
      
      {movements.map((movement, idx) => {
        const strokeColor = movement.type === 'pass' ? '#fbbf24' : movement.type === 'shot' ? '#ef4444' : '#ffffff';
        const dashArray = movement.type === 'dribble' ? '1,1' : undefined;
        const markerId = movement.type === 'pass' ? 'arrowhead-pass' : movement.type === 'shot' ? 'arrowhead-shot' : 'arrowhead-run';
        
        return (
          <line
            key={`movement-${idx}`}
            x1={movement.from.x}
            y1={viewBoxHeight - movement.from.y}
            x2={movement.to.x}
            y2={viewBoxHeight - movement.to.y}
            stroke={strokeColor}
            strokeWidth="0.4"
            strokeDasharray={dashArray}
            markerEnd={`url(#${markerId})`}
            opacity="0.9"
          />
        );
      })}
      
      {/* Goals */}
      {goals.map((goal, idx) => {
        const size = goal.size === 'small' ? 6 : 8;
        const depth = 2;
        const rotation = goal.rotation || 0;
        
        return (
          <g 
            key={`goal-${idx}`} 
            transform={`translate(${goal.position.x}, ${viewBoxHeight - goal.position.y}) rotate(${rotation})`}
          >
            {/* Goal frame */}
            <rect
              x={-size / 2}
              y={-depth / 2}
              width={size}
              height={depth}
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Goal net pattern */}
            <rect
              x={-size / 2}
              y={-depth / 2}
              width={size}
              height={depth}
              fill="white"
              opacity="0.2"
            />
          </g>
        );
      })}
      
      {/* Cones */}
      {cones.map((cone, idx) => (
        <g key={`cone-${idx}`} transform={`translate(${cone.position.x}, ${viewBoxHeight - cone.position.y})`}>
          <polygon
            points="0,-1.5 1,1 -1,1"
            fill={cone.color || '#f4a261'}
            stroke="#c07b3f"
            strokeWidth="0.2"
          />
        </g>
      ))}
      
      {/* Balls */}
      {balls.map((ball, idx) => {
        const ballId = `ball_${idx}`;
        const pos = getPosition(ballId, ball.position, animatedPositions);
        
        return (
          <circle
            key={ballId}
            cx={pos.x}
            cy={viewBoxHeight - pos.y}
            r="1.2"
            fill="white"
            stroke="black"
            strokeWidth="0.2"
          />
        );
      })}
      
      {/* Players */}
      {players.map((player) => {
        const pos = getPosition(player.id, player.position, animatedPositions);
        
        return (
          <g key={player.id} transform={`translate(${pos.x}, ${viewBoxHeight - pos.y})`}>
            <circle
              r="2.2"
              fill={getPlayerColor(player.role)}
              stroke="white"
              strokeWidth="0.3"
            />
            <text
              y="0.6"
              textAnchor="middle"
              fill="white"
              fontSize="1.8"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {player.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
