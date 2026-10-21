-- ============================================================
-- Tag.ai Stage B, slice 1: core database (docs/DATABASE_SPEC.md)
-- Replaces 001_initial_schema.sql, which must NOT be run.
--
-- Ground rules implemented here:
--   * RLS on for every table in public.
--   * Coins are server-owned: the app cannot write profiles.coins or
--     transactions. Every coin change is a ledger row; a trigger applies
--     it to the balance in the same transaction; balance check >= 0.
--   * Suggestions start pending; only admins approve; only approved
--     cards can be put in a deck.
--   * Adult cards are only readable by profiles with is_adult_confirmed.
--   * Money is numeric(10,2).
-- ============================================================

begin;

-- Helpers that must not be exposed through the API live in "private".
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ------------------------------------------------------------
-- Admins
-- ------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  username           text check (username = btrim(username) and char_length(username) between 2 and 16),
  avatar             text not null default 'c0' check (avatar ~ '^c[0-9]$'),
  coins              numeric(10,2) not null default 0 check (coins >= 0),
  is_adult_confirmed boolean not null default false,
  settings           jsonb not null default '{}'::jsonb check (octet_length(settings::text) <= 16384),
  created_at         timestamptz not null default now()
);
-- Unique, case-insensitive ("Ana" and "ana" are the same name). Null until the player picks one.
create unique index profiles_username_key on public.profiles (lower(username));

-- Read-only list of names and avatars for everyone. The view is security_invoker
-- (no "security definer view" advisor warning); the row access comes from a
-- definer function in the non-exposed private schema that returns only 3 columns.
create or replace function private.list_public_profiles()
returns table (id uuid, username text, avatar text)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.username, p.avatar from public.profiles p;
$$;

create view public.public_profiles
with (security_invoker = true)
as select id, username, avatar from private.list_public_profiles();

-- ------------------------------------------------------------
-- Coin ledger
-- ------------------------------------------------------------
create table public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('welcome', 'purchase', 'pot', 'refund', 'topup', 'referral', 'shop')),
  amount     numeric(10,2) not null check (amount <> 0),
  note       text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index transactions_user_created_idx on public.transactions (user_id, created_at desc);
create index transactions_user_kind_created_idx on public.transactions (user_id, kind, created_at);

-- Every ledger row moves the balance. The check (coins >= 0) on profiles makes
-- the whole statement fail if a row would take the balance below zero.
-- Hand-inserted 'topup' rows during testing therefore update the balance too.
create or replace function private.apply_transaction()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.profiles set coins = coins + new.amount where id = new.user_id;
  if not found then
    raise exception 'No profile for user %', new.user_id;
  end if;
  return new;
end;
$$;

create trigger transactions_apply
after insert on public.transactions
for each row execute function private.apply_transaction();

-- ------------------------------------------------------------
-- First sign in: profile row + 10 coin welcome gift
-- ------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  uname text := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  av    text := new.raw_user_meta_data ->> 'avatar';
begin
  if uname is not null and (
       char_length(uname) not between 2 and 16
       or exists (select 1 from public.profiles p where lower(p.username) = lower(uname))
     ) then
    uname := null;
  end if;
  if av is null or av !~ '^c[0-9]$' then
    av := 'c0';
  end if;

  insert into public.profiles (id, username, avatar) values (new.id, uname, av);
  insert into public.transactions (user_id, kind, amount, note) values (new.id, 'welcome', 10, 'Welcome gift');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- ------------------------------------------------------------
-- Decks and cards
-- ------------------------------------------------------------
create table public.decks (
  id             text primary key,
  name           text not null,
  blurb          text not null default '',
  price          numeric(10,2) not null check (price >= 0),
  ready          boolean not null default true,
  adult          boolean not null default false,
  includes_adult boolean not null default false
);

