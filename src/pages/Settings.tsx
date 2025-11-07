import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, Copy, Link2, UserX, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  email: string;
  invite_code: string | null;
  partner_id: string | null;
  relationship_start_date: string | null;
}

interface PartnerProfile {
  email: string;
}

// Generate a random 8-character invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [partnerCode, setPartnerCode] = useState("");
  const [relationshipStartDate, setRelationshipStartDate] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      return;
    }

    if (profileData) {
      // Auto-generate invite code if missing
      if (!profileData.invite_code) {
        let newCode = generateInviteCode();

        // Try to save it (with retry if duplicate)
        let saved = false;
        let attempts = 0;

        while (!saved && attempts < 5) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ invite_code: newCode })
            .eq("id", profileData.id);

          if (!updateError) {
            profileData.invite_code = newCode;
            saved = true;
          } else if (updateError.message?.includes("duplicate") || updateError.message?.includes("unique")) {
            // Code already exists, generate a new one
            newCode = generateInviteCode();
            attempts++;
          } else {
            // Other error, stop trying
            break;
          }
        }
      }

      setProfile(profileData);
      setRelationshipStartDate(profileData.relationship_start_date || "");

      // Fetch partner profile if linked
      if (profileData.partner_id) {
        const { data: partnerData } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", profileData.partner_id)
          .single();

        if (partnerData) {
          setPartnerProfile(partnerData);
        }
      }
    }
  };

  const copyInviteCode = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const linkWithPartner = async () => {
    if (!partnerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a partner code",
        variant: "destructive",
      });
      return;
    }

    if (partnerCode.toUpperCase() === profile?.invite_code) {
      toast({
        title: "Error",
        description: "You cannot link with yourself!",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);

    try {
      // Find partner by invite code
      const { data: partnerData, error: findError } = await supabase
        .from("profiles")
        .select("id, email, partner_id")
        .eq("invite_code", partnerCode.toUpperCase())
        .single();

      if (findError || !partnerData) {
        toast({
          title: "Error",
          description: "Invalid partner code",
          variant: "destructive",
        });
        setIsLinking(false);
        return;
      }

      // Check if partner is already linked to someone else
      if (partnerData.partner_id && partnerData.partner_id !== profile?.id) {
        toast({
          title: "Error",
          description: "This person is already linked with another partner",
          variant: "destructive",
        });
        setIsLinking(false);
        return;
      }

      // Link both profiles
      const { error: updateError1 } = await supabase
        .from("profiles")
        .update({ partner_id: partnerData.id })
        .eq("id", profile?.id);

      const { error: updateError2 } = await supabase
        .from("profiles")
        .update({ partner_id: profile?.id })
        .eq("id", partnerData.id);

      if (updateError1 || updateError2) {
        toast({
          title: "Error",
          description: "Failed to link with partner",
          variant: "destructive",
        });
        setIsLinking(false);
        return;
      }

      toast({
        title: "Success!",
        description: `You are now linked with ${partnerData.email}`,
      });

      setPartnerCode("");
      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkPartner = async () => {
    if (!profile?.partner_id) return;

    const confirmed = window.confirm(
      "Are you sure you want to unlink from your partner? This will also delete all coupons between you."
    );

    if (!confirmed) return;

    try {
      // Unlink both profiles
      const { error: updateError1 } = await supabase
        .from("profiles")
        .update({ partner_id: null, relationship_start_date: null })
        .eq("id", profile.id);

      const { error: updateError2 } = await supabase
        .from("profiles")
        .update({ partner_id: null, relationship_start_date: null })
        .eq("id", profile.partner_id);

      if (updateError1 || updateError2) {
        toast({
          title: "Error",
          description: "Failed to unlink partner",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Unlinked",
        description: "You have been unlinked from your partner",
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const updateRelationshipStartDate = async () => {
    if (!relationshipStartDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingDate(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ relationship_start_date: relationshipStartDate })
        .eq("id", profile?.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update relationship start date",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Relationship start date updated",
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-pink-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-pink-900 flex items-center gap-2">
            <Heart className="h-8 w-8 fill-pink-500 text-pink-500" />
            Settings
          </h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>

        {/* Partner Linking Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Partner Connection
            </CardTitle>
            <CardDescription>
              Link with your partner to start sharing love coupons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Partner Status */}
            {profile.partner_id && partnerProfile ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connected with</p>
                    <p className="text-lg font-semibold text-green-800">{partnerProfile.email}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={unlinkPartner}
                    className="flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Unlink
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Your Invite Code */}
                <div>
                  <Label htmlFor="invite-code">Your Invite Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="invite-code"
                      value={profile.invite_code || "Generating..."}
                      readOnly
                      className="font-mono text-lg font-bold"
                    />
                    <Button onClick={copyInviteCode} size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Share this code with your partner
                  </p>
                </div>

                {/* Link with Partner */}
                <div>
                  <Label htmlFor="partner-code">Partner's Invite Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="partner-code"
                      value={partnerCode}
                      onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                      placeholder="Enter partner's code"
                      className="font-mono"
                      maxLength={8}
                    />
                    <Button onClick={linkWithPartner} disabled={isLinking}>
                      {isLinking ? "Linking..." : "Link"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your partner's invite code to connect
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationship Details */}
        {profile.partner_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Relationship Details
              </CardTitle>
              <CardDescription>
                Set when your relationship started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="start-date">Relationship Start Date</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="start-date"
                    type="date"
                    value={relationshipStartDate}
                    onChange={(e) => setRelationshipStartDate(e.target.value)}
                  />
                  <Button
                    onClick={updateRelationshipStartDate}
                    disabled={isUpdatingDate}
                  >
                    {isUpdatingDate ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={profile.email} readOnly className="mt-1" />
            </div>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
