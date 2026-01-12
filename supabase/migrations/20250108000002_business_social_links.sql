-- Add social media link columns to businesses table

ALTER TABLE public.businesses
  ADD COLUMN instagram_url text,
  ADD COLUMN facebook_url text,
  ADD COLUMN twitter_url text;
