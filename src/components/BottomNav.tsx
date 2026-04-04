type Tab = 'dashboard' | 'food' | 'training' | 'recipe';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'ダッシュボード' },
  { id: 'food', icon: '🍱', label: '食事' },
  { id: 'training', icon: '💪', label: 'トレーニング' },
  { id: 'recipe', icon: '✨', label: 'レシピAI' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-inset-bottom">
      {TABS.map(({ id, icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
            active === id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl leading-none">{icon}</span>
          <span className="text-xs font-medium">{label}</span>
          {active === id && (
            <span className="absolute top-0 w-8 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
}

export type { Tab };
