import { useState } from 'react';
import type { DailyGoals, WeightEntry } from '../types';
import { todayStr } from '../lib/dateUtils';

interface Props {
  goals: DailyGoals;
  latestWeight?: WeightEntry;
  onSave: (goals: DailyGoals) => void;
  onClose: () => void;
}

const ACTIVITY_LEVELS = [
  { value: 'sedentary',  label: '座り仕事中心', desc: 'ほぼ運動なし',       multiplier: 1.2 },
  { value: 'light',      label: '軽い活動',    desc: '週1〜2回の運動',      multiplier: 1.375 },
  { value: 'moderate',   label: '中程度の活動', desc: '週3〜5回の運動',     multiplier: 1.55 },
  { value: 'active',     label: 'アクティブ',  desc: '毎日ハードな運動',    multiplier: 1.725 },
  { value: 'veryActive', label: '非常に活動的', desc: '1日2回 or 肉体労働', multiplier: 1.9 },
];

function calcNutrition(
  currentWeight: number,
  currentBodyFat: number | undefined,
  targetWeight: number,
  _targetBodyFat: number | undefined,
  targetDate: string,
  activityLevel: string,
): { calories: number; protein: number; carbs: number; fat: number } | null {
  if (!currentWeight || !targetWeight || !targetDate) return null;

  const today = new Date();
  const target = new Date(targetDate);
  const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return null;

  // BMR rough estimate (~22 kcal per kg body weight, unisex approximation)
  const bmr = 22 * currentWeight;
  const multiplier = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.multiplier ?? 1.375;
  const tdee = bmr * multiplier;

  // Calorie adjustment to reach target weight by target date
  const weightDiff = currentWeight - targetWeight; // positive = cut, negative = bulk
  const dailyAdjustment = (weightDiff * 7700) / days;
  // Cap: max deficit -1000 kcal/day, max surplus +500 kcal/day
  const capped = Math.max(-500, Math.min(1000, dailyAdjustment));
  const calories = Math.round(Math.max(1200, tdee - capped));

  // Protein: 2g per kg lean mass (or target weight if body fat unknown)
  const leanMass = currentBodyFat !== undefined
    ? currentWeight * (1 - currentBodyFat / 100)
    : targetWeight;
  const protein = Math.round(leanMass * 2.0);

  // Fat: 25% of calories
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remaining calories
  const carbCals = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = Math.round(carbCals / 4);

  return { calories, protein, carbs, fat };
}

