import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { DrillForm } from '@/components/drill/DrillForm';
import { GeneratedDrillResult } from '@/components/drill/GeneratedDrillResult';
import { DrillFormData, GenerateDrillResponse, Drill } from '@/types/drill';
import { generateDrill } from '@/lib/api';
import { saveDrill, isDrillSaved } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export default function GenerateDrill() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateDrillResponse | null>(null);
  const [lastFormData, setLastFormData] = useState<Partial<DrillFormData>>({});
  const [savedDrillId, setSavedDrillId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (data: DrillFormData) => {
    setIsLoading(true);
    setLastFormData(data);
    setResult(null);
    setSavedDrillId(null);

    try {
      const response = await generateDrill(data);
      setResult(response);
      
      toast({
        title: 'Drill Generated!',
        description: `"${response.drill_name}" is ready to use.`,
      });
    } catch (error) {
      console.error('Failed to generate drill:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;

    const drill: Drill = {
      id: `generated-${Date.now()}`,
      name: result.drill_name,
      category: lastFormData.drillType || 'Other',
      description: result.description.split('\n')[0].replace(/^#+\s*/, ''),
      playerCount: lastFormData.totalPlayers || 10,
      duration: lastFormData.duration || 15,
      intensity: lastFormData.intensity || 'Medium',
      svg: result.svg,
      fullDescription: result.description,
      drillJson: result.drill_json,
    };

    saveDrill(drill);
    setSavedDrillId(drill.id);

    toast({
      title: 'Drill Saved',
      description: 'Added to your saved drills.',
    });
  };

  const handleGenerateAnother = () => {
    setResult(null);
    setLastFormData({});
    setSavedDrillId(null);
  };

  const handleModify = () => {
    setResult(null);
    // Keep lastFormData so form is prefilled
  };

  const isSaved = savedDrillId !== null || (result && isDrillSaved(`generated-${result.drill_name}`));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">DrillForge</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-6 px-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Generate Drill</h1>
          <p className="mt-1 text-muted-foreground">
            Create custom training drills powered by AI
          </p>
        </div>

        {/* Content */}
        {result ? (
          <GeneratedDrillResult
            result={result}
            isSaved={!!isSaved}
            onSave={handleSave}
            onGenerateAnother={handleGenerateAnother}
            onModify={handleModify}
          />
        ) : (
          <DrillForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            initialData={lastFormData}
          />
        )}
      </div>
    </div>
  );
}
