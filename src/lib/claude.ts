import Anthropic from '@anthropic-ai/sdk';

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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。');

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

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

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text);
    }
  }
}
