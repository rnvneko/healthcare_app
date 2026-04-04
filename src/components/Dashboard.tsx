import type { DailyGoals, WeightEntry } from '../types';

interface Props {
  totalCaloriesIn: number;
  totalCaloriesBurned: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goals: DailyGoals;
  todayWeight?: WeightEntry;
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

const METRIC_DEFS: { key: keyof Omit<WeightEntry, 'id' | 'date' | 'weight'>; label: string; unit: string; color: string }[] = [
  { key: 'bodyFat',        label: '体脂肪率',       unit: '%',   color: 'text-red-500' },
  { key: 'muscleMass',     label: '筋肉量',          unit: 'kg',  color: 'text-blue-500' },
  { key: 'bodyWater',      label: '体水分率',        unit: '%',   color: 'text-cyan-500' },
  { key: 'bmi',            label: 'BMI',             unit: '',    color: 'text-indigo-500' },
  { key: 'bmr',            label: '基礎代謝',        unit: 'kcal',color: 'text-orange-500' },
  { key: 'visceralFat',    label: '内臓脂肪',        unit: 'lv',  color: 'text-amber-500' },
  { key: 'boneMass',       label: '骨量',            unit: 'kg',  color: 'text-purple-500' },
  { key: 'subcutaneousFat',label: '皮下脂肪率',      unit: '%',   color: 'text-pink-500' },
  { key: 'proteinRate',    label: 'タンパク質率',    unit: '%',   color: 'text-green-500' },
  { key: 'bodyAge',        label: '体年齢',          unit: '歳',  color: 'text-teal-500' },
];

export default function Dashboard({
  totalCaloriesIn, totalCaloriesBurned, totalProtein, totalCarbs, totalFat,
  goals, todayWeight, latestWeight, onEditGoals
}: Props) {
  const net = totalCaloriesIn - totalCaloriesBurned;
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // 表示する体重エントリ：当日 > 最新
  const displayWeight = todayWeight ?? latestWeight;
  const isTodayWeight = !!todayWeight;

  const filledMetrics = displayWeight
    ? METRIC_DEFS.filter(m => displayWeight[m.key] !== undefined)
    : [];

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

      {/* Body metrics card */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">⚖️ 体重・身体データ</h2>
          {displayWeight && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isTodayWeight ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {isTodayWeight ? '本日計測' : `最新 ${displayWeight.date}`}
            </span>
          )}
        </div>

        {displayWeight ? (
          <>
            {/* Weight + goal diff */}
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">体重</p>
                <p className="text-4xl font-bold text-gray-900 leading-none">
                  {displayWeight.weight}
                  <span className="text-lg font-normal text-gray-400 ml-1">kg</span>
                </p>
              </div>
              <div className="pb-1">
                <p className="text-xs text-gray-400 mb-0.5">目標まで</p>
                <p className={`text-xl font-bold ${displayWeight.weight > goals.targetWeight ? 'text-red-500' : 'text-green-500'}`}>
                  {displayWeight.weight > goals.targetWeight
                    ? `あと ${(displayWeight.weight - goals.targetWeight).toFixed(1)} kg`
                    : '目標達成！🎉'}
                </p>
              </div>
            </div>

            {/* Weight progress bar */}
            {displayWeight.weight > goals.targetWeight && (
              <div className="mb-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full"
                    style={{
                      width: `${Math.max(5, Math.min(95, (goals.targetWeight / displayWeight.weight) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>目標 {goals.targetWeight}kg</span>
                  <span>現在 {displayWeight.weight}kg</span>
                </div>
              </div>
            )}

            {/* Other metrics grid */}
            {filledMetrics.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {filledMetrics.map(({ key, label, unit, color }) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className={`text-base font-bold ${color}`}>
                      {displayWeight[key]}{unit}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-400">
            <p className="text-3xl mb-2">⚖️</p>
            <p className="text-sm">体重が記録されていません</p>
            <p className="text-xs mt-1">「📅 体重」タブから記録しましょう</p>
          </div>
        )}
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
