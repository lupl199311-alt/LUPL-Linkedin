# LUPL 링크드인 포스트 생성기

장애청소년 AI 교육 수업 후, **매일 가벼운 감상 포스트**를 2026 링크드인 알고리즘에 맞춰 자동 생성하는 웹앱입니다. 러버블(Lovable) 없이 **GitHub + Vercel + Supabase**로 운영합니다.

## 두 가지 모드

- **감상 모드** — ① 장소·수업 ② 한 장면 ③ 감정을 적으면, OpenAI가 톤 3종(담담한/따뜻한/단단한) 초안을 만들어 줍니다. 마음에 드는 걸 복사해 올리고, 기록은 Supabase에 저장됩니다.
- **창업 스토리 모드** — 기존 4단계 프리셋(훅→본문→CTA→해시태그)을 그대로 유지.

## 기술 구조

```
브라우저(React)  →  /api/* (Vercel 서버리스)  →  OpenAI / Supabase
```

OpenAI 키와 Supabase service_role 키는 **서버리스 함수 안에만** 존재합니다. 브라우저로는 절대 내려가지 않습니다.

---

## 설치 & 배포 (처음 한 번만, 약 15분)

### 1) GitHub에 코드 올리기

이 폴더를 새 GitHub 저장소에 올립니다.

```bash
git init
git add .
git commit -m "LUPL LinkedIn generator v2"
git branch -M main
git remote add origin https://github.com/<내계정>/<저장소이름>.git
git push -u origin main
```

> 깃허브 계정/저장소 생성은 보안상 직접 해주세요. `.env`는 `.gitignore`에 등록돼 있어 올라가지 않습니다.

### 2) OpenAI API 키 발급

1. https://platform.openai.com/api-keys 접속 → **Create new secret key**
2. 생성된 `sk-...` 키를 복사해 둡니다. (이 화면을 닫으면 다시 못 보니 메모)
3. 결제 수단이 등록돼 있어야 호출됩니다. (gpt-4o-mini는 글당 비용이 매우 적습니다)

### 3) Supabase 준비 (저장 기능을 쓸 때만)

1. https://supabase.com → 새 프로젝트 생성
2. 좌측 **SQL Editor** → `supabase_schema.sql` 내용을 붙여넣고 **RUN**
3. **Settings → API**(또는 Data API)에서 아래 두 값을 복사
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ anon 키 아님, service_role)

> Supabase를 건너뛰어도 생성·복사 기능은 정상 작동합니다. 저장만 안 될 뿐입니다.

### 4) Vercel에 배포

1. https://vercel.com → **Add New → Project** → 1번에서 만든 GitHub 저장소 선택
2. Framework는 **Vite**로 자동 인식됩니다. 그대로 두면 됩니다.
3. 배포 전에 **Environment Variables**에 아래를 입력 (`.env.example` 참고):

   | 이름 | 값 | 필수 |
   |------|-----|------|
   | `OPENAI_API_KEY` | 2번에서 받은 `sk-...` | ✅ |
   | `OPENAI_MODEL` | `gpt-4o-mini` (선택) | ⬜ |
   | `SUPABASE_URL` | 3번의 Project URL | 저장 쓸 때 |
   | `SUPABASE_SERVICE_ROLE_KEY` | 3번의 service_role 키 | 저장 쓸 때 |

4. **Deploy** 클릭. 끝나면 `https://<프로젝트>.vercel.app` 주소가 나옵니다.

> 환경변수를 나중에 바꾸면 **Deployments → Redeploy** 한 번 해주세요.

### 5) 러버블(Lovable) 구독 해지

위까지 끝나 Vercel 주소가 잘 열리면, 러버블은 더 이상 필요 없습니다. Lovable 대시보드 → Settings/Billing에서 구독을 해지하면 됩니다. (코드는 이미 GitHub에 있으니 안전합니다.)

---

## 로컬에서 돌려보기 (선택)

```bash
npm install
```

- **프론트엔드만** 미리 보기: `npm run dev` → http://localhost:8080
- **/api 함수까지 같이** 테스트하려면 Vercel CLI 사용:
  ```bash
  npm i -g vercel
  vercel dev
  ```
  로컬에서도 `.env`에 키가 있어야 생성이 됩니다.

---

## 자주 만지는 곳

- **글 골격 / AI 규칙** → `api/_prompt.ts` (시스템 프롬프트)
- **해시태그 기본 세트** → `src/components/DailyReflectionMode.tsx` 의 `HASHTAGS`
- **톤 종류** → `api/_prompt.ts` 의 `TONES`
- **모델 변경** → Vercel 환경변수 `OPENAI_MODEL`

## 비용 참고

gpt-4o-mini 기준 글 한 번 생성(3종)당 비용은 보통 수십 원 이하입니다. Vercel·Supabase 무료 플랜으로 충분히 운영됩니다.
