# 웹툰허브 — 배포 가이드

> GitHub 가입만 돼 있어도 이 가이드를 따라하면 30분 안에 실제 서비스 배포 가능

---

## 전체 순서

```
1단계 Supabase  → DB 세팅 (10분)
2단계 GitHub    → 코드 올리기 (5분)
3단계 Vercel    → 배포 (5분)
4단계 관리자    → 내 계정을 관리자로 설정 (2분)
5단계 CSV 업로드 → 작품 데이터 등록 (3분)
```

---

## 1단계. Supabase DB 세팅

### 1-1. 프로젝트 만들기
1. https://supabase.com 접속 → 구글/깃허브 계정으로 가입
2. **New Project** 클릭
3. 이름: `webtoonhub` / 비밀번호 설정 / 서버: `Northeast Asia (Seoul)` 선택
4. 2분 기다리면 프로젝트 생성 완료

### 1-2. 테이블 만들기
1. 왼쪽 메뉴 → **SQL Editor** 클릭
2. `supabase/schema.sql` 파일 전체 복사
3. SQL Editor에 붙여넣기 → **Run** 클릭
4. "Success" 뜨면 완료 ✅

### 1-3. 이메일 인증 설정 (선택)
1. 왼쪽 메뉴 → **Authentication** → **Email** → **Confirm email** OFF로 변경
2. (OFF로 해야 회원가입 후 바로 로그인 가능)

### 1-4. API 키 복사
1. 왼쪽 메뉴 → **Settings** → **API**
2. `Project URL` 복사 → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`에 붙여넣기
3. `anon public` 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 붙여넣기

---

## 2단계. GitHub에 코드 올리기

### 2-1. 새 레포지토리 만들기
1. https://github.com 로그인
2. 오른쪽 상단 **+** → **New repository**
3. Repository name: `webtoonhub`
4. **Public** 선택 → **Create repository**

### 2-2. 파일 업로드
1. 레포지토리 페이지에서 **Add file** → **Upload files**
2. 이 프로젝트 폴더의 파일 전체를 드래그
   - ⚠️ `.env.local`은 업로드하지 마세요! (비밀키 포함)
3. **Commit changes** 클릭

---

## 3단계. Vercel로 배포

1. https://vercel.com 접속 → **GitHub으로 로그인**
2. **Add New Project** → GitHub 레포 선택 (`webtoonhub`)
3. **Environment Variables** 섹션에 환경변수 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = (Supabase URL)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (Supabase anon key)
   NEXT_PUBLIC_ADMIN_EMAIL      = (내 이메일)
   ```
4. **Deploy** 클릭 → 2분 후 배포 완료 🎉
5. `webtoonhub.vercel.app` 같은 주소 자동 생성됨

---

## 4단계. 관리자 계정 설정

1. 배포된 사이트에서 **회원가입** (내 이메일로)
2. Supabase → **Table Editor** → `profiles` 테이블
3. 내 계정 행에서 `is_admin` 컬럼을 `true`로 변경
4. 이제 사이트 헤더에 **관리자** 버튼이 보임

---

## 5단계. CSV로 작품 등록

1. 사이트 헤더 → **관리자** 클릭
2. **CSV 파일 선택** → 직접 만든 CSV 파일 선택
3. 미리보기 확인 후 **업로드 확정** 클릭
4. 메인 페이지에 작품 즉시 표시됨 ✅

### CSV 형식
```csv
Index,Name,Platform,Schedule,Genre,End,PageLink
Int,String,String,String,String,Boolean,String
1,화산귀환,네이버,수,무협,N,https://comic.naver.com/...
2,나 혼자만 레벨업,카카오페이지,,판타지,Y,https://page.kakao.com/...
```

---

## 나중에 도메인 연결하기

1. 가비아(gabia.com)에서 도메인 구매 (예: `webtoonhub.kr`)
2. Vercel → 프로젝트 → **Domains** → 도메인 입력
3. Vercel이 알려주는 DNS 값을 가비아 DNS 설정에 입력
4. 24시간 후 적용 완료

---

## 문제 해결

| 증상 | 해결법 |
|------|--------|
| 작품이 안 보임 | Supabase RLS 정책 확인, works_with_stats 뷰 생성 여부 확인 |
| 로그인이 안 됨 | Supabase → Authentication → Email 설정 확인 |
| 관리자 버튼 없음 | profiles 테이블에서 is_admin = true 확인 |
| 배포 후 흰 화면 | Vercel 환경변수 NEXT_PUBLIC_SUPABASE_URL 입력 확인 |

---

## 기술 스택 요약

| 역할 | 기술 | 비용 |
|------|------|------|
| 프론트엔드 | Next.js 14 (TypeScript) | 무료 |
| 호스팅 | Vercel | 무료 |
| DB + 인증 | Supabase | 무료 (500MB) |
| 도메인 | 가비아 / 후이즈 | 연 2만원 (선택) |
