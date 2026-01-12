# Feature Specifications

## Phase 1: Foundation (Complete)

### Authentication
- Email/password registration
- Email/password login
- Password reset via email
- Profile auto-creation on signup (+ ensureProfile helper)
- Session management via Supabase

### Project Setup
- Next.js 14+ with App Router
- Tailwind CSS + shadcn/ui components
- Supabase client (server + browser)
- Database schema with RLS policies

## Phase 2: Core Data Entry (Complete)

### Business Management
- `/businesses` - Search/browse all businesses
- `/businesses/new` - Add new business (any authenticated user)
- `/business/[slug]` - Business detail page with products

### Product Management
- `/business/[slug]/add-product` - Add product to business
- `/product/[id]` - Product detail page
- Flexible attributes via JSONB (ABV, IBU, price, etc.)

### Rating System
- 1-10 scale with 0.1 increments
- Interactive slider component
- Optional comment
- Update existing rating
- Auto-updates product/business averages via triggers

## Phase 3: Social Features (Pending)

### Follow System
- Follow/unfollow users
- Follower/following counts
- Following list

### Activity Feeds
- Friends feed (ratings from followed users)
- Global feed (all recent ratings)
- Business feed (ratings at specific business)

### Engagement
- Like ratings
- Comment on ratings
- View likes/comments

### User Profiles
- User info
- Rating history
- Stats (total ratings, average given)
- Followers/following

### Notifications
- New follower
- Like on rating
- Comment on rating

## Phase 4: Menu Builder (Pending)

### Business Claiming
- Claim ownership of a business
- Verification process

### Menu Organization
- Create menus (Lunch, Dinner, Tap List)
- Organize products into sections
- Drag-and-drop reordering
- Public menu view with QR code

## Phase 5: Business Analytics (Pending)

### Dashboard
- Total views
- Rating trends
- Top rated products
- Customer demographics

### Insights
- Popular times
- Comparison to similar businesses
- Review sentiment

### Team Management
- Invite team members
- Role-based access (owner, admin, editor)

## Phase 6: Polish & Launch

### Performance
- Image optimization
- Lazy loading
- Caching strategies

### Security
- RLS policy review
- Input validation
- Rate limiting

### Testing
- E2E tests
- Unit tests for critical paths

### Deployment
- Vercel production
- Environment configuration
- Monitoring setup
