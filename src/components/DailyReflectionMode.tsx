import { useState, useEffect, useCallback, useMemo } from "react";
import { Sparkles, Copy, Check, Save, History, Loader2, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateReflection, saveLog, fetchLogs, fetchHistory, type Draft, type SavedLog } from "@/lib/api";
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
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        copied ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:opacity-90")}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "복사됨!" : label}
    </button>
  );
}

export default function DailyReflectionMode() {
  const [date, setDate] = useLocalDraft("reflection_date", today());
  const [place, setPlace] = useLocalDraft("reflection_place", "");
  const [session, setSession] = useLocalDraft("reflection_session", "");
  const [scene, setScene] = useLocalDraft("reflection_scene", "");
  const [feeling, setFeeling] = useLocalDraft("reflection_feeling", "");
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [showLogPicker, setShowLogPicker] = useState(false);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [historyTags, setHistoryTags] = useState<string[]>([]);
  const [pastPlaces, setPastPlaces] = useState<string[]>([]);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [logs, setLogs] = useState<SavedLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyConfigured, setHistoryConfigured] = useState(true);

  const allTagPool = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of [...suggestedTags, ...historyTags]) {
      if (!seen.has(t)) { seen.add(t); result.push(t); }
    }
    return result;
  }, [suggestedTags, historyTags]);

  const loadHistory = useCallback(async () => {
    try {
      const [logsRes, histRes] = await Promise.all([fetchLogs(), fetchHistory()]);
      setLogs(logsRes.logs);
      setHistoryConfigured(logsRes.configured);
      setHistoryTags(histRes.tags);
      setPastPlaces(histRes.places);
    } catch { }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const compose = useCallback((body: string) => {
    if (!selectedTags.length) return body;
    return `${body}\n\n${selectedTags.join(" ")}`;
  }, [selectedTags]);

  const handleGenerate = async () => {
    if (!place.trim() || !scene.trim()) { toast.error("장소와 한 장면은 꼭 적어주세요."); return; }
    setLoading(true); setSaved(false);
    try {
      const result = await generateReflection({ place, scene, feeling, date, session });
      setDrafts(result.drafts);
      setSuggestedTags(result.suggested_tags || []);
      setSelectedTags(result.suggested_tags?.slice(0, 5) || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : "생성 실패"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLog({ place, scene, feeling, date, session, mode: "reflection" }, drafts, selectedTags);
      setSaved(true); toast.success("오늘 기록을 저장했어요.");
      loadHistory();
    } catch (e) { toast.error(e instanceof Error ? e.message : "저장 실패"); }
    finally { setSaving(false); }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const placeWithSession = useMemo(() => {
    if (!place) return "";
    return session ? `${place} ${session}` : place;
  }, [place, session]);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-foreground">
        <Clock size={15} className="mt-0.5 shrink-0 text-accent" />
        <span><strong>골든아워</strong> — 평일 오전 8~9시, 오후 2~3시. 올린 후 댓글이 달리면 빠르게 답해주세요.</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">날짜</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">① 장소 · 수업 내용</label>
          <div className="relative">
            <input value={place} onChange={e => { setPlace(e.target.value); setShowPlaceDropdown(true); }}
              onFocus={() => setShowPlaceDropdown(true)}
              onBlur={() => setTimeout(() => setShowPlaceDropdown(false), 150)}
              placeholder="예) 광명학교에서 음성인식 AI 그림 수업"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {pastPlaces.length > 0 && (
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
            {showPlaceDropdown && pastPlaces.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                {pastPlaces.filter(p => p.includes(place) || !place).slice(0, 8).map(p => (
                  <button key={p} onMouseDown={() => { setPlace(p); setShowPlaceDropdown(false); }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input value={session} onChange={e => setSession(e.target.value)}
            placeholder="예) 2회차, 3번째 수업 (선택)"
            className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {placeWithSession && (
            <p className="mt-1.5 text-xs text-accent">→ 글에 반영: <strong>{placeWithSession}</strong></p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">② 가장 기억에 남은 한 장면</label>
            <button onClick={() => setShowLogPicker(p => !p)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <History size={13} /> 저장된 글 불러오기
            </button>
          </div>
          {showLogPicker && logs.length > 0 && (
            <div className="mb-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-card">
              {logs.map(log => (
                <div key={log.id} className="border-b border-border last:border-0">
                  <div className="px-3 pt-2 text-xs font-medium text-muted-foreground">
                    {log.log_date} · {log.place}{log.session ? ` ${log.session}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2">
                    {log.drafts?.map(d => (
                      <button key={d.id}
                        onClick={() => { setScene(d.text); setShowLogPicker(false); toast.success("불러왔어요."); }}
                        className="rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground hover:border-primary/40">
                        {d.tone} 버전
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <textarea value={scene} onChange={e => setScene(e.target.value)} rows={3}
            placeholder="예) 손을 쓰기 어려운 학생이 목소리만으로 바다 그림을 완성하고 화면을 한참 바라보던 순간"
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            ③ 그때 든 감정 · 생각 <span className="font-normal text-muted-foreground">(선택)</span>
          </label>
          <textarea value={feeling} onChange={e => setFeeling(e.target.value)} rows={2}
            placeholder="예) 도구가 아이의 표현을 막고 있었을 뿐이라는 걸 다시 느꼈다"
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <button onClick={handleGenerate} disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "초안 만드는 중…" : "톤 3종 초안 생성"}
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
              {saved ? "저장됨" : "기록 저장"}
            </button>
          </div>

          {allTagPool.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-foreground">
                해시태그 선택 <span className="font-normal text-muted-foreground">({selectedTags.length}개 선택됨)</span>
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

      <div className="border-t border-border pt-8">
        <button onClick={() => setShowHistory(s => !s)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <History size={15} />
          지난 기록 {showHistory ? "접기" : "보기"}
          {logs.length > 0 && <span className="text-muted-foreground">({logs.length})</span>}
        </button>
        {showHistory && (
          <div className="mt-4 space-y-3">
            {!historyConfigured && <p className="text-xs text-muted-foreground">Supabase가 연결되지 않아 기록이 없습니다.</p>}
            {historyConfigured && logs.length === 0 && <p className="text-xs text-muted-foreground">아직 저장된 기록이 없습니다.</p>}
            {logs.map(log => (
              <details key={log.id} className="rounded-lg border border-border bg-card p-3">
                <summary className="cursor-pointer text-sm text-foreground">
                  <span className="font-medium">{log.log_date}</span>
                  <span className="text-muted-foreground"> · {log.place}{log.session ? ` ${log.session}` : ""}</span>
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
