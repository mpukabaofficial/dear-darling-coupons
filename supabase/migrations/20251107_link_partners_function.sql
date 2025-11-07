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
  partner_current_partner_id UUID;
  result JSON;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Find partner by email (case-insensitive)
  SELECT id, partner_id INTO partner_user_id, partner_current_partner_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(partner_email);

  IF partner_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No user found with this email address'
    );
  END IF;

  -- Check if trying to link with self
  IF partner_user_id = current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You cannot link with yourself'
    );
  END IF;

  -- Check if partner is already linked to someone else
  IF partner_current_partner_id IS NOT NULL AND partner_current_partner_id != current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This person is already linked with another partner'
    );
  END IF;

  -- Link both profiles
  UPDATE public.profiles
  SET partner_id = partner_user_id
  WHERE id = current_user_id;

  UPDATE public.profiles
  SET partner_id = current_user_id
  WHERE id = partner_user_id;

  RETURN json_build_object(
    'success', true,
    'partner_id', partner_user_id
  );
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
  -- Get current user ID
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Get partner ID
  SELECT partner_id INTO partner_user_id
  FROM public.profiles
  WHERE id = current_user_id;

  IF partner_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are not linked to a partner'
    );
  END IF;

  -- Unlink both profiles
  UPDATE public.profiles
  SET partner_id = NULL, relationship_start_date = NULL
  WHERE id = current_user_id;

  UPDATE public.profiles
  SET partner_id = NULL, relationship_start_date = NULL
  WHERE id = partner_user_id;

  RETURN json_build_object(
    'success', true
  );
END;
$$;
