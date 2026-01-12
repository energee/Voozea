-- Entity Abstraction Migration
-- This migration introduces a unified entity system where both users and businesses
-- are represented as entities that can follow each other.

-- ============================================================================
-- PHASE 1: Create entities table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('user', 'business')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up entities by type
CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(type);

-- Enable RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Entities are publicly readable
CREATE POLICY "Entities are publicly readable"
  ON public.entities FOR SELECT USING (true);

-- ============================================================================
-- PHASE 2: Populate entities from existing profiles and businesses
-- ============================================================================

-- Insert entity records for all existing profiles
INSERT INTO public.entities (id, type, created_at)
SELECT id, 'user', created_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Insert entity records for all existing businesses
INSERT INTO public.entities (id, type, created_at)
SELECT id, 'business', created_at
FROM public.businesses
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 3: Add entity_id columns to profiles and businesses
-- ============================================================================

-- Add entity_id to profiles (will equal profiles.id)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE;

-- Add entity_id to businesses (will equal businesses.id)
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE;

-- Populate entity_id columns
UPDATE public.profiles SET entity_id = id WHERE entity_id IS NULL;
UPDATE public.businesses SET entity_id = id WHERE entity_id IS NULL;

-- ============================================================================
-- PHASE 4: Create unified entity_follows table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entity_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_entity_follows_follower ON public.entity_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_entity_follows_following ON public.entity_follows(following_id);

-- Enable RLS
ALTER TABLE public.entity_follows ENABLE ROW LEVEL SECURITY;

-- Entity follows are publicly readable
CREATE POLICY "Entity follows are publicly readable"
  ON public.entity_follows FOR SELECT USING (true);

-- Users can create follows (as themselves or as businesses they manage)
CREATE POLICY "Users can create entity follows"
  ON public.entity_follows FOR INSERT WITH CHECK (
    -- User following as themselves
    follower_id = auth.uid()
    OR
    -- User following as a business they own
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = follower_id
      AND businesses.owner_id = auth.uid()
    )
    OR
    -- User following as a business they manage
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = follower_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

-- Users can delete follows they created
CREATE POLICY "Users can delete entity follows"
  ON public.entity_follows FOR DELETE USING (
    -- User unfollowing as themselves
    follower_id = auth.uid()
    OR
    -- User unfollowing as a business they own
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = follower_id
      AND businesses.owner_id = auth.uid()
    )
    OR
    -- User unfollowing as a business they manage
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = follower_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

-- ============================================================================
-- PHASE 5: Migrate existing follows data
-- ============================================================================

-- Migrate user-to-user follows
INSERT INTO public.entity_follows (follower_id, following_id, created_at)
SELECT follower_id, following_id, created_at
FROM public.follows
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Migrate user-to-business follows
INSERT INTO public.entity_follows (follower_id, following_id, created_at)
SELECT user_id, business_id, created_at
FROM public.business_follows
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- ============================================================================
-- PHASE 6: Update notifications table for entity actors
-- ============================================================================

-- Add entity reference for actor (allows business to be actor)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS actor_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE;

-- Populate actor_entity_id from existing actor_id (which are user IDs)
UPDATE public.notifications
SET actor_entity_id = actor_id
WHERE actor_entity_id IS NULL AND actor_id IS NOT NULL;

-- ============================================================================
-- PHASE 7: Create triggers for auto-creating entities
-- ============================================================================

-- Trigger function to create entity when profile is created
CREATE OR REPLACE FUNCTION public.create_profile_entity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.entities (id, type, created_at)
  VALUES (NEW.id, 'user', COALESCE(NEW.created_at, NOW()))
  ON CONFLICT (id) DO NOTHING;

  NEW.entity_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to create entity when business is created
CREATE OR REPLACE FUNCTION public.create_business_entity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.entities (id, type, created_at)
  VALUES (NEW.id, 'business', COALESCE(NEW.created_at, NOW()))
  ON CONFLICT (id) DO NOTHING;

  NEW.entity_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_profile_entity_create ON public.profiles;
DROP TRIGGER IF EXISTS on_business_entity_create ON public.businesses;

-- Create triggers
CREATE TRIGGER on_profile_entity_create
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_entity();

CREATE TRIGGER on_business_entity_create
  BEFORE INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.create_business_entity();

-- ============================================================================
-- PHASE 8: Create notification trigger for entity follows
-- ============================================================================