create table public.cards (
  id         text primary key,
  text       text not null check (char_length(btrim(text)) > 0),
  kind       text not null check (kind in ('truth', 'dare', 'dice', 'coin', 'bottle', 'wheel', 'timer', 'vote', 'rule')),
  card_type  text not null check (card_type in ('question', 'action', 'wild')),
  intensity  smallint not null check (intensity between 1 and 5),
  category   text not null check (category in ('hot_takes', 'relationships', 'memories', 'confessions', 'dares',
                                               'hypotheticals', 'controversial', 'roasts', 'deep_philosophical')),
  topics     text[] not null default '{}',
  deck_id    text references public.decks (id),
  adult      boolean not null default false,
  wild_type  text check (wild_type in ('call_out', 'voice_note', 'lucky_roll', 'double_or_nothing')),
  status     text not null default 'approved' check (status in ('approved', 'pending', 'rejected', 'retired')),
  source     text not null default 'seed' check (source in ('seed', 'suggestion')),
  -- Tool and rule card data the app needs to play the card (tool, outcomes, rule, penalty, people).
  -- Not in the spec table; added so tool cards keep their dice lines, wheel labels and coin sides.
  extra      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint cards_wild_type_matches check ((card_type = 'wild') = (wild_type is not null)),
  constraint cards_adult_deck_is_adult check (deck_id is distinct from 'adult' or adult)
);
create index cards_status_idx on public.cards (status);
create index cards_deck_idx on public.cards (deck_id);

-- Only approved cards can be put in a deck.
create or replace function private.cards_deck_needs_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.deck_id is not null and new.status <> 'approved'
     and (tg_op = 'INSERT' or new.deck_id is distinct from old.deck_id) then
    raise exception 'Only approved cards can be added to a deck (card %, status %)', new.id, new.status;
  end if;
  return new;
end;
$$;

create trigger cards_deck_needs_approval
before insert or update on public.cards
for each row execute function private.cards_deck_needs_approval();

create table public.talk_topics (
  id         text primary key,
  "group"    text not null check ("group" in ('moral', 'fate', 'self', 'society', 'reflect', 'takes', 'dilemma', 'stories')),
  format     text not null check (format in ('agree', 'ab', 'think', 'story')),
  text       text not null check (char_length(btrim(text)) > 0),
  deeper     text,
  a          text,
  b          text,
  topics     text[] not null default '{}',
  status     text not null default 'approved' check (status in ('approved', 'pending', 'rejected', 'retired')),
  created_at timestamptz not null default now(),
  constraint talk_topics_ab_has_options check (format <> 'ab' or (a is not null and b is not null))
);

