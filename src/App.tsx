/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { POS } from "./pages/POS";
import { ActivityLogs } from "./pages/Activity";
import { Settings } from "./pages/Settings";
import { Subscription } from "./pages/Subscription";
import { X } from "lucide-react";

const ProtectedRoute = ({ children, requiredPermission, requireOwner }: { children: React.ReactNode, requiredPermission?: string, requireOwner?: boolean }) => {
  const { user, isLoading } = useAuth();
  
  const [showAd, setShowAd] = React.useState(() => {
    return !sessionStorage.getItem('hasSeenSubscriptionAd');
  });

  const handleDismissAd = () => {
    sessionStorage.setItem('hasSeenSubscriptionAd', 'true');
    setShowAd(false);
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-radial-[at_top_left] from-[#1a3a5a] via-[#0f1722] to-[#07090d] text-slate-300 relative overflow-hidden">
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-[#182b42] border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse">
            <span className="font-bold text-3xl text-blue-400">M</span>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-xl font-light tracking-widest text-slate-200 mb-2">STORE KEEPER</div>
             <div className="text-[10px] uppercase tracking-widest text-blue-500/70 font-semibold">Workspace Loading</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show Ad for store owners who have not seen it this session and are on Starter/Free tier
  const isOwner = !user.staff_id;
  const isFreeOrStarter = !user.subscription_tier || user.subscription_tier === 'Free' || user.subscription_tier === 'Starter';
  
  if (showAd && isOwner && isFreeOrStarter) {
    return (
      <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-6xl relative bg-[#0a111a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl shadow-indigo-500/10 mt-10 mb-10 overflow-hidden">
           <div className="absolute top-0 right-0 p-4 z-50">
             <button onClick={handleDismissAd} className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-full transition-all border border-white/5">
                <X size={20} />
             </button>
           </div>
           
           <div className="text-center mb-6">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1 mt-4">Special Offer</h2>
              <h1 className="text-2xl md:text-4xl font-light text-white mb-2">Unlock Your Store's Full Potential</h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm">You are currently using the limited {user.subscription_tier || 'Free'} plan. Upgrade today to unlock advanced point-of-sale features, staff management, and powerful real-time analytics.</p>
           </div>
           
           <div className="scale-95 origin-top relative z-10">
               {/* Prevent clicks on the actual Subscription page inside the ad to avoid weird state, or let them click? 
                   If they click Upgrade, it'll navigate. We want them to navigate to Layout so let's dismiss the Ad when they upgrade!
               */}
               <Subscription isAdContext onSuccess={handleDismissAd} />
           </div>
           
           <div className="flex justify-center mt-2 pb-4">
             <button onClick={handleDismissAd} className="text-sm text-slate-500 hover:text-white underline underline-offset-4 decoration-white/20 transition-all font-medium">
               No thanks, I'll stick to the limited plan.
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (requireOwner && user.staff_id) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && user.staff_id) {
    const perms = user.permissions || [];
    if (!perms.includes(requiredPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute requiredPermission="inventory_view"><Inventory /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute requiredPermission="pos_access"><POS /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute requiredPermission="analytics_view"><ActivityLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredPermission="settings_manage"><Settings /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute requireOwner><Subscription /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

