/** ローカル日時で YYYY-MM-DD を返す（toISOString はUTC基準なのでNG） */
export function toLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 今日のローカル日付 YYYY-MM-DD */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** 今日のローカル日付の 00:00:00 を UTC ISO 文字列で返す（Supabase クエリ用） */
export function todayStartISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}
