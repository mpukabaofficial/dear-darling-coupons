import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDarkMode } from "@/hooks/useDarkMode";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute, { PageLoader } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Home from "./pages/Home";

// Secondary pages are code-split so the initial load only ships Auth and Home
const CreateCoupon = lazy(() => import("./pages/CreateCoupon"));
const History = lazy(() => import("./pages/History"));
const Settings = lazy(() => import("./pages/Settings"));
const ManageCoupons = lazy(() => import("./pages/ManageCoupons"));
const ActivityInsights = lazy(() => import("./pages/ActivityInsights"));
const NotificationHistory = lazy(() => import("./pages/NotificationHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize dark mode at app level to ensure consistency across all pages
  useDarkMode();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/create-coupon" element={<ProtectedRoute><CreateCoupon /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/manage-coupons" element={<ProtectedRoute><ManageCoupons /></ProtectedRoute>} />
          <Route path="/activity-insights" element={<ProtectedRoute><ActivityInsights /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationHistory /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
