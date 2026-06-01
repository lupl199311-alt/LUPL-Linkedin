import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_supabase.js";

interface SaveBody {
  date?: string;
  place: string;
  scene: string;
  feeling?: string;
  session?: string;
  mode?: string;
  drafts: { tone: string; text: string }[];
  used_tags?: string[];   // 사용자가 최종 선택한 해시태그
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST만 허용" }); return; }

  const supabase = getSupabase();
  if (!supabase) {
    res.status(503).json({ error: "Supabase가 연결되지 않았어요. Vercel 환경변수에 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 추가해주세요." }); return;
  }

  const body = (req.body || {}) as SaveBody;
  if (!body.place?.trim() || !body.scene?.trim()) {
    res.status(400).json({ error: "장소와 장면은 필수입니다." }); return;
  }

  try {
    // 1. Save log
    const { data: log, error: logErr } = await supabase
      .from("daily_logs")
      .insert({
        log_date: body.date || new Date().toISOString().slice(0, 10),
        place: body.place,
        scene: body.scene,
        feeling: body.feeling || null,
        session: body.session || null,
        mode: body.mode || "reflection",
      })
      .select()
      .single();
    if (logErr) throw logErr;

    // 2. Save drafts
    if (body.drafts?.length) {
      const { error: draftErr } = await supabase.from("drafts").insert(
        body.drafts.map(d => ({ log_id: log.id, tone: d.tone, text: d.text, posted: false }))
      );
      if (draftErr) throw draftErr;
    }

    // 3. Upsert tag_history (increment used_count)
    const tags = Array.isArray(body.used_tags) ? body.used_tags.filter(Boolean) : [];
    for (const tag of tags) {
      await supabase.rpc("upsert_tag", { p_tag: tag }).catch(() => {
        // fallback: plain upsert
        return supabase.from("tag_history").upsert(
          { tag, used_count: 1 },
          { onConflict: "tag", ignoreDuplicates: false }
        );
      });
    }

    res.status(200).json({ ok: true, id: log.id });
  } catch (err: unknown) {
    res.status(500).json({ error: `저장 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}` });
  }
}
