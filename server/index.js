require('dotenv/config');
const crypto = require('node:crypto');
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json({ limit: '256kb' }));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });

function detectSpecies(text = '') {
  const value = text.toLowerCase();
  if (/\b(cat|kitten|kitty)\b|🐱|🐈/.test(value)) return 'cat';
  if (/\b(dog|puppy|pup)\b|🐶|🐕/.test(value)) return 'dog';
  if (/\b(bird|pigeon|parrot)\b|🐦/.test(value)) return 'bird';
  return 'unknown';
}

function parseName(text = '') {
  const match = text.match(/(?:name\s*[:=-]\s*|#)([\p{L}\p{N}_-]{2,30})/iu);
  return match?.[1] ?? null;
}

// Public map points are deterministically displaced by roughly 150–350m.
function obscureLocation(latitude, longitude, key) {
  const bytes = crypto.createHash('sha256').update(String(key)).digest();
  const angle = (bytes.readUInt16BE(0) / 65535) * Math.PI * 2;
  const distance = 150 + (bytes.readUInt16BE(2) / 65535) * 200;
  return {
    latitude: latitude + (distance * Math.cos(angle)) / 111320,
    longitude: longitude + (distance * Math.sin(angle)) / (111320 * Math.cos(latitude * Math.PI / 180))
  };
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/sightings', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const { rows } = await pool.query(
    `SELECT id, species, animal_name AS "name", note, public_latitude AS latitude,
      public_longitude AS longitude, observed_at AS "observedAt"
     FROM animal_sightings ORDER BY observed_at DESC LIMIT $1`, [limit]
  );
  res.json({ sightings: rows });
});

app.post('/telegram/webhook', async (req, res) => {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || req.get('x-telegram-bot-api-secret-token') !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }
  const post = req.body.channel_post ?? req.body.edited_channel_post;
  if (!post) return res.sendStatus(200);
  const location = post.location ?? post.venue?.location;
  if (!location) return res.sendStatus(200);

  const note = post.text ?? post.caption ?? post.venue?.title ?? '';
  const observedAt = new Date(post.date * 1000);
  const publicPoint = obscureLocation(location.latitude, location.longitude, `${post.chat.id}:${post.message_id}`);
  try {
    await pool.query('BEGIN');
    await pool.query(
      `INSERT INTO telegram_channels (telegram_chat_id, title, username)
       VALUES ($1, $2, $3) ON CONFLICT (telegram_chat_id) DO UPDATE SET title = EXCLUDED.title, username = EXCLUDED.username`,
      [post.chat.id, post.chat.title ?? 'Telegram channel', post.chat.username ?? null]
    );
    await pool.query(
      `INSERT INTO animal_sightings
       (source_chat_id, source_message_id, species, animal_name, note, latitude, longitude, public_latitude, public_longitude, observed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (source_chat_id, source_message_id) DO UPDATE SET
       species=EXCLUDED.species, animal_name=EXCLUDED.animal_name, note=EXCLUDED.note,
       latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
       public_latitude=EXCLUDED.public_latitude, public_longitude=EXCLUDED.public_longitude, observed_at=EXCLUDED.observed_at`,
      [post.chat.id, post.message_id, detectSpecies(note), parseName(note), note.slice(0, 1000), location.latitude, location.longitude, publicPoint.latitude, publicPoint.longitude, observedAt]
    );
    await pool.query('COMMIT');
    res.sendStatus(200);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.sendStatus(500);
  }
});

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Internal server error' }); });
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Pawprint API listening on ${port}`));
