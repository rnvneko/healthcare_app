import type { DailyGoals, WeightEntry } from '../types';

interface Props {
  totalCaloriesIn: number;
  totalCaloriesBurned: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goals: DailyGoals;
  latestWeight?: WeightEntry;
  onEditGoals: () => void;
}

function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="600" fill="#111827">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}g / {max}g</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Dashboard({
  totalCaloriesIn, totalCaloriesBurned, totalProtein, totalCarbs, totalFat, goals, latestWeight, onEditGoals
}: Props) {
  const net = totalCaloriesIn - totalCaloriesBurned;
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">今日のサマリー</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <button
          onClick={onEditGoals}
          className="text-sm text-indigo-600 font-medium border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
        >
          目標設定
        </button>
      </div>

      {/* Calorie Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-700 mb-4">カロリーバランス</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-orange-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-orange-500">{totalCaloriesIn}</div>
            <div className="text-xs text-gray-500 mt-0.5">摂取</div>
            <div className="text-xs text-gray-400">kcal</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-blue-500">{totalCaloriesBurned}</div>
            <div className="text-xs text-gray-500 mt-0.5">消費</div>
            <div className="text-xs text-gray-400">kcal</div>
          </div>
          <div className={`rounded-xl p-3 ${net <= goals.calories ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`text-2xl font-bold ${net <= goals.calories ? 'text-green-500' : 'text-red-500'}`}>{net}</div>
            <div className="text-xs text-gray-500 mt-0.5">純摂取</div>
            <div className="text-xs text-gray-400">kcal</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min((net / goals.calories) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{goals.calories} kcal 目標</span>
        </div>
      </div>

      {/* Weight summary */}
      {latestWeight && (
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">⚖️</div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">最新の体重（{latestWeight.date}）</p>
            <p className="text-2xl font-bold text-gray-900">{latestWeight.weight} <span className="text-sm font-normal text-gray-500">kg</span></p>
            {latestWeight.bodyFat !== undefined && (
              <p className="text-xs text-gray-500">体脂肪率: {latestWeight.bodyFat}%</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">目標まで</p>
            <p className={`text-lg font-bold ${latestWeight.weight > goals.targetWeight ? 'text-red-500' : 'text-green-500'}`}>
              {latestWeight.weight > goals.targetWeight
                ? `-${(latestWeight.weight - goals.targetWeight).toFixed(1)}kg`
                : '達成！🎉'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Rings */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-700 mb-4">目標達成率</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <ProgressRing value={net} max={goals.calories} color="#f97316" />
            <span className="text-xs text-gray-600">カロリー</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ProgressRing value={totalCaloriesBurned} max={500} color="#3b82f6" />
            <span className="text-xs text-gray-600">運動消費</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ProgressRing value={totalProtein} max={goals.protein} color="#8b5cf6" />
            <span className="text-xs text-gray-600">タンパク質</span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-700 mb-4">栄養素</h2>
        <div className="space-y-3">
          <MacroBar label="タンパク質" value={totalProtein} max={goals.protein} color="#8b5cf6" />
          <MacroBar label="炭水化物" value={totalCarbs} max={goals.carbs} color="#f59e0b" />
          <MacroBar label="脂質" value={totalFat} max={goals.fat} color="#ef4444" />
        </div>
      </div>

      {/* Tip */}
      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
        <p className="text-sm text-indigo-700">
          💡 <span className="font-medium">ヒント：</span>
          {net < goals.calories * 0.8
            ? 'もう少し食べても大丈夫です。バランスの良い食事を心がけましょう。'
            : net > goals.calories
            ? '今日のカロリーが目標を超えています。運動を追加してバランスを取りましょう。'
            : '素晴らしい！目標カロリーをうまく管理できています。'}
        </p>
      </div>
    </div>
  );
}
