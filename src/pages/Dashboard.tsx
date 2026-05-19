import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "../lib/api";
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Dashboard = () => {
  const { user } = useAuth();
  const currency = user?.currency_symbol || "$";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const result = await apiFetch("/api/dashboard");
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard...</div>;
  if (!data) return <div>Failed to load data</div>;

  const cards = [
    { title: "Total Sales", value: `${currency}${data.totalSales.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { title: "Inventory Value", value: `${currency}${data.inventoryValue?.toFixed(2) || '0.00'}`, icon: Package, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { title: "Transactions", value: data.totalTransactions, icon: ShoppingBag, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { title: "Low Stock Items", value: data.lowStockCount, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center md:hidden mb-6">
          <h1 className="text-2xl font-light tracking-wide text-white">Dashboard</h1>
        </div>

        {/* Top Resume Section - mimicking glazzed top row styling */}
        <div className="flex flex-col md:flex-row gap-6 bg-[#0a111a]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md items-center">
           <div className="w-full md:w-1/3">
             <h2 className="text-2xl font-light text-slate-200 mb-1">Resume <br/>of the day.</h2>
             <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mt-2">A quick overview of today's core metrics and absolute gross indicators.</p>
           </div>
           <div className="w-full md:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-3 text-center border-l border-white/5 first:border-0 relative group">
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`text-xl md:text-3xl font-light ${card.title === 'Inventory Value' ? 'text-blue-400' : 'text-slate-200'}`}>{card.value}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{card.title}</div>
                </div>
              ))}
           </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-[#0a111a]/40 border border-white/5 rounded-2xl backdrop-blur-md flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-white/5">
            <div className="flex items-center gap-3 text-slate-300">
               <TrendingUp size={16} className="text-slate-500" />
               <h3 className="text-sm font-medium tracking-wide">Statistics</h3>
            </div>
          </div>
          <div className="p-6 h-72 w-full relative z-10">
            {data.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${currency}${v}`} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,17,26,0.9)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                    formatter={(value: number) => [`${currency}${value.toFixed(2)}`, "Sales"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#0ea5e9" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No recent sales data</div>
            )}
          </div>
        </div>

        <div className="bg-[#0a111a]/40 border border-white/5 rounded-2xl backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-white/5">
            <div className="flex items-center gap-3 text-slate-300">
               <ShoppingBag size={16} className="text-slate-500" />
               <h3 className="text-sm font-medium tracking-wide">Recent Sales</h3>
            </div>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {data.recentSales && data.recentSales.length > 0 ? (
              data.recentSales.map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                       <DollarSign size={14} />
                     </div>
                     <div>
                       <div className="font-medium text-xs text-slate-300 group-hover:text-white transition-colors">Receipt #{sale.id.toString().padStart(4, '0')}</div>
                       <div className="text-[10px] text-slate-500 mt-0.5">{new Date(sale.created_at).toLocaleString()}</div>
                     </div>
                  </div>
                  <div className="font-medium text-sm text-slate-300">{currency}{sale.total_amount.toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm p-4 text-center">No recent sales</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
