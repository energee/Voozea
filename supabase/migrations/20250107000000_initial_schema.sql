-- Voozea Initial Schema
-- Core hierarchy: Business → Products → Ratings

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  is_business_owner boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- CATEGORIES (hierarchical)
-- =====================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.categories(id),
  type text not null check (type in ('business_type', 'product_category')),
  created_at timestamptz default now(),
  unique(slug, type)
);

-- =====================================================
-- BUSINESSES
-- =====================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  category_id uuid references public.categories(id),

  -- Location
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),

  -- Contact
  phone text,
  website text,
  hours jsonb,

  -- Media
  logo_url text,
  cover_url text,

  -- Stats (denormalized for performance)
  average_rating decimal(3, 1) default 0,
  total_ratings integer default 0,

  -- Ownership
  owner_id uuid references public.profiles(id),
  is_claimed boolean default false,
  is_verified boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- PRODUCTS
-- =====================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  category_id uuid references public.categories(id),

  -- Flexible attributes (ABV, IBU, price, dietary info, etc.)
  attributes jsonb default '{}',

  -- Media
  photo_url text,

  -- Stats (denormalized for performance)
  average_rating decimal(3, 1) default 0,
  total_ratings integer default 0,

  -- Status
  is_available boolean default true,
  is_featured boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(business_id, slug)
);

-- =====================================================
-- MENUS
-- =====================================================
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.menu_sections (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer default 0
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.menu_sections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price decimal(10, 2),
  notes text,
  is_available boolean default true,
  sort_order integer default 0
);

-- =====================================================
-- RATINGS
-- =====================================================
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  -- Rating: 1.0 to 10.0 with 0.1 increments
  score decimal(3, 1) not null check (score >= 1.0 and score <= 10.0),
  comment text,

  -- Optional location context
  location_name text,

  -- Engagement counts (denormalized)
  like_count integer default 0,
  comment_count integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.rating_photos (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

create table public.rating_likes (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(rating_id, user_id)
);

create table public.rating_comments (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- =====================================================
-- FOLLOWS
-- =====================================================
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
create index idx_businesses_slug on public.businesses(slug);
create index idx_businesses_category on public.businesses(category_id);
create index idx_businesses_owner on public.businesses(owner_id);
create index idx_businesses_location on public.businesses(city, state, country);

create index idx_products_business on public.products(business_id);
create index idx_products_category on public.products(category_id);
create index idx_products_slug on public.products(business_id, slug);

create index idx_ratings_user on public.ratings(user_id);
create index idx_ratings_product on public.ratings(product_id);
create index idx_ratings_created on public.ratings(created_at desc);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.menus enable row level security;
alter table public.menu_sections enable row level security;
alter table public.menu_items enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_photos enable row level security;
alter table public.rating_likes enable row level security;
alter table public.rating_comments enable row level security;
alter table public.follows enable row level security;

-- Profiles: public read, own write
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Categories: public read
create policy "Categories are publicly readable"
  on public.categories for select using (true);

-- Businesses: public read, authenticated insert, owner update
create policy "Businesses are publicly readable"
  on public.businesses for select using (true);

create policy "Authenticated users can insert businesses"
  on public.businesses for insert with check (auth.uid() is not null);

create policy "Business owners can update their businesses"
  on public.businesses for update using (auth.uid() = owner_id);

-- Products: public read, authenticated insert/update
create policy "Products are publicly readable"
  on public.products for select using (true);

create policy "Authenticated users can insert products"
  on public.products for insert with check (auth.uid() is not null);

create policy "Authenticated users can update products"
  on public.products for update using (auth.uid() is not null);

-- Menus: public read, business owner write
create policy "Menus are publicly readable"
  on public.menus for select using (true);

create policy "Business owners can manage menus"
  on public.menus for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = menus.business_id
      and businesses.owner_id = auth.uid()
    )
  );

-- Menu sections: public read, via business owner
create policy "Menu sections are publicly readable"
  on public.menu_sections for select using (true);

create policy "Business owners can manage menu sections"
  on public.menu_sections for all using (
    exists (
      select 1 from public.menus
      join public.businesses on businesses.id = menus.business_id
      where menus.id = menu_sections.menu_id
      and businesses.owner_id = auth.uid()
    )
  );

-- Menu items: public read, via business owner
create policy "Menu items are publicly readable"
  on public.menu_items for select using (true);

create policy "Business owners can manage menu items"
  on public.menu_items for all using (
    exists (
      select 1 from public.menu_sections
      join public.menus on menus.id = menu_sections.menu_id
      join public.businesses on businesses.id = menus.business_id
      where menu_sections.id = menu_items.section_id
      and businesses.owner_id = auth.uid()
    )
  );

-- Ratings: public read, authenticated write own
create policy "Ratings are publicly readable"
  on public.ratings for select using (true);

create policy "Authenticated users can create ratings"
  on public.ratings for insert with check (auth.uid() = user_id);

create policy "Users can update own ratings"
  on public.ratings for update using (auth.uid() = user_id);

create policy "Users can delete own ratings"
  on public.ratings for delete using (auth.uid() = user_id);

-- Rating photos: public read, rating owner write
create policy "Rating photos are publicly readable"
  on public.rating_photos for select using (true);

create policy "Rating owners can manage photos"
  on public.rating_photos for all using (
    exists (
      select 1 from public.ratings
      where ratings.id = rating_photos.rating_id
      and ratings.user_id = auth.uid()
    )
  );

-- Rating likes: public read, authenticated write
create policy "Rating likes are publicly readable"
  on public.rating_likes for select using (true);

create policy "Authenticated users can like"
  on public.rating_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.rating_likes for delete using (auth.uid() = user_id);

-- Rating comments: public read, authenticated write
create policy "Rating comments are publicly readable"
  on public.rating_comments for select using (true);

create policy "Authenticated users can comment"
  on public.rating_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.rating_comments for delete using (auth.uid() = user_id);

-- Follows: public read, own write
create policy "Follows are publicly readable"
  on public.follows for select using (true);

create policy "Users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- =====================================================
-- FUNCTIONS: Update rating averages
-- =====================================================
create or replace function public.update_product_rating()
returns trigger as $$
begin
  update public.products
  set
    average_rating = (
      select round(avg(score)::numeric, 1)
      from public.ratings
      where product_id = coalesce(new.product_id, old.product_id)
    ),
    total_ratings = (
      select count(*)
      from public.ratings
      where product_id = coalesce(new.product_id, old.product_id)
    ),
    updated_at = now()
  where id = coalesce(new.product_id, old.product_id);

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_rating_change
  after insert or update or delete on public.ratings
  for each row execute function public.update_product_rating();

-- Update business rating (average of its products)
create or replace function public.update_business_rating()
returns trigger as $$
declare
  v_business_id uuid;
begin
  -- Get the business_id from the product
  select business_id into v_business_id
  from public.products
  where id = coalesce(new.id, old.id);

  update public.businesses
  set
    average_rating = (
      select round(avg(average_rating)::numeric, 1)
      from public.products
      where business_id = v_business_id
      and total_ratings > 0
    ),
    total_ratings = (
      select sum(total_ratings)
      from public.products
      where business_id = v_business_id
    ),
    updated_at = now()
  where id = v_business_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_product_rating_change
  after update on public.products
  for each row
  when (old.average_rating is distinct from new.average_rating)
  execute function public.update_business_rating();
