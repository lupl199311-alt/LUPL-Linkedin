import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET 요청만 허용됩니다." });
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Not configured yet — return empty list so the UI renders cleanly.
    res.status(200).json({ logs: [], configured: false });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("id, log_date, place, scene, feeling, created_at, drafts(id, tone, text, posted)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.status(200).json({ logs: data || [], configured: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    res.status(500).json({ error: `기록을 불러오지 못했습니다: ${message}` });
  }
}
