import { useState, useCallback } from 'react';
import type { FoodEntry, TrainingSession, DailyGoals, AppState, WeightEntry } from '../types';

const STORAGE_KEY = 'fitness_app_data';

const defaultGoals: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  targetWeight: 70,
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // migrate: add missing fields
      return {
        weightEntries: [],
        ...parsed,
        goals: { ...defaultGoals, ...parsed.goals },
      };
    }
  } catch {}
  return { foodEntries: [], trainingSessions: [], weightEntries: [], goals: defaultGoals };
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

  // --- Food ---
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
    update(prev => ({ ...prev, foodEntries: prev.foodEntries.filter(e => e.id !== id) }));
  }, [update]);

  // --- Training ---
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
    update(prev => ({ ...prev, trainingSessions: prev.trainingSessions.filter(s => s.id !== id) }));
  }, [update]);

  // --- Weight ---
  const upsertWeightEntry = useCallback((entry: Omit<WeightEntry, 'id'> & { id?: string }) => {
    update(prev => {
      const existing = prev.weightEntries.find(w => w.date === entry.date);
      if (existing) {
        return {
          ...prev,
          weightEntries: prev.weightEntries.map(w =>
            w.date === entry.date ? { ...entry, id: existing.id } : w
          ),
        };
      }
      return {
        ...prev,
        weightEntries: [
          ...prev.weightEntries,
          { ...entry, id: crypto.randomUUID() },
        ],
      };
    });
  }, [update]);

  const removeWeightEntry = useCallback((date: string) => {
    update(prev => ({ ...prev, weightEntries: prev.weightEntries.filter(w => w.date !== date) }));
  }, [update]);

  // --- Goals ---
  const updateGoals = useCallback((goals: DailyGoals) => {
    update(prev => ({ ...prev, goals }));
  }, [update]);

  // Today's entries
  const today = new Date().toDateString();
  const todayFood = state.foodEntries.filter(e => new Date(e.timestamp).toDateString() === today);
  const todayTraining = state.trainingSessions.filter(s => new Date(s.timestamp).toDateString() === today);

  const totalCaloriesIn = todayFood.reduce((sum, e) => sum + e.calories, 0);
  const totalCaloriesBurned = todayTraining.reduce((sum, s) => sum + s.totalCaloriesBurned, 0);
  const totalProtein = todayFood.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = todayFood.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = todayFood.reduce((sum, e) => sum + e.fat, 0);

  // Weight entries
  const sortedWeights = [...state.weightEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedWeights[0];
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayWeight = state.weightEntries.find(w => w.date === todayDateStr);

  return {
    state,
    todayFood,
    todayTraining,
    totalCaloriesIn,
    totalCaloriesBurned,
    totalProtein,
    totalCarbs,
    totalFat,
    latestWeight,
    todayWeight,
    sortedWeights,
    addFoodEntry,
    removeFoodEntry,
    addTrainingSession,
    removeTrainingSession,
    upsertWeightEntry,
    removeWeightEntry,
    updateGoals,
  };
}
