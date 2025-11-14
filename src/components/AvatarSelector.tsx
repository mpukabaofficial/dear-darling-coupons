import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarGender, getAvatarsByGender, findAvatarByUrl } from "@/data/avatars";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarSelectorProps {
  /** Currently selected avatar URL (from profile) */
  currentAvatarUrl?: string | null;
  /** Callback when avatar is selected (not yet saved) */
  onAvatarChange: (avatarUrl: string) => void;
  /** Selected avatar URL in the UI (may differ from saved) */
  selectedAvatarUrl?: string;
}

const AvatarSelector = ({
  currentAvatarUrl,
  onAvatarChange,
  selectedAvatarUrl,
}: AvatarSelectorProps) => {
  // Determine initial tab based on current avatar or default to 'female'
  const currentAvatar = currentAvatarUrl ? findAvatarByUrl(currentAvatarUrl) : null;
  const [activeGender, setActiveGender] = useState<AvatarGender>(
    currentAvatar?.gender || 'female'
  );

  const femaleAvatars = getAvatarsByGender('female');
  const maleAvatars = getAvatarsByGender('male');

  const handleAvatarClick = (avatar: Avatar) => {
    onAvatarChange(avatar.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent, avatar: Avatar) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAvatarClick(avatar);
    }
  };

  const renderAvatarGrid = (avatars: Avatar[]) => {
    return (
      <div className="grid grid-cols-5 gap-3">
        {avatars.map((avatar, index) => {
          const isSelected = (selectedAvatarUrl || currentAvatarUrl) === avatar.url;

          return (
            <motion.div
              key={avatar.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => handleAvatarClick(avatar)}
                onKeyDown={(e) => handleKeyDown(e, avatar)}
                className={cn(
                  "relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected
                    ? "ring-4 ring-primary scale-105 shadow-lg"
                    : "ring-2 ring-border hover:ring-primary/50 hover:scale-105"
                )}
                aria-label={`Select ${avatar.label}`}
                aria-pressed={isSelected}
              >
                <img
                  src={avatar.url}
                  alt={avatar.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </motion.div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <Tabs
      value={activeGender}
      onValueChange={(value) => setActiveGender(value as AvatarGender)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-4 rounded-full">
        <TabsTrigger value="female" className="rounded-full">
          <User className="w-4 h-4 mr-2" />
          Female
        </TabsTrigger>
        <TabsTrigger value="male" className="rounded-full">
          <User className="w-4 h-4 mr-2" />
          Male
        </TabsTrigger>
      </TabsList>

      <TabsContent value="female" className="mt-0">
        {renderAvatarGrid(femaleAvatars)}
      </TabsContent>

      <TabsContent value="male" className="mt-0">
        {renderAvatarGrid(maleAvatars)}
      </TabsContent>
    </Tabs>
  );
};

export default AvatarSelector;
