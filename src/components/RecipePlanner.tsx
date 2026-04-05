import { useState } from 'react';
import { generateRecipe } from '../lib/claude';
import type { DailyGoals } from '../types';
import { todayStr } from '../lib/dateUtils';

interface Props {
  goals: DailyGoals;
  remainingCalories: number;
  remainingProtein: number;
  onSaveHistory: (title: string, content: string, date: string) => void;
}

const MEAL_TYPES = ['朝食', '昼食', '夕食', 'スナック', 'プレワークアウト', 'ポストワークアウト'];

function MarkdownText({ text }: { text: string }) {
  // Simple markdown rendering
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-700">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-gray-900 mt-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-semibold text-gray-800 mt-3 mb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('| ') && line.includes('|')) {
          const cells = line.split('|').filter(c => c.trim());
          if (cells[0].includes('---')) return null;
          return (
            <div key={i} className="flex gap-3 bg-gray-50 rounded px-3 py-1.5">
              {cells.map((c, j) => (
                <span key={j} className={`${j === 0 ? 'text-gray-500 w-24' : 'font-medium text-gray-800'}`}>{c.trim()}</span>
              ))}
            </div>
          );
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4 list-disc text-gray-700">{line.slice(2)}</li>;
        }
        if (/^\d+\./.test(line)) {
          return <p key={i} className="ml-4 text-gray-700">{line}</p>;
        }
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-gray-700">{line}</p>;
      })}
    </div>
  );
}

export default function RecipePlanner({ remainingCalories, remainingProtein, onSaveHistory }: Props) {
  const [mealType, setMealType] = useState('昼食');
  const [targetCalories, setTargetCalories] = useState(String(Math.max(300, Math.round(remainingCalories / 2))));
  const [targetProtein, setTargetProtein] = useState(String(Math.max(20, Math.round(remainingProtein / 2))));
  const [targetCarbs, setTargetCarbs] = useState('60');
  const [targetFat, setTargetFat] = useState('15');
  const [preferences, setPreferences] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ mealType: string; recipe: string }[]>([]);
  const [registerDate, setRegisterDate] = useState(todayStr());
  const [registered, setRegistered] = useState(false);

  async function handleGenerate() {
    setError('');
    setRecipe('');
    setLoading(true);

    try {
      let full = '';
      await generateRecipe(
        {
          targetCalories: Number(targetCalories) || 500,
          protein: Number(targetProtein) || 30,
          carbs: Number(targetCarbs) || 60,
          fat: Number(targetFat) || 15,
          preferences,
          mealType,
        },
        (chunk) => {
          full += chunk;
          setRecipe(full);
        },
      );
      setHistory(prev => [{ mealType, recipe: full }, ...prev.slice(0, 4)]);
      setRegistered(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'レシピの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">AIレシピ提案</h1>
        <p className="text-sm text-gray-500 mt-0.5">Claude AIがあなたの目標に合わせたレシピを提案します</p>
      </div>

      {/* Remaining stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-2xl p-3">
          <p className="text-xs text-gray-500">残りカロリー目標</p>
          <p className="text-xl font-bold text-orange-600">{Math.max(0, remainingCalories)} <span className="text-sm font-normal">kcal</span></p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-3">
          <p className="text-xs text-gray-500">残りタンパク質目標</p>
          <p className="text-xl font-bold text-purple-600">{Math.max(0, remainingProtein)} <span className="text-sm font-normal">g</span></p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">レシピ条件</h2>

        {/* Meal type */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">食事の種類</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`text-sm px-3 py-1.5 rounded-xl border transition-colors ${
                  mealType === type
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Nutrition targets */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目標カロリー (kcal)</label>
            <input
              type="number"
              min="100"
              value={targetCalories}
              onChange={e => setTargetCalories(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目標タンパク質 (g)</label>
            <input
              type="number"
              min="0"
              value={targetProtein}
              onChange={e => setTargetProtein(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目標炭水化物 (g)</label>
            <input
              type="number"
              min="0"
              value={targetCarbs}
              onChange={e => setTargetCarbs(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目標脂質 (g)</label>
            <input
              type="number"
              min="0"
              value={targetFat}
              onChange={e => setTargetFat(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Preferences */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">好みや制約（任意）</label>
          <textarea
            rows={2}
            placeholder="例：魚が好き、乳製品アレルギー、時短レシピ希望"
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-500 disabled:opacity-60 text-white rounded-xl py-3 font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>生成中...</span>
            </>
          ) : (
            <>✨ レシピを提案してもらう</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          <p className="font-medium mb-1">エラーが発生しました</p>
          <p>{error}</p>
          {error.includes('VITE_ANTHROPIC_API_KEY') && (
            <p className="mt-2 text-xs">
              プロジェクトルートに <code className="bg-red-100 px-1 rounded">.env</code> ファイルを作成し、
              <code className="bg-red-100 px-1 rounded">VITE_ANTHROPIC_API_KEY=your_api_key</code> を追加してください。
            </p>
          )}
        </div>
      )}

      {/* Generated recipe */}
      {recipe && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">提案レシピ</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{mealType}</span>
          </div>
          <MarkdownText text={recipe} />
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-indigo-500 text-sm">
              <span className="animate-pulse">●</span>
              <span>生成中...</span>
            </div>
          )}
          {!loading && (
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
                      const title = recipe.split('\n').find(l => l.startsWith('## '))?.replace('## ', '') ?? `${mealType}レシピ`;
                      onSaveHistory(title, recipe, registerDate);
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

      {/* History */}
      {history.length > 0 && !recipe && (
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700 text-sm">過去の提案</h2>
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => setRecipe(item.recipe)}
              className="w-full bg-white rounded-2xl shadow-sm p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.mealType}</span>
                <span className="text-sm text-gray-600 truncate">{item.recipe.split('\n')[0].replace(/^#+\s*/, '')}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
