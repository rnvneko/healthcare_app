-- ============================================================
-- RLS（行レベルセキュリティ）確認・修正スクリプト
-- Supabase Dashboard の SQL Editor に貼り付けて実行してください
-- ============================================================

-- ─── 1. 現在のRLS状態を確認 ──────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ─── 2. 既存ポリシーを確認 ───────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- 以下は修正用。上記の確認で問題があった場合のみ実行してください
-- ============================================================

-- ─── food_entries ────────────────────────────────────────────
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_entries_user_only" ON public.food_entries;
CREATE POLICY "food_entries_user_only" ON public.food_entries
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── training_sessions ───────────────────────────────────────
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_sessions_user_only" ON public.training_sessions;
CREATE POLICY "training_sessions_user_only" ON public.training_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── weight_entries ──────────────────────────────────────────
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weight_entries_user_only" ON public.weight_entries;
CREATE POLICY "weight_entries_user_only" ON public.weight_entries
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── ai_history ──────────────────────────────────────────────
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_history_user_only" ON public.ai_history;
CREATE POLICY "ai_history_user_only" ON public.ai_history
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_goals ──────────────────────────────────────────────
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_goals_user_only" ON public.user_goals;
CREATE POLICY "user_goals_user_only" ON public.user_goals
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 確認: RLS適用後の状態 ───────────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
