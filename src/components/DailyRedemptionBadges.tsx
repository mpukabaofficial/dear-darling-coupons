import { useState, useEffect } from "react";
import { useDailyRedemptions, DailyRedemption } from "@/hooks/useDailyRedemptions";
import RedemptionDetailModal from "./RedemptionDetailModal";
import { Heart, Sparkles } from "lucide-react";

interface DailyRedemptionBadgesProps {
  userId: string;
  refreshTrigger?: number;
}

const DailyRedemptionBadges = ({ userId, refreshTrigger }: DailyRedemptionBadgesProps) => {
  const { myRedemption, partnerRedemption, loading, refresh } = useDailyRedemptions(userId);
  const [selectedRedemption, setSelectedRedemption] = useState<{
    redemption: DailyRedemption;
    isPartner: boolean;
  } | null>(null);

  // Refresh when refreshTrigger changes (e.g., after a redemption)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refresh();
    }
  }, [refreshTrigger]);

  const handleBadgeClick = (redemption: DailyRedemption | null, isPartner: boolean) => {
    if (redemption) {
      setSelectedRedemption({ redemption, isPartner });
    }
  };

  if (loading) {
    return (
      <div className="w-auto mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <div className="w-24 h-4 rounded bg-muted animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  // Hide the entire component if there are no redemptions for today
  if (!myRedemption && !partnerRedemption) {
    return null;
  }

  return (
    <>
      <div className="w-auto mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          {/* Partner's Badge (Left) */}
          <button
            onClick={() => handleBadgeClick(partnerRedemption, true)}
            disabled={!partnerRedemption}
            className={`
              group relative w-12 h-12 rounded-full
              transition-all duration-200 ease-out
              ${
                partnerRedemption
                  ? "bg-gradient-to-br from-lavender to-accent shadow-sm hover:shadow-md hover:scale-110 cursor-pointer"
                  : "bg-muted/20 border border-dashed border-border/30 cursor-default opacity-50"
              }
            `}
            title={partnerRedemption ? "View partner's redemption" : "Partner hasn't redeemed today"}
          >
            <div className="flex items-center justify-center h-full">
              <Heart className={`w-5 h-5 ${partnerRedemption ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
            </div>
          </button>

          <span className="text-xs text-muted-foreground/60">Today's moments</span>

          {/* My Badge (Right) */}
          <button
            onClick={() => handleBadgeClick(myRedemption, false)}
            disabled={!myRedemption}
            className={`
              group relative w-12 h-12 rounded-full
              transition-all duration-200 ease-out
              ${
                myRedemption
                  ? "bg-gradient-to-br from-peach to-soft-pink shadow-sm hover:shadow-md hover:scale-110 cursor-pointer"
                  : "bg-muted/20 border border-dashed border-border/30 cursor-default opacity-50"
              }
            `}
            title={myRedemption ? "View your redemption" : "You haven't redeemed today"}
          >
            <div className="flex items-center justify-center h-full">
              <Heart className={`w-5 h-5 ${myRedemption ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Modal for viewing redemption details */}
      <RedemptionDetailModal
        open={selectedRedemption !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRedemption(null);
        }}
        redemption={selectedRedemption?.redemption || null}
        isPartner={selectedRedemption?.isPartner || false}
      />
    </>
  );
};

export default DailyRedemptionBadges;
