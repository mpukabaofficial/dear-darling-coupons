import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";

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
  const getBlurClass = () => {
    switch (blurLevel) {
      case "harsh":
        return "blur-3xl";
      case "mild":
        return "blur-sm";
      case "none":
        return "";
      default:
        return "";
    }
  };

  const getBlurMessage = () => {
    switch (blurLevel) {
      case "harsh":
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-center space-y-3 p-6 bg-black/70 rounded-3xl backdrop-blur-sm">
              <EyeOff className="w-16 h-16 text-white mx-auto" />
              <p className="text-white font-bold text-xl">Not Yet Redeemed</p>
              <p className="text-white/80 text-sm">
                Redeem this coupon to reveal the surprise! 🎁
              </p>
            </div>
          </div>
        );
      case "mild":
        return (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="flex items-center gap-2 text-white text-sm">
              <Eye className="w-4 h-4" />
              <span>Redeemed - Slightly blurred for the magic ✨</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-auto ${getBlurClass()}`}
          />
          {getBlurMessage()}
        </div>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-base pt-2">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
