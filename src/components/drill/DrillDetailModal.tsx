import { X, Download, Bookmark, BookmarkCheck, Clock, Users, Zap, Maximize2, Sparkles, GraduationCap, ExternalLink } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';

interface DrillDetailModalProps {
  drill: Drill | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onSave: (drill: Drill) => void;
  onUseAsTemplate?: (drill: Drill) => void;
}

export function DrillDetailModal({
  drill,
  isOpen,
  onClose,
  isSaved,
  onSave,
  onUseAsTemplate,
}: DrillDetailModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!drill) return null;

  const handleDownloadSvg = () => {
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

  const parseDescription = (desc?: string) => {
    if (!desc) return null;
    
    const sections: Record<string, string> = {};
    const lines = desc.split('\n');
    let currentSection = 'overview';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('# ')) {
        if (currentContent.length) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.replace(/^#+\s*/, '').toLowerCase();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    if (currentContent.length) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  };

  // Build sections from drill data - prioritize structured fields, fallback to parsed description
  const buildSections = () => {
    const sections: Record<string, string> = {};
    
    // Check for structured drill data first (from library API)
    if (drill.setup) sections.setup = drill.setup;
    if (drill.instructions) sections.instructions = drill.instructions;
    if (drill.coachingPoints) sections['coaching points'] = drill.coachingPoints;
    if (drill.variations) sections.progressions = drill.variations;
    
    // If we have structured data, return it
    if (Object.keys(sections).length > 0) {
      // Add overview from description if available
      if (drill.description) sections.overview = drill.description;
      return sections;
    }
    
    // Otherwise, parse from fullDescription markdown
    return parseDescription(drill.fullDescription);
  };

  const sections = buildSections();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold pr-8">{drill.name}</DialogTitle>
          </DialogHeader>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap gap-2 py-2">
            <span className={cn('badge-pill font-medium', getCategoryColor(drill.category))}>
              {drill.category}
            </span>
            {drill.difficulty && (
              <span className={cn('badge-pill font-medium', getDifficultyColor(drill.difficulty))}>
                {drill.difficulty}
              </span>
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

          {/* Diagram */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-field/10 border border-border">
            {drill.svg ? (
              <img
                src={`data:image/svg+xml;base64,${drill.svg}`}
                alt={drill.name}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No diagram available</p>
              </div>
            )}
            
            {drill.svg && (
              <div className="absolute bottom-2 right-2 flex gap-2">
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

          {/* Description Tabs */}
          {sections && Object.keys(sections).length > 0 ? (
            <Tabs defaultValue={sections.overview ? "overview" : sections.setup ? "setup" : "instructions"} className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                {sections.overview && <TabsTrigger value="overview">Overview</TabsTrigger>}
                {sections.setup && <TabsTrigger value="setup">Setup</TabsTrigger>}
                {sections.instructions && <TabsTrigger value="instructions">Instructions</TabsTrigger>}
                {sections['coaching points'] && <TabsTrigger value="coaching">Coaching Points</TabsTrigger>}
                {sections.progressions && <TabsTrigger value="progressions">Progressions</TabsTrigger>}
              </TabsList>
              
              {sections.overview && (
                <TabsContent value="overview" className="mt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0">{sections.overview}</pre>
                  </div>
                </TabsContent>
              )}
              {sections.setup && (
                <TabsContent value="setup" className="mt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0">{sections.setup}</pre>
                  </div>
                </TabsContent>
              )}
              {sections.instructions && (
                <TabsContent value="instructions" className="mt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0">{sections.instructions}</pre>
                  </div>
                </TabsContent>
              )}
              {sections['coaching points'] && (
                <TabsContent value="coaching" className="mt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0">{sections['coaching points']}</pre>
                  </div>
                </TabsContent>
              )}
              {sections.progressions && (
                <TabsContent value="progressions" className="mt-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0">{sections.progressions}</pre>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">{drill.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4 border-t border-border">
            {/* Source Attribution */}
            {drill.source && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Source: {drill.source}
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>
          {drill.svg && (
            <img
              src={`data:image/svg+xml;base64,${drill.svg}`}
              alt={drill.name}
              className="h-full w-full object-contain p-8"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
