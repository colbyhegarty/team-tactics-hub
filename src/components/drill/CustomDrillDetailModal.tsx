import { CustomDrill, PLAYER_COLORS } from '@/types/customDrill';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CustomDrillDetailModalProps {
  drill: CustomDrill | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomDrillDetailModal({ drill, isOpen, onClose }: CustomDrillDetailModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render diagram
  useEffect(() => {
    if (!drill) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw field background
    const stripeCount = 10;
    const stripeHeight = (height - padding * 2) / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#6fbf4a' : '#63b043';
      ctx.fillRect(padding, padding + i * stripeHeight, width - padding * 2, stripeHeight);
    }

    // Draw field border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Convert field coords to canvas
    const toCanvas = (x: number, y: number) => ({
      x: padding + (x / 100) * (width - padding * 2),
      y: padding + ((100 - y) / 100) * (height - padding * 2),
    });

    // Draw cone lines
    drill.diagramData.coneLines.forEach((line) => {
      const fromCone = drill.diagramData.cones.find(c => c.id === line.fromConeId);
      const toCone = drill.diagramData.cones.find(c => c.id === line.toConeId);
      if (fromCone && toCone) {
        const from = toCanvas(fromCone.position.x, fromCone.position.y);
        const to = toCanvas(toCone.position.x, toCone.position.y);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = '#f4a261';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw goals
    drill.diagramData.goals.forEach((goal) => {
      const pos = toCanvas(goal.position.x, goal.position.y);
      const goalWidth = goal.size === 'full' ? 50 : 25;
      const goalDepth = goal.size === 'full' ? 12 : 6;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((goal.rotation * Math.PI) / 180);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-goalWidth / 2, 0);
      ctx.lineTo(-goalWidth / 2, -goalDepth);
      ctx.lineTo(goalWidth / 2, -goalDepth);
      ctx.lineTo(goalWidth / 2, 0);
      ctx.stroke();
      ctx.restore();
    });

    // Draw cones
    drill.diagramData.cones.forEach((cone) => {
      const pos = toCanvas(cone.position.x, cone.position.y);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 8);
      ctx.lineTo(pos.x - 8, pos.y + 8);
      ctx.lineTo(pos.x + 8, pos.y + 8);
      ctx.closePath();
      ctx.fillStyle = '#f4a261';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw balls
    drill.diagramData.balls.forEach((ball) => {
      const pos = toCanvas(ball.position.x, ball.position.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw players
    drill.diagramData.players.forEach((player) => {
      const pos = toCanvas(player.position.x, player.position.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = PLAYER_COLORS[player.role];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Player ID
      ctx.fillStyle = player.role === 'GOALKEEPER' ? '#000000' : '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.id, pos.x, pos.y);
    });

    // Draw actions
    drill.diagramData.actions.forEach((action) => {
      let fromPos: { x: number; y: number } | null = null;
      let toPos: { x: number; y: number } | null = null;

      if (action.type === 'PASS') {
        const fromPlayer = drill.diagramData.players.find(p => p.id === action.fromPlayerId);
        const toPlayer = drill.diagramData.players.find(p => p.id === action.toPlayerId);
        if (fromPlayer && toPlayer) {
          fromPos = toCanvas(fromPlayer.position.x, fromPlayer.position.y);
          toPos = toCanvas(toPlayer.position.x, toPlayer.position.y);
        }
      } else {
        const player = drill.diagramData.players.find(p => p.id === action.playerId);
        if (player) {
          fromPos = toCanvas(player.position.x, player.position.y);
          toPos = toCanvas(action.toPosition.x, action.toPosition.y);
        }
      }

      if (!fromPos || !toPos) return;

      const colors = {
        PASS: '#ffffff',
        RUN: '#facc15',
        DRIBBLE: '#ffffff',
        SHOT: '#ef4444',
      };

      ctx.strokeStyle = colors[action.type];
      ctx.lineWidth = 2;
      if (action.type === 'PASS' || action.type === 'DRIBBLE') {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
      ctx.beginPath();
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(toPos.x - 10 * Math.cos(angle - Math.PI / 6), toPos.y - 10 * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(toPos.x - 10 * Math.cos(angle + Math.PI / 6), toPos.y - 10 * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    });
  }, [drill]);

  if (!drill) return null;

  const { formData, diagramData } = drill;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{formData.name || 'Untitled Drill'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Diagram */}
            <div className="bg-field rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={450}
                className="w-full h-auto"
              />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {formData.category && (
                <Badge variant="secondary">{formData.category}</Badge>
              )}
              {formData.difficulty && (
                <Badge
                  className={cn(
                    formData.difficulty === 'EASY'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : formData.difficulty === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-red-500/10 text-red-600'
                  )}
                >
                  {formData.difficulty.charAt(0) + formData.difficulty.slice(1).toLowerCase()}
                </Badge>
              )}
              {formData.playerCount && (
                <Badge variant="outline">👥 {formData.playerCount}</Badge>
              )}
              {formData.duration && (
                <Badge variant="outline">⏱ {formData.duration}</Badge>
              )}
              {formData.ageGroup && (
                <Badge variant="outline">🎯 {formData.ageGroup}</Badge>
              )}
            </div>

            {/* Description */}
            {formData.description && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Overview</h4>
                <p className="text-muted-foreground">{formData.description}</p>
              </div>
            )}

            {/* Tabs for details */}
            <Tabs defaultValue="setup" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="coaching">Coaching</TabsTrigger>
                <TabsTrigger value="variations">Variations</TabsTrigger>
              </TabsList>
              <TabsContent value="setup" className="mt-4">
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {formData.setupText || 'No setup instructions provided.'}
                </div>
              </TabsContent>
              <TabsContent value="instructions" className="mt-4">
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {formData.instructionsText || 'No instructions provided.'}
                </div>
              </TabsContent>
              <TabsContent value="coaching" className="mt-4">
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {formData.coachingPointsText || 'No coaching points provided.'}
                </div>
              </TabsContent>
              <TabsContent value="variations" className="mt-4">
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {formData.variationsText || 'No variations provided.'}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
