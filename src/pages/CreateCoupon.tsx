import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import ImagePreview from "@/components/ImagePreview";
import { z } from "zod";

const couponSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
});

const templates = [
  { title: "Home-cooked meal", description: "I'll cook your favorite dinner 🍝" },
  { title: "Back massage", description: "15 minutes of pure relaxation 💆" },
  { title: "Movie night", description: "You pick the movie, I'll get the snacks 🎬" },
  { title: "Breakfast in bed", description: "Wake up to your favorite breakfast ☕" },
  { title: "Date night", description: "A special evening out together 💑" },
  { title: "Chore pass", description: "I'll handle your chores for the day 🧹" },
  { title: "Adventure day", description: "Let's explore somewhere new together 🗺️" },
  { title: "Spa at home", description: "Full pampering session at home 🛁" },
];

interface Profile {
  id: string;
  partner_id: string | null;
}

const CreateCoupon = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSurprise, setIsSurprise] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (editId && profile) {
      loadCouponData();
    }
  }, [editId, profile]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, partner_id")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      if (!profileData.partner_id) {
        toast({
          title: "Partner not linked",
          description: "You need to link with your partner first to create coupons",
          variant: "destructive",
        });
      }
    }
  };

  const loadCouponData = async () => {
    if (!editId) return;

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", editId)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Could not load coupon data",
        variant: "destructive",
      });
      navigate("/manage-coupons");
      return;
    }

    // Only allow editing if user created this coupon
    if (data.created_by !== profile?.id) {
      toast({
        title: "Not authorized",
        description: "You can only edit coupons you created",
        variant: "destructive",
      });
      navigate("/manage-coupons");
      return;
    }

    setTitle(data.title);
    setDescription(data.description || "");
    setIsSurprise(data.is_surprise);
    if (data.image_url) {
      setExistingImageUrl(data.image_url);
      setImagePreview(data.image_url);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const useTemplate = (template: typeof templates[0]) => {
    setTitle(template.title);
    setDescription(template.description);
    setErrors({});
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !profile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('coupon-images')
      .upload(fileName, imageFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('coupon-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      couponSchema.parse({ title, description });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { title?: string; description?: string } = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as keyof typeof newErrors] = issue.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    if (!profile?.partner_id) {
      toast({
        title: editId ? "Cannot update coupon" : "Cannot create coupon",
        description: "You need to link with your partner first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload new image if present, otherwise keep existing
      let imageUrl: string | null = existingImageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      if (editId) {
        // Update existing coupon
        const { error } = await supabase
          .from("coupons")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            is_surprise: isSurprise,
            image_url: imageUrl,
          })
          .eq("id", editId);

        if (error) throw error;

        toast({
          title: "Coupon updated! 💕",
          description: "Your changes have been saved!",
        });
      } else {
        // Create new coupon
        const { error } = await supabase.from("coupons").insert({
          title: title.trim(),
          description: description.trim() || null,
          is_surprise: isSurprise,
          image_url: imageUrl,
          created_by: profile.id,
          for_partner: profile.partner_id,
        });

        if (error) throw error;

        toast({
          title: "Coupon created! 💕",
          description: "Your partner will love this surprise!",
        });
      }

      navigate("/manage-coupons");
    } catch (error: any) {
      toast({
        title: editId ? "Error updating coupon" : "Error creating coupon",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(editId ? "/manage-coupons" : "/home")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{editId ? "Edit Coupon" : "Create Coupon"}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Templates */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Get inspired by templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map((template, index) => (
              <Card
                key={index}
                onClick={() => useTemplate(template)}
                className="p-4 cursor-pointer hover:shadow-soft transition-all hover:scale-105 rounded-2xl"
              >
                <p className="text-sm font-semibold text-center">{template.title}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Coupon Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Home-cooked meal"
              className="rounded-2xl h-12"
              maxLength={100}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about what this coupon includes..."
              className="rounded-2xl resize-none"
              rows={4}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Coupon Image (Optional)</Label>
            {imagePreview ? (
              <ImagePreview src={imagePreview} onRemove={removeImage} />
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/30 rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload an image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 5MB (PNG, JPG, WEBP)
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Surprise Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-lavender to-soft-pink rounded-2xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <Label htmlFor="surprise" className="text-base font-semibold cursor-pointer">
                  Make it a surprise
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hide content until redeemed
                </p>
              </div>
            </div>
            <Switch
              id="surprise"
              checked={isSurprise}
              onCheckedChange={setIsSurprise}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(editId ? "/manage-coupons" : "/home")}
              className="flex-1 rounded-full h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !profile?.partner_id}
              className="flex-1 rounded-full h-12 shadow-soft"
            >
              {uploading
                ? editId
                  ? "Updating..."
                  : "Creating..."
                : editId
                ? "Update Coupon"
                : "Create Coupon"}
            </Button>
          </div>

          {!profile?.partner_id && (
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">
                You need to link with your partner before creating coupons
              </p>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/settings")}
                className="text-sm"
              >
                Go to Settings to link with partner →
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default CreateCoupon;
