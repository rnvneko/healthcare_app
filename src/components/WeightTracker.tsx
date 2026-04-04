import { useState } from 'react';
import type { WeightEntry, DailyGoals } from '../types';

interface Props {
  entries: WeightEntry[];
  goals: DailyGoals;
  onUpsert: (entry: Omit<WeightEntry, 'id'>) => void;
  onRemove: (date: string) => void;
}

type GraphRange = '7d' | '30d' | 'all';

const METRICS: { key: keyof Omit<WeightEntry, 'id' | 'date' | 'weight'>; label: string; unit: string }[] = [
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'bodyFat', label: '体脂肪率', unit: '%' },
  { key: 'bodyWater', label: '体水分率', unit: '%' },
  { key: 'muscleMass', label: '筋肉量', unit: 'kg' },
  { key: 'boneMass', label: '骨量', unit: 'kg' },
  { key: 'bmr', label: '基礎代謝量', unit: 'kcal' },
  { key: 'visceralFat', label: '内臓脂肪レベル', unit: '' },
  { key: 'subcutaneousFat', label: '皮下脂肪率', unit: '%' },
  { key: 'proteinRate', label: 'タンパク質率', unit: '%' },
  { key: 'bodyAge', label: '体年齢', unit: '歳' },
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function WeightGraph({ entries, goal, range }: { entries: WeightEntry[]; goal: number; range: GraphRange }) {
  const now = new Date();
  const cutoff = range === '7d'
    ? new Date(now.getTime() - 6 * 86400000)
    : range === '30d'
    ? new Date(now.getTime() - 29 * 86400000)
    : null;

  const filtered = entries
    .filter(e => !cutoff || e.date >= toDateStr(cutoff))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        データが2件以上あるとグラフが表示されます
      </div>
    );
  }

  const W = 320, H = 120, PAD = { t: 12, b: 24, l: 36, r: 12 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const weights = filtered.map(e => e.weight);
  const minW = Math.min(...weights, goal) - 1;
  const maxW = Math.max(...weights, goal) + 1;

  const xScale = (i: number) => PAD.l + (i / (filtered.length - 1)) * chartW;
  const yScale = (w: number) => PAD.t + (1 - (w - minW) / (maxW - minW)) * chartH;

  const linePath = filtered.map((e, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(e.weight)}`).join(' ');
  const goalY = yScale(goal);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 140 }}>
      {/* Goal line */}
      <line x1={PAD.l} y1={goalY} x2={W - PAD.r} y2={goalY}
        stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <text x={W - PAD.r - 2} y={goalY - 3} fontSize="9" fill="#6366f1" textAnchor="end">目標</text>

      {/* Weight line */}
      <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {filtered.map((e, i) => (
        <circle key={e.date} cx={xScale(i)} cy={yScale(e.weight)} r="3" fill="#f97316" />
      ))}

      {/* Y axis labels */}
      {[minW + 1, (minW + maxW) / 2, maxW - 1].map(v => (
        <text key={v} x={PAD.l - 3} y={yScale(v) + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
          {v.toFixed(1)}
        </text>
      ))}

      {/* X axis labels (first and last) */}
      <text x={PAD.l} y={H - 4} fontSize="9" fill="#9ca3af" textAnchor="middle">
        {filtered[0].date.slice(5)}
      </text>
      <text x={xScale(filtered.length - 1)} y={H - 4} fontSize="9" fill="#9ca3af" textAnchor="middle">
        {filtered[filtered.length - 1].date.slice(5)}
      </text>
    </svg>
  );
}

function WeightInputForm({
  date,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  date: string;
  initial?: WeightEntry;
  onSave: (entry: Omit<WeightEntry, 'id'>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    weight: String(initial?.weight ?? ''),
    bmi: String(initial?.bmi ?? ''),
    bodyFat: String(initial?.bodyFat ?? ''),
    bodyWater: String(initial?.bodyWater ?? ''),
    muscleMass: String(initial?.muscleMass ?? ''),
    boneMass: String(initial?.boneMass ?? ''),
    bmr: String(initial?.bmr ?? ''),
    visceralFat: String(initial?.visceralFat ?? ''),
    subcutaneousFat: String(initial?.subcutaneousFat ?? ''),
    proteinRate: String(initial?.proteinRate ?? ''),
    bodyAge: String(initial?.bodyAge ?? ''),
  });

  function handleSave() {
    if (!values.weight) return;
    const num = (k: string) => values[k] !== '' ? Number(values[k]) : undefined;
    onSave({
      date,
      weight: Number(values.weight),
      bmi: num('bmi'),
      bodyFat: num('bodyFat'),
      bodyWater: num('bodyWater'),
      muscleMass: num('muscleMass'),
      boneMass: num('boneMass'),
      bmr: num('bmr'),
      visceralFat: num('visceralFat'),
      subcutaneousFat: num('subcutaneousFat'),
      proteinRate: num('proteinRate'),
      bodyAge: num('bodyAge'),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{date} の記録</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        {/* Weight (required) */}
        <div>
          <label className="text-sm font-medium text-orange-500 mb-1 block">体重 (kg) ★</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="例: 75.2"
            value={values.weight}
            onChange={e => setValues(v => ({ ...v, weight: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Optional metrics */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Smart Scale P2 Pro 計測値（任意）</p>
          <div className="grid grid-cols-2 gap-2">
            {METRICS.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}{unit ? ` (${unit})` : ''}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="-"
                  value={values[key]}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {initial && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50"
            >
              削除
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!values.weight}
            className="flex-1 bg-orange-500 disabled:opacity-50 text-white rounded-xl py-2.5 font-medium hover:bg-orange-600"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeightTracker({ entries, goals, onUpsert, onRemove }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [graphRange, setGraphRange] = useState<GraphRange>('30d');

  const entryMap = Object.fromEntries(entries.map(e => [e.date, e]));
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];

  // Calendar
  const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
  const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const today = toDateStr(new Date());

  const calendarDays: (string | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = new Date(currentMonth.year, currentMonth.month, i + 1);
      return toDateStr(d);
    }),
  ];
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const selectedEntry = selectedDate ? entryMap[selectedDate] : undefined;

  // Progress
  const diff = latest ? latest.weight - goals.targetWeight : null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">体重管理</h1>

      {/* Goal progress */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">現在の体重</p>
            <p className="text-3xl font-bold text-gray-900">
              {latest ? `${latest.weight}` : '---'}
              <span className="text-base font-normal text-gray-500"> kg</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">目標体重</p>
            <p className="text-xl font-semibold text-indigo-600">{goals.targetWeight} kg</p>
            {diff !== null && (
              <p className={`text-sm font-medium ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {diff > 0 ? `あと ${diff.toFixed(1)}kg` : `目標達成！🎉`}
              </p>
            )}
          </div>
        </div>
        {diff !== null && diff > 0 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.max(5, 100 - (diff / (latest!.weight - goals.targetWeight + diff)) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Latest metrics */}
      {latest && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-2">最新の計測値（{latest.date}）</p>
          <div className="grid grid-cols-3 gap-2">
            {METRICS.filter(m => latest[m.key] !== undefined).map(({ key, label, unit }) => (
              <div key={key} className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-base font-bold text-gray-800">{latest[key]}{unit}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graph */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">体重推移</h2>
          <div className="flex gap-1">
            {(['7d', '30d', 'all'] as GraphRange[]).map(r => (
              <button
                key={r}
                onClick={() => setGraphRange(r)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  graphRange === r ? 'bg-indigo-500 text-white border-indigo-500' : 'text-gray-500 border-gray-200'
                }`}
              >
                {r === '7d' ? '7日' : r === '30d' ? '30日' : '全期間'}
              </button>
            ))}
          </div>
        </div>
        <WeightGraph entries={entries} goal={goals.targetWeight} range={graphRange} />
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(m => {
              const d = new Date(m.year, m.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >◀</button>
          <h2 className="text-sm font-semibold text-gray-700">
            {currentMonth.year}年{currentMonth.month + 1}月
          </h2>
          <button
            onClick={() => setCurrentMonth(m => {
              const d = new Date(m.year, m.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >▶</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['月', '火', '水', '木', '金', '土', '日'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={i} />;
            const entry = entryMap[date];
            const isToday = date === today;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
                  isToday ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs ${isToday ? 'font-bold text-indigo-600' : 'text-gray-600'}`}>
                  {new Date(date).getDate()}
                </span>
                {entry ? (
                  <span className="text-xs font-medium text-orange-500 leading-tight">{entry.weight}</span>
                ) : (
                  <span className="text-xs text-gray-200">·</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedDate(today)}
          className="mt-3 w-full text-sm text-indigo-600 font-medium border border-indigo-200 rounded-xl py-2 hover:bg-indigo-50"
        >
          + 今日の体重を記録
        </button>
      </div>

      {/* Input modal */}
      {selectedDate && (
        <WeightInputForm
          date={selectedDate}
          initial={selectedEntry}
          onSave={onUpsert}
          onDelete={() => onRemove(selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
