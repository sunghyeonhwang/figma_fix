# Figma Comment Triage

Figma 파일 코멘트를 수집해서 오탈자, 띄어쓰기, 기능오류, 수정사항 등으로 분류하고 Markdown/Excel로 다운로드하는 내부 검수용 웹앱입니다.

## 주요 기능

- Supabase Auth 로그인 게이트
- Figma URL에서 file key/node id 추출
- Figma comments API로 댓글/답글 수집
- 코멘트 자동 분류
  - 오탈자
  - 띄어쓰기
  - 문구수정
  - 기능오류
  - 수정사항
  - 디자인/UI
  - 링크/버튼
  - 일정/정보
  - 기타
- 해결/미해결, 날짜, 작성자, 검색어, 분류 필터
- 분류별 Markdown 다운로드
- Excel 리포트 다운로드
- Supabase DB에 분석 실행 이력과 Markdown export 로그 저장

## 로컬 실행

```bash
npm install
cp env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

Supabase 없이 UI만 확인하려면 `http://localhost:3000/test-demo`를 사용할 수 있습니다.

## 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://figma-comment-reader.vercel.app
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=griff.co.kr
FIGMA_ACCESS_TOKEN=figd_optional_server_token
```

`FIGMA_ACCESS_TOKEN`은 선택값입니다. 사용자는 앱 설정에서 개인 Figma token을 입력할 수 있습니다.
Google provider를 Supabase에서 켜기 전에는 `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false`로 둡니다.
앱과 API는 기본적으로 `@griff.co.kr` 이메일만 허용합니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. Authentication에서 Email provider를 활성화합니다.
3. Site URL을 `https://figma-comment-reader.vercel.app`로 설정합니다.
4. Redirect URL에 로컬/배포 주소를 추가합니다.
   - `http://localhost:3000`
   - `https://your-vercel-domain.vercel.app`
   - `https://figma-comment-reader.vercel.app`
5. `supabase/migrations/20260611000000_initial_schema.sql`을 SQL Editor에서 실행합니다.

분석을 실행하면 `figma_comment_runs`에 파일/분류/원본 댓글 JSON이 저장되고, Markdown을 다운로드하면 `markdown_exports`에 export 로그가 저장됩니다.

## Google 로그인 사용

현재 Google provider가 꺼져 있으면 `Unsupported provider: provider is not enabled` 오류가 납니다. Google 로그인을 쓰려면:

1. Google Cloud Console에서 OAuth Client ID/Secret을 만듭니다.
2. Supabase Dashboard → Authentication → Providers → Google을 켭니다.
3. Supabase Google provider 화면의 Callback URL을 Google OAuth redirect URI에 추가합니다.
4. Supabase Auth URL Configuration에 `https://figma-comment-reader.vercel.app`을 Redirect URL로 추가합니다.
5. Vercel에 `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`를 추가하고 재배포합니다.

Google 설정 전에는 이메일 매직 링크 로그인을 사용합니다.
Google provider가 켜져 있어도 앱/API는 `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` 값과 일치하는 이메일만 허용합니다.

## Magic Link가 localhost로 가는 경우

Supabase Dashboard → Authentication → URL Configuration에서 아래처럼 맞춥니다.

- Site URL: `https://figma-comment-reader.vercel.app`
- Redirect URLs:
  - `https://figma-comment-reader.vercel.app`
  - `https://figma-comment-reader.vercel.app/**`
  - `http://localhost:3000` only for local testing

앱은 `NEXT_PUBLIC_SITE_URL`을 magic link와 Google OAuth redirect URL로 사용합니다.

## Vercel 환경변수 등록

`.env.local`에 Supabase 값을 채운 뒤 아래 명령으로 Vercel production 환경변수에 등록할 수 있습니다.

```bash
npm run env:push
vercel deploy --prod --yes
```

이미 같은 이름의 Vercel env가 있으면 Vercel Dashboard에서 기존 값을 삭제한 뒤 다시 실행합니다.

## Figma 권한

MVP는 Figma Personal Access Token 또는 OAuth access token을 받습니다.

필요 권한:

- `file_comments:read`
- 파일 메타데이터를 읽으려면 `file_content:read` 또는 개인 토큰의 파일 접근 권한이 필요합니다.

Figma comments API는 `GET /v1/files/:key/comments?as_md=true`를 사용합니다.

## Vercel 배포

1. GitHub repository: `https://github.com/sunghyeonhwang/figma_fix`
2. Vercel에서 해당 repository를 import합니다.
3. Environment Variables에 Supabase/Figma 값을 추가합니다.
4. Deploy를 실행합니다.

## 개발 명령어

```bash
npm run dev
npm run lint
npm run build
npm run env:push
```
