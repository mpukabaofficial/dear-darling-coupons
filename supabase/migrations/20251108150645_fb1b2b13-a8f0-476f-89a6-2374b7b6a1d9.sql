-- Enable realtime for redeemed_coupons table so we can listen to new redemptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.redeemed_coupons;

-- Create a notifications table to store notification history
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (will be done via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Function to create notification when coupon is redeemed
CREATE OR REPLACE FUNCTION public.notify_partner_on_redemption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_creator_id UUID;
  coupon_title TEXT;
  redeemer_email TEXT;
BEGIN
  -- Get the creator of the coupon and coupon title
  SELECT created_by, title INTO coupon_creator_id, coupon_title
  FROM coupons
  WHERE id = NEW.coupon_id;
  
  -- Get the redeemer's email
  SELECT email INTO redeemer_email
  FROM profiles
  WHERE id = NEW.redeemed_by;
  
  -- If the redeemer is not the creator, notify the creator
  IF NEW.redeemed_by != coupon_creator_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_coupon_id
    ) VALUES (
      coupon_creator_id,
      'coupon_redeemed',
      '💝 Coupon Redeemed!',
      redeemer_email || ' just redeemed your coupon: "' || coupon_title || '"',
      NEW.coupon_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify partner when coupon is redeemed
CREATE TRIGGER on_coupon_redeemed
AFTER INSERT ON public.redeemed_coupons
FOR EACH ROW
EXECUTE FUNCTION public.notify_partner_on_redemption();