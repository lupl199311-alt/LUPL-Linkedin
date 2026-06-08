import { useState } from "react";
import { PenLine, Megaphone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import DailyReflectionMode from "@/components/DailyReflectionMode";
import FounderStoryMode from "@/components/FounderStoryMode";
import ReplyMode from "@/components/ReplyMode";

type Mode = "reflection" | "founder" | "reply";

const MODES: { key: Mode; label: string; desc: string; icon: typeof PenLine }[] = [
  { key: "reflection", label: "감상 모드", desc: "수업 후 매일 기록", icon: PenLine },
  { key: "founder", label: "창업 스토리", desc: "키워드로 한 방 글", icon: Megaphone },
  { key: "reply", label: "댓글 답글", desc: "댓글에 답글 달기", icon: MessageCircle },
];

export default function Index() {
  const [mode, setMode] = useState<Mode>("reflection");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">LUPL LinkedIn Generator</h1>
            <p className="text-xs text-muted-foreground">러플 링크드인 포스트 생성기</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            v2.1
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Mode toggle */}
        <div className="mb-8 grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg px-3 py-3 text-left transition-all",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Icon size={15} />
                  {m.label}
                </span>
                <span className={cn("text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {m.desc}
                </span>
              </button>
            );
          })}
        </div>

        {mode === "reflection" && <DailyReflectionMode />}
        {mode === "founder" && <FounderStoryMode />}
        {mode === "reply" && <ReplyMode />}
      </main>
    </div>
  );
}
