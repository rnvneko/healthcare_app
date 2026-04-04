import { useState } from 'react';
import { useStore } from './store/useStore';
import Dashboard from './components/Dashboard';
import FoodTracker from './components/FoodTracker';
import TrainingTracker from './components/TrainingTracker';
import RecipePlanner from './components/RecipePlanner';
import BottomNav, { type Tab } from './components/BottomNav';
import GoalEditor from './components/GoalEditor';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const store = useStore();

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">
          FG
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">FitGoal</h1>
          <p className="text-xs text-gray-400 leading-tight">フィットネス & 食事管理</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard
            totalCaloriesIn={store.totalCaloriesIn}
            totalCaloriesBurned={store.totalCaloriesBurned}
            totalProtein={store.totalProtein}
            totalCarbs={store.totalCarbs}
            totalFat={store.totalFat}
            goals={store.state.goals}
            onEditGoals={() => setShowGoalEditor(true)}
          />
        )}
        {activeTab === 'food' && (
          <FoodTracker
            entries={store.todayFood}
            onAdd={store.addFoodEntry}
            onRemove={store.removeFoodEntry}
            totalCalories={store.totalCaloriesIn}
            totalProtein={store.totalProtein}
            totalCarbs={store.totalCarbs}
            totalFat={store.totalFat}
          />
        )}
        {activeTab === 'training' && (
          <TrainingTracker
            sessions={store.todayTraining}
            onAdd={store.addTrainingSession}
            onRemove={store.removeTrainingSession}
            totalCaloriesBurned={store.totalCaloriesBurned}
          />
        )}
        {activeTab === 'recipe' && (
          <RecipePlanner
            goals={store.state.goals}
            remainingCalories={store.state.goals.calories - store.totalCaloriesIn + store.totalCaloriesBurned}
            remainingProtein={store.state.goals.protein - store.totalProtein}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Goal editor modal */}
      {showGoalEditor && (
        <GoalEditor
          goals={store.state.goals}
          onSave={store.updateGoals}
          onClose={() => setShowGoalEditor(false)}
        />
      )}
    </div>
  );
}
