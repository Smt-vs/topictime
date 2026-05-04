create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  bio text,
  interests text[] not null default '{}',
  coins integer not null default 0 check (coins >= 0),
  premium_until timestamptz,
  streak_count integer not null default 0 check (streak_count >= 0),
  last_streak_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  host_id uuid references public.profiles(id) on delete set null,
  title text not null,
  prompt text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_members integer not null default 6 check (max_members between 2 and 12),
  coin_cost integer not null default 0 check (coin_cost >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.friendships enable row level security;
alter table public.wallet_transactions enable row level security;

create policy "profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "topics are readable"
on public.topics for select
to authenticated
using (true);

create policy "rooms are readable"
on public.rooms for select
to authenticated
using (true);

create policy "users can join rooms as themselves"
on public.room_members for insert
to authenticated
with check (auth.uid() = profile_id);

create policy "members can read room memberships"
on public.room_members for select
to authenticated
using (true);

create policy "members can read messages in joined rooms"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.room_members
    where room_members.room_id = messages.room_id
      and room_members.profile_id = auth.uid()
  )
);

create policy "members can write messages as themselves"
on public.messages for insert
to authenticated
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.room_members
    where room_members.room_id = messages.room_id
      and room_members.profile_id = auth.uid()
  )
);

create policy "friendships visible to participants"
on public.friendships for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "users request friendships as themselves"
on public.friendships for insert
to authenticated
with check (auth.uid() = requester_id);

create policy "users read own wallet"
on public.wallet_transactions for select
to authenticated
using (auth.uid() = profile_id);
