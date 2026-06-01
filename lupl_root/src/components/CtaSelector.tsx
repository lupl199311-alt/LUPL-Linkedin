import { cn } from "@/lib/utils";

const CTAS = [
  { label: "창업 이유 질문", text: "\n\n당신이 창업한 이유는 무엇인가요? 댓글로 나눠주세요." },
  { label: "인터뷰 경험 질문", text: "\n\n소비자 인터뷰, 어떻게 하고 계신가요? 경험 있으신 분 댓글 주세요." },
  { label: "네트워크 연결", text: "\n\n비슷한 임팩트 프로젝트 하시는 분들, 연결하고 싶습니다." },
  { label: "팔로우 유도", text: "\n\n러플의 다음 이야기가 궁금하시다면 팔로우 해주세요." },
] as const;

interface Props {
  selected: number | null;
  onSelect: (index: number) => void;
}

export default function CtaSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Step 3 — CTA 선택</h2>
      <div className="flex flex-wrap gap-2">
        {CTAS.map((cta, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              selected === i
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground hover:border-accent/40"
            )}
          >
            {cta.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { CTAS };
