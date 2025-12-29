import { useState } from 'react';
import { ChevronDown, ChevronUp, Target, Users, Settings, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DrillFormData, DrillCategory, AgeGroup, SkillLevel, FieldSize, IntensityLevel } from '@/types/drill';
import { getUserProfile } from '@/lib/storage';
import { cn } from '@/lib/utils';

const drillCategories: DrillCategory[] = [
  'Finishing',
  'Passing & Possession',
  'Defensive Shape',
  'Pressing & Transitions',
  'Crossing & Wide Play',
  'Set Pieces',
  'Conditioning',
  'Warm-up',
  'Cool-down',
  'Technical Skills',
  '1v1 Situations',
  'Small-Sided Games',
  'Other',
];

const ageGroups: AgeGroup[] = [
  'U8',
  'U10',
  'U12',
  'U14',
  'U16',
  'U18',
  'College',
  'Semi-Pro',
  'Professional',
  'Recreational Adult',
  'Not Specified',
];

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Not Specified'];

const fieldSizes: FieldSize[] = [
  'Full Field',
  'Half Field',
  'Third of Field',
  'Penalty Box Area',
  'Small Grid (10x10 to 20x20)',
  'Medium Grid (20x20 to 40x40)',
  'Any/Flexible',
];

const intensityLevels: IntensityLevel[] = ['Low', 'Medium', 'High', 'Variable', 'Not Specified'];

interface DrillFormProps {
  onSubmit: (data: DrillFormData) => void;
  isLoading: boolean;
  initialData?: Partial<DrillFormData>;
}

