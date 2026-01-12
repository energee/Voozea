# Database Specification

## Supabase Setup

### Remote Database
1. Create project at supabase.com
2. Get credentials from Settings → API
3. Set in `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Migrations
- Location: `supabase/migrations/`
- Apply via SQL Editor or CLI: `supabase db push`

### Helper Scripts
- `supabase/fix-policies.sql` - Fix RLS policies on existing database
- `supabase/seed.sql` - Initial categories

## Row Level Security (RLS)

### Philosophy
- **Public read** for all content (businesses, products, ratings)
- **Authenticated insert** for user-generated content
- **Owner-only update/delete** where applicable

### Policies

#### Profiles
| Action | Rule |
|--------|------|
| SELECT | Anyone |
| INSERT | Own profile only (`auth.uid() = id`) |
| UPDATE | Own profile only |

#### Businesses
| Action | Rule |
|--------|------|
| SELECT | Anyone |
| INSERT | Any authenticated user |
| UPDATE | Owner only (`auth.uid() = owner_id`) |

#### Products
| Action | Rule |
|--------|------|
| SELECT | Anyone |
| INSERT | Any authenticated user |
| UPDATE | Any authenticated user |

#### Ratings
| Action | Rule |
|--------|------|
| SELECT | Anyone |
| INSERT | Any authenticated user |
| UPDATE | Own ratings only (`auth.uid() = user_id`) |
| DELETE | Own ratings only |

## Profile Management

Profiles are auto-created via database trigger on signup. For existing users missing profiles, use `ensureProfile()` helper:

```typescript
import { ensureProfile } from '@/lib/supabase/ensure-profile'

// In server actions
const supabase = await createClient()
await ensureProfile(supabase)
```

## Key Functions

### `gen_random_uuid()`
Built-in PostgreSQL function for UUIDs. Do NOT use `uuid_generate_v4()`.

### `update_product_rating()`
Trigger function that updates product's `average_rating` and `total_ratings` when ratings change.

### `update_business_rating()`
Trigger function that updates business's `average_rating` based on its products' ratings.
