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
  partner_id: string | null;
  relationship_start_date: string | null;
}

interface PartnerProfile {
  email: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
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

  const copyEmail = () => {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      toast({
        title: "Copied!",
        description: "Email copied to clipboard",
      });
    }
  };

  const linkWithPartner = async () => {
    const trimmedEmail = partnerEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      toast({
        title: "Error",
        description: "Please enter your partner's email",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (trimmedEmail === profile?.email.toLowerCase()) {
      toast({
        title: "Error",
        description: "You cannot link with yourself!",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);

    try {
      // Find partner by email
      const { data: partnerData, error: findError } = await supabase
        .from("profiles")
        .select("id, email, partner_id")
        .eq("email", trimmedEmail)
        .single();

      if (findError || !partnerData) {
        toast({
          title: "Error",
          description: "No user found with this email address",
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

      setPartnerEmail("");
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
          <Button variant="outline" onClick={() => navigate("/home")} className="rounded-full">
            Back to Home
          </Button>
        </div>

        {/* Partner Linking Section */}
        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Partner Connection
            </CardTitle>
            <CardDescription>
              Link with your partner using their email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Partner Status */}
            {profile.partner_id && partnerProfile ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connected with</p>
                    <p className="text-lg font-semibold text-green-800">{partnerProfile.email}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={unlinkPartner}
                    className="flex items-center gap-2 rounded-full"
                  >
                    <UserX className="h-4 w-4" />
                    Unlink
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Your Email */}
                <div>
                  <Label htmlFor="your-email">Your Email</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="your-email"
                      value={profile.email}
                      readOnly
                      className="bg-gray-50 rounded-2xl h-12"
                    />
                    <Button onClick={copyEmail} size="icon" variant="outline" className="rounded-full h-12 w-12">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Share this email with your partner so they can link with you
                  </p>
                </div>

                {/* Link with Partner */}
                <div>
                  <Label htmlFor="partner-email">Partner's Email Address</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="partner-email"
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="rounded-2xl h-12"
                    />
                    <Button onClick={linkWithPartner} disabled={isLinking} className="rounded-full h-12">
                      {isLinking ? "Linking..." : "Link"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your partner's email address to connect
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationship Details */}
        {profile.partner_id && (
          <Card className="rounded-3xl shadow-soft">
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
                    className="rounded-2xl h-12"
                  />
                  <Button
                    onClick={updateRelationshipStartDate}
                    disabled={isUpdatingDate}
                    className="rounded-full h-12"
                  >
                    {isUpdatingDate ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Section */}
        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={profile.email} readOnly className="mt-1 bg-gray-50 rounded-2xl h-12" />
            </div>
            <Button variant="destructive" onClick={handleSignOut} className="rounded-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
