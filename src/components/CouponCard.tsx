import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResponsiveModal from "@/components/ResponsiveModal";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import confetti from "canvas-confetti";
import ImageModal from "@/components/ImageModal";
import ShareCardModal from "@/components/ShareCardModal";
import ProtectedImage from "@/components/ProtectedImage";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean;
  created_by: string;
  for_partner: string;
}

interface CouponCardProps {
  coupon: Coupon;
  onRedeemed: () => void;
}

const CouponCard = ({ coupon, onRedeemed }: CouponCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [reflection, setReflection] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionTimestamp, setRedemptionTimestamp] = useState<string>("");
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();

  const checkCanRedeem = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Check if user has created at least 4 unredeemed coupons
    const { data: createdCoupons, error: createdError } = await supabase
      .from("coupons")
      .select("id")
      .eq("created_by", session.user.id);

    if (createdError) {
      toast({
        title: "Error",
        description: createdError.message,
        variant: "destructive",
      });
      return false;
    }

    // Get redeemed coupon IDs
    const { data: redeemedCoupons } = await supabase
      .from("redeemed_coupons")
      .select("coupon_id");

    const redeemedIds = new Set(redeemedCoupons?.map(r => r.coupon_id) || []);

    // Count only unredeemed coupons created by user
    const createdCount = createdCoupons?.filter(c => !redeemedIds.has(c.id)).length || 0;

    if (createdCount < 4) {
      toast({
        title: "Not enough coupons given",
        description: `You need to create at least 4 coupons before you can redeem any. You've created ${createdCount} so far. Create ${4 - createdCount} more! 💝`,
        variant: "destructive",
      });
      return false;
    }

    // Check daily redemption limit - use local timezone to determine "today"
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfTodayUTC = startOfToday.toISOString();
    const endOfTodayUTC = endOfToday.toISOString();

    const { data, error } = await supabase
      .from("redeemed_coupons")
      .select("*")
      .eq("redeemed_by", session.user.id)
      .gte("redeemed_at", startOfTodayUTC)
      .lte("redeemed_at", endOfTodayUTC);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    if (data && data.length > 0) {
      toast({
        title: "Already redeemed today",
        description: "You can only redeem one coupon per day. Come back tomorrow! 💕",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleRedeemClick = async () => {
    const canRedeem = await checkCanRedeem();
    if (canRedeem) {
      setShowConfirm(true);
    }
  };

  const handleConfirmRedeem = async () => {
    setRedeeming(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: redemptionData, error } = await supabase
      .from("redeemed_coupons")
      .insert({
        coupon_id: coupon.id,
        redeemed_by: session.user.id,
        reflection_note: reflection || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setRedeeming(false);
      return;
    }

    // Store redemption timestamp for the share card
    if (redemptionData?.redeemed_at) {
      setRedemptionTimestamp(redemptionData.redeemed_at);
    }

    // Keep the coupon for history (don't delete it)

    setShowConfirm(false);

    // Show confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F472B6', '#F9A8D4', '#DDD6FE', '#FDE047'],
    });

    if (coupon.is_surprise) {
      setShowReveal(true);
    } else if (coupon.image_url) {
      // For non-surprise coupons with images, show the image modal
      setShowImageModal(true);
    } else {
      // For text-only coupons, show the share card modal immediately
      setShowShareCard(true);
    }

    setRedeeming(false);
  };

  const handleRevealClose = () => {
    setShowReveal(false);
    // Show the share card modal after closing the reveal dialog
    setShowShareCard(true);
  };

  return (
    <>
      <Card className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-soft hover:shadow-glow transition-all border-2 hover-lift animate-scale-in">
        <div
          className="w-full h-full cursor-pointer"
          onClick={handleRedeemClick}
        >
          {coupon.image_url ? (
            <ProtectedImage
              src={coupon.image_url}
              alt={coupon.title}
              className="w-full h-full object-cover blur-3xl transition-smooth"
              showWatermark={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-peach via-soft-pink to-lavender animate-gradient-slow" />
          )}
        </div>

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 flex flex-col justify-end pointer-events-none"
        >
          {coupon.is_surprise ? (
            <div className="space-y-2 text-center">
              <Sparkles className="w-8 h-8 text-white mx-auto animate-pulse" />
              <p className="text-white font-bold text-lg">Surprise Coupon! 🎁</p>
              <p className="text-white/80 text-sm">Tap to reveal</p>
            </div>
          ) : (
            <>
              <h3 className="text-white font-bold text-xl mb-2">{coupon.title}</h3>
              {coupon.description && (
                <p className="text-white/90 text-sm line-clamp-2">
                  {coupon.description}
                </p>
              )}
              {coupon.image_url && (
                <p className="text-white/80 text-xs mt-2">Tap to redeem</p>
              )}
            </>
          )}
        </div>

        {/* Star/Favorite Button - Top Left */}
        <div className="absolute top-4 left-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(coupon.id);
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-smooth pointer-events-auto hover:scale-110"
            aria-label={isFavorite(coupon.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`w-5 h-5 transition-all ${
                isFavorite(coupon.id)
                  ? "text-yellow-400 fill-yellow-400 animate-pulse"
                  : "text-white"
              }`}
            />
          </button>
        </div>

        {/* Redeem Button - Top Right */}
        <div className="absolute top-4 right-4 flex gap-2">
          {!coupon.image_url && (
            <button
              onClick={handleRedeemClick}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-smooth pointer-events-auto hover:scale-110 animate-glow"
            >
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </button>
          )}
          {coupon.image_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRedeemClick();
              }}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2 hover:bg-white/30 transition-smooth pointer-events-auto hover:scale-105"
            >
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
              <span className="text-white text-sm font-medium">Redeem</span>
            </button>
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <ResponsiveModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Redeem this coupon?"
        description="Remember, you can only redeem one coupon per day!"
        className="rounded-3xl"
      >
        <div className="space-y-4 py-4">
          {!coupon.is_surprise && (
            <div className="space-y-2">
              <h4 className="font-semibold">{coupon.title}</h4>
              {coupon.description && (
                <p className="text-sm text-muted-foreground">{coupon.description}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Add a reflection or memory (optional)
            </label>
            <Textarea
              placeholder="Share your thoughts about this moment..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="rounded-2xl resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setShowConfirm(false)}
            disabled={redeeming}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRedeem}
            disabled={redeeming}
            className="rounded-full"
          >
            {redeeming ? "Redeeming..." : "Redeem Now"}
          </Button>
        </div>
      </ResponsiveModal>

      {/* Surprise Reveal Dialog */}
      <ResponsiveModal
        open={showReveal}
        onOpenChange={handleRevealClose}
        title="Surprise! 🎉"
        className="rounded-3xl max-w-md"
      >
        <div className="space-y-4 py-6 text-center">
          {coupon.image_url && (
            <ProtectedImage
              src={coupon.image_url}
              alt={coupon.title}
              className="w-full rounded-2xl"
              showWatermark={true}
            />
          )}
          <h3 className="text-2xl font-bold text-primary">{coupon.title}</h3>
          {coupon.description && (
            <p className="text-lg">{coupon.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Enjoy your special surprise from your partner! 💕
          </p>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleRevealClose}
            className="w-full rounded-full"
          >
            Close
          </Button>
        </div>
      </ResponsiveModal>

      {/* Image Modal */}
      {coupon.image_url && (
        <ImageModal
          open={showImageModal}
          onOpenChange={(open) => {
            setShowImageModal(open);
            if (!open) {
              // Show the share card modal after closing the image modal
              setShowShareCard(true);
            }
          }}
          imageUrl={coupon.image_url}
          title={coupon.title}
          description={coupon.description || undefined}
          blurLevel="none"
        />
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        open={showShareCard}
        onOpenChange={(open) => {
          setShowShareCard(open);
          if (!open) {
            // Call onRedeemed when share modal is closed
            onRedeemed();
            // Reset reflection and timestamp
            setReflection("");
            setRedemptionTimestamp("");
          }
        }}
        couponData={{
          title: coupon.title,
          description: coupon.description,
          imageUrl: coupon.image_url,
          redeemedAt: redemptionTimestamp || new Date().toISOString(),
          reflectionNote: reflection,
        }}
      />
    </>
  );
};

export default CouponCard;
