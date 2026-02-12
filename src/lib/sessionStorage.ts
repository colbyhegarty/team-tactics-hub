import { Session, SessionActivity } from '@/types/session';

const SESSIONS_KEY = 'drillforge_sessions';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateActivityId(): string {
  return generateId();
}

export function getSessions(): Session[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): Session | null {
  return getSessions().find(s => s.id === id) || null;
}

export function saveSession(session: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Session {
  const sessions = getSessions();
  const now = new Date().toISOString();
  const newSession: Session = {
    ...session,
    id: generateId(),
    created_at: now,
    updated_at: now,
  };
  sessions.push(newSession);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return newSession;
}

export function updateSession(id: string, updates: Partial<Session>): Session | null {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return null;
  sessions[index] = {
    ...sessions[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return sessions[index];
}

export function deleteSession(id: string): boolean {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  if (filtered.length === sessions.length) return false;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  return true;
}

export function duplicateSession(id: string): Session | null {
  const session = getSession(id);
  if (!session) return null;
  return saveSession({
    ...session,
    title: `${session.title} (Copy)`,
    activities: session.activities.map(a => ({ ...a, id: generateActivityId() })),
  });
}
