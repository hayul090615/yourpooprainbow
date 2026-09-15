# 니똥칼라똥 — Service Frontend & Backend

사용자의 현재 위치를 기준으로 주변 화장실을 검색하고, 위치 정보와 도보·자전거·자동차 경로를 제공하는 지도 기반 웹 서비스입니다.

- 서비스 주소: https://yourpooprainbow.vercel.app
- 작업 브랜치: `total--restroom`
- 개발 인원 및 기간: 2명, 4주

## 핵심 기능

- 카카오맵 기반 화장실 장소 검색과 마커 클러스터링
- 브라우저 GPS를 이용한 현재 위치 표시
- 반경 5km 이내 화장실 검색
- 목록에 현재 위치에서 직선거리 기준으로 가장 가까운 화장실 목록
- 현재 지도 영역 재검색 및 지역명 검색
- 화장실 목록·마커·상세 팝업 연동
- 선택한 화장실까지 도보·자전거·자동차 경로, 거리, 예상 시간 표시
- 이동수단 선택에 따른 경로 재계산 및 경로 안내 메시지
- 지도에서 실제 출발 위치 직접 조정
- 로그인·회원가입·Google 로그인 UI
- 화장실 제보 및 서비스 요청사항 입력
- 반응형 UI, 다크 모드, 일반지도·위성뷰 지원
- 코인·똥 피하기 미니게임: 5단계 성장, 단계별 난이도, 3목숨, 최고기록, 일시정지

## 화장실 지도 최근 반영 내용

- 화곡역을 중심으로 반경 5km 이내 화장실을 표시하며, 서울시 공공데이터(OA-22586) 기반의 주변 공중·개방화장실 정보를 함께 제공합니다.
- 화곡역·까치산역을 포함한 지하철역 화장실과 화곡동의 주민센터, 서울화곡우체국, 꿈돌이어린이공원 등 확인된 시설을 추가했습니다.
- 빨간색 여성·파란색 남성 아이콘 마커를 사용하고, 마커 선택 시 상세 정보·운영시간·리뷰와 `길찾기 시작` 버튼을 제공합니다.
- 도보·자전거·자동차 경로를 선택할 수 있으며, 현재 위치 갱신으로 지도가 흔들리지 않도록 위치 업데이트와 마커 렌더링을 최적화했습니다.
- 지도 이동 시 요청을 디바운스하고 검색 페이지·동시 요청 수를 제한해 초기 로딩과 갱신 지연을 줄였습니다.

## 사용 기술

| 영역 | 기술 |
| --- | --- |
| Frontend | React 18, Vite, TypeScript |
| Map | Kakao Map SDK, react-kakao-maps-sdk |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, pg |
| Directions | Vercel Function, OSM/OSRM 기반 도보·자전거 경로, Kakao Mobility 자동차 경로 |
| Deployment | Vercel |
| Collaboration | Git, GitHub |

## 서비스 구조

```text
사용자 브라우저
└─ React + Vite + TypeScript
   ├─ Home
   │  ├─ SearchBar
   │  └─ Map
   │     ├─ Kakao Map SDK → 지도·장소 검색·마커
   │     └─ directionsService → /api/directions
   ├─ Auth
   │  └─ authService → 현재 localStorage 기반 세션
   └─ Service
      ├─ toiletService → mock 및 OSM 서울·경기도·비수도권 정적 데이터
      └─ 화장실 제보·요청사항 → 현재 localStorage 임시 저장

/api/directions (Vercel Function)
└─ backend/src/services/directions-service.ts
   ├─ 도보·자전거: OSM/OSRM 경로 데이터 반환
   └─ 자동차: Kakao Mobility 경로 데이터 반환

Express REST API
└─ /toilets CRUD
   └─ PostgreSQL public.toilets

길찾기 이용자 집계
└─ /api/directions?resource=presence
   └─ PostgreSQL public.toilet_direction_presence
```

프론트엔드는 PostgreSQL에 직접 접근하지 않습니다. 실제 데이터 연결은 `src/services`에서 Express API를 호출하는 방식으로 진행합니다.

