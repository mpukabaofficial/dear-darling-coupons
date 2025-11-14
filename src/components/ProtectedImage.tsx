import { useEffect, useState } from "react";

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  style?: React.CSSProperties;
}

const ProtectedImage = ({
  src,
  alt,
  className = "",
  showWatermark = true,
  watermarkText,
  style,
}: ProtectedImageProps) => {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Get user email for watermark
    const fetchUserEmail = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    fetchUserEmail();
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent long-press on mobile
    if (e.pointerType === "touch") {
      e.preventDefault();
    }
  };

  const displayWatermark = watermarkText || userEmail || "Protected";

  return (
    <div 
      className="relative select-none overflow-hidden"
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      <img
        src={src}
        alt={alt}
        className={`${className} pointer-events-none`}
        style={{
          ...style,
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onPointerDown={handlePointerDown}
        draggable={false}
      />
      
      {/* Invisible overlay to prevent screenshot tools from easily capturing */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: "transparent",
          mixBlendMode: "normal",
        }}
      />

      {/* Watermark overlay */}
      {showWatermark && (
        <>
          {/* Center watermark */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-20"
            style={{ 
              fontSize: "2rem",
              fontWeight: "bold",
              color: "white",
              textShadow: "0 0 8px rgba(0,0,0,0.5)",
              transform: "translate(-50%, -50%) rotate(-45deg)",
              whiteSpace: "nowrap",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {displayWatermark}
          </div>

          {/* Corner watermarks for screenshots */}
          <div 
            className="absolute bottom-2 right-2 pointer-events-none select-none opacity-30 text-xs"
            style={{ 
              color: "white",
              textShadow: "0 0 4px rgba(0,0,0,0.8)",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {displayWatermark}
          </div>

          <div 
            className="absolute top-2 left-2 pointer-events-none select-none opacity-30 text-xs"
            style={{ 
              color: "white",
              textShadow: "0 0 4px rgba(0,0,0,0.8)",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {displayWatermark}
          </div>
        </>
      )}
    </div>
  );
};

export default ProtectedImage;
