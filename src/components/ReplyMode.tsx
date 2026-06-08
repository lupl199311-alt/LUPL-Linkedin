import { useState, useEffect, useCallback } from "react";
import { Sparkles, Copy, Check, Loader2, FileText, X, History } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateReply, fetchLogs, type Draft, type SavedLog } from "@/lib/api";

const TONE_STYLE: Record<string, string> = {
  "따뜻하게": "bg-accent/15 text-accent",
  "대화 잇기": "bg-primary/15 text-primary",
  "담백하게": "bg-secondary text-secondary-foreground",
};

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

export default function ReplyMode() {
  const [myPost, setMyPost] = useState("");
  const [comment, setComment] = useState("");
  const [profile, setProfile] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);

  const [logs, setLogs] = useState<SavedLog[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const { logs } = await fetchLogs();
      setLogs(logs);
    } catch { /* 비필수 */ }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleGenerate = async () => {
    if (!myPost.trim() || !comment.trim()) {
      toast.error("내 원래 글과 상대 댓글은 꼭 넣어주세요."); return;
    }
    setLoading(true);
    try {
      const result = await generateReply({ myPost, comment, profile });
      setDrafts(result.drafts);
    } catch (e) { toast.error(e instanceof Error ? e.message : "생성 실패"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-foreground">
        <strong>댓글 답글 모드</strong> — 내 글에 달린 댓글에, 상대가 좋아할 답글을 만들어요. 댓글이 좋아요보다 알고리즘에 더 중요해요.
      </div>

      <div className="space-y-4">
        {/* 내 원래 글 + 불러오기 */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">① 내 원래 글</label>
            <button onClick={() => setShowPicker(p => !p)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <FileText size={13} /> 저장된 글 불러오기
            </button>
          </div>

          {showPicker && (
            <div className="mb-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-card">
              {logs.length === 0 && <p className="p-3 text-xs text-muted-foreground">저장된 글이 없습니다.</p>}
              {logs.map(log => (
                <div key={log.id} className="border-b border-border last:border-0">
                  <div className="px-3 pt-2 text-xs font-medium text-muted-foreground">
                    {log.log_date} · {log.place}{log.session ? ` ${log.session}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2">
                    {log.drafts?.map(d => (
                      <button key={d.id}
                        onClick={() => { setMyPost(d.text); setShowPicker(false); toast.success("불러왔어요."); }}
                        className="rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground hover:border-primary/40">
                        {d.tone} 버전
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea value={myPost} onChange={e => setMyPost(e.target.value)} rows={4}
              placeholder="내가 올린 글을 붙여넣거나, 위에서 저장된 글을 불러오세요."
              className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {myPost && (
              <button onClick={() => setMyPost("")}
                className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-secondary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 상대 댓글 */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">② 상대가 남긴 댓글</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
            placeholder="상대가 단 댓글을 그대로 붙여넣어 주세요."
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* 상대 소개 */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            ③ 상대 링크드인 소개 <span className="font-normal text-muted-foreground">(선택)</span>
          </label>
          <textarea value={profile} onChange={e => setProfile(e.target.value)} rows={3}
            placeholder="상대 프로필의 소개(About)를 복사해서 붙여넣으면, 그 사람에 맞춰 답글을 써줘요."
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <button onClick={handleGenerate} disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "답글 만드는 중…" : "답글 3종 생성"}
        </button>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-4 border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground">답글 후보 {drafts.length}개</h2>
          {drafts.map((d, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", TONE_STYLE[d.tone] || "bg-secondary text-secondary-foreground")}>{d.tone}</span>
                <span className="text-xs text-muted-foreground">{d.text.length}자</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{d.text}</div>
              <div className="mt-3"><CopyButton text={d.text} /></div>
            </div>
          ))}
        </div>
      )}

      {/* 저장된 글 보기 */}
      <div className="border-t border-border pt-8">
        <button onClick={() => setShowHistory(s => !s)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <History size={15} />
          저장된 글 {showHistory ? "접기" : "보기"}
          {logs.length > 0 && <span className="text-muted-foreground">({logs.length})</span>}
        </button>
        {showHistory && (
          <div className="mt-4 space-y-3">
            {logs.length === 0 && <p className="text-xs text-muted-foreground">아직 저장된 글이 없습니다.</p>}
            {logs.map(log => (
              <details key={log.id} className="rounded-lg border border-border bg-card p-3">
                <summary className="cursor-pointer text-sm text-foreground">
                  <span className="font-medium">{log.log_date}</span>
                  <span className="text-muted-foreground"> · {log.place}{log.session ? ` ${log.session}` : ""}</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {log.drafts?.map(d => (
                    <div key={d.id} className="rounded-md bg-secondary/50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{d.tone}</span>
                        <CopyButton text={d.text} label="복사" />
                      </div>
                      <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{d.text}</div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
