-- Payments made before the audit log existed (017) had no payment.* rows. Backfill them from payment_requests. Idempotent.
insert into public.audit_log (at, actor_id, actor_label, actor_is_admin, action, area, target_id, target_label, summary, amount, meta)
select r.created_at, r.user_id, u.email::text, exists(select 1 from public.admins a where a.user_id=r.user_id), 'payment.requested', 'payment', r.user_id, u.email::text,
  r.ref || ': ' || r.coins || ' coins for P' || r.price_php, r.price_php, jsonb_build_object('ref', r.ref, 'coins', r.coins, 'package', r.package_id, 'backfilled', true)
from public.payment_requests r join auth.users u on u.id = r.user_id
where not exists (select 1 from public.audit_log l where l.action='payment.requested' and l.meta->>'ref' = r.ref);

insert into public.audit_log (at, actor_id, actor_label, actor_is_admin, action, area, target_id, target_label, summary, amount, meta)
select r.handled_at, coalesce(r.handled_by, r.user_id), coalesce(h.email::text, u.email::text), exists(select 1 from public.admins a where a.user_id = coalesce(r.handled_by, r.user_id)),
  'payment.' || r.status, 'payment', r.user_id, u.email::text, r.ref || ': ' || r.coins || ' coins for P' || r.price_php, r.price_php, jsonb_build_object('ref', r.ref, 'coins', r.coins, 'backfilled', true)
from public.payment_requests r join auth.users u on u.id = r.user_id left join auth.users h on h.id = r.handled_by
where r.status <> 'pending' and r.handled_at is not null
  and not exists (select 1 from public.audit_log l where l.action = 'payment.' || r.status and l.meta->>'ref' = r.ref);

insert into public.audit_log (at, actor_id, actor_label, actor_is_admin, action, area, target_id, target_label, summary, amount, meta)
select r.created_at, r.user_id, u.email::text, false, 'payment.receipt', 'payment', r.user_id, u.email::text, r.ref || ': receipt uploaded', r.price_php, jsonb_build_object('ref', r.ref, 'backfilled', true, 'time_is_approximate', true)
from public.payment_requests r join auth.users u on u.id = r.user_id
where r.receipt_path is not null and not exists (select 1 from public.audit_log l where l.action = 'payment.receipt' and l.meta->>'ref' = r.ref);
