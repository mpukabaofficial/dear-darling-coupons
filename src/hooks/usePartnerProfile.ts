import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerProfile {
  id: string;
  avatar_url: string | null;
  email: string;
}

export interface MoodData {
  mood: string;
  emoji: string;
}

export const usepartnerProfile = (userId: string | undefined, partnerId: string | null | undefined) => {
  const [myProfile, setMyProfile] = useState<PartnerProfile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [myMood, setMyMood] = useState<MoodData | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);

  const moodEmojis: Record<string, string> = {
    happy: "😊",
    loving: "😍",
    grateful: "🥰",
    peaceful: "😌",
    excited: "🤗",
  };

  useEffect(() => {
    if (userId) {
      fetchProfiles();
    }
  }, [userId, partnerId]);

  const fetchProfiles = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // Fetch my profile
      const { data: myProfileData } = await supabase
        .from('profiles')
        .select('id, avatar_url, email')
        .eq('id', userId)
        .single();

      setMyProfile(myProfileData);

      // Fetch partner profile if partnerId exists
      if (partnerId) {
        const { data: partnerProfileData } = await supabase
          .from('profiles')
          .select('id, avatar_url, email')
          .eq('id', partnerId)
          .single();

        setPartnerProfile(partnerProfileData);
      }

      // Fetch today's mood for both
      const today = new Date().toISOString().split('T')[0];

      // My mood
      const { data: myMoodData } = await supabase
        .from('mood_checks')
        .select('mood')
        .eq('user_id', userId)
        .eq('check_date', today)
        .maybeSingle();

      if (myMoodData) {
        setMyMood({
          mood: myMoodData.mood,
          emoji: moodEmojis[myMoodData.mood] || "😊",
        });
      } else {
        setMyMood(null);
      }

      // Partner mood
      if (partnerId) {
        const { data: partnerMoodData } = await supabase
          .from('mood_checks')
          .select('mood')
          .eq('user_id', partnerId)
          .eq('check_date', today)
          .maybeSingle();

        if (partnerMoodData) {
          setPartnerMood({
            mood: partnerMoodData.mood,
            emoji: moodEmojis[partnerMoodData.mood] || "😊",
          });
        } else {
          setPartnerMood(null);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchProfiles();
  };

  return {
    myProfile,
    partnerProfile,
    myMood,
    partnerMood,
    loading,
    refresh,
  };
};
