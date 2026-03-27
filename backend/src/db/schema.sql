-- 병뚜껑 기부 캐릭터 성장 시스템 DB 스키마

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_points (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    address     VARCHAR(255),
    latitude    DECIMAL(10, 7),
    longitude   DECIMAL(10, 7),
    qr_code     VARCHAR(100) UNIQUE NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id),
    quantity          INT NOT NULL DEFAULT 0,
    weight_grams      INT NOT NULL DEFAULT 0,
    donation_point_id UUID NOT NULL REFERENCES donation_points(id),
    status            VARCHAR(20) DEFAULT 'VERIFIED' CHECK (status IN ('PENDING','VERIFIED','REJECTED')),
    xp_awarded        INT DEFAULT 0,
    verified_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS characters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id),
    level               INT DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    xp                  INT DEFAULT 0,
    xp_to_next_level    INT DEFAULT 100,
    xp_balance          INT DEFAULT 0,
    stage               VARCHAR(20) DEFAULT 'EGG' CHECK (stage IN ('EGG','BABY','CHILD','TEEN','ADULT','MASTER')),
    total_caps_donated  INT DEFAULT 0,
    total_weight_grams  INT DEFAULT 0,
    appearance          JSONB DEFAULT '{"color":"white","hat":null,"accessory":null,"background":"default"}',
    unlocked_traits     TEXT[] DEFAULT '{}',
    unlocked_items      TEXT[] DEFAULT '{}',
    last_growth_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id    UUID NOT NULL REFERENCES characters(id),
    donation_id     UUID REFERENCES donations(id),
    event_type      VARCHAR(20) DEFAULT 'FEED' CHECK (event_type IN ('DONATION','FEED')),
    xp_gained       INT NOT NULL,
    level_before    INT NOT NULL,
    level_after     INT NOT NULL,
    stage_before    VARCHAR(20) NOT NULL,
    stage_after     VARCHAR(20) NOT NULL,
    leveled_up      BOOLEAN DEFAULT FALSE,
    stage_changed   BOOLEAN DEFAULT FALSE,
    occurred_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_user_id     ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status      ON donations(status);
CREATE INDEX IF NOT EXISTS idx_growth_events_char    ON growth_events(character_id);
CREATE INDEX IF NOT EXISTS idx_characters_level      ON characters(level DESC);
CREATE INDEX IF NOT EXISTS idx_characters_caps       ON characters(total_caps_donated DESC);

INSERT INTO donation_points (id, name, address, latitude, longitude, qr_code) VALUES
  ('a0000000-0000-0000-0000-000000000001', '서울시청 기부소',   '서울특별시 중구 세종대로 110',    37.5663, 126.9779, 'QR-SEOUL-CITYHALL'),
  ('a0000000-0000-0000-0000-000000000002', '강남구청 기부소',   '서울특별시 강남구 학동로 426',    37.5172, 127.0473, 'QR-GANGNAM-OFFICE'),
  ('a0000000-0000-0000-0000-000000000003', '홍대입구 기부소',   '서울특별시 마포구 양화로 188',    37.5573, 126.9245, 'QR-HONGDAE-STATION'),
  ('a0000000-0000-0000-0000-000000000004', '부산시청 기부소',   '부산광역시 연제구 중앙대로 1001', 35.1796, 129.0756, 'QR-BUSAN-CITYHALL'),
  ('a0000000-0000-0000-0000-000000000005', '인천공항 기부소',   '인천광역시 중구 공항로 272',      37.4602, 126.4407, 'QR-INCHEON-AIRPORT')
ON CONFLICT DO NOTHING;
