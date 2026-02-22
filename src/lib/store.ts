// Local storage helpers for persistent state (no database needed initially)

export interface EventType {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'wellness' | 'learning' | 'social' | 'custom';
  defaultPoints: number;
  defaultWeightage: number;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface UserEvent {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  pointsEarned: number;
  durationMinutes: number | null;
  notes: string;
  occurredAt: string;
  category: string;
  color: string;
}

export interface DailyGoal {
  id: string;
  goalType: 'productive_hours' | 'events_count' | 'points_target';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  rewardDescription: string;
  date: string;
}

export interface GamificationProfile {
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  dailyStreak: number;
  longestStreak: number;
  eventsLogged: number;
  achievementsUnlocked: number;
  rewardsClaimed: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  criteria: string;
  bonusPoints: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  unlockCriteria: string;
  unlockValue: number;
  claimed: boolean;
  icon: string;
}

const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: '1', name: 'Task Completed', description: 'Finished a task', category: 'productivity', defaultPoints: 10, defaultWeightage: 1.0, icon: '✅', color: '#10B981', isSystem: true },
  { id: '2', name: 'Deep Work Session', description: 'Focused work period', category: 'productivity', defaultPoints: 25, defaultWeightage: 1.5, icon: '🧠', color: '#6366F1', isSystem: true },
  { id: '3', name: 'Habit Completed', description: 'Completed a daily habit', category: 'wellness', defaultPoints: 15, defaultWeightage: 1.2, icon: '🔄', color: '#F59E0B', isSystem: true },
  { id: '4', name: 'Early Start', description: 'Started before 8 AM', category: 'productivity', defaultPoints: 20, defaultWeightage: 1.3, icon: '🌅', color: '#F97316', isSystem: true },
  { id: '5', name: 'Exercise', description: 'Physical activity', category: 'wellness', defaultPoints: 30, defaultWeightage: 1.4, icon: '💪', color: '#EF4444', isSystem: true },
  { id: '6', name: 'Learning', description: 'Study or learning session', category: 'learning', defaultPoints: 20, defaultWeightage: 1.25, icon: '📚', color: '#8B5CF6', isSystem: true },
  { id: '7', name: 'Break Taken', description: 'Healthy break', category: 'wellness', defaultPoints: 5, defaultWeightage: 0.8, icon: '☕', color: '#06B6D4', isSystem: true },
  { id: '8', name: 'Goal Achieved', description: 'Major goal milestone', category: 'productivity', defaultPoints: 50, defaultWeightage: 2.0, icon: '🎯', color: '#EC4899', isSystem: true },
  { id: '9', name: 'Meditation', description: 'Mindfulness session', category: 'wellness', defaultPoints: 15, defaultWeightage: 1.1, icon: '🧘', color: '#14B8A6', isSystem: true },
  { id: '10', name: 'No Distractions', description: 'Distraction-free period', category: 'productivity', defaultPoints: 20, defaultWeightage: 1.35, icon: '🔕', color: '#64748B', isSystem: true },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'First Step', description: 'Log your first event', tier: 'bronze', criteria: 'events >= 1', bonusPoints: 10, unlocked: false, unlockedAt: null },
  { id: '2', name: 'Getting Started', description: 'Log 10 events', tier: 'bronze', criteria: 'events >= 10', bonusPoints: 25, unlocked: false, unlockedAt: null },
  { id: '3', name: 'Century Club', description: 'Log 100 events', tier: 'silver', criteria: 'events >= 100', bonusPoints: 100, unlocked: false, unlockedAt: null },
  { id: '4', name: 'Point Collector', description: 'Earn 500 points', tier: 'silver', criteria: 'points >= 500', bonusPoints: 50, unlocked: false, unlockedAt: null },
  { id: '5', name: 'Point Master', description: 'Earn 1000 points', tier: 'gold', criteria: 'points >= 1000', bonusPoints: 150, unlocked: false, unlockedAt: null },
  { id: '6', name: 'Week Warrior', description: '7-day streak', tier: 'silver', criteria: 'streak >= 7', bonusPoints: 75, unlocked: false, unlockedAt: null },
  { id: '7', name: 'Month Master', description: '30-day streak', tier: 'gold', criteria: 'streak >= 30', bonusPoints: 200, unlocked: false, unlockedAt: null },
  { id: '8', name: 'Level 5', description: 'Reach level 5', tier: 'silver', criteria: 'level >= 5', bonusPoints: 100, unlocked: false, unlockedAt: null },
  { id: '9', name: 'Level 10', description: 'Reach level 10', tier: 'gold', criteria: 'level >= 10', bonusPoints: 250, unlocked: false, unlockedAt: null },
  { id: '10', name: 'Deep Focus', description: '10 deep work sessions', tier: 'gold', criteria: 'deep_work >= 10', bonusPoints: 100, unlocked: false, unlockedAt: null },
];

