-- Add ability to delete images from coupons while keeping the coupon
-- This is already possible with the current schema since image_url is nullable

-- Create a function to track image deletions and send notifications
CREATE OR REPLACE FUNCTION public.notify_on_image_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_user_id UUID;
  coupon_title TEXT;
BEGIN
  -- Only trigger if image_url changed from non-null to null
  IF OLD.image_url IS NOT NULL AND NEW.image_url IS NULL THEN
    -- Get the partner who received this coupon
    SELECT for_partner, title INTO partner_user_id, coupon_title
    FROM coupons
    WHERE id = NEW.id;
    
    -- Notify the partner that image was removed
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_coupon_id,
      metadata
    ) VALUES (
      partner_user_id,
      'image_removed',
      '🖼️ Image Removed',
      'The image was removed from the coupon: "' || coupon_title || '"',
      NEW.id,
      jsonb_build_object(
        'coupon_title', coupon_title,
        'removed_at', NOW()
      )
    );
    
    -- Also notify the creator
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_coupon_id,
      metadata
    ) VALUES (
      NEW.created_by,
      'image_removed',
      '🖼️ Image Deleted',
      'You removed the image from: "' || coupon_title || '"',
      NEW.id,
      jsonb_build_object(
        'coupon_title', coupon_title,
        'removed_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for image deletion notifications
DROP TRIGGER IF EXISTS on_image_deletion ON coupons;
CREATE TRIGGER on_image_deletion
  AFTER UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_image_deletion();

-- Create a function to log and detect suspicious image access
CREATE TABLE IF NOT EXISTS public.image_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL, -- 'view', 'download_attempt', 'suspicious'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on image_access_logs
ALTER TABLE public.image_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own access logs and logs for coupons they created
CREATE POLICY "Users can view their own image access logs"
ON public.image_access_logs
FOR SELECT
USING (
  auth.uid() = accessed_by OR
  EXISTS (
    SELECT 1 FROM coupons
    WHERE coupons.id = image_access_logs.coupon_id
    AND coupons.created_by = auth.uid()
  )
);

-- System can insert access logs
CREATE POLICY "System can insert image access logs"
ON public.image_access_logs
FOR INSERT
WITH CHECK (true);