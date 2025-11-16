import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Calendar, Smile, Settings, List, Gift, ChevronLeft, ChevronRight, Plus, Shuffle, Star, TrendingUp, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CouponGrid from "@/components/CouponGrid";
import MoodCheck from "@/components/MoodCheck";
import RandomCouponPicker from "@/components/RandomCouponPicker";
import CouponCard from "@/components/CouponCard";
import ImageModal from "@/components/ImageModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFavorites } from "@/hooks/useFavorites";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useRedemptionReminder } from "@/hooks/useRedemptionReminder";
import { NotificationBell } from "@/components/NotificationBell";
import DailyRedemptionBadges from "@/components/DailyRedemptionBadges";
import { celebrateRedemption, celebrateWithHearts } from "@/utils/confetti";
import { useMilestones } from "@/hooks/useMilestones";
import { useAchievements } from "@/hooks/useAchievements";
import { useAnniversary } from "@/hooks/useAnniversary";
import CelebrationModal from "@/components/CelebrationModal";
import UserAvatar from "@/components/UserAvatar";

interface Profile {
  id: string;
  email: string;
  partner_id: string | null;
  relationship_start_date: string | null;
  avatar_url: string | null;
}

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean;
  created_by: string;
  for_partner: string;
}

const Home = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysTogeth, setDaysTogether] = useState(0);
  const [unredeemedCount, setUnredeemedCount] = useState(0);
  const [hasRedeemedToday, setHasRedeemedToday] = useState(false);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [favoriteCoupons, setFavoriteCoupons] = useState<Coupon[]>([]);
  const [redeemedCoupon, setRedeemedCoupon] = useState<Coupon | null>(null);
  const [dailyBadgeRefreshTrigger, setDailyBadgeRefreshTrigger] = useState(0);
  const [couponStats, setCouponStats] = useState({
    available: 0,
    redeemed: 0,
    totalCreated: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const { daysSinceLastRedemption, showReminder, dismissReminder, checkLastRedemption } = useRedemptionReminder(profile?.id);

  // Fun additions hooks
  const { celebratingMilestone, dismissMilestone, checkMilestones } = useMilestones(profile?.id);
  const { achievements, newlyUnlocked, dismissNewAchievement, checkAchievements, getUnlockedCount } = useAchievements(profile?.id);
  const { currentAnniversary, dismissAnniversary, checkAnniversaries } = useAnniversary(profile?.id);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enableNavigation: true,
    isModalOpen: showRandomPicker,
    onModalClose: () => setShowRandomPicker(false),
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      // Initial fetch
      fetchUnredeemedCount();

      // Fetch every minute
      const interval = setInterval(fetchUnredeemedCount, 60000);
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  // Update current time every second for live counting
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch favorite coupons when favorites change
  useEffect(() => {
    if (profile?.id && favorites.length > 0) {
      fetchFavoriteCoupons();
    } else {
      setFavoriteCoupons([]);
    }
  }, [favorites, profile?.id]);

  // Fetch coupon stats when profile changes
  useEffect(() => {
    if (profile?.id) {
      fetchCouponStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchCouponStats, 30000);
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  // Show toast when there are unredeemed coupons (but only if user hasn't redeemed today)
  useEffect(() => {
    if (profile?.partner_id && unredeemedCount > 0 && !hasRedeemedToday) {
      toast({
        title: `${unredeemedCount} ${unredeemedCount === 1 ? 'Coupon' : 'Coupons'} Waiting! 🎁`,
        description: `Your partner created ${unredeemedCount === 1 ? 'a special coupon' : 'special coupons'} just for you.`,
      });
    }
  }, [unredeemedCount, profile?.partner_id, hasRedeemedToday]);

  // Check anniversaries on mount
  useEffect(() => {
    if (profile?.id) {
      checkAnniversaries();
    }
  }, [profile?.id]);

  // Fetch available coupons when profile loads
  useEffect(() => {
    if (profile?.id && profile?.partner_id) {
      fetchAvailableCoupons();
    }
  }, [profile?.id, profile?.partner_id]);

  // Check milestones and achievements when stats change
  useEffect(() => {
    if (profile?.id && couponStats.totalCreated > 0) {
      checkMilestones(couponStats.totalCreated, couponStats.redeemed, 0);

      // Fetch more detailed stats for achievements
      fetchDetailedStats();
    }
  }, [profile?.id, couponStats]);

  const fetchDetailedStats = async () => {
    if (!profile?.id) return;

    try {
      const [
        { data: couponsData },
        { data: redemptionsData }
      ] = await Promise.all([
        supabase.from('coupons').select('is_surprise, image_url').eq('created_by', profile.id),
        supabase.from('redeemed_coupons').select('redeemed_at, reflection_note').eq('redeemed_by', profile.id)
      ]);

      const surpriseCoupons = couponsData?.filter(c => c.is_surprise).length || 0;
      const imageCoupons = couponsData?.filter(c => c.image_url).length || 0;
      const reflectionNotes = redemptionsData?.filter(r => r.reflection_note).length || 0;

      checkAchievements({
        couponsCreated: couponStats.totalCreated,
        couponsRedeemed: couponStats.redeemed,
        surpriseCoupons,
        imageCoupons,
        reflectionNotes,
        currentStreak: 0,
        redemptions: redemptionsData?.map(r => ({ redeemed_at: r.redeemed_at })) || [],
      });
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    }
  };

  const fetchUnredeemedCount = async () => {
    if (!profile?.partner_id) {
      setUnredeemedCount(0);
      setHasRedeemedToday(false);
      return;
    }

    // Check if user has redeemed today (using local timezone)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const { data: todayRedemptions } = await supabase
      .from("redeemed_coupons")
      .select("id")
      .eq("redeemed_by", profile.id)
      .gte("redeemed_at", startOfToday.toISOString())
      .lte("redeemed_at", endOfToday.toISOString())
      .limit(1);

    setHasRedeemedToday((todayRedemptions?.length || 0) > 0);

    const { data: coupons } = await supabase
      .from("coupons")
      .select("id")
      .eq("created_by", profile.partner_id)
      .eq("for_partner", profile.id);

    if (coupons) {
      // Filter out redeemed coupons
      const couponIds = coupons.map(c => c.id);

      if (couponIds.length === 0) {
        setUnredeemedCount(0);
        return;
      }

      const { data: redeemed } = await supabase
        .from("redeemed_coupons")
        .select("coupon_id")
        .in("coupon_id", couponIds);

      const redeemedIds = new Set(redeemed?.map(r => r.coupon_id) || []);
      const unredeemed = couponIds.filter(id => !redeemedIds.has(id));
      setUnredeemedCount(unredeemed.length);
    }
  };

  const fetchAvailableCoupons = async () => {
    if (!profile?.id || !profile?.partner_id) return [];

    const { data, error } = await supabase
      .from("coupons")
      .select("id, title, description, image_url, is_surprise, created_by, for_partner")
      .eq("for_partner", profile.id)
      .eq("created_by", profile.partner_id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Filter out redeemed coupons
      const couponIds = data.map(c => c.id);
      
      if (couponIds.length > 0) {
        const { data: redeemed } = await supabase
          .from("redeemed_coupons")
          .select("coupon_id")
          .in("coupon_id", couponIds);

        const redeemedIds = new Set(redeemed?.map(r => r.coupon_id) || []);
        const unredeemed = data.filter(c => !redeemedIds.has(c.id));
        setAvailableCoupons(unredeemed);
        return unredeemed;
      } else {
        setAvailableCoupons([]);
        return [];
      }
    }
    return [];
  };

  const fetchFavoriteCoupons = async () => {
    if (!profile?.id || !profile?.partner_id || favorites.length === 0) return;

    const { data, error } = await supabase
      .from("coupons")
      .select("id, title, description, image_url, is_surprise, created_by, for_partner")
      .eq("for_partner", profile.id)
      .eq("created_by", profile.partner_id)
      .in("id", favorites);

    if (!error && data) {
      // Filter out redeemed coupons
      const couponIds = data.map(c => c.id);
      
      if (couponIds.length > 0) {
        const { data: redeemed } = await supabase
          .from("redeemed_coupons")
          .select("coupon_id")
          .in("coupon_id", couponIds);

        const redeemedIds = new Set(redeemed?.map(r => r.coupon_id) || []);
        const unredeemed = data.filter(c => !redeemedIds.has(c.id));
        
        // Sort by favorites array order to maintain user's preferred order
        const sorted = favorites
          .map((favId) => unredeemed.find((coupon) => coupon.id === favId))
          .filter((coupon): coupon is Coupon => coupon !== undefined);
        setFavoriteCoupons(sorted);
      } else {
        setFavoriteCoupons([]);
      }
    }
  };

  const fetchCouponStats = async () => {
    if (!profile?.id || !profile?.partner_id) return;

    // Fetch available coupons (unredeemed coupons for user from partner)
    const { data: availableCoupons } = await supabase
      .from("coupons")
      .select("id")
      .eq("for_partner", profile.id)
      .eq("created_by", profile.partner_id);

    let availableCount = 0;
    if (availableCoupons) {
      const availableIds = availableCoupons.map(c => c.id);

      if (availableIds.length > 0) {
        const { data: redeemed } = await supabase
          .from("redeemed_coupons")
          .select("coupon_id")
          .in("coupon_id", availableIds);

        const redeemedIds = new Set(redeemed?.map(r => r.coupon_id) || []);
        const unredeemed = availableIds.filter(id => !redeemedIds.has(id));
        availableCount = unredeemed.length;
      }
    }

    // Fetch redeemed coupons (by user)
    const { data: redeemedData } = await supabase
      .from("redeemed_coupons")
      .select("id")
      .eq("redeemed_by", profile.id);

    // Fetch total created coupons (by user)
    const { data: createdData } = await supabase
      .from("coupons")
      .select("id")
      .eq("created_by", profile.id);

    setCouponStats({
      available: availableCount,
      redeemed: redeemedData?.length || 0,
      totalCreated: createdData?.length || 0,
    });
  };

  const handleRandomCouponRedeem = async (coupon: Coupon) => {
    // Check if user can redeem (same validation as CouponCard)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if user has created at least 4 unredeemed coupons
    const { data: createdCoupons, error: createdError } = await supabase
      .from("coupons")
      .select("id")
      .eq("created_by", session.user.id);

    if (createdError) {
      toast({
        title: "Error",
        description: createdError.message,
        variant: "destructive",
      });
      return;
    }

    // Get redeemed coupon IDs
    const { data: redeemedCoupons } = await supabase
      .from("redeemed_coupons")
      .select("coupon_id");

    const redeemedIds = new Set(redeemedCoupons?.map(r => r.coupon_id) || []);

    // Count only unredeemed coupons created by user
    const createdCount = createdCoupons?.filter(c => !redeemedIds.has(c.id)).length || 0;

    if (createdCount < 4) {
      toast({
        title: "Not enough coupons given",
        description: `You need to create at least 4 coupons before you can redeem any. You've created ${createdCount} so far. Create ${4 - createdCount} more! 💝`,
        variant: "destructive",
      });
      return;
    }

    // Check daily redemption limit
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("redeemed_coupons")
      .select("*")
      .eq("redeemed_by", session.user.id)
      .gte("redeemed_at", `${today}T00:00:00`)
      .lte("redeemed_at", `${today}T23:59:59`);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      toast({
        title: "Already redeemed today",
        description: "You can only redeem one coupon per day. Come back tomorrow! 💕",
        variant: "destructive",
      });
      return;
    }

    // Insert into redeemed_coupons table
    const { error: redeemError } = await supabase.from("redeemed_coupons").insert({
      coupon_id: coupon.id,
      redeemed_by: session.user.id,
      reflection_note: null,
    });

    if (redeemError) {
      toast({
        title: "Error",
        description: redeemError.message,
        variant: "destructive",
      });
      return;
    }

    // Show confetti
    celebrateWithHearts();

    // For non-surprise coupons with images, show the image modal
    if (!coupon.is_surprise && coupon.image_url) {
      setRedeemedCoupon(coupon);
    } else {
      toast({
        title: "Coupon Redeemed! 🎉",
        description: coupon.is_surprise
          ? "Your surprise has been revealed!"
          : `You redeemed: ${coupon.title}`,
      });
    }

    // Refresh the coupons and stats
    fetchAvailableCoupons();
    fetchUnredeemedCount();
    fetchCouponStats();
    checkLastRedemption();
  };

  const handleSurpriseMeClick = async () => {
    const coupons = await fetchAvailableCoupons();
    if (!coupons || coupons.length === 0) {
      toast({
        title: "No coupons available",
        description: "There are no unredeemed coupons to surprise you with!",
        variant: "destructive",
      });
      return;
    }
    setShowRandomPicker(true);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      if (profileData.relationship_start_date) {
        const start = new Date(profileData.relationship_start_date);
        const today = new Date();
        const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setDaysTogether(diff);
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getRelationshipStats = () => {
    if (!profile?.relationship_start_date) return null;

    // Parse the date at midnight UTC to avoid timezone issues
    const startDate = new Date(profile.relationship_start_date + 'T00:00:00Z');

    // For live counting of seconds, use current time with full precision
    const totalMsLive = currentTime.getTime() - startDate.getTime();
    const totalSeconds = Math.floor(totalMsLive / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    // For days/weeks/months/years, use midnight to keep values stable throughout the day
    const todayDate = new Date(currentTime);
    todayDate.setHours(0, 0, 0, 0);
    const totalMs = todayDate.getTime() - startDate.getTime();
    const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    // Calculate years, months, days breakdown using proper date arithmetic
    let years = 0;
    let months = 0;
    let days = 0;

    // Create a working date starting from the start date
    let workingDate = new Date(startDate);

    // Calculate full years
    while (true) {
      const nextYear = new Date(workingDate);
      nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);

      if (nextYear <= todayDate) {
        years++;
        workingDate = nextYear;
      } else {
        break;
      }
    }

    // Calculate remaining full months
    while (true) {
      const nextMonth = new Date(workingDate);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

      if (nextMonth <= todayDate) {
        months++;
        workingDate = nextMonth;
      } else {
        break;
      }
    }

    // Calculate remaining days
    days = Math.floor((todayDate.getTime() - workingDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate total months, years, decades, centuries
    const totalMonths = years * 12 + months;
    const totalYears = years;
    const totalDecades = Math.floor(totalYears / 10);
    const totalCenturies = Math.floor(totalYears / 100);

    // Create calendar string
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    const calendarString = parts.join(', ');

    return [
      { label: 'Total Seconds', value: totalSeconds.toLocaleString(), sublabel: 'Seconds' },
      { label: 'Total Minutes', value: totalMinutes.toLocaleString(), sublabel: 'Minutes' },
      { label: 'Total Hours', value: totalHours.toLocaleString(), sublabel: 'Hours' },
      { label: 'Total Days', value: totalDays.toLocaleString(), sublabel: 'Days' },
      { label: 'Total Weeks', value: totalWeeks.toLocaleString(), sublabel: 'Weeks' },
      { label: 'Total Months', value: totalMonths.toLocaleString(), sublabel: totalMonths === 1 ? 'Month' : 'Months' },
      { label: 'Total Years', value: totalYears.toLocaleString(), sublabel: totalYears === 1 ? 'Year' : 'Years' },
      { label: 'Total Decades', value: totalDecades.toLocaleString(), sublabel: totalDecades === 1 ? 'Decade' : 'Decades' },
      { label: 'Total Centuries', value: totalCenturies.toLocaleString(), sublabel: totalCenturies === 1 ? 'Century' : 'Centuries' },
      { label: 'Time Together', value: calendarString, sublabel: 'Total' },
    ];
  };

  const stats = getRelationshipStats();

  const nextStat = () => {
    if (!stats) return;
    setCurrentStatIndex((prev) => (prev + 1) % stats.length);
  };

  const prevStat = () => {
    if (!stats) return;
    setCurrentStatIndex((prev) => (prev - 1 + stats.length) % stats.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart className="w-12 h-12 text-primary animate-bounce" fill="currentColor" />
          <p className="text-muted-foreground">Loading your coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold hidden sm:block">Love Coupons</h1>
              {profile?.partner_id && (
                <div className="flex items-center gap-1 ml-2">
                  <Heart className="w-4 h-4 text-primary animate-pulse" fill="currentColor" />
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <Heart className="w-4 h-4 text-primary animate-pulse" fill="currentColor" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-full"
              aria-label="Settings"
            >
              {profile?.avatar_url ? (
                <UserAvatar avatarUrl={profile.avatar_url} size="sm" showRing={false} />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Partner Link Warning */}
        {!profile?.partner_id && (
          <div className="bg-gradient-to-br from-peach to-soft-pink rounded-3xl p-6 shadow-soft animate-slide-up animate-gradient">
            <div className="flex items-start gap-4">
              <Heart className="w-8 h-8 text-primary mt-1" fill="currentColor" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  Link with Your Partner
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with your partner to start creating and sharing love coupons together!
                </p>
                <Button
                  onClick={() => navigate("/settings")}
                  className="rounded-full shadow-soft"
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Redemption Reminder */}
        {profile?.partner_id && showReminder && daysSinceLastRedemption !== null && (
          <div className="bg-gradient-to-br from-accent to-soft-pink rounded-3xl p-6 shadow-soft relative animate-gradient animate-slide-up">
            <button
              onClick={dismissReminder}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-smooth flex items-center justify-center"
              aria-label="Dismiss reminder"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-start gap-4 pr-8">
              <Clock className="w-8 h-8 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  It's Been {daysSinceLastRedemption} {daysSinceLastRedemption === 1 ? 'Day' : 'Days'} Since Your Last Redemption 🕐
                </h3>
                <p className="text-sm text-muted-foreground">
                  {unredeemedCount > 0 ? (
                    <>You have {unredeemedCount} {unredeemedCount === 1 ? 'coupon' : 'coupons'} waiting! Time to treat yourself to something special.</>
                  ) : (
                    <>How about creating some special moments? Ask your partner for a new coupon!</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Redemption Badges */}
        {profile?.partner_id && profile.id && (
          <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-3 shadow-sm animate-slide-up">
            <DailyRedemptionBadges userId={profile.id} refreshTrigger={dailyBadgeRefreshTrigger} />
          </div>
        )}

        {/* Shared Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
          <div className="bg-gradient-to-br from-peach to-soft-pink p-6 rounded-3xl shadow-soft relative hover-lift animate-gradient">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Days Together</h3>
            </div>
            {stats ? (
              <>
                <div className="absolute top-6 right-6 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevStat}
                    className="h-8 w-8 rounded-full hover:bg-primary/20"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextStat}
                    className="h-8 w-8 rounded-full hover:bg-primary/20"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-4xl font-bold text-primary mb-1">
                  {stats[currentStatIndex].value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats[currentStatIndex].sublabel}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold text-primary">—</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Set your relationship start date in settings
                </p>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-lavender to-accent p-6 rounded-3xl shadow-soft hover-lift animate-gradient">
            <div className="flex items-center gap-3 mb-3">
              <Smile className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Today's Vibe</h3>
            </div>
            <MoodCheck userId={profile?.id || ""} />
          </div>
        </div>

        {/* Quick Access - Favorited Coupons */}
        {favoriteCoupons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
              <h2 className="text-2xl font-bold">Quick Access</h2>
              <span className="text-sm text-muted-foreground">
                ({favoriteCoupons.length} favorite{favoriteCoupons.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onRedeemed={() => {
                    fetchFavoriteCoupons();
                    fetchUnredeemedCount();
                    fetchCouponStats();
                    checkLastRedemption();
                    setDailyBadgeRefreshTrigger(prev => prev + 1);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Coupons Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Coupons</h2>
            <div className="flex gap-2">
              {profile?.partner_id && (
                <Button
                  variant="default"
                  onClick={handleSurpriseMeClick}
                  className="rounded-full shadow-soft flex items-center gap-2 md:px-4 px-3 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-smooth"
                >
                  <Shuffle className="w-4 h-4" />
                  <span className="hidden md:inline">Surprise Me!</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/manage-coupons")}
                className="rounded-full flex items-center gap-2 md:px-4 px-3"
              >
                <List className="w-4 h-4" />
                <span className="hidden md:inline">Manage</span>
              </Button>
              <Button
                onClick={() => navigate("/create-coupon")}
                className="rounded-full shadow-soft flex items-center gap-2 md:px-4 px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Create Coupon for Partner</span>
              </Button>
            </div>
          </div>

          {profile && <CouponGrid userId={profile.id} onRedeemed={() => {
            fetchCouponStats();
            checkLastRedemption();
            setDailyBadgeRefreshTrigger(prev => prev + 1);
          }} />}
        </div>

        {/* Coupon Counter Stats */}
        {profile?.partner_id && (
          <div className="grid grid-cols-3 gap-4 animate-slide-up">
            <div className="bg-gradient-to-br from-peach to-soft-pink p-6 rounded-3xl shadow-soft text-center hover-lift animate-gradient stagger-1">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Available</p>
              </div>
              <p className="text-4xl font-bold text-primary mb-1">
                <AnimatedNumber value={couponStats.available} />
              </p>
              <p className="text-xs text-muted-foreground">Unredeemed</p>
            </div>

            <div className="bg-gradient-to-br from-lavender to-accent p-6 rounded-3xl shadow-soft text-center hover-lift animate-gradient stagger-2">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                <p className="text-sm font-medium text-muted-foreground">Redeemed</p>
              </div>
              <p className="text-4xl font-bold text-primary mb-1">
                <AnimatedNumber value={couponStats.redeemed} />
              </p>
              <p className="text-xs text-muted-foreground">Enjoyed</p>
            </div>

            <div className="bg-gradient-to-br from-soft-pink to-lavender p-6 rounded-3xl shadow-soft text-center hover-lift animate-gradient stagger-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Plus className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Created</p>
              </div>
              <p className="text-4xl font-bold text-primary mb-1">
                <AnimatedNumber value={couponStats.totalCreated} />
              </p>
              <p className="text-xs text-muted-foreground">Total Given</p>
            </div>
          </div>
        )}

        {/* History and Insights Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="rounded-full w-full sm:w-auto"
          >
            View Redeemed History
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/activity-insights")}
            className="rounded-full flex items-center gap-2 w-full sm:w-auto"
          >
            <TrendingUp className="w-4 h-4" />
            Activity Insights
          </Button>
        </div>
      </main>

      {/* Random Coupon Picker Modal */}
      <RandomCouponPicker
        open={showRandomPicker}
        onOpenChange={setShowRandomPicker}
        coupons={availableCoupons}
        onRedeem={handleRandomCouponRedeem}
      />

      {/* Image Modal for Redeemed Coupons */}
      {redeemedCoupon?.image_url && (
        <ImageModal
          open={!!redeemedCoupon}
          onOpenChange={(open) => {
            if (!open) {
              setRedeemedCoupon(null);
            }
          }}
          imageUrl={redeemedCoupon.image_url}
          title={redeemedCoupon.title}
          description={redeemedCoupon.description || undefined}
          blurLevel="none"
        />
      )}

      {/* Milestone Celebration Modal */}
      <CelebrationModal
        open={!!celebratingMilestone}
        onOpenChange={(open) => !open && dismissMilestone()}
        celebration={celebratingMilestone}
        type="milestone"
      />

      {/* Achievement Unlocked Modal */}
      <CelebrationModal
        open={!!newlyUnlocked}
        onOpenChange={(open) => !open && dismissNewAchievement()}
        celebration={newlyUnlocked}
        type="achievement"
      />

      {/* Anniversary Celebration Modal */}
      <CelebrationModal
        open={!!currentAnniversary}
        onOpenChange={(open) => !open && dismissAnniversary()}
        celebration={currentAnniversary}
        type="anniversary"
      />

    </div>
  );
};

export default Home;
