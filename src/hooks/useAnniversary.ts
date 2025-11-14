import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Anniversary {
  type: 'relationship' | 'app' | 'monthly';
  date: Date;
  years?: number;
  months?: number;
  message: string;
}

export const useAnniversary = (userId: string | undefined) => {
  const [currentAnniversary, setCurrentAnniversary] = useState<Anniversary | null>(null);

  useEffect(() => {
    if (userId) {
      checkAnniversaries();
    }
  }, [userId]);

  const checkAnniversaries = async () => {
    if (!userId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already celebrated today
    const lastCelebrated = localStorage.getItem(`anniversary_last_${userId}`);
    if (lastCelebrated) {
      const lastDate = new Date(lastCelebrated);
      lastDate.setHours(0, 0, 0, 0);
      if (lastDate.getTime() === today.getTime()) {
        return; // Already celebrated today
      }
    }

    // Check app anniversary (first coupon created)
    const { data: firstCoupon } = await supabase
      .from('coupons')
      .select('created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (firstCoupon) {
      const firstCouponDate = new Date(firstCoupon.created_at);
      const monthsSince = getMonthsDifference(firstCouponDate, today);
      const yearsSince = Math.floor(monthsSince / 12);

      // Check yearly anniversary
      if (
        yearsSince > 0 &&
        today.getDate() === firstCouponDate.getDate() &&
        today.getMonth() === firstCouponDate.getMonth()
      ) {
        const anniversary: Anniversary = {
          type: 'app',
          date: firstCouponDate,
          years: yearsSince,
          message: `🎉 ${yearsSince} year${yearsSince > 1 ? 's' : ''} of creating beautiful moments together!`,
        };
        celebrateAnniversary(anniversary);
        return;
      }

      // Check monthly anniversary (multiples of 3 months before first year)
      if (
        yearsSince === 0 &&
        monthsSince > 0 &&
        monthsSince % 3 === 0 &&
        today.getDate() === firstCouponDate.getDate()
      ) {
        const anniversary: Anniversary = {
          type: 'monthly',
          date: firstCouponDate,
          months: monthsSince,
          message: `💕 ${monthsSince} months of love coupons! Keep the magic alive!`,
        };
        celebrateAnniversary(anniversary);
        return;
      }
    }
  };

  const getMonthsDifference = (start: Date, end: Date): number => {
    return (
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth())
    );
  };

  const celebrateAnniversary = (anniversary: Anniversary) => {
    setCurrentAnniversary(anniversary);
    localStorage.setItem(`anniversary_last_${userId}`, new Date().toISOString());
  };

  const dismissAnniversary = () => {
    setCurrentAnniversary(null);
  };

  return {
    currentAnniversary,
    dismissAnniversary,
    checkAnniversaries,
  };
};
