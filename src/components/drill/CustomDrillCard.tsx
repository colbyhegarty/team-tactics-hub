import { useNavigate } from 'react-router-dom';
import { CustomDrill, PLAYER_COLORS } from '@/types/customDrill';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface CustomDrillCardProps {
  drill: CustomDrill;
  onDelete: (id: string) => void;
  onView: (drill: CustomDrill) => void;
}

export function CustomDrillCard({ drill, onDelete, onView }: CustomDrillCardProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render mini diagram preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 8;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw field background
    const stripeCount = 6;
    const stripeHeight = (height - padding * 2) / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#6fbf4a' : '#63b043';
      ctx.fillRect(padding, padding + i * stripeHeight, width - padding * 2, stripeHeight);
    }

    // Draw field border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Convert field coords to canvas
    const toCanvas = (x: number, y: number) => ({
      x: padding + (x / 100) * (width - padding * 2),
      y: padding + ((100 - y) / 100) * (height - padding * 2),
    });

    // Draw cones
    drill.diagramData.cones.forEach((cone) => {
      const pos = toCanvas(cone.position.x, cone.position.y);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 4);
      ctx.lineTo(pos.x - 4, pos.y + 4);
      ctx.lineTo(pos.x + 4, pos.y + 4);
      ctx.closePath();
      ctx.fillStyle = '#f4a261';
      ctx.fill();
    });

    // Draw players
    drill.diagramData.players.forEach((player) => {
      const pos = toCanvas(player.position.x, player.position.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = PLAYER_COLORS[player.role];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw balls
    drill.diagramData.balls.forEach((ball) => {
      const pos = toCanvas(ball.position.x, ball.position.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
  }, [drill.diagramData]);

  const handleEdit = () => {
    navigate(`/?edit=${drill.id}`);
  };

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      {/* Diagram Preview */}
      <div className="relative aspect-[4/3] bg-field overflow-hidden">
        <canvas
          ref={canvasRef}
          width={200}
          height={150}
          className="w-full h-full object-contain"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onView(drill)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category badge */}
        {drill.formData.category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 text-primary-foreground text-xs rounded-full">
            {drill.formData.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {drill.formData.name || 'Untitled Drill'}
        </h3>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {drill.formData.difficulty && (
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                drill.formData.difficulty === 'EASY'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : drill.formData.difficulty === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-600'
              )}
            >
              {drill.formData.difficulty.charAt(0) + drill.formData.difficulty.slice(1).toLowerCase()}
            </span>
          )}
          {drill.formData.playerCount && (
            <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-full">
              👥 {drill.formData.playerCount}
            </span>
          )}
        </div>

        {drill.formData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {drill.formData.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {new Date(drill.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleEdit}>
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Drill</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{drill.formData.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(drill.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
