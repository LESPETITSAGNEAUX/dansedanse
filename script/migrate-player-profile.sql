
-- Migration pour ajouter la persistance du profil joueur
CREATE TABLE IF NOT EXISTS player_profile_state (
  id SERIAL PRIMARY KEY,
  personality TEXT NOT NULL DEFAULT 'balanced',
  tilt_level REAL NOT NULL DEFAULT 0,
  fatigue_level REAL NOT NULL DEFAULT 0,
  session_duration REAL NOT NULL DEFAULT 0,
  recent_bad_beats INTEGER NOT NULL DEFAULT 0,
  consecutive_losses INTEGER NOT NULL DEFAULT 0,
  consecutive_wins INTEGER NOT NULL DEFAULT 0,
  last_big_win REAL NOT NULL DEFAULT 0,
  last_big_loss REAL NOT NULL DEFAULT 0,
  session_start_time TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_player_profile_updated ON player_profile_state(updated_at DESC);
