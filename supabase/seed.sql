-- Seed initial categories

-- Product Categories (must be created first for foreign key references)
-- General categories
insert into public.categories (id, name, slug, type, attribute_schema) values
  ('00000000-0000-0000-0000-000000000001', 'Beer', 'beer', 'product_category',
   '{"abv": {"type": "number", "label": "ABV %", "min": 0, "max": 100, "step": 0.1, "optional": true}}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'Food', 'food', 'product_category', null),
  ('00000000-0000-0000-0000-000000000003', 'Wine', 'wine', 'product_category',
   '{"abv": {"type": "number", "label": "ABV %", "min": 0, "max": 100, "step": 0.1, "optional": true}}'::jsonb),
  ('00000000-0000-0000-0000-000000000004', 'Cocktail', 'cocktail', 'product_category', null),
  ('00000000-0000-0000-0000-000000000005', 'Coffee', 'coffee', 'product_category', null);

-- Business Types (with default product category references)
insert into public.categories (name, slug, type, default_product_category_id) values
  ('Brewery', 'brewery', 'business_type', '00000000-0000-0000-0000-000000000001'),
  ('Restaurant', 'restaurant', 'business_type', '00000000-0000-0000-0000-000000000002'),
  ('Bar', 'bar', 'business_type', '00000000-0000-0000-0000-000000000001'),
  ('Brewpub', 'brewpub', 'business_type', '00000000-0000-0000-0000-000000000001'),
  ('Cafe', 'cafe', 'business_type', '00000000-0000-0000-0000-000000000005'),
  ('Winery', 'winery', 'business_type', '00000000-0000-0000-0000-000000000003'),
  ('Food Truck', 'food-truck', 'business_type', '00000000-0000-0000-0000-000000000002');

-- Beer Styles (subcategories - can be used for more specific categorization)
insert into public.categories (name, slug, type, parent_id) values
  ('IPA', 'ipa', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Pale Ale', 'pale-ale', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Stout', 'stout', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Porter', 'porter', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Lager', 'lager', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Pilsner', 'pilsner', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Wheat Beer', 'wheat-beer', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Sour', 'sour', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Amber Ale', 'amber-ale', 'product_category', '00000000-0000-0000-0000-000000000001'),
  ('Brown Ale', 'brown-ale', 'product_category', '00000000-0000-0000-0000-000000000001');

-- Food Categories (subcategories)
insert into public.categories (name, slug, type, parent_id) values
  ('Appetizer', 'appetizer', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Main Course', 'main-course', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Dessert', 'dessert', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Side Dish', 'side-dish', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Salad', 'salad', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Soup', 'soup', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Sandwich', 'sandwich', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Pizza', 'pizza', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Burger', 'burger', 'product_category', '00000000-0000-0000-0000-000000000002'),
  ('Seafood', 'seafood', 'product_category', '00000000-0000-0000-0000-000000000002');
