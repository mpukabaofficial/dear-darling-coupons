import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DailyRedemption } from "@/hooks/useDailyRedemptions";
import { Heart, Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";

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
  if (!redemption) return null;

  const coupon = redemption.coupon;
  const redemptionTime = format(new Date(redemption.redeemed_at), "h:mm a");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-soft">
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
      </DialogContent>
    </Dialog>
  );
};

export default RedemptionDetailModal;
