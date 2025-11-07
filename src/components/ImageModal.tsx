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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full rounded-3xl p-0 overflow-hidden flex flex-col">
        <div className="relative flex-shrink-0 max-h-[60vh] overflow-y-auto">
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-auto object-contain ${getBlurClass()}`}
          />
          {getBlurMessage()}
        </div>
        <div className="p-6 flex-shrink-0 overflow-y-auto max-h-[25vh]">
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
