// Returns aggregated hashtag history and place history from past logs/drafts.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") { res.status(405).json({ error: "GET만 허용" }); return; }

  const supabase = getSupabase();
  if (!supabase) { res.status(200).json({ tags: [], places: [], configured: false }); return; }

  try {
    // Past places (distinct, ordered by most recent)
    const { data: logData } = await supabase
      .from("daily_logs")
      .select("place")
      .order("created_at", { ascending: false })
      .limit(100);

    const places: string[] = [];
    const placeSeen = new Set<string>();
    for (const row of logData || []) {
      if (row.place && !placeSeen.has(row.place)) {
        placeSeen.add(row.place);
        places.push(row.place);
      }
    }

    // Past hashtags from tag_history table
    const { data: tagData } = await supabase
      .from("tag_history")
      .select("tag, used_count")
      .order("used_count", { ascending: false })
      .limit(30);

    const tags = (tagData || []).map(r => r.tag as string);

    res.status(200).json({ tags, places: places.slice(0, 20), configured: true });
  } catch (err: unknown) {
    res.status(500).json({ error: `히스토리 로드 실패: ${err instanceof Error ? err.message : "오류"}` });
  }
}
