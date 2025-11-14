import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, RefreshCw } from "lucide-react";
import { getRandomQuote, getQuoteOfTheDay } from "@/data/loveQuotes";
import { Button } from "@/components/ui/button";

interface LoveQuoteProps {
  variant?: 'daily' | 'random';
  className?: string;
}

const LoveQuote = ({ variant = 'daily', className = '' }: LoveQuoteProps) => {
  const [quote, setQuote] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [variant]);

  const loadQuote = () => {
    if (variant === 'daily') {
      setQuote(getQuoteOfTheDay());
    } else {
      setQuote(getRandomQuote());
    }
  };

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Decorative hearts */}
        <div className="absolute top-3 left-3">
          <Heart className="w-4 h-4 text-pink-300 fill-pink-300" />
        </div>
        <div className="absolute bottom-3 right-3">
          <Heart className="w-4 h-4 text-purple-300 fill-purple-300" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <motion.div
            key={quote}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <p className="text-sm text-muted-foreground mb-1 font-medium">
              {variant === 'daily' ? '💕 Quote of the Day' : '💫 Love Quote'}
            </p>
            <motion.p
              className="text-base italic text-foreground leading-relaxed"
              animate={isAnimating ? { opacity: 0 } : { opacity: 1 }}
            >
              "{quote}"
            </motion.p>
          </motion.div>

          {variant === 'random' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8 rounded-full hover:bg-pink-100 flex-shrink-0"
              title="Get new quote"
            >
              <RefreshCw className={`w-4 h-4 text-pink-500 ${isAnimating ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoveQuote;
