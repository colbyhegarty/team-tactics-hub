import { DrillFormData, GenerateDrillResponse, SkillLevel, FieldSize } from '@/types/drill';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

function buildPrompt(formData: DrillFormData): string {
  let prompt = `Create a ${formData.drillType} drill`;
  
  if (formData.description) {
    prompt += ` focused on: ${formData.description}`;
  }
  
  prompt += `. Players: ${formData.totalPlayers}`;
  
  if (formData.goalkeepers && formData.goalkeepers > 0) {
    prompt += ` (including ${formData.goalkeepers} goalkeeper(s))`;
  }
  
  if (formData.hasGoals && formData.goalCount > 0) {
    prompt += `. Use ${formData.goalCount} goal(s)`;
  }
  
  if (formData.hasMannequins) {
    prompt += `. Include mannequins/dummies`;
  }
  
  if (formData.ageGroup && formData.ageGroup !== 'Not Specified') {
    prompt += `. Age group: ${formData.ageGroup}`;
  }
  
  if (formData.intensity && formData.intensity !== 'Not Specified') {
    prompt += `. Intensity: ${formData.intensity}`;
  }
  
  if (formData.duration) {
    prompt += `. Duration: approximately ${formData.duration} minutes`;
  }
  
  if (formData.fieldSize && formData.fieldSize !== 'Any/Flexible') {
    prompt += `. Field size: ${formData.fieldSize}`;
  }
  
  if (formData.additionalNotes) {
    prompt += `. Additional notes: ${formData.additionalNotes}`;
  }
  
  return prompt;
}

function mapFieldType(fieldSize: FieldSize): 'FULL' | 'HALF' {
  return fieldSize === 'Full Field' ? 'FULL' : 'HALF';
}

function mapSkillLevel(skill: SkillLevel): 'beginner' | 'intermediate' | 'advanced' | null {
  switch (skill) {
    case 'Beginner':
      return 'beginner';
    case 'Intermediate':
      return 'intermediate';
    case 'Advanced':
    case 'Elite':
      return 'advanced';
    default:
      return null;
  }
}

export async function generateDrill(formData: DrillFormData): Promise<GenerateDrillResponse> {
  const prompt = buildPrompt(formData);
  const includeGoalkeeper = (formData.goalkeepers || 0) > 0;
  
  const requestBody = {
    prompt,
    num_players: formData.totalPlayers,
    include_goalkeeper: includeGoalkeeper,
    field_type: mapFieldType(formData.fieldSize),
    skill_level: mapSkillLevel(formData.skillLevel),
  };

  const response = await fetch(`${API_URL}/api/generate-drill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate drill: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate drill');
  }

  return data;
}
