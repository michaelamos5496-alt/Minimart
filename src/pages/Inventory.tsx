import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, Package, Search, Filter } from "lucide-react";

export const Inventory = () => {
  const { user } = useAuth();
  const currency = user?.currency_symbol || "$";
  const canManageInventory = !user?.staff_id || (user?.permissions || []).includes('inventory_manage');
  const tier = user?.subscription_tier || 'Free';
  const isStarter = tier === 'Starter' || tier === 'Free';

  const [products, setProducts] = useState<Product[]>([]);
  const canAddProduct = canManageInventory && (!isStarter || products.length < 100);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "", maxPrice: "",
    minStock: "", maxStock: "",
    expiryBefore: "", expiryAfter: "",
    inStockOnly: false
  });
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    cost_price: "",
    stock_qty: "",
    expiry_date: "",
    barcode: ""
  });

  const fetchProducts = async () => {
    try {
      const data = await apiFetch("/api/products");
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price),
      stock_qty: parseInt(formData.stock_qty)
    };

    try {
      if (editingId) {
        await apiFetch(`/api/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (e) {
      alert("Failed to save product");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (e) {
      alert("Failed to delete product");
    }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      price: p.price.toString(),
      cost_price: p.cost_price.toString(),
      stock_qty: p.stock_qty.toString(),
      expiry_date: p.expiry_date || "",
      barcode: p.barcode || ""
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", price: "", cost_price: "", stock_qty: "", expiry_date: "", barcode: "" });
  };

  const filteredProducts = products.filter(p => {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    const searchable = `${p.name} ${p.barcode || ""}`.toLowerCase();
    const hitsSearch = terms.length === 0 || terms.every(term => searchable.includes(term));
    if (!hitsSearch) return false;

    if (filters.minPrice && p.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && p.price > parseFloat(filters.maxPrice)) return false;
    if (filters.minStock && p.stock_qty < parseInt(filters.minStock)) return false;
    if (filters.maxStock && p.stock_qty > parseInt(filters.maxStock)) return false;
    if (filters.inStockOnly && p.stock_qty <= 0) return false;
    if (filters.expiryBefore && p.expiry_date && new Date(p.expiry_date) > new Date(filters.expiryBefore)) return false;
    if (filters.expiryAfter && p.expiry_date && new Date(p.expiry_date) < new Date(filters.expiryAfter)) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
        <div className="flex justify-between items-center bg-[#0a111a]/40 p-4 rounded-2xl shadow-sm border border-white/5 backdrop-blur-md w-full md:w-auto md:bg-transparent md:p-0 md:shadow-none md:border-0 md:rounded-none md:backdrop-blur-none">
           <div className="flex items-center gap-3">
             <Package size={20} className="text-blue-400 md:hidden" />
             <h1 className="text-2xl font-light tracking-wide md:hidden">Inventory</h1>
           </div>
          {canManageInventory && (
            <button
              onClick={() => {
                if (canAddProduct) {
                   resetForm(); setIsModalOpen(true);
                } else {
                   alert("You have reached the 100 product limit on the Starter plan. Please upgrade to add more.");
                }
              }}
              className={`md:hidden ${canAddProduct ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'} px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/10 flex items-center gap-2 ml-auto`}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                className="w-full pl-11 pr-4 py-3 bg-[#0a111a]/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-white placeholder-slate-500 text-sm backdrop-blur-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 bg-[#0a111a]/40 border rounded-2xl transition-colors flex items-center justify-center shrink-0 backdrop-blur-md ${showFilters ? 'border-blue-500/50 text-blue-400' : 'border-white/5 text-slate-400 hover:text-white hover:border-white/20'}`}
            >
              <Filter size={18} />
            </button>
            {canManageInventory && (
              <button
                onClick={() => { 
                   if (canAddProduct) {
                      resetForm(); setIsModalOpen(true); 
                   } else {
                      alert("You have reached the 100 product limit on the Starter plan. Please upgrade to add more.");
                   }
                }}
                className={`hidden md:flex ${canAddProduct ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'} border px-5 py-3 rounded-2xl text-sm font-semibold transition-colors shadow-lg items-center justify-center gap-2 shrink-0 backdrop-blur-md`}
              >
                <Plus size={18} /> Add Product
              </button>
            )}
          </div>

          {showFilters && (
            <div className="p-4 bg-[#0a111a]/40 border border-white/5 rounded-2xl grid grid-cols-2 lg:grid-cols-6 md:grid-cols-3 gap-4 backdrop-blur-md">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Min Price</label>
                <input type="number" placeholder="0.00" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Max Price</label>
                <input type="number" placeholder="0.00" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Min Stock</label>
                <input type="number" placeholder="0" value={filters.minStock} onChange={e => setFilters({...filters, minStock: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Expiry Before</label>
                <input type="date" value={filters.expiryBefore} onChange={e => setFilters({...filters, expiryBefore: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 color-scheme-dark" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Expiry After</label>
                <input type="date" value={filters.expiryAfter} onChange={e => setFilters({...filters, expiryAfter: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 color-scheme-dark" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Stock Status</label>
                <label className="flex items-center gap-2 h-9">
                  <input type="checkbox" checked={filters.inStockOnly} onChange={e => setFilters({...filters, inStockOnly: e.target.checked})} className="rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-300">In Stock Only</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 py-10 text-center">Loading inventory...</div>
      ) : (
        <div className="bg-[#0a111a]/40 border border-white/5 rounded-2xl shadow-xl shadow-black/20 overflow-hidden backdrop-blur-md">
          <div className="flex justify-between items-center p-4 border-b border-white/5">
             <div className="flex items-center gap-2 text-slate-300">
               <Package size={16} className="text-slate-500" />
               <h3 className="text-sm font-medium tracking-wide">Products List</h3>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#182b42]/40 text-slate-400 border-b border-white/5 uppercase tracking-widest text-[10px] font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  {canManageInventory && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={canManageInventory ? 6 : 5} className="text-center py-16 text-slate-400">
                      <Package size={48} className="mx-auto text-slate-600 mb-4" />
                      <p className="text-base font-medium text-slate-300">No products found</p>
                      <p className="text-sm mt-1">Adjust search or add your first product.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {p.name}
                        {p.barcode && <div className="text-xs text-slate-400 mt-1">{p.barcode}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-200">{currency}{p.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-400">{currency}{p.cost_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-200 font-medium">{p.stock_qty}</td>
                      <td className="px-6 py-4">
                        {p.stock_qty <= 5 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400">Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">In Stock</span>
                        )}
                      </td>
                      {canManageInventory && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => openEdit(p)} className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20"><Edit2 size={16} /></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"><Trash2 size={16} /></button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#020617]/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center relative z-10 bg-white/5">
              <h2 className="text-xl font-semibold tracking-tight text-white">{editingId ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Product Name</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Bottled Water" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Selling Price</label>
                  <input type="number" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cost Price</label>
                  <input type="number" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stock Quantity</label>
                  <input type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" value={formData.stock_qty} onChange={e => setFormData({...formData, stock_qty: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Barcode</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expiry Date (Optional)</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 color-scheme-dark" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
