import { useState, useEffect } from "react";
import { useDailyRedemptions, DailyRedemption } from "@/hooks/useDailyRedemptions";
import { usepartnerProfile } from "@/hooks/usePartnerProfile";
import RedemptionDetailModal from "./RedemptionDetailModal";
import UserAvatar from "./UserAvatar";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailyRedemptionBadgesProps {
  userId: string;
  refreshTrigger?: number;
}

const DailyRedemptionBadges = ({ userId, refreshTrigger }: DailyRedemptionBadgesProps) => {
  const { myRedemption, partnerRedemption, loading, refresh } = useDailyRedemptions(userId);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<{
    redemption: DailyRedemption;
    isPartner: boolean;
  } | null>(null);

  // Fetch partner ID
  useEffect(() => {
    const fetchPartnerId = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', userId)
        .single();

      if (data?.partner_id) {
        setPartnerId(data.partner_id);
      }
    };

    fetchPartnerId();
  }, [userId]);

  const { myProfile, partnerProfile, myMood, partnerMood } = usepartnerProfile(userId, partnerId);

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
      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-3 shadow-sm animate-slide-up">
        <div className="w-auto mx-auto animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="w-24 h-4 rounded bg-muted animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          </div>
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
      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-3 shadow-sm animate-slide-up">
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
                  ? "shadow-sm hover:shadow-md hover:scale-110 cursor-pointer"
                  : "bg-muted/20 border border-dashed border-border/30 cursor-default opacity-50"
              }
            `}
            title={partnerRedemption ? "View partner's redemption" : "Partner hasn't redeemed today"}
          >
            {partnerProfile?.avatar_url ? (
              <div className="relative">
                <UserAvatar
                  avatarUrl={partnerProfile.avatar_url}
                  size="sm"
                  className="w-12 h-12"
                  showRing={!!partnerRedemption}
                />
                {/* Mood emoji overlay */}
                {partnerMood && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs shadow-sm">
                    {partnerMood.emoji}
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full w-full rounded-full ${
                partnerRedemption ? 'bg-gradient-to-br from-lavender to-accent' : ''
              }`}>
                <Heart className={`w-5 h-5 ${partnerRedemption ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
              </div>
            )}
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
                  ? "shadow-sm hover:shadow-md hover:scale-110 cursor-pointer"
                  : "bg-muted/20 border border-dashed border-border/30 cursor-default opacity-50"
              }
            `}
            title={myRedemption ? "View your redemption" : "You haven't redeemed today"}
          >
            {myProfile?.avatar_url ? (
              <div className="relative">
                <UserAvatar
                  avatarUrl={myProfile.avatar_url}
                  size="sm"
                  className="w-12 h-12"
                  showRing={!!myRedemption}
                />
                {/* Mood emoji overlay */}
                {myMood && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs shadow-sm">
                    {myMood.emoji}
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full w-full rounded-full ${
                myRedemption ? 'bg-gradient-to-br from-peach to-soft-pink' : ''
              }`}>
                <Heart className={`w-5 h-5 ${myRedemption ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
              </div>
            )}
          </button>
        </div>
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
