import { motion, AnimatePresence } from "framer-motion";
import ResponsiveModal from "@/components/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Milestone } from "@/hooks/useMilestones";
import { Achievement } from "@/hooks/useAchievements";
import { Anniversary } from "@/hooks/useAnniversary";
import { Sparkles, Trophy, Heart, Calendar } from "lucide-react";

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebration: Milestone | Achievement | Anniversary | null;
  type: 'milestone' | 'achievement' | 'anniversary';
}

const CelebrationModal = ({ open, onOpenChange, celebration, type }: CelebrationModalProps) => {
  if (!celebration) return null;

  const getIcon = () => {
    if (type === 'achievement') {
      return (celebration as Achievement).icon;
    }
    return type === 'milestone' ? '🎉' : '🎊';
  };

  const getTitle = () => {
    if (type === 'achievement') {
      return `Achievement Unlocked!`;
    }
    if (type === 'anniversary') {
      return 'Anniversary!';
    }
    return 'Milestone Reached!';
  };

  const getMessage = () => {
    if (type === 'achievement') {
      return (celebration as Achievement).description;
    }
    if (type === 'anniversary') {
      return (celebration as Anniversary).message;
    }
    return (celebration as Milestone).message;
  };

  const getSubtitle = () => {
    if (type === 'achievement') {
      return (celebration as Achievement).title;
    }
    if (type === 'milestone') {
      const milestone = celebration as Milestone;
      return `${milestone.count} ${milestone.type.replace('_', ' ')}!`;
    }
    return '';
  };

  const getIconComponent = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-12 h-12 text-yellow-500" />;
      case 'anniversary':
        return <Calendar className="w-12 h-12 text-pink-500" />;
      default:
        return <Sparkles className="w-12 h-12 text-purple-500" />;
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-md rounded-3xl p-0 overflow-hidden border-0"
      showHeader={false}
    >
      <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-8 text-center overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="mb-4 flex justify-center"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-5xl">{getIcon()}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              {getTitle()}
            </h2>

            {getSubtitle() && (
              <p className="text-xl text-white/90 font-semibold mb-3">
                {getSubtitle()}
              </p>
            )}

            <p className="text-white/90 text-lg leading-relaxed max-w-sm mx-auto">
              {getMessage()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex gap-2 justify-center"
          >
            <Heart className="w-4 h-4 text-white animate-pulse" fill="white" />
            <Heart className="w-4 h-4 text-white animate-pulse" fill="white" style={{ animationDelay: '0.2s' }} />
            <Heart className="w-4 h-4 text-white animate-pulse" fill="white" style={{ animationDelay: '0.4s' }} />
          </motion.div>
        </div>
      </div>

      <div className="p-6 bg-white">
        <Button
          onClick={() => onOpenChange(false)}
          className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6"
        >
          Awesome! ✨
        </Button>
      </div>
    </ResponsiveModal>
  );
};

export default CelebrationModal;
