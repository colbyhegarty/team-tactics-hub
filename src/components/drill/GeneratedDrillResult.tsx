import { useState } from 'react';
import { Download, Bookmark, BookmarkCheck, RefreshCw, Maximize2, X, Edit, Clock, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { GenerateDrillResponse } from '@/types/drill';

interface GeneratedDrillResultProps {
  result: GenerateDrillResponse;
  isSaved: boolean;
  onSave: () => void;
  onGenerateAnother: () => void;
  onModify: () => void;
}

export function GeneratedDrillResult({
  result,
  isSaved,
  onSave,
  onGenerateAnother,
  onModify,
}: GeneratedDrillResultProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownloadSvg = () => {
    if (!result.svg) return;
    
    const svgContent = atob(result.svg);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.drill_name.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseDescription = (desc: string) => {
    const sections: Record<string, string> = {};
    const lines = desc.split('\n');
    let currentSection = 'overview';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentContent.length) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.replace('## ', '').toLowerCase();
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

  const sections = parseDescription(result.description);
  const drillJson = result.drill_json || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Drill Name */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          {result.drill_name}
        </h2>
      </div>

      {/* Quick Info Bar */}
      <div className="flex flex-wrap justify-center gap-2">
        {drillJson.num_players && (
          <span className="badge-pill badge-primary">
            <Users className="h-3 w-3" />
            {drillJson.num_players as number} players
          </span>
        )}
        {drillJson.duration && (
          <span className="badge-pill badge-muted">
            <Clock className="h-3 w-3" />
            {drillJson.duration as number} min
          </span>
        )}
        {drillJson.intensity && (
          <span className={cn(
            'badge-pill',
            drillJson.intensity === 'High' ? 'bg-destructive/10 text-destructive' :
            drillJson.intensity === 'Medium' ? 'bg-accent/20 text-accent-foreground' :
            'badge-muted'
          )}>
            <Zap className="h-3 w-3" />
            {drillJson.intensity as string}
          </span>
        )}
        {drillJson.category && (
          <span className="badge-pill bg-primary/10 text-primary">
            {drillJson.category as string}
          </span>
        )}
      </div>

      {/* Diagram Section */}
      <div className="form-section">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-field/5 border border-border">
          {result.svg ? (
            <img
              src={`data:image/svg+xml;base64,${result.svg}`}
              alt={result.drill_name}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No diagram available</p>
            </div>
          )}
        </div>

        {result.svg && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleDownloadSvg}>
              <Download className="h-4 w-4" />
              Download Diagram
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </Button>
          </div>
        )}
      </div>

      {/* Description Tabs */}
      <div className="form-section">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {sections.overview && <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>}
            {sections.setup && <TabsTrigger value="setup" className="text-xs">Setup</TabsTrigger>}
            {sections.instructions && <TabsTrigger value="instructions" className="text-xs">Instructions</TabsTrigger>}
            {sections['coaching points'] && <TabsTrigger value="coaching" className="text-xs">Coaching</TabsTrigger>}
            {(sections.progressions || sections['progressions/variations']) && (
              <TabsTrigger value="progressions" className="text-xs">Progressions</TabsTrigger>
            )}
          </TabsList>
          
          {Object.entries(sections).map(([key, content]) => (
            <TabsContent 
              key={key} 
              value={key === 'coaching points' ? 'coaching' : key === 'progressions/variations' ? 'progressions' : key} 
              className="mt-4"
            >
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0">{content}</pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={isSaved ? 'secondary' : 'hero'}
          size="lg"
          onClick={onSave}
          className="flex-1 min-w-[140px]"
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-5 w-5" />
              Saved!
            </>
          ) : (
            <>
              <Bookmark className="h-5 w-5" />
              Save to My Drills
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={onModify}
          className="flex-1 min-w-[140px]"
        >
          <Edit className="h-5 w-5" />
          Modify
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={onGenerateAnother}
          className="flex-1 min-w-[140px]"
        >
          <RefreshCw className="h-5 w-5" />
          Generate Another
        </Button>
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm border border-border"
          >
            <X className="h-5 w-5" />
          </button>
          {result.svg && (
            <img
              src={`data:image/svg+xml;base64,${result.svg}`}
              alt={result.drill_name}
              className="h-full w-full object-contain p-8"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