-- Update notification type constraint to handle entity follows
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'follow', 'like', 'comment', 'claim_approved', 'claim_rejected',
  'business_follow', 'manager_invite', 'manager_added', 'manager_removed', 'ownership_transfer'
));

-- Trigger function for entity follow notifications
CREATE OR REPLACE FUNCTION public.create_entity_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_type TEXT;
  v_following_type TEXT;
  v_recipient_id UUID;
BEGIN
  -- Get the types of both entities
  SELECT type INTO v_follower_type FROM public.entities WHERE id = NEW.follower_id;
  SELECT type INTO v_following_type FROM public.entities WHERE id = NEW.following_id;

  -- Determine the notification recipient
  IF v_following_type = 'user' THEN
    -- User being followed, they get the notification
    v_recipient_id = NEW.following_id;
  ELSIF v_following_type = 'business' THEN
    -- Business being followed, owner gets the notification
    SELECT owner_id INTO v_recipient_id FROM public.businesses WHERE id = NEW.following_id;
  END IF;

  -- Don't notify if the recipient is the same as the follower (for user followers)
  -- or if the recipient owns/manages the following business
  IF v_recipient_id IS NOT NULL THEN
    -- Skip if user is following themselves
    IF v_follower_type = 'user' AND NEW.follower_id = v_recipient_id THEN
      RETURN NEW;
    END IF;

    -- Skip if business owner is following their own business
    IF v_follower_type = 'business' THEN
      DECLARE
        v_follower_owner_id UUID;
      BEGIN
        SELECT owner_id INTO v_follower_owner_id FROM public.businesses WHERE id = NEW.follower_id;
        IF v_follower_owner_id = v_recipient_id THEN
          RETURN NEW;
        END IF;
      END;
    END IF;

    INSERT INTO public.notifications (user_id, type, actor_entity_id)
    VALUES (v_recipient_id, 'follow', NEW.follower_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_entity_follow_notification ON public.entity_follows;

-- Create trigger
CREATE TRIGGER on_entity_follow_notification
  AFTER INSERT ON public.entity_follows
  FOR EACH ROW EXECUTE FUNCTION public.create_entity_follow_notification();

-- ============================================================================
-- PHASE 9: Add following_count to profiles and businesses
-- ============================================================================

-- Add following_count to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add following_count to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add follower_count to profiles (if not exists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Update counts from existing data
UPDATE public.profiles p
SET follower_count = (
  SELECT COUNT(*) FROM public.entity_follows ef
  WHERE ef.following_id = p.id
);

UPDATE public.profiles p
SET following_count = (
  SELECT COUNT(*) FROM public.entity_follows ef
  WHERE ef.follower_id = p.id
);

UPDATE public.businesses b
SET follower_count = (
  SELECT COUNT(*) FROM public.entity_follows ef
  WHERE ef.following_id = b.id
);

UPDATE public.businesses b
SET following_count = (
  SELECT COUNT(*) FROM public.entity_follows ef
  WHERE ef.follower_id = b.id
);

-- ============================================================================
-- PHASE 10: Trigger to update follower/following counts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_entity_follow_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_type TEXT;
  v_following_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get entity types
    SELECT type INTO v_follower_type FROM public.entities WHERE id = NEW.follower_id;
    SELECT type INTO v_following_type FROM public.entities WHERE id = NEW.following_id;

    -- Update follower's following_count
    IF v_follower_type = 'user' THEN
      UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF v_follower_type = 'business' THEN
      UPDATE public.businesses SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    END IF;

    -- Update following's follower_count
    IF v_following_type = 'user' THEN
      UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    ELSIF v_following_type = 'business' THEN
      UPDATE public.businesses SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get entity types
    SELECT type INTO v_follower_type FROM public.entities WHERE id = OLD.follower_id;
    SELECT type INTO v_following_type FROM public.entities WHERE id = OLD.following_id;

    -- Update follower's following_count
    IF v_follower_type = 'user' THEN
      UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    ELSIF v_follower_type = 'business' THEN
      UPDATE public.businesses SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    END IF;

    -- Update following's follower_count
    IF v_following_type = 'user' THEN
      UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
    ELSIF v_following_type = 'business' THEN
      UPDATE public.businesses SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
    END IF;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_entity_follow_count_change ON public.entity_follows;
CREATE TRIGGER on_entity_follow_count_change
  AFTER INSERT OR DELETE ON public.entity_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_entity_follow_counts();

-- ============================================================================
-- Note: Old follows and business_follows tables are kept for rollback safety
-- They can be dropped in a future migration after verification
-- ============================================================================
