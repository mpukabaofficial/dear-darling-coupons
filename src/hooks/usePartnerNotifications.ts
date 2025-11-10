import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_coupon_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  metadata?: {
    coupon_title?: string;
    is_surprise?: boolean;
    image_url?: string;
    redeemer_email?: string;
    redemption_id?: string;
  };
}

export const usePartnerNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    if (data) {
      // Cast the data to our Notification type
      const typedNotifications = data.map(n => ({
        ...n,
        metadata: n.metadata as Notification['metadata']
      })) as Notification[];
      
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read).length);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            metadata: payload.new.metadata as Notification['metadata']
          } as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ 
        read: true,
        read_at: now
      })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true, read_at: now } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ 
        read: true,
        read_at: now
      })
      .eq("user_id", session.user.id)
      .eq("read", false);

    if (error) {
      console.error("Error marking all as read:", error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: n.read_at || now })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
