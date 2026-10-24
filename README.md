# 그레이스 위클리 (Grace Weekly) 📖
> **300명 규모 교회를 위한 장년 친화형 스마트 모바일 주보 & 웹 관리자 시스템**

---

## 1. 프로젝트 소개
* **대상**: 50~70대 장년층 성도가 중심인 300명 규모의 교회
* **핵심 가치**:
  * **프레임워크 프리 (Pure Vanilla HTML/CSS/JS)**: 빠른 로딩 (0.8초 이내), 극대화된 경량성
  * **Human-Crafted Anti-AI Aesthetic**: 전통 인쇄 주보의 단정함과 아날로그 서체 감성을 살린 **Warm Editorial Clean Style**
  * **장년 친화 기능**:
    * 별도 앱 설치나 가입 없이 카카오톡 링크/QR 접속 즉시 열람
    * 원터치 **큰 글씨 모드** 토글 (폰트 크기 및 행간 확대)
    * 본문 말씀 읽기 인라인 아코디언 토글
    * 온라인 헌금 계좌 원터치 복사 및 안내
  * **찬양대 특화**:
    * 주일 1부: **임마누엘 찬양대** (권사 중심 은혜 찬양)
    * 주일 2부: **시온 찬양대** (본예배 중심)
    * 수요기도회: **헵시바 찬양대** (특송)
  * **직분자 구성**: 담임목사, 시무장로 6인, 안수집사 및 권사회 중심
  * **보안 및 인증 (Supabase Auth)**:
    * 구글 소셜 로그인
    * 승인 관리 체계 (`대기(pending)` ➔ `승인(editor)` ➔ `관리자(admin)`)

---

## 2. 기술 스택
* **프론트엔드**: Vanilla HTML5, CSS3, ES Modules (CDN: `@supabase/supabase-js@2`)
* **데이터베이스 & 인증**: Supabase PostgreSQL (RLS, Triggers, Google OAuth)
* **호스팅 & 배포**: Vercel

---

## 3. 디렉토리 구조
```
church-weekly/
├── .gitignore
├── vercel.json                 # Vercel 배포 라우팅 및 보안 헤더 설정
├── supabase/
│   ├── config.toml             # Supabase CLI 설정
│   └── migrations/
│       └── 20261025_init.sql   # 스키마, RLS 및 초기 주보 시드 데이터
├── index.html                  # 성도용 모바일 주보 메인 뷰어
├── admin.html                  # 구글 로그인 및 주보/승인 관리 페이지
├── css/
│   ├── typography.css          # 명조/고딕 감성 서체 및 줄간격 정의
│   ├── bulletin.css            # 주보 지면 레이아웃 & 테마 스타일
│   └── admin.css               # 관리자 패널 스타일
├── js/
│   ├── supabaseClient.js       # Supabase 클라이언트 초기화 및 API 모듈
│   ├── auth.js                 # 구글 로그인 & 세션 체크
│   ├── admin-guard.js          # 승인 상태 체크 및 관리자 테이블 렌더링
│   └── app.js                  # 주보 데이터 실시간 바인딩 & 클립보드 복사
└── assets/
    └── emblem.svg              # 단정한 교회 십자가 엠블럼
```

---

## 4. 로컬 테스트 및 배포

### 4.1 로컬 실행
정적 파일이므로 임의의 로컬 웹서버로 즉시 실행 가능합니다:
```bash
npx serve .
# 또는 VS Code Live Server
```

### 4.2 Supabase 마이그레이션
```bash
supabase link --project-ref bzgtchffxmkkdsctrdtq
supabase db push
```

### 4.3 Vercel 배포
```bash
vercel --prod
```