-- ------------------------------------------------------------
-- Personal card data
-- card_id is text without a foreign key on purpose: players also save
-- pack cards, wild cards and their own cards, which are not in public.cards.
-- ------------------------------------------------------------
create table public.saved_cards (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  card_id    text not null check (char_length(card_id) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table public.trashed_cards (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  card_id    text not null check (char_length(card_id) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table public.custom_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text       text not null check (char_length(btrim(text)) between 1 and 300),
  kind       text not null check (kind in ('truth', 'dare', 'dice', 'coin', 'bottle', 'wheel', 'timer', 'vote', 'rule')),
  created_at timestamptz not null default now()
);
create index custom_cards_user_idx on public.custom_cards (user_id);

-- ------------------------------------------------------------
-- Suggestions
-- ------------------------------------------------------------
create table public.blocked_words (
  word       text primary key check (word = lower(btrim(word)) and char_length(word) between 2 and 40),
  created_at timestamptz not null default now()
);

create table public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text          text not null check (char_length(text) between 15 and 160),
  kind          text not null check (kind in ('truth', 'dare', 'dice', 'coin', 'bottle', 'wheel', 'rule')),
  deck_id       text not null references public.decks (id) check (deck_id not in ('social', 'chaos')),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  reject_reason text check (reject_reason is null or char_length(reject_reason) <= 200),
  -- The card created by approve_suggestion.
  card_id       text references public.cards (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index suggestions_author_created_idx on public.suggestions (author_id, created_at desc);
create index suggestions_status_idx on public.suggestions (status);

create table public.suggestion_likes (
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);
create index suggestion_likes_user_idx on public.suggestion_likes (user_id);

-- Case and spacing insensitive form used for duplicate checks.
create or replace function private.norm_text(t text)
returns text
language sql immutable
set search_path = ''
as $$
  select regexp_replace(lower(coalesce(t, '')), '\s+', '', 'g');
$$;

-- Server-side checks on insert: rate limit, blocklist, phone numbers, links, duplicates.
create or replace function private.suggestions_before_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  recent int;
  bad    text;
begin
  -- Tidy spacing first so the length check and duplicate check see the real text.
  new.text := btrim(regexp_replace(new.text, '\s+', ' ', 'g'));
  new.status := 'pending';
  new.reviewer_id := null;
  new.reviewed_at := null;
  new.reject_reason := null;
  new.card_id := null;
  new.created_at := now();

  -- At most 5 per rolling 24 hours. The advisory lock serialises one author's inserts
  -- so two at the same moment cannot both slip under the limit.
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 0));
  select count(*) into recent
  from public.suggestions s
  where s.author_id = new.author_id and s.created_at > now() - interval '24 hours';
  if recent >= 5 then
    raise exception 'You can suggest up to 5 cards a day. Try again tomorrow.' using errcode = 'P0001';
  end if;

  select w.word into bad
  from public.blocked_words w
  where lower(new.text) ~ ('\m' || regexp_replace(w.word, '([^a-z0-9 ])', '\\\1', 'g') || '\M')
  limit 1;
  if bad is not null then
    raise exception 'This card uses a word we do not allow.' using errcode = 'P0001';
  end if;

  -- 7 or more digits in a row, allowing spaces, dots, dashes, brackets and a leading +.
  if new.text ~ '\+?\d([\s.()-]*\d){6,}' then
    raise exception 'Cards cannot contain phone numbers.' using errcode = 'P0001';
  end if;

  if new.text ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|app|xyz|info|link|site|tv)\M)' then
    raise exception 'Cards cannot contain links.' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.suggestions s
             where s.status <> 'rejected' and private.norm_text(s.text) = private.norm_text(new.text))
     or exists (select 1 from public.cards c
                where c.status <> 'rejected' and private.norm_text(c.text) = private.norm_text(new.text)) then
    raise exception 'This card already exists.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger suggestions_before_insert
before insert on public.suggestions
for each row execute function private.suggestions_before_insert();

-- Reviews: stamp the reviewer, and an approved suggestion must have its card (approve_suggestion makes it).
create or replace function private.suggestions_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.reviewer_id := (select auth.uid());
    new.reviewed_at := now();
  end if;
  if new.status = 'approved' and new.card_id is null then
    raise exception 'Use approve_suggestion(id) to approve, so the card is created.';
  end if;
  return new;
end;
$$;

create trigger suggestions_before_update
before update on public.suggestions
for each row execute function private.suggestions_before_update();

-- Weekly board: weeks start Monday 00:00 Asia/Manila. A card counts in the week it was written,
-- with all the likes it got. 1 point per approved card, 2 per like from another user. No coins.
-- security_invoker: it only sees approved suggestions and their likes, which everyone may read.
create view public.weekly_contributors
with (security_invoker = true)
as
with approved as (
  select s.id, s.author_id,
         (date_trunc('week', s.created_at at time zone 'Asia/Manila') at time zone 'Asia/Manila') as week_start
  from public.suggestions s
  where s.status = 'approved'
),
likes as (
  select l.suggestion_id, count(*) as n
  from public.suggestion_likes l
  join public.suggestions s on s.id = l.suggestion_id
  where l.user_id <> s.author_id
  group by l.suggestion_id
)
select c.week_start,
       c.author_id,
       p.username,
       count(*)::int                         as cards,
       coalesce(sum(l.n), 0)::int            as likes,
       (count(*) + 2 * coalesce(sum(l.n), 0))::int as points
