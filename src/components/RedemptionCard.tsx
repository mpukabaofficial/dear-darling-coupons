import { Heart, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface RedemptionCardProps {
  title: string;
  description: string | null;
  imageUrl: string | null;
  redeemedAt: string;
  reflectionNote?: string | null;
}

/**
 * A beautiful, shareable card that represents a redeemed coupon.
 * Designed to feel personal, warm, and worth saving.
 */
const RedemptionCard = ({
  title,
  description,
  imageUrl,
  redeemedAt,
  reflectionNote,
}: RedemptionCardProps) => {
  const redemptionDate = format(new Date(redeemedAt), "MMMM d, yyyy");

  return (
    <div
      id="redemption-card"
      className="w-full max-w-md mx-auto bg-gradient-to-br from-peach via-soft-pink to-lavender rounded-3xl overflow-hidden shadow-soft"
      style={{ width: "400px", minHeight: "533px" }}
    >
      {/* Decorative Header */}
      <div className="relative bg-white/20 backdrop-blur-sm p-6 pb-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8" />

        <div className="relative flex items-center justify-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        <h2 className="text-center text-2xl font-bold text-foreground mb-1">
          {title}
        </h2>

        <p className="text-center text-xs text-muted-foreground">
          Redeemed on {redemptionDate}
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-4">
        {/* Image */}
        {imageUrl && (
          <div className="relative rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm shadow-soft">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto object-cover"
              style={{ maxHeight: "240px" }}
            />
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-sm text-foreground leading-relaxed text-center italic">
              "{description}"
            </p>
          </div>
        )}

        {/* Reflection Note */}
        {reflectionNote && (
          <div className="bg-gradient-to-br from-lavender/50 to-accent/50 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                A reflection
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed italic">
              {reflectionNote}
            </p>
          </div>
        )}

        {/* Footer Decoration */}
        <div className="flex items-center justify-center pt-4 pb-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedemptionCard;
