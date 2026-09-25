import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Heart className="w-10 h-10 text-primary animate-pulse" fill="currentColor" />
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
