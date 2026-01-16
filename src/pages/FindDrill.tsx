import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, Users, Clock, GraduationCap, Cone, Goal, Shirt, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import {
  fetchLibraryCategories,
  fetchFilteredDrills,
  fetchLibraryDrill,
  mapLibraryDrillToDrill,
  LibraryDrillMeta,
  CategoryItem,
} from '@/lib/api';
import { saveDrill, removeDrill, isDrillSaved } from '@/lib/storage';
import { Drill } from '@/types/drill';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const AGE_GROUPS = ['All', 'U8', 'U10', 'U12', 'U14', 'U16+'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const DURATIONS = [
  { value: 'any', label: 'Any Duration' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
];

interface FindDrillFormData {
  category: string;
  playerCount: string;
  ageGroup: string;
  difficulty: string;
  duration: string;
  focusArea: string;
  equipment: {
    cones: boolean;
    goals: boolean;
    miniGoals: boolean;
    mannequins: boolean;
    bibs: boolean;
  };
}

const initialFormData: FindDrillFormData = {
  category: 'none',
  playerCount: '',
  ageGroup: 'All',
  difficulty: 'All',
  duration: 'any',
  focusArea: '',
  equipment: {
    cones: false,
    goals: false,
    miniGoals: false,
    mannequins: false,
    bibs: false,
  },
};

export default function FindDrill() {
  const location = useLocation();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [formData, setFormData] = useState<FindDrillFormData>(initialFormData);
  const [results, setResults] = useState<Drill[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchLibraryCategories();
        if (res.success) {
          // Filter out empty/undefined categories
          const validCategories = res.categories.filter((cat) => cat.name && cat.name.trim() !== '');
          setCategories(validCategories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Pre-fill form from template if navigated with state
  useEffect(() => {
    if (location.state?.templateDrill) {
      const template = location.state.templateDrill;
      setFormData(prev => ({
        ...prev,
        category: template.category || '',
        playerCount: template.playerCount?.toString() || '',
        ageGroup: template.ageGroup || 'All',
        duration: template.duration?.toString() || '',
      }));
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const filters: Record<string, any> = {};
      
      if (formData.category && formData.category !== 'All' && formData.category !== 'none') {
        filters.category = formData.category;
      }
      if (formData.ageGroup && formData.ageGroup !== 'All') {
        filters.age_group = formData.ageGroup;
      }
      if (formData.difficulty && formData.difficulty !== 'All') {
        filters.difficulty = formData.difficulty;
      }
      if (formData.duration && formData.duration !== 'any') {
        filters.duration = parseInt(formData.duration);
      }
      if (formData.playerCount) {
        // For player count, use max_players as the user's available players
        // This allows drills with "9+" to match when user has 15 players
        filters.max_players = parseInt(formData.playerCount);
      }
      if (formData.focusArea) {
        filters.search = formData.focusArea;
      }

      const response = await fetchFilteredDrills(filters);
      
      if (response.success) {
        const drills = response.drills.map(meta => mapLibraryDrillToDrill(meta));
        setResults(drills);
        
        if (drills.length === 0) {
          toast({
            title: 'No exact matches',
            description: 'Try adjusting your criteria for more results.',
          });
        } else {
          toast({
            title: 'Drills Found!',
            description: `Found ${drills.length} matching drills.`,
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Search Failed',
        description: 'Unable to search drills. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDrill = async (drill: Drill) => {
    setIsLoadingDrill(true);
    
    try {
      const response = await fetchLibraryDrill(drill.id);
      
      if (response.success) {
        const fullDrill = mapLibraryDrillToDrill(
          { 
            id: response.drill.id, 
            name: response.drill.name, 
            category: response.drill.category,
            player_count: response.drill.player_count,
            duration: response.drill.duration,
            age_group: response.drill.age_group,
            difficulty: response.drill.difficulty,
          },
          response.drill,
          response.svg
        );
        setSelectedDrill(fullDrill);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load drill details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDrill(false);
    }
  };

  const handleSaveDrill = (drill: Drill) => {
    const currentlySaved = savedState[drill.id] ?? isDrillSaved(drill.id);
    
    if (currentlySaved) {
      removeDrill(drill.id);
      setSavedState(prev => ({ ...prev, [drill.id]: false }));
      toast({ title: 'Drill Removed', description: 'Removed from your saved drills.' });
    } else {
      saveDrill(drill);
      setSavedState(prev => ({ ...prev, [drill.id]: true }));
      toast({ title: 'Drill Saved', description: 'Added to your saved drills.' });
    }
  };

  const isDrillCurrentlySaved = (drillId: string) => {
    return savedState[drillId] ?? isDrillSaved(drillId);
  };

  const updateFormData = (field: keyof FindDrillFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateEquipment = (key: keyof FindDrillFormData['equipment'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [key]: checked }
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Search className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">DrillForge</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl py-6 px-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Find a Drill</h1>
          <p className="mt-1 text-muted-foreground">
            Tell us what you need and we'll find the perfect drill
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-section">
            <div className="form-section-title">
              <Sparkles className="h-4 w-4" />
              Drill Requirements
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateFormData('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category...</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Player Count */}
              <div className="space-y-2">
                <Label htmlFor="playerCount" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Number of Players
                </Label>
                <Input
                  id="playerCount"
                  type="number"
                  min={1}
                  max={30}
                  placeholder="e.g., 12"
                  value={formData.playerCount}
                  onChange={(e) => updateFormData('playerCount', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Drills with flexible player counts (like "9+") will be included
                </p>
              </div>

              {/* Age Group */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Age Group
                </Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(value) => updateFormData('ageGroup', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map(age => (
                      <SelectItem key={age} value={age}>
                        {age === 'All' ? 'Any Age Group' : age}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Session Duration
                </Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => updateFormData('duration', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(dur => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => updateFormData('difficulty', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(diff => (
                      <SelectItem key={diff} value={diff}>
                        {diff === 'All' ? 'Any Difficulty' : diff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Focus Area */}
              <div className="space-y-2">
                <Label htmlFor="focusArea">Focus Area (Optional)</Label>
                <Input
                  id="focusArea"
                  placeholder="e.g., quick passing, first touch"
                  value={formData.focusArea}
                  onChange={(e) => updateFormData('focusArea', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="form-section">
            <div className="form-section-title">
              <Cone className="h-4 w-4" />
              Available Equipment
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.equipment.cones}
                  onCheckedChange={(checked) => updateEquipment('cones', !!checked)}
                />
                <span className="text-sm">Cones</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.equipment.goals}
                  onCheckedChange={(checked) => updateEquipment('goals', !!checked)}
                />
                <span className="text-sm">Full Goals</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.equipment.miniGoals}
                  onCheckedChange={(checked) => updateEquipment('miniGoals', !!checked)}
                />
                <span className="text-sm">Mini Goals</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.equipment.mannequins}
                  onCheckedChange={(checked) => updateEquipment('mannequins', !!checked)}
                />
                <span className="text-sm">Mannequins</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.equipment.bibs}
                  onCheckedChange={(checked) => updateEquipment('bibs', !!checked)}
                />
                <span className="text-sm">Bibs</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading || !formData.category || formData.category === 'none'}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Find Drills
              </>
            )}
          </Button>
        </form>

        {/* Results */}
        {hasSearched && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">
              {results.length > 0 ? `${results.length} Matching Drills` : 'No Drills Found'}
            </h2>

            {results.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No exact matches</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Try adjusting your criteria. You might want to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Select a different category</li>
                  <li>• Adjust the player count</li>
                  <li>• Try a different age group</li>
                </ul>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(drill => (
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
        )}
      </div>

      {/* Loading overlay */}
      {isLoadingDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading drill details...</p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <DrillDetailModal
        drill={selectedDrill}
        isOpen={selectedDrill !== null}
        onClose={() => setSelectedDrill(null)}
        isSaved={selectedDrill ? isDrillCurrentlySaved(selectedDrill.id) : false}
        onSave={handleSaveDrill}
      />
    </div>
  );
}
