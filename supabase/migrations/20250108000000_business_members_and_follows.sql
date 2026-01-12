-- Business Members Table (Team Management)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
  invited_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- Business Follows Table
CREATE TABLE IF NOT EXISTS public.business_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- Add follower_count to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Indexes for business_members
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_status ON public.business_members(status);

-- Indexes for business_follows
CREATE INDEX IF NOT EXISTS idx_business_follows_business ON public.business_follows(business_id);
CREATE INDEX IF NOT EXISTS idx_business_follows_user ON public.business_follows(user_id);

-- Enable RLS
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_follows ENABLE ROW LEVEL SECURITY;

-- Business Members RLS Policies
CREATE POLICY "Business members are publicly readable"
  ON public.business_members FOR SELECT USING (true);

CREATE POLICY "Business owners can insert members"
  ON public.business_members FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update members"
  ON public.business_members FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete members"
  ON public.business_members FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own pending invitations"
  ON public.business_members FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
  );

CREATE POLICY "Users can delete their own pending invitations"
  ON public.business_members FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
  );

-- Business Follows RLS Policies
CREATE POLICY "Business follows are publicly readable"
  ON public.business_follows FOR SELECT USING (true);

CREATE POLICY "Users can follow businesses"
  ON public.business_follows FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow businesses"
  ON public.business_follows FOR DELETE USING (auth.uid() = user_id);

-- Update notifications type constraint to include new types
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'follow', 'like', 'comment', 'claim_approved', 'claim_rejected',
  'business_follow', 'manager_invite', 'manager_added', 'manager_removed', 'ownership_transfer'
));

-- Trigger: Update follower_count on business_follows changes
CREATE OR REPLACE FUNCTION public.update_business_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.businesses
    SET follower_count = follower_count + 1
    WHERE id = NEW.business_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.businesses
    SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = OLD.business_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_business_follow_change ON public.business_follows;
CREATE TRIGGER on_business_follow_change
  AFTER INSERT OR DELETE ON public.business_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_business_follower_count();

-- Trigger: Create notification on business follow
CREATE OR REPLACE FUNCTION public.create_business_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM public.businesses
  WHERE id = NEW.business_id;

  IF v_owner_id IS NOT NULL AND NEW.user_id != v_owner_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, business_id)
    VALUES (v_owner_id, 'business_follow', NEW.user_id, NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_business_follow_notification ON public.business_follows;
CREATE TRIGGER on_business_follow_notification
  AFTER INSERT ON public.business_follows
  FOR EACH ROW EXECUTE FUNCTION public.create_business_follow_notification();

-- Trigger: Create notification on manager invite
CREATE OR REPLACE FUNCTION public.create_manager_invite_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.role = 'manager' THEN
    INSERT INTO public.notifications (user_id, type, actor_id, business_id)
    VALUES (NEW.user_id, 'manager_invite', NEW.invited_by, NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_manager_invite ON public.business_members;
CREATE TRIGGER on_manager_invite
  AFTER INSERT ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.create_manager_invite_notification();

-- Trigger: Auto-update updated_at on business_members
CREATE OR REPLACE FUNCTION public.update_business_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_business_members_update ON public.business_members;
CREATE TRIGGER on_business_members_update
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.update_business_members_updated_at();

-- Update products RLS to allow managers
DROP POLICY IF EXISTS "Business owners can insert products" ON public.products;
DROP POLICY IF EXISTS "Business owners can update products" ON public.products;
DROP POLICY IF EXISTS "Business owners can delete products" ON public.products;

CREATE POLICY "Business owners and managers can insert products"
  ON public.products FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = products.business_id
      AND (
        businesses.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.business_members
          WHERE business_members.business_id = businesses.id
          AND business_members.user_id = auth.uid()
          AND business_members.status = 'active'
        )
      )
    )
  );

CREATE POLICY "Business owners and managers can update products"
  ON public.products FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = products.business_id
      AND (
        businesses.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.business_members
          WHERE business_members.business_id = businesses.id
          AND business_members.user_id = auth.uid()
          AND business_members.status = 'active'
        )
      )
    )
  );

CREATE POLICY "Business owners and managers can delete products"
  ON public.products FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = products.business_id
      AND (
        businesses.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.business_members
          WHERE business_members.business_id = businesses.id
          AND business_members.user_id = auth.uid()
          AND business_members.status = 'active'
        )
      )
    )
  );

-- Update menus RLS to allow managers (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    DROP POLICY IF EXISTS "Business owners can manage menus" ON public.menus;

    CREATE POLICY "Business owners and managers can manage menus"
      ON public.menus FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.businesses
          WHERE businesses.id = menus.business_id
          AND (
            businesses.owner_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.business_members
              WHERE business_members.business_id = businesses.id
              AND business_members.user_id = auth.uid()
              AND business_members.status = 'active'
            )
          )
        )
      );
  END IF;
END $$;