## 미니게임 규칙

지도 화면에서 실행할 수 있는 코인·똥 피하기 게임입니다.

- 코인 10개를 모을 때마다 다음 단계로 성장합니다.
- 똥 개수는 1단계 8개, 2단계 10개, 3단계 11개, 4단계 12개, 5단계 14개입니다.
- 2단계부터 단계별로 2배·2.5배·3배 크기의 똥이 하나씩 랜덤 등장합니다.
- 5단계에서는 똥 3개가 붙은 특수 똥이 등장하고, 이후에는 `STAGE 5+` 무한 난이도로 똥이 계속 증가합니다.
- 생명은 3개이며 똥에 맞아도 생명만 줄고 즉시 게임을 계속합니다.
- 최고기록은 브라우저 `localStorage`에 저장되며, `⏸️` 버튼으로 게임을 일시정지할 수 있습니다.
- 위쪽 출발선에서 아이템이 생성되고, 하단 안전선에 닿은 놓친 아이템은 불꽃 효과와 함께 제거됩니다.

## 최근 추가된 기능

기존 기능에 다음 개선 사항이 추가되었습니다.

- 로그인 화면을 좌측 서비스 소개·지도 시각화와 우측 로그인 카드의 2열 구조로 개선했습니다.
- 로그인 카드에 비밀번호 보기·숨기기 기능과 `Google로 계속하기` 버튼을 추가했습니다.
- 로그인 화면의 강조색을 사이트 대표색인 주황색으로 통일하고, 무지개 그라데이션 대신 지도 격자와 장식 요소를 적용했습니다.
- 게임 시작 전에 무지개가 화면 위에서 아래까지 슬라이드하며, 효과가 끝난 뒤 게임이 시작됩니다.
- 똥과 코인은 미리 여러 위치에 배치하지 않고 상단 출발선에서 생성되며, 일정한 간격으로 하나씩 떨어집니다.
- 아이템은 화면 전체 폭에 걸쳐 생성되고, 똥 회전·코인 획득 효과·충돌 효과를 유지하면서 PC와 모바일에서 부드럽게 동작하도록 화면 갱신을 최적화했습니다.
- PC에서는 마우스와 방향키, 모바일에서는 화면 좌우 드래그·터치로 변기를 조작할 수 있습니다.
- 게임 화면의 초기 아이템은 미리 떨어진 위치에 배치되지 않고 상단 출발선에서 생성되며, 생성 대기시간을 두어 순서대로 투하됩니다.

### 개인 화장실 추가 정책

- 지도에서 사용자가 직접 추가한 화장실은 `userToiletService`를 통해 현재 계정의 브라우저 `localStorage`에만 저장됩니다.
- 개인 추가 화장실은 다른 사용자에게 공유되지 않으며, 본인 지도에서만 초록색 마커로 표시·수정·삭제할 수 있습니다.
- 개인 추가 화장실은 공용 화장실의 실시간 길찾기 이용자 수 집계 대상에서 제외됩니다.
- 따라서 `몇 명 가는 중 · 잠시 대기 가능` 안내는 공용 화장실에만 표시됩니다.

### 로그인 화면 개선

- 데스크톱 로그인 화면은 참고 디자인에 맞춰 왼쪽에 서비스 소개·지도 시각화, 오른쪽에 로그인 카드를 배치한 2열 레이아웃으로 정리했습니다.
- 로그인 카드의 위치·크기·좌우 여백을 조정해 화면 오른쪽에 안정적으로 배치하고, 서비스 소개와 카드가 붙어 보이지 않도록 간격을 조정했습니다.
- 로그인 화면의 대표 강조색은 사이트 전체와 동일한 주황색으로 적용했습니다.
- 로그인 화면은 `100vh`·`100dvh` 기준으로 전체 화면을 사용하며, `html`·`body`·`#root`까지 스크롤을 차단해 브라우저 우측 스크롤바가 생기지 않도록 했습니다.
- 세로 패딩, 지도 시각화 높이, 로그인 카드 내부 여백을 화면 높이에 맞게 반응형으로 조정해 카드와 지도 아래에 여백이 남도록 했습니다.
- 길찾기 중 GPS 위치를 계속 갱신하고, 목적지 40m 이내에 도착하면 길찾기를 자동 종료하며 본인 이용자 수를 차감합니다.
- 게임의 단계별 똥 투하량을 늘려 1단계부터 더 높은 난이도로 조정했습니다.

