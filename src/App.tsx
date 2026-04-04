import { useState, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import Dashboard from './components/Dashboard';
import FoodTracker from './components/FoodTracker';
import TrainingTracker from './components/TrainingTracker';
import WeightTracker from './components/WeightTracker';
import RecipePlanner from './components/RecipePlanner';
import AICalendar from './components/AICalendar';
import BottomNav, { type Tab } from './components/BottomNav';
import GoalEditor from './components/GoalEditor';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const store = useStore();

  const lastScrollY = useRef(0);
  const scrollThreshold = useRef(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    const delta = currentY - lastScrollY.current;

    scrollThreshold.current += delta;
    if (scrollThreshold.current > 40) {
      setNavHidden(true);
      scrollThreshold.current = 0;
    } else if (scrollThreshold.current < -20 || currentY < 50) {
      setNavHidden(false);
      scrollThreshold.current = 0;
    }
    lastScrollY.current = currentY;
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setNavHidden(false);
    scrollThreshold.current = 0;
  }, []);

  function handleSaveAIHistory(type: 'recipe' | 'training', title: string, content: string, date: string) {
    store.addAIHistory({ type, title, content, registeredDate: date });
  }

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
            {/* AI Calendar */}
            <div className="px-4 pb-4">
              <AICalendar
                entries={store.state.aiHistory}
                onRemove={store.removeAIHistory}
              />
            </div>
            {/* Weight Tracker */}
            <WeightTracker
              entries={store.state.weightEntries}
              goals={store.state.goals}
              onUpsert={store.upsertWeightEntry}
              onRemove={store.removeWeightEntry}
            />
          </div>
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
            onSaveAdviceHistory={(title, content, date) => handleSaveAIHistory('training', title, content, date)}
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
