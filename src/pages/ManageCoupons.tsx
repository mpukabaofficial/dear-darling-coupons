import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, ArrowLeft, Trash2, Plus, Sparkles, Edit, RotateCcw, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageModal from "@/components/ImageModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import ProtectedImage from "@/components/ProtectedImage";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean;
  created_at: string;
}

interface RedeemedCoupon {
  id: string;
  coupon_id: string;
  redeemed_at: string;
  redeemed_by: string;
  reflection_note: string | null;
  coupons: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    is_surprise: boolean;
    created_at: string;
  };
}

interface Profile {
  id: string;
  partner_id: string | null;
}

const ManageCoupons = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [createdCoupons, setCreatedCoupons] = useState<Coupon[]>([]);
  const [redeemedCoupons, setRedeemedCoupons] = useState<RedeemedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    description?: string;
  } | null>(null);
  const [showReverseConfirm, setShowReverseConfirm] = useState(false);
  const [redemptionToReverse, setRedemptionToReverse] = useState<RedeemedCoupon | null>(null);
  const [reversing, setReversing] = useState(false);
  const [showDeleteRedeemedConfirm, setShowDeleteRedeemedConfirm] = useState(false);
  const [redemptionToDelete, setRedemptionToDelete] = useState<RedeemedCoupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { scheduleDelete, undoDelete, isPendingDelete, getExpiredDeletes } = useSoftDelete();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enableNavigation: true,
    isModalOpen: selectedImage !== null,
    onModalClose: () => setSelectedImage(null),
  });

  useEffect(() => {
    checkUserAndFetchCoupons();
  }, []);

  // Check for and process expired deletes
  useEffect(() => {
    const interval = setInterval(() => {
      const expired = getExpiredDeletes();
      if (expired.length > 0) {
        // Actually delete from database
        expired.forEach(async (item) => {
          await supabase.from("coupons").delete().eq("id", item.id);
        });
        // Refresh the coupon list
        checkUserAndFetchCoupons();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getExpiredDeletes]);

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

      // Fetch redeemed coupons created by user
      const { data: redeemed } = await supabase
        .from("redeemed_coupons")
        .select(`
          id,
          coupon_id,
          redeemed_at,
          redeemed_by,
          reflection_note,
          coupons:coupon_id (
            id,
            title,
            description,
            image_url,
            is_surprise,
            created_at
          )
        `)
        .eq("coupons.created_by", session.user.id)
        .order("redeemed_at", { ascending: false });

      if (redeemed) {
        // Filter out any redeemed coupons where the coupon data is null
        const validRedeemed = redeemed.filter((r: any) => r.coupons !== null);
        setRedeemedCoupons(validRedeemed as RedeemedCoupon[]);
      }
    }

    setLoading(false);
  };

  const deleteCoupon = async (couponId: string) => {
    // Schedule the delete
    scheduleDelete(couponId);

    toast({
      title: "Coupon scheduled for deletion",
      description: "This coupon will be permanently deleted in 30 seconds.",
      duration: 30000,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            undoDelete(couponId);
            toast({
              title: "Deletion cancelled",
              description: "Your coupon has been restored.",
            });
          }}
        >
          Undo
        </Button>
      ),
    });
  };

  const deleteImage = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ image_url: null })
        .eq("id", couponId);

      if (error) throw error;

      toast({
        title: "Image removed",
        description: "The image has been removed from this coupon. The coupon text remains.",
      });

      // Refresh coupons
      await checkUserAndFetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error removing image",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReverseRedemptionClick = (redeemed: RedeemedCoupon) => {
    setRedemptionToReverse(redeemed);
    setShowReverseConfirm(true);
  };

  const confirmReverseRedemption = async () => {
    if (!redemptionToReverse) return;

    setReversing(true);

    const { error } = await supabase
      .from("redeemed_coupons")
      .delete()
      .eq("id", redemptionToReverse.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setReversing(false);
      return;
    }

    toast({
      title: "Redemption reversed! ✨",
      description: "The coupon is now available for redemption again.",
    });

    // Refresh the coupons
    await checkUserAndFetchCoupons();

    setShowReverseConfirm(false);
    setRedemptionToReverse(null);
    setReversing(false);
  };

  const handleDeleteRedeemedClick = (redeemed: RedeemedCoupon) => {
    setRedemptionToDelete(redeemed);
    setShowDeleteRedeemedConfirm(true);
  };

  const confirmDeleteRedeemed = async () => {
    if (!redemptionToDelete) return;

    setDeleting(true);

    // First delete the redemption record
    const { error: redemptionError } = await supabase
      .from("redeemed_coupons")
      .delete()
      .eq("id", redemptionToDelete.id);

    if (redemptionError) {
      toast({
        title: "Error",
        description: redemptionError.message,
        variant: "destructive",
      });
      setDeleting(false);
      return;
    }

    // Then delete the coupon itself
    const { error: couponError } = await supabase
      .from("coupons")
      .delete()
      .eq("id", redemptionToDelete.coupon_id);

    if (couponError) {
      toast({
        title: "Error",
        description: couponError.message,
        variant: "destructive",
      });
      setDeleting(false);
      return;
    }

    toast({
      title: "Coupon deleted",
      description: "The redeemed coupon has been permanently deleted.",
    });

    // Refresh the coupons
    await checkUserAndFetchCoupons();

    setShowDeleteRedeemedConfirm(false);
    setRedemptionToDelete(null);
    setDeleting(false);
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

  // Get IDs of redeemed coupons
  const redeemedCouponIds = new Set(redeemedCoupons.map((r) => r.coupon_id));

  // Filter out coupons pending deletion AND coupons that have been redeemed
  // Active tab should only show unredeemed coupons
  const visibleCoupons = createdCoupons.filter(
    (coupon) => !isPendingDelete(coupon.id) && !redeemedCouponIds.has(coupon.id)
  );

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
            className="rounded-full shadow-soft flex items-center gap-2 md:px-4 px-3"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Create New</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Partner Link Warning */}
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

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-lavender to-accent rounded-3xl p-6 shadow-soft">
            <div className="text-center">
              <p className="text-sm font-medium text-primary mb-2">
                💝 Active Coupons
              </p>
              <p className="text-4xl font-bold text-primary mb-1">
                {visibleCoupons.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {visibleCoupons.length < 4
                  ? `Create ${4 - visibleCoupons.length} more to unlock redemption`
                  : "You can redeem coupons from your partner! 🎉"}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-peach to-soft-pink rounded-3xl p-6 shadow-soft">
            <div className="text-center">
              <p className="text-sm font-medium text-primary mb-2">
                ✨ Redeemed Coupons
              </p>
              <p className="text-4xl font-bold text-primary mb-1">
                {redeemedCoupons.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Coupons that have been enjoyed
              </p>
            </div>
          </div>
        </div>

        {/* Coupons Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="active">Active ({visibleCoupons.length})</TabsTrigger>
            <TabsTrigger value="redeemed">Redeemed ({redeemedCoupons.length})</TabsTrigger>
          </TabsList>

          {/* Active Coupons Tab */}
          <TabsContent value="active" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Coupons</h2>
            </div>

            {visibleCoupons.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active coupons</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start creating love coupons for your partner!
                </p>
                <Button
                  onClick={() => navigate("/create-coupon")}
                  className="rounded-full shadow-soft"
                >
                  Create Your First Coupon
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleCoupons.map((coupon) => (
                  <Card
                    key={coupon.id}
                    className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-soft hover:shadow-glow transition-all border-2"
                  >
                    <div
                      className="w-full h-full cursor-pointer"
                      onClick={() => {
                        if (coupon.image_url) {
                          setSelectedImage({
                            url: coupon.image_url,
                            title: coupon.title,
                            description: coupon.description || undefined,
                          });
                        }
                      }}
                    >
                      {coupon.image_url ? (
                        <ProtectedImage
                          src={coupon.image_url}
                          alt={coupon.title}
                          className="w-full h-full object-cover"
                          showWatermark={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-peach via-soft-pink to-lavender" />
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 flex flex-col justify-end pointer-events-none">
                      {coupon.is_surprise && (
                        <div className="mb-2 flex justify-center">
                          <div className="flex items-center gap-1 bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <Sparkles className="w-4 h-4 text-white" />
                            <span className="text-white text-xs font-medium">Surprise</span>
                          </div>
                        </div>
                      )}
                      <h3 className="text-white font-bold text-xl mb-2">{coupon.title}</h3>
                      {coupon.description && (
                        <p className="text-white/90 text-sm line-clamp-2">
                          {coupon.description}
                        </p>
                      )}
                      {coupon.image_url && (
                        <p className="text-white/80 text-xs mt-2">Tap to view image</p>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                      {coupon.image_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to remove the image from this coupon? The coupon text will remain.")) {
                              deleteImage(coupon.id);
                            }
                          }}
                          className="w-10 h-10 bg-orange-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-orange-600/90 transition-colors"
                          title="Remove image"
                        >
                          <ImageOff className="w-5 h-5 text-white" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/create-coupon?edit=${coupon.id}`);
                        }}
                        className="w-10 h-10 bg-blue-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-blue-600/90 transition-colors"
                        title="Edit coupon"
                      >
                        <Edit className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCoupon(coupon.id);
                        }}
                        className="w-10 h-10 bg-rose-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-rose-600/90 transition-colors"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Redeemed Coupons Tab */}
          <TabsContent value="redeemed" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Redeemed Coupons</h2>
            </div>

            {redeemedCoupons.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No redeemed coupons yet</h3>
                <p className="text-sm text-muted-foreground">
                  Coupons that your partner redeems will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {redeemedCoupons.filter(r => r.coupons).map((redeemed) => (
                  <Card
                    key={redeemed.id}
                    className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-soft hover:shadow-glow transition-all border-2"
                  >
                    <div
                      className="w-full h-full cursor-pointer"
                      onClick={() => {
                        if (redeemed.coupons?.image_url) {
                          setSelectedImage({
                            url: redeemed.coupons.image_url,
                            title: redeemed.coupons.title,
                            description: redeemed.coupons.description || undefined,
                          });
                        }
                      }}
                    >
                      {redeemed.coupons?.image_url ? (
                        <ProtectedImage
                          src={redeemed.coupons.image_url}
                          alt={redeemed.coupons.title}
                          className="w-full h-full object-cover"
                          showWatermark={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-peach via-soft-pink to-lavender" />
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 flex flex-col justify-end pointer-events-none">
                      <div className="mb-2 flex justify-center">
                        <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <Heart className="w-4 h-4 text-white" fill="currentColor" />
                          <span className="text-white text-xs font-medium">Redeemed</span>
                        </div>
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2">{redeemed.coupons?.title}</h3>
                      {redeemed.coupons?.description && (
                        <p className="text-white/90 text-sm line-clamp-2">
                          {redeemed.coupons.description}
                        </p>
                      )}
                      <p className="text-white/80 text-xs mt-2">
                        Redeemed {new Date(redeemed.redeemed_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReverseRedemptionClick(redeemed);
                        }}
                        className="w-10 h-10 bg-amber-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-amber-600/90 transition-colors"
                        title="Reverse redemption"
                      >
                        <RotateCcw className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRedeemedClick(redeemed);
                        }}
                        className="w-10 h-10 bg-rose-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-rose-600/90 transition-colors"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          open={!!selectedImage}
          onOpenChange={(open) => !open && setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          blurLevel="none"
          description={selectedImage.description}
        />
      )}

      {/* Reverse Redemption Confirmation Dialog */}
      <Dialog open={showReverseConfirm} onOpenChange={setShowReverseConfirm}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Reverse Redemption?</DialogTitle>
            <DialogDescription>
              This will make the coupon available for redemption again. Are you sure you want to reverse this redemption?
            </DialogDescription>
          </DialogHeader>

          {redemptionToReverse && redemptionToReverse.coupons && (
            <div className="space-y-2 py-4">
              <h4 className="font-semibold">{redemptionToReverse.coupons.title}</h4>
              {redemptionToReverse.coupons.description && (
                <p className="text-sm text-muted-foreground">{redemptionToReverse.coupons.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Redeemed on {new Date(redemptionToReverse.redeemed_at).toLocaleDateString()}
              </p>
              {redemptionToReverse.reflection_note && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium mb-1">Partner's reflection:</p>
                  <p className="text-sm">{redemptionToReverse.reflection_note}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReverseConfirm(false);
                setRedemptionToReverse(null);
              }}
              disabled={reversing}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReverseRedemption}
              disabled={reversing}
              className="rounded-full bg-amber-500 hover:bg-amber-600"
            >
              {reversing ? "Reversing..." : "Reverse Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Redeemed Coupon Confirmation Dialog */}
      <Dialog open={showDeleteRedeemedConfirm} onOpenChange={setShowDeleteRedeemedConfirm}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Delete Redeemed Coupon?</DialogTitle>
            <DialogDescription>
              This will permanently delete this redeemed coupon and cannot be undone. Are you sure?
            </DialogDescription>
          </DialogHeader>

          {redemptionToDelete && redemptionToDelete.coupons && (
            <div className="space-y-2 py-4">
              <h4 className="font-semibold">{redemptionToDelete.coupons.title}</h4>
              {redemptionToDelete.coupons.description && (
                <p className="text-sm text-muted-foreground">{redemptionToDelete.coupons.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Redeemed on {new Date(redemptionToDelete.redeemed_at).toLocaleDateString()}
              </p>
              {redemptionToDelete.reflection_note && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium mb-1">Partner's reflection:</p>
                  <p className="text-sm">{redemptionToDelete.reflection_note}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteRedeemedConfirm(false);
                setRedemptionToDelete(null);
              }}
              disabled={deleting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteRedeemed}
              disabled={deleting}
              className="rounded-full bg-rose-500 hover:bg-rose-600"
              variant="destructive"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageCoupons;
