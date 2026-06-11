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
FIGMA_ACCESS_TOKEN=figd_optional_server_token
```

`FIGMA_ACCESS_TOKEN`은 선택값입니다. 사용자는 앱 설정에서 개인 Figma token을 입력할 수 있습니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. Authentication에서 Email provider 또는 Google provider를 활성화합니다.
3. Site URL을 배포 URL로 설정합니다.
4. Redirect URL에 로컬/배포 주소를 추가합니다.
   - `http://localhost:3000`
   - `https://your-vercel-domain.vercel.app`
   - `https://figma-comment-reader.vercel.app`
5. `supabase/migrations/20260611000000_initial_schema.sql`을 SQL Editor에서 실행합니다.

분석을 실행하면 `figma_comment_runs`에 파일/분류/원본 댓글 JSON이 저장되고, Markdown을 다운로드하면 `markdown_exports`에 export 로그가 저장됩니다.

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
