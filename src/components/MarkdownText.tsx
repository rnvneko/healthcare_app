/**
 * 共通マークダウンレンダラー
 * React JSX はテキストを自動エスケープするが、念のため制御文字・HTMLタグをサニタイズする。
 */
function sanitizeLine(text: string): string {
  // HTMLタグを除去（スクリプトインジェクション対策）
  return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
}

export default function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-700">
      {lines.map((rawLine, i) => {
        const line = sanitizeLine(rawLine);
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
