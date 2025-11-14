import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { celebrateWithHearts } from '@/utils/confetti';

export interface Milestone {
  id: string;
  type: 'coupon_created' | 'coupon_redeemed' | 'streak' | 'anniversary';
  count: number;
  message: string;
  celebrated: boolean;
}

const MILESTONE_THRESHOLDS = {
  coupon_created: [1, 5, 10, 25, 50, 100, 200, 365, 500, 1000],
  coupon_redeemed: [1, 5, 10, 25, 50, 100, 200, 365, 500, 1000],
  streak: [3, 7, 14, 30, 60, 100, 365],
};

const MILESTONE_MESSAGES = {
  coupon_created: {
    1: "Your first coupon! 🎉 The journey of a thousand moments begins with one.",
    5: "5 coupons created! 🌟 You're building something beautiful!",
    10: "Double digits! 🎊 10 coupons of love!",
    25: "25 coupons! 💝 You're a romance architect!",
    50: "Half a hundred! 🎯 50 moments of joy created!",
    100: "CENTURY! 💯 100 coupons! You're legendary!",
    200: "200 coupons! 🌈 Your love language is strong!",
    365: "A FULL YEAR! 🎂 365 coupons - one for every day!",
    500: "FIVE HUNDRED! 🏆 You're a coupon grandmaster!",
    1000: "ONE THOUSAND! 👑 Ultimate coupon royalty!",
  },
  coupon_redeemed: {
    1: "First redemption! 💕 The magic begins!",
    5: "5 moments lived! ✨ Creating memories together!",
    10: "10 redemptions! 🎉 Making moments count!",
    25: "25 shared experiences! 💫 The love is real!",
    50: "50 beautiful moments! 🌸 Half a hundred memories!",
    100: "CENTURY OF LOVE! 💯 100 moments shared!",
    200: "200 redemptions! 🌟 You two are unstoppable!",
    365: "A YEAR OF MOMENTS! 🎊 365 days of love!",
    500: "500 MOMENTS! 🎆 Legendary love story!",
    1000: "1000 MEMORIES! 👑 Absolute relationship goals!",
  },
  streak: {
    3: "3-day streak! 🔥 The fire starts!",
    7: "Week streak! 🌟 7 days strong!",
    14: "Two weeks! 💪 Consistency is key!",
    30: "MONTH STREAK! 🎯 30 days of daily love!",
    60: "TWO MONTHS! 🌈 60 days and counting!",
    100: "HUNDRED DAY STREAK! 💯 Unstoppable!",
    365: "YEAR STREAK! 👑 365 consecutive days!",
  },
};

export const useMilestones = (userId: string | undefined) => {
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);

  const checkMilestones = async (
    totalCreated: number,
    totalRedeemed: number,
    currentStreak: number
  ) => {
    if (!userId) return;

    // Check created coupons milestone
    const createdMilestone = MILESTONE_THRESHOLDS.coupon_created.find(
      threshold => threshold === totalCreated
    );

    if (createdMilestone) {
      const milestone: Milestone = {
        id: `created_${createdMilestone}`,
        type: 'coupon_created',
        count: createdMilestone,
        message: MILESTONE_MESSAGES.coupon_created[createdMilestone as keyof typeof MILESTONE_MESSAGES.coupon_created],
        celebrated: false,
      };

      // Check if already celebrated
      const celebrated = await isMilestoneCelebrated(milestone.id);
      if (!celebrated) {
        celebrateMilestone(milestone);
      }
    }

    // Check redeemed coupons milestone
    const redeemedMilestone = MILESTONE_THRESHOLDS.coupon_redeemed.find(
      threshold => threshold === totalRedeemed
    );

    if (redeemedMilestone) {
      const milestone: Milestone = {
        id: `redeemed_${redeemedMilestone}`,
        type: 'coupon_redeemed',
        count: redeemedMilestone,
        message: MILESTONE_MESSAGES.coupon_redeemed[redeemedMilestone as keyof typeof MILESTONE_MESSAGES.coupon_redeemed],
        celebrated: false,
      };

      const celebrated = await isMilestoneCelebrated(milestone.id);
      if (!celebrated) {
        celebrateMilestone(milestone);
      }
    }

    // Check streak milestone
    const streakMilestone = MILESTONE_THRESHOLDS.streak.find(
      threshold => threshold === currentStreak
    );

    if (streakMilestone) {
      const milestone: Milestone = {
        id: `streak_${streakMilestone}`,
        type: 'streak',
        count: streakMilestone,
        message: MILESTONE_MESSAGES.streak[streakMilestone as keyof typeof MILESTONE_MESSAGES.streak],
        celebrated: false,
      };

      const celebrated = await isMilestoneCelebrated(milestone.id);
      if (!celebrated) {
        celebrateMilestone(milestone);
      }
    }
  };

  const isMilestoneCelebrated = async (milestoneId: string): Promise<boolean> => {
    const key = `milestone_${milestoneId}`;
    return localStorage.getItem(key) === 'true';
  };

  const celebrateMilestone = (milestone: Milestone) => {
    // Show confetti
    celebrateWithHearts();

    // Set celebrating state
    setCelebratingMilestone(milestone);

    // Mark as celebrated
    localStorage.setItem(`milestone_${milestone.id}`, 'true');
  };

  const dismissMilestone = () => {
    setCelebratingMilestone(null);
  };

  return {
    celebratingMilestone,
    dismissMilestone,
    checkMilestones,
  };
};
