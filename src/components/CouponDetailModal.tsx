import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean;
  created_at: string;
}

interface CouponDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  couponId: string | null;
}

export const CouponDetailModal = ({ open, onOpenChange, couponId }: CouponDetailModalProps) => {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && couponId) {
      fetchCoupon();
    }
  }, [open, couponId]);

  const fetchCoupon = async () => {
    if (!couponId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .single();

    if (error) {
      console.error("Error fetching coupon:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setCoupon(data);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md overflow-hidden p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Heart className="w-12 h-12 text-primary animate-bounce mb-4" fill="currentColor" />
            <p className="text-muted-foreground">Loading coupon...</p>
          </div>
        ) : coupon ? (
          <>
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-peach via-soft-pink to-lavender p-6 text-center">
              <div className="absolute top-4 left-4">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" fill="currentColor" />
                </div>
              </div>
              {coupon.is_surprise && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Surprise</span>
                  </div>
                </div>
              )}
              <DialogHeader className="space-y-4 pt-6">
                <DialogTitle className="text-2xl font-bold text-white">
                  {coupon.title}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Image if exists */}
            {coupon.image_url && (
              <div className="w-full">
                <img
                  src={coupon.image_url}
                  alt={coupon.title}
                  className="w-full max-h-[300px] object-cover"
                />
              </div>
            )}

            {/* Description */}
            {coupon.description && (
              <div className="p-6 space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Description
                </h4>
                <DialogDescription className="text-base text-foreground leading-relaxed">
                  {coupon.description}
                </DialogDescription>
              </div>
            )}

            {/* Footer decoration */}
            <div className="px-6 pb-6 pt-2">
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                <div className="w-2 h-2 rounded-full bg-primary/30"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Coupon not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
