-- Function to link two partners together
CREATE OR REPLACE FUNCTION public.link_partners(partner_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  partner_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Get the current user's ID and email
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get current user's email
  SELECT email INTO current_user_email
  FROM profiles
  WHERE id = current_user_id;

  -- Validate: Can't link with yourself
  IF LOWER(partner_email) = LOWER(current_user_email) THEN
    RETURN json_build_object('success', false, 'error', 'You cannot link with yourself');
  END IF;

  -- Find the partner by email
  SELECT id INTO partner_user_id
  FROM profiles
  WHERE LOWER(email) = LOWER(partner_email);

  -- Validate: Partner must exist
  IF partner_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Partner not found. Make sure they have signed up.');
  END IF;

  -- Check if current user is already linked
  IF (SELECT partner_id FROM profiles WHERE id = current_user_id) IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are already linked with a partner. Unlink first.');
  END IF;

  -- Check if partner is already linked
  IF (SELECT partner_id FROM profiles WHERE id = partner_user_id) IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'This partner is already linked with someone else');
  END IF;

  -- Link both partners atomically
  UPDATE profiles SET partner_id = partner_user_id WHERE id = current_user_id;
  UPDATE profiles SET partner_id = current_user_id WHERE id = partner_user_id;

  RETURN json_build_object('success', true, 'message', 'Successfully linked with partner');
END;
$$;

-- Function to unlink from partner
CREATE OR REPLACE FUNCTION public.unlink_partner()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  partner_user_id UUID;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get the partner's ID
  SELECT partner_id INTO partner_user_id
  FROM profiles
  WHERE id = current_user_id;

  -- Validate: Must be linked to unlink
  IF partner_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are not linked with anyone');
  END IF;

  -- Delete all coupons between the two users
  DELETE FROM coupons 
  WHERE (created_by = current_user_id AND for_partner = partner_user_id)
     OR (created_by = partner_user_id AND for_partner = current_user_id);

  -- Unlink both partners atomically
  UPDATE profiles SET partner_id = NULL, relationship_start_date = NULL WHERE id = current_user_id;
  UPDATE profiles SET partner_id = NULL, relationship_start_date = NULL WHERE id = partner_user_id;

  RETURN json_build_object('success', true, 'message', 'Successfully unlinked from partner');
END;
$$;