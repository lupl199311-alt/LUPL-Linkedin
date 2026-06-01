export interface Draft { tone: string; text: string; id?: string; posted?: boolean; }

export interface ReflectionInput {
  place: string; scene: string; feeling?: string; date?: string; session?: string;
}
export interface StoryInput { memo: string; date?: string; }

export interface SavedLog {
  id: string; log_date: string; place: string; scene: string;
  feeling: string | null; session: string | null; mode: string;
  created_at: string; drafts: Draft[];
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `요청 실패 (${res.status})`);
  return data;
}

export async function generateReflection(input: ReflectionInput): Promise<{ drafts: Draft[]; suggested_tags: string[] }> {
  const res = await fetch("/api/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, mode: "reflection" }),
  });
  return parse(res);
}

export async function generateStory(input: StoryInput): Promise<{ drafts: Draft[]; suggested_tags: string[] }> {
  const res = await fetch("/api/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, mode: "story" }),
  });
  return parse(res);
}

export async function saveLog(
  input: ReflectionInput & { mode?: string },
  drafts: Draft[],
  used_tags: string[]
): Promise<{ ok: boolean; id: string }> {
  const res = await fetch("/api/save-log", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, drafts, used_tags }),
  });
  return parse(res);
}

export async function fetchLogs(): Promise<{ logs: SavedLog[]; configured: boolean }> {
  return parse(await fetch("/api/logs"));
}

export async function fetchHistory(): Promise<{ tags: string[]; places: string[]; configured: boolean }> {
  return parse(await fetch("/api/history"));
}
