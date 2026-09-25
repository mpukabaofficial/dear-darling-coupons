import type { PostgrestError } from "@supabase/supabase-js";

// Turn database errors from redeeming a coupon into friendly toast copy.
export const describeRedemptionError = (error: PostgrestError) => {
  if (error.message?.includes("daily_redemption_limit")) {
    return {
      title: "Already redeemed today",
      description: "You can only redeem one coupon per day. Come back tomorrow! 💕",
    };
  }
  if (error.code === "23505") {
    return {
      title: "Already redeemed",
      description: "This coupon has already been redeemed. 💝",
    };
  }
  if (error.code === "42501") {
    return {
      title: "Can't redeem this coupon",
      description: "Only the partner a coupon was made for can redeem it.",
    };
  }
  return { title: "Error", description: error.message };
};
