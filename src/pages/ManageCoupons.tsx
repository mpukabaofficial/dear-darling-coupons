import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean | null;
  created_at: string | null;
}

interface Profile {
  id: string;
  partner_id: string | null;
}

const ManageCoupons = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [createdCoupons, setCreatedCoupons] = useState<Coupon[]>([]);
  const [receivedCoupons, setReceivedCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserAndFetchCoupons();
  }, []);

  const checkUserAndFetchCoupons = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    // Get profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, partner_id")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      // Fetch coupons created by user
      const { data: created } = await supabase
        .from("coupons")
        .select("*")
        .eq("created_by", session.user.id)
        .order("created_at", { ascending: false });

      if (created) {
        setCreatedCoupons(created);
      }

      // Fetch coupons received by user
      const { data: received } = await supabase
        .from("coupons")
        .select("*")
        .eq("for_partner", session.user.id)
        .order("created_at", { ascending: false });

      if (received) {
        setReceivedCoupons(received);
      }
    }

    setLoading(false);
  };

  const deleteCoupon = async (couponId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coupon? This action cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Coupon has been deleted",
    });

    checkUserAndFetchCoupons();
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <h1 className="text-xl font-bold">Manage Coupons</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate("/create-coupon")}
            className="rounded-full shadow-soft flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="created" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="created" className="rounded-full">
              Coupons I Created ({createdCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="rounded-full">
              Coupons I Received ({receivedCoupons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="space-y-4">
            {!profile?.partner_id && (
              <div className="bg-gradient-to-br from-peach to-soft-pink rounded-3xl p-6 shadow-soft">
                <div className="flex items-start gap-4">
                  <Heart className="w-8 h-8 text-primary mt-1" fill="currentColor" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Link with Your Partner</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You need to link with your partner before creating coupons.
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

            {createdCoupons.length === 0 ? (
              <Card className="rounded-3xl shadow-soft">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No coupons created yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Start creating love coupons for your partner!
                  </p>
                  <Button
                    onClick={() => navigate("/create-coupon")}
                    className="rounded-full shadow-soft"
                  >
                    Create Your First Coupon
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdCoupons.map((coupon) => (
                  <Card key={coupon.id} className="rounded-3xl shadow-soft overflow-hidden">
                    {coupon.image_url && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={coupon.image_url}
                          alt={coupon.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {coupon.is_surprise && <span className="text-lg">✨</span>}
                        {coupon.title}
                      </CardTitle>
                      {coupon.description && (
                        <CardDescription>{coupon.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="w-full rounded-full flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Coupon
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {receivedCoupons.length === 0 ? (
              <Card className="rounded-3xl shadow-soft">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No coupons received yet</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Your partner hasn't created any coupons for you yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="bg-gradient-to-br from-lavender to-accent rounded-3xl p-6 shadow-soft mb-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary mb-2">
                      💝 Redemption Requirement
                    </p>
                    <p className="text-2xl font-bold text-primary mb-1">
                      {createdCoupons.length} / 4 coupons created
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {createdCoupons.length < 4
                        ? `Create ${4 - createdCoupons.length} more coupon${4 - createdCoupons.length > 1 ? 's' : ''} before you can redeem any`
                        : "You can now redeem coupons! 🎉"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedCoupons.map((coupon) => (
                    <Card key={coupon.id} className="rounded-3xl shadow-soft overflow-hidden">
                      {coupon.image_url && !coupon.is_surprise && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={coupon.image_url}
                            alt={coupon.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {coupon.is_surprise && <span className="text-lg">✨</span>}
                          {coupon.is_surprise ? "Surprise Coupon!" : coupon.title}
                        </CardTitle>
                        {!coupon.is_surprise && coupon.description && (
                          <CardDescription>{coupon.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => navigate("/home")}
                          className="w-full rounded-full"
                        >
                          Go to Home to Redeem
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ManageCoupons;
