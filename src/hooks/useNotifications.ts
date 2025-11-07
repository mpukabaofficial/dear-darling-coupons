import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationState {
  lastCheckedCoupons: string;
  lastCheckedRedemptions: string;
  shownExpirationWarnings: string[];
}

const STORAGE_KEY = "coupon_notifications";
const CHECK_INTERVAL = 30000; // Check every 30 seconds

export const useNotifications = (userId: string | undefined) => {
  const { toast } = useToast();
  const [notificationState, setNotificationState] = useState<NotificationState>({
    lastCheckedCoupons: new Date().toISOString(),
    lastCheckedRedemptions: new Date().toISOString(),
    shownExpirationWarnings: [],
  });

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Load notification state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotificationState(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse notification state", e);
      }
    }
  }, []);

  // Save notification state to localStorage
  const updateNotificationState = (updates: Partial<NotificationState>) => {
    const newState = { ...notificationState, ...updates };
    setNotificationState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  // Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  };

  // Check for new coupons from partner
  const checkNewCoupons = async () => {
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", userId)
      .single();

    if (!profile?.partner_id) return;

    const { data: newCoupons } = await supabase
      .from("coupons")
      .select("id, title, is_surprise, created_at")
      .eq("created_by", profile.partner_id)
      .eq("is_redeemed", false)
      .gt("created_at", notificationState.lastCheckedCoupons)
      .order("created_at", { ascending: false });

    if (newCoupons && newCoupons.length > 0) {
      const count = newCoupons.length;
      const message = count === 1
        ? `Your partner created a ${newCoupons[0].is_surprise ? "surprise" : ""} coupon: ${newCoupons[0].is_surprise ? "🎁" : newCoupons[0].title}`
        : `Your partner created ${count} new coupons for you!`;

      showBrowserNotification("New Coupon Available!", message);
      toast({
        title: "New Coupon Available! 💝",
        description: message,
        duration: 5000,
      });

      updateNotificationState({
        lastCheckedCoupons: new Date().toISOString(),
      });
    }
  };

  // Check for redemptions of your coupons
  const checkRedemptions = async () => {
    if (!userId) return;

    const { data: redemptions } = await supabase
      .from("redemptions")
      .select(`
        id,
        redeemed_at,
        reflection,
        coupon:coupons(id, title, created_by)
      `)
      .gt("redeemed_at", notificationState.lastCheckedRedemptions)
      .order("redeemed_at", { ascending: false });

    if (redemptions && redemptions.length > 0) {
      const myRedeemedCoupons = redemptions.filter(
        (r: any) => r.coupon?.created_by === userId
      );

      if (myRedeemedCoupons.length > 0) {
        const count = myRedeemedCoupons.length;
        const message = count === 1
          ? `Your partner redeemed: ${myRedeemedCoupons[0].coupon.title}`
          : `Your partner redeemed ${count} of your coupons!`;

        showBrowserNotification("Coupon Redeemed!", message);
        toast({
          title: "Coupon Redeemed! 🎉",
          description: message,
          duration: 5000,
        });

        updateNotificationState({
          lastCheckedRedemptions: new Date().toISOString(),
        });
      }
    }
  };

  // Check for expiring images (within 2 hours)
  const checkExpiringImages = async () => {
    if (!userId) return;

    const { data: redemptions } = await supabase
      .from("redemptions")
      .select(`
        id,
        redeemed_at,
        redeemed_by,
        coupon:coupons(id, title, image_url)
      `)
      .eq("redeemed_by", userId)
      .not("coupon.image_url", "is", null)
      .order("redeemed_at", { ascending: false });

    if (!redemptions) return;

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    redemptions.forEach((redemption: any) => {
      const redeemedAt = new Date(redemption.redeemed_at);
      const timeRemaining = 12 * 60 * 60 * 1000 - (now.getTime() - redeemedAt.getTime());
      const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));

      // If within 2 hours of expiring and we haven't shown this warning yet
      if (
        redeemedAt > twelveHoursAgo &&
        redeemedAt < twoHoursAgo &&
        !notificationState.shownExpirationWarnings.includes(redemption.id)
      ) {
        const message = hoursRemaining > 0
          ? `Image expires in ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""}: ${redemption.coupon.title}`
          : `Image expires soon: ${redemption.coupon.title}`;

        showBrowserNotification("Image Expiring Soon!", message);
        toast({
          title: "Image Expiring Soon! ⏰",
          description: message,
          duration: 10000,
        });

        updateNotificationState({
          shownExpirationWarnings: [
            ...notificationState.shownExpirationWarnings,
            redemption.id,
          ],
        });
      }
    });
  };

  // Get count of unredeemed coupons
  const getUnredeemedCount = async () => {
    if (!userId) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", userId)
      .single();

    if (!profile?.partner_id) return 0;

    const { count } = await supabase
      .from("coupons")
      .select("*", { count: "exact", head: true })
      .eq("created_by", profile.partner_id)
      .eq("is_redeemed", false);

    return count || 0;
  };

  // Run all checks periodically
  useEffect(() => {
    if (!userId) return;

    // Initial check
    checkNewCoupons();
    checkRedemptions();
    checkExpiringImages();

    // Set up interval
    const interval = setInterval(() => {
      checkNewCoupons();
      checkRedemptions();
      checkExpiringImages();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [userId, notificationState]);

  return {
    getUnredeemedCount,
  };
};
