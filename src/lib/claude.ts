import Anthropic from '@anthropic-ai/sdk';

function getClient() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function streamText(prompt: string, onChunk: (text: string) => void) {
  const client = getClient();
  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
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
  const prompt = `あなたは栄養士兼シェフです。以下の条件に合った${params.mealType}のレシピを1つ考案してください。

【栄養目標】
- カロリー: 約${params.targetCalories}kcal
- タンパク質: 約${params.protein}g
- 炭水化物: 約${params.carbs}g
- 脂質: 約${params.fat}g

【好みや制約】
${params.preferences || 'なし（何でも可）'}

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
