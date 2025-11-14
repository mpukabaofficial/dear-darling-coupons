import { useState, useEffect } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'creator' | 'redeemer' | 'streak' | 'special';
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Creator achievements
  {
    id: 'first_coupon',
    title: 'First Step',
    description: 'Created your first coupon',
    icon: '🌟',
    category: 'creator',
  },
  {
    id: 'creative_mind',
    title: 'Creative Mind',
    description: 'Created 10 coupons',
    icon: '🎨',
    category: 'creator',
  },
  {
    id: 'coupon_master',
    title: 'Coupon Master',
    description: 'Created 50 coupons',
    icon: '🏆',
    category: 'creator',
  },
  {
    id: 'legendary_creator',
    title: 'Legendary Creator',
    description: 'Created 100 coupons',
    icon: '👑',
    category: 'creator',
  },
  {
    id: 'surprise_specialist',
    title: 'Surprise Specialist',
    description: 'Created 10 surprise coupons',
    icon: '🎁',
    category: 'creator',
  },
  {
    id: 'photographer',
    title: 'Photographer',
    description: 'Created 10 image coupons',
    icon: '📸',
    category: 'creator',
  },

  // Redeemer achievements
  {
    id: 'first_redemption',
    title: 'First Taste',
    description: 'Redeemed your first coupon',
    icon: '💕',
    category: 'redeemer',
  },
  {
    id: 'memory_maker',
    title: 'Memory Maker',
    description: 'Redeemed 10 coupons',
    icon: '✨',
    category: 'redeemer',
  },
  {
    id: 'moment_master',
    title: 'Moment Master',
    description: 'Redeemed 50 coupons',
    icon: '🌟',
    category: 'redeemer',
  },
  {
    id: 'legendary_redeemer',
    title: 'Legendary Redeemer',
    description: 'Redeemed 100 coupons',
    icon: '💎',
    category: 'redeemer',
  },
  {
    id: 'reflective_soul',
    title: 'Reflective Soul',
    description: 'Added reflection notes to 10 redemptions',
    icon: '💭',
    category: 'redeemer',
  },

  // Streak achievements
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Maintained a 3-day streak',
    icon: '🔥',
    category: 'streak',
  },
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Maintained a 7-day streak',
    icon: '⚡',
    category: 'streak',
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Maintained a 30-day streak',
    icon: '💪',
    category: 'streak',
  },
  {
    id: 'legendary_streak',
    title: 'Legendary Streak',
    description: 'Maintained a 100-day streak',
    icon: '🏅',
    category: 'streak',
  },

  // Special achievements
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Redeemed a coupon before 8 AM',
    icon: '🌅',
    category: 'special',
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Redeemed a coupon after 10 PM',
    icon: '🌙',
    category: 'special',
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Redeemed coupons on 10 weekends',
    icon: '🎉',
    category: 'special',
  },
  {
    id: 'midweek_magic',
    title: 'Midweek Magic',
    description: 'Redeemed coupons on 10 Wednesdays',
    icon: '🪄',
    category: 'special',
  },
  {
    id: 'monthly_consistent',
    title: 'Monthly Consistent',
    description: 'Redeemed at least one coupon every month for 3 months',
    icon: '📅',
    category: 'special',
  },
  {
    id: 'love_scholar',
    title: 'Love Scholar',
    description: 'Visited Activity Insights 10 times',
    icon: '📊',
    category: 'special',
  },
];

