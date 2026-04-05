import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('確認メールを送信しました。メールのリンクをクリックしてログインしてください。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました';
      // Translate common Supabase error messages
      if (msg.includes('Invalid login credentials')) setError('メールアドレスまたはパスワードが正しくありません');
      else if (msg.includes('Email not confirmed')) setError('メールアドレスの確認が完了していません。確認メールをご確認ください。');
      else if (msg.includes('Password should be')) setError('パスワードは6文字以上で入力してください');
      else if (msg.includes('already registered')) setError('このメールアドレスはすでに登録されています');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">
          FG
        </div>
        <h1 className="text-2xl font-bold text-gray-900">FitGoal</h1>
        <p className="text-sm text-gray-500 mt-1">フィットネス & 食事管理アプリ</p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {mode === 'login' ? 'ログイン' : 'アカウント作成'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">メールアドレス</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">パスワード</label>
            <input
              type="password"
              required
              placeholder={mode === 'signup' ? '6文字以上' : ''}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 disabled:opacity-60 text-white rounded-xl py-3 font-semibold hover:bg-indigo-600 transition-colors"
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
            className="text-sm text-indigo-500 hover:text-indigo-700"
          >
            {mode === 'login' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}
