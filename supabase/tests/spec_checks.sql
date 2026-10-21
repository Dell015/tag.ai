-- ============================================================
-- Spec checks 2 to 5 (docs/DATABASE_SPEC.md, "Checks before you call it done")
-- plus a few extra rules. Runs as one batch, acts as real signed-in users
-- (role authenticated + JWT claims), and deletes its test users at the end.
-- Check 1 is the Supabase security advisor; check 6 is
-- spec_check_6_concurrency.sql (needs two connections at once).
-- ============================================================

drop table if exists pg_temp.check_results;
create temp table check_results (n text, name text, pass boolean, detail text);

-- Two test users. The auth trigger creates their profiles and 10 coin welcome rows.
insert into auth.users (id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'check-a@example.test', '{"username":"CheckA"}', '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'check-b@example.test', '{"username":"CheckB"}', '{}', now(), now());

-- Acts as a signed-in user for the rest of the current transaction.
create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

do $$
declare c numeric; t int;
begin
  select coins into c from public.profiles where id = '00000000-0000-4000-8000-0000000000a1';
  select count(*) into t from public.transactions where user_id = '00000000-0000-4000-8000-0000000000a1' and kind = 'welcome' and amount = 10;
  insert into check_results values ('0', 'First sign in creates a profile with 10 coins and a welcome row', c = 10 and t = 1, format('coins=%s welcome_rows=%s', c, t));
end $$;

-- 2a. Normal user cannot set their own coins.
do $$
declare ok boolean := false; msg text;
begin
  begin
    perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
    update public.profiles set coins = 1000 where id = '00000000-0000-4000-8000-0000000000a1';
    msg := 'update succeeded';
  exception when others then ok := true; msg := sqlerrm;
  end;
  reset role;
  insert into check_results values ('2a', 'update profiles set coins = 1000 fails', ok, msg);
end $$;

-- 2b. Normal user cannot insert into the ledger.
do $$
declare ok boolean := false; msg text;
begin
  begin
    perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
    insert into public.transactions (user_id, kind, amount, note) values ('00000000-0000-4000-8000-0000000000a1', 'topup', 1000, 'hack');
    msg := 'insert succeeded';
  exception when others then ok := true; msg := sqlerrm;
  end;
  reset role;
  insert into check_results values ('2b', 'insert into transactions fails', ok, msg);
end $$;

-- 2c. The fields a player may change still work.
do $$
declare ok boolean := false; msg text;
begin
  begin
    perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
    update public.profiles set avatar = 'c3', settings = '{"sounds":false}' where id = '00000000-0000-4000-8000-0000000000a1';
    ok := found; msg := 'own avatar and settings updated';
  exception when others then msg := sqlerrm;
  end;
  reset role;
  insert into check_results values ('2c', 'A user can still update their own avatar and settings', ok, msg);
end $$;

-- B writes a pending suggestion (as B, through RLS and the insert trigger).
do $$
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
  insert into public.suggestions (author_id, text, kind, deck_id)
  values ('00000000-0000-4000-8000-0000000000b2', 'Spec check: who here would survive longest without their phone?', 'truth', 'barkada');
  reset role;
end $$;

-- 3a. Someone else's pending suggestion is not readable.
do $$
declare n int; own int;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
  select count(*) into n from public.suggestions where author_id = '00000000-0000-4000-8000-0000000000b2';
  reset role;
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
  select count(*) into own from public.suggestions where author_id = '00000000-0000-4000-8000-0000000000b2';
  reset role;
  insert into check_results values ('3a', 'A pending suggestion by someone else is not readable', n = 0 and own = 1,
    format('rows seen by A=%s, by the author=%s', n, own));
end $$;

-- 3b. A normal user cannot approve.
do $$
declare ok boolean; msg text; rows int := 0; st text;
begin
  begin
    perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
    update public.suggestions set status = 'approved' where author_id = '00000000-0000-4000-8000-0000000000b2';
    get diagnostics rows = row_count;
    msg := format('%s rows updated', rows);
  exception when others then msg := sqlerrm;
  end;
  reset role;
  -- The author cannot approve their own either.
  begin
    perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
    update public.suggestions set status = 'approved' where author_id = '00000000-0000-4000-8000-0000000000b2';
    get diagnostics rows = row_count;
    msg := msg || format('; author: %s rows updated', rows);
  exception when others then msg := msg || '; author: ' || sqlerrm;
  end;
  reset role;
  select status into st from public.suggestions where author_id = '00000000-0000-4000-8000-0000000000b2';
  ok := st = 'pending';
  insert into check_results values ('3b', 'update suggestions set status = approved fails (status stays pending)', ok, msg || '; status=' || st);
end $$;

-- 4. No adult cards without is_adult_confirmed; they appear once confirmed.
do $$
declare adult_a int; normal_a int; adult_b int;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
  select count(*) filter (where adult), count(*) filter (where not adult) into adult_a, normal_a from public.cards;
  reset role;
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
  update public.profiles set is_adult_confirmed = true where id = '00000000-0000-4000-8000-0000000000b2';
  select count(*) into adult_b from public.cards where adult;
  reset role;
  insert into check_results values ('4', 'A profile without is_adult_confirmed gets zero adult cards', adult_a = 0 and normal_a > 0 and adult_b > 0,
    format('unconfirmed: adult=%s other=%s; confirmed: adult=%s', adult_a, normal_a, adult_b));
end $$;

-- 5. Spending more than the balance fails and changes nothing.
do $$
declare ok boolean := false; msg text; c numeric; t int;
begin
  begin
    perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
    perform public.spend_coins('pot', 10.01, 'too much');
    msg := 'spend succeeded';
  exception when others then ok := true; msg := sqlerrm;
  end;
  reset role;
  select coins into c from public.profiles where id = '00000000-0000-4000-8000-0000000000a1';
  select count(*) into t from public.transactions where user_id = '00000000-0000-4000-8000-0000000000a1';
  insert into check_results values ('5', 'spend_coins above the balance fails and changes nothing', ok and c = 10 and t = 1,
    format('%s; coins=%s ledger_rows=%s', msg, c, t));
end $$;

-- Extra: a valid spend works and returns the new balance; refunds are capped by pot spend.
do $$
declare b1 numeric; b2 numeric; msg text := ''; ok boolean := false;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
  b1 := public.spend_coins('pot', 2.5, 'check pot');
  b2 := public.refund_coins(1.2, 'check refund');
  begin
    perform public.refund_coins(1.31, 'over the cap');
    msg := 'over-cap refund succeeded';
  exception when others then ok := true; msg := sqlerrm;
  end;
  reset role;
  insert into check_results values ('x1', 'spend 2.5 then refund 1.2 work; refunding more than was spent fails',
    ok and b1 = 7.5 and b2 = 8.7, format('after spend=%s after refund=%s; %s', b1, b2, msg));
end $$;

-- Extra: buying a shop item debits the price and records ownership; buying it twice fails.
do $$
declare c numeric; owned int; ok boolean := false; msg text;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
  -- B has 10 coins; a frame costs 10.
  perform public.buy_shop_item('frame-stripe');
  begin
    perform public.buy_shop_item('frame-stripe');
    msg := 'second buy succeeded';
  exception when others then ok := true; msg := sqlerrm;
  end;
  select count(*) into owned from public.owned_items where item_id = 'frame-stripe';
  reset role;
  select coins into c from public.profiles where id = '00000000-0000-4000-8000-0000000000b2';
  insert into check_results values ('x2', 'buy_shop_item debits and records; a second buy fails', ok and owned = 1 and c = 0,
    format('coins=%s owned=%s; %s', c, owned, msg));
end $$;

-- Extra: suggestion rules (length, links, phone numbers, duplicates).
do $$
declare msgs text := ''; fails int := 0;
  bad text[] := array[
    'Too short.',
    'Visit www.example.com and tell us what you think about it',
    'Text me at 0917 123 4567 if you want to know the answer',
    'Spec check: who here would survive longest without their phone?'
  ];
  t text;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
  foreach t in array bad loop
    begin
      insert into public.suggestions (author_id, text, kind, deck_id) values ('00000000-0000-4000-8000-0000000000a1', t, 'truth', 'barkada');
      msgs := msgs || ' [accepted: ' || t || ']';
    exception when others then fails := fails + 1; msgs := msgs || ' [' || sqlerrm || ']';
    end;
  end loop;
  reset role;
  insert into check_results values ('x3', 'Suggestions reject short text, links, phone numbers and duplicates', fails = 4, msgs);
end $$;

-- Extra: at most 5 suggestions per 24 hours.
do $$
declare i int; ok boolean := false; msg text;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
  for i in 1..5 loop
    insert into public.suggestions (author_id, text, kind, deck_id)
    values ('00000000-0000-4000-8000-0000000000a1', 'Spec check number ' || i || ': what is your favourite merienda?', 'truth', 'family');
  end loop;
  begin
    insert into public.suggestions (author_id, text, kind, deck_id)
    values ('00000000-0000-4000-8000-0000000000a1', 'Spec check number six: what is your favourite merienda?', 'truth', 'family');
    msg := 'sixth insert succeeded';
  exception when others then ok := true; msg := sqlerrm;
  end;
  reset role;
  insert into check_results values ('x4', 'A sixth suggestion inside 24 hours fails', ok, msg);
end $$;

-- Extra: a user cannot like their own suggestion, nor read the admin-only tables.
do $$
declare ok1 boolean := false; ok2 boolean; msg text; n int;
begin
  perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
  begin
    insert into public.suggestion_likes (suggestion_id, user_id)
    select id, '00000000-0000-4000-8000-0000000000b2' from public.suggestions where author_id = '00000000-0000-4000-8000-0000000000b2';
    msg := 'self like succeeded';
  exception when others then ok1 := true; msg := sqlerrm;
  end;
  select count(*) into n from public.blocked_words;
  ok2 := not public.is_admin();
  reset role;
  insert into check_results values ('x5', 'No liking your own card; is_admin() is false for a normal user', ok1 and ok2,
    format('%s; is_admin=%s; blocked_words visible=%s', msg, not ok2, n));
end $$;

-- Clean up: deleting the auth users cascades to profiles, ledger rows, suggestions and items.
delete from auth.users where id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2');

select n, name, pass, detail from check_results order by n;
