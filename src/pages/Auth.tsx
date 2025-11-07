import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/home");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCheckEmail(true);
      toast({
        title: "Check your email!",
        description: "We sent you a magic link to sign in",
      });
    }

    setLoading(false);
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-fade-in">
            <Heart className="w-10 h-10 text-white" fill="currentColor" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We sent a magic link to <span className="font-semibold text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to sign in. You can close this window.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setCheckEmail(false);
              setEmail("");
            }}
            className="rounded-full"
          >
            Use different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-scale-in shadow-glow">
            <Heart className="w-10 h-10 text-white" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold animate-fade-in">Love Coupons</h1>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Your private space to share love, one coupon at a time
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="rounded-full h-12 px-6 text-center border-2 focus:border-primary transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full h-12 text-base font-semibold shadow-soft hover:shadow-glow transition-all"
          >
            {loading ? "Sending magic link..." : "Continue with Email"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We'll send you a magic link to sign in. No password needed! 💌
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
