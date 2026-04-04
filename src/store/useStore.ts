import { useState, useCallback } from 'react';
import type { FoodEntry, TrainingSession, DailyGoals, AppState } from '../types';

const STORAGE_KEY = 'fitness_app_data';

const defaultGoals: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { foodEntries: [], trainingSessions: [], goals: defaultGoals };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addFoodEntry = useCallback((entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    update(prev => ({
      ...prev,
      foodEntries: [
        ...prev.foodEntries,
        { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ],
    }));
  }, [update]);

  const removeFoodEntry = useCallback((id: string) => {
    update(prev => ({
      ...prev,
      foodEntries: prev.foodEntries.filter(e => e.id !== id),
    }));
  }, [update]);

  const addTrainingSession = useCallback((session: Omit<TrainingSession, 'id' | 'timestamp'>) => {
    update(prev => ({
      ...prev,
      trainingSessions: [
        ...prev.trainingSessions,
        { ...session, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ],
    }));
  }, [update]);

  const removeTrainingSession = useCallback((id: string) => {
    update(prev => ({
      ...prev,
      trainingSessions: prev.trainingSessions.filter(s => s.id !== id),
    }));
  }, [update]);

  const updateGoals = useCallback((goals: DailyGoals) => {
    update(prev => ({ ...prev, goals }));
  }, [update]);

  // Today's entries only
  const today = new Date().toDateString();
  const todayFood = state.foodEntries.filter(e => new Date(e.timestamp).toDateString() === today);
  const todayTraining = state.trainingSessions.filter(s => new Date(s.timestamp).toDateString() === today);

  const totalCaloriesIn = todayFood.reduce((sum, e) => sum + e.calories, 0);
  const totalCaloriesBurned = todayTraining.reduce((sum, s) => sum + s.totalCaloriesBurned, 0);
  const totalProtein = todayFood.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = todayFood.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = todayFood.reduce((sum, e) => sum + e.fat, 0);

  return {
    state,
    todayFood,
    todayTraining,
    totalCaloriesIn,
    totalCaloriesBurned,
    totalProtein,
    totalCarbs,
    totalFat,
    addFoodEntry,
    removeFoodEntry,
    addTrainingSession,
    removeTrainingSession,
    updateGoals,
  };
}
