import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Achievement } from "@/hooks/useAchievements";
import { Lock, Trophy } from "lucide-react";

interface AchievementsListProps {
  achievements: Achievement[];
  compact?: boolean;
}

const AchievementsList = ({ achievements, compact = false }: AchievementsListProps) => {
  const categories = [
    { id: 'creator', name: 'Creator', color: 'from-blue-500 to-cyan-500' },
    { id: 'redeemer', name: 'Redeemer', color: 'from-purple-500 to-pink-500' },
    { id: 'streak', name: 'Streak', color: 'from-orange-500 to-red-500' },
    { id: 'special', name: 'Special', color: 'from-yellow-500 to-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryAchievements = achievements.filter(
          (a) => a.category === category.id
        );

        const unlockedCount = categoryAchievements.filter((a) => a.unlocked).length;

        return (
          <div key={category.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Trophy className={`w-4 h-4 bg-gradient-to-r ${category.color} text-transparent bg-clip-text`} />
                {category.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {unlockedCount}/{categoryAchievements.length}
              </span>
            </div>

            <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
              {categoryAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`p-4 rounded-2xl transition-all ${
                      achievement.unlocked
                        ? `bg-gradient-to-br ${category.color} text-white shadow-md hover:shadow-lg`
                        : 'bg-muted/50 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div
                        className={`text-3xl ${
                          achievement.unlocked ? '' : 'grayscale opacity-50'
                        }`}
                      >
                        {achievement.unlocked ? (
                          achievement.icon
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-semibold text-xs mb-1 ${
                            achievement.unlocked ? 'text-white' : 'text-foreground'
                          }`}
                        >
                          {achievement.title}
                        </p>
                        <p
                          className={`text-[10px] line-clamp-2 ${
                            achievement.unlocked ? 'text-white/80' : 'text-muted-foreground'
                          }`}
                        >
                          {achievement.description}
                        </p>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-[9px] text-white/60 mt-1">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsList;
