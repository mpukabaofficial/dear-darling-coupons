
import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePartnerNotifications } from "@/hooks/usePartnerNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CouponDetailModal } from "@/components/CouponDetailModal";

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = usePartnerNotifications();
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  const handleViewCoupon = (couponId: string) => {
    setSelectedCouponId(couponId);
    setShowCouponModal(true);
  };
import NotificationItem from "./NotificationItem";

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = usePartnerNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors",
                    !notification.read && "bg-accent/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div
                        className="space-y-1 cursor-pointer hover:opacity-80"
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {notification.related_coupon_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCoupon(notification.related_coupon_id!);
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          View Coupon
                        </Button>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              You'll be notified when your partner creates or redeems coupons
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              className="w-full text-xs"
            >
              Refresh notifications
            </Button>
          </div>
        )}
      </PopoverContent>
      <CouponDetailModal
        open={showCouponModal}
        onOpenChange={setShowCouponModal}
        couponId={selectedCouponId}
      />
    </Popover>
  );
};
