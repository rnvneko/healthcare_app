import { useState, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import Dashboard from './components/Dashboard';
import FoodTracker from './components/FoodTracker';
import TrainingTracker from './components/TrainingTracker';
import WeightTracker from './components/WeightTracker';
import RecipePlanner from './components/RecipePlanner';
import AuthScreen from './components/AuthScreen';
import BottomNav, { type Tab } from './components/BottomNav';
import GoalEditor from './components/GoalEditor';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    (localStorage.getItem('activeTab') as Tab) ?? 'dashboard'
  );
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const store = useStore();

  const lastScrollY = useRef(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    const delta = currentY - lastScrollY.current;
    lastScrollY.current = currentY;

    if (currentY < 60) {
      setNavHidden(false);
    } else if (delta > 5) {
      setNavHidden(true);
    } else if (delta < -5) {
      setNavHidden(false);
    }
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
    setNavHidden(false);
    lastScrollY.current = 0;
  }, []);

  function handleSaveAIHistory(type: 'recipe' | 'training', title: string, content: string, date: string) {
    store.addAIHistory({ type, title, content, registeredDate: date });
  }

  // Show auth screen if not logged in
  if (!store.loading && !store.user) return <AuthScreen />;

  // Loading screen
  if (store.loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-lg font-bold mx-auto animate-pulse">FG</div>
          <p className="text-sm text-gray-400">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">
          FG
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 leading-tight">FitGoal</h1>
          <p className="text-xs text-gray-400 leading-tight">フィットネス & 食事管理</p>
        </div>
        <button
          onClick={store.signOut}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50"
        >
          ログアウト
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20" onScroll={handleScroll}>
        {activeTab === 'dashboard' && (
          <div className="space-y-0">
            <Dashboard
              totalCaloriesIn={store.totalCaloriesIn}
              totalCaloriesBurned={store.totalCaloriesBurned}
              totalProtein={store.totalProtein}
              totalCarbs={store.totalCarbs}
              totalFat={store.totalFat}
              goals={store.state.goals}
              todayWeight={store.todayWeight}
              latestWeight={store.latestWeight}
              onEditGoals={() => setShowGoalEditor(true)}
            />
            <WeightTracker
              entries={store.state.weightEntries}
              goals={store.state.goals}
              onUpsert={store.upsertWeightEntry}
              onRemove={store.removeWeightEntry}
              aiHistory={store.state.aiHistory}
              onRemoveAIHistory={store.removeAIHistory}
            />
          </div>
        )}
        {activeTab === 'food' && (
          <FoodTracker
            entries={store.todayFood}
            foodHistory={store.foodHistory}
            onAdd={store.addFoodEntry}
            onRemove={store.removeFoodEntry}
            totalCalories={store.totalCaloriesIn}
            totalProtein={store.totalProtein}
            totalCarbs={store.totalCarbs}
            totalFat={store.totalFat}
            recentFoods={store.recentFoods}
          />
        )}
        {activeTab === 'training' && (
          <TrainingTracker
            sessions={store.todayTraining}
            onAdd={store.addTrainingSession}
            onRemove={store.removeTrainingSession}
            totalCaloriesBurned={store.totalCaloriesBurned}
            onSaveAdviceHistory={(title, content, date) => handleSaveAIHistory('training', title, content, date)}
            recentExerciseNames={store.recentExerciseNames}
          />
        )}
        {activeTab === 'recipe' && (
          <RecipePlanner
            goals={store.state.goals}
            remainingCalories={store.state.goals.calories - store.totalCaloriesIn + store.totalCaloriesBurned}
            remainingProtein={store.state.goals.protein - store.totalProtein}
            onSaveHistory={(title, content, date) => handleSaveAIHistory('recipe', title, content, date)}
          />
        )}
      </main>

      <BottomNav active={activeTab} onChange={handleTabChange} hidden={navHidden} />

      {showGoalEditor && (
        <GoalEditor
          goals={store.state.goals}
          latestWeight={store.latestWeight}
          onSave={store.updateGoals}
          onClose={() => setShowGoalEditor(false)}
        />
      )}
    </div>
  );
}
