import { cn } from "@/lib/utils";

const ALL_TAGS = [
  "#스타트업", "#소셜임팩트", "#생성형AI", "#장애예술",
  "#임팩트창업", "#고객인터뷰", "#AIEducation", "#창업",
] as const;

interface Props {
  selected: boolean[];
  onToggle: (index: number) => void;
}

export default function HashtagToggle({ selected, onToggle }: Props) {
  const count = selected.filter(Boolean).length;
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-1">
        Step 4 — 해시태그 <span className="text-muted-foreground font-normal">({count}개 선택됨)</span>
      </h2>
      <div className="flex flex-wrap gap-2 mt-3">
        {ALL_TAGS.map((tag, i) => (
          <button
            key={tag}
            onClick={() => onToggle(i)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-all",
              selected[i]
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export { ALL_TAGS };
