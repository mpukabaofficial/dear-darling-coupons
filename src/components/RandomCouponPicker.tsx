import { useState, useEffect } from "react";
import ResponsiveModal from "@/components/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Shuffle, Heart, Sparkles } from "lucide-react";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean;
}

interface RandomCouponPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupons: Coupon[];
  onRedeem: (coupon: Coupon) => void;
}

const RandomCouponPicker = ({ open, onOpenChange, coupons, onRedeem }: RandomCouponPickerProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Pick random coupon when modal opens or when coupons change
  useEffect(() => {
    if (open && coupons.length > 0) {
      pickRandomCoupon();
    }
  }, [open]);

  const pickRandomCoupon = () => {
    if (coupons.length === 0) return;
    const randomIndex = Math.floor(Math.random() * coupons.length);
    setSelectedCoupon(coupons[randomIndex]);
  };

  const handleRedeem = () => {
    if (selectedCoupon) {
      onRedeem(selectedCoupon);
      onOpenChange(false);
    }
  };

  if (!selectedCoupon) return null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-md rounded-3xl p-0 overflow-hidden"
      showHeader={false}
    >
      <div className="relative">
          {/* Coupon Image or Gradient Background */}
          {selectedCoupon.image_url ? (
            <div className="relative h-64">
              <img
                src={selectedCoupon.image_url}
                alt={selectedCoupon.title}
                className="w-full h-full object-cover"
              />
              {selectedCoupon.is_surprise && (
                <div className="absolute inset-0 backdrop-blur-3xl bg-black/40 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                    <p className="text-white text-2xl font-bold">Surprise! 🎁</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-peach via-soft-pink to-lavender flex items-center justify-center">
              <Heart className="w-20 h-20 text-white/30" fill="currentColor" />
            </div>
          )}

          {/* Coupon Info */}
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">
                {selectedCoupon.is_surprise ? "Surprise Coupon! 🎁" : selectedCoupon.title}
              </h2>
              {!selectedCoupon.is_surprise && selectedCoupon.description && (
                <p className="text-muted-foreground text-sm">
                  {selectedCoupon.description}
                </p>
              )}
              {selectedCoupon.is_surprise && (
                <p className="text-muted-foreground text-sm">
                  Redeem to reveal the surprise!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={pickRandomCoupon}
                disabled={coupons.length <= 1}
                className="flex-1 rounded-full flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </Button>
              <Button
                onClick={handleRedeem}
                className="flex-1 rounded-full flex items-center gap-2 shadow-soft"
              >
                <Heart className="w-4 h-4" fill="currentColor" />
                Redeem
              </Button>
            </div>

            {coupons.length > 1 && (
              <p className="text-center text-xs text-muted-foreground">
                {coupons.length} coupons available
              </p>
            )}
          </div>
        </div>
    </ResponsiveModal>
  );
};

export default RandomCouponPicker;
