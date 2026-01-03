export interface Drill {
  id: string;
  name: string;
  category: DrillCategory;
  description: string;
  playerCount: number;
  duration: number;
  intensity: IntensityLevel;
  svg?: string;
  fullDescription?: string;
  drillJson?: Record<string, unknown>;
  savedAt?: string;
  // Structured fields from library API
  setup?: string;
  instructions?: string;
  coachingPoints?: string;
  variations?: string;
}

export type DrillCategory = 
  | 'Finishing'
  | 'Passing & Possession'
  | 'Defensive Shape'
  | 'Pressing & Transitions'
  | 'Crossing & Wide Play'
  | 'Set Pieces'
  | 'Conditioning'
  | 'Warm-up'
  | 'Cool-down'
  | 'Technical Skills'
  | '1v1 Situations'
  | 'Small-Sided Games'
  | 'Other';

export type IntensityLevel = 'Low' | 'Medium' | 'High' | 'Variable' | 'Not Specified';

export type AgeGroup = 
  | 'U8'
  | 'U10'
  | 'U12'
  | 'U14'
  | 'U16'
  | 'U18'
  | 'College'
  | 'Semi-Pro'
  | 'Professional'
  | 'Recreational Adult'
  | 'Not Specified';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite' | 'Not Specified';

export type FieldSize = 
  | 'Full Field'
  | 'Half Field'
  | 'Third of Field'
  | 'Penalty Box Area'
  | 'Small Grid (10x10 to 20x20)'
  | 'Medium Grid (20x20 to 40x40)'
  | 'Any/Flexible';

export interface DrillFormData {
  drillType: DrillCategory;
  description: string;
  totalPlayers: number;
  fieldPlayers?: number;
  goalkeepers?: number;
  hasGoals: boolean;
  goalCount: number;
  hasCones: boolean;
  hasMannequins: boolean;
  hasBibs: boolean;
  ballCount: string;
  fieldSize: FieldSize;
  ageGroup: AgeGroup;
  skillLevel: SkillLevel;
  intensity: IntensityLevel;
  duration?: number;
  additionalNotes: string;
}

export interface UserProfile {
  name: string;
  email: string;
  teamName: string;
  defaultAgeGroup: AgeGroup;
  defaultSkillLevel: SkillLevel;
  defaultPlayerCount: number;
  avatarUrl?: string;
}

export interface GenerateDrillResponse {
  success: boolean;
  drill_name: string;
  svg: string;
  description: string;
  drill_json: Record<string, unknown>;
  error: string | null;
}
