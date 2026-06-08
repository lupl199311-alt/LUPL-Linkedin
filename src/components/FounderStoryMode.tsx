import { useState, useCallback, useMemo, useEffect } from "react";
import { Sparkles, Copy, Check, Save, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateStory, saveLog, fetchHistory, fetchLogs, type Draft, type SavedLog } from "@/lib/api";
import { useLocalDraft } from "@/hooks/useLocalDraft";

const TONE_STYLE: Record<string, string> = {
  담담한: "bg-secondary text-secondary-foreground",
  따뜻한: "bg-accent/15 text-accent",
  단단한: "bg-primary/15 text-primary",
};

function today() { return new Date().toISOString().slice(0, 10); }

function CopyButton({ text, label = "복사하기" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        copied ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:opacity-90")}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "복사됨!" : label}
    </button>
  );
}

export default function FounderStoryMode() {
  const [date, setDate] = useLocalDraft("story_date", today());
  const [memo, setMemo] = useLocalDraft("story_memo", "");

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [historyTags, setHistoryTags] = useState<string[]>([]);

  const [logs, setLogs] = useState<SavedLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const allTagPool = useMemo(() => {
    const seen = new Set<string>();
    return [...suggestedTags, ...historyTags].filter(t => !seen.has(t) && seen.add(t));
  }, [suggestedTags, historyTags]);

  useEffect(() => {
    fetchHistory().then(r => setHistoryTags(r.tags)).catch(() => {});
    fetchLogs().then(r => setLogs(r.logs)).catch(() => {});
  }, []);

  const compose = useCallback((body: string) =>
    selectedTags.length ? `${body}\n\n${selectedTags.join(" ")}` : body,
    [selectedTags]);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleGenerate = async () => {
    if (!memo.trim()) { toast.error("키워드나 메모를 입력해주세요."); return; }
    setLoading(true); setSaved(false);
    try {
      const result = await generateStory({ memo, date });
      setDrafts(result.drafts);
      setSuggestedTags(result.suggested_tags || []);
      setSelectedTags(result.suggested_tags?.slice(0, 5) || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : "생성 실패"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLog({ place: "(창업스토리)", scene: memo, date, mode: "story" }, drafts, selectedTags);
      setSaved(true); toast.success("저장했어요.");
      fetchLogs().then(r => setLogs(r.logs)).catch(() => {});
    } catch (e) { toast.error(e instanceof Error ? e.message : "저장 실패"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground">
        <strong>창업 스토리 모드</strong> — 키워드/메모만 넣으면 AI가 훅+본문+CTA 완성 글 3종을 만들어요.
        <span className="ml-1 text-muted-foreground">입력값은 자동 저장돼요.</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">날짜</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">키워드 · 메모</label>
          <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={5}
            placeholder={`쓰고 싶은 내용을 자유롭게 적어주세요.\n\n예) 사생대회 639명, 전국 최초 특수학교 AI 수업, 장애문화예술주간 8000명 방문, 소비자가 원하는 걸 해야 한다는 창업 철학, 아이들이 직접 만든 AI 미디어아트 앞에 섰을 때`}
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <button onClick={handleGenerate} disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "초안 만드는 중…" : "훅+본문+CTA 3종 생성"}
        </button>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-4 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">생성된 초안 {drafts.length}개</h2>
            <button onClick={handleSave} disabled={saving || saved}
              className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                saved ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:border-primary/40 disabled:opacity-60")}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
              {saved ? "저장됨" : "저장"}
            </button>
          </div>

          {allTagPool.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-foreground">
                해시태그 <span className="font-normal text-muted-foreground">({selectedTags.length}개 선택)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allTagPool.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition-all",
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {drafts.map((d, i) => {
            const full = compose(d.text);
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", TONE_STYLE[d.tone] || "bg-secondary text-secondary-foreground")}>{d.tone}</span>
                  <span className="text-xs text-muted-foreground">{full.length}자</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{full}</div>
                <div className="mt-3"><CopyButton text={full} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* 지난 기록 */}
      <div className="border-t border-border pt-8">
        <button onClick={() => setShowHistory(s => !s)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <History size={15} />
          지난 기록 {showHistory ? "접기" : "보기"}
          {logs.length > 0 && <span className="text-muted-foreground">({logs.filter(l => l.mode === "story").length})</span>}
        </button>
        {showHistory && (
          <div className="mt-4 space-y-3">
            {logs.filter(l => l.mode === "story").length === 0 && (
              <p className="text-xs text-muted-foreground">저장된 창업 스토리 기록이 없습니다.</p>
            )}
            {logs.filter(l => l.mode === "story").map(log => (
              <details key={log.id} className="rounded-lg border border-border bg-card p-3">
                <summary className="cursor-pointer text-sm text-foreground">
                  <span className="font-medium">{log.log_date}</span>
                  <span className="text-muted-foreground"> · {log.scene?.slice(0, 30)}…</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {log.drafts?.map(d => {
                    const full = compose(d.text);
                    return (
                      <div key={d.id} className="rounded-md bg-secondary/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">{d.tone}</span>
                          <CopyButton text={full} label="복사" />
                        </div>
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{full}</div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
