import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, TrendingUp, Calendar, Clock, Flame, Trophy, Star } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface RedeemedCoupon {
  id: string;
  redeemed_at: string;
  redeemed_by: string;
  coupon: {
    title: string;
    is_surprise: boolean;
  };
}

interface DayStats {
  day: string;
  count: number;
}

interface HourStats {
  hour: number;
  count: number;
}

const ActivityInsights = () => {
  const [redemptions, setRedemptions] = useState<RedeemedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const navigate = useNavigate();

  useKeyboardShortcuts({
    enableNavigation: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    // Fetch all redemptions for both users
    const { data, error } = await supabase
      .from("redeemed_coupons")
      .select(`
        id,
        redeemed_at,
        redeemed_by,
        coupon:coupons(title, is_surprise)
      `)
      .order("redeemed_at", { ascending: true });

    if (!error && data) {
      setRedemptions(data as any);
    }

    setLoading(false);
  };

  // Calculate statistics
  const totalRedemptions = redemptions.length;
  const yourRedemptions = redemptions.filter((r) => r.redeemed_by === currentUserId).length;
  const partnerRedemptions = totalRedemptions - yourRedemptions;

  // Day of week analysis
  const dayOfWeekStats: DayStats[] = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ].map((day, index) => ({
    day,
    count: redemptions.filter((r) => new Date(r.redeemed_at).getDay() === index).length,
  }));

  const mostPopularDay = dayOfWeekStats.reduce((prev, current) =>
    current.count > prev.count ? current : prev
  , dayOfWeekStats[0]);

  // Hour of day analysis
  const hourStats: HourStats[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: redemptions.filter((r) => new Date(r.redeemed_at).getHours() === hour).length,
  }));

  const mostActiveHour = hourStats.reduce((prev, current) =>
    current.count > prev.count ? current : prev
  , hourStats[0]);

  // Monthly redemptions (last 6 months)
  const monthlyStats = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const count = redemptions.filter((r) => {
      const redeemedDate = new Date(r.redeemed_at);
      return redeemedDate.getMonth() === date.getMonth() &&
             redeemedDate.getFullYear() === date.getFullYear();
    }).length;
    return { month: monthName, count };
  });

  // Current streak calculation
  const calculateStreak = () => {
    if (redemptions.length === 0) return 0;

    const sortedRedemptions = [...redemptions].sort((a, b) =>
      new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const redemption of sortedRedemptions) {
      const redemptionDate = new Date(redemption.redeemed_at);
      redemptionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - redemptionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate = redemptionDate;
      } else if (daysDiff > streak + 1) {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  // Surprise vs Regular ratio
  const surpriseCoupons = redemptions.filter((r) => r.coupon?.is_surprise).length;
  const regularCoupons = totalRedemptions - surpriseCoupons;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart className="w-12 h-12 text-primary animate-bounce" fill="currentColor" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...dayOfWeekStats.map((s) => s.count), 1);
  const maxMonthly = Math.max(...monthlyStats.map((s) => s.count), 1);
  const maxHourly = Math.max(...hourStats.map((s) => s.count), 1);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Activity Insights</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          <Card className="p-4 rounded-3xl bg-gradient-to-br from-peach to-soft-pink hover-lift animate-gradient stagger-1">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" fill="currentColor" />
              <p className="text-xs font-medium text-muted-foreground">Total</p>
            </div>
            <p className="text-2xl font-bold text-primary">{totalRedemptions}</p>
            <p className="text-xs text-muted-foreground">Redeemed</p>
          </Card>

          <Card className="p-4 rounded-3xl bg-gradient-to-br from-lavender to-accent hover-lift animate-gradient stagger-2">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">You</p>
            </div>
            <p className="text-2xl font-bold text-primary">{yourRedemptions}</p>
            <p className="text-xs text-muted-foreground">Redeemed</p>
          </Card>

          <Card className="p-4 rounded-3xl bg-gradient-to-br from-soft-pink to-lavender hover-lift animate-gradient stagger-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Partner</p>
            </div>
            <p className="text-2xl font-bold text-primary">{partnerRedemptions}</p>
            <p className="text-xs text-muted-foreground">Redeemed</p>
          </Card>

          <Card className="p-4 rounded-3xl bg-gradient-to-br from-accent to-peach hover-lift animate-gradient stagger-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-medium text-muted-foreground">Streak</p>
            </div>
            <p className="text-2xl font-bold text-primary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Days</p>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card className="p-6 rounded-3xl shadow-soft hover-lift animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">6-Month Trend</h2>
          </div>
          <div className="space-y-3">
            {monthlyStats.map((stat) => (
              <div key={stat.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stat.month}</span>
                  <span className="text-muted-foreground">{stat.count} coupons</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-smooth"
                    style={{ width: `${(stat.count / maxMonthly) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Day of Week Analysis */}
        <Card className="p-6 rounded-3xl shadow-soft hover-lift animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Most Popular Days</h2>
          </div>
          <div className="space-y-3">
            {dayOfWeekStats.map((stat) => (
              <div key={stat.day} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stat.day}</span>
                  <span className="text-muted-foreground">{stat.count} coupons</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-lavender to-accent h-2 rounded-full transition-smooth"
                    style={{ width: `${(stat.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {mostPopularDay.count > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              🎉 <strong>{mostPopularDay.day}</strong> is your favorite day to redeem!
            </p>
          )}
        </Card>

        {/* Time of Day Analysis */}
        <Card className="p-6 rounded-3xl shadow-soft hover-lift animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Time Patterns</h2>
          </div>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {hourStats.map((stat) => (
              <div key={stat.hour} className="flex flex-col items-center gap-1">
                <div className="w-full h-20 bg-muted rounded-lg flex items-end overflow-hidden hover:bg-muted/70 transition-smooth">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-accent rounded-t-lg transition-smooth"
                    style={{ height: `${(stat.count / maxHourly) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.hour.toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
          {mostActiveHour.count > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              ⏰ Most active hour: <strong>{mostActiveHour.hour.toString().padStart(2, '0')}:00</strong>
            </p>
          )}
        </Card>

        {/* Coupon Type Analysis */}
        <Card className="p-6 rounded-3xl shadow-soft hover-lift animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Coupon Types</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-peach to-soft-pink rounded-2xl hover-lift animate-gradient">
              <p className="text-3xl font-bold text-primary">{regularCoupons}</p>
              <p className="text-sm text-muted-foreground mt-1">Regular Coupons</p>
              <p className="text-xs text-muted-foreground">
                {totalRedemptions > 0 ? Math.round((regularCoupons / totalRedemptions) * 100) : 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-lavender to-accent rounded-2xl hover-lift animate-gradient">
              <p className="text-3xl font-bold text-primary">{surpriseCoupons}</p>
              <p className="text-sm text-muted-foreground mt-1">Surprise Coupons</p>
              <p className="text-xs text-muted-foreground">
                {totalRedemptions > 0 ? Math.round((surpriseCoupons / totalRedemptions) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>

        {/* Fun Facts */}
        {totalRedemptions > 0 && (
          <Card className="p-6 rounded-3xl shadow-soft bg-gradient-to-br from-peach via-soft-pink to-lavender hover-lift animate-gradient-slow animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
              <h2 className="text-lg font-semibold text-white">Fun Facts</h2>
            </div>
            <div className="space-y-2 text-white/90 text-sm">
              <p>💝 You've created {totalRedemptions} special moments together!</p>
              {currentStreak > 0 && (
                <p>🔥 Keep the streak alive! You're on a {currentStreak}-day roll!</p>
              )}
              {yourRedemptions > partnerRedemptions && (
                <p>🏆 You're ahead in the redemption game!</p>
              )}
              {partnerRedemptions > yourRedemptions && (
                <p>💕 Your partner is leading in redemptions!</p>
              )}
              {yourRedemptions === partnerRedemptions && partnerRedemptions > 0 && (
                <p>🤝 Perfect balance! You're tied in redemptions!</p>
              )}
            </div>
          </Card>
        )}

        {totalRedemptions === 0 && (
          <Card className="p-8 rounded-3xl shadow-soft text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start redeeming coupons to see your relationship insights!
            </p>
            <Button onClick={() => navigate("/home")} className="rounded-full">
              Go to Home
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ActivityInsights;
