// Frontend client for the serverless API. All AI + DB access goes through
// these endpoints so that the OpenAI key and Supabase service key stay on the
// server and are never shipped to the browser.

export interface Draft {
  tone: string;
  text: string;
  id?: string;
  posted?: boolean;
}

export interface ReflectionInput {
  place: string;
  scene: string;
  feeling?: string;
  date?: string;
}

export interface SavedLog {
  id: string;
  log_date: string;
  place: string;
  scene: string;
  feeling: string | null;
  created_at: string;
  drafts: Draft[];
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

export async function generateDrafts(input: ReflectionInput): Promise<Draft[]> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parse(res);
  return data.drafts as Draft[];
}

export async function saveLog(
  input: ReflectionInput,
  drafts: Draft[]
): Promise<{ ok: boolean; id: string }> {
  const res = await fetch("/api/save-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, drafts }),
  });
  return parse(res);
}

export async function fetchLogs(): Promise<{ logs: SavedLog[]; configured: boolean }> {
  const res = await fetch("/api/logs");
  return parse(res);
}
