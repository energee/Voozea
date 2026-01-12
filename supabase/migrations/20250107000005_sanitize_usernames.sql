-- Fix username sanitization in profile creation trigger
-- Ensures usernames are URL-safe (lowercase, alphanumeric + underscores only)

-- Helper function to sanitize usernames
CREATE OR REPLACE FUNCTION public.sanitize_username(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN substring(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(trim(input)),
          '[^a-z0-9_]', '_', 'g'  -- Replace non-alphanumeric with underscore
        ),
        '_+', '_', 'g'            -- Collapse multiple underscores
      ),
      '^_|_$', '', 'g'            -- Remove leading/trailing underscores
    ),
    1, 30                          -- Limit to 30 characters
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the handle_new_user trigger to sanitize usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_username TEXT;
  clean_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Get raw username from metadata or email
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- Sanitize it
  clean_username := public.sanitize_username(raw_username);

  -- Ensure minimum length
  IF length(clean_username) < 3 THEN
    clean_username := 'user';
  END IF;

  -- Find unique username
  final_username := clean_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := clean_username || '_' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', raw_username)
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Fix existing usernames with spaces (run manually if needed)
-- This is commented out because it will change existing URLs
-- UPDATE public.profiles
-- SET username = public.sanitize_username(username) || '_' || floor(random() * 10000)::text
-- WHERE username ~ '[^a-z0-9_]';
