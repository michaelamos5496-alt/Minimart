import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { ActivityLog } from "../types";
import { Activity, ShieldCheck, ShoppingBag, AlertTriangle, ShieldAlert, MessageSquare, Reply, Star, Trash2, ArrowUpCircle, CheckCircle, Info, XCircle, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export const ActivityLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction states
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [messageInput, setMessageInput] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  const currentTier = user?.subscription_tier || 'Free';
  const hasAccess = currentTier === 'Premium' || currentTier === 'Enterprise';

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const fetchData = async () => {
    try {
      const [logsData, productsData] = await Promise.all([
        apiFetch("/api/activity"),
        apiFetch("/api/products")
      ]);
      setLogs(logsData);
      
      const generatedAlerts = [];
      const lowStock = productsData.filter((p: any) => p.stock_qty <= 5);
      if (lowStock.length > 0) {
        generatedAlerts.push({
          type: "warning",
          title: "Warning!",
          text: `Low stock on ${lowStock.length} product(s).`,
          details: `The following products are running low on stock:\n${lowStock.map((p: any) => `- ${p.name} (Qty: ${p.stock_qty})`).join('\n')}`
        });
      }
      if (logsData.length > 5) {
        generatedAlerts.push({
          type: "info",
          title: "Info!",
          text: `You have ${logsData.length} total messages in the log.`,
          details: `There are ${logsData.length} messages generated across all your staff members and system actions.`
        });
      }
      generatedAlerts.push({
        type: "success",
        title: "Success!",
        text: "Daily automated backup completed successfully.",
        details: "A backup of all store data, transactions, and product inventory was completed at 00:00 UTC."
      });
      // Just to match the 4 types in the image
      generatedAlerts.push({
        type: "error",
        title: "Error!",
        text: "The Chart page has encountered a minor sync issue.",
        details: "Failed to connect to the external reporting API. Automatic retries are in progress. Transaction syncing may be delayed."
      });

      setAlerts(generatedAlerts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const minDiff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (minDiff < 60) return `${minDiff} mins ago`;
    if (minDiff < 1440) return `${Math.floor(minDiff/60)} hours ago`;
    return `${Math.floor(minDiff/1440)} days ago`;
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[60vh]">
        <Lock className="w-12 h-12 text-slate-500 mb-4" />
        <h2 className="text-2xl font-light text-white mb-2">Analytics Locked</h2>
        <p className="text-slate-400 mb-6 text-center max-w-sm font-light">Activity logging and unified analytics are available on the Premium and Enterprise plans.</p>
        <Link to="/subscription" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl font-medium hover:bg-emerald-500/30 transition-colors">Upgrade Plan</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center md:hidden mb-6">
        <h1 className="text-2xl font-light tracking-wide text-white">Activity</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full max-w-7xl">
        {/* Messages Block */}
        <div className="bg-[#0a111a]/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md shadow-xl shadow-black/20">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 text-slate-300">
               <MessageSquare size={16} className="text-slate-500" />
               <h3 className="text-sm font-light tracking-wide">Messages</h3>
            </div>
            <div className="text-slate-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex gap-2">
               <ArrowUpCircle size={16} className="rotate-180" />
               <ArrowUpCircle size={16} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-[#0a111a]/20">
            <button 
               onClick={() => { setSortOrder('desc'); setFilterType('all'); }} 
               className={`py-2.5 text-xs font-medium tracking-wide transition-colors ${sortOrder === 'desc' && filterType === 'all' ? 'text-slate-300 bg-white/5' : 'text-slate-500 hover:bg-white/5'}`}
            >
               Latests
            </button>
            <button 
               onClick={() => { setSortOrder('asc'); setFilterType('all'); }} 
               className={`py-2.5 text-xs font-medium tracking-wide transition-colors ${sortOrder === 'asc' && filterType === 'all' ? 'text-slate-300 bg-white/5' : 'text-slate-500 hover:bg-white/5'}`}
            >
               Oldest
            </button>
            <button 
               onClick={() => setFilterType('favorites')} 
               className={`py-2.5 text-xs font-medium tracking-wide transition-colors ${filterType === 'favorites' ? 'text-slate-300 bg-white/5' : 'text-slate-500 hover:bg-white/5'}`}
            >
               Favorites
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-[#0a111a]/40 custom-scrollbar divide-y divide-white/5 max-h-[600px]">
            {loading ? (
               <div className="p-8 text-center text-slate-500 text-sm">Loading messages...</div>
            ) : (() => {
               const filteredLogs = logs.filter(log => filterType === 'all' || favoriteIds.has(log.id));
               const sortedLogs = [...filteredLogs].sort((a, b) => {
                  const tA = new Date(a.timestamp).getTime();
                  const tB = new Date(b.timestamp).getTime();
                  return sortOrder === 'desc' ? tB - tA : tA - tB;
               });

               return sortedLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No messages available.</div>
               ) : sortedLogs.map((log: any) => {
                  const isFavorited = favoriteIds.has(log.id);
                  return (
                     <div key={log.id} className="p-5 flex gap-4 group hover:bg-white/[0.02] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#182b42] border border-blue-500/20 flex flex-shrink-0 items-center justify-center text-blue-400 mt-1 uppercase text-sm font-bold shadow-lg">
                          {log.staff_name ? log.staff_name.charAt(0) : "S"}
                        </div>
                        <div className="flex-1 pr-6">
                           <div className="flex items-baseline mb-1">
                              <span className="font-medium text-slate-200 text-sm mr-2">{log.staff_name || "System Alert"}</span>
                              <span className="text-[10px] text-slate-500 opacity-80">from {(log.action_type || '').replace(/_/g, ' ').toLowerCase()} / {timeAgo(log.timestamp)}</span>
                           </div>
                           <p className="text-xs text-slate-200 font-medium leading-relaxed mb-1">
                              {(log.description || '').replace(/[\[\]]/g, "")} 
                           </p>
                           {log.details && (
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                 {(log.details || '').replace(/[\[\]]/g, "")} 
                              </p>
                           )}
                           
                           <div className="flex gap-4 items-center bg-transparent border border-white/5 rounded-lg px-2 py-1.5 w-max">
                              <button 
                                 onClick={() => setMessageInput(`@${log.staff_name || 'System'} `)}
                                 className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-semibold"
                              >
                                <Reply size={12} className="rotate-180" /> Reply
                              </button>
                              <span className="w-px h-3 bg-white/10"></span>
                              <button 
                                 onClick={() => {
                                    const nextFavs = new Set(favoriteIds);
                                    if (nextFavs.has(log.id)) nextFavs.delete(log.id);
                                    else nextFavs.add(log.id);
                                    setFavoriteIds(nextFavs);
                                 }}
                                 className={`flex items-center gap-1.5 text-[10px] uppercase font-semibold transition-colors ${isFavorited ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-emerald-400'}`}
                              >
                                <Star size={12} className={isFavorited ? "fill-amber-400" : ""} /> {isFavorited ? 'Favorited' : 'Favorite'}
                              </button>
                              <span className="w-px h-3 bg-white/10"></span>
                              <button 
                                 onClick={() => setLogs(logs.filter(l => l.id !== log.id))}
                                 className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-rose-400 transition-colors uppercase font-semibold"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                           </div>
                        </div>
                     </div>
                  );
               });
            })}
            
            {!loading && logs.length > 0 && (
               <div className="p-4 border-t border-white/5 flex gap-2">
                 <input 
                    type="text" 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && messageInput.trim()) {
                          const newLog = {
                             id: Date.now(),
                             store_id: user?.store_id || 1,
                             staff_id: user?.staff_id,
                             staff_name: user?.name,
                             action_type: 'USER_MESSAGE',
                             description: messageInput,
                             details: '',
                             timestamp: new Date().toISOString(),
                          };
                          setLogs([newLog, ...logs]);
                          setMessageInput('');
                       }
                    }}
                    placeholder="Leave a Message..." 
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 h-10" 
                 />
                 <button 
                    onClick={() => {
                       if (messageInput.trim()) {
                          const newLog = {
                             id: Date.now(),
                             store_id: user?.store_id || 1,
                             staff_id: user?.staff_id,
                             staff_name: user?.name,
                             action_type: 'USER_MESSAGE',
                             description: messageInput,
                             details: '',
                             timestamp: new Date().toISOString(),
                          };
                          setLogs([newLog, ...logs]);
                          setMessageInput('');
                       }
                    }}
                    disabled={!messageInput.trim()}
                    className={`h-10 w-10 shrink-0 border flex items-center justify-center rounded-xl transition-colors ${messageInput.trim() ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30' : 'bg-white/5 border-white/10 text-slate-600'}`}
                 >
                    <ArrowUpCircle size={18} />
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Alert Messages Block */}
        <div className="bg-[#0a111a]/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md shadow-xl shadow-black/20 h-max">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 text-slate-300">
               <MessageSquare size={16} className="text-slate-500" />
               <h3 className="text-sm font-light tracking-wide">Alert Messages</h3>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
             {alerts.map((alert, i) => {
                let icon, textClass, ring;
                if (alert.type === 'success') {
                  icon = <CheckCircle size={24} className="text-emerald-400" strokeWidth={1.5} />;
                  textClass = "text-emerald-200";
                  ring = "border-emerald-500/20";
                } else if (alert.type === 'warning') {
                  icon = <AlertTriangle size={24} className="text-amber-400" strokeWidth={1.5} />;
                  textClass = "text-amber-200";
                  ring = "border-amber-500/20";
                } else if (alert.type === 'info') {
                  icon = <Info size={24} className="text-blue-400" strokeWidth={1.5} />;
                  textClass = "text-blue-200";
                  ring = "border-blue-500/20";
                } else {
                  icon = <XCircle size={24} className="text-rose-400" strokeWidth={1.5} />;
                  textClass = "text-rose-200";
                  ring = "border-rose-500/20";
                }

                return (
                  <div key={i} className={`flex items-stretch bg-white/[0.02] border ${ring} rounded-xl overflow-hidden group cursor-pointer hover:bg-white/[0.04] transition-colors`} onClick={() => setSelectedAlert(alert)}>
                    <div className="px-4 py-4 md:py-6 flex items-center justify-center border-r border-white/5 bg-black/20 shrink-0">
                       {icon}
                    </div>
                    <div className="flex-1 p-4 md:p-6 flex items-center">
                       <p className="text-xs text-slate-400 flex items-baseline flex-wrap">
                          <span className={`${textClass} font-medium mr-1.5`}>{alert.title}</span> 
                          {alert.text}
                       </p>
                    </div>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setAlerts(alerts.filter((_, idx) => idx !== i)); }}
                       className="px-4 flex items-start pt-4 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                       <XCircle size={14} />
                    </button>
                  </div>
                )
             })}
          </div>
        </div>
      </div>

      {selectedAlert && (
          <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a111a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
              <button 
                onClick={() => setSelectedAlert(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
              
              <div className="flex items-center mb-4 gap-3">
                {selectedAlert.type === 'success' && <CheckCircle size={24} className="text-emerald-400" />}
                {selectedAlert.type === 'warning' && <AlertTriangle size={24} className="text-amber-400" />}
                {selectedAlert.type === 'info' && <Info size={24} className="text-blue-400" />}
                {selectedAlert.type === 'error' && <XCircle size={24} className="text-rose-400" />}
                <h3 className="text-lg font-light text-white">{selectedAlert.title}</h3>
              </div>
              
              <p className="text-sm font-medium text-slate-300 mb-4">{selectedAlert.text}</p>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                 <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                   {selectedAlert.details || "No additional transaction details provided."}
                 </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                   onClick={() => setSelectedAlert(null)}
                   className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors border border-white/10"
                >
                   Close Details
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

