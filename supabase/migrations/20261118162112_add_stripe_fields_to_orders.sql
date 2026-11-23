alter table public.orders
add column if not exists stripe_checkout_session_id text;

alter table public.orders
add column if not exists stripe_payment_intent_id text;

alter table public.orders
add column if not exists stripe_payment_status text;

alter table public.orders
add column if not exists stripe_payment_method_type text;