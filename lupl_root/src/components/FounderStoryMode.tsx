import { useState, useMemo, useCallback } from "react";
import HookSelector, { HOOKS } from "@/components/HookSelector";
import CtaSelector, { CTAS } from "@/components/CtaSelector";
import HashtagToggle, { ALL_TAGS } from "@/components/HashtagToggle";
import LivePreview from "@/components/LivePreview";

const DEFAULT_BODY = `스타트업의 본질은 소비자가 원하는 걸 해야 한다는 것.
그래서 저희는 직접 물었습니다.

러플은 사생대회로 만난 매년 100명 이상의 장애 당사자, 학부모, 선생님을 인터뷰했습니다.

그림을, 예술을 하고 싶어하는 아이들에게 두 가지를 물었어요.

"가장 하고 싶은 게 뭐예요?"
"가장 필요한 게 뭐예요?"

저도 내가 좋아하는 걸 하면서 평생 살고 싶어서 창업했거든요.
그 마음이 이 아이들을 만나게 했고, 이 일을 계속하게 합니다.

---

사생대회로 시작된 인터뷰는 지금 전국 최초 장애문화예술주간으로 이어졌고,
특수학교 3개 × 장애예술가 개인전 2개, 두 달간 8,000명이 찾아왔습니다.

그 중 가장 기억에 남는 장면—
목과 목소리만 쓸 수 있는 지체장애 학생들이
ChatGPT 음성인식으로 직접 만든 AI 미디어아트 앞에 섰을 때입니다.

소비자가 원하는 걸 가장 정직하게 구현한 순간이었습니다.

올해부터는 장애유형별 생성형 AI 교육 프로그램을 본격 운영합니다.
아이들이 어떻게 변화하는지, 지켜봐주세요.`;

const DEFAULT_TAGS = [true, true, true, true, true, false, false, false];

export default function FounderStoryMode() {
  const [hookIndex, setHookIndex] = useState<number | null>(null);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [ctaIndex, setCtaIndex] = useState<number | null>(null);
  const [tags, setTags] = useState(DEFAULT_TAGS);

  const handleHookSelect = useCallback((i: number) => {
    setHookIndex((prev) => {
      const newIndex = prev === i ? null : i;
      setBody((prevBody) => {
        const lines = prevBody.split("\n");
        const hookText = newIndex !== null ? HOOKS[newIndex].text : HOOKS[0].text;
        const [line1, line2] = hookText.split("\n");
        lines[0] = line1;
        lines[1] = line2;
        return lines.join("\n");
      });
      return newIndex;
    });
  }, []);

  const handleCtaSelect = useCallback((i: number) => {
    setCtaIndex((prev) => (prev === i ? null : i));
  }, []);

  const handleTagToggle = useCallback((i: number) => {
    setTags((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }, []);

  const selectedTags = useMemo(
    () => ALL_TAGS.filter((_, i) => tags[i]).join(" "),
    [tags]
  );

  const fullPost = useMemo(() => {
    let post = body;
    if (ctaIndex !== null) post += CTAS[ctaIndex].text;
    if (selectedTags) post += "\n\n" + selectedTags;
    return post;
  }, [body, ctaIndex, selectedTags]);

  const charCount = fullPost.length;
  const lineCount = fullPost.split("\n").length;
  const tagCount = tags.filter(Boolean).length;

  return (
    <div className="space-y-8">
      <HookSelector selected={hookIndex} onSelect={handleHookSelect} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Step 2 — 본문 편집</h2>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <CtaSelector selected={ctaIndex} onSelect={handleCtaSelect} />
      <HashtagToggle selected={tags} onToggle={handleTagToggle} />

      <div className="border-t border-border pt-8">
        <LivePreview
          fullPost={fullPost}
          charCount={charCount}
          lineCount={lineCount}
          tagCount={tagCount}
        />
      </div>
    </div>
  );
}
