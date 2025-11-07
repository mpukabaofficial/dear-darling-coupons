import { Card } from "@/components/ui/card";

const HistoryItemSkeleton = () => {
  return (
    <Card className="p-6 rounded-3xl shadow-soft animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-peach via-soft-pink to-lavender rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gradient-to-r from-peach/30 to-soft-pink/30 rounded-full w-3/4"></div>
          <div className="h-4 bg-gradient-to-r from-lavender/30 to-accent/30 rounded-full w-1/2"></div>
          <div className="h-4 bg-gradient-to-r from-soft-pink/30 to-lavender/30 rounded-full w-2/3"></div>
        </div>
      </div>
    </Card>
  );
};

export const HistorySkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <HistoryItemSkeleton key={i} />
      ))}
    </div>
  );
};

export default HistorySkeleton;
