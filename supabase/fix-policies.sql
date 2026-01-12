-- Fix RLS Policies for Voozea
-- Run this in Supabase SQL Editor to update policies on existing database

-- =====================================================
-- PROFILES (critical for ensureProfile helper)
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- BUSINESSES
-- =====================================================
DROP POLICY IF EXISTS "Businesses are publicly readable" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can update their businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can insert businesses" ON public.businesses;

CREATE POLICY "Businesses are publicly readable"
  ON public.businesses FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert businesses"
  ON public.businesses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Business owners can update their businesses"
  ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);

-- =====================================================
-- PRODUCTS
-- =====================================================
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
DROP POLICY IF EXISTS "Business owners can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;

CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- RATINGS
-- =====================================================
DROP POLICY IF EXISTS "Ratings are publicly readable" ON public.ratings;
DROP POLICY IF EXISTS "Authenticated users can create ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.ratings;

CREATE POLICY "Ratings are publicly readable"
  ON public.ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON public.ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own ratings"
  ON public.ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.ratings FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Policies updated successfully!' as status;
