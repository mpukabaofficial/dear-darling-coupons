-- Harden row level security so coupon rules are enforced by the database,
-- not only by the client.

-- ---------------------------------------------------------------------------
-- Redemptions: only the recipient can redeem, once per coupon
-- ---------------------------------------------------------------------------

-- Remove duplicate redemptions (keep the earliest) before adding the constraint
DELETE FROM public.redeemed_coupons r
USING public.redeemed_coupons earlier
WHERE r.coupon_id = earlier.coupon_id
  AND (r.redeemed_at, r.id) > (earlier.redeemed_at, earlier.id);

ALTER TABLE public.redeemed_coupons
  ADD CONSTRAINT redeemed_coupons_coupon_id_key UNIQUE (coupon_id);

DROP POLICY IF EXISTS "Users can redeem coupons" ON public.redeemed_coupons;
CREATE POLICY "Users can redeem coupons meant for them"
  ON public.redeemed_coupons FOR INSERT
  WITH CHECK (
    auth.uid() = redeemed_by
    AND EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.id = coupon_id
        AND c.for_partner = auth.uid()
    )
  );

-- Daily limit backstop. The client enforces one redemption per local calendar
-- day; since the server doesn't know the user's timezone, it enforces the
-- strongest rule consistent with that: at most 2 redemptions in any 24 hours
-- (a 24h window can span at most two calendar days).
CREATE OR REPLACE FUNCTION public.enforce_daily_redemption_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.redeemed_coupons
    WHERE redeemed_by = NEW.redeemed_by
      AND redeemed_at > now() - interval '24 hours'
  ) >= 2 THEN
    RAISE EXCEPTION 'daily_redemption_limit'
      USING HINT = 'You can only redeem one coupon per day.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_daily_redemption_limit ON public.redeemed_coupons;
CREATE TRIGGER enforce_daily_redemption_limit
  BEFORE INSERT ON public.redeemed_coupons
  FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_redemption_limit();

-- ---------------------------------------------------------------------------
-- Coupons: can only be created for your linked partner
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create coupons for their partner" ON public.coupons;
CREATE POLICY "Users can create coupons for their partner"
  ON public.coupons FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND for_partner = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Notifications: only SECURITY DEFINER triggers insert, clients never do
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- ---------------------------------------------------------------------------
-- Image access logs: users can only log their own access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert image access logs" ON public.image_access_logs;
CREATE POLICY "Users can log their own image access"
  ON public.image_access_logs FOR INSERT
  WITH CHECK (auth.uid() = accessed_by);

-- ---------------------------------------------------------------------------
-- Realtime: the app listens for changes on these tables
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
END;
$$;