export function DrillForm({ onSubmit, isLoading, initialData }: DrillFormProps) {
  const profile = getUserProfile();
  
  const [formData, setFormData] = useState<DrillFormData>({
    drillType: initialData?.drillType || 'Passing & Possession',
    description: initialData?.description || '',
    totalPlayers: initialData?.totalPlayers || profile.defaultPlayerCount || 12,
    fieldPlayers: initialData?.fieldPlayers,
    goalkeepers: initialData?.goalkeepers || 0,
    hasGoals: initialData?.hasGoals || false,
    goalCount: initialData?.goalCount || 1,
    hasCones: initialData?.hasCones ?? true,
    hasMannequins: initialData?.hasMannequins || false,
    hasBibs: initialData?.hasBibs ?? true,
    ballCount: initialData?.ballCount || 'Multiple',
    fieldSize: initialData?.fieldSize || 'Any/Flexible',
    ageGroup: initialData?.ageGroup || profile.defaultAgeGroup || 'Not Specified',
    skillLevel: initialData?.skillLevel || profile.defaultSkillLevel || 'Not Specified',
    intensity: initialData?.intensity || 'Not Specified',
    duration: initialData?.duration,
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [playerDetailsOpen, setPlayerDetailsOpen] = useState(false);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [showPositionBreakdown, setShowPositionBreakdown] = useState(false);

  const updateField = <K extends keyof DrillFormData>(key: K, value: DrillFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Drill Goal */}
      <div className="form-section">
        <div className="form-section-title">
          <Target className="h-4 w-4" />
          Drill Goal
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="drillType">What do you want to work on?</Label>
            <Select
              value={formData.drillType}
              onValueChange={(value) => updateField('drillType', value as DrillCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {drillCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Describe what you want to work on...</Label>
            <Textarea
              id="description"
              placeholder="e.g., Quick combination play in the final third with overlapping runs"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Resources Available */}
      <div className="form-section">
        <div className="form-section-title">
          <Users className="h-4 w-4" />
          Resources Available
        </div>

        <div className="space-y-5">
          {/* Players */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Players</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPlayers" className="text-xs text-muted-foreground">
                  Total Players Available *
                </Label>
                <Input
                  id="totalPlayers"
                  type="number"
                  min={2}
                  max={30}
                  value={formData.totalPlayers}
                  onChange={(e) => updateField('totalPlayers', parseInt(e.target.value) || 2)}
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPositionBreakdown(!showPositionBreakdown)}
              className="text-xs text-primary hover:underline"
            >
              {showPositionBreakdown ? 'Hide' : 'Specify'} positions
            </button>

            {showPositionBreakdown && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="fieldPlayers" className="text-xs text-muted-foreground">
                    Field Players
                  </Label>
                  <Input
                    id="fieldPlayers"
                    type="number"
                    min={0}
                    max={30}
                    value={formData.fieldPlayers || ''}
                    onChange={(e) => updateField('fieldPlayers', parseInt(e.target.value) || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalkeepers" className="text-xs text-muted-foreground">
                    Goalkeepers
                  </Label>
                  <Input
                    id="goalkeepers"
                    type="number"
                    min={0}
                    max={4}
                    value={formData.goalkeepers || ''}
                    onChange={(e) => updateField('goalkeepers', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Equipment</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasGoals"
                  checked={formData.hasGoals}
                  onCheckedChange={(checked) => updateField('hasGoals', checked as boolean)}
                />
                <Label htmlFor="hasGoals" className="text-sm font-normal cursor-pointer">
                  Goals available
                </Label>
              </div>
              
              {formData.hasGoals && (
                <Select
                  value={formData.goalCount.toString()}
                  onValueChange={(value) => updateField('goalCount', parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Goal</SelectItem>
                    <SelectItem value="2">2 Goals</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasCones"
                  checked={formData.hasCones}
                  onCheckedChange={(checked) => updateField('hasCones', checked as boolean)}
                />
                <Label htmlFor="hasCones" className="text-sm font-normal cursor-pointer">
                  Cones/Markers
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasMannequins"
                  checked={formData.hasMannequins}
                  onCheckedChange={(checked) => updateField('hasMannequins', checked as boolean)}
                />
                <Label htmlFor="hasMannequins" className="text-sm font-normal cursor-pointer">
                  Mannequins/Dummies
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBibs"
                  checked={formData.hasBibs}
                  onCheckedChange={(checked) => updateField('hasBibs', checked as boolean)}
                />
                <Label htmlFor="hasBibs" className="text-sm font-normal cursor-pointer">
                  Bibs/Pinnies
                </Label>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="ballCount" className="text-xs text-muted-foreground">
                Number of balls
              </Label>
              <Input
                id="ballCount"
                placeholder="Multiple"
                value={formData.ballCount}
                onChange={(e) => updateField('ballCount', e.target.value)}
              />
            </div>
          </div>

          {/* Space */}
          <div className="space-y-2">
            <Label htmlFor="fieldSize" className="text-sm font-medium">Field Size</Label>
            <Select
              value={formData.fieldSize}
              onValueChange={(value) => updateField('fieldSize', value as FieldSize)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Section 3: Player Details (Collapsible) */}
      <Collapsible open={playerDetailsOpen} onOpenChange={setPlayerDetailsOpen}>
        <div className="form-section">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="form-section-title w-full justify-between hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Player Details
                <span className="text-xs font-normal">(Optional)</span>
              </span>
              {playerDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageGroup">Age Group / Level</Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(value) => updateField('ageGroup', value as AgeGroup)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map(age => (
                      <SelectItem key={age} value={age}>{age}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select
                  value={formData.skillLevel}
                  onValueChange={(value) => updateField('skillLevel', value as SkillLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skillLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 4: Session Details (Collapsible) */}
      <Collapsible open={sessionDetailsOpen} onOpenChange={setSessionDetailsOpen}>
        <div className="form-section">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="form-section-title w-full justify-between hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Details
                <span className="text-xs font-normal">(Optional)</span>
              </span>
              {sessionDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity Level</Label>
                <Select
                  value={formData.intensity}
                  onValueChange={(value) => updateField('intensity', value as IntensityLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intensityLevels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level === 'Low' && 'Low (Recovery/Technical)'}
                        {level === 'Medium' && 'Medium (Match Prep)'}
                        {level === 'High' && 'High (Game Intensity)'}
                        {level === 'Variable' && 'Variable'}
                        {level === 'Not Specified' && 'Not Specified'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={120}
                  placeholder="e.g., 15"
                  value={formData.duration || ''}
                  onChange={(e) => updateField('duration', parseInt(e.target.value) || undefined)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 5: Additional Notes */}
      <div className="form-section">
        <div className="form-section-title">
          <FileText className="h-4 w-4" />
          Additional Notes
          <span className="text-xs font-normal">(Optional)</span>
        </div>

        <Textarea
          placeholder="e.g., Focus on weak foot, need to accommodate an injured player, working on specific formation..."
          value={formData.additionalNotes}
          onChange={(e) => updateField('additionalNotes', e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Generate Button */}
      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating your drill...
          </>
        ) : (
          'Generate Drill'
        )}
      </Button>

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">
          This may take 15-20 seconds...
        </p>
      )}
    </form>
  );
}
