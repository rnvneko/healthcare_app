import { useState } from 'react';
import { generateTrainingAdvice, type TrainingAdviceParams } from '../lib/claude';
import type { TrainingSession } from '../types';
import { todayStr } from '../lib/dateUtils';
import MarkdownText from './MarkdownText';

interface Props {
  todaySessions: TrainingSession[];
  onClose: () => void;
  onSaveHistory: (title: string, content: string, date: string) => void;
}

const TIME_OPTIONS = [30, 45, 60, 90, 120];
const CALORIE_OPTIONS = [200, 300, 400, 500, 600];
const MUSCLE_OPTIONS = ['胸', '背中', '肩', '腕（二頭）', '腕（三頭）', '脚', '臀部', '腹筋', '体幹', '全身'];
const LEVEL_OPTIONS = ['初心者', '中級者', '上級者'];
const STYLE_OPTIONS = ['マシン中心', 'フリーウェイト', '混合'];
const ADVICE_OPTIONS = [
  { key: 'フォーム・効かせ方のコツ', icon: '✅' },
  { key: '重量・回数の最適化', icon: '📈' },
  { key: '次回のメニュー提案', icon: '🔄' },
  { key: '回復・栄養タイミング', icon: '🛌' },
];

export default function TrainingAdvice({ todaySessions, onClose, onSaveHistory }: Props) {
  const [availableTime, setAvailableTime] = useState(60);
  const [targetCalories, setTargetCalories] = useState(400);
  const [targetMuscles, setTargetMuscles] = useState<string[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState('中級者');
  const [trainingStyle, setTrainingStyle] = useState('マシン中心');
  const [adviceTypes, setAdviceTypes] = useState<string[]>(['フォーム・効かせ方のコツ', '重量・回数の最適化']);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerDate, setRegisterDate] = useState(todayStr());
  const [registered, setRegistered] = useState(false);

  function toggleMuscle(m: string) {
    setTargetMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }
  function toggleAdvice(a: string) {
    setAdviceTypes(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function handleGenerate() {
    if (targetMuscles.length === 0) { setError('鍛えたい部位を1つ以上選択してください'); return; }
    setError('');
    setAdvice('');
    setLoading(true);
    try {
      const params: TrainingAdviceParams = {
        availableTime,
        targetCalories,
        targetMuscles,
        fitnessLevel,
        trainingStyle,
        adviceTypes: adviceTypes.length > 0 ? adviceTypes : ADVICE_OPTIONS.map(a => a.key),
        todaySessions: todaySessions.map(s => ({
          name: s.name,
          exercises: s.exercises,
          duration: s.duration,
          totalCaloriesBurned: s.totalCaloriesBurned,
        })),
      };
      let full = '';
      await generateTrainingAdvice(params, chunk => {
        full += chunk;
        setAdvice(full);
      });
      setRegistered(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アドバイスの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-gray-50 rounded-t-3xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-t-3xl px-5 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">✨ AIトレーニングアドバイス</h2>
            <p className="text-xs text-gray-500">条件を設定してアドバイスをもらおう</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Today's sessions summary */}
          {todaySessions.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">今日の記録を元にアドバイスします</p>
              {todaySessions.map(s => (
                <p key={s.id} className="text-xs text-blue-600">
                  {s.name}：{s.exercises.map(e => e.name).join('、')}（{s.totalCaloriesBurned}kcal消費）
                </p>
              ))}
            </div>
          )}

          {/* Time */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">⏱ 利用可能時間</p>
            <div className="flex gap-2 flex-wrap">
              {TIME_OPTIONS.map(t => (
                <button key={t} onClick={() => setAvailableTime(t)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    availableTime === t ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {t}分{t === 120 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Target calories */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">🔥 消費カロリー目標</p>
            <div className="flex gap-2 flex-wrap">
              {CALORIE_OPTIONS.map(c => (
                <button key={c} onClick={() => setTargetCalories(c)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    targetCalories === c ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}>
                  {c}kcal{c === 600 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Target muscles */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">💪 鍛えたい部位（複数選択可）</p>
            <div className="flex gap-2 flex-wrap">
              {MUSCLE_OPTIONS.map(m => (
                <button key={m} onClick={() => toggleMuscle(m)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    targetMuscles.includes(m) ? 'bg-indigo-500 text-white border-indigo-500' : 'text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Level + Style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">📊 レベル</p>
              <div className="flex flex-col gap-1.5">
                {LEVEL_OPTIONS.map(l => (
                  <button key={l} onClick={() => setFitnessLevel(l)}
                    className={`py-1.5 rounded-xl text-sm border transition-colors ${
                      fitnessLevel === l ? 'bg-purple-500 text-white border-purple-500' : 'text-gray-600 border-gray-200'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">🏋️ スタイル</p>
              <div className="flex flex-col gap-1.5">
                {STYLE_OPTIONS.map(s => (
                  <button key={s} onClick={() => setTrainingStyle(s)}
                    className={`py-1.5 rounded-xl text-sm border transition-colors ${
                      trainingStyle === s ? 'bg-green-500 text-white border-green-500' : 'text-gray-600 border-gray-200'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advice types */}
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">📝 アドバイス内容（複数選択可）</p>
            <div className="grid grid-cols-2 gap-2">
              {ADVICE_OPTIONS.map(({ key, icon }) => (
                <button key={key} onClick={() => toggleAdvice(key)}
                  className={`p-3 rounded-xl text-sm border text-left transition-colors ${
                    adviceTypes.includes(key) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'text-gray-600 border-gray-200 hover:border-indigo-200'
                  }`}>
                  <span className="block text-base mb-0.5">{icon}</span>
                  <span className="text-xs leading-tight">{key}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Generated advice */}
          {advice && (
            <div className="bg-white rounded-2xl p-4">
              <MarkdownText text={advice} />
              {loading ? (
                <div className="mt-2 flex items-center gap-2 text-indigo-500 text-sm">
                  <span className="animate-pulse">●</span><span>生成中...</span>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {registered ? (
                    <p className="text-sm text-green-600 text-center font-medium">✅ カレンダーに登録しました</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={registerDate}
                        onChange={e => setRegisterDate(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <button
                        onClick={() => {
                          const title = `${targetMuscles.join('・')} トレーニング (${availableTime}分)`;
                          onSaveHistory(title, advice, registerDate);
                          setRegistered(true);
                        }}
                        className="bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-indigo-600 whitespace-nowrap"
                      >
                        📅 登録
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate button */}
        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-indigo-500 disabled:opacity-60 text-white rounded-2xl py-3.5 font-semibold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="animate-spin text-lg">⟳</span>生成中...</>
            ) : (
              <>✨ AIアドバイスをもらう</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
