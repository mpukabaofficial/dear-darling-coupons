import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Calendar, Smile, Settings, List, Gift, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CouponGrid from "@/components/CouponGrid";
import MoodCheck from "@/components/MoodCheck";
import { useNotifications } from "@/hooks/useNotifications";

interface Profile {
  id: string;
  email: string;
  partner_id: string | null;
  relationship_start_date: string | null;
}

const Home = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysTogeth, setDaysTogether] = useState(0);
  const [unredeemedCount, setUnredeemedCount] = useState(0);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getUnredeemedCount } = useNotifications(profile?.id);

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

  const fetchUnredeemedCount = async () => {
    const count = await getUnredeemedCount();
    setUnredeemedCount(count);
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
              <h1 className="text-xl font-bold">Love Coupons</h1>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
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
          <div className="bg-gradient-to-br from-peach to-soft-pink rounded-3xl p-6 shadow-soft">
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

        {/* Unredeemed Coupons Alert */}
        {profile?.partner_id && unredeemedCount > 0 && (
          <div className="bg-gradient-to-br from-lavender to-accent rounded-3xl p-6 shadow-soft animate-pulse-subtle">
            <div className="flex items-start gap-4">
              <Gift className="w-8 h-8 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {unredeemedCount} {unredeemedCount === 1 ? 'Coupon' : 'Coupons'} Waiting for You! 🎁
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your partner created {unredeemedCount === 1 ? 'a special coupon' : 'special coupons'} just for you.
                  Scroll down to redeem {unredeemedCount === 1 ? 'it' : 'them'}!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shared Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-peach to-soft-pink p-6 rounded-3xl shadow-soft relative">
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

          <div className="bg-gradient-to-br from-lavender to-accent p-6 rounded-3xl shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <Smile className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Today's Vibe</h3>
            </div>
            <MoodCheck userId={profile?.id || ""} />
          </div>
        </div>

        {/* Coupons Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Coupons</h2>
            <div className="flex gap-2">
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

          {profile && <CouponGrid userId={profile.id} />}
        </div>

        {/* History Link */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="rounded-full"
          >
            View Redeemed History
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Home;
