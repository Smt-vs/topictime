create extension if not exists "pgcrypto";

create table if not exists public.themes (
  id text primary key,
  label text not null,
  description text not null,
  price integer not null default 0 check (price >= 0),
  premium_only boolean not null default false,
  palette jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,28}$'),
  display_name text not null,
  avatar_url text,
  bio text not null default '',
  interests text[] not null default '{}',
  coins integer not null default 48 check (coins >= 0),
  premium_until timestamptz,
  selected_theme_id text not null default 'zen' references public.themes(id),
  streak_count integer not null default 0 check (streak_count >= 0),
  last_streak_at date,
  last_gift_at date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists last_gift_at date;
alter table public.profiles alter column coins set default 48;

create table if not exists public.profile_themes (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null references public.themes(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (profile_id, theme_id)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  topic_id uuid not null references public.topics(id) on delete cascade,
  host_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 90),
  prompt text not null check (char_length(prompt) between 8 and 240),
  description text not null default '',
  mood text not null default 'calma',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_members integer not null default 6 check (max_members between 2 and 12),
  coin_cost integer not null default 0 check (coin_cost >= 0),
  is_premium boolean not null default false,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('host', 'member', 'moderator')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  vibe_score integer check (vibe_score between 1 and 5),
  feedback text,
  primary key (room_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('+1', '<3', '!!')),
  created_at timestamptz not null default now(),
  primary key (message_id, profile_id, emoji)
);

