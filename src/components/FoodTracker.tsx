import { useState, useEffect } from 'react';
import type { FoodEntry } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string;
  entries: FoodEntry[];
  foodHistory: { date: string; entries: FoodEntry[] }[];
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

export default function FoodTracker({ userId, entries, foodHistory, onAdd, onRemove, totalCalories, totalProtein, totalCarbs, totalFat, recentFoods }: Props) {
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
    if (!form.name.trim() || !form.calories) return;
    const cal = Number(form.calories);
    const pro = Number(form.protein) || 0;
    const carb = Number(form.carbs) || 0;
    const fat = Number(form.fat) || 0;
    // 入力バリデーション
    if (cal < 0 || cal > 10000) return;
    if (pro < 0 || pro > 1000 || carb < 0 || carb > 1000 || fat < 0 || fat > 1000) return;
    onAdd({ name: form.name.trim().slice(0, 100), calories: cal, protein: pro, carbs: carb, fat });
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

      {/* Today entries */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-sm">今日の食事記録はありません</p>
            <p className="text-xs mt-1">上の「+ 追加」ボタンから記録しましょう</p>
          </div>
        ) : (
          entries.map(entry => (
            <FoodEntryRow key={entry.id} entry={entry} onRemove={() => onRemove(entry.id)} />
          ))
        )}
      </div>

      {/* Past history */}
      <PastFoodHistory userId={userId} recentHistory={foodHistory} />
    </div>
  );
}

function FoodEntryRow({ entry, onRemove }: { entry: FoodEntry; onRemove: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🍱</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{entry.name}</p>
        <p className="text-xs text-gray-500">{entry.calories}kcal · P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g</p>
      </div>
      <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors text-lg px-1">×</button>
    </div>
  );
}

// ── Past food history with month navigation ─────────────────────────────────

function groupByDate(entries: FoodEntry[]) {
  const map: Record<string, FoodEntry[]> = {};
  for (const e of entries) {
    const d = e.timestamp.slice(0, 10);
    if (!map[d]) map[d] = [];
    map[d].push(e);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({ date, entries }));
}

function PastFoodHistory({
  userId,
  recentHistory,
}: {
  userId: string;
  recentHistory: { date: string; entries: FoodEntry[] }[];
}) {
  const now = new Date();
  // Default to previous month (today is in current month, shown separately)
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [year, setYear] = useState(prevYear);
  const [month, setMonth] = useState(prevMonth); // 0-indexed
  const [fetched, setFetched] = useState<Record<string, FoodEntry[]>>({}); // cache: "YYYY-MM" → entries
  const [loading, setLoading] = useState(false);
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  const isCurrentMonth = year === currentYear && month === currentMonth;

  // Determine entries to show
  const displayGroups: { date: string; entries: FoodEntry[] }[] = isCurrentMonth
    ? recentHistory.filter(g => g.date.startsWith(key))
    : (fetched[key] ? groupByDate(fetched[key]) : []);

  // Fetch when month changes (skip current month — already loaded)
  useEffect(() => {
    if (isCurrentMonth) return;
    if (fetched[key]) return; // already cached
    fetchMonth();
  }, [key]);

  async function fetchMonth() {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: FoodEntry[] = (data ?? []).map((r: any) => ({
      id: r.id, name: r.name, calories: Number(r.calories),
      protein: Number(r.protein), carbs: Number(r.carbs), fat: Number(r.fat),
      timestamp: r.timestamp,
    }));
    setFetched(prev => ({ ...prev, [key]: entries }));
    setLoading(false);
  }

  function prevMonthNav() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonthNav() {
    // Don't navigate past current month
    if (year === currentYear && month === currentMonth) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function toggleDate(date: string) {
    setOpenDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  const isAtCurrentMonth = year === currentYear && month === currentMonth;

  return (
    <div className="space-y-2">
      {/* Month navigator */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500">過去の食事記録</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonthNav}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >‹</button>
          <span className="text-sm font-medium text-gray-700 w-20 text-center">
            {year}年{month + 1}月
          </span>
          <button
            onClick={nextMonthNav}
            disabled={isAtCurrentMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
          >›</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400">読み込み中...</div>
      ) : displayGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400">
          {year}年{month + 1}月の記録はありません
        </div>
      ) : (
        displayGroups.map(({ date, entries }) => {
          const totalCal = entries.reduce((s, e) => s + e.calories, 0);
          const isOpen = openDates.has(date);
          const [y, m, d] = date.split('-');
          return (
            <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleDate(date)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{y}年{Number(m)}/{Number(d)}（{totalCal}kcal）</span>
                  <span className="text-xs text-gray-400">{entries.length}件</span>
                </div>
                <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-50 pt-2">
                  {entries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-base flex-shrink-0">🍱</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{entry.name}</p>
                        <p className="text-xs text-gray-400">{entry.calories}kcal · P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
