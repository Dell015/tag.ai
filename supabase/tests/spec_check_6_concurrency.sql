-- ============================================================
-- Spec check 6: two phones calling spend_coins at the same moment
-- cannot take the balance below zero.
-- Run the three parts as separate queries. Part 2 is sent twice at the
-- same time on two connections. Each call holds the row lock for 2 seconds
-- after spending, so the second call must wait, then sees 4 coins and fails.
-- Expected: one call returns 4, the other fails with "Not enough coins",
-- final balance 4, exactly one 'race' ledger row.
-- ============================================================

-- PART 1: setup (a committed test user with the 10 coin welcome gift)
insert into auth.users (id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-0000000000c6', 'authenticated', 'authenticated', 'check-race@example.test', '{}', '{}', now(), now());

-- PART 2: the call (send twice in parallel)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c6","role":"authenticated"}', true);
set local role authenticated;
select public.spend_coins('pot', 6, 'race') as new_balance, clock_timestamp() as spent_at, pg_sleep(2);

-- PART 3: verify and clean up
select (select coins from public.profiles where id = '00000000-0000-4000-8000-0000000000c6') as final_coins,
       (select count(*) from public.transactions where user_id = '00000000-0000-4000-8000-0000000000c6' and note = 'race') as race_rows;
delete from auth.users where id = '00000000-0000-4000-8000-0000000000c6';
