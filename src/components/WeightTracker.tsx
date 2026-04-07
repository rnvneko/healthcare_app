import { useState } from 'react';
import type { WeightEntry, DailyGoals, AIHistoryEntry } from '../types';
import { toLocalDateStr, todayStr } from '../lib/dateUtils';
import MarkdownText from './MarkdownText';

interface Props {
  entries: WeightEntry[];
  goals: DailyGoals;
  onUpsert: (entry: Omit<WeightEntry, 'id'>) => void;
  onRemove: (date: string) => void;
  aiHistory: AIHistoryEntry[];
  onRemoveAIHistory: (id: string) => void;
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
  return toLocalDateStr(d);
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
      <line x1={PAD.l} y1={goalY} x2={W - PAD.r} y2={goalY}
        stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <text x={W - PAD.r - 2} y={goalY - 3} fontSize="9" fill="#6366f1" textAnchor="end">目標</text>
      <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {filtered.map((e, i) => (
        <circle key={e.date} cx={xScale(i)} cy={yScale(e.weight)} r="3" fill="#f97316" />
      ))}
      {[minW + 1, (minW + maxW) / 2, maxW - 1].map(v => (
        <text key={v} x={PAD.l - 3} y={yScale(v) + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
          {v.toFixed(1)}
        </text>
      ))}
      <text x={PAD.l} y={H - 4} fontSize="9" fill="#9ca3af" textAnchor="middle">
        {filtered[0].date.slice(5)}
      </text>
      <text x={xScale(filtered.length - 1)} y={H - 4} fontSize="9" fill="#9ca3af" textAnchor="middle">
        {filtered[filtered.length - 1].date.slice(5)}
      </text>
    </svg>
  );
}


