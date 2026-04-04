import { useState } from 'react';
import type { TrainingSession, Exercise, TrainingSet } from '../types';
import TrainingAdvice from './TrainingAdvice';

interface Props {
  sessions: TrainingSession[];
  onAdd: (session: Omit<TrainingSession, 'id' | 'timestamp'>) => void;
  onRemove: (id: string) => void;
  totalCaloriesBurned: number;
  onSaveAdviceHistory: (title: string, content: string, date: string) => void;
}

const EXERCISE_PRESETS = [
  { name: 'ベンチプレス', caloriesPerMin: 8 },
  { name: 'スクワット', caloriesPerMin: 9 },
  { name: 'デッドリフト', caloriesPerMin: 9 },
  { name: 'ダンベルカール', caloriesPerMin: 5 },
  { name: 'ラットプルダウン', caloriesPerMin: 7 },
  { name: 'ショルダープレス', caloriesPerMin: 7 },
  { name: 'トレッドミル（30分）', caloriesPerMin: 10 },
  { name: 'バイク（30分）', caloriesPerMin: 8 },
];

function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: Exercise;
  onChange: (e: Exercise) => void;
  onRemove: () => void;
}) {
  function addSet() {
    onChange({ ...exercise, sets: [...exercise.sets, { reps: 10, weight: 0 }] });
  }
  function updateSet(i: number, s: Partial<TrainingSet>) {
    const sets = exercise.sets.map((set, idx) => idx === i ? { ...set, ...s } : set);
    onChange({ ...exercise, sets });
  }
  function removeSet(i: number) {
    onChange({ ...exercise, sets: exercise.sets.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800 text-sm">{exercise.name}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={exercise.caloriesBurned}
            onChange={e => onChange({ ...exercise, caloriesBurned: Number(e.target.value) })}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
            placeholder="消費kcal"
          />
          <span className="text-xs text-gray-400">kcal</span>
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-base">×</button>
        </div>
      </div>
      <div className="space-y-1">
        {exercise.sets.map((set, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-xs text-gray-400 w-8">Set {i + 1}</span>
            <input
              type="number"
              min="0"
              value={set.weight}
              onChange={e => updateSet(i, { weight: Number(e.target.value) })}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
              placeholder="kg"
            />
            <span className="text-xs text-gray-400">kg ×</span>
            <input
              type="number"
              min="0"
              value={set.reps}
              onChange={e => updateSet(i, { reps: Number(e.target.value) })}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
              placeholder="回"
            />
            <span className="text-xs text-gray-400">回</span>
            <button onClick={() => removeSet(i)} className="text-gray-300 hover:text-red-400 text-xs ml-auto">削除</button>
          </div>
        ))}
      </div>
      <button
        onClick={addSet}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
      >
        + セット追加
      </button>
    </div>
  );
}

export default function TrainingTracker({ sessions, onAdd, onRemove, totalCaloriesBurned, onSaveAdviceHistory }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [duration, setDuration] = useState('60');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  function addExercise(name: string, caloriesPerMin: number) {
    const cal = Math.round(caloriesPerMin * Number(duration || 60) / EXERCISE_PRESETS.length);
    setExercises(prev => [...prev, {
      name,
      sets: [{ reps: 10, weight: 0 }],
      caloriesBurned: cal,
    }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionName || exercises.length === 0) return;
    const total = exercises.reduce((s, ex) => s + ex.caloriesBurned, 0);
    onAdd({
      name: sessionName,
      exercises,
      totalCaloriesBurned: total,
      duration: Number(duration) || 60,
    });
    setSessionName('');
    setDuration('60');
    setExercises([]);
    setShowForm(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">トレーニング</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-600 active:scale-95 transition-transform"
        >
          {showForm ? 'キャンセル' : '+ 追加'}
        </button>
      </div>

      {/* Total burned today */}
      <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl">🔥</div>
        <div>
          <p className="text-sm text-gray-500">今日の消費カロリー</p>
          <p className="text-3xl font-bold text-blue-600">{totalCaloriesBurned} <span className="text-base font-normal text-gray-500">kcal</span></p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-700">セッションを記録</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">セッション名</label>
              <input
                required
                placeholder="例：胸の日"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">時間（分）</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">種目を選択</p>
            <div className="flex flex-wrap gap-2">
              {EXERCISE_PRESETS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => addExercise(p.name, p.caloriesPerMin)}
                  disabled={exercises.some(e => e.name === p.name)}
                  className="text-xs bg-gray-100 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-2 py-1 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {exercises.length > 0 && (
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <ExerciseRow
                  key={i}
                  exercise={ex}
                  onChange={updated => setExercises(prev => prev.map((e, idx) => idx === i ? updated : e))}
                  onRemove={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
              <div className="text-right text-sm text-gray-500">
                合計消費: <span className="font-bold text-blue-600">{exercises.reduce((s, e) => s + e.caloriesBurned, 0)} kcal</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!sessionName || exercises.length === 0}
            className="w-full bg-blue-500 disabled:opacity-50 text-white rounded-xl py-2.5 font-medium hover:bg-blue-600 transition-colors"
          >
            記録する
          </button>
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">💪</div>
            <p className="text-sm">今日のトレーニング記録はありません</p>
            <p className="text-xs mt-1">上の「+ 追加」から記録しましょう</p>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{session.name}</p>
                  <p className="text-xs text-gray-500">{session.duration}分 · {session.exercises.length}種目</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-600">{session.totalCaloriesBurned} kcal</span>
                  <button onClick={() => onRemove(session.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {session.exercises.map((ex, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-xs rounded-lg px-2 py-0.5">
                    {ex.name} ({ex.sets.length}set)
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Advice button */}
      <button
        onClick={() => setShowAdvice(true)}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl py-3.5 font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
      >
        <span className="text-lg">✨</span>
        AIトレーニングアドバイスをもらう
      </button>

      {/* AI Advice modal */}
      {showAdvice && (
        <TrainingAdvice
          todaySessions={sessions}
          onClose={() => setShowAdvice(false)}
          onSaveHistory={onSaveAdviceHistory}
        />
      )}
    </div>
  );
}