export const useAchievements = (userId: string | undefined) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId]);

  const loadAchievements = () => {
    const stored = localStorage.getItem(`achievements_${userId}`);

    if (stored) {
      try {
        const unlockedIds: Record<string, string> = JSON.parse(stored);
        const loadedAchievements = ACHIEVEMENTS.map(achievement => ({
          ...achievement,
          unlocked: !!unlockedIds[achievement.id],
          unlockedAt: unlockedIds[achievement.id] ? new Date(unlockedIds[achievement.id]) : undefined,
        }));
        setAchievements(loadedAchievements);
      } catch {
        initializeAchievements();
      }
    } else {
      initializeAchievements();
    }
  };

  const initializeAchievements = () => {
    const initialAchievements = ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: false,
    }));
    setAchievements(initialAchievements);
  };

  const unlockAchievement = (achievementId: string) => {
    if (!userId) return;

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    const now = new Date();
    const updatedAchievements = achievements.map(a =>
      a.id === achievementId
        ? { ...a, unlocked: true, unlockedAt: now }
        : a
    );

    setAchievements(updatedAchievements);
    setNewlyUnlocked(updatedAchievements.find(a => a.id === achievementId)!);

    // Save to localStorage
    const stored = localStorage.getItem(`achievements_${userId}`);
    const unlockedIds: Record<string, string> = stored ? JSON.parse(stored) : {};
    unlockedIds[achievementId] = now.toISOString();
    localStorage.setItem(`achievements_${userId}`, JSON.stringify(unlockedIds));
  };

  const checkAchievements = (stats: {
    couponsCreated: number;
    couponsRedeemed: number;
    surpriseCoupons: number;
    imageCoupons: number;
    reflectionNotes: number;
    currentStreak: number;
    redemptions: Array<{ redeemed_at: string }>;
  }) => {
    // Creator achievements
    if (stats.couponsCreated >= 1) unlockAchievement('first_coupon');
    if (stats.couponsCreated >= 10) unlockAchievement('creative_mind');
    if (stats.couponsCreated >= 50) unlockAchievement('coupon_master');
    if (stats.couponsCreated >= 100) unlockAchievement('legendary_creator');
    if (stats.surpriseCoupons >= 10) unlockAchievement('surprise_specialist');
    if (stats.imageCoupons >= 10) unlockAchievement('photographer');

    // Redeemer achievements
    if (stats.couponsRedeemed >= 1) unlockAchievement('first_redemption');
    if (stats.couponsRedeemed >= 10) unlockAchievement('memory_maker');
    if (stats.couponsRedeemed >= 50) unlockAchievement('moment_master');
    if (stats.couponsRedeemed >= 100) unlockAchievement('legendary_redeemer');
    if (stats.reflectionNotes >= 10) unlockAchievement('reflective_soul');

    // Streak achievements
    if (stats.currentStreak >= 3) unlockAchievement('consistent');
    if (stats.currentStreak >= 7) unlockAchievement('dedicated');
    if (stats.currentStreak >= 30) unlockAchievement('unstoppable');
    if (stats.currentStreak >= 100) unlockAchievement('legendary_streak');

    // Special time-based achievements
    stats.redemptions.forEach(redemption => {
      const hour = new Date(redemption.redeemed_at).getHours();
      if (hour < 8) unlockAchievement('early_bird');
      if (hour >= 22) unlockAchievement('night_owl');
    });

    // Weekend warrior
    const weekendRedemptions = stats.redemptions.filter(r => {
      const day = new Date(r.redeemed_at).getDay();
      return day === 0 || day === 6;
    });
    if (weekendRedemptions.length >= 10) unlockAchievement('weekend_warrior');

    // Midweek magic
    const wednesdayRedemptions = stats.redemptions.filter(r => {
      const day = new Date(r.redeemed_at).getDay();
      return day === 3;
    });
    if (wednesdayRedemptions.length >= 10) unlockAchievement('midweek_magic');
  };

  const dismissNewAchievement = () => {
    setNewlyUnlocked(null);
  };

  const getUnlockedCount = () => achievements.filter(a => a.unlocked).length;
  const getTotalCount = () => achievements.length;
  const getProgress = () => (getUnlockedCount() / getTotalCount()) * 100;

  return {
    achievements,
    newlyUnlocked,
    dismissNewAchievement,
    checkAchievements,
    getUnlockedCount,
    getTotalCount,
    getProgress,
  };
};
