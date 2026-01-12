-- Social Features Migration
-- Adds indexes, triggers for engagement counts, and notifications

-- =====================================================
-- INDEXES for rating_likes and rating_comments
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rating_likes_rating ON public.rating_likes(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_likes_user ON public.rating_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_comments_rating ON public.rating_comments(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_comments_user ON public.rating_comments(user_id);

-- =====================================================
-- TRIGGER: Update like_count on ratings
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_rating_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ratings
    SET like_count = like_count + 1
    WHERE id = NEW.rating_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ratings
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.rating_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_like_change ON public.rating_likes;
CREATE TRIGGER on_rating_like_change
  AFTER INSERT OR DELETE ON public.rating_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_rating_like_count();

-- =====================================================
-- TRIGGER: Update comment_count on ratings
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_rating_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ratings
    SET comment_count = comment_count + 1
    WHERE id = NEW.rating_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ratings
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.rating_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_comment_change ON public.rating_comments;
CREATE TRIGGER on_rating_comment_change
  AFTER INSERT OR DELETE ON public.rating_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_rating_comment_count();

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment')),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_id UUID REFERENCES public.ratings(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see and update their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications (via trigger with security definer)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- =====================================================
-- TRIGGER: Create notification on follow
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify yourself
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id)
    VALUES (NEW.following_id, 'follow', NEW.follower_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.create_follow_notification();

-- =====================================================
-- TRIGGER: Create notification on like
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  rating_owner_id UUID;
BEGIN
  -- Get the rating owner
  SELECT user_id INTO rating_owner_id
  FROM public.ratings
  WHERE id = NEW.rating_id;

  -- Don't notify yourself
  IF NEW.user_id != rating_owner_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, rating_id)
    VALUES (rating_owner_id, 'like', NEW.user_id, NEW.rating_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_notification ON public.rating_likes;
CREATE TRIGGER on_like_notification
  AFTER INSERT ON public.rating_likes
  FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();

-- =====================================================
-- TRIGGER: Create notification on comment
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  rating_owner_id UUID;
BEGIN
  -- Get the rating owner
  SELECT user_id INTO rating_owner_id
  FROM public.ratings
  WHERE id = NEW.rating_id;

  -- Don't notify yourself
  IF NEW.user_id != rating_owner_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, rating_id)
    VALUES (rating_owner_id, 'comment', NEW.user_id, NEW.rating_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notification ON public.rating_comments;
CREATE TRIGGER on_comment_notification
  AFTER INSERT ON public.rating_comments
  FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Social features migration complete!' AS status;
