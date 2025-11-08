import { useState } from "react";
import { useDailyRedemptions, DailyRedemption } from "@/hooks/useDailyRedemptions";
import RedemptionDetailModal from "./RedemptionDetailModal";
import { Heart, Sparkles } from "lucide-react";

interface DailyRedemptionBadgesProps {
  userId: string;
}

const DailyRedemptionBadges = ({ userId }: DailyRedemptionBadgesProps) => {
  const { myRedemption, partnerRedemption, loading } = useDailyRedemptions(userId);
  const [selectedRedemption, setSelectedRedemption] = useState<{
    redemption: DailyRedemption;
    isPartner: boolean;
  } | null>(null);

  const handleBadgeClick = (redemption: DailyRedemption | null, isPartner: boolean) => {
    if (redemption) {
      setSelectedRedemption({ redemption, isPartner });
    }
  };

  if (loading) {
    return (
      <div className="w-full animate-fade-in">
        <div className="flex items-center justify-center gap-4 p-6">
          {/* Partner Badge Skeleton */}
          <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />

          {/* My Badge Skeleton */}
          <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full animate-fade-in">
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Today's shared moments
            <Sparkles className="w-4 h-4 text-primary" />
          </h3>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-8 p-4">
          {/* Partner's Badge (Left) */}
          <button
            onClick={() => handleBadgeClick(partnerRedemption, true)}
            disabled={!partnerRedemption}
            className={`
              group relative w-28 h-28 sm:w-32 sm:h-32 rounded-full
              transition-all duration-300 ease-out
              ${
                partnerRedemption
                  ? "bg-gradient-to-br from-lavender to-accent shadow-soft hover:shadow-glow hover:-translate-y-1 cursor-pointer"
                  : "bg-muted/30 border-2 border-dashed border-border/40"
              }
              ${!partnerRedemption && "cursor-default"}
            `}
            aria-label={partnerRedemption ? "View partner's redemption" : "Partner hasn't redeemed today"}
          >
            {/* Active State */}
            {partnerRedemption && (
              <div className="flex flex-col items-center justify-center h-full relative">
                {/* Sparkle effect on hover */}
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <Heart className="w-8 h-8 text-primary fill-primary mb-2 animate-pulse-subtle relative z-10" />
                <span className="text-xs font-medium text-foreground relative z-10">Their moment</span>
                <span className="text-[10px] text-muted-foreground mt-1 relative z-10">
                  {new Date(partnerRedemption.redeemed_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            {/* Inactive State */}
            {!partnerRedemption && (
              <div className="flex flex-col items-center justify-center h-full">
                <Heart className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <span className="text-xs text-muted-foreground/50">Not yet</span>
              </div>
            )}

            {/* Gentle pulse animation when active */}
            {partnerRedemption && (
              <div className="absolute inset-0 rounded-full bg-lavender/20 animate-ping opacity-20" />
            )}
          </button>

          {/* Connection Line */}
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
            <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>

          {/* My Badge (Right) */}
          <button
            onClick={() => handleBadgeClick(myRedemption, false)}
            disabled={!myRedemption}
            className={`
              group relative w-28 h-28 sm:w-32 sm:h-32 rounded-full
              transition-all duration-300 ease-out
              ${
                myRedemption
                  ? "bg-gradient-to-br from-peach to-soft-pink shadow-soft hover:shadow-glow hover:-translate-y-1 cursor-pointer"
                  : "bg-muted/30 border-2 border-dashed border-border/40"
              }
              ${!myRedemption && "cursor-default"}
            `}
            aria-label={myRedemption ? "View your redemption" : "You haven't redeemed today"}
          >
            {/* Active State */}
            {myRedemption && (
              <div className="flex flex-col items-center justify-center h-full relative">
                {/* Sparkle effect on hover */}
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <Heart className="w-8 h-8 text-primary fill-primary mb-2 animate-pulse-subtle relative z-10" />
                <span className="text-xs font-medium text-foreground relative z-10">Your moment</span>
                <span className="text-[10px] text-muted-foreground mt-1 relative z-10">
                  {new Date(myRedemption.redeemed_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            {/* Inactive State */}
            {!myRedemption && (
              <div className="flex flex-col items-center justify-center h-full">
                <Heart className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <span className="text-xs text-muted-foreground/50">Not yet</span>
              </div>
            )}

            {/* Gentle pulse animation when active */}
            {myRedemption && (
              <div className="absolute inset-0 rounded-full bg-peach/20 animate-ping opacity-20" />
            )}
          </button>
        </div>

        {/* Gentle subtitle */}
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground/60 italic">
            {myRedemption && partnerRedemption
              ? "You're both here today ✨"
              : myRedemption || partnerRedemption
              ? "A moment has been shared today"
              : "No moments redeemed yet today"}
          </p>
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