export default function GoalEditor({ goals, latestWeight, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    calories:      String(goals.calories),
    protein:       String(goals.protein),
    carbs:         String(goals.carbs),
    fat:           String(goals.fat),
    targetWeight:  String(goals.targetWeight),
    targetBodyFat: String(goals.targetBodyFat ?? ''),
    targetDate:    goals.targetDate ?? '',
    activityLevel: goals.activityLevel ?? 'moderate',
    // auto-calc inputs (pre-fill from latest weight entry)
    currentWeight:  String(latestWeight?.weight ?? ''),
    currentBodyFat: String(latestWeight?.bodyFat ?? ''),
  });

  const [calcResult, setCalcResult] = useState<{
    calories: number; protein: number; carbs: number; fat: number;
  } | null>(null);
  const [calcError, setCalcError] = useState('');

  function handleAutoCalc() {
    setCalcError('');
    const cw = parseFloat(form.currentWeight);
    const tw = parseFloat(form.targetWeight);
    if (!cw || !tw || !form.targetDate) {
      setCalcError('現在体重・目標体重・目標日付を入力してください');
      return;
    }
    if (cw < 20 || cw > 300 || tw < 20 || tw > 300) {
      setCalcError('体重は20〜300kgの範囲で入力してください');
      return;
    }
    if (new Date(form.targetDate) <= new Date()) {
      setCalcError('目標日付は今日より後の日付を設定してください');
      return;
    }
    const result = calcNutrition(
      cw,
      form.currentBodyFat ? parseFloat(form.currentBodyFat) : undefined,
      tw,
      form.targetBodyFat ? parseFloat(form.targetBodyFat) : undefined,
      form.targetDate,
      form.activityLevel,
    );
    if (!result) {
      setCalcError('目標日付は今日より後の日付を設定してください');
      return;
    }
    setCalcResult(result);
    setForm(f => ({
      ...f,
      calories: String(result.calories),
      protein:  String(result.protein),
      carbs:    String(result.carbs),
      fat:      String(result.fat),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      calories:      Number(form.calories)      || 2000,
      protein:       Number(form.protein)       || 150,
      carbs:         Number(form.carbs)         || 250,
      fat:           Number(form.fat)           || 65,
      targetWeight:  Number(form.targetWeight)  || 70,
      targetBodyFat: form.targetBodyFat ? Number(form.targetBodyFat) : undefined,
      targetDate:    form.targetDate || undefined,
      activityLevel: form.activityLevel,
    });
    onClose();
  }

  const today = todayStr();
  const daysUntilTarget = form.targetDate
    ? Math.round((new Date(form.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const nutritionFields = [
    { key: 'calories', label: '目標カロリー', unit: 'kcal', color: 'text-orange-500' },
    { key: 'protein',  label: 'タンパク質目標', unit: 'g',   color: 'text-purple-500' },
    { key: 'carbs',    label: '炭水化物目標',  unit: 'g',   color: 'text-amber-500' },
    { key: 'fat',      label: '脂質目標',      unit: 'g',   color: 'text-red-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">目標設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Auto-calc section ── */}
          <div className="bg-indigo-50 rounded-2xl p-4 space-y-3 border border-indigo-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🤖</span>
              <p className="text-sm font-semibold text-indigo-700">栄養目標を自動計算</p>
            </div>

            {/* Current stats */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">現在の体重 (kg)</label>
                <input
                  type="number" step="0.1" min="0" placeholder="例: 75.0"
                  value={form.currentWeight}
                  onChange={e => setForm(f => ({ ...f, currentWeight: e.target.value }))}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">現在の体脂肪率 (%)</label>
                <input
                  type="number" step="0.1" min="0" max="100" placeholder="任意"
                  value={form.currentBodyFat}
                  onChange={e => setForm(f => ({ ...f, currentBodyFat: e.target.value }))}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
            </div>

            {/* Target stats */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">目標体重 (kg)</label>
                <input
                  type="number" step="0.1" min="0" placeholder="例: 65.0"
                  value={form.targetWeight}
                  onChange={e => setForm(f => ({ ...f, targetWeight: e.target.value }))}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">目標体脂肪率 (%)</label>
                <input
                  type="number" step="0.1" min="0" max="100" placeholder="任意"
                  value={form.targetBodyFat}
                  onChange={e => setForm(f => ({ ...f, targetBodyFat: e.target.value }))}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
            </div>

            {/* Target date */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">目標達成日</label>
              <input
                type="date"
                min={today}
                value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
              {daysUntilTarget !== null && daysUntilTarget > 0 && (
                <p className="text-xs text-indigo-500 mt-1">あと {daysUntilTarget} 日</p>
              )}
            </div>

            {/* Activity level */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">活動レベル</label>
              <div className="space-y-1.5">
                {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
                  <label key={value} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    form.activityLevel === value
                      ? 'border-indigo-400 bg-white'
                      : 'border-indigo-100 bg-white/60 hover:bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="activityLevel"
                      value={value}
                      checked={form.activityLevel === value}
                      onChange={() => setForm(f => ({ ...f, activityLevel: value }))}
                      className="accent-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {calcError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{calcError}</p>
            )}

            {calcResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                <p className="font-semibold text-green-700 mb-1.5">✅ 計算結果</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                  <span>カロリー</span><span className="font-bold text-orange-600">{calcResult.calories} kcal</span>
                  <span>タンパク質</span><span className="font-bold text-purple-600">{calcResult.protein} g</span>
                  <span>炭水化物</span><span className="font-bold text-amber-600">{calcResult.carbs} g</span>
                  <span>脂質</span><span className="font-bold text-red-500">{calcResult.fat} g</span>
                </div>
                <p className="text-xs text-green-600 mt-2">↓ 下の栄養目標に反映済みです。調整してから保存できます。</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleAutoCalc}
              className="w-full bg-indigo-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-600 transition-colors"
            >
              🧮 栄養目標を自動計算する
            </button>
          </div>

          {/* ── Manual nutrition goals ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">一日の栄養目標（手動調整可）</p>
            <div className="space-y-3">
              {nutritionFields.map(({ key, label, unit, color }) => (
                <div key={key}>
                  <label className={`text-sm font-medium ${color} mb-1 block`}>{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0"
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <span className="text-sm text-gray-500 w-10">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
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
