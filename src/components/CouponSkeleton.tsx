import { Card } from "@/components/ui/card";

const CouponSkeleton = () => {
  return (
    <Card className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-soft animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-peach via-soft-pink to-lavender" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 flex flex-col justify-end">
        <div className="h-6 bg-white/30 rounded-full w-3/4 mb-2"></div>
        <div className="h-4 bg-white/30 rounded-full w-1/2"></div>
      </div>
    </Card>
  );
};

export const CouponGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <CouponSkeleton key={i} />
      ))}
    </div>
  );
};

export default CouponSkeleton;
