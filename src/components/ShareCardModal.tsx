import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RedemptionCard from "./RedemptionCard";
import { Heart, Download, Share2, Copy, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  shareRedemptionCard,
  canShareFiles,
  canUseWebShare,
} from "@/utils/shareCard";

interface ShareCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  couponData: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    redeemedAt: string;
    reflectionNote?: string | null;
  };
}

const ShareCardModal = ({
  open,
  onOpenChange,
  couponData,
}: ShareCardModalProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async (method: 'auto' | 'download' | 'share' | 'clipboard') => {
    setIsSharing(true);

    try {
      const result = await shareRedemptionCard(
        'redemption-card',
        couponData.title,
        {
          method,
          text: `I just enjoyed this special moment: ${couponData.title} 💕`,
          filename: `${couponData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`,
        }
      );

      // Show success message
      if (result.method === 'native-share') {
        // Don't show toast for native share (it's obvious)
        onOpenChange(false);
      } else if (result.method === 'download') {
        toast({
          title: "Card saved! 📥",
          description: "Your memory card has been downloaded. Share it with your partner!",
        });
        onOpenChange(false);
      } else if (result.method === 'clipboard') {
        toast({
          title: "Copied to clipboard! 📋",
          description: "Paste the card into any messaging app.",
        });
      }
    } catch (error) {
      // Only show error if it's not a user cancellation
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Couldn't share",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const supportsMobileShare = canShareFiles();
  const supportsWebShare = canUseWebShare();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-0 shadow-soft">
        {/* Header */}
        <div className="bg-gradient-to-br from-peach via-soft-pink to-lavender p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary animate-pulse-subtle" />
              <Heart className="w-6 h-6 text-primary fill-primary animate-pulse-subtle" />
              <Sparkles className="w-5 h-5 text-primary animate-pulse-subtle" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              A Moment to Share
            </h2>

            <p className="text-sm text-muted-foreground">
              Send this memory card to your partner
            </p>
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="transform scale-95 hover:scale-100 transition-transform duration-300">
            <RedemptionCard {...couponData} />
          </div>
        </div>

        {/* Share Actions */}
        <div className="p-6 pt-0 space-y-3">
          {/* Primary Action: Mobile Share or Download */}
          {supportsMobileShare ? (
            <Button
              onClick={() => handleShare('share')}
              disabled={isSharing}
              className="w-full rounded-full shadow-soft bg-gradient-to-r from-primary to-primary/80 hover:shadow-glow text-white font-semibold py-6"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5 mr-2" />
                  Send to Partner
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleShare('download')}
              disabled={isSharing}
              className="w-full rounded-full shadow-soft bg-gradient-to-r from-primary to-primary/80 hover:shadow-glow text-white font-semibold py-6"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Save & Share
                </>
              )}
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            {/* Download (if mobile share is primary) */}
            {supportsMobileShare && (
              <Button
                onClick={() => handleShare('download')}
                disabled={isSharing}
                variant="outline"
                className="rounded-full border-2 border-border/50 hover:border-primary/50 hover:bg-soft-pink/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}

            {/* Copy to Clipboard */}
            <Button
              onClick={() => handleShare('clipboard')}
              disabled={isSharing}
              variant="outline"
              className="rounded-full border-2 border-border/50 hover:border-primary/50 hover:bg-soft-pink/30"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>

            {/* Web Share (if available but not file share) */}
            {supportsWebShare && !supportsMobileShare && (
              <Button
                onClick={() => handleShare('share')}
                disabled={isSharing}
                variant="outline"
                className="rounded-full border-2 border-border/50 hover:border-primary/50 hover:bg-soft-pink/30"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>

          {/* Maybe Later */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full rounded-full text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </Button>

          {/* Helpful hint */}
          <p className="text-xs text-muted-foreground/60 text-center italic pt-2">
            This card is just between you two — no branding, just your moment 💕
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCardModal;
