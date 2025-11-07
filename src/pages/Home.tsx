import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Calendar, Smile, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CouponGrid from "@/components/CouponGrid";
import MoodCheck from "@/components/MoodCheck";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

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
            <h1 className="text-xl font-bold">Love Coupons</h1>
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

        {/* Shared Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-peach to-soft-pink p-6 rounded-3xl shadow-soft">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Days Together</h3>
            </div>
            <p className="text-4xl font-bold text-primary">
              {profile?.relationship_start_date ? daysTogeth : "—"}
            </p>
            {!profile?.relationship_start_date && (
              <p className="text-sm text-muted-foreground mt-2">
                Set your relationship start date in settings
              </p>
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
            <Button
              onClick={() => navigate("/create-coupon")}
              className="rounded-full shadow-soft"
            >
              Create Coupon for Partner
            </Button>
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
