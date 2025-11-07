import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DISMISSED_REMINDERS_KEY = 'dismissed_redemption_reminders';
const REMINDER_THRESHOLD_DAYS = 7; // Show reminder after 7 days

interface DismissedReminder {
  date: string;
  dismissedAt: number;
}

export const useRedemptionReminder = (userId: string | undefined) => {
  const [daysSinceLastRedemption, setDaysSinceLastRedemption] = useState<number | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      checkLastRedemption();
    }
  }, [userId]);

  const checkLastRedemption = async () => {
    if (!userId) return;

    setLoading(true);

    // Fetch the most recent redemption
    const { data, error } = await supabase
      .from('redeemed_coupons')
      .select('redeemed_at')
      .eq('redeemed_by', userId)
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // No redemptions yet
      setDaysSinceLastRedemption(null);
      setShowReminder(false);
      setLoading(false);
      return;
    }

    const lastRedemptionDate = new Date(data.redeemed_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastRedemptionDate.getTime()) / (1000 * 60 * 60 * 24));

    setDaysSinceLastRedemption(daysDiff);

    // Check if we should show the reminder
    if (daysDiff >= REMINDER_THRESHOLD_DAYS) {
      // Check if this reminder was dismissed
      const lastRedemptionDateStr = lastRedemptionDate.toISOString().split('T')[0];
      const isDismissed = isReminderDismissed(lastRedemptionDateStr);
      setShowReminder(!isDismissed);
    } else {
      setShowReminder(false);
    }

    setLoading(false);
  };

  const isReminderDismissed = (redemptionDate: string): boolean => {
    const stored = localStorage.getItem(DISMISSED_REMINDERS_KEY);
    if (!stored) return false;

    try {
      const dismissed: DismissedReminder[] = JSON.parse(stored);

      // Clean up old dismissed reminders (older than 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const validDismissed = dismissed.filter(d => d.dismissedAt > thirtyDaysAgo);

      if (validDismissed.length !== dismissed.length) {
        localStorage.setItem(DISMISSED_REMINDERS_KEY, JSON.stringify(validDismissed));
      }

      return validDismissed.some(d => d.date === redemptionDate);
    } catch {
      return false;
    }
  };

  const dismissReminder = () => {
    if (!daysSinceLastRedemption) return;

    // Calculate the date of the last redemption
    const now = new Date();
    const lastRedemptionDate = new Date(now.getTime() - daysSinceLastRedemption * 24 * 60 * 60 * 1000);
    const lastRedemptionDateStr = lastRedemptionDate.toISOString().split('T')[0];

    // Store dismissed reminder
    const stored = localStorage.getItem(DISMISSED_REMINDERS_KEY);
    const dismissed: DismissedReminder[] = stored ? JSON.parse(stored) : [];

    dismissed.push({
      date: lastRedemptionDateStr,
      dismissedAt: Date.now(),
    });

    localStorage.setItem(DISMISSED_REMINDERS_KEY, JSON.stringify(dismissed));
    setShowReminder(false);
  };

  return {
    daysSinceLastRedemption,
    showReminder,
    dismissReminder,
    loading,
    checkLastRedemption,
  };
};
