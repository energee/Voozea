-- Add onboarding tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

-- Index for querying users who need onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding
ON public.profiles(onboarding_completed)
WHERE onboarding_completed = FALSE;

-- Comment on columns
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed the onboarding flow';
COMMENT ON COLUMN public.profiles.onboarding_skipped IS 'Whether the user skipped the onboarding flow';
