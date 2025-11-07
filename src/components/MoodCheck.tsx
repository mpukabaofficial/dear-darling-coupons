import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const moods = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😍", label: "Loving", value: "loving" },
  { emoji: "🥰", label: "Grateful", value: "grateful" },
  { emoji: "😌", label: "Peaceful", value: "peaceful" },
  { emoji: "🤗", label: "Excited", value: "excited" },
];

interface MoodCheckProps {
  userId: string;
}

const MoodCheck = ({ userId }: MoodCheckProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkTodayMood();
  }, [userId]);

  const checkTodayMood = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from("mood_checks")
      .select("*")
      .eq("user_id", userId)
      .eq("check_date", today)
      .single();

    if (data) {
      setSelectedMood(data.mood);
    }
  };

  const handleMoodSelect = async (moodValue: string) => {
    if (loading) return;
    
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from("mood_checks")
      .upsert(
        {
          user_id: userId,
          mood: moodValue,
          check_date: today,
        },
        {
          onConflict: "user_id,check_date",
        }
      );

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSelectedMood(moodValue);
      toast({
        title: "Mood updated!",
        description: "Your vibe has been saved for today",
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => handleMoodSelect(mood.value)}
          disabled={loading}
          className={`
            w-12 h-12 rounded-full text-2xl transition-all
            ${selectedMood === mood.value
              ? "bg-primary text-white scale-110 shadow-glow"
              : "bg-white hover:scale-105 hover:shadow-soft"
            }
          `}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
};

export default MoodCheck;
