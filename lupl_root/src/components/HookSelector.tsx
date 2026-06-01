import { cn } from "@/lib/utils";

const HOOKS = [
  { label: "창업 철학 훅", text: "스타트업의 본질은 소비자가 원하는 걸 해야 한다는 것.\n그래서 저희는 직접 물었습니다." },
  { label: "데이터 훅", text: "매년 100명 이상의 장애 당사자를 인터뷰했습니다.\n가장 많이 들은 말은 단 하나였어요." },
  { label: "질문 훅", text: "'가장 하고 싶은 게 뭐예요?'\n이 질문이 러플의 시작이었습니다." },
  { label: "공감 훅", text: "저도 내가 좋아하는 걸 하며 살고 싶어서 창업했습니다.\n그게 아이들을 만나게 된 이유이기도 해요." },
] as const;

interface Props {
  selected: number | null;
  onSelect: (index: number) => void;
}

export default function HookSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Step 1 — 훅 선택</h2>
      <div className="grid grid-cols-2 gap-3">
        {HOOKS.map((hook, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
              selected === i
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            )}
          >
            {hook.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { HOOKS };
