-- Create storage bucket for coupon images
INSERT INTO storage.buckets (id, name, public)
VALUES ('coupon-images', 'coupon-images', true);

-- Storage policies for coupon images
CREATE POLICY "Users can upload their own coupon images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coupon-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view coupon images"
ON storage.objects FOR SELECT
USING (bucket_id = 'coupon-images');

CREATE POLICY "Users can update their own coupon images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coupon-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own coupon images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coupon-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);