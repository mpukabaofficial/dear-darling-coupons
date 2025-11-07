import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  onRemove: () => void;
}

const ImagePreview = ({ src, onRemove }: ImagePreviewProps) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const reset = () => {
    setRotation(0);
    setScale(1);
  };

  return (
    <div className="space-y-3">
      <div className="relative bg-muted rounded-2xl overflow-hidden">
        <div className="h-64 flex items-center justify-center overflow-hidden">
          <img
            src={src}
            alt="Preview"
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
            }}
          />
        </div>

        {/* Remove button */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-full shadow-lg"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Image controls */}
      <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-full p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={rotateLeft}
          className="rounded-full h-8 w-8"
          title="Rotate left"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={rotateRight}
          className="rounded-full h-8 w-8"
          title="Rotate right"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          className="rounded-full h-8 w-8"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground font-medium min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          className="rounded-full h-8 w-8"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="rounded-full h-8 px-3 text-xs"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default ImagePreview;
