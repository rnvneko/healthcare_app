export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface TrainingSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  name: string;
  sets: TrainingSet[];
  caloriesBurned: number;
}

export interface TrainingSession {
  id: string;
  name: string;
  exercises: Exercise[];
  totalCaloriesBurned: number;
  duration: number; // minutes
  timestamp: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetWeight: number;
  targetBodyFat?: number;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg (required)
  bmi?: number;
  bodyFat?: number; // %
  bodyWater?: number; // %
  muscleMass?: number; // kg
  boneMass?: number; // kg
  bmr?: number; // kcal
  visceralFat?: number; // level
  subcutaneousFat?: number; // %
  proteinRate?: number; // %
  bodyAge?: number; // 歳
}

export interface AppState {
  foodEntries: FoodEntry[];
  trainingSessions: TrainingSession[];
  weightEntries: WeightEntry[];
  goals: DailyGoals;
}
