import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_supabase.js";

interface SaveBody {
  date?: string;
  place: string;
  scene: string;
  feeling?: string;
  drafts: { tone: string; text: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    res.status(503).json({
      error:
        "Supabase가 아직 설정되지 않았습니다. 저장 없이 복사만 사용하거나, 환경변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)를 추가해주세요.",
    });
    return;
  }

  const body = (req.body || {}) as SaveBody;
  if (!body.place?.trim() || !body.scene?.trim()) {
    res.status(400).json({ error: "장소와 장면은 필수입니다." });
    return;
  }

  try {
    const { data: log, error: logErr } = await supabase
      .from("daily_logs")
      .insert({
        log_date: body.date || new Date().toISOString().slice(0, 10),
        place: body.place,
        scene: body.scene,
        feeling: body.feeling || null,
      })
      .select()
      .single();

    if (logErr) throw logErr;

    const drafts = Array.isArray(body.drafts) ? body.drafts : [];
    if (drafts.length > 0) {
      const rows = drafts.map((d) => ({
        log_id: log.id,
        tone: d.tone,
        text: d.text,
        posted: false,
      }));
      const { error: draftErr } = await supabase.from("drafts").insert(rows);
      if (draftErr) throw draftErr;
    }

    res.status(200).json({ ok: true, id: log.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    res.status(500).json({ error: `저장 중 오류가 발생했습니다: ${message}` });
  }
}
