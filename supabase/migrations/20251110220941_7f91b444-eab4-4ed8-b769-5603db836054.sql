-- Add DELETE policy for redeemed_coupons to allow reverse redemption
-- Users can delete redemptions if they:
-- 1. Are the person who redeemed it, OR
-- 2. Are the creator of the coupon that was redeemed

CREATE POLICY "Users can delete redemptions they made or for coupons they created"
ON public.redeemed_coupons
FOR DELETE
USING (
  auth.uid() = redeemed_by OR
  EXISTS (
    SELECT 1 FROM coupons
    WHERE coupons.id = redeemed_coupons.coupon_id
    AND coupons.created_by = auth.uid()
  )
);