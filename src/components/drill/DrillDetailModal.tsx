import { X, Download, Bookmark, BookmarkCheck, Clock, Users, Maximize2, Sparkles, GraduationCap, ClipboardList, Play, RefreshCw, Lightbulb, Image, Film } from 'lucide-react';
import DrillAnimationPlayer from '@/components/drill/DrillAnimationPlayer';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useState, ReactNode } from 'react';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';



interface DrillDetailModalProps {
  drill: Drill | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onSave: (drill: Drill) => void;
  onUseAsTemplate?: (drill: Drill) => void;
}

// Helper function to filter out equipment section and footer content from coaching points
const filterCoachingPoints = (text?: string): string | undefined => {
  if (!text) return undefined;
  
  const lines = text.split('\n');
  const filteredLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    // Stop including content once we hit footer/equipment content
    if (trimmed.includes('drill equipment') || 
        trimmed.includes('drill ages') ||
        trimmed.includes('drill topic') ||
        trimmed.includes('soccer drill titled') ||
        trimmed.includes('created by') ||
        trimmed.includes('soccerxpert') ||
        trimmed.includes('subscribe') ||
        trimmed.includes('privacy policy') ||
        trimmed.includes('copyright') ||
        trimmed.startsWith('equipment')) {
      continue; // Skip this line
    }
    if (trimmed.length > 0) {
      filteredLines.push(line);
    }
  }
  
  return filteredLines.join('\n').trim() || undefined;
};

// Helper function to format drill text with bullets (always bullet points, not numbered)
const formatDrillText = (text?: string, useBullets: boolean = true): ReactNode => {
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
    if (!trimmed) {
      flushList();
      return;
    }
    
    // Check if it's a bullet point or numbered item - treat both as bullets
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-');
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s*(.+)/);
    
    if (isBullet) {
      listItems.push(
        <li key={index} className="text-foreground">
          {trimmed.replace(/^[•*-]\s*/, '')}
        </li>
      );
      return;
    }
    
    if (numberedMatch) {
      // Convert numbered items to bullet points
      listItems.push(
        <li key={index} className="text-foreground">
          {numberedMatch[2]}
        </li>
      );
      return;
    }
    
    // Regular paragraph
    flushList();
    elements.push(
      <p key={index} className="mb-3 text-foreground leading-relaxed">{trimmed}</p>
    );
  });
  
  flushList();
  return elements.length > 0 ? elements : null;
};

