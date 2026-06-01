import { useState, useEffect, useCallback, useMemo } from "react";
import { Sparkles, Copy, Check, Save, History, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateDrafts,
  saveLog,
  fetchLogs,
  type Draft,
  type SavedLog,
} from "@/lib/api";

const HASHTAGS = [
  "#장애예술",
  "#생성형AI",
  "#AI교육",
  "#특수교육",
  "#소셜벤처",
  "#장애청소년",
  "#포용",
  "#러플",
] as const;

const DEFAULT_TAGS = [true, true, true, true, true, false, false, true];

const TONE_STYLE: Record<string, string> = {
  담담한: "bg-secondary text-secondary-foreground",
  따뜻한: "bg-accent/15 text-accent",
  단단한: "bg-primary/15 text-primary",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function CopyButton({ text, label = "복사하기" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        copied
          ? "bg-accent text-accent-foreground"
          : "bg-primary text-primary-foreground hover:opacity-90"
      )}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "복사됨!" : label}
    </button>
  );
}

export default function DailyReflectionMode() {
  const [date, setDate] = useState(today());
  const [place, setPlace] = useState("");
  const [scene, setScene] = useState("");
  const [feeling, setFeeling] = useState("");
  const [tags, setTags] = useState<boolean[]>(DEFAULT_TAGS);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [logs, setLogs] = useState<SavedLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyConfigured, setHistoryConfigured] = useState(true);

  const hashtagLine = useMemo(
    () => HASHTAGS.filter((_, i) => tags[i]).join(" "),
    [tags]
  );

  const compose = useCallback(
    (body: string) => (hashtagLine ? `${body}\n\n${hashtagLine}` : body),
    [hashtagLine]
  );

  const loadHistory = useCallback(async () => {
    try {
      const { logs: l, configured } = await fetchLogs();
      setLogs(l);
      setHistoryConfigured(configured);
    } catch (e) {
      // history is non-critical; stay quiet but log
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerate = async () => {
    if (!place.trim() || !scene.trim()) {
      toast.error("장소·수업 내용과 한 장면은 꼭 적어주세요.");
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const result = await generateDrafts({ place, scene, feeling, date });
      setDrafts(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLog({ place, scene, feeling, date }, drafts);
      setSaved(true);
      toast.success("오늘 기록을 저장했어요.");
      loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Golden hour tip */}
      <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-foreground">
        <Clock size={15} className="mt-0.5 shrink-0 text-accent" />
        <span>
          <strong>골든아워</strong> — 평일 오전 8~9시, 오후 2~3시에 올리면 첫 60분 반응이
          잘 모여 더 멀리 퍼져요. 댓글이 달리면 빠르게 답해주는 게 중요합니다.
        </span>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            ① 장소 · 수업 내용
          </label>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="예) 광명학교에서 음성인식으로 AI 그림 그리기 수업"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            ② 가장 기억에 남은 한 장면
          </label>
          <textarea
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            rows={3}
            placeholder="예) 손을 쓰기 어려운 학생이 목소리만으로 바다 그림을 완성하고, 화면을 한참 바라보던 순간"
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            ③ 그때 든 감정 · 생각{" "}
            <span className="font-normal text-muted-foreground">(선택)</span>
          </label>
          <textarea
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            rows={2}
            placeholder="예) 도구가 아이의 표현을 막고 있었을 뿐이라는 걸 다시 느꼈다"
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            해시태그{" "}
            <span className="font-normal text-muted-foreground">
              ({tags.filter(Boolean).length}개 · 생성된 글 끝에 자동으로 붙어요)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {HASHTAGS.map((tag, i) => (
              <button
                key={tag}
                onClick={() => setTags((p) => p.map((v, idx) => (idx === i ? !v : v)))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-all",
                  tags[i]
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "초안 만드는 중…" : "톤 3종 초안 생성"}
        </button>
      </div>

      {/* Results */}
      {drafts.length > 0 && (
        <div className="space-y-4 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              생성된 초안 {drafts.length}개
            </h2>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                saved
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:border-primary/40 disabled:opacity-60"
              )}
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : saved ? (
                <Check size={15} />
              ) : (
                <Save size={15} />
              )}
              {saved ? "저장됨" : "오늘 기록 저장"}
            </button>
          </div>

          {drafts.map((d, i) => {
            const full = compose(d.text);
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      TONE_STYLE[d.tone] || "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {d.tone}
                  </span>
                  <span className="text-xs text-muted-foreground">{full.length}자</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {full}
                </div>
                <div className="mt-3">
                  <CopyButton text={full} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      <div className="border-t border-border pt-8">
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground"
        >
          <History size={15} />
          지난 기록 {showHistory ? "접기" : "보기"}
          {logs.length > 0 && (
            <span className="text-muted-foreground">({logs.length})</span>
          )}
        </button>

        {showHistory && (
          <div className="mt-4 space-y-3">
            {!historyConfigured && (
              <p className="text-xs text-muted-foreground">
                Supabase가 아직 연결되지 않아 저장 기록이 없습니다. README의 설정 안내를
                참고해주세요.
              </p>
            )}
            {historyConfigured && logs.length === 0 && (
              <p className="text-xs text-muted-foreground">아직 저장된 기록이 없습니다.</p>
            )}
            {logs.map((log) => (
              <details key={log.id} className="rounded-lg border border-border bg-card p-3">
                <summary className="cursor-pointer text-sm text-foreground">
                  <span className="font-medium">{log.log_date}</span>{" "}
                  <span className="text-muted-foreground">· {log.place}</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {log.drafts?.map((d) => {
                    const full = compose(d.text);
                    return (
                      <div key={d.id} className="rounded-md bg-secondary/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {d.tone}
                          </span>
                          <CopyButton text={full} label="복사" />
                        </div>
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                          {full}
                        </div>
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
