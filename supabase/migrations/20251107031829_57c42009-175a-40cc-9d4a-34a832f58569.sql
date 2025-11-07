-- Create profiles table for partner information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  partner_id UUID REFERENCES public.profiles(id),
  relationship_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile and their partner's"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR auth.uid() = partner_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_surprise BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  for_partner UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Users can view coupons meant for them"
  ON public.coupons FOR SELECT
  USING (auth.uid() = for_partner OR auth.uid() = created_by);

CREATE POLICY "Users can create coupons for their partner"
  ON public.coupons FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update coupons they created"
  ON public.coupons FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete coupons they created"
  ON public.coupons FOR DELETE
  USING (auth.uid() = created_by);

-- Create redeemed coupons table
CREATE TABLE public.redeemed_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  redeemed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_note TEXT,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.redeemed_coupons ENABLE ROW LEVEL SECURITY;

-- Redeemed coupons policies
CREATE POLICY "Users can view their own and partner's redeemed coupons"
  ON public.redeemed_coupons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (auth.uid() = redeemed_by OR auth.uid() = p.partner_id)
      AND p.id = redeemed_by
    )
  );

CREATE POLICY "Users can redeem coupons"
  ON public.redeemed_coupons FOR INSERT
  WITH CHECK (auth.uid() = redeemed_by);

-- Create mood checks table
CREATE TABLE public.mood_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);

ALTER TABLE public.mood_checks ENABLE ROW LEVEL SECURITY;

-- Mood checks policies
CREATE POLICY "Users can view their own and partner's mood checks"
  ON public.mood_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (auth.uid() = user_id OR auth.uid() = p.partner_id)
      AND p.id = user_id
    )
  );

CREATE POLICY "Users can create their own mood checks"
  ON public.mood_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();