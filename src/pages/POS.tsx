import React, { useEffect, useState } from "react";
import { Product, CartItem } from "../types";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, PackageOpen, Filter } from "lucide-react";

export const POS = () => {
  const { user } = useAuth();
  const currency = user?.currency_symbol || "$";
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "", maxPrice: "",
    minStock: "", maxStock: "",
    expiryBefore: "", expiryAfter: "",
    inStockOnly: false
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const addToCart = (product: Product) => {
    if (product.stock_qty <= 0) {
      alert("Out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ < 1) return item;
        if (newQ > item.stock_qty) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
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
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = cart.reduce((sum, item) => sum + ((item.cost_price || 0) * item.quantity), 0);
  const profit = totalAmount - totalCost;

  const printReceipt = (items: CartItem[], total: number) => {
    // We cannot reliably use window.print in the iframe, so we'll simulate a receipt or try if possible.
    // Given the constraints of the AI preview environment, a window.open with some HTML might be blocked.
    // We will just do a simple window.open if possible, or show a modal.
    const win = window.open('', '_blank');
    if (!win) {
      alert("Receipt could not be printed. Please allow popups.");
      return;
    }
    
    const receiptHtml = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: auto; }
            .text-center { text-align: center; }
            .flex { display: flex; justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .mt-4 { margin-top: 20px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2 className="text-center">MINIMART OS</h2>
          <div className="text-center border-b">Store Receipt</div>
          ${items.map(i => `
            <div className="flex">
              <span>${i.name} (x${i.quantity})</span>
              <span>${currency}${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div className="flex border-b mt-4">
            <span className="bold">TOTAL</span>
            <span className="bold">${currency}${total.toFixed(2)}</span>
          </div>
          <div className="text-center mt-4">Thank you for shopping!</div>
          <script>
            window.print();
            setTimeout(() => window.close(), 1000);
          </script>
        </body>
      </html>
    `;
    win.document.write(receiptHtml);
    win.document.close();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          items: cart,
          total_amount: totalAmount,
          profit: profit
        })
      });
      alert("Sale completed successfully!");
      printReceipt(cart, totalAmount);
      setCart([]);
      fetchProducts(); // refresh stock
    } catch (e) {
      alert("Checkout failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] gap-6 pb-6">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col bg-[#0a111a]/40 border border-white/5 rounded-3xl shadow-xl shadow-black/20 backdrop-blur-md overflow-hidden relative">
        <div className="p-5 border-b border-white/5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                className="w-full pl-11 pr-4 py-3 bg-[#131e2d] border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-white placeholder-slate-500 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 bg-[#131e2d] border rounded-2xl transition-colors flex items-center justify-center ${showFilters ? 'border-blue-500/50 text-blue-400' : 'border-white/5 text-slate-400 hover:text-white hover:border-white/20'}`}
            >
              <Filter size={18} />
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-[#131e2d] border border-white/5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Availability</label>
                <label className="flex items-center gap-2 h-9">
                  <input type="checkbox" checked={filters.inStockOnly} onChange={e => setFilters({...filters, inStockOnly: e.target.checked})} className="rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-300">In Stock Only</span>
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-5 custom-scrollbar">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock_qty <= 0}
                  className="bg-[#131e2d] border border-white/5 rounded-2xl p-5 text-left hover:bg-white/5 transition-all group disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <div className="font-medium text-slate-200 group-hover:text-white line-clamp-2 min-h-[44px] leading-snug mb-3 relative z-10">{p.name}</div>
                  <div className="text-2xl font-light text-blue-300 mb-2 tracking-tight relative z-10">{currency}{p.price.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 flex justify-between items-center relative z-10 uppercase tracking-widest">
                    <span>Stock: {p.stock_qty}</span>
                    {p.stock_qty <= 0 && <span className="text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-500/20">Out</span>}
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500">
                    <PackageOpen size={48} className="mb-4 opacity-50" />
                    <p>No products found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer/Section */}
      <div className="w-full lg:w-[400px] flex flex-col rounded-3xl shadow-xl shadow-black/20 border border-white/5 backdrop-blur-md shrink-0 overflow-hidden relative bg-[#0a111a]/40">
        
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-light text-slate-200 tracking-wide flex items-center gap-3">
            <ShoppingCart size={18} className="text-blue-400"/> Current Order
          </h2>
          <div className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{cart.length} items</div>
        </div>
        
        <div className="flex-1 overflow-auto p-5 space-y-3 relative z-10 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <ShoppingCart size={28} className="text-slate-600" />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="flex justify-between font-medium">
                  <span className="truncate pr-4 text-slate-200">{item.name}</span>
                  <span className="text-white font-bold">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-indigo-400 text-sm">{currency}{item.price.toFixed(2)} ea</div>
                  <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"><Minus size={14}/></button>
                    <span className="font-bold w-6 text-center text-sm text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"><Plus size={14}/></button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-white/10 bg-[#020617]/40 relative z-10 backdrop-blur-xl">
          <div className="flex justify-between items-end mb-5">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Total Amount</span>
            <span className="text-3xl font-bold tracking-tight text-white">{currency}{totalAmount.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500 active:transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-indigo-500/20 disabled:shadow-none"
          >
            <CreditCard size={20} />
            {processing ? "Processing..." : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};