### 지도 검색·목록 및 길찾기 추가 개선

- 현재 위치 권한을 허용하면 지도 진입 시 GPS 위치를 자동으로 확인하고, 현재 위치를 중심으로 반경 5km 이내의 화장실만 지도 마커와 오른쪽 목록에 표시합니다.
- 사용자가 직접 추가한 개인 화장실도 같은 5km 범위 필터를 적용하며, 위치 권한을 거부하면 기존 지도 탐색 기능을 사용할 수 있습니다.
- 지도 마커 클러스터링을 제거해 확대·축소 단계와 관계없이 화장실을 개별 마커로 표시합니다.
- 오른쪽 `가까운 화장실` 목록은 현재 GPS 위치와 화장실 좌표의 직선거리를 다시 계산해 가까운 순서로 정렬합니다. GPS 위치가 없을 때는 데이터에 저장된 거리 표기를 기준으로 정렬합니다.
- 모든 화장실 정보 팝업에 우측 상단 닫기(`×`) 버튼을 추가했습니다.
- 길찾기를 종료하면 도착지용 빨간 마커, 출발지용 마커, 경로와 선택 팝업이 일반 지도 상태로 즉시 초기화되도록 처리했습니다.
- 지도 이동·확대·축소 검색은 대기 시간을 줄이고, 검색 결과가 모두 도착할 때까지 기다리지 않고 먼저 도착한 결과부터 표시하도록 개선했습니다. 오래된 지도 검색 결과는 새 검색 결과에 덮어쓰지 않습니다.
- 현재 위치 버튼을 누르면 GPS 위치를 확인한 뒤 지도 중심을 해당 위치로 직접 이동하고, 주변 화장실을 확인하기 좋은 확대 수준으로 자동 조정합니다.

### 똥게임 최근 추가 개선

- 4단계와 5단계에서 코인을 끌어당기는 자석 아이템이 낮은 확률로 등장합니다.
- 자석은 떨어지기 전의 코인까지 끌어당기지 않고, 실제로 떨어지는 코인 최대 3개만 끌어당긴 뒤 자동 해제됩니다.
- 단계가 바뀌면 자석 효과가 초기화되어 다음 단계까지 유지되지 않습니다.
- 5단계 이후 최고 난이도에서는 코인 생성량을 늘렸고, 아이템 위치를 DOM 변환으로 갱신해 PC와 모바일의 애니메이션 렉을 줄였습니다.

> 참고: 기존 문서에 남아 있는 마커 클러스터링 표현과 달리, 현재 배포 버전의 지도는 개별 화장실 마커를 표시합니다.

## 프로젝트 파일 구조

