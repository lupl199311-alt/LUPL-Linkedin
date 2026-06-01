import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserPrompt, TONES, ReflectionInput } from "./_prompt.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 프로젝트 환경변수에 키를 추가해주세요.",
    });
    return;
  }

  const body = (req.body || {}) as ReflectionInput;
  if (!body.place?.trim() || !body.scene?.trim()) {
    res.status(400).json({ error: "장소·수업 내용과 한 장면은 필수입니다." });
    return;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(body) },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: { drafts?: { tone: string; text: string }[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(502).json({ error: "AI 응답을 해석하지 못했습니다. 다시 시도해주세요." });
      return;
    }

    let drafts = Array.isArray(parsed.drafts) ? parsed.drafts : [];
    // Keep only well-formed drafts and order them by our canonical tone order.
    drafts = drafts.filter((d) => d && typeof d.text === "string" && d.text.trim());
    drafts.sort(
      (a, b) =>
        TONES.indexOf(a.tone as (typeof TONES)[number]) -
        TONES.indexOf(b.tone as (typeof TONES)[number])
    );

    if (drafts.length === 0) {
      res.status(502).json({ error: "생성된 초안이 없습니다. 다시 시도해주세요." });
      return;
    }

    res.status(200).json({ drafts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    res.status(500).json({ error: `생성 중 오류가 발생했습니다: ${message}` });
  }
}