// Day detail bottom sheet: weight input + AI entries
function DaySheet({
  date,
  weightEntry,
  aiEntries,
  onSaveWeight,
  onDeleteWeight,
  onRemoveAI,
  onClose,
}: {
  date: string;
  weightEntry?: WeightEntry;
  aiEntries: AIHistoryEntry[];
  onSaveWeight: (entry: Omit<WeightEntry, 'id'>) => void;
  onDeleteWeight: () => void;
  onRemoveAI: (id: string) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    weight: String(weightEntry?.weight ?? ''),
    bmi: String(weightEntry?.bmi ?? ''),
    bodyFat: String(weightEntry?.bodyFat ?? ''),
    bodyWater: String(weightEntry?.bodyWater ?? ''),
    muscleMass: String(weightEntry?.muscleMass ?? ''),
    boneMass: String(weightEntry?.boneMass ?? ''),
    bmr: String(weightEntry?.bmr ?? ''),
    visceralFat: String(weightEntry?.visceralFat ?? ''),
    subcutaneousFat: String(weightEntry?.subcutaneousFat ?? ''),
    proteinRate: String(weightEntry?.proteinRate ?? ''),
    bodyAge: String(weightEntry?.bodyAge ?? ''),
  });
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [showWeightForm, setShowWeightForm] = useState(!weightEntry);

  function handleSaveWeight() {
    if (!values.weight) return;
    const w = Number(values.weight);
    // 体重: 20〜300kg の範囲チェック
    if (w < 20 || w > 300) return;
    const num = (k: string, min: number, max: number) => {
      if (values[k] === '') return undefined;
      const n = Number(values[k]);
      return (n >= min && n <= max) ? n : undefined;
    };
    onSaveWeight({
      date,
      weight: w,
      bmi:             num('bmi', 10, 60),
      bodyFat:         num('bodyFat', 0, 70),
      bodyWater:       num('bodyWater', 0, 100),
      muscleMass:      num('muscleMass', 0, 200),
      boneMass:        num('boneMass', 0, 10),
      bmr:             num('bmr', 500, 5000),
      visceralFat:     num('visceralFat', 0, 30),
      subcutaneousFat: num('subcutaneousFat', 0, 60),
      proteinRate:     num('proteinRate', 0, 50),
      bodyAge:         num('bodyAge', 5, 120),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-bold text-gray-900">{date}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">
          {/* ── Weight section ── */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowWeightForm(v => !v)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>⚖️</span>
                <span className="text-sm font-semibold text-gray-700">体重記録</span>
                {weightEntry && (
                  <span className="text-sm font-bold text-orange-500">{weightEntry.weight} kg</span>
                )}
              </div>
              <span className="text-gray-400 text-xs">{showWeightForm ? '▲' : weightEntry ? '編集▼' : '+ 記録▼'}</span>
            </button>

            {showWeightForm && (
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-orange-500 mb-1 block">体重 (kg) ★</label>
                  <input
                    type="number" step="0.1" min="0" placeholder="例: 75.2"
                    value={values.weight}
                    onChange={e => setValues(v => ({ ...v, weight: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Smart Scale P2 Pro（任意）</p>
                  <div className="grid grid-cols-2 gap-2">
                    {METRICS.map(({ key, label, unit }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 mb-1 block">{label}{unit ? ` (${unit})` : ''}</label>
                        <input
                          type="number" step="0.1" min="0" placeholder="-"
                          value={values[key]}
                          onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {weightEntry && (
                    <button
                      onClick={() => { onDeleteWeight(); onClose(); }}
                      className="px-3 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50"
                    >削除</button>
                  )}
                  <button
                    onClick={handleSaveWeight}
                    disabled={!values.weight}
                    className="flex-1 bg-orange-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-600"
                  >保存する</button>
                </div>
              </div>
            )}
          </div>

          {/* ── AI entries ── */}
          {aiEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">AIプラン</p>
              {aiEntries.map(entry => (
                <div key={entry.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedAI(expandedAI === entry.id ? null : entry.id)}
                    className="w-full flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span>{entry.type === 'recipe' ? '🍽️' : '💪'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.title}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${entry.type === 'recipe' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                      {entry.type === 'recipe' ? 'レシピ' : 'トレーニング'}
                    </span>
                    <span className="text-gray-400 text-xs">{expandedAI === entry.id ? '▲' : '▼'}</span>
                  </button>
                  {expandedAI === entry.id && (
                    <div className="p-3 border-t border-gray-50">
                      <MarkdownText text={entry.content} />
                      <button
                        onClick={() => onRemoveAI(entry.id)}
                        className="mt-2 text-xs text-red-400 hover:text-red-600"
                      >削除する</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {aiEntries.length === 0 && !weightEntry && (
            <p className="text-center text-sm text-gray-400 py-2">この日の記録はありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WeightTracker({ entries, goals, onUpsert, onRemove, aiHistory, onRemoveAIHistory }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [graphRange, setGraphRange] = useState<GraphRange>('30d');

  const entryMap = Object.fromEntries(entries.map(e => [e.date, e]));
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];

  // AI history grouped by registeredDate
  const aiByDate: Record<string, AIHistoryEntry[]> = {};
  for (const h of aiHistory) {
    if (h.registeredDate) {
      if (!aiByDate[h.registeredDate]) aiByDate[h.registeredDate] = [];
      aiByDate[h.registeredDate].push(h);
    }
  }
  const unregisteredAI = aiHistory.filter(h => !h.registeredDate);

  // Calendar grid
  const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
  const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const today = todayStr();

  const calendarDays: (string | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) =>
      toDateStr(new Date(currentMonth.year, currentMonth.month, i + 1))
    ),
  ];
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

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

      {/* Unified Calendar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">カレンダー</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(m => {
                const d = new Date(m.year, m.month - 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            >‹</button>
            <span className="text-sm font-medium text-gray-700 w-20 text-center">
              {currentMonth.year}年{currentMonth.month + 1}月
            </span>
            <button
              onClick={() => setCurrentMonth(m => {
                const d = new Date(m.year, m.month + 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            >›</button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['月', '火', '水', '木', '金', '土', '日'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={i} />;
            const weightEntry = entryMap[date];
            const dayAI = aiByDate[date] ?? [];
            const isToday = date === today;
            const dow = (startDow + parseInt(date.slice(8)) - 1) % 7;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center py-1 px-0.5 rounded-xl transition-colors min-h-[44px] justify-start pt-1.5 ${
                  isToday ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs leading-none mb-0.5 ${
                  isToday ? 'font-bold text-indigo-600' :
                  dow === 5 ? 'text-blue-500' :
                  dow === 6 ? 'text-red-500' :
                  'text-gray-600'
                }`}>
                  {new Date(date + 'T00:00:00').getDate()}
                </span>
                {weightEntry && (
                  <span className="text-xs font-semibold text-orange-500 leading-tight">
                    {weightEntry.weight}
                  </span>
                )}
                {dayAI.length > 0 && (
                  <span className="flex gap-0.5 mt-0.5">
                    {dayAI.slice(0, 3).map((e, j) => (
                      <span key={j} className={`w-1.5 h-1.5 rounded-full ${e.type === 'recipe' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-orange-500 font-semibold">75.0 = 体重(kg)</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />レシピ</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />トレーニング</span>
        </div>

        <button
          onClick={() => setSelectedDate(today)}
          className="mt-3 w-full text-sm text-indigo-600 font-medium border border-indigo-200 rounded-xl py-2 hover:bg-indigo-50"
        >
          + 今日の体重を記録
        </button>
      </div>

      {/* Unregistered AI history */}
      {unregisteredAI.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700">未登録のAI生成履歴</p>
          <p className="text-xs text-gray-400">カレンダーに登録するには、レシピ・トレーニングタブの「📅 登録」ボタンから日付を指定してください</p>
          {unregisteredAI.map(entry => (
            <div key={entry.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span>{entry.type === 'recipe' ? '🍽️' : '💪'}</span>
              <p className="flex-1 text-sm text-gray-700 truncate">{entry.title}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${entry.type === 'recipe' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {entry.type === 'recipe' ? 'レシピ' : 'トレーニング'}
              </span>
              <button onClick={() => onRemoveAIHistory(entry.id)} className="text-gray-300 hover:text-red-400 text-sm">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Day detail sheet */}
      {selectedDate && (
        <DaySheet
          date={selectedDate}
          weightEntry={entryMap[selectedDate]}
          aiEntries={aiByDate[selectedDate] ?? []}
          onSaveWeight={onUpsert}
          onDeleteWeight={() => onRemove(selectedDate)}
          onRemoveAI={onRemoveAIHistory}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
