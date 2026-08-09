create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  point_cost integer not null check (point_cost > 0),
  inventory integer check (inventory is null or inventory >= 0),
  active boolean not null default true,
  requires_parent_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rewards_name_length check (char_length(trim(name)) between 1 and 100)
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  point_cost integer not null check (point_cost > 0),
  status text not null check (status in ('pending_parent','approved','fulfilled','cancelled','rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  fulfilled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists reward_redemptions_user_requested_idx
on public.reward_redemptions (user_id, requested_at desc);

alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

drop policy if exists rewards_authenticated_read on public.rewards;
create policy rewards_authenticated_read
on public.rewards for select to authenticated
using (active = true);

drop policy if exists reward_redemptions_owner_read on public.reward_redemptions;
create policy reward_redemptions_owner_read
on public.reward_redemptions for select to authenticated
using (auth.uid() = user_id);

revoke all on public.rewards from anon;
revoke all on public.reward_redemptions from anon;
grant select on public.rewards to authenticated;
grant select on public.reward_redemptions to authenticated;

create or replace function public.request_reward_redemption(p_reward_id uuid)
returns table (
  redemption_id uuid,
  reward_name text,
  point_cost integer,
  status text,
  available_points integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_latest_points integer;
  v_reserved integer;
  v_available integer;
  v_status text;
  v_redemption_id uuid;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  select * into v_reward
  from public.rewards
  where id = p_reward_id and active = true
  for update;

  if not found then
    raise exception 'reward_not_found';
  end if;

  if v_reward.inventory is not null and v_reward.inventory <= 0 then
    raise exception 'out_of_stock';
  end if;

  select bp.total into v_latest_points
  from public.bip_points bp
  where bp.user_id = v_user_id
  order by bp.captured_at desc, bp.id desc
  limit 1
  for update;

  v_latest_points := coalesce(v_latest_points, 0);

  select coalesce(sum(rr.point_cost), 0)::integer into v_reserved
  from public.reward_redemptions rr
  where rr.user_id = v_user_id
    and rr.status in ('pending_parent','approved','fulfilled');

  v_available := v_latest_points - v_reserved;
  if v_available < v_reward.point_cost then
    raise exception 'insufficient_points';
  end if;

  v_status := case when v_reward.requires_parent_approval then 'pending_parent' else 'approved' end;

  if v_reward.inventory is not null then
    update public.rewards
    set inventory = inventory - 1,
        updated_at = now()
    where id = v_reward.id;
  end if;

  insert into public.reward_redemptions (user_id, reward_id, point_cost, status)
  values (v_user_id, v_reward.id, v_reward.point_cost, v_status)
  returning id into v_redemption_id;

  return query
  select v_redemption_id, v_reward.name, v_reward.point_cost, v_status, v_available - v_reward.point_cost;
end;
$$;

revoke all on function public.request_reward_redemption(uuid) from public;
grant execute on function public.request_reward_redemption(uuid) to authenticated;