```text
.
├─ api/
│  └─ directions.ts                  # Vercel 이동수단별 길찾기 함수
├─ backend/
│  ├─ src/
│  │  ├─ config/env.ts               # 백엔드 환경변수
│  │  ├─ db/
│  │  │  ├─ pool.ts                  # PostgreSQL 연결 풀
│  │  │  └─ test-connection.ts       # DB 연결 확인
│  │  ├─ routes/directions.ts        # 길찾기 라우터
│  │  ├─ services/directions-service.ts
│  │  └─ server.ts                   # Express 서버와 toilets CRUD
│  ├─ sql/
│  │  ├─ 001_create_database.sql
│  │  ├─ 002_create_tables.sql
│  │  ├─ 003_seed_restrooms.sql
│  │  └─ 004_migrate_to_toilets.sql
│  └─ package.json
├─ src/
│  ├─ components/
│  │  ├─ Header.tsx
│  │  ├─ Map.tsx                     # 지도 검색·마커·이동수단별 길찾기
│  │  ├─ AuthSideGame.tsx            # 코인·똥 피하기 미니게임
│  │  ├─ SearchBar.tsx
│  │  ├─ ToiletCard.tsx
│  │  ├─ ToiletLocationMap.tsx
│  │  └─ GoogleSignInButton.tsx
│  ├─ data/
│  │  ├─ seoulToiletData.ts          # OSM 서울 화장실 압축 좌표
│  │  ├─ gyeonggiToiletData.ts       # OSM 경기도 화장실 압축 데이터
│  │  └─ regionalToiletData.ts       # OSM 비수도권 화장실 압축 데이터
│  ├─ pages/
│  │  ├─ Home.tsx                    # 메인 지도 페이지
│  │  ├─ Auth.tsx                    # 로그인·회원가입
│  │  └─ Service.tsx                 # 고객센터·추천·제보
│  ├─ services/
│  │  ├─ authService.ts              # 현재 로컬 인증 처리
│  │  ├─ directionsService.ts        # 이동수단별 경로 API 호출
│  │  ├─ locationService.ts          # 좌표 거리 계산
│  │  └─ toiletService.ts            # mock 및 압축 정적 화장실 데이터
│  ├─ styles/
│  ├─ types/
│  │  ├─ auth.ts
│  │  └─ toilet.ts
│  ├─ RootApp.tsx                    # map/auth/service 화면 전환
│  └─ main.tsx
├─ .env.example
├─ vercel.json
└─ package.json
```

루트에 남아 있는 기존 파일은 이전 구조와의 호환 및 개발 기록을 위해 유지합니다. 현재 프론트엔드 진입점과 주요 코드는 `src` 아래에 있습니다.

## 주요 데이터 구조

### 프론트엔드 Toilet

```ts
type Toilet = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: string;
  openAllDay: boolean;
  accessible: boolean;
  hours?: string;
  facilityType?: 'public' | 'building' | 'station' | 'park' | 'other';
  locationDetail?: string;
  genderType?: 'separated' | 'unisex' | 'unknown';
  babyFacility?: boolean;
  status?: 'pending' | 'approved';
};
```

### 프론트엔드와 DB 필드 대응

| Frontend | PostgreSQL | 설명 |
| --- | --- | --- |
| `id` | `id` | 고유 식별자 |
| `name` | `name` | 화장실 이름 |
| `address` | `address` | 주소 |
| `latitude` | `latitude` | 위도 |
| `longitude` | `longitude` | 경도 |
| `openAllDay` | `open_24h` | 24시간 운영 여부 |
| `hours` | `opening_hours` | 운영시간 |
| `accessible` | `accessible` | 장애인 접근 가능 여부 |
| `babyFacility` | `diaper_changing_table_available` | 기저귀 교환대 |

현재 위치에 따라 달라지는 `distance`는 고정 시설 정보가 아니므로 프론트엔드에서 실행 시 계산합니다. 사용자의 현재 위치는 데이터베이스에 영구 저장하지 않습니다.

PostgreSQL에는 계단 수, 비밀번호 필요 여부, 남녀 화장실 수, 비상벨 여부 등 추가 편의정보도 저장할 수 있습니다.

## API

### 화장실 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/toilets` | 전체 화장실 조회 |
| `GET` | `/toilets/:id` | 화장실 상세 조회 |
| `POST` | `/toilets` | 화장실 등록 |
| `PATCH` | `/toilets/:id` | 화장실 수정 |
| `DELETE` | `/toilets/:id` | 화장실 삭제 |

### 길찾기 API

`POST /api/directions`

`mode`에 따라 다음 경로 서비스를 사용합니다.

| `mode` | 이동수단 | 경로 서비스 |
| --- | --- | --- |
| `walk` | 도보 | OSM/OSRM 보행 경로 |
| `bicycle` | 자전거 | OSM/OSRM 자전거 경로 |
| `car` | 자동차 | Kakao Mobility 자동차 경로 |

