import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyRedemption {
  id: string;
  coupon_id: string;
  redeemed_by: string;
  reflection_note: string | null;
  redeemed_at: string;
  coupon?: {
    id: string;
    title: string;
    description: string;
    is_surprise: boolean;
  };
}

export interface DailyRedemptionsData {
  myRedemption: DailyRedemption | null;
  partnerRedemption: DailyRedemption | null;
  loading: boolean;
  error: string | null;
}

export const useDailyRedemptions = (userId: string | undefined) => {
  const [data, setData] = useState<DailyRedemptionsData>({
    myRedemption: null,
    partnerRedemption: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (userId) {
      fetchDailyRedemptions();
    }
  }, [userId]);

  const fetchDailyRedemptions = async () => {
    if (!userId) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get current user's profile to find partner
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get start and end of today in USER'S LOCAL TIMEZONE, then convert to UTC for database
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const startOfTodayUTC = startOfToday.toISOString();
      const endOfTodayUTC = endOfToday.toISOString();

      console.log('Querying redemptions between:', startOfTodayUTC, 'and', endOfTodayUTC);

      // Fetch today's redemption for current user (today in local timezone)
      const { data: myRedemptionData, error: myError } = await supabase
        .from('redeemed_coupons')
        .select(`
          id,
          coupon_id,
          redeemed_by,
          reflection_note,
          redeemed_at,
          coupons:coupon_id (
            id,
            title,
            description,
            is_surprise
          )
        `)
        .eq('redeemed_by', userId)
        .gte('redeemed_at', startOfTodayUTC)
        .lte('redeemed_at', endOfTodayUTC)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('My redemption data:', myRedemptionData, 'Error:', myError);

      if (myError && myError.code !== 'PGRST116') throw myError;

      // Fetch today's redemption for partner (if they have one)
      let partnerRedemptionData = null;
      if (profile?.partner_id) {
        const { data: partnerData, error: partnerError } = await supabase
          .from('redeemed_coupons')
          .select(`
            id,
            coupon_id,
            redeemed_by,
            reflection_note,
            redeemed_at,
            coupons:coupon_id (
              id,
              title,
              description,
              is_surprise
            )
          `)
          .eq('redeemed_by', profile.partner_id)
          .gte('redeemed_at', startOfTodayUTC)
          .lte('redeemed_at', endOfTodayUTC)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Partner redemption data:', partnerData, 'Error:', partnerError);

        if (partnerError && partnerError.code !== 'PGRST116') throw partnerError;
        partnerRedemptionData = partnerData;
      }

      // Transform data to match our interface
      const transformRedemption = (redemption: any): DailyRedemption | null => {
        if (!redemption) return null;

        return {
          id: redemption.id,
          coupon_id: redemption.coupon_id,
          redeemed_by: redemption.redeemed_by,
          reflection_note: redemption.reflection_note,
          redeemed_at: redemption.redeemed_at,
          coupon: Array.isArray(redemption.coupons)
            ? redemption.coupons[0]
            : redemption.coupons,
        };
      };

      setData({
        myRedemption: transformRedemption(myRedemptionData),
        partnerRedemption: transformRedemption(partnerRedemptionData),
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching daily redemptions:', error);
      setData({
        myRedemption: null,
        partnerRedemption: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch redemptions',
      });
    }
  };

  const refresh = () => {
    fetchDailyRedemptions();
  };

  return {
    ...data,
    refresh,
  };
};
