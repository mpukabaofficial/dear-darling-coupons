import { useState } from "react";
import ResponsiveModal from "@/components/ResponsiveModal";
import { DailyRedemption } from "@/hooks/useDailyRedemptions";
import { Heart, Sparkles, Clock, Eye, EyeOff, Image as ImageIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import ProtectedImage from "@/components/ProtectedImage";
import { Button } from "@/components/ui/button";

interface RedemptionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redemption: DailyRedemption | null;
  isPartner?: boolean;
}

const RedemptionDetailModal = ({
  open,
  onOpenChange,
  redemption,
  isPartner = false,
}: RedemptionDetailModalProps) => {
  const [viewMode, setViewMode] = useState<"image" | "details">("image");

  if (!redemption) return null;

  const coupon = redemption.coupon;
  const redemptionTime = format(new Date(redemption.redeemed_at), "h:mm a");

  // Check if image is viewable (within 12 hours of redemption)
  const redeemedTime = new Date(redemption.redeemed_at).getTime();
  const now = new Date().getTime();
  const hoursSinceRedemption = (now - redeemedTime) / (1000 * 60 * 60);
  const canViewImage = hoursSinceRedemption <= 12;
  const hasImage = coupon?.image_url;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-soft"
      showHeader={false}
    >
      {/* Toggle Button - Only show if image exists */}
      {hasImage && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setViewMode(viewMode === "image" ? "details" : "image")}
            className="rounded-full shadow-lg bg-white/90 hover:bg-white backdrop-blur-sm"
          >
            {viewMode === "image" ? (
              <>
                <FileText className="w-4 h-4 mr-1.5" />
                Details
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-1.5" />
                Image
              </>
            )}
          </Button>
        </div>
      )}

        {/* Image-Only View */}
        {viewMode === "image" && hasImage && (
          <div className="relative">
            {canViewImage ? (
              <>
                <ProtectedImage
                  src={coupon.image_url!}
                  alt={coupon.title}
                  className="w-full h-auto object-cover"
                  style={{ minHeight: "400px", maxHeight: "600px" }}
                  showWatermark={true}
                />
                {/* Title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-12">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-white fill-white animate-pulse-subtle" />
                    <span className="text-xs font-medium text-white/90">
                      {isPartner ? "Their moment today" : "Your moment today"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {coupon?.title || "Redeemed Coupon"}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <Clock className="w-3 h-3" />
                    <span>Redeemed at {redemptionTime}</span>
                  </div>
                </div>
                {/* Viewable badge */}
                <div className="absolute top-4 left-4 bg-green-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                  <Eye className="w-3 h-3" />
                  <span>Viewable</span>
                </div>
              </>
            ) : (
              <div className="relative min-h-[400px] flex items-center justify-center">
                <img
                  src={coupon.image_url!}
                  alt={coupon.title}
                  className="absolute inset-0 w-full h-full object-cover blur-lg opacity-30"
                />
                <div className="relative z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-12 rounded-2xl mx-6">
                  <EyeOff className="w-12 h-12 text-white/80 mb-4" />
                  <p className="text-white text-lg font-medium mb-2">Image no longer viewable</p>
                  <p className="text-white/70 text-sm text-center">Viewing window expired</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details View or Fallback when no image */}
        {(viewMode === "details" || !hasImage) && (
          <>
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-peach via-soft-pink to-lavender p-6 pb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-primary fill-primary animate-pulse-subtle" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {isPartner ? "Their moment today" : "Your moment today"}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {coupon?.title || "Redeemed Coupon"}
                </h2>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Redeemed at {redemptionTime}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Image Section */}
              {hasImage && (
                <div className="relative rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm shadow-soft">
                  {canViewImage ? (
                    <>
                      <ProtectedImage
                        src={coupon.image_url!}
                        alt={coupon.title}
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: "300px" }}
                        showWatermark={true}
                      />
                      <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                        <Eye className="w-3 h-3" />
                        <span>Viewable</span>
                      </div>
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={coupon.image_url!}
                        alt={coupon.title}
                        className="w-full h-auto object-cover blur-md opacity-50"
                        style={{ maxHeight: "300px" }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <EyeOff className="w-8 h-8 text-white/80 mb-2" />
                        <p className="text-white text-sm font-medium">Image no longer viewable</p>
                        <p className="text-white/70 text-xs mt-1">Viewing window expired</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon Description */}
              {coupon?.description && (
                <div className="bg-gradient-to-br from-lavender to-accent rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">What it was</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {coupon.description}
                  </p>
                </div>
              )}

              {/* Reflection Note */}
              {redemption.reflection_note && (
                <div className="bg-gradient-to-br from-peach to-soft-pink rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">How it felt</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{redemption.reflection_note}"
                  </p>
                </div>
              )}

              {/* Empty state for no reflection */}
              {!redemption.reflection_note && (
                <div className="bg-muted/50 rounded-2xl p-4 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground text-center italic">
                    No reflection was written for this moment
                  </p>
                </div>
              )}
            </div>

            {/* Footer decoration */}
            <div className="h-2 bg-gradient-to-r from-peach via-soft-pink to-lavender" />
          </>
        )}
    </ResponsiveModal>
  );
};

export default RedemptionDetailModal;
