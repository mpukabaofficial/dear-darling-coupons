import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Heart, Calendar } from "lucide-react";
import { format } from "date-fns";
import ImageModal from "@/components/ImageModal";
import { HistorySkeleton } from "@/components/HistorySkeleton";
import { useToast } from "@/hooks/use-toast";

interface RedeemedCoupon {
  id: string;
  redeemed_at: string;
  redeemed_by: string;
  reflection_note: string | null;
  coupon: {
    title: string;
    description: string | null;
    image_url: string | null;
    is_surprise: boolean;
    created_by: string;
  };
}

const History = () => {
  const [coupons, setCoupons] = useState<RedeemedCoupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<RedeemedCoupon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    description?: string;
    blurLevel: "harsh" | "mild" | "none";
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = coupons.filter((item) =>
        item.coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reflection_note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoupons(filtered);
    } else {
      setFilteredCoupons(coupons);
    }
  }, [searchTerm, coupons]);

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    const { data } = await supabase
      .from("redeemed_coupons")
      .select(`
        id,
        redeemed_at,
        redeemed_by,
        reflection_note,
        coupons (
          title,
          description,
          image_url,
          is_surprise,
          created_by
        )
      `)
      .order("redeemed_at", { ascending: false });

    if (data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        redeemed_at: item.redeemed_at,
        redeemed_by: item.redeemed_by,
        reflection_note: item.reflection_note,
        coupon: item.coupons,
      }));
      setCoupons(formatted);
      setFilteredCoupons(formatted);
    }

    setLoading(false);
  };

  const handleImageClick = (item: RedeemedCoupon) => {
    if (!item.coupon.image_url) return;

    // Check if within 12-hour viewing window
    const redeemedTime = new Date(item.redeemed_at).getTime();
    const now = new Date().getTime();
    const hoursSinceRedemption = (now - redeemedTime) / (1000 * 60 * 60);

    if (hoursSinceRedemption <= 12) {
      // Within 12 hours - show clear in modal
      setSelectedImage({
        url: item.coupon.image_url,
        title: item.coupon.title,
        description: item.coupon.description || undefined,
        blurLevel: "mild", // Shows "Redeemed" badge but image is clear
      });
    } else {
      // Outside 12-hour window
      toast({
        title: "Viewing window closed",
        description: "This image can only be viewed within 12 hours of redemption. The magic has faded... 💫",
        variant: "destructive",
      });
    }
  };

  if (loading) {
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
            <h1 className="text-xl font-bold">Our Memories</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <HistorySkeleton />
        </main>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Our Memories</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memories..."
            className="pl-12 rounded-full h-12"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 rounded-3xl bg-gradient-to-br from-peach to-soft-pink">
            <p className="text-sm text-muted-foreground mb-1">Total Redeemed</p>
            <p className="text-3xl font-bold text-primary">{coupons.length}</p>
          </Card>
          <Card className="p-6 rounded-3xl bg-gradient-to-br from-lavender to-accent">
            <p className="text-sm text-muted-foreground mb-1">This Month</p>
            <p className="text-3xl font-bold text-primary">
              {coupons.filter((c) => {
                const date = new Date(c.redeemed_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </Card>
        </div>

        {/* History List */}
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? "No memories found" : "No redeemed coupons yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? "Try a different search term" : "Start creating beautiful memories together! 💕"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoupons.map((item) => {
              // Check if within 12-hour viewing window
              const redeemedTime = new Date(item.redeemed_at).getTime();
              const now = new Date().getTime();
              const hoursSinceRedemption = (now - redeemedTime) / (1000 * 60 * 60);
              const canViewImage = hoursSinceRedemption <= 12;

              // Determine who created and who redeemed
              const createdByYou = item.coupon.created_by === currentUserId;
              const redeemedByYou = item.redeemed_by === currentUserId;

              return (
                <Card key={item.id} className="p-6 rounded-3xl hover:shadow-soft transition-all">
                  <div className="flex gap-4">
                    {item.coupon.image_url && (
                      <div className="relative">
                        <img
                          src={item.coupon.image_url}
                          alt={item.coupon.title}
                          className={`w-24 h-24 object-cover rounded-2xl ${
                            canViewImage
                              ? "blur-sm cursor-pointer hover:opacity-80 transition-opacity"
                              : "blur-sm opacity-50"
                          }`}
                          onClick={() => handleImageClick(item)}
                        />
                        {!canViewImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                            <span className="text-xs text-white text-center px-2">Expired</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{item.coupon.title}</h3>
                          {item.coupon.description && (
                            <p className="text-sm text-muted-foreground">
                              {item.coupon.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Created by {createdByYou ? "You" : "Partner"}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              Redeemed by {redeemedByYou ? "You" : "Partner"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.coupon.is_surprise && (
                            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                              Surprise
                            </span>
                          )}
                          {item.coupon.image_url && canViewImage && (
                            <span className="text-xs bg-green-500/10 text-green-600 px-3 py-1 rounded-full">
                              Viewable
                            </span>
                          )}
                        </div>
                      </div>

                      {item.reflection_note && (
                        <div className="bg-muted/50 p-3 rounded-xl">
                          <p className="text-sm italic text-foreground">
                            "{item.reflection_note}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(item.redeemed_at), "MMM d, yyyy 'at' h:mm a")}</span>
                        {item.coupon.image_url && canViewImage && (
                          <span className="text-xs">
                            • {Math.floor(12 - hoursSinceRedemption)}h {Math.floor((12 - hoursSinceRedemption) * 60 % 60)}m remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          open={!!selectedImage}
          onOpenChange={(open) => !open && setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          blurLevel={selectedImage.blurLevel}
          description={selectedImage.description}
        />
      )}
    </div>
  );
};

export default History;
