-- Update notification function to hide surprise coupon titles
CREATE OR REPLACE FUNCTION public.notify_partner_on_new_coupon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  creator_email TEXT;
  partner_prefs JSONB;
  notification_message TEXT;
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
    -- Build message based on whether it's a surprise
    IF NEW.is_surprise THEN
      notification_message := creator_email || ' just created a surprise coupon for you! 🎁';
    ELSE
      notification_message := creator_email || ' just created a coupon for you: "' || NEW.title || '"';
    END IF;
    
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
      notification_message,
      NEW.id,
      jsonb_build_object(
        'coupon_title', CASE WHEN NEW.is_surprise THEN NULL ELSE NEW.title END,
        'is_surprise', NEW.is_surprise,
        'image_url', NEW.image_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;