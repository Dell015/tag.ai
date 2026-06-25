-- ============================================================
-- Tag.ai Phase 1: Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE card_category AS ENUM (
  'hot_takes',
  'relationships',
  'memories',
  'confessions',
  'dares',
  'hypotheticals',
  'controversial',
  'roasts',
  'deep_philosophical'
);

CREATE TYPE card_type AS ENUM ('question', 'action', 'wild');

CREATE TYPE session_status AS ENUM ('lobby', 'active', 'ended');

CREATE TYPE game_mode_type AS ENUM ('icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family');

-- ============================================================
-- TABLES
-- ============================================================

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  coin_balance integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Cards table (curated library)
CREATE TABLE cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid,
  user_id uuid REFERENCES users(id),
  text text NOT NULL,
  card_type card_type NOT NULL,
  intensity integer CHECK (intensity BETWEEN 1 AND 5),
  category card_category NOT NULL,
  topics text[] DEFAULT '{}',
  audience_type text,
  is_curated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES users(id) NOT NULL,
  room_code text UNIQUE NOT NULL,
  status session_status DEFAULT 'lobby',
  game_mode game_mode_type,
  heat_level numeric DEFAULT 1.0,
  card_count_target integer NOT NULL,
  cards_played integer DEFAULT 0,
  comfort_filters text[] DEFAULT '{}',
  drink_rule_template text,
  custom_drink_rules text[] DEFAULT '{}',
  non_drinking_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Session Players table
CREATE TABLE session_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  display_name text NOT NULL,
  turn_order integer NOT NULL,
  agreed_to_rules boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  removed_at timestamptz,
  UNIQUE(session_id, user_id)
);

-- User Trashed Cards table
CREATE TABLE user_trashed_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  card_id uuid REFERENCES cards(id) NOT NULL,
  trashed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Saved Cards table
CREATE TABLE saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  card_id uuid REFERENCES cards(id) NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Users: read/update own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Sessions: readable by players, writable by host
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session players can read"
  ON sessions FOR SELECT
  USING (
    id IN (
      SELECT session_id FROM session_players
      WHERE user_id = auth.uid() AND removed_at IS NULL
    )
  );

CREATE POLICY "Host can update session"
  ON sessions FOR UPDATE
  USING (host_id = auth.uid());

CREATE POLICY "Authenticated can create session"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Session Players: readable by session members, insertable by authenticated
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session members can read players"
  ON session_players FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM session_players sp
      WHERE sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can join"
  ON session_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cards: curated cards readable by all authenticated users
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read curated cards"
  ON cards FOR SELECT
  USING (is_curated = true);

-- User Trashed Cards: per-user full access
ALTER TABLE user_trashed_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trashed"
  ON user_trashed_cards FOR ALL
  USING (auth.uid() = user_id);

-- Saved Cards: per-user full access
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved"
  ON saved_cards FOR ALL
  USING (auth.uid() = user_id);
