import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { FoodEntry, TrainingSession, DailyGoals, AppState, WeightEntry, AIHistoryEntry } from '../types';

const defaultGoals: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  targetWeight: 70,
};

const defaultState: AppState = {
  foodEntries: [],
  trainingSessions: [],
  weightEntries: [],
  aiHistory: [],
  goals: defaultGoals,
};

// ── DB row → App type mappers ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFood(row: any): FoodEntry {
  return {
    id: row.id,
    name: row.name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    timestamp: row.timestamp,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTraining(row: any): TrainingSession {
  return {
    id: row.id,
    name: row.name,
    exercises: row.exercises ?? [],
    totalCaloriesBurned: Number(row.total_calories_burned),
    duration: Number(row.duration),
    timestamp: row.timestamp,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWeight(row: any): WeightEntry {
  return {
    id: row.id,
    date: row.date,
    weight: Number(row.weight),
    bmi: row.bmi != null ? Number(row.bmi) : undefined,
    bodyFat: row.body_fat != null ? Number(row.body_fat) : undefined,
    bodyWater: row.body_water != null ? Number(row.body_water) : undefined,
    muscleMass: row.muscle_mass != null ? Number(row.muscle_mass) : undefined,
    boneMass: row.bone_mass != null ? Number(row.bone_mass) : undefined,
    bmr: row.bmr != null ? Number(row.bmr) : undefined,
    visceralFat: row.visceral_fat != null ? Number(row.visceral_fat) : undefined,
    subcutaneousFat: row.subcutaneous_fat != null ? Number(row.subcutaneous_fat) : undefined,
    proteinRate: row.protein_rate != null ? Number(row.protein_rate) : undefined,
    bodyAge: row.body_age != null ? Number(row.body_age) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAI(row: any): AIHistoryEntry {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    registeredDate: row.registered_date ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGoals(row: any): DailyGoals {
  return {
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    targetWeight: Number(row.target_weight),
    targetBodyFat: row.target_body_fat != null ? Number(row.target_body_fat) : undefined,
    targetDate: row.target_date ?? undefined,
    activityLevel: row.activity_level ?? undefined,
  };
}

// ────────────────────────────────────────────────────────────────────────────

export function useStore() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>(defaultState);

  // ── Auth + initial data load ─────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadAll(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadAll(session.user.id);
      else { setState(defaultState); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadAll(userId: string) {
    setLoading(true);
    const todayStr = new Date().toISOString().slice(0, 10);

    const [food, training, weight, ai, goals] = await Promise.all([
      supabase.from('food_entries').select('*').eq('user_id', userId)
        .gte('timestamp', `${todayStr}T00:00:00`).order('timestamp'),
      supabase.from('training_sessions').select('*').eq('user_id', userId)
        .gte('timestamp', `${todayStr}T00:00:00`).order('timestamp'),
      supabase.from('weight_entries').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('ai_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    setState({
      foodEntries: (food.data ?? []).map(mapFood),
      trainingSessions: (training.data ?? []).map(mapTraining),
      weightEntries: (weight.data ?? []).map(mapWeight),
      aiHistory: (ai.data ?? []).map(mapAI),
      goals: goals.data ? mapGoals(goals.data) : defaultGoals,
    });
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // ── Computed values ──────────────────────────────────────────────────────

  const totalCaloriesIn = state.foodEntries.reduce((s, e) => s + e.calories, 0);
  const totalCaloriesBurned = state.trainingSessions.reduce((s, e) => s + e.totalCaloriesBurned, 0);
  const totalProtein = state.foodEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = state.foodEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = state.foodEntries.reduce((s, e) => s + e.fat, 0);

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayFood = state.foodEntries;
  const todayTraining = state.trainingSessions;

  const sortedWeights = [...state.weightEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedWeights[0];
  const todayWeight = state.weightEntries.find(w => w.date === todayDateStr);

  // ── Food CRUD ────────────────────────────────────────────────────────────

  const addFoodEntry = useCallback(async (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    if (!user) return;
    const newEntry: FoodEntry = { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setState(prev => ({ ...prev, foodEntries: [...prev.foodEntries, newEntry] }));
    await supabase.from('food_entries').insert({
      id: newEntry.id, user_id: user.id,
      name: entry.name, calories: entry.calories,
      protein: entry.protein, carbs: entry.carbs, fat: entry.fat,
      timestamp: newEntry.timestamp,
    });
  }, [user]);

  const removeFoodEntry = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, foodEntries: prev.foodEntries.filter(e => e.id !== id) }));
    await supabase.from('food_entries').delete().eq('id', id);
  }, []);

  // ── Training CRUD ────────────────────────────────────────────────────────

  const addTrainingSession = useCallback(async (session: Omit<TrainingSession, 'id' | 'timestamp'>) => {
    if (!user) return;
    const newSession: TrainingSession = { ...session, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setState(prev => ({ ...prev, trainingSessions: [...prev.trainingSessions, newSession] }));
    await supabase.from('training_sessions').insert({
      id: newSession.id, user_id: user.id,
      name: session.name, exercises: session.exercises,
      total_calories_burned: session.totalCaloriesBurned,
      duration: session.duration, timestamp: newSession.timestamp,
    });
  }, [user]);

  const removeTrainingSession = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, trainingSessions: prev.trainingSessions.filter(e => e.id !== id) }));
    await supabase.from('training_sessions').delete().eq('id', id);
  }, []);

  // ── Weight CRUD ──────────────────────────────────────────────────────────

  const upsertWeightEntry = useCallback(async (entry: Omit<WeightEntry, 'id'>) => {
    if (!user) return;
    const existing = state.weightEntries.find(w => w.date === entry.date);
    const id = existing?.id ?? crypto.randomUUID();
    const newEntry: WeightEntry = { ...entry, id };
    setState(prev => ({
      ...prev,
      weightEntries: existing
        ? prev.weightEntries.map(w => w.date === entry.date ? newEntry : w)
        : [...prev.weightEntries, newEntry],
    }));
    await supabase.from('weight_entries').upsert({
      id, user_id: user.id,
      date: entry.date, weight: entry.weight,
      bmi: entry.bmi ?? null, body_fat: entry.bodyFat ?? null,
      body_water: entry.bodyWater ?? null, muscle_mass: entry.muscleMass ?? null,
      bone_mass: entry.boneMass ?? null, bmr: entry.bmr ?? null,
      visceral_fat: entry.visceralFat ?? null, subcutaneous_fat: entry.subcutaneousFat ?? null,
      protein_rate: entry.proteinRate ?? null, body_age: entry.bodyAge ?? null,
    }, { onConflict: 'user_id,date' });
  }, [user, state.weightEntries]);

  const removeWeightEntry = useCallback(async (date: string) => {
    setState(prev => ({ ...prev, weightEntries: prev.weightEntries.filter(w => w.date !== date) }));
    if (!user) return;
    await supabase.from('weight_entries').delete().eq('user_id', user.id).eq('date', date);
  }, [user]);

  // ── AI History CRUD ──────────────────────────────────────────────────────

  const addAIHistory = useCallback(async (entry: Omit<AIHistoryEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newEntry: AIHistoryEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, aiHistory: [newEntry, ...prev.aiHistory] }));
    await supabase.from('ai_history').insert({
      id: newEntry.id, user_id: user.id,
      type: entry.type, title: entry.title, content: entry.content,
      registered_date: entry.registeredDate ?? null,
      created_at: newEntry.createdAt,
    });
  }, [user]);

  const updateAIHistoryDate = useCallback(async (id: string, registeredDate: string) => {
    setState(prev => ({
      ...prev,
      aiHistory: prev.aiHistory.map(h => h.id === id ? { ...h, registeredDate } : h),
    }));
    await supabase.from('ai_history').update({ registered_date: registeredDate }).eq('id', id);
  }, []);

  const removeAIHistory = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, aiHistory: prev.aiHistory.filter(h => h.id !== id) }));
    await supabase.from('ai_history').delete().eq('id', id);
  }, []);

  // ── Goals ────────────────────────────────────────────────────────────────

  const updateGoals = useCallback(async (goals: DailyGoals) => {
    if (!user) return;
    setState(prev => ({ ...prev, goals }));
    await supabase.from('user_goals').upsert({
      user_id: user.id,
      calories: goals.calories, protein: goals.protein,
      carbs: goals.carbs, fat: goals.fat,
      target_weight: goals.targetWeight,
      target_body_fat: goals.targetBodyFat ?? null,
      target_date: goals.targetDate ?? null,
      activity_level: goals.activityLevel ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [user]);

  return {
    user,
    loading,
    signOut,
    state,
    totalCaloriesIn,
    totalCaloriesBurned,
    totalProtein,
    totalCarbs,
    totalFat,
    todayFood,
    todayTraining,
    latestWeight,
    todayWeight,
    addFoodEntry,
    removeFoodEntry,
    addTrainingSession,
    removeTrainingSession,
    upsertWeightEntry,
    removeWeightEntry,
    addAIHistory,
    updateAIHistoryDate,
    removeAIHistory,
    updateGoals,
  };
}
