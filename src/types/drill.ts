// Cone line connecting two cones for boundary visualization
export interface ConeLine {
  from_cone: number;  // Index of starting cone in cones array
  to_cone: number;    // Index of ending cone in cones array
}

// Position in 2D space
export interface Position {
  x: number;
  y: number;
}

// Animation keyframe for drill playback
export interface AnimationKeyframe {
  id: string;
  label: string;
  duration: number;  // milliseconds to reach this keyframe
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  positions: {
    [entityId: string]: Position;
  };
}

// Animation data for dynamic drills
export interface Animation {
  duration: number;  // total duration in milliseconds
  keyframes: AnimationKeyframe[];
}

// Player entity in drill JSON
export interface DrillPlayer {
  id: string;
  role: 'attacker' | 'defender' | 'goalkeeper' | 'neutral';
  position: Position;
}

// Cone entity in drill JSON
export interface DrillCone {
  position: Position;
  color?: string;
}

// Ball entity in drill JSON
export interface DrillBall {
  position: Position;
}

// Goal entity in drill JSON
export interface DrillGoal {
  position: Position;
  rotation?: number;
  size?: 'full' | 'small';
}

// Movement arrow in drill JSON (legacy format)
export interface DrillMovement {
  from: Position;
  to: Position;
  type: 'run' | 'pass' | 'dribble' | 'shot';
  player_id?: string;
}

// Action in drill JSON (current Supabase format)
export interface DrillAction {
  type: 'PASS' | 'RUN' | 'DRIBBLE' | 'SHOT';
  from_player?: string;
  to_player?: string;
  player?: string;
  to_position?: Position;
}

// Mini goal entity in drill JSON
export interface DrillMiniGoal {
  position: Position;
  rotation?: number;
}

// Structured drill JSON data
export interface DrillJsonData {
  field?: {
    type: 'FULL' | 'HALF';
    show_markings?: boolean;
    markings?: boolean;
    goals?: number;
    attacking_direction?: 'NORTH' | 'SOUTH';
  };
  players?: DrillPlayer[];
  cones?: DrillCone[];
  balls?: DrillBall[];
  goals?: DrillGoal[];
  mini_goals?: DrillMiniGoal[];
  movements?: DrillMovement[];
  actions?: DrillAction[];
  cone_lines?: ConeLine[];
  animation?: Animation;
  // Top-level metadata (may come from API response)
  num_players?: number;
  duration?: number;
  intensity?: string;
  category?: string;
}

export interface Drill {
  id: string;
  name: string;
  category: DrillCategory;
  description: string;
  playerCount: number;
  playerCountDisplay?: string; // Original string like "9+" for display
  duration: number;
  intensity: IntensityLevel;
  ageGroup?: AgeGroup;
  difficulty?: string;
  svg?: string; // Legacy base64 SVG (deprecated)
  svgUrl?: string; // URL to SVG image
  fullDescription?: string;
  drillJson?: DrillJsonData;
  savedAt?: string;
  source?: string;
  hasAnimation?: boolean;
  animationHtmlUrl?: string; // URL to animation HTML page
  animationJson?: { duration: number; keyframes: AnimationKeyframe[] }; // Animation data from Supabase
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
  drill_json: DrillJsonData;
  error: string | null;
}
