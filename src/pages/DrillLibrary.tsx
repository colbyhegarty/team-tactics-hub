import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { drillLibrary, categories } from '@/lib/drillLibrary';
import { saveDrill, removeDrill, isDrillSaved } from '@/lib/storage';
import { Drill, DrillCategory } from '@/types/drill';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function DrillLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<DrillCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredDrills = drillLibrary.filter(drill => {
    const matchesCategory = selectedCategory === 'All' || drill.category === selectedCategory;
    const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleViewDrill = (drill: Drill) => {
    setSelectedDrill(drill);
  };

  const handleSaveDrill = (drill: Drill) => {
    const currentlySaved = savedState[drill.id] ?? isDrillSaved(drill.id);
    
    if (currentlySaved) {
      removeDrill(drill.id);
      setSavedState(prev => ({ ...prev, [drill.id]: false }));
      toast({
        title: 'Drill Removed',
        description: 'Removed from your saved drills.',
      });
    } else {
      saveDrill(drill);
      setSavedState(prev => ({ ...prev, [drill.id]: true }));
      toast({
        title: 'Drill Saved',
        description: 'Added to your saved drills.',
      });
    }
  };

  const handleUseAsTemplate = (drill: Drill) => {
    setSelectedDrill(null);
    navigate('/', { 
      state: { 
        templateDrill: {
          drillType: drill.category,
          description: drill.description,
          totalPlayers: drill.playerCount,
          duration: drill.duration,
          intensity: drill.intensity,
        }
      }
    });
  };

  const isDrillCurrentlySaved = (drillId: string) => {
    return savedState[drillId] ?? isDrillSaved(drillId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Drill Library</h1>
          <p className="mt-1 text-muted-foreground">
            Browse pre-made drills organized by category
          </p>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={selectedCategory === 'All' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory('All')}
              className="shrink-0"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Drill Grid */}
      <div className="container py-6 px-4">
        {filteredDrills.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No drills found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDrills.map(drill => (
              <DrillCard
                key={drill.id}
                drill={drill}
                isSaved={isDrillCurrentlySaved(drill.id)}
                onView={handleViewDrill}
                onSave={handleSaveDrill}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drill Detail Modal */}
      <DrillDetailModal
        drill={selectedDrill}
        isOpen={selectedDrill !== null}
        onClose={() => setSelectedDrill(null)}
        isSaved={selectedDrill ? isDrillCurrentlySaved(selectedDrill.id) : false}
        onSave={handleSaveDrill}
        onUseAsTemplate={handleUseAsTemplate}
      />
    </div>
  );
}
