import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CouponCard from "./CouponCard";
import { CouponGridSkeleton } from "./CouponSkeleton";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_surprise: boolean;
  created_by: string;
  for_partner: string;
}

interface CouponGridProps {
  userId: string;
  onRedeemed?: () => void;
}

const CouponGrid = ({ userId, onRedeemed }: CouponGridProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();

    // Subscribe to coupon changes
    const channel = supabase
      .channel('coupons-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coupons',
          filter: `for_partner=eq.${userId}`
        },
        () => {
          fetchCoupons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchCoupons = async () => {
    // First, get all redeemed coupon IDs for this user
    const { data: redeemedData } = await supabase
      .from("redeemed_coupons")
      .select("coupon_id")
      .eq("redeemed_by", userId);

    const redeemedIds = redeemedData?.map(r => r.coupon_id) || [];

    // Then fetch coupons that haven't been redeemed
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("for_partner", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading coupons",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Filter out redeemed coupons client-side
      const unredeemed = (data || []).filter(c => !redeemedIds.includes(c.id));
      setCoupons(unredeemed);
    }

    setLoading(false);
  };

  const handleRedeemed = () => {
    fetchCoupons();
    onRedeemed?.();
  };

  if (loading) {
    return <CouponGridSkeleton />;
  }

  const activeCoupons = coupons.slice(0, 4);
  const emptySlots = Math.max(0, 4 - activeCoupons.length);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {activeCoupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          onRedeemed={handleRedeemed}
        />
      ))}
      
      {Array.from({ length: emptySlots }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="aspect-[3/4] border-2 border-dashed border-muted-foreground/30 rounded-3xl flex items-center justify-center text-muted-foreground"
        >
          <p className="text-center px-4">
            Waiting for your<br />partner's love 💕
          </p>
        </div>
      ))}
    </div>
  );
};

export default CouponGrid;