```json
{
  "origin": { "latitude": 37.5665, "longitude": 126.9780 },
  "destination": {
    "latitude": 37.5663,
    "longitude": 126.9779,
    "name": "시청역 공중화장실"
  },
  "mode": "walk"
}
```

응답에는 선택한 이동수단의 거리, 예상 시간, 지도에 표시할 경로 좌표가 포함됩니다. 화면에서 이동수단을 바꾸면 같은 출발지와 목적지로 경로를 다시 계산합니다.

### 길찾기 이용자 수 API

화장실별로 현재 길찾기를 진행 중인 익명 방문자 세션을 PostgreSQL에 저장합니다. 프론트엔드는 15초마다 heartbeat를 보내고 10초마다 화면의 숫자를 갱신합니다. 45초 이상 갱신되지 않은 세션은 자동으로 현재 인원에서 제외됩니다.

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/directions?resource=presence&toiletIds=...` | 화장실별 현재 길찾기 인원 조회 |
| `PUT` | `/api/directions?resource=presence` | 특정 화장실 길찾기 세션 등록·갱신 |
| `DELETE` | `/api/directions?resource=presence` | 특정 화장실 길찾기 세션 종료 |

### Google 로그인 API

POST /api/auth/google 요청 본문에는 Google Identity Services가 발급한 idToken을
전송합니다. 백엔드는 Google 서명과 대상 Client ID를 검증한 뒤 users 테이블에
사용자를 추가하거나 기존 사용자의 이름·이메일·프로필 이미지를 갱신합니다.

### 계정·피드백 API

| Method | Endpoint | 권한 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | 공개 | 일반 사용자 계정 생성 및 세션 발급 |
| `POST` | `/api/auth/login` | 공개 | 이메일 로그인 및 세션 발급 |
| `POST` | `/api/feedback` | 로그인 사용자 | 관리자에게 피드백 전송 |
| `GET` | `/api/feedback` | 관리자 | 전체 피드백 조회 |
| `PATCH` | `/api/feedback/:id` | 관리자 | 피드백 처리 상태 변경 |

`POST`, `PATCH`, `DELETE /toilets`는 관리자 세션만 호출할 수 있으며 조회 API는 공개입니다.

## 실행 방법

### 프론트엔드

```bash
npm ci
npm run dev
```

프로덕션 빌드 검증:

```bash
npm run build
```

필요한 프론트엔드 환경변수:

```env
VITE_KAKAO_MAP_KEY=example
VITE_GOOGLE_CLIENT_ID=example
VITE_API_BASE_URL=http://localhost:3000
```

VITE_GOOGLE_CLIENT_ID에는 Google Cloud Console에서 만든 Web OAuth Client ID를 넣습니다.
Client Secret은 프론트엔드에서 사용하지 않습니다.

실제 비밀값이 들어 있는 `.env`, `.env.local` 파일은 Git에 커밋하지 않습니다.

### 백엔드

```bash
npm --prefix backend ci
npm --prefix backend run dev
```

타입 검사와 DB 연결 확인:

```bash
npm --prefix backend run typecheck
npm --prefix backend run db:test
```

PostgreSQL 초기 설정:

```bash
npm --prefix backend run db:setup
```

기존 데이터베이스에 Google 사용자 테이블만 추가할 때는
npm --prefix backend run db:migrate:users 명령을 실행합니다.

기존 데이터베이스에 역할·세션·피드백 테이블을 추가할 때는 다음 마이그레이션을 이어서 실행합니다.

```bash
npm --prefix backend run db:migrate:auth
```

기존 데이터베이스에 화장실별 길찾기 이용자 집계 테이블을 추가할 때는 다음 마이그레이션을 실행합니다.

```bash
npm --prefix backend run db:migrate:presence
```

관리자 계정은 `backend/.env`에 `ADMIN_EMAIL`, `ADMIN_PASSWORD`(12자 이상),
`ADMIN_NAME`을 설정한 뒤 서버 측 명령으로 생성합니다. 비밀번호는 scrypt 해시로만 저장됩니다.

```bash
npm --prefix backend run admin:create
```

백엔드 환경변수에는 프론트와 동일한 Web OAuth Client ID를 GOOGLE_CLIENT_ID로
설정하고, FRONTEND_ORIGINS에 프론트엔드 주소를 등록합니다.

## 현재 구현 상태

### 완료

- 메인 지도, 검색, 마커, 목록과 상세정보
- 현재 위치 및 지도 검색 결과 거리 표시
- 서울 777곳·경기도 846곳·비수도권 3,397곳의 OSM 화장실 위치 데이터
- 도보·자전거·자동차 길찾기와 경로 시각화
- 화장실별 실시간 길찾기 이용자 수 표시
- Google ID token 백엔드 검증과 PostgreSQL 사용자 저장
- 화장실 제보와 요청사항 UI
- 모바일 반응형 UI와 다크 모드
- Vercel 프로덕션 배포
- Express 화장실 CRUD 및 PostgreSQL 스키마
- 코인·똥 피하기 미니게임 5단계 진행 및 5단계 이후 무한 난이도
- 단계별 똥 크기·똥 개수 변화, 3목숨, 최고기록 localStorage 저장
- 일시정지, 코인 획득 효과, 출발선·하단 안전선과 불꽃 효과

### 임시 구현

- 화장실 데이터: `toiletService`의 mock 및 [OpenStreetMap](https://www.openstreetmap.org/copyright) 정적 데이터
- 일반 이메일 로그인과 세션: 브라우저 `localStorage`
- Google 로그인: 사용자 정보는 PostgreSQL에 저장하고 브라우저에는 표시용 로그인 상태만 저장
- 화장실 제보와 요청사항: 브라우저 `localStorage`

임시 구현은 백엔드 API가 준비되면 `src/services` 내부 구현만 교체할 수 있도록 UI와 분리했습니다.

## 개발 방향

### 3주차 — 프론트엔드·백엔드 통합

1. 프론트엔드 `camelCase`와 DB `snake_case` 변환 규칙 확정
2. `GET /toilets`를 연결해 mock 화장실 데이터를 실제 데이터로 교체
3. 화장실 상세조회와 신규 제보 `POST /toilets` 연결
4. Google 로그인 이후 서버 세션 또는 자체 액세스 토큰 도입 검토
5. 요청사항 저장 API의 요청·응답 형식 설계
6. 위치 권한 거부, API 장애, 빈 결과 등 예외 상황 테스트
7. PC·모바일 통합 테스트와 접근성 개선

### 4주차 — 안정화 및 발표 준비

1. 통합 오류와 UI 문제 수정
2. API 입력값 검증 및 보안 점검
3. 성능과 지도 검색 범위 최적화
4. 최종 배포, 시연 시나리오, PPT 및 발표 자료 완성

## 협업 원칙

- 프론트엔드와 백엔드는 독립된 폴더와 책임 영역을 유지합니다.
- 프론트엔드에서 PostgreSQL에 직접 접근하지 않습니다.
- API 연결 전 요청·응답 형식과 오류 코드를 먼저 합의합니다.
- 기능 브랜치에서 작업하고 Pull Request를 통해 병합합니다.
- 비밀 환경변수는 커밋하지 않고 `.env.example`에는 예시만 기록합니다.
- 프론트엔드 변경 후 `npm run build`를 실행합니다.
- 백엔드 변경 후 `npm --prefix backend run typecheck`를 실행합니다.

---

<details>
<summary>초기 프로젝트 README 기록</summary>

아래 내용은 프로젝트 초기 구조와 개발 기준을 보존하기 위한 기록입니다.

## 📁 프로젝트 구조

프로젝트/
├── dist/                         # 빌드 결과물
├── node_modules/                 # 설치된 npm 패키지
│
├── src/                          # React 소스 코드
│   ├── components/               # 재사용 가능한 React 컴포넌트
│   │   └── KakaoMap.tsx
│   │
│   ├── pages/                    # 페이지 단위 컴포넌트
│   │   ├── Login.tsx             # 로그인 페이지
│   │   ├── Signup.tsx            # 회원가입 페이지
│   │   └── Home.tsx              # 메인 페이지
│   │
│   ├── services/                 # API 및 외부 서비스 관련 코드
│   ├── styles/                   # CSS 및 스타일 관련 코드
│   ├── types/                    # TypeScript 타입 정의
│   │
│   ├── App.tsx                   # 메인 React 애플리케이션
│   ├── main.tsx                  # React 앱 진입점
│   └── vite-env.d.ts             # Vite 환경변수 타입 설정
│
├── .env                          # 카카오 API 키 등 환경변수
├── .gitignore                    # Git에서 제외할 파일 설정
├── AGENTS.md                     # AI 개발 및 프로젝트 작업 규칙
├── index.html                    # 웹 페이지 기본 HTML
├── main.js                       # 기존 JavaScript 파일
├── package.json                  # 프로젝트 정보 및 npm 패키지 관리
├── package-lock.json             # 설치된 패키지 버전 기록
├── PROJECT_NOTES.md              # 프로젝트 개발 및 협업 메모
├── style.css                     # 기존 전역 CSS 스타일
│
├── tsconfig.app.json             # 애플리케이션 TypeScript 설정
├── tsconfig.app.tsbuildinfo      # TypeScript 앱 빌드 정보
├── tsconfig.json                 # TypeScript 기본 설정
├── tsconfig.node.json            # Node 환경 TypeScript 설정
├── tsconfig.node.tsbuildinfo     # Node TypeScript 빌드 정보
└── vite.config.ts                # Vite 설정

## 🛠️ 사용 기술

* **React** — 사용자 인터페이스 개발
* **TypeScript** — 타입 안정성을 갖춘 JavaScript 개발
* **Vite** — 프론트엔드 개발 및 빌드 환경
* **HTML5** — 웹 페이지 구조
* **CSS3** — 웹 페이지 스타일링
* **npm** — 패키지 및 의존성 관리
* **Git / GitHub** — 버전 관리 및 협업

## 📂 `src` 폴더 구조

### `components/`

여러 페이지에서 공통으로 사용할 수 있는 재사용 가능한 React 컴포넌트를 관리합니다.

예를 들어 버튼, 카드, 네비게이션, 모달 등의 UI 요소를 이곳에 구성할 수 있습니다.

### `pages/`

웹 서비스의 각각의 페이지를 관리합니다.

페이지별 화면 구성과 해당 페이지에서 필요한 기능을 작성합니다.

### `services/`

백엔드 API나 외부 서비스와 통신하는 코드를 관리합니다.

데이터 조회, 등록, 수정, 삭제 등의 API 요청을 이곳에서 관리하는 것을 목표로 합니다.

### `styles/`

프로젝트에서 사용하는 CSS 및 스타일 관련 파일을 관리합니다.

페이지나 컴포넌트의 디자인과 화면 구성을 담당합니다.

### `types/`

TypeScript에서 사용하는 타입과 인터페이스를 관리합니다.

프로젝트에서 사용하는 데이터 구조를 명확하게 정의하여 코드의 안정성을 높입니다.

### `App.tsx`

React 애플리케이션의 주요 화면과 전체적인 구조를 담당하는 메인 컴포넌트입니다.

### `main.tsx`

React 애플리케이션을 실제 HTML 문서에 연결하는 진입점입니다.

## 📄 주요 파일 설명

### `index.html`

웹 애플리케이션의 기본 HTML 문서입니다.

React 애플리케이션이 실행될 기본 DOM 구조를 제공합니다.

### `package.json`

프로젝트에서 사용하는 npm 패키지와 실행 명령어를 관리합니다.

### `package-lock.json`

설치된 npm 패키지의 정확한 버전을 기록하여 개발 환경의 차이를 줄입니다.

### `vite.config.ts`

Vite 개발 서버와 프로젝트 빌드 환경을 설정합니다.

### `tsconfig.json`

TypeScript 프로젝트의 기본 설정을 관리합니다.

### `AGENTS.md`

AI 도구를 이용해 프로젝트를 개발할 때 필요한 규칙과 작업 기준을 정리한 파일입니다.

### `PROJECT_NOTES.md`

프로젝트 진행 과정에서 필요한 개발 내용과 협업 관련 메모를 기록합니다.

### `.gitignore`

Git에 업로드하지 않을 파일과 폴더를 지정합니다.

## 🚀 실행 방법

### 1. 프로젝트 클론

```bash
git clone [Repository URL]
```

### 2. 프로젝트 폴더 이동

```bash
cd [프로젝트 폴더]
```

### 3. 패키지 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
npm run dev
```

