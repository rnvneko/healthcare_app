import type { DailyGoals } from '../types';

interface Props {
  goals: DailyGoals;
  onSave: (goals: DailyGoals) => void;
  onClose: () => void;
}

import { useState } from 'react';

export default function GoalEditor({ goals, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
    targetWeight: String(goals.targetWeight),
    targetBodyFat: String(goals.targetBodyFat ?? ''),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      calories: Number(form.calories) || 2000,
      protein: Number(form.protein) || 150,
      carbs: Number(form.carbs) || 250,
      fat: Number(form.fat) || 65,
      targetWeight: Number(form.targetWeight) || 70,
      targetBodyFat: form.targetBodyFat ? Number(form.targetBodyFat) : undefined,
    });
    onClose();
  }

  const nutritionFields = [
    { key: 'calories', label: '目標カロリー', unit: 'kcal', color: 'text-orange-500' },
    { key: 'protein', label: 'タンパク質目標', unit: 'g', color: 'text-purple-500' },
    { key: 'carbs', label: '炭水化物目標', unit: 'g', color: 'text-amber-500' },
    { key: 'fat', label: '脂質目標', unit: 'g', color: 'text-red-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">目標設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Body goals */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">体型目標</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-indigo-500 mb-1 block">目標体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.targetWeight}
                  onChange={e => setForm(f => ({ ...f, targetWeight: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-indigo-400 mb-1 block">目標体脂肪率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="任意"
                  value={form.targetBodyFat}
                  onChange={e => setForm(f => ({ ...f, targetBodyFat: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>

          {/* Nutrition goals */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">一日の栄養目標</p>
            <div className="space-y-3">
              {nutritionFields.map(({ key, label, unit, color }) => (
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
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-500 text-white rounded-xl py-3 font-medium hover:bg-indigo-600"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
