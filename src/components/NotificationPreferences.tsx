import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Bell, Gift, Heart, Volume2 } from "lucide-react";

interface NotificationPreferences {
  new_coupon: boolean;
  coupon_redeemed: boolean;
  coupon_expiring: boolean;
  weekly_digest: boolean;
  sound_enabled: boolean;
}

interface NotificationPreferencesProps {
  userId: string;
}

const NotificationPreferencesComponent = ({ userId }: NotificationPreferencesProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_coupon: true,
    coupon_redeemed: true,
    coupon_expiring: true,
    weekly_digest: true,
    sound_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching preferences:", error);
      setLoading(false);
      return;
    }

    if (data?.notification_preferences) {
      setPreferences(data.notification_preferences as unknown as NotificationPreferences);
    }
    setLoading(false);
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: newPreferences })
      .eq("id", userId);

    if (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
      // Revert on error
      setPreferences(preferences);
      return;
    }

    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose what notifications you want to receive from your partner
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Coupon Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label htmlFor="new_coupon" className="text-base font-medium cursor-pointer">
                New Coupons
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your partner creates a new coupon for you
              </p>
            </div>
          </div>
          <Switch
            id="new_coupon"
            checked={preferences.new_coupon}
            onCheckedChange={(checked) => updatePreference("new_coupon", checked)}
          />
        </div>

        {/* Redemption Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary fill-primary" />
            </div>
            <div className="flex-1">
              <Label htmlFor="coupon_redeemed" className="text-base font-medium cursor-pointer">
                Coupon Redeemed
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your partner redeems one of your coupons
              </p>
            </div>
          </div>
          <Switch
            id="coupon_redeemed"
            checked={preferences.coupon_redeemed}
            onCheckedChange={(checked) => updatePreference("coupon_redeemed", checked)}
          />
        </div>

        {/* Sound Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label htmlFor="sound_enabled" className="text-base font-medium cursor-pointer">
                Sound Effects
              </Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when you receive a notification
              </p>
            </div>
          </div>
          <Switch
            id="sound_enabled"
            checked={preferences.sound_enabled}
            onCheckedChange={(checked) => updatePreference("sound_enabled", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesComponent;