create table if not exists public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profile_themes_profile_idx on public.profile_themes (profile_id);
create index if not exists rooms_status_starts_idx on public.rooms (status, starts_at);
create index if not exists rooms_topic_starts_idx on public.rooms (topic_id, starts_at);
create index if not exists room_members_profile_idx on public.room_members (profile_id, joined_at desc);
create index if not exists messages_room_created_idx on public.messages (room_id, created_at desc);
create index if not exists message_reactions_message_idx on public.message_reactions (message_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists wallet_profile_created_idx on public.wallet_transactions (profile_id, created_at desc);
create index if not exists notifications_profile_unread_idx on public.notifications (profile_id, created_at desc) where read_at is null;
create index if not exists moderation_status_idx on public.moderation_reports (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);

  insert into public.profiles (id, username, display_name, interests)
  values (
    new.id,
    generated_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'TopicTimer'),
    '{}'
  )
  on conflict (id) do nothing;

  insert into public.profile_themes (profile_id, theme_id)
  values (new.id, 'zen')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(value), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.join_room(room_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_room public.rooms%rowtype;
  current_profile public.profiles%rowtype;
  member_count integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into target_room
  from public.rooms
  where slug = room_slug
  for update;

  if target_room.id is null then
    raise exception 'room_not_found';
  end if;

  if target_room.status = 'closed' then
    raise exception 'room_closed';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if target_room.is_premium and coalesce(current_profile.premium_until, '-infinity'::timestamptz) < now() then
    raise exception 'premium_required';
  end if;

  select count(*) into member_count
  from public.room_members
  where room_id = target_room.id
    and left_at is null;

  if member_count >= target_room.max_members then
    raise exception 'room_full';
  end if;

  if exists (
    select 1
    from public.room_members
    where room_id = target_room.id
      and profile_id = current_user_id
  ) then
    return jsonb_build_object('joined', true, 'coins', current_profile.coins);
  end if;

  if current_profile.coins < target_room.coin_cost then
    raise exception 'not_enough_coins';
  end if;

  if target_room.coin_cost > 0 then
    update public.profiles
    set coins = coins - target_room.coin_cost
    where id = current_user_id;

    insert into public.wallet_transactions (profile_id, amount, reason, metadata)
    values (
      current_user_id,
      -target_room.coin_cost,
      'room_join',
      jsonb_build_object('room_id', target_room.id, 'room_slug', target_room.slug)
    );
  end if;

  insert into public.room_members (room_id, profile_id, role)
  values (
    target_room.id,
    current_user_id,
    case when target_room.host_id = current_user_id then 'host' else 'member' end
  );

  update public.rooms
  set status = case when status = 'scheduled' and starts_at <= now() then 'live' else status end
  where id = target_room.id;

  return jsonb_build_object('joined', true, 'coins', current_profile.coins - target_room.coin_cost);
end;
$$;

create or replace function public.post_message(room_slug text, message_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_room_id uuid;
  created_message_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select id into target_room_id
  from public.rooms
  where slug = room_slug
    and status in ('scheduled', 'live');

  if target_room_id is null then
    raise exception 'room_not_found';
  end if;

  if not exists (
    select 1
    from public.room_members
    where room_id = target_room_id
      and profile_id = current_user_id
      and left_at is null
  ) then
    raise exception 'not_room_member';
  end if;

  insert into public.messages (room_id, profile_id, body)
  values (target_room_id, current_user_id, message_body)
  returning id into created_message_id;

  return created_message_id;
end;
$$;

create or replace function public.leave_room(room_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_room_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select id into target_room_id
  from public.rooms
  where slug = room_slug;

  if target_room_id is null then
    raise exception 'room_not_found';
  end if;

  update public.room_members
  set left_at = now()
  where room_id = target_room_id
    and profile_id = current_user_id
    and left_at is null;

  return jsonb_build_object('left', true);
end;
$$;

create or replace function public.toggle_message_reaction(target_message_id uuid, reaction_emoji text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_room_id uuid;
  reaction_exists boolean;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if reaction_emoji not in ('+1', '<3', '!!') then
    raise exception 'reaction_not_allowed';
  end if;

  select room_id into target_room_id
  from public.messages
  where id = target_message_id;

  if target_room_id is null then
    raise exception 'message_not_found';
  end if;

  if not exists (
    select 1
    from public.room_members
    where room_id = target_room_id
      and profile_id = current_user_id
      and left_at is null
  ) then
    raise exception 'not_room_member';
  end if;

  select exists (
    select 1
    from public.message_reactions
    where message_id = target_message_id
      and profile_id = current_user_id
      and emoji = reaction_emoji
  ) into reaction_exists;

  if reaction_exists then
    delete from public.message_reactions
    where message_id = target_message_id
      and profile_id = current_user_id
      and emoji = reaction_emoji;

    return jsonb_build_object('selected', false);
  end if;

  insert into public.message_reactions (message_id, profile_id, emoji)
  values (target_message_id, current_user_id, reaction_emoji);

  return jsonb_build_object('selected', true);
end;
$$;

create or replace function public.claim_daily_streak()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  next_streak integer;
  reward integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if current_profile.last_streak_at = current_date then
    return jsonb_build_object('reward', 0, 'streak', current_profile.streak_count);
  end if;

  next_streak := case
    when current_profile.last_streak_at = current_date - 1 then current_profile.streak_count + 1
    else 1
  end;

  reward := 12 + case when next_streak % 7 = 0 then 20 else 0 end;

  update public.profiles
  set coins = coins + reward,
      streak_count = next_streak,
      last_streak_at = current_date
  where id = current_user_id;

  insert into public.wallet_transactions (profile_id, amount, reason, metadata)
  values (
    current_user_id,
    reward,
    'daily_streak',
    jsonb_build_object('streak', next_streak)
  );

  return jsonb_build_object('reward', reward, 'streak', next_streak);
end;
$$;

create or replace function public.claim_free_gift()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  reward integer := 25;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if current_profile.last_gift_at = current_date then
    return jsonb_build_object('reward', 0, 'already_claimed', true);
  end if;

  update public.profiles
  set coins = coins + reward,
      last_gift_at = current_date
  where id = current_user_id;

  insert into public.wallet_transactions (profile_id, amount, reason, metadata)
  values (
    current_user_id,
    reward,
    'free_gift',
    jsonb_build_object('gift_date', current_date)
  );

  return jsonb_build_object('reward', reward, 'already_claimed', false);
end;
$$;

create or replace function public.purchase_theme(target_theme_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  target_theme public.themes%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into target_theme
  from public.themes
  where id = target_theme_id;

  if target_theme.id is null then
    raise exception 'theme_not_found';
  end if;

  if exists (
    select 1
    from public.profile_themes
    where profile_id = current_user_id
      and theme_id = target_theme_id
  ) then
    update public.profiles
    set selected_theme_id = target_theme_id
    where id = current_user_id;
    return;
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if target_theme.premium_only and coalesce(current_profile.premium_until, '-infinity'::timestamptz) < now() then
    raise exception 'premium_required';
  end if;

  if current_profile.coins < target_theme.price then
    raise exception 'not_enough_coins';
  end if;

  update public.profiles
  set coins = coins - target_theme.price,
      selected_theme_id = target_theme_id
  where id = current_user_id;

  insert into public.profile_themes (profile_id, theme_id)
  values (current_user_id, target_theme_id);

  insert into public.wallet_transactions (profile_id, amount, reason, metadata)
  values (
    current_user_id,
    -target_theme.price,
    'theme_purchase',
    jsonb_build_object('theme_id', target_theme_id)
  );
end;
$$;

create or replace function public.activate_premium_plan()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  plan_cost integer := 99;
  new_premium_until timestamptz;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if current_profile.coins < plan_cost then
    raise exception 'not_enough_coins';
  end if;

  new_premium_until := greatest(coalesce(current_profile.premium_until, now()), now()) + interval '30 days';

  update public.profiles
  set coins = coins - plan_cost,
      premium_until = new_premium_until
  where id = current_user_id;

  insert into public.wallet_transactions (profile_id, amount, reason, metadata)
  values (
    current_user_id,
    -plan_cost,
    'premium_plan',
    jsonb_build_object('premium_until', new_premium_until)
  );

  return jsonb_build_object(
    'coins',
    current_profile.coins - plan_cost,
    'cost',
    plan_cost,
    'premium_until',
    new_premium_until
  );
end;
$$;

create or replace function public.save_profile(
  profile_username text,
  profile_display_name text,
  profile_bio text,
  profile_interests text[],
  profile_theme_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles
  set username = profile_username,
      display_name = profile_display_name,
      bio = coalesce(profile_bio, ''),
      interests = coalesce(profile_interests, '{}'),
      selected_theme_id = profile_theme_id,
      onboarding_completed = true
  where id = current_user_id;
end;
$$;

create or replace function public.create_room(
  topic_slug text,
  room_title text,
  room_prompt text,
  room_mood text,
  starts_at timestamptz,
  duration_minutes integer,
  max_members integer,
  coin_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  target_topic_id uuid;
  generated_slug text;
  created_room_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if coalesce(current_profile.premium_until, '-infinity'::timestamptz) < now() then
    raise exception 'premium_required';
  end if;

  select id into target_topic_id
  from public.topics
  where slug = topic_slug;

  if target_topic_id is null then
    raise exception 'topic_not_found';
  end if;

  generated_slug := public.slugify(room_title) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.rooms (
    slug,
    topic_id,
    host_id,
    title,
    prompt,
    description,
    mood,
    starts_at,
    ends_at,
    max_members,
    coin_cost,
    status
  )
  values (
    generated_slug,
    target_topic_id,
    current_user_id,
    room_title,
    room_prompt,
    'Stanza creata dalla community.',
    room_mood,
    starts_at,
    starts_at + make_interval(mins => duration_minutes),
    max_members,
    coin_cost,
    'scheduled'
  )
  returning id into created_room_id;

  insert into public.room_members (room_id, profile_id, role)
  values (created_room_id, current_user_id, 'host');

  return jsonb_build_object('room_id', created_room_id, 'room_slug', generated_slug);
end;
$$;

create or replace function public.ensure_random_rooms(target_count integer default 6)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  open_count integer;
  missing_count integer;
  created_count integer := 0;
  topic_row record;
  generated_slug text;
  random_prompt text;
  random_mood text;
  i integer;
begin
  target_count := least(greatest(target_count, 1), 12);

  select count(*) into open_count
  from public.rooms
  where status in ('scheduled', 'live')
    and ends_at > now();

  missing_count := target_count - open_count;

  if missing_count <= 0 then
    return 0;
  end if;

  for i in 1..missing_count loop
    select id, slug, name into topic_row
    from public.topics
    order by random()
    limit 1;

    exit when topic_row.id is null;

    generated_slug := public.slugify(
      topic_row.slug || '-random-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
    );

    random_prompt := case topic_row.slug
      when 'cinema' then 'Quale scena vi ha fatto cambiare idea su un personaggio?'
      when 'viaggi' then 'Meglio perdersi o avere ogni tappa gia salvata?'
      when 'libri' then 'Un libro che vi ha fatto scrivere a qualcuno?'
      when 'fitness' then 'Quale micro-abitudine vi sta davvero aiutando?'
      when 'musica' then 'Quale canzone vi riporta in un posto preciso?'
      when 'cucina' then 'Quale piatto racconta meglio da dove venite?'
      when 'gaming' then 'Una lobby che ricordate piu della partita?'
      else 'Quale dettaglio vi farebbe restare in questa conversazione?'
    end;

    random_mood := (array['calma', 'curiosa', 'leggera', 'intensa', 'nostalgia'])[1 + floor(random() * 5)::int];

    insert into public.rooms (
      slug,
      topic_id,
      title,
      prompt,
      description,
      mood,
      starts_at,
      ends_at,
      max_members,
      coin_cost,
      is_premium,
      status
    )
    values (
      generated_slug,
      topic_row.id,
      topic_row.name || ' casuale',
      random_prompt,
      'Chatroom generata automaticamente con topic casuale all''apertura della lobby.',
      random_mood,
      now() + make_interval(mins => created_count * 5),
      now() + make_interval(mins => 20 + created_count * 5),
      6,
      case when created_count % 3 = 0 then 0 else 5 + floor(random() * 8)::int end,
      false,
      case when created_count = 0 then 'live' else 'scheduled' end
    );

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

create or replace view public.room_cards
with (security_invoker = true)
as
select
  rooms.id,
  rooms.slug,
  rooms.title,
  rooms.prompt,
  rooms.description,
  rooms.mood,
  rooms.starts_at,
  rooms.ends_at,
  rooms.max_members,
  rooms.coin_cost,
  rooms.is_premium,
  rooms.status,
  topics.slug as topic_slug,
  topics.name as topic_name,
  coalesce(profiles.display_name, 'TopicTime') as host_name,
  count(room_members.profile_id) filter (where room_members.left_at is null) as member_count
from public.rooms
join public.topics on topics.id = rooms.topic_id
left join public.profiles on profiles.id = rooms.host_id
left join public.room_members on room_members.room_id = rooms.id
group by rooms.id, topics.slug, topics.name, profiles.display_name;

grant usage on schema public to anon, authenticated;
grant select on public.themes, public.topics, public.rooms, public.room_cards to anon, authenticated;
grant select on public.profiles, public.profile_themes, public.room_members, public.messages, public.message_reactions to authenticated;
grant select on public.friendships, public.wallet_transactions, public.notifications, public.moderation_reports to authenticated;
grant update on public.profiles, public.rooms, public.room_members, public.notifications, public.friendships to authenticated;
grant insert on public.messages, public.message_reactions, public.friendships, public.moderation_reports to authenticated;
grant delete on public.message_reactions to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.post_message(text, text) to authenticated;
grant execute on function public.leave_room(text) to authenticated;
grant execute on function public.toggle_message_reaction(uuid, text) to authenticated;
grant execute on function public.claim_daily_streak() to authenticated;
grant execute on function public.claim_free_gift() to authenticated;
grant execute on function public.purchase_theme(text) to authenticated;
grant execute on function public.activate_premium_plan() to authenticated;
grant execute on function public.save_profile(text, text, text, text[], text) to authenticated;
grant execute on function public.create_room(text, text, text, text, timestamptz, integer, integer, integer) to authenticated;
grant execute on function public.ensure_random_rooms(integer) to anon, authenticated;

alter table public.themes enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_themes enable row level security;
alter table public.topics enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.friendships enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.moderation_reports enable row level security;

drop policy if exists "themes are readable" on public.themes;
create policy "themes are readable"
on public.themes for select
to anon, authenticated
using (true);

drop policy if exists "profiles readable to authenticated" on public.profiles;
create policy "profiles readable to authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "profile themes readable to owner" on public.profile_themes;
create policy "profile themes readable to owner"
on public.profile_themes for select
to authenticated
using ((select auth.uid()) = profile_id);

drop policy if exists "topics are readable" on public.topics;
create policy "topics are readable"
on public.topics for select
to anon, authenticated
using (true);

drop policy if exists "rooms are readable" on public.rooms;
create policy "rooms are readable"
on public.rooms for select
to anon, authenticated
using (true);

drop policy if exists "hosts can update own rooms" on public.rooms;
create policy "hosts can update own rooms"
on public.rooms for update
to authenticated
using ((select auth.uid()) = host_id)
with check ((select auth.uid()) = host_id);

drop policy if exists "members can read room memberships" on public.room_members;
drop policy if exists "room memberships are readable" on public.room_members;
create policy "room memberships are readable"
on public.room_members for select
to anon, authenticated
using (true);

drop policy if exists "members can update own membership" on public.room_members;
create policy "members can update own membership"
on public.room_members for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

drop policy if exists "members can read messages in joined rooms" on public.messages;
create policy "members can read messages in joined rooms"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.room_members
    where room_members.room_id = messages.room_id
      and room_members.profile_id = (select auth.uid())
  )
);

drop policy if exists "members can write messages as themselves" on public.messages;
create policy "members can write messages as themselves"
on public.messages for insert
to authenticated
with check (
  (select auth.uid()) = profile_id
  and exists (
    select 1
    from public.room_members
    where room_members.room_id = messages.room_id
      and room_members.profile_id = (select auth.uid())
  )
);

drop policy if exists "members can read message reactions" on public.message_reactions;
create policy "members can read message reactions"
on public.message_reactions for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    join public.room_members on room_members.room_id = messages.room_id
    where messages.id = message_reactions.message_id
      and room_members.profile_id = (select auth.uid())
      and room_members.left_at is null
  )
);

drop policy if exists "members manage own message reactions" on public.message_reactions;
create policy "members manage own message reactions"
on public.message_reactions for all
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

drop policy if exists "friendships visible to participants" on public.friendships;
create policy "friendships visible to participants"
on public.friendships for select
to authenticated
using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

drop policy if exists "users request friendships as themselves" on public.friendships;
create policy "users request friendships as themselves"
on public.friendships for insert
to authenticated
with check ((select auth.uid()) = requester_id);

drop policy if exists "users update friendships addressed to them" on public.friendships;
create policy "users update friendships addressed to them"
on public.friendships for update
to authenticated
using ((select auth.uid()) = addressee_id)
with check ((select auth.uid()) = addressee_id);

drop policy if exists "users read own wallet" on public.wallet_transactions;
create policy "users read own wallet"
on public.wallet_transactions for select
to authenticated
using ((select auth.uid()) = profile_id);

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = profile_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

drop policy if exists "authenticated users create moderation reports" on public.moderation_reports;
create policy "authenticated users create moderation reports"
on public.moderation_reports for insert
to authenticated
with check ((select auth.uid()) = reporter_id);

drop policy if exists "users read own moderation reports" on public.moderation_reports;
create policy "users read own moderation reports"
on public.moderation_reports for select
to authenticated
using ((select auth.uid()) = reporter_id);

insert into public.themes (id, label, description, price, premium_only, palette)
values
  ('zen', 'Digital Zen', 'Tema base chiaro e leggibile.', 0, false, '{"accent":"#e96550"}'),
  ('sunset', 'Sunset Nostalgia', 'Toni retro per chat serali.', 45, false, '{"accent":"#9271d9"}'),
  ('pastel', 'Pastel Dream', 'Palette soft con accenti verdi.', 30, false, '{"accent":"#4fa66b"}'),
  ('midnight', 'Midnight Focus', 'Contrasto alto premium.', 80, true, '{"accent":"#4fa6b1"}'),
  ('arcade', 'Arcade Lobby', 'Look arcade premium.', 90, true, '{"accent":"#e96550"}')
on conflict (id) do update
set label = excluded.label,
    description = excluded.description,
    price = excluded.price,
    premium_only = excluded.premium_only,
    palette = excluded.palette;

insert into public.topics (slug, name, description)
values
  ('cinema', 'Cinema', 'Film, scene, regia e memoria visiva.'),
  ('viaggi', 'Viaggi', 'Luoghi, percorsi lenti e racconti di strada.'),
  ('libri', 'Libri', 'Romanzi, saggi e letture che cambiano prospettiva.'),
  ('fitness', 'Fitness', 'Routine sostenibili e abitudini pratiche.'),
  ('musica', 'Musica', 'Playlist, concerti e canzoni legate ai ricordi.'),
  ('cucina', 'Cucina', 'Ricette di casa, cultura e gesti quotidiani.'),
  ('gaming', 'Gaming', 'Co-op, party chat e giochi condivisi.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

insert into public.rooms (
  slug,
  topic_id,
  title,
  prompt,
  description,
  mood,
  starts_at,
  ends_at,
  max_members,
  coin_cost,
  is_premium,
  status
)
values
  (
    'analogica',
    (select id from public.topics where slug = 'cinema'),
    'Fotografia analogica nei film',
    'Quale scena vi ha fatto fermare per guardare davvero la luce?',
    'Una stanza calma per parlare di inquadrature, memoria visiva e scene che restano addosso.',
    'calma',
    now() - interval '3 minutes',
    now() + interval '17 minutes',
    6,
    0,
    false,
    'live'
  ),
  (
    'viaggio-lento',
    (select id from public.topics where slug = 'viaggi'),
    'Viaggio lento',
    'Meglio perdersi in una citta o pianificare ogni tappa?',
    'Percorsi brevi, posti non salvati e il piacere di non ottimizzare tutto.',
    'curiosa',
    now() + interval '6 minutes',
    now() + interval '26 minutes',
    6,
    8,
    false,
    'scheduled'
  ),
  (
    'letture-notte',
    (select id from public.topics where slug = 'libri'),
    'Letture da notte fonda',
    'Un libro che vi ha cambiato idea su qualcuno?',
    'Libri che spostano opinioni, amicizie, giudizi e piccole certezze.',
    'intima',
    now() + interval '14 minutes',
    now() + interval '34 minutes',
    6,
    0,
    false,
    'scheduled'
  ),
  (
    'coop',
    (select id from public.topics where slug = 'gaming'),
    'Co-op memorabili',
    'Il gioco che vi ha fatto litigare e ridere nello stesso party?',
    'Co-op, party chat e giochi che diventano test di pazienza.',
    'vivace',
    now() + interval '41 minutes',
    now() + interval '61 minutes',
    6,
    10,
    true,
    'scheduled'
  )
on conflict (slug) do update
set title = excluded.title,
    prompt = excluded.prompt,
    description = excluded.description,
    mood = excluded.mood,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    max_members = excluded.max_members,
    coin_cost = excluded.coin_cost,
    is_premium = excluded.is_premium,
    status = excluded.status;

delete from public.rooms
where host_id is null
  and slug in ('analogica', 'viaggio-lento', 'letture-notte', 'coop');

select public.ensure_random_rooms(6);
