-- ── Brands ──────────────────────────────────────────────────────────────────
create table brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  country     text,
  description text,
  logo_url    text,
  created_at  timestamptz default now()
);

-- ── Fragrances ───────────────────────────────────────────────────────────────
create table fragrances (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  brand_id      uuid references brands(id) on delete restrict,
  description   text,
  year          integer,
  concentration text,          -- EDP, EDT, Parfum, EDC
  gender        text check (gender in ('masculine','feminine','unisex')),
  image_url         text,
  perfumer          text,
  fw_classification text,
  concepts          text[],
  wikiparfum_slug   text,
  origin            text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_fragrances_brand on fragrances(brand_id);
create index idx_fragrances_slug  on fragrances(slug);

-- ── Notes ────────────────────────────────────────────────────────────────────
create table notes (
  id     uuid primary key default gen_random_uuid(),
  name   text unique not null,
  family text  -- floral, woody, fresh, citrus, oriental, fougere
);

create table fragrance_notes (
  fragrance_id uuid references fragrances(id) on delete cascade,
  note_id      uuid references notes(id) on delete cascade,
  position     text check (position IS NULL OR position IN ('top','heart','base')),
  primary key (fragrance_id, note_id)
);

-- ── Accords (community-voted scent profile) ───────────────────────────────────
create table fragrance_accords (
  id           uuid primary key default gen_random_uuid(),
  fragrance_id uuid references fragrances(id) on delete cascade,
  accord_name  text not null,
  percentage   numeric not null check (percentage > 0 and percentage <= 100),
  color_hex    text,
  unique (fragrance_id, accord_name)
);

-- ── Profiles (extends auth.users) ─────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  is_creator   boolean default false,
  created_at   timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Ratings ───────────────────────────────────────────────────────────────────
create table ratings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  fragrance_id uuid references fragrances(id) on delete cascade,
  score        numeric(3,1) not null check (score >= 1 and score <= 10),
  longevity    text check (longevity in ('24hrs+','12-24hrs','8-12hrs','4-8hrs','under-4hrs')),
  sillage      text check (sillage  in ('enormous','strong','moderate','soft','intimate')),
  season       text[],    -- ['spring','summer','autumn','winter']
  gender_vote  text check (gender_vote in ('masculine','feminine','unisex')),
  recommend    boolean,
  review_text  text,
  created_at   timestamptz default now(),
  unique (user_id, fragrance_id)
);

create index idx_ratings_fragrance on ratings(fragrance_id);
create index idx_ratings_user      on ratings(user_id);

-- ── Wishlist ──────────────────────────────────────────────────────────────────
create table wishlists (
  user_id      uuid references profiles(id)    on delete cascade,
  fragrance_id uuid references fragrances(id)  on delete cascade,
  created_at   timestamptz default now(),
  primary key (user_id, fragrance_id)
);

-- ── Dupes ─────────────────────────────────────────────────────────────────────
create table dupes (
  id               uuid primary key default gen_random_uuid(),
  original_id      uuid references fragrances(id) on delete cascade,
  dupe_id          uuid references fragrances(id) on delete cascade,
  match_percentage integer not null check (match_percentage between 1 and 100),
  vote_count       integer default 0,
  created_at       timestamptz default now(),
  unique (original_id, dupe_id)
);

create table dupe_votes (
  user_id   uuid references profiles(id) on delete cascade,
  dupe_id   uuid references dupes(id)   on delete cascade,
  confirmed boolean not null,
  primary key (user_id, dupe_id)
);

-- ── Lists ─────────────────────────────────────────────────────────────────────
create table lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  title       text not null,
  description text,
  is_public   boolean default true,
  created_at  timestamptz default now()
);

create table list_items (
  list_id      uuid references lists(id)      on delete cascade,
  fragrance_id uuid references fragrances(id) on delete cascade,
  sort_order   integer,
  note         text,
  primary key (list_id, fragrance_id)
);

-- ── Retailers & pricing ───────────────────────────────────────────────────────
create table retailers (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table fragrance_prices (
  id            uuid primary key default gen_random_uuid(),
  fragrance_id  uuid references fragrances(id) on delete cascade,
  retailer_id   uuid references retailers(id),
  size_ml       integer,
  price         numeric(10,2),
  currency      text default 'GBP',
  affiliate_url text,
  last_checked  timestamptz default now()
);

create index idx_prices_fragrance on fragrance_prices(fragrance_id);

-- ── Aggregate views ───────────────────────────────────────────────────────────
create view fragrance_stats as
select
  f.id,
  f.slug,
  f.name,
  count(r.id)                          as rating_count,
  round(avg(r.score)::numeric, 1)      as avg_score,
  round(
    100.0 * count(r.recommend) filter (where r.recommend = true)
    / nullif(count(r.recommend), 0)
  )                                    as recommend_pct,
  mode() within group (order by r.longevity) as common_longevity,
  mode() within group (order by r.sillage)   as common_sillage
from fragrances f
left join ratings r on r.fragrance_id = f.id
group by f.id;

-- ── Row-level security ────────────────────────────────────────────────────────
alter table profiles          enable row level security;
alter table ratings           enable row level security;
alter table wishlists         enable row level security;
alter table dupe_votes        enable row level security;
alter table lists             enable row level security;
alter table list_items        enable row level security;

-- Public reads
create policy "Public profiles are viewable"   on profiles  for select using (true);
create policy "Public brands are viewable"     on brands    for select using (true);
create policy "Public fragrances are viewable" on fragrances for select using (true);
create policy "Public ratings are viewable"    on ratings   for select using (true);
create policy "Public lists are viewable"      on lists     for select using (is_public = true);

-- Authenticated writes
create policy "Users manage own profile"   on profiles  for all using (auth.uid() = id);
create policy "Users manage own ratings"   on ratings   for all using (auth.uid() = user_id);
create policy "Users manage own wishlist"  on wishlists for all using (auth.uid() = user_id);
create policy "Users manage own dupe votes" on dupe_votes for all using (auth.uid() = user_id);
create policy "Users manage own lists"     on lists     for all using (auth.uid() = user_id);
create policy "Users manage own list items" on list_items for all
  using (exists (select 1 from lists where id = list_items.list_id and user_id = auth.uid()));
