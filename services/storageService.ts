import { TrainingLog, UserProfile, STORAGE_KEYS, BodyMetric } from '../types';

export const getLogs = (): TrainingLog[] => {
  const logs = localStorage.getItem(STORAGE_KEYS.LOGS);
  return logs ? JSON.parse(logs) : [];
};

export const saveLog = (duration: number) => {
  const logs = getLogs();
  const now = new Date();
  const dateString = now.toISOString().split('T')[0];
  
  const newLog: TrainingLog = {
    id: crypto.randomUUID(),
    timestamp: now.getTime(),
    duration,
    dateString,
  };

  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([...logs, newLog]));
  return newLog;
};

export const getDailyLogs = (dateString: string): TrainingLog[] => {
  const logs = getLogs();
  return logs.filter((log) => log.dateString === dateString);
};

export const getProfile = (): UserProfile => {
  const profile = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (profile) return JSON.parse(profile);
  
  // Default profile
  return {
    name: 'Athlete',
    gender: 'male',
    metrics: [{ date: new Date().toISOString().split('T')[0], weight: 60, waist: 70, age: 25 }],
  };
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const addBodyMetric = (metric: BodyMetric) => {
  const profile = getProfile();
  // Check if metric for today exists, update it, otherwise add new
  const existingIndex = profile.metrics.findIndex(m => m.date === metric.date);
  if (existingIndex >= 0) {
    profile.metrics[existingIndex] = { ...profile.metrics[existingIndex], ...metric };
  } else {
    profile.metrics.push(metric);
  }
  // Sort metrics by date
  profile.metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  saveProfile(profile);
};
