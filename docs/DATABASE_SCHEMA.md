# 📊 mr_haydn SQLite 데이터베이스 정보

Slack MCP 클라이언트 연동을 위한 DB 참조 문서입니다.

## 1. DB 파일 경로

```
./car_rental.db
```
- 라이브러리: `better-sqlite3`
- 초기화: `database.js`

---

## 2. 테이블 스키마

### `applications` (차량 대여 신청)
```sql
CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  korean_name TEXT NOT NULL,
  english_id TEXT NOT NULL,
  car_id TEXT NOT NULL,
  car_name TEXT NOT NULL,
  week_id TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(english_id, car_id, week_id, slot_id)
);
```

### `winning_history` (당첨 이력)
```sql
CREATE TABLE winning_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english_id TEXT NOT NULL,
  korean_name TEXT NOT NULL,
  car_id TEXT NOT NULL,
  car_name TEXT NOT NULL,
  winning_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### `drawing_results` (추첨 결과)
```sql
CREATE TABLE drawing_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  car_id TEXT NOT NULL,
  car_name TEXT NOT NULL,
  slot_name TEXT NOT NULL,
  week_display TEXT NOT NULL,
  winner_english_id TEXT,
  winner_korean_name TEXT,
  applicants_count INTEGER NOT NULL,
  eligible_count INTEGER,
  reason TEXT,
  created_at TEXT NOT NULL
);
```

### `settings` (설정)
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 3. API 엔드포인트

### 차량 대여
| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/applications` | 신청 조회 |
| POST | `/api/applications` | 신청 추가 |
| DELETE | `/api/applications/:id` | 삭제 |

### 당첨 이력
| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/winning-history` | 이력 조회 |
| GET | `/api/winning-history/:englishId` | 사용자별 조회 |
| POST | `/api/winning-history` | 이력 추가 |

### 추첨 결과
| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/drawing-results` | 결과 조회 |
| POST | `/api/drawing-results` | 결과 추가 |

### 슬랙 연동
| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/send-lottery-result` | 슬랙 전송 |

### 휴양시설 (메모리 기반)
| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/resorts` | 시설 목록 |
| GET | `/api/resort-applications` | 신청 조회 |
| POST | `/api/resort-applications` | 신청 추가 |

---

## 4. 휴양시설 DB 테이블 (추가 예정)

```sql
CREATE TABLE IF NOT EXISTS resort_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  korean_name TEXT NOT NULL,
  english_id TEXT NOT NULL,
  resort_id TEXT NOT NULL,
  resort_name TEXT NOT NULL,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  nights INTEGER DEFAULT 1,
  room_type TEXT DEFAULT 'standard',
  guests INTEGER DEFAULT 2,
  applied_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  UNIQUE(english_id, resort_id, check_in_date)
);
```

---

## 5. 연동 참고

- **서버 포트**: 3001
- **슬랙 채널**: `.env`의 `SLACK_CHANNEL` 또는 `SLACK_WEBHOOK_URL`
- **프론트 포트**: 3000
