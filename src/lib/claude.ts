import { supabase } from './supabase';

/**
 * Supabase Edge Function (claude-proxy) 経由でClaudeにストリーミングリクエストを送る。
 * Anthropic API キーはサーバー側にのみ保存され、ブラウザには露出しない。
 */
async function streamText(prompt: string, onChunk: (text: string) => void): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('ログインが必要です。');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/claude-proxy`;

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('レスポンスの読み取りに失敗しました。');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return;

      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) onChunk(parsed.text);
      } catch (e) {
        if (e instanceof Error && e.message !== payload) throw e;
      }
    }
  }
}

// ── 入力サニタイズ（プロンプトインジェクション対策） ──────────────────
function sanitizeInput(text: string, maxLen = 500): string {
  return text
    .replace(/[<>]/g, '')          // HTMLタグ阻止
    .replace(/\n{3,}/g, '\n\n')   // 過度な改行を削減
    .slice(0, maxLen)
    .trim();
}

export async function generateRecipe(
  params: {
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    preferences: string;
    mealType: string;
  },
  onChunk: (text: string) => void,
): Promise<void> {
  const safePreferences = sanitizeInput(params.preferences);

  const prompt = `あなたは栄養士兼シェフです。以下の条件に合った${params.mealType}のレシピを1つ考案してください。

【栄養目標】
- カロリー: 約${params.targetCalories}kcal
- タンパク質: 約${params.protein}g
- 炭水化物: 約${params.carbs}g
- 脂質: 約${params.fat}g

【好みや制約】
${safePreferences || 'なし（何でも可）'}

以下のフォーマットで回答してください：

## 🍽️ レシピ名

### 📋 材料（1人分）
- 材料リスト

### 👨‍🍳 作り方
1. 手順1
2. 手順2
...

### 📊 栄養情報
| 項目 | 量 |
|------|-----|
| カロリー | Xkcal |
| タンパク質 | Xg |
| 炭水化物 | Xg |
| 脂質 | Xg |

### 💡 ポイント
調理のコツや栄養的な特徴を2〜3点`;

  await streamText(prompt, onChunk);
}

export interface TrainingAdviceParams {
  availableTime: number; // 分
  targetCalories: number; // kcal
  targetMuscles: string[]; // 鍛えたい部位
  fitnessLevel: string; // 初心者/中級者/上級者
  trainingStyle: string; // マシン中心/フリーウェイト/混合
  adviceTypes: string[]; // フォーム/重量設定/次回メニュー/回復
  // 今日のセッションデータ（任意）
  todaySessions?: {
    name: string;
    exercises: { name: string; sets: { weight: number; reps: number }[]; caloriesBurned: number }[];
    duration: number;
    totalCaloriesBurned: number;
  }[];
}

export async function generateTrainingAdvice(
  params: TrainingAdviceParams,
  onChunk: (text: string) => void,
): Promise<void> {
  const sessionText = params.todaySessions && params.todaySessions.length > 0
    ? params.todaySessions.map(s =>
        `【${s.name}】（${s.duration}分、消費${s.totalCaloriesBurned}kcal）\n` +
        s.exercises.map(e =>
          `  - ${e.name}: ${e.sets.map(set => `${set.weight}kg×${set.reps}回`).join(', ')} (${e.caloriesBurned}kcal)`
        ).join('\n')
      ).join('\n')
    : 'まだ記録なし';

  const prompt = `あなたはプロのパーソナルトレーナーです。以下の条件に基づいて、具体的なトレーニングアドバイスを提供してください。

【ユーザー情報】
- 利用可能時間: ${params.availableTime}分
- 消費カロリー目標: ${params.targetCalories}kcal
- 鍛えたい部位: ${params.targetMuscles.join('、')}
- トレーニングレベル: ${params.fitnessLevel}
- スタイル: ${params.trainingStyle}

【今日のトレーニング記録】
${sessionText}

【アドバイスしてほしい内容】
${params.adviceTypes.join('、')}

以下のフォーマットで回答してください：

## 💪 トレーニングアドバイス

### 🏋️ 推奨メニュー（具体的なマシン・種目）
各種目について以下を示してください：
- マシン名 / 種目名
- 推奨重量・回数・セット数
- 使用するマシンの番号や場所のヒント（例：「チェストプレスマシン（胸のエリア）」）

### 📈 重量・回数の最適化
今日の記録を踏まえた具体的なアドバイス

### ✅ フォームのポイント
主な種目のフォームや効かせ方のコツ

### 🔄 次回のメニュー提案
次回トレーニングへの具体的な提案

### 🛌 回復・栄養タイミング
トレーニング後の回復と栄養摂取のアドバイス`;

  await streamText(prompt, onChunk);
}
