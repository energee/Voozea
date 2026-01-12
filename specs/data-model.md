# Data Model Specification

## Core Entities

### Profiles
Extends Supabase auth.users with additional profile data.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | FK to auth.users |
| username | text | Unique username |
| display_name | text | Display name |
| avatar_url | text | Avatar image URL |
| bio | text | User bio |
| is_business_owner | boolean | Whether user owns businesses |

### Categories
Hierarchical categorization for businesses and products.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | text | Category name |
| slug | text | URL-friendly slug |
| parent_id | uuid | Parent category (for hierarchy) |
| type | text | 'business_type' or 'product_category' |

### Businesses
Any type of business (brewery, restaurant, bar, cafe, etc.)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | text | Business name |
| slug | text | Unique URL slug |
| description | text | Business description |
| category_id | uuid | FK to categories |
| address, city, state, country, postal_code | text | Location |
| latitude, longitude | decimal | Geolocation |
| phone, website | text | Contact info |
| hours | jsonb | Operating hours |
| logo_url, cover_url | text | Media |
| average_rating | decimal | Computed average (0-10) |
| total_ratings | integer | Total rating count |
| owner_id | uuid | FK to profiles |
| is_claimed | boolean | Whether claimed by owner |
| is_verified | boolean | Whether verified |

### Products
Any product offered by a business.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | FK to businesses |
| name | text | Product name |
| slug | text | URL slug (unique per business) |
| description | text | Product description |
| category_id | uuid | FK to categories |
| attributes | jsonb | Flexible attributes (ABV, IBU, price, dietary, etc.) |
| photo_url | text | Product photo |
| average_rating | decimal | Computed average (0-10) |
| total_ratings | integer | Total rating count |
| is_available | boolean | Currently available |
| is_featured | boolean | Featured on menu |

### Ratings
User ratings/reviews for products.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to profiles |
| product_id | uuid | FK to products |
| score | decimal | 1.0-10.0 with 0.1 increments |
| comment | text | Review text |
| location_name | text | Where consumed (optional) |
| like_count | integer | Denormalized like count |
| comment_count | integer | Denormalized comment count |

## Menu Entities

### Menus
Menu containers for businesses.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | FK to businesses |
| name | text | Menu name (Lunch, Dinner, Tap List) |
| description | text | Menu description |
| is_active | boolean | Currently active |
| sort_order | integer | Display order |

### Menu Sections
Sections within menus.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| menu_id | uuid | FK to menus |
| name | text | Section name (Appetizers, IPAs) |
| description | text | Section description |
| sort_order | integer | Display order |

### Menu Items
Products linked to menu sections.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| section_id | uuid | FK to menu_sections |
| product_id | uuid | FK to products |
| price | decimal | Menu price |
| notes | text | Special notes |
| is_available | boolean | Currently available |
| sort_order | integer | Display order |

## Social Entities

### Follows
User follow relationships.

| Field | Type | Description |
|-------|------|-------------|
| follower_id | uuid | FK to profiles (who follows) |
| following_id | uuid | FK to profiles (who is followed) |

### Rating Likes
Likes on ratings.

| Field | Type | Description |
|-------|------|-------------|
| rating_id | uuid | FK to ratings |
| user_id | uuid | FK to profiles |

### Rating Comments
Comments on ratings.

| Field | Type | Description |
|-------|------|-------------|
| rating_id | uuid | FK to ratings |
| user_id | uuid | FK to profiles |
| content | text | Comment text |

### Rating Photos
Photos attached to ratings.

| Field | Type | Description |
|-------|------|-------------|
| rating_id | uuid | FK to ratings |
| url | text | Photo URL |
