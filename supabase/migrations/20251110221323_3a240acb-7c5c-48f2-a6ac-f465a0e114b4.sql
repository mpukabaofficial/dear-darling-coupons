-- Add notification preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_coupon": true,
  "coupon_redeemed": true,
  "coupon_expiring": true,
  "weekly_digest": true,
  "sound_enabled": true
}'::jsonb;

-- Add metadata column to notifications for storing coupon images, etc.
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add read_at timestamp to track when notifications were read
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create function to notify partner when new coupon is created
CREATE OR REPLACE FUNCTION public.notify_partner_on_new_coupon()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_email TEXT;
  partner_prefs JSONB;
BEGIN
  -- Get the creator's email
  SELECT email INTO creator_email
  FROM profiles
  WHERE id = NEW.created_by;
  
  -- Get partner's notification preferences
  SELECT notification_preferences INTO partner_prefs
  FROM profiles
  WHERE id = NEW.for_partner;
  
  -- Check if partner wants new coupon notifications
  IF partner_prefs->>'new_coupon' = 'true' THEN
    -- Insert notification for the partner
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_coupon_id,
      metadata
    ) VALUES (
      NEW.for_partner,
      'new_coupon',
      '🎁 New Coupon Available!',
      creator_email || ' just created a ' || 
      CASE WHEN NEW.is_surprise THEN 'surprise ' ELSE '' END ||
      'coupon for you: "' || NEW.title || '"',
      NEW.id,
      jsonb_build_object(
        'coupon_title', NEW.title,
        'is_surprise', NEW.is_surprise,
        'image_url', NEW.image_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new coupon notifications
DROP TRIGGER IF EXISTS on_coupon_created ON coupons;
CREATE TRIGGER on_coupon_created
  AFTER INSERT ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partner_on_new_coupon();

-- Update existing redemption notification function to include metadata
CREATE OR REPLACE FUNCTION public.notify_partner_on_redemption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_creator_id UUID;
  coupon_title TEXT;
  coupon_image TEXT;
  redeemer_email TEXT;
  creator_prefs JSONB;
BEGIN
  -- Get the creator of the coupon, title, and image
  SELECT created_by, title, image_url 
  INTO coupon_creator_id, coupon_title, coupon_image
  FROM coupons
  WHERE id = NEW.coupon_id;
  
  -- Get the redeemer's email
  SELECT email INTO redeemer_email
  FROM profiles
  WHERE id = NEW.redeemed_by;
  
  -- Get creator's notification preferences
  SELECT notification_preferences INTO creator_prefs
  FROM profiles
  WHERE id = coupon_creator_id;
  
  -- If the redeemer is not the creator and creator wants redemption notifications
  IF NEW.redeemed_by != coupon_creator_id AND creator_prefs->>'coupon_redeemed' = 'true' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_coupon_id,
      metadata
    ) VALUES (
      coupon_creator_id,
      'coupon_redeemed',
      '💝 Coupon Redeemed!',
      redeemer_email || ' just redeemed your coupon: "' || coupon_title || '"',
      NEW.coupon_id,
      jsonb_build_object(
        'coupon_title', coupon_title,
        'image_url', coupon_image,
        'redeemer_email', redeemer_email,
        'redemption_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;