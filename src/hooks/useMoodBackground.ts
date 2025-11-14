import { useState, useEffect } from 'react';

export type Mood = 'romantic' | 'playful' | 'calm' | 'energetic' | 'cozy' | 'dreamy';

export interface MoodTheme {
  mood: Mood;
  name: string;
  gradient: string;
  icon: string;
  description: string;
}

export const MOOD_THEMES: MoodTheme[] = [
  {
    mood: 'romantic',
    name: 'Romantic',
    gradient: 'from-rose-100 via-pink-100 to-red-100',
    icon: '💕',
    description: 'Soft and loving vibes',
  },
  {
    mood: 'playful',
    name: 'Playful',
    gradient: 'from-yellow-100 via-orange-100 to-pink-100',
    icon: '🎈',
    description: 'Fun and lighthearted',
  },
  {
    mood: 'calm',
    name: 'Calm',
    gradient: 'from-blue-50 via-cyan-50 to-teal-50',
    icon: '🌊',
    description: 'Peaceful and serene',
  },
  {
    mood: 'energetic',
    name: 'Energetic',
    gradient: 'from-orange-100 via-red-100 to-purple-100',
    icon: '⚡',
    description: 'Vibrant and exciting',
  },
  {
    mood: 'cozy',
    name: 'Cozy',
    gradient: 'from-amber-100 via-orange-50 to-yellow-100',
    icon: '🧡',
    description: 'Warm and comfortable',
  },
  {
    mood: 'dreamy',
    name: 'Dreamy',
    gradient: 'from-purple-100 via-pink-100 to-indigo-100',
    icon: '✨',
    description: 'Magical and whimsical',
  },
];

const DEFAULT_MOOD: Mood = 'romantic';

export const useMoodBackground = () => {
  const [currentMood, setCurrentMood] = useState<Mood>(DEFAULT_MOOD);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    loadMoodSettings();
  }, []);

  const loadMoodSettings = () => {
    const storedMood = localStorage.getItem('mood_background');
    const storedEnabled = localStorage.getItem('mood_background_enabled');

    if (storedMood) {
      setCurrentMood(storedMood as Mood);
    }

    if (storedEnabled !== null) {
      setIsEnabled(storedEnabled === 'true');
    }
  };

  const changeMood = (mood: Mood) => {
    setCurrentMood(mood);
    localStorage.setItem('mood_background', mood);
  };

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('mood_background_enabled', String(newEnabled));
  };

  const getCurrentTheme = (): MoodTheme => {
    return MOOD_THEMES.find(theme => theme.mood === currentMood) || MOOD_THEMES[0];
  };

  const getBackgroundClass = (): string => {
    if (!isEnabled) return '';
    const theme = getCurrentTheme();
    return `bg-gradient-to-br ${theme.gradient}`;
  };

  // Auto mood based on time of day
  const setMoodByTime = () => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
      changeMood('energetic'); // Morning
    } else if (hour >= 12 && hour < 17) {
      changeMood('playful'); // Afternoon
    } else if (hour >= 17 && hour < 20) {
      changeMood('cozy'); // Evening
    } else if (hour >= 20 && hour < 23) {
      changeMood('romantic'); // Night
    } else {
      changeMood('dreamy'); // Late night
    }
  };

  // Auto mood based on day of week
  const setMoodByDay = () => {
    const day = new Date().getDay();

    switch (day) {
      case 0: // Sunday
        changeMood('calm');
        break;
      case 1: // Monday
        changeMood('energetic');
        break;
      case 2: // Tuesday
      case 3: // Wednesday
      case 4: // Thursday
        changeMood('playful');
        break;
      case 5: // Friday
        changeMood('romantic');
        break;
      case 6: // Saturday
        changeMood('cozy');
        break;
    }
  };

  return {
    currentMood,
    isEnabled,
    changeMood,
    toggleEnabled,
    getCurrentTheme,
    getBackgroundClass,
    setMoodByTime,
    setMoodByDay,
    themes: MOOD_THEMES,
  };
};