export function DrillDetailModal({
  drill,
  isOpen,
  onClose,
  isSaved,
  onSave,
  onUseAsTemplate,
}: DrillDetailModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'static' | 'animated'>('animated');
  
  const hasAnimation = drill?.hasAnimation;

  if (!drill) return null;

  const handleDownloadSvg = async () => {
    // Try URL-based download first
    if (drill.svgUrl) {
      try {
        const response = await fetch(drill.svgUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${drill.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (e) {
        console.error('Failed to download SVG:', e);
      }
    }
    
    // Fall back to base64
    if (!drill.svg) return;
    
    const svgContent = atob(drill.svg);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drill.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get available tabs based on content
  const hasSetup = !!drill.setup;
  const hasInstructions = !!drill.instructions;
  const hasVariations = !!drill.variations;
  const hasCoachingPoints = !!drill.coachingPoints;
  
  const defaultTab = hasSetup ? 'setup' : hasInstructions ? 'instructions' : hasVariations ? 'variations' : 'coaching';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl p-0 max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="p-6">
            {/* Header Section */}
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {drill.name}
              </DialogTitle>
            </DialogHeader>

            {/* Badges Bar */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={cn('badge-pill font-medium', getCategoryColor(drill.category))}>
                {drill.category}
              </span>
              {drill.difficulty && (
                <span className={cn('badge-pill font-medium', getDifficultyColor(drill.difficulty))}>
                  {drill.difficulty}
                </span>
              )}
              {drill.hasAnimation && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  Animated
                </Badge>
              )}
              <span className="badge-pill badge-muted">
                <Users className="h-3 w-3" />
                {drill.playerCountDisplay || drill.playerCount} players
              </span>
              <span className="badge-pill badge-muted">
                <Clock className="h-3 w-3" />
                {drill.duration} min
              </span>
              {drill.ageGroup && (
                <span className="badge-pill badge-muted">
                  <GraduationCap className="h-3 w-3" />
                  {drill.ageGroup}
                </span>
              )}
            </div>

            {/* Diagram Section */}
            <div className="relative bg-card rounded-xl shadow-md border border-border p-4 mb-6">
              {/* View Toggle - only show if animation is available */}
              {hasAnimation && (
                <div className="flex justify-center mb-4">
                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value) => value && setViewMode(value as 'static' | 'animated')}
                    className="bg-muted p-1 rounded-lg"
                  >
                    <ToggleGroupItem 
                      value="static" 
                      aria-label="Static View"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-4 py-2 rounded-md"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Static
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="animated" 
                      aria-label="Animated View"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-4 py-2 rounded-md"
                    >
                      <Film className="h-4 w-4 mr-2" />
                      Animated
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
              
              {/* Diagram Content */}
              {hasAnimation && viewMode === 'animated' && drill.animationJson ? (
                <DrillAnimationPlayer
                  drill={{
                    name: drill.name,
                    field: drill.drillJson?.field,
                    players: drill.drillJson?.players?.map(p => ({ ...p, role: p.role as string })),
                    cones: drill.drillJson?.cones,
                    cone_lines: drill.drillJson?.cone_lines,
                    balls: drill.drillJson?.balls,
                    goals: drill.drillJson?.goals,
                    mini_goals: drill.drillJson?.mini_goals,
                  }}
                  animation={drill.animationJson}
                />
              ) : drill.svgUrl ? (
                <div className="bg-field rounded-xl overflow-hidden">
                  <img
                    src={drill.svgUrl}
                    alt={drill.name}
                    className="w-full max-h-96 object-contain mx-auto p-2"
                    style={{ background: 'transparent' }}
                  />
                </div>
              ) : drill.svg ? (
                <div className="bg-field rounded-xl overflow-hidden">
                  <img
                    src={`data:image/svg+xml;base64,${drill.svg}`}
                    alt={drill.name}
                    className="w-full max-h-96 object-contain mx-auto p-2"
                    style={{ background: 'transparent' }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <p>No diagram available</p>
                </div>
              )}

              {(drill.svgUrl || drill.svg) && viewMode === 'static' && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadSvg}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Description/Overview Section */}
            {drill.description && (
              <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/10">
                <h2 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                  <span className="text-primary">📋</span> Overview
                </h2>
                <p className="text-muted-foreground leading-relaxed">{drill.description}</p>
              </div>
            )}

            {/* Tabbed Content Section */}
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
                    <div className="prose prose-sm max-w-none">
                      {formatDrillText(drill.setup)}
                    </div>
                  </TabsContent>
                )}
                
                {hasInstructions && (
                  <TabsContent value="instructions" className="bg-card rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">
                      {formatDrillText(drill.instructions)}
                    </div>
                  </TabsContent>
                )}
                
                {hasVariations && (
                  <TabsContent value="variations" className="bg-secondary/30 rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">
                      {formatDrillText(drill.variations)}
                    </div>
                  </TabsContent>
                )}
                
                {hasCoachingPoints && (
                  <TabsContent value="coaching" className="bg-accent/30 rounded-xl p-4 mt-4 border border-border">
                    <div className="prose prose-sm max-w-none">
                      {formatDrillText(filterCoachingPoints(drill.coachingPoints))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}

            {/* Actions Footer */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-border mt-6">
              <Button
                variant={isSaved ? 'secondary' : 'default'}
                onClick={() => onSave(drill)}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Save to My Drills
                  </>
                )}
              </Button>
              
              {onUseAsTemplate && (
                <Button variant="outline" onClick={() => onUseAsTemplate(drill)}>
                  <Sparkles className="h-4 w-4" />
                  Use as Template
                </Button>
              )}
              
              <Button variant="ghost" onClick={onClose}>
                Back to Library
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
          {drill.svgUrl ? (
            <img
              src={drill.svgUrl}
              alt={drill.name}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          ) : drill.svg && (
            <img
              src={`data:image/svg+xml;base64,${drill.svg}`}
              alt={drill.name}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}