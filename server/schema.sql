CREATE TABLE IF NOT EXISTS telegram_channels (
  telegram_chat_id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  username TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animal_sightings (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'telegram',
  source_chat_id BIGINT NOT NULL,
  source_message_id BIGINT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('cat', 'dog', 'bird', 'unknown')),
  animal_name TEXT,
  note TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  public_latitude DOUBLE PRECISION NOT NULL,
  public_longitude DOUBLE PRECISION NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_chat_id, source_message_id)
);

CREATE INDEX IF NOT EXISTS animal_sightings_observed_at_idx ON animal_sightings (observed_at DESC);
