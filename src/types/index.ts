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
}

export interface AppState {
  foodEntries: FoodEntry[];
  trainingSessions: TrainingSession[];
  goals: DailyGoals;
}