const DEFAULT_REWARDS: Reward[] = [
  { id: '1', name: 'Dark Theme', description: 'Unlock dark mode', unlockCriteria: 'points', unlockValue: 100, claimed: false, icon: '🌙' },
  { id: '2', name: 'Custom Categories', description: 'Create custom event categories', unlockCriteria: 'points', unlockValue: 300, claimed: false, icon: '🎨' },
  { id: '3', name: 'Advanced Analytics', description: 'Unlock detailed charts', unlockCriteria: 'level', unlockValue: 5, claimed: false, icon: '📊' },
  { id: '4', name: 'Points Multiplier', description: '2x points for 24 hours', unlockCriteria: 'streak', unlockValue: 7, claimed: false, icon: '⚡' },
  { id: '5', name: 'AI Coach', description: 'AI productivity suggestions', unlockCriteria: 'level', unlockValue: 10, claimed: false, icon: '🤖' },
];

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function getEventTypes(): EventType[] {
  return getStorageItem('focusflow_event_types', DEFAULT_EVENT_TYPES);
}

export function saveEventTypes(types: EventType[]): void {
  setStorageItem('focusflow_event_types', types);
}

export function getUserEvents(): UserEvent[] {
  return getStorageItem('focusflow_user_events', []);
}

export function saveUserEvents(events: UserEvent[]): void {
  setStorageItem('focusflow_user_events', events);
}

export function getProfile(): GamificationProfile {
  return getStorageItem('focusflow_profile', {
    totalPoints: 0,
    currentLevel: 1,
    experiencePoints: 0,
    dailyStreak: 0,
    longestStreak: 0,
    eventsLogged: 0,
    achievementsUnlocked: 0,
    rewardsClaimed: 0,
  });
}

export function saveProfile(profile: GamificationProfile): void {
  setStorageItem('focusflow_profile', profile);
}

export function getDailyGoals(): DailyGoal[] {
  const today = new Date().toISOString().split('T')[0];
  const goals = getStorageItem<DailyGoal[]>('focusflow_daily_goals', []);
  return goals.filter(g => g.date === today);
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  setStorageItem('focusflow_daily_goals', goals);
}

export function getAchievements(): Achievement[] {
  return getStorageItem('focusflow_achievements', DEFAULT_ACHIEVEMENTS);
}

export function saveAchievements(achievements: Achievement[]): void {
  setStorageItem('focusflow_achievements', achievements);
}

export function getRewards(): Reward[] {
  return getStorageItem('focusflow_rewards', DEFAULT_REWARDS);
}

export function saveRewards(rewards: Reward[]): void {
  setStorageItem('focusflow_rewards', rewards);
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function pointsForNextLevel(currentLevel: number): number {
  return currentLevel * currentLevel * 100;
}

export function calculatePoints(basePoints: number, weightage: number, durationMinutes: number | null): number {
  const durationBonus = durationMinutes ? Math.floor(durationMinutes / 15) * 2 : 0;
  return Math.round((basePoints + durationBonus) * weightage * 10) / 10;
}

export function getTodayEvents(): UserEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return getUserEvents().filter(e => e.occurredAt.startsWith(today));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
