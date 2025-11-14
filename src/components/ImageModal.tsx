import { useState, useEffect } from "react";
import ResponsiveModal from "@/components/ResponsiveModal";
import { Eye, EyeOff } from "lucide-react";
import ProtectedImage from "./ProtectedImage";
import { supabase } from "@/integrations/supabase/client";
import { useScreenshotDetection } from "@/hooks/useImageAccessLog";

interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  blurLevel: "harsh" | "mild" | "none";
  description?: string;
}

const ImageModal = ({
  open,
  onOpenChange,
  imageUrl,
  title,
  blurLevel,
  description,
}: ImageModalProps) => {
  const [isDescriptionLocked, setIsDescriptionLocked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Log suspicious activity when screenshot is detected
  useScreenshotDetection(async () => {
    if (open) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from("image_access_logs").insert({
            coupon_id: null, // We don't have coupon_id in ImageModal context
            accessed_by: session.user.id,
            access_type: "suspicious",
            user_agent: navigator.userAgent,
          });
        }
      } catch (error) {
        console.error("Failed to log suspicious activity:", error);
      }
    }
  });

  // Log image view when modal opens
  useEffect(() => {
    if (open) {
      const logView = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.from("image_access_logs").insert({
              coupon_id: null,
              accessed_by: session.user.id,
              access_type: "view",
              user_agent: navigator.userAgent,
            });
          }
        } catch (error) {
          console.error("Failed to log image view:", error);
        }
      };
      logView();
    }
  }, [open]);

  // Modal images are never blurred - only the overlay changes
  const getBlurClass = () => {
    return ""; // Always return empty - no blur on modal images
  };

  const getBlurMessage = () => {
    switch (blurLevel) {
      case "harsh":
        return (
          <div className="absolute top-4 right-4 bg-rose-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <EyeOff className="w-4 h-4" />
              <span>Not Yet Redeemed</span>
            </div>
          </div>
        );
      case "mild":
        return (
          <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Eye className="w-4 h-4" />
              <span>Redeemed ✨</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const showDescription = isHovering || isDescriptionLocked;

  const handleClick = () => {
    setIsDescriptionLocked(!isDescriptionLocked);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-3xl p-0 overflow-hidden border-0"
      showHeader={false}
    >
      <div
        className="relative w-auto h-auto cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
        <ProtectedImage
          src={imageUrl}
          alt={title}
          className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain block"
          showWatermark={true}
        />
        {getBlurMessage()}

        {/* Description overlay - appears on hover or when locked */}
        {description && showDescription && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-6 pt-12">
            <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Title only (no description) */}
        {!description && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-6 pt-12">
            <h3 className="text-white font-bold text-xl">{title}</h3>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default ImageModal;
