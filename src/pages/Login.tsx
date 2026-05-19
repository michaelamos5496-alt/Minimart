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
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] pointer-events-none rounded-full"></div>
      
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-6">
          <span className="font-bold text-2xl text-white">M</span>
        </div>
        <h1 className="text-2xl font-semibold text-center text-white mb-2 tracking-tight">MiniMart OS</h1>
        <p className="text-center text-slate-400 mb-6 text-sm">Sign in to your workspace</p>
        
        <div className="flex bg-black/40 rounded-xl p-1 mb-8 border border-white/5">
          <button 
            onClick={() => { setLoginType("owner"); setEmail(""); setPassword(""); setError(""); }} 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${loginType === 'owner' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Store Owner
          </button>
          <button 
            onClick={() => { setLoginType("staff"); setEmail(""); setPassword(""); setError(""); }} 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${loginType === 'staff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Staff Login
          </button>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {loginType === "owner" ? "Email Address" : "Staff ID"}
            </label>
            <input
              type={loginType === "owner" ? "email" : "text"}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-colors text-white placeholder-slate-500"
              placeholder={loginType === "owner" ? "owner@example.com" : "e.g. STAFF123"}
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-colors text-white placeholder-slate-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 mt-4 flex justify-center items-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        {loginType === "owner" && (
          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account? <Link to="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
};

