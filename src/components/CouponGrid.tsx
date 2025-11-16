import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import CouponCard from "./CouponCard";
import { CouponGridSkeleton } from "./CouponSkeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [showAll, setShowAll] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update scroll buttons state
  useEffect(() => {
    const updateScrollButtons = () => {
      if (scrollContainerRef.current && isLargeScreen) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    updateScrollButtons();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [coupons, isLargeScreen]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

  // Determine which coupons to show based on screen size and state
  const displayedCoupons = isLargeScreen
    ? coupons // Show all coupons on large screens (with horizontal scroll)
    : (showAll ? coupons : coupons.slice(0, 4)); // Show 4 or all on small screens

  const hasMoreThanFour = coupons.length > 4;

  // Large screen: horizontal scrolling with chevrons
  if (isLargeScreen && hasMoreThanFour) {
    return (
      <div className="relative">
        {/* Left chevron */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/95 backdrop-blur"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedCoupons.map((coupon) => (
            <div key={coupon.id} className="flex-shrink-0 w-[calc(25%-12px)]">
              <CouponCard coupon={coupon} onRedeemed={handleRedeemed} />
            </div>
          ))}
        </div>

        {/* Right chevron */}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/95 backdrop-blur"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Small screen: grid with show more button
  const emptySlots = !showAll && displayedCoupons.length < 4
    ? Math.max(0, 4 - displayedCoupons.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedCoupons.map((coupon) => (
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

      {/* Show More button for small screens */}
      {!isLargeScreen && hasMoreThanFour && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="w-full md:w-auto"
          >
            {showAll ? 'Show Less' : `Show More (${coupons.length - 4} more)`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CouponGrid;
