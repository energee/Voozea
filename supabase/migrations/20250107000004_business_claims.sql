-- Business Claims System
-- Allows users to claim ownership of businesses with a pending review process

-- =====================================================
-- BUSINESS CLAIMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_claims_business ON public.business_claims(business_id);
CREATE INDEX idx_business_claims_user ON public.business_claims(user_id);
CREATE INDEX idx_business_claims_status ON public.business_claims(status);

-- =====================================================
-- UPDATE NOTIFICATIONS TABLE
-- =====================================================
-- Add business_id column for claim-related notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Drop existing constraint and add new one with claim types
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('follow', 'like', 'comment', 'claim_approved', 'claim_rejected'));

-- =====================================================
-- RLS POLICIES FOR BUSINESS CLAIMS
-- =====================================================
ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

-- Anyone can view claims (for checking if business has pending claim)
CREATE POLICY "Claims are publicly readable"
  ON public.business_claims FOR SELECT USING (true);

-- Users can create their own claims
CREATE POLICY "Users can create claims"
  ON public.business_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pending claims
CREATE POLICY "Users can delete own pending claims"
  ON public.business_claims FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
  );

-- Only reviewers can update claims (via service role in Supabase dashboard)
-- No policy needed for regular users to update

-- =====================================================
-- TRIGGER: Update business when claim is approved
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_claim_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update the business to set owner
    UPDATE public.businesses
    SET
      owner_id = NEW.user_id,
      is_claimed = true,
      updated_at = NOW()
    WHERE id = NEW.business_id;

    -- Update user profile to mark as business owner
    UPDATE public.profiles
    SET
      is_business_owner = true,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_claim_status_change ON public.business_claims;
CREATE TRIGGER on_claim_status_change
  AFTER UPDATE ON public.business_claims
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_approved();

-- =====================================================
-- TRIGGER: Create notification when claim status changes
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_claim_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when claim is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.notifications (user_id, type, actor_id, business_id)
    VALUES (NEW.user_id, 'claim_approved', COALESCE(NEW.reviewed_by, NEW.user_id), NEW.business_id);
  END IF;

  -- Create notification when claim is rejected
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, actor_id, business_id)
    VALUES (NEW.user_id, 'claim_rejected', COALESCE(NEW.reviewed_by, NEW.user_id), NEW.business_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_claim_notification ON public.business_claims;
CREATE TRIGGER on_claim_notification
  AFTER UPDATE ON public.business_claims
  FOR EACH ROW EXECUTE FUNCTION public.create_claim_notification();