실행 후 터미널에 표시되는 로컬 주소로 접속하면 프로젝트를 확인할 수 있습니다.

## 🔄 Git 협업

최신 코드를 받은 후 작업합니다.

```bash
git pull
```

작업이 끝난 후 변경 사항을 업로드합니다.

```bash
git add .
git commit -m "작업 내용"
git push
```

## 👥 프로젝트 개발 방향

본 프로젝트는 React와 TypeScript를 기반으로 프론트엔드를 개발합니다.

새로운 UI 요소는 `components`, 새로운 페이지는 `pages`, API 및 외부 서비스 관련 기능은 `services`, 타입은 `types`, 스타일은 `styles`에서 관리하여 프로젝트 구조를 명확하게 유지합니다.

프로젝트 진행 상황과 개발 관련 내용은 `PROJECT_NOTES.md`에서 관리합니다.

## 📝 참고

프로젝트가 발전하면서 새로운 컴포넌트와 페이지가 추가될 수 있으며, 프로젝트 구조가 변경될 경우 README도 함께 업데이트합니다.

## 백엔드 통합

백엔드 코드는 프론트엔드 실행 코드와 충돌하지 않도록 `backend/` 폴더에 분리되어 있습니다.

```text
backend/
├── src/
│   ├── config/env.ts          # 데이터베이스 환경변수 설정
│   ├── db/pool.ts             # PostgreSQL 연결 풀
│   ├── db/test-connection.ts  # DB 연결 확인
│   └── server.ts              # Express REST API 서버
├── sql/                       # 데이터베이스 생성·테이블·시드·마이그레이션 SQL
├── .env.example               # 백엔드 환경변수 예시
├── package.json               # 백엔드 의존성 및 실행 명령
└── tsconfig.json              # 백엔드 TypeScript 설정
```

