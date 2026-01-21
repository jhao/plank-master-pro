export enum Tab {
  TRAINING = 'TRAINING',
  HISTORY = 'HISTORY',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  PROFILE = 'PROFILE',
}

export interface TrainingLog {
  id: string;
  timestamp: number; // Unix timestamp
  duration: number; // in seconds
  dateString: string; // YYYY-MM-DD for easy grouping
}

export interface BodyMetric {
  date: string; // YYYY-MM-DD
  weight?: number;
  waist?: number;
  age?: number;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  metrics: BodyMetric[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'total';
  threshold: number;
  unlockedAt?: number;
}

export const STORAGE_KEYS = {
  LOGS: 'plank_logs',
  PROFILE: 'plank_profile',
};
