import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const [loginType, setLoginType] = useState<"owner" | "staff">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Regardless of loginType, our backend routes based on email format (e.g., contains @ or not)
      // but strictly validating here can improve UX.
      if (loginType === "owner" && !email.includes("@")) {
        throw new Error("Store Owners use an email address to log in.");
      }
      if (loginType === "staff" && email.includes("@")) {
        throw new Error("Staff members use a Staff ID string, not an email.");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to login");

      login(data.token, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent text-slate-100 p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full bg-[#0a111a]/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.3)] mx-auto mb-6">
          <span className="font-bold text-3xl">M</span>
        </div>
        <h1 className="text-2xl font-light text-center text-white mb-2 tracking-wide">STORE KEEPER</h1>
        <p className="text-center text-slate-400 mb-6 text-sm tracking-wide">Sign in to your workspace</p>
        
        <div className="flex bg-black/40 rounded-xl p-1 mb-8 border border-white/5">
          <button 
            onClick={() => { setLoginType("owner"); setEmail(""); setPassword(""); setError(""); }} 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${loginType === 'owner' ? 'bg-[#182b42] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Store Owner
          </button>
          <button 
            onClick={() => { setLoginType("staff"); setEmail(""); setPassword(""); setError(""); }} 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${loginType === 'staff' ? 'bg-[#182b42] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Staff Login
          </button>
        </div>

        {error && <div className="p-3 mb-4 text-xs tracking-wide font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              {loginType === "owner" ? "Email Address" : "Staff ID"}
            </label>
            <input
              type={loginType === "owner" ? "email" : "text"}
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-black/40 transition-colors text-white placeholder-slate-600 text-sm"
              placeholder={loginType === "owner" ? "owner@example.com" : "e.g. STAFF123"}
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-black/40 transition-colors text-white placeholder-slate-600 text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-xl py-3 text-sm font-medium transition-all mt-4 flex justify-center items-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        {loginType === "owner" && (
          <p className="mt-8 text-center text-xs text-slate-500 tracking-wide font-medium">
            Don't have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors ml-1">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
};

