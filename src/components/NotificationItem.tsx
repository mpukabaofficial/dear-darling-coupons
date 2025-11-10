import { Notification } from "@/hooks/usePartnerNotifications";
import { Gift, Heart, Clock, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ImageModal from "./ImageModal";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const navigate = useNavigate();
  const [showImageModal, setShowImageModal] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case 'new_coupon':
        return <Gift className="w-5 h-5 text-primary" />;
      case 'coupon_redeemed':
        return <Heart className="w-5 h-5 text-primary fill-primary" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleViewCoupon = () => {
    if (notification.related_coupon_id) {
      if (notification.type === 'new_coupon') {
        navigate('/');
      } else if (notification.type === 'coupon_redeemed') {
        navigate('/manage');
      }
      onMarkAsRead(notification.id);
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <>
      <div
        onClick={handleClick}
        className={`
          p-4 border-b border-border/50 cursor-pointer
          transition-all duration-200 hover:bg-muted/30
          ${!notification.read ? 'bg-primary/5' : 'bg-background'}
        `}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={`text-sm font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {notification.message}
            </p>

            {/* Metadata Section */}
            {notification.metadata && (
              <div className="flex gap-2 mb-2">
                {notification.metadata.image_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageModal(true);
                    }}
                    className="h-7 text-xs"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    View Image
                  </Button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              {notification.related_coupon_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCoupon();
                  }}
                  className="h-7 text-xs"
                >
                  View Coupon
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {notification.metadata?.image_url && (
        <ImageModal
          open={showImageModal}
          onOpenChange={setShowImageModal}
          imageUrl={notification.metadata.image_url}
          title={notification.metadata.coupon_title || "Coupon Image"}
          blurLevel="none"
        />
      )}
    </>
  );
};

export default NotificationItem;
