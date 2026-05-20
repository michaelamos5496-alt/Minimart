import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, ShoppingCart, Package, Activity, Settings as SettingsIcon, LogOut, Menu, X, CreditCard } from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "POS", path: "/pos", icon: ShoppingCart },
  { name: "Inventory", path: "/inventory", icon: Package },
  { name: "Activity Log", path: "/activity", icon: Activity },
  { name: "Settings", path: "/settings", icon: SettingsIcon },
  { name: "Subscription", path: "/subscription", icon: CreditCard },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [claimForm, setClaimForm] = React.useState({ name: "", email: "", password: "" });
  const [claimLoading, setClaimLoading] = React.useState(false);
  const location = useLocation();
  const { logout, user, updateUser, login } = useAuth();
  
  const isGuest = user && !user.staff_id && user.email?.startsWith("guest_");

  React.useEffect(() => {
    if (isGuest && !showClaimModal) {
      setShowClaimModal(true);
    }
  }, [isGuest]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimLoading(true);
    try {
      const res = await fetch("/api/auth/claim", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(claimForm)
      });
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch(e) {
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
      }
      if (res.ok) {
        login(data.token, data.user);
        setShowClaimModal(false);
      } else {
        alert(data.error);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-transparent text-slate-100 font-sans relative overflow-hidden">
      {/* Mobile menu toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="font-bold text-xl text-indigo-400 truncate pr-4">{user?.store_name || "STORE KEEPER"}</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#0a111a]/60 backdrop-blur-3xl border-r border-white/5 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-20 flex items-center px-8 border-b border-white/5 hidden md:flex">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                M
             </div>
             <div className="font-medium text-lg text-slate-200 tracking-wide truncate">{user?.store_name || "STORE KEEPER"}</div>
          </div>
        </div>

        <div className="p-4 pt-[80px] md:pt-4 flex-1 overflow-y-auto">
          <nav className="space-y-2 mt-4">
            {navItems.filter(item => {
              if (!user?.staff_id) return true; // Owner sees all
              const perms = user.permissions || [];
              if (item.path === '/pos') return perms.includes('pos_access');
              if (item.path === '/inventory') return perms.includes('inventory_view') || perms.includes('inventory_manage');
              if (item.path === '/activity') return perms.includes('analytics_view');
              if (item.path === '/settings') return perms.includes('settings_manage');
              if (item.path === '/subscription') return false; // Staff cannot manage subscription
              if (item.path === '/') return true; // Let everyone see dashboard or restrict? Usually dashboard requires analytics_view, or just a generic landing. Let's let everyone see dashboard, or maybe restrict to analytics_view. Let's allow everyone to see dashboard.
              return true;
            }).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const tier = user?.subscription_tier || 'Free';
              
              // Define lock logic
              let isLocked = false;
              if (item.path === '/activity' && !['Premium', 'Enterprise'].includes(tier)) isLocked = true;
              if (item.path === '/settings' && tier !== 'Enterprise') isLocked = true;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex justify-between items-center px-4 py-3 mx-2 rounded-lg transition-all font-medium text-sm group",
                    isActive
                      ? "bg-[#182b42] text-blue-300 shadow-[inset_2px_0_0_#60a5fa,0_4px_12px_rgba(0,0,0,0.1)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                    isLocked && !isActive ? "opacity-60 hover:opacity-100" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-blue-400" : "text-slate-500"} />
                    {item.name}
                  </div>
                  {isLocked && (
                    <div className="bg-slate-800 p-1 rounded group-hover:bg-rose-500/10 group-hover:text-rose-400 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 mb-4 md:mb-8">
          <div className="flex items-center gap-3 px-3 py-3 mx-2 rounded-lg bg-black/20 border border-white/5 mb-4 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-[#182b42] border border-[#233f5d] flex items-center justify-center text-blue-300 font-bold shrink-0 text-xs">
              {(user?.staff_name || user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate text-slate-200">{user?.staff_name || user?.name}</div>
              <div className="text-[10px] text-slate-500 truncate tracking-wide">{user?.staff_role || user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-16 md:pt-0 relative z-10 flex flex-col">
        <header className="hidden md:flex shrink-0 h-20 border-b border-white/5 items-center justify-between px-8 bg-transparent sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light tracking-wide text-slate-100 capitalize">{location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace('-', ' ')}</h1>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400 uppercase tracking-widest ml-4 px-3 py-1 bg-black/20 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                <span>{user?.store_name || "Workspace"}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Fake top nav items matching the glazzed theme */}
              <div className="flex gap-2">
                 <button className="w-9 h-9 rounded-full bg-[#0a111a]/40 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <Activity size={16} />
                 </button>
                 <button className="w-9 h-9 rounded-full bg-[#0a111a]/40 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <SettingsIcon size={16} />
                 </button>
              </div>
              
              <div className="pl-4 border-l border-white/5 flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-200">{user?.staff_name || user?.name}</div>
                  <div className="text-[10px] text-blue-400 font-medium uppercase">{user?.staff_role || 'Admin'}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#182b42] border-2 border-slate-700 flex items-center justify-center text-blue-300 font-bold overflow-hidden shadow-lg">
                  {(user?.staff_name || user?.name || "U").charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto flex-1 w-full relative">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Claim Account Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl tracking-tight font-light text-white mb-2">Save Your Account</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md">Create your dedicated sign in details to securely keep your {user?.subscription_tier} subscription and store data.</p>
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input required type="text" value={claimForm.name} onChange={e => setClaimForm({...claimForm, name: e.target.value})} className="w-full bg-[#0a111a]/60 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input required type="email" value={claimForm.email} onChange={e => setClaimForm({...claimForm, email: e.target.value})} className="w-full bg-[#0a111a]/60 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input required type="password" value={claimForm.password} onChange={e => setClaimForm({...claimForm, password: e.target.value})} className="w-full bg-[#0a111a]/60 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="••••••••" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowClaimModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={claimLoading} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-500/30 transition-colors">
                  {claimLoading ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
