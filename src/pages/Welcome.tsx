import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Store, BarChart3, Users, Zap } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-radial-[at_top_right] from-[#16273b] via-[#0b101a] to-[#040608] text-slate-200 overflow-y-auto">
      {/* Navbar Minimal */}
      <div className="flex items-center justify-between p-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="font-bold text-xl text-emerald-400">M</span>
          </div>
          <span className="font-light tracking-widest text-lg">STORE KEEPER</span>
        </div>
        <button onClick={() => navigate('/pricing')} className="text-emerald-400 hover:text-emerald-300 font-medium text-sm flex items-center gap-2">
          Skip Intro <ArrowRight size={16} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <div className="space-y-8 order-2 lg:order-2 lg:pl-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            <Zap size={14} /> The All-In-One Retail Manager
          </div>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.1]">
            Run Your Entire Business <br/>
            <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">From One Place</span>
          </h1>
          <p className="text-slate-400 text-xl leading-relaxed max-w-xl">
            Store Keeper is a powerful point-of-sale, inventory manager, and analytics engine built to help proactive retail owners scale fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              Get Started <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-lg hover:bg-white/10 transition-all"
            >
              I already have an account
            </button>
          </div>
          
          <div className="flex items-center gap-6 pt-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Free setup</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Cancel anytime</div>
          </div>
        </div>

        {/* Visual Mockup (App Screenshot Representation) */}
        <div className="relative order-1 lg:order-1">
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl rounded-[3rem] -z-10"></div>
          <div className="bg-[#0b121c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-black/50 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
            {/* Window header */}
            <div className="h-10 bg-[#111923] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            {/* Fake Dashboard layout */}
            <div className="p-6 grid grid-cols-4 gap-6">
              <div className="col-span-1 space-y-4 hidden sm:block">
                <div className="h-4 w-2/3 bg-white/5 rounded"></div>
                <div className="h-8 w-full bg-emerald-500/20 rounded border border-emerald-500/30"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
              </div>
              <div className="col-span-4 sm:col-span-3 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="h-24 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-end">
                    <div className="h-3 w-1/2 bg-emerald-500/30 rounded mb-2"></div>
                    <div className="h-6 w-3/4 bg-emerald-400 rounded"></div>
                  </div>
                  <div className="h-24 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-end">
                    <div className="h-3 w-1/2 bg-white/10 rounded mb-2"></div>
                    <div className="h-6 w-1/3 bg-white/20 rounded"></div>
                  </div>
                  <div className="h-24 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-end hidden lg:flex">
                     <div className="h-3 w-1/2 bg-white/10 rounded mb-2"></div>
                     <div className="h-6 w-3/4 bg-white/20 rounded"></div>
                  </div>
                </div>
                <div className="h-48 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-500/20 opacity-50 flex items-end px-4 gap-2 pb-4">
                     {[...Array(12)].map((_, i) => (
                       <div key={i} className="flex-1 bg-emerald-500/40 rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating Element */}
          <div className="absolute -bottom-8 -left-8 bg-[#1a2332] p-4 rounded-xl shadow-xl border border-white/10 flex items-center gap-4 animate-bounce" style={{animationDuration: '3s'}}>
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg"><Store size={24} /></div>
            <div>
              <div className="text-white font-medium text-sm">Sale Completed</div>
              <div className="text-slate-400 text-xs">NGN 24,000</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-[#0b101a]/80 py-24 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-light text-white mb-4">Everything you need to thrive</h2>
            <p className="text-slate-400">Stop juggling multiple apps. We have combined POS, tracking, staff logic, and metrics so you can focus on building your brand.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 flex flex-col items-center justify-center rounded-xl mb-6">
                <Store size={24} />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Lightning-fast POS</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Check out customers in seconds with an intuitive, touch-friendly cash register interface. Supports barcode scanning and quick search.</p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Real-time Analytics</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Know exactly what is selling and what is not. Detailed graphical reports on your best-performing products and peak sales hours.</p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 text-orange-400 flex items-center justify-center rounded-xl mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Staff Controls</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Assign granular permissions to cashiers or managers. Restrict access to settings or inventory deletion to keep parameters secure.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
