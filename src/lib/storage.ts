import { Drill, UserProfile, AgeGroup, SkillLevel } from '@/types/drill';

const SAVED_DRILLS_KEY = 'drillforge_saved_drills';
const USER_PROFILE_KEY = 'drillforge_user_profile';

export const defaultProfile: UserProfile = {
  name: '',
  email: '',
  teamName: '',
  defaultAgeGroup: 'Not Specified',
  defaultSkillLevel: 'Not Specified',
  defaultPlayerCount: 12,
};

export function getSavedDrills(): Drill[] {
  try {
    const stored = localStorage.getItem(SAVED_DRILLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveDrill(drill: Drill): void {
  const drills = getSavedDrills();
  const existingIndex = drills.findIndex(d => d.id === drill.id);
  
  if (existingIndex >= 0) {
    drills[existingIndex] = { ...drill, savedAt: new Date().toISOString() };
  } else {
    drills.push({ ...drill, savedAt: new Date().toISOString() });
  }
  
  localStorage.setItem(SAVED_DRILLS_KEY, JSON.stringify(drills));
}

export function removeDrill(drillId: string): void {
  const drills = getSavedDrills();
  const filtered = drills.filter(d => d.id !== drillId);
  localStorage.setItem(SAVED_DRILLS_KEY, JSON.stringify(filtered));
}

export function isDrillSaved(drillId: string): boolean {
  const drills = getSavedDrills();
  return drills.some(d => d.id === drillId);
}

export function getUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): void {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
}

export function clearAllData(): void {
  localStorage.removeItem(SAVED_DRILLS_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
}
