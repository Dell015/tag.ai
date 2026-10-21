-- Run by hand in the Supabase SQL editor AFTER the owner has signed in once with this email.
-- Replace ADMIN_EMAIL. Not run automatically.
insert into public.admins (user_id)
select id from auth.users where email = 'ADMIN_EMAIL'
on conflict do nothing;
