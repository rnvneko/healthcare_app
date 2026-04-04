import { useState } from 'react';
import type { DailyGoals } from '../types';

interface Props {
  goals: DailyGoals;
  onSave: (goals: DailyGoals) => void;
  onClose: () => void;
}

export default function GoalEditor({ goals, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      calories: Number(form.calories) || 2000,
      protein: Number(form.protein) || 150,
      carbs: Number(form.carbs) || 250,
      fat: Number(form.fat) || 65,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">一日の目標設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'calories', label: '目標カロリー', unit: 'kcal', color: 'text-orange-500' },
            { key: 'protein', label: 'タンパク質目標', unit: 'g', color: 'text-purple-500' },
            { key: 'carbs', label: '炭水化物目標', unit: 'g', color: 'text-amber-500' },
            { key: 'fat', label: '脂質目標', unit: 'g', color: 'text-red-500' },
          ].map(({ key, label, unit, color }) => (
            <div key={key}>
              <label className={`text-sm font-medium ${color} mb-1 block`}>{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-sm text-gray-500 w-8">{unit}</span>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-500 text-white rounded-xl py-3 font-medium hover:bg-indigo-600 transition-colors"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
