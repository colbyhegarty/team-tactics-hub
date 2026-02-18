import { X, Download, Bookmark, BookmarkCheck, Clock, Users, Maximize2, Minimize2, Sparkles, GraduationCap, Image, Film } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, ReactNode } from 'react';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';

const RENDER_API_URL = 'https://soccer-drill-api.onrender.com';

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
    if (trimmed.includes('drill equipment') || trimmed.includes('drill ages') ||
        trimmed.includes('drill topic') || trimmed.includes('soccer drill titled') ||
        trimmed.includes('created by') || trimmed.includes('soccerxpert') ||
        trimmed.includes('subscribe') || trimmed.includes('privacy policy') ||
        trimmed.includes('copyright') || trimmed.startsWith('equipment')) {
      continue;
    }
    if (trimmed.length > 0) filteredLines.push(line);
  }
  return filteredLines.join('\n').trim() || undefined;
};

// Helper function to format drill text with bullets
const formatDrillText = (text?: string): ReactNode => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-');
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s*(.+)/);
    if (isBullet) {
      listItems.push(<li key={index}>{trimmed.replace(/^[•*-]\s*/, '')}</li>);
      return;
    }
    if (numberedMatch) {
      listItems.push(<li key={index}>{numberedMatch[2]}</li>);
      return;
    }
    flushList();
    elements.push(<p key={index} className="mb-2 leading-relaxed">{trimmed}</p>);
  });

  flushList();
  return elements.length > 0 ? elements : null;
};

type SectionId = 'overview' | 'setup' | 'instructions' | 'coaching' | 'variations';

export function DrillDetailModal({
  drill,
  isOpen,
  onClose,
  isSaved,
  onSave,
  onUseAsTemplate,
}: DrillDetailModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'static' | 'animated'>('static');
  const [activeSection, setActiveSection] = useState<SectionId | null>('overview');

  const hasAnimation = drill?.hasAnimation;

  if (!isOpen || !drill) return null;

  const handleDownloadSvg = async () => {
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

  const filteredCoachingPoints = filterCoachingPoints(drill.coachingPoints);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center animate-fadeIn',
        isFullscreen ? 'p-0' : 'p-4'
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Container — single scroll context */}
      <div
        className={cn(
          'relative bg-card flex flex-col overflow-hidden shadow-2xl animate-scaleIn',
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-4xl max-h-[90vh] rounded-2xl'
        )}
      >
        {/* ── Fixed Header ── */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {drill.name}
              </h2>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className={cn('badge-pill text-xs font-medium', getCategoryColor(drill.category))}>
                  {drill.category}
                </span>
                {drill.difficulty && (
                  <span className={cn('badge-pill text-xs font-medium', getDifficultyColor(drill.difficulty))}>
                    {drill.difficulty}
                  </span>
                )}
                {hasAnimation && (
                  <span className="badge-pill bg-accent/20 text-accent-foreground text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Animated
                  </span>
                )}
                {drill.playerCount && (
                  <span className="badge-pill badge-muted text-xs">
                    <Users className="h-3 w-3" />
                    {drill.playerCountDisplay || drill.playerCount}
                  </span>
                )}
                {drill.duration && (
                  <span className="badge-pill badge-muted text-xs">
                    <Clock className="h-3 w-3" />
                    {drill.duration} min
                  </span>
                )}
                {drill.ageGroup && (
                  <span className="badge-pill badge-muted text-xs">
                    <GraduationCap className="h-3 w-3" />
                    {drill.ageGroup}
                  </span>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable Content — single scroll area ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Diagram Section */}
          <div className="p-4">
            {/* View Toggle */}
            {hasAnimation && (
              <div className="flex justify-center mb-4">
                <div className="inline-flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('static')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                      viewMode === 'static'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Image className="h-4 w-4" />
                    Static
                  </button>
                  <button
                    onClick={() => setViewMode('animated')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                      viewMode === 'animated'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Film className="h-4 w-4" />
                    Animated
                  </button>
                </div>
              </div>
            )}

            {/* Diagram Container */}
            <div className="bg-[#2d4a2d] rounded-xl overflow-hidden">
              {hasAnimation && viewMode === 'animated' ? (
                <div className="aspect-[4/3]">
                  <iframe
                    src={`${RENDER_API_URL}/api/animation/${drill.id}`}
                    className="w-full h-full border-0"
                    title={`${drill.name} Animation`}
                    allow="fullscreen"
                  />
                </div>
              ) : drill.svgUrl ? (
                <div className="aspect-[4/3] flex items-center justify-center p-4">
                  <img
                    src={drill.svgUrl}
                    alt={drill.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : drill.svg ? (
                <div className="aspect-[4/3] flex items-center justify-center p-4">
                  <img
                    src={`data:image/svg+xml;base64,${drill.svg}`}
                    alt={drill.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-field-lines/60">
                  <p>No diagram available</p>
                </div>
              )}
            </div>

            {/* Quick Actions below diagram */}
            <div className="flex justify-end gap-2 mt-3">
              {(drill.svgUrl || drill.svg) && (
                <Button variant="ghost" size="sm" onClick={handleDownloadSvg}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>

          {/* ── Section Toggle Row ── */}
          <div className="px-4 pb-6">
            {(() => {
              const sections: { id: SectionId; label: string; icon: string; content: ReactNode }[] = [];
              if (drill.description) sections.push({ id: 'overview', label: 'Overview', icon: '📋', content: <p className="leading-relaxed">{drill.description}</p> });
              if (drill.setup) sections.push({ id: 'setup', label: 'Setup', icon: '⚙️', content: formatDrillText(drill.setup) });
              if (drill.instructions) sections.push({ id: 'instructions', label: 'Instructions', icon: '📝', content: formatDrillText(drill.instructions) });
              if (filteredCoachingPoints) sections.push({ id: 'coaching', label: 'Coaching Points', icon: '💡', content: formatDrillText(filteredCoachingPoints) });
              if (drill.variations) sections.push({ id: 'variations', label: 'Variations', icon: '🔄', content: formatDrillText(drill.variations) });

              if (sections.length === 0) return null;

              const active = sections.find(s => s.id === activeSection) || sections[0];

              return (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sections.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                          active.id === s.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        )}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {active.content}
                  </div>
                </>
              );
            })()}
          </div>

          {/* ── Actions Footer ── */}
          <div className="px-4 pb-6 pt-2 border-t border-border flex flex-wrap gap-3">
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
      </div>
    </div>
  );
}
