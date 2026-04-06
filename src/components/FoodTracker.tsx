import { useState } from 'react';
import type { FoodEntry } from '../types';

interface Props {
  entries: FoodEntry[];
  onAdd: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onRemove: (id: string) => void;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  recentFoods: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number }>;
}

const PRESETS = [
  { name: '白米（150g）', calories: 252, protein: 4, carbs: 56, fat: 0 },
  { name: '鶏むね肉（100g）', calories: 116, protein: 23, carbs: 0, fat: 2 },
  { name: '卵（1個）', calories: 76, protein: 6, carbs: 0, fat: 5 },
  { name: 'プロテインシェイク', calories: 120, protein: 25, carbs: 5, fat: 1 },
  { name: 'バナナ（1本）', calories: 86, protein: 1, carbs: 22, fat: 0 },
  { name: 'サーモン（100g）', calories: 208, protein: 20, carbs: 0, fat: 13 },
];

const emptyForm = { name: '', calories: '', protein: '', carbs: '', fat: '' };
const DRAFT_KEY = 'food_form_draft';

export default function FoodTracker({ entries, onAdd, onRemove, totalCalories, totalProtein, totalCarbs, totalFat, recentFoods }: Props) {
  const [showForm, setShowForm] = useState(() => !!sessionStorage.getItem(DRAFT_KEY));
  const [form, setForm] = useState<typeof emptyForm>(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : emptyForm;
  });

  // Persist draft to sessionStorage on every change
  const updateForm = (updater: (prev: typeof emptyForm) => typeof emptyForm) => {
    setForm(prev => {
      const next = updater(prev);
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  };

  function handlePreset(preset: { name: string; calories: number; protein: number; carbs: number; fat: number }) {
    const next = {
      name: preset.name,
      calories: String(preset.calories),
      protein: String(preset.protein),
      carbs: String(preset.carbs),
      fat: String(preset.fat),
    };
    setForm(next);
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.calories) return;
    onAdd({
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    });
    setForm(emptyForm);
    sessionStorage.removeItem(DRAFT_KEY);
    setShowForm(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">食事記録</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-orange-600 active:scale-95 transition-transform"
        >
          {showForm ? 'キャンセル' : '+ 追加'}
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'カロリー', value: `${totalCalories}kcal`, color: 'bg-orange-100 text-orange-700' },
          { label: 'タンパク', value: `${totalProtein}g`, color: 'bg-purple-100 text-purple-700' },
          { label: '炭水化', value: `${totalCarbs}g`, color: 'bg-amber-100 text-amber-700' },
          { label: '脂質', value: `${totalFat}g`, color: 'bg-red-100 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-2 text-center`}>
            <div className="font-bold text-sm">{value}</div>
            <div className="text-xs opacity-70">{label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3">食品を追加</h2>

          {/* Recent history quick-add */}
          {recentFoods.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">過去の記録から追加</p>
              <div className="flex flex-wrap gap-2">
                {recentFoods.map(f => (
                  <button
                    key={f.name}
                    onClick={() => handlePreset(f)}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-2 py-1 transition-colors"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Built-in presets */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">プリセット</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => handlePreset(p)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="食品名"
              value={form.name}
              onChange={e => updateForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">カロリー (kcal) *</label>
                <input
                  required type="number" min="0" placeholder="0"
                  value={form.calories}
                  onChange={e => updateForm(f => ({ ...f, calories: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">タンパク質 (g)</label>
                <input
                  type="number" min="0" placeholder="0"
                  value={form.protein}
                  onChange={e => updateForm(f => ({ ...f, protein: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">炭水化物 (g)</label>
                <input
                  type="number" min="0" placeholder="0"
                  value={form.carbs}
                  onChange={e => updateForm(f => ({ ...f, carbs: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">脂質 (g)</label>
                <input
                  type="number" min="0" placeholder="0"
                  value={form.fat}
                  onChange={e => updateForm(f => ({ ...f, fat: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-white rounded-xl py-2.5 font-medium hover:bg-orange-600 transition-colors"
            >
              追加する
            </button>
          </form>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-sm">今日の食事記録はありません</p>
            <p className="text-xs mt-1">上の「+ 追加」ボタンから記録しましょう</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                🍱
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{entry.name}</p>
                <p className="text-xs text-gray-500">
                  {entry.calories}kcal · P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g
                </p>
              </div>
              <button
                onClick={() => onRemove(entry.id)}
                className="text-gray-300 hover:text-red-400 transition-colors text-lg px-1"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
