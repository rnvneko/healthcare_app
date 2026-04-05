import { useState } from 'react';
import type { AIHistoryEntry } from '../types';
import { toLocalDateStr } from '../lib/dateUtils';

interface Props {
  entries: AIHistoryEntry[];
  onRemove: (id: string) => void;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-700">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-gray-800 mt-2 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('| ') && line.includes('|')) {
          const cells = line.split('|').filter(c => c.trim());
          if (cells[0]?.includes('---')) return null;
          return (
            <div key={i} className="flex gap-3 bg-gray-50 rounded px-3 py-1">
              {cells.map((c, j) => (
                <span key={j} className={j === 0 ? 'text-gray-500 w-24 text-xs' : 'font-medium text-gray-800 text-xs'}>{c.trim()}</span>
              ))}
            </div>
          );
        }
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700 text-xs">{line.slice(2)}</li>;
        if (/^\d+\./.test(line)) return <p key={i} className="ml-4 text-gray-700 text-xs">{line}</p>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-gray-700 text-xs">{line}</p>;
      })}
    </div>
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  // 0=Sun → convert to Mon-start (0=Mon...6=Sun)
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}

export default function AICalendar({ entries, onRemove }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = toLocalDateStr(today);

  // Group registered entries by date
  const byDate: Record<string, AIHistoryEntry[]> = {};
  for (const e of entries) {
    if (e.registeredDate) {
      if (!byDate[e.registeredDate]) byDate[e.registeredDate] = [];
      byDate[e.registeredDate].push(e);
    }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const selectedEntries = selectedDate ? (byDate[selectedDate] ?? []) : [];
  const unregistered = entries.filter(e => !e.registeredDate);

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">📅 AIプラン履歴</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">‹</button>
            <span className="text-sm font-medium text-gray-700 w-20 text-center">{year}年{month + 1}月</span>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">›</button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['月', '火', '水', '木', '金', '土', '日'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntries = !!byDate[dateStr]?.length;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dow = (firstDow + i) % 7;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-sm transition-colors ${
                  isSelected ? 'bg-indigo-500 text-white' :
                  isToday ? 'bg-indigo-50 text-indigo-700 font-bold' :
                  'hover:bg-gray-50 text-gray-700'
                } ${dow === 5 && !isSelected ? 'text-blue-500' : ''} ${dow === 6 && !isSelected ? 'text-red-500' : ''}`}
              >
                <span>{day}</span>
                {hasEntries && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5`}>
                    {byDate[dateStr].slice(0, 3).map((e, j) => (
                      <span key={j} className={`w-1 h-1 rounded-full ${e.type === 'recipe' ? 'bg-orange-400' : 'bg-blue-400'} ${isSelected ? 'opacity-80' : ''}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-3 justify-end">
          <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />レシピ</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />トレーニング</span>
        </div>
      </div>

      {/* Selected day entries */}
      {selectedDate && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-600 px-1">{selectedDate} の登録プラン</p>
          {selectedEntries.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 text-center text-sm text-gray-400">この日の登録はありません</div>
          ) : (
            selectedEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onRemove={() => onRemove(entry.id)} />
            ))
          )}
        </div>
      )}

      {/* Unregistered history */}
      {unregistered.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-600 px-1">未登録の生成履歴</p>
          {unregistered.map(entry => (
            <EntryCard key={entry.id} entry={entry} expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onRemove={() => onRemove(entry.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({ entry, expanded, onToggle, onRemove }: {
  entry: AIHistoryEntry;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const createdDate = new Date(entry.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
        <span className={`text-lg ${entry.type === 'recipe' ? '🍽️' : '💪'}`}>{entry.type === 'recipe' ? '🍽️' : '💪'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{entry.title}</p>
          <p className="text-xs text-gray-400">{createdDate}{entry.registeredDate ? ` · 📅 ${entry.registeredDate}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${entry.type === 'recipe' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
            {entry.type === 'recipe' ? 'レシピ' : 'トレーニング'}
          </span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="pt-3">
            <MarkdownText text={entry.content} />
          </div>
          <button
            onClick={onRemove}
            className="mt-3 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            削除する
          </button>
        </div>
      )}
    </div>
  );
}
