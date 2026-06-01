import { useState } from "react";

interface Props {
  fullPost: string;
  charCount: number;
  lineCount: number;
  tagCount: number;
}

export default function LivePreview({ fullPost, charCount, lineCount, tagCount }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">미리보기</h2>
      <div className="rounded-lg border border-border bg-card p-4 whitespace-pre-wrap text-sm text-foreground leading-relaxed max-h-[400px] overflow-y-auto">
        {fullPost || "내용이 없습니다."}
      </div>

      <div className="flex gap-3 mt-3">
        {[
          { label: "글자 수", value: charCount },
          { label: "줄 수", value: lineCount },
          { label: "해시태그", value: tagCount },
        ].map((s) => (
          <span key={s.label} className="rounded-md bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {s.label} <strong className="text-foreground">{s.value}</strong>
          </span>
        ))}
      </div>

      <button
        onClick={handleCopy}
        className={`mt-4 w-full rounded-lg py-3 text-sm font-semibold transition-all ${
          copied
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {copied ? "복사됨!" : "복사하기"}
      </button>
    </div>
  );
}
