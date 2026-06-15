import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import {
  REFLECTION_SYSTEM_PROMPT, buildReflectionPrompt,
  STORY_SYSTEM_PROMPT, buildStoryPrompt,
  REPLY_SYSTEM_PROMPT, buildReplyPrompt,
  TONES,
  type ReflectionInput, type StoryInput, type ReplyInput,
} from "./_prompt.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST만 허용" }); return; }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "OPENAI_API_KEY가 없습니다. Vercel 환경변수에 추가해주세요." }); return; }

  const body = req.body || {};
  const mode: "reflection" | "story" | "reply" =
    body.mode === "story" ? "story" : body.mode === "reply" ? "reply" : "reflection";

  // validation
  if (mode === "reflection") {
    if (!(body as ReflectionInput).place?.trim() || !(body as ReflectionInput).scene?.trim()) {
      res.status(400).json({ error: "장소와 한 장면은 필수입니다." }); return;
    }
  } else if (mode === "story") {
    if (!(body as StoryInput).memo?.trim()) {
      res.status(400).json({ error: "키워드/메모를 입력해주세요." }); return;
    }
  } else {
    if (!(body as ReplyInput).myPost?.trim() || !(body as ReplyInput).comment?.trim()) {
      res.status(400).json({ error: "원래 글과 댓글은 필수입니다." }); return;
    }
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const client = new OpenAI({ apiKey });

  let systemPrompt: string;
  let userPrompt: string;
  if (mode === "story") {
    systemPrompt = STORY_SYSTEM_PROMPT;
    userPrompt = buildStoryPrompt(body as StoryInput);
  } else if (mode === "reply") {
    systemPrompt = REPLY_SYSTEM_PROMPT;
    userPrompt = buildReplyPrompt(body as ReplyInput);
  } else {
    systemPrompt = REFLECTION_SYSTEM_PROMPT;
    userPrompt = buildReflectionPrompt(body as ReflectionInput);
  }

  try {
    const completion = await client.chat.completions.create({
      model, temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: { drafts?: { tone: string; text: string }[]; suggested_tags?: string[] };
    try { parsed = JSON.parse(raw); }
    catch { res.status(502).json({ error: "AI 응답 해석 실패. 다시 시도해주세요." }); return; }

    let drafts = Array.isArray(parsed.drafts) ? parsed.drafts : [];
    drafts = drafts.filter(d => d && typeof d.text === "string" && d.text.trim());

    // 감상/창업 모드만 톤 순서 정렬 (답글 모드는 자체 톤이라 그대로)
    if (mode !== "reply") {
      drafts.sort((a, b) =>
        TONES.indexOf(a.tone as typeof TONES[number]) - TONES.indexOf(b.tone as typeof TONES[number])
      );
    }

    if (!drafts.length) { res.status(502).json({ error: "생성된 초안이 없습니다." }); return; }

    const suggested_tags = Array.isArray(parsed.suggested_tags)
      ? parsed.suggested_tags.filter(t => typeof t === "string" && t.startsWith("#")).slice(0, 8)
      : [];

    res.status(200).json({ drafts, suggested_tags });
  } catch (err: unknown) {
    res.status(500).json({ error: `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}` });
  }
}
