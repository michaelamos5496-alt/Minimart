import React, { useState, useEffect } from "react";
import { Download, Users, Shield, Save, Plus, Trash2, Edit } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { Staff } from "../types";

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const [success, setSuccess] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "",
    permissions: [] as string[],
    login_id: "",
    password: ""
  });
  const [staffError, setStaffError] = useState("");
  
  const [storeSettings, setStoreSettings] = useState({
    store_name: user?.store_name || user?.name + "'s Store",
    currency_symbol: user?.currency_symbol || "$"
  });

  const CURRENCIES = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "KRW", symbol: "₩", name: "South Korean Won" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "RUB", symbol: "₽", name: "Russian Ruble" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
    { code: "DKK", symbol: "kr", name: "Danish Krone" },
    { code: "PLN", symbol: "zł", name: "Polish Zloty" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
    { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
    { code: "ILS", symbol: "₪", name: "Israeli New Shekel" },
    { code: "CLP", symbol: "$", name: "Chilean Peso" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "COP", symbol: "$", name: "Colombian Peso" },
    { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    { code: "RON", symbol: "lei", name: "Romanian Leu" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
    { code: "ARS", symbol: "$", name: "Argentine Peso" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
    { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  ];

  const handleSaveSettings = async () => {
    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify(storeSettings)
      });
      updateUser(storeSettings);
      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const AVAILABLE_PERMISSIONS = [
    { id: "pos_access", label: "Use POS" },
    { id: "inventory_view", label: "View Inventory" },
    { id: "inventory_manage", label: "Manage Inventory" },
    { id: "analytics_view", label: "View Analytics" },
    { id: "settings_manage", label: "Manage Settings" }
  ];

  const fetchStaff = async () => {
    try {
      const data = await apiFetch("/api/staff");
      setStaff(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    try {
      if (editingStaffId) {
        await apiFetch(`/api/staff/${editingStaffId}`, {
          method: "PUT",
          body: JSON.stringify(staffForm)
        });
        setSuccess("Staff updated successfully!");
      } else {
        await apiFetch("/api/staff", {
          method: "POST",
          body: JSON.stringify(staffForm)
        });
        setSuccess("Staff added successfully!");
      }
      setTimeout(() => setSuccess(""), 3000);
      setIsStaffModalOpen(false);
      fetchStaff();
    } catch (e: any) {
      console.error(e);
      setStaffError(e.message || "An error occurred");
    }
  };

  const generateCredentials = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomPass = Math.random().toString(36).substring(2, 10);
    setStaffForm(prev => ({ ...prev, login_id: randomId, password: randomPass }));
  };

  const handleEditStaff = (s: Staff) => {
    setEditingStaffId(s.id);
    setStaffError("");
    let perms: string[] = [];
    try {
      perms = typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions;
    } catch (e) {}
    setStaffForm({
      name: s.name,
      role: s.role,
      permissions: perms || [],
      login_id: s.login_id || "",
      password: ""
    });
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
      setSuccess("Staff deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePermission = (permId: string) => {
    setStaffForm(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const handleExportData = async () => {
    try {
      const dbUrl = "/api/products"; // Using products as a proxy for export for now
      const res = await apiFetch(dbUrl);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "minimart_export.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setSuccess("Data exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your store preferences, staff roles, and system backups.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation/Sidebar could go here if we expand settings */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="bg-[#0a111a]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                <Users size={24} />
              </div>
              <h2 className="text-xl font-light tracking-wide text-white">Staff Management</h2>
            </div>
            
            {(user?.subscription_tier !== 'Enterprise') ? (
              <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-2xl border border-white/5">
                 <Shield size={40} className="text-slate-500 mb-4" />
                 <h3 className="text-lg font-medium text-white mb-2">Enterprise Feature</h3>
                 <p className="text-slate-400 text-sm mb-6 text-center max-w-sm">Managing staff members and defining role-based access control is only available on the Enterprise tier.</p>
                 <a href="/subscription" className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-5 py-2.5 rounded-xl font-medium hover:bg-blue-500/30 transition-colors">Upgrade to Enterprise</a>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-slate-400 text-sm font-light">Create and manage staff accounts for your store. Assign roles to restrict access to sensitive features like inventory and settings.</p>
                  <button onClick={() => {
                    setEditingStaffId(null);
                    setStaffError("");
                    setStaffForm({ name: "", role: "", permissions: [], login_id: "", password: "" });
                    setIsStaffModalOpen(true);
                  }} className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-xl text-blue-300 font-medium transition-colors border border-blue-500/30">
                    <Plus size={18} />
                    Add Staff
                  </button>
                </div>

                <div className="space-y-4">
                  {staff.length === 0 ? (
                    <div className="bg-[#0a111a]/40 rounded-xl p-8 text-center border border-white/5">
                      <p className="text-slate-500 text-sm">No staff members found.</p>
                    </div>
                  ) : (
                    staff.map(s => (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#131e2d] border border-white/5 rounded-xl p-4 shadow-sm">
                        <div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {s.name}
                            {s.login_id && <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 font-bold tracking-wider">ID: {s.login_id}</span>}
                          </div>
                          <div className="text-sm text-slate-400 capitalize bg-clip-text mt-0.5">{s.role}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                          <button onClick={() => handleEditStaff(s)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteStaff(s.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-[#0a111a]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 border border-emerald-500/20">
                <Shield size={24} />
              </div>
              <h2 className="text-xl font-light tracking-wide text-white">Store Configuration</h2>
            </div>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Store Name</label>
                <input type="text" value={storeSettings.store_name} onChange={(e) => setStoreSettings({...storeSettings, store_name: e.target.value})} className="w-full bg-[#0a111a]/60 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Currency Symbol</label>
                <select value={storeSettings.currency_symbol} onChange={(e) => setStoreSettings({...storeSettings, currency_symbol: e.target.value})} className="w-full bg-[#0a111a]/60 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.symbol}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleSaveSettings} className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-5 py-2.5 rounded-xl transition-colors font-medium border border-emerald-500/30">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-[#0a111a]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/5 p-2 rounded-xl text-slate-300 border border-white/10">
                <Download size={24} />
              </div>
              <h2 className="text-xl font-light tracking-wide text-white">Data Management</h2>
            </div>
            <p className="text-slate-400 mb-6 text-sm font-light">Export all your product and inventory data for backup or accounting purposes.</p>
            <button onClick={handleExportData} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 px-5 py-2.5 rounded-xl transition-colors font-medium">
              <Download size={18} />
              Download Full Backup (JSON)
            </button>
          </div>

        </div>
      </div>

      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">{editingStaffId ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
              {staffError && <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">{staffError}</div>}
            </div>
            <form onSubmit={handleStaffSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} placeholder="Staff Name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} placeholder="e.g. Cashier, Manager" />
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                   <h3 className="text-sm font-semibold text-white tracking-widest uppercase">Login Credentials</h3>
                   <button type="button" onClick={generateCredentials} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 font-bold">Generate</button>
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Login ID</label>
                    <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={staffForm.login_id} onChange={e => setStaffForm({...staffForm, login_id: e.target.value})} placeholder="e.g. ALICE123" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Password</label>
                    <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} placeholder={editingStaffId ? "(leave empty to keep)" : "Password"} required={!editingStaffId} />
                  </div>
                </div>
                <p className="text-[10px] text-amber-500/80 mt-3 relative z-10 font-medium">Please copy these credentials and provide them to your staff member. The password will be hashed and cannot be viewed later.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Permissions</label>
                <div className="space-y-3">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${staffForm.permissions.includes(perm.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 group-hover:border-white/40'}`}>
                        {staffForm.permissions.includes(perm.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{perm.label}</span>
                      <input type="checkbox" className="hidden" checked={staffForm.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-colors">
                  {editingStaffId ? 'Save Changes' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
