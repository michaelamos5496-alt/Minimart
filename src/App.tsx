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

import { Welcome } from "./pages/Welcome";

const ProtectedRoute = ({ children, requiredPermission, requireOwner }: { children: React.ReactNode, requiredPermission?: string, requireOwner?: boolean }) => {
  const { user, isLoading } = useAuth();
  
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
    return <Navigate to="/welcome" replace />;
  }

  // Show Ad for store owners who have not seen it this session and are on Starter/Free tier
  const isOwner = !user.staff_id;
  const isFreeOrStarter = !user.subscription_tier || user.subscription_tier === 'Free';
  
  if (isOwner && isFreeOrStarter) {
    if (!window.location.pathname.includes('/subscription')) {
      return <Navigate to="/subscription" replace />;
    }
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
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<div className="min-h-screen bg-[#020617]"><Subscription /></div>} />
          
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

