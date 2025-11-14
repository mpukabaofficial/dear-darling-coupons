import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMoodBackground, MOOD_THEMES, Mood } from "@/hooks/useMoodBackground";
import { Palette, X, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const MoodSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentMood, isEnabled, changeMood, toggleEnabled, getCurrentTheme, setMoodByTime, setMoodByDay, themes } = useMoodBackground();

  const handleMoodChange = (mood: Mood) => {
    changeMood(mood);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating mood button */}
      <div className="fixed bottom-32 right-6 z-30">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          size="icon"
        >
          <Palette className="w-5 h-5" />
        </Button>
      </div>

      {/* Mood selector panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-48 right-6 z-50 w-80"
            >
              <Card className="p-4 rounded-3xl shadow-2xl border-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-lg">Mood Background</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Toggle */}
                <div className="mb-4 flex items-center justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm font-medium">Enable Mood Backgrounds</span>
                  <button
                    onClick={toggleEnabled}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isEnabled ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                      animate={{ x: isEnabled ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {isEnabled && (
                  <>
                    {/* Quick actions */}
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMoodByTime();
                          setIsOpen(false);
                        }}
                        className="rounded-full text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        By Time
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMoodByDay();
                          setIsOpen(false);
                        }}
                        className="rounded-full text-xs"
                      >
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        By Day
                      </Button>
                    </div>

                    {/* Current mood */}
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Current Mood</p>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getCurrentTheme().gradient} border-2 border-purple-200`}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCurrentTheme().icon}</span>
                          <div>
                            <p className="font-semibold text-sm">{getCurrentTheme().name}</p>
                            <p className="text-xs text-muted-foreground">{getCurrentTheme().description}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mood grid */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Choose Your Mood</p>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {themes.map((theme) => (
                          <button
                            key={theme.mood}
                            onClick={() => handleMoodChange(theme.mood)}
                            className={`p-3 rounded-xl bg-gradient-to-br ${theme.gradient} border-2 transition-all hover:scale-105 ${
                              currentMood === theme.mood
                                ? 'border-purple-500 shadow-md'
                                : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{theme.icon}</span>
                              <div className="text-left">
                                <p className="font-semibold text-xs">{theme.name}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                  {theme.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MoodSelector;