from approved c
left join likes l on l.suggestion_id = c.id
left join public.public_profiles p on p.id = c.author_id
group by c.week_start, c.author_id, p.username
order by c.week_start desc, points desc;

-- ------------------------------------------------------------
-- Reports
-- ------------------------------------------------------------
create table public.card_reports (
  id          uuid primary key default gen_random_uuid(),
  card_id     text not null check (char_length(card_id) between 1 and 80),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason      text check (reason is null or char_length(reason) <= 300),
  created_at  timestamptz not null default now(),
  resolved    boolean not null default false,
  unique (card_id, reporter_id)
);
create index card_reports_open_idx on public.card_reports (resolved, created_at desc);

-- ------------------------------------------------------------
-- Shop
-- ------------------------------------------------------------
create table public.shop_items (
  id          text primary key,
  kind        text not null check (kind in ('tool', 'pack', 'frame', 'back', 'theme')),
  name        text not null,
  price       numeric(10,2) not null check (price >= 0),
  description text not null default '',
  value       text,
  adult       boolean not null default false,
  active      boolean not null default true
);

create table public.owned_items (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  item_id    text not null references public.shop_items (id),
  equipped   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ------------------------------------------------------------
-- RPC functions (security definer, called by the app)
-- ------------------------------------------------------------

-- Debits coins. The row lock (select ... for update) makes two phones calling at the
-- same moment run one after the other, so the balance can never go below zero.
create or replace function public.spend_coins(kind text, amount numeric, note text default null)
returns numeric
language plpgsql security definer
set search_path = ''
as $$
declare
  uid     uuid := auth.uid();
  amt     numeric(10,2) := round(amount, 2);
  balance numeric(10,2);
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if kind is null or kind not in ('pot', 'shop', 'purchase') then
    raise exception 'spend_coins: kind must be pot, shop or purchase' using errcode = '22023';
  end if;
  if amt is null or amt <= 0 then
    raise exception 'spend_coins: amount must be more than 0' using errcode = '22023';
  end if;

  select p.coins into balance from public.profiles p where p.id = uid for update;
  if not found then
    raise exception 'No profile for this user' using errcode = 'P0002';
  end if;
  if balance < amt then
    raise exception 'Not enough coins: you have %, this needs %', balance, amt using errcode = 'P0001';
  end if;

  insert into public.transactions (user_id, kind, amount, note) values (uid, kind, -amt, note);
  return balance - amt;
end;
$$;

-- Returns unused pot coins. Cap: refunds in the last 24 hours (including this one)
-- can never add up to more than what this user spent on 'pot' rows in the last 24 hours.
create or replace function public.refund_coins(amount numeric, note text default null)
returns numeric
language plpgsql security definer
set search_path = ''
as $$
declare
  uid      uuid := auth.uid();
  amt      numeric(10,2) := round(amount, 2);
  balance  numeric(10,2);
  spent    numeric(10,2);
  refunded numeric(10,2);
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if amt is null or amt <= 0 then
    raise exception 'refund_coins: amount must be more than 0' using errcode = '22023';
  end if;

  select p.coins into balance from public.profiles p where p.id = uid for update;
  if not found then
    raise exception 'No profile for this user' using errcode = 'P0002';
  end if;

  select coalesce(-sum(t.amount) filter (where t.kind = 'pot'), 0),
         coalesce(sum(t.amount) filter (where t.kind = 'refund'), 0)
    into spent, refunded
  from public.transactions t
  where t.user_id = uid and t.created_at > now() - interval '24 hours';

  if refunded + amt > spent then
    raise exception 'Refund too large: % can still be refunded', greatest(spent - refunded, 0) using errcode = 'P0001';
  end if;

  insert into public.transactions (user_id, kind, amount, note) values (uid, 'refund', amt, note);
  return balance + amt;
end;
$$;

create or replace function public.buy_shop_item(item_id text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  uid     uuid := auth.uid();
  item    public.shop_items%rowtype;
  balance numeric(10,2);
  adult_ok boolean;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into item from public.shop_items s where s.id = buy_shop_item.item_id and s.active;
  if not found then
    raise exception 'This item is not for sale' using errcode = 'P0002';
  end if;

  select p.coins, p.is_adult_confirmed into balance, adult_ok from public.profiles p where p.id = uid for update;
  if not found then
    raise exception 'No profile for this user' using errcode = 'P0002';
  end if;
  if item.adult and not adult_ok then
    raise exception 'This item is 18+ only' using errcode = '42501';
  end if;
  if exists (select 1 from public.owned_items o where o.user_id = uid and o.item_id = item.id) then
    raise exception 'You already own this' using errcode = 'P0001';
  end if;
  if balance < item.price then
    raise exception 'Not enough coins: you have %, this needs %', balance, item.price using errcode = 'P0001';
  end if;

  if item.price > 0 then
    insert into public.transactions (user_id, kind, amount, note) values (uid, 'shop', -item.price, item.name);
  end if;
  insert into public.owned_items (user_id, item_id) values (uid, item.id);
end;
$$;

-- Equips an owned item (and unequips the others of the same kind), or unequips it.
create or replace function public.equip_item(item_id text, on_off boolean default true)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  k   text;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  select s.kind into k
  from public.owned_items o join public.shop_items s on s.id = o.item_id
  where o.user_id = uid and o.item_id = equip_item.item_id;
  if not found then
    raise exception 'You do not own this item' using errcode = 'P0002';
  end if;

  if on_off then
    update public.owned_items o set equipped = false
    from public.shop_items s
    where o.user_id = uid and s.id = o.item_id and s.kind = k and o.item_id <> equip_item.item_id;
  end if;
  update public.owned_items o set equipped = on_off where o.user_id = uid and o.item_id = equip_item.item_id;
end;
$$;

-- Admin: approve a suggestion and copy it into cards (source 'suggestion', status 'approved').
-- Intensity and category are not part of a suggestion; defaults come from the deck, the admin can override.
create or replace function public.approve_suggestion(id uuid, intensity smallint default null, category text default null)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  s       public.suggestions%rowtype;
  new_id  text;
  lvl     smallint;
  cat     text;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  select * into s from public.suggestions x where x.id = approve_suggestion.id for update;
  if not found then
    raise exception 'Suggestion not found' using errcode = 'P0002';
  end if;
  if s.status = 'approved' then
    return s.card_id;
  end if;

  lvl := coalesce(approve_suggestion.intensity,
                  case s.deck_id when 'icebreaker' then 1 when 'family' then 1 when 'life' then 2
                                 when 'deep' then 3 when 'barkada' then 3 when 'lovers' then 3
                                 when 'spicy' then 4 when 'adult' then 4 else 2 end);
  cat := coalesce(approve_suggestion.category,
                  case when s.kind <> 'truth' then 'dares'
                       else case s.deck_id when 'icebreaker' then 'hot_takes' when 'family' then 'memories'
                                           when 'life' then 'memories' when 'deep' then 'deep_philosophical'
                                           when 'lovers' then 'relationships' else 'confessions' end end);

  new_id := 'sugg-' || replace(s.id::text, '-', '');
  insert into public.cards (id, text, kind, card_type, intensity, category, topics, deck_id, adult, status, source)
  values (new_id, s.text, s.kind, case when s.kind = 'truth' then 'question' else 'action' end,
          lvl, cat, case when s.deck_id = 'adult' then array['adult'] else '{}'::text[] end,
          s.deck_id, s.deck_id = 'adult', 'approved', 'suggestion');

  update public.suggestions x set status = 'approved', card_id = new_id, reject_reason = null
  where x.id = s.id;
  return new_id;
end;
$$;

create or replace function public.reject_suggestion(id uuid, reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.suggestions x set status = 'rejected', reject_reason = reason
  where x.id = reject_suggestion.id and x.status = 'pending';
  if not found then
    raise exception 'No pending suggestion with that id' using errcode = 'P0002';
  end if;
end;
$$;

-- Admin: retire many cards at once (the Adult review). Returns how many changed.
create or replace function public.retire_cards(card_ids text[])
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare n integer;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set status = 'retired' where c.id = any (card_ids) and c.status <> 'retired';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ------------------------------------------------------------
-- Row level security
-- ------------------------------------------------------------
alter table public.admins           enable row level security;
alter table public.profiles         enable row level security;
alter table public.transactions     enable row level security;
alter table public.decks            enable row level security;
alter table public.cards            enable row level security;
alter table public.talk_topics      enable row level security;
alter table public.saved_cards      enable row level security;
alter table public.trashed_cards    enable row level security;
alter table public.custom_cards     enable row level security;
alter table public.blocked_words    enable row level security;
alter table public.suggestions      enable row level security;
alter table public.suggestion_likes enable row level security;
alter table public.card_reports     enable row level security;
alter table public.shop_items       enable row level security;
alter table public.owned_items      enable row level security;

-- Start from nothing, then grant only what each role needs.
revoke all on all tables in schema public from anon, authenticated;

-- admins: you can see whether you are an admin. Rows are added by hand in the SQL editor.
grant select on public.admins to authenticated;
create policy admins_select on public.admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- profiles: own row only; coins and created_at are not writable (column privileges).
grant select on public.profiles to authenticated;
grant update (username, avatar, is_adult_confirmed, settings) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.public_profiles to anon, authenticated;

-- transactions: read own rows only. Nobody inserts from the app.
grant select on public.transactions to authenticated;
create policy transactions_select_own on public.transactions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- decks: read only to the app (signed in or not); admins edit.
grant select on public.decks to anon, authenticated;
grant insert, update, delete on public.decks to authenticated;
create policy decks_select on public.decks for select to anon, authenticated using (true);
create policy decks_admin_insert on public.decks for insert to authenticated with check ((select public.is_admin()));
create policy decks_admin_update on public.decks for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy decks_admin_delete on public.decks for delete to authenticated using ((select public.is_admin()));

-- cards: signed in users read approved cards; adult cards only with is_adult_confirmed. Admins read and write all.
grant select, insert, update, delete on public.cards to authenticated;
create policy cards_select on public.cards for select to authenticated
  using (
    (status = 'approved'
     and (not adult or exists (select 1 from public.profiles p
                               where p.id = (select auth.uid()) and p.is_adult_confirmed)))
    or (select public.is_admin())
  );
create policy cards_admin_insert on public.cards for insert to authenticated with check ((select public.is_admin()));
create policy cards_admin_update on public.cards for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy cards_admin_delete on public.cards for delete to authenticated using ((select public.is_admin()));

-- talk_topics: same as cards (no adult topics).
grant select, insert, update, delete on public.talk_topics to authenticated;
create policy talk_topics_select on public.talk_topics for select to authenticated
  using (status = 'approved' or (select public.is_admin()));
create policy talk_topics_admin_insert on public.talk_topics for insert to authenticated with check ((select public.is_admin()));
create policy talk_topics_admin_update on public.talk_topics for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy talk_topics_admin_delete on public.talk_topics for delete to authenticated using ((select public.is_admin()));

-- saved, trashed and custom cards: the owner only.
grant select, insert, delete on public.saved_cards to authenticated;
create policy saved_cards_owner on public.saved_cards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, delete on public.trashed_cards to authenticated;
create policy trashed_cards_owner on public.trashed_cards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.custom_cards to authenticated;
create policy custom_cards_owner on public.custom_cards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- blocked_words: admins only.
grant select, insert, update, delete on public.blocked_words to authenticated;
create policy blocked_words_admin on public.blocked_words for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- suggestions: insert your own (status is not insertable, it defaults to pending);
-- read your own in any status, others only when approved; only admins update.
grant select, delete on public.suggestions to authenticated;
grant insert (author_id, text, kind, deck_id) on public.suggestions to authenticated;
grant update (status, reject_reason) on public.suggestions to authenticated;
create policy suggestions_insert_own on public.suggestions for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy suggestions_select on public.suggestions for select to authenticated
  using (status = 'approved' or author_id = (select auth.uid()) or (select public.is_admin()));
create policy suggestions_admin_update on public.suggestions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy suggestions_admin_delete on public.suggestions for delete to authenticated
  using ((select public.is_admin()));

-- suggestion_likes: like approved cards by others (never your own); unlike your own like.
-- Readable when the suggestion is readable, so like counts show on the board.
grant select, insert, delete on public.suggestion_likes to authenticated;
create policy suggestion_likes_select on public.suggestion_likes for select to authenticated
  using (exists (select 1 from public.suggestions s where s.id = suggestion_id));
create policy suggestion_likes_insert on public.suggestion_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.suggestions s
                where s.id = suggestion_id and s.status = 'approved' and s.author_id <> (select auth.uid()))
  );
create policy suggestion_likes_delete_own on public.suggestion_likes for delete to authenticated
  using (user_id = (select auth.uid()));

grant select on public.weekly_contributors to authenticated;

-- card_reports: one per card per user; reporters read their own, admins read and resolve all.
grant select, delete on public.card_reports to authenticated;
grant insert (card_id, reporter_id, reason) on public.card_reports to authenticated;
grant update (resolved) on public.card_reports to authenticated;
create policy card_reports_insert_own on public.card_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy card_reports_select on public.card_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy card_reports_admin_update on public.card_reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy card_reports_admin_delete on public.card_reports for delete to authenticated
  using ((select public.is_admin()));

-- shop_items: anyone reads active items; admins read and edit all.
grant select on public.shop_items to anon, authenticated;
grant insert, update, delete on public.shop_items to authenticated;
create policy shop_items_select on public.shop_items for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy shop_items_admin_insert on public.shop_items for insert to authenticated with check ((select public.is_admin()));
create policy shop_items_admin_update on public.shop_items for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy shop_items_admin_delete on public.shop_items for delete to authenticated using ((select public.is_admin()));

-- owned_items: read own. Written only by buy_shop_item and equip_item.
grant select on public.owned_items to authenticated;
create policy owned_items_select_own on public.owned_items for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ------------------------------------------------------------
-- Function privileges: only the RPCs the app calls are executable, only when signed in.
-- ------------------------------------------------------------
revoke execute on all functions in schema public  from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

-- anon too: the shop_items policy for signed-out readers calls it (it returns false for them).
grant execute on function public.is_admin()                                  to anon, authenticated;
grant execute on function public.spend_coins(text, numeric, text)            to authenticated;
grant execute on function public.refund_coins(numeric, text)                 to authenticated;
grant execute on function public.buy_shop_item(text)                         to authenticated;
grant execute on function public.equip_item(text, boolean)                   to authenticated;
grant execute on function public.approve_suggestion(uuid, smallint, text)    to authenticated;
grant execute on function public.reject_suggestion(uuid, text)               to authenticated;
grant execute on function public.retire_cards(text[])                        to authenticated;
-- Needed by the public_profiles view (security_invoker) and by RLS/trigger helpers.
grant execute on function private.list_public_profiles()                     to anon, authenticated;
grant execute on function private.norm_text(text)                            to authenticated;

-- Future functions in public are not executable by default.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

commit;
