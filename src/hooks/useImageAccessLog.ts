import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useImageAccessLog = (couponId: string, accessType: "view" | "download_attempt" | "suspicious") => {
  useEffect(() => {
    const logAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        await supabase.from("image_access_logs").insert({
          coupon_id: couponId,
          accessed_by: session.user.id,
          access_type: accessType,
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        console.error("Failed to log image access:", error);
      }
    };

    logAccess();
  }, [couponId, accessType]);
};

// Detect screenshot attempts (not foolproof but provides some monitoring)
export const useScreenshotDetection = (onScreenshotDetected: () => void) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page lost focus - might indicate screenshot
        onScreenshotDetected();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      const isScreenshotShortcut =
        // Windows: Win + Shift + S, Print Screen
        (e.key === "PrintScreen") ||
        (e.metaKey && e.shiftKey && e.key === "s") ||
        // Mac: Cmd + Shift + 3, 4, 5
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key));

      if (isScreenshotShortcut) {
        onScreenshotDetected();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScreenshotDetected]);
};