### 백엔드 기술

- Node.js, Express, TypeScript
- PostgreSQL, `pg`
- Google ID token 검증, `google-auth-library`
- `dotenv`

### 제공 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/toilets` | 전체 화장실 목록 조회 |
| `GET` | `/toilets/:id` | 화장실 상세 조회 |
| `POST` | `/toilets` | 화장실 등록 |
| `PATCH` | `/toilets/:id` | 화장실 정보 수정 |
| `DELETE` | `/toilets/:id` | 화장실 삭제 |
| `POST` | `/api/auth/google` | Google ID token 검증 및 사용자 저장 |

### 백엔드 실행

`backend/.env.example`을 참고해 `backend/.env`를 로컬에서만 만들고, PostgreSQL 연결 정보를 설정합니다. `.env` 파일은 Git에 올리지 않습니다.

```bash
cd backend
npm ci
npm run dev
```

서버 기본 포트는 `3000`이며, 배포 환경에서는 `PORT` 환경변수를 사용합니다.

### 프론트엔드와 백엔드 연결

프론트엔드는 루트의 React/Vite 프로젝트로 실행하고, 백엔드는 `backend/`에서 별도 실행합니다. 실제 API 연결 시 프론트엔드의 `src/services/`에서 백엔드 REST API를 호출하며, PostgreSQL에는 프론트엔드가 직접 접근하지 않습니다.

</details>
