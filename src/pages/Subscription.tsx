import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Check, Star, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIERS = [
  {
    name: 'Starter',
    price: '$19',
    description: 'Perfect for small stores just getting started.',
    features: ['Up to 100 products', 'Basic POS functionality', 'Standard Support'],
    icon: Star,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20'
  },
  {
    name: 'Premium',
    price: '$49',
    description: 'For growing businesses running multiple terminal instances.',
    features: ['Unlimited products', 'Advanced Inventory management', 'Analytics Dashboard', 'Priority Support'],
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$149',
    description: 'Advanced features for large retail operations.',
    features: ['Everything in Premium', 'Staff Management (Unlimited)', 'API Access', 'Dedicated Account Manager'],
    icon: Shield,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20'
  }
];

export const Subscription = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tierName: string) => {
    setLoading(tierName);
    try {
      const data = await apiFetch('/api/subscription/upgrade', {
        method: 'POST',
        body: JSON.stringify({ tier: tierName })
      });
      if (data.success) {
        updateUser({ 
          subscription_tier: data.user.subscription_tier, 
          subscription_expiry: data.user.subscription_expiry 
        });
        navigate('/');
      }
    } catch (e) {
      console.error("Upgrade failed:", e);
    } finally {
      setLoading(null);
    }
  };

  const currentTier = user?.subscription_tier || 'Free';

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light tracking-tight text-white mb-4">Subscription Plans</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Upgrade your workspace to unlock advanced point-of-sale features, staff management, and powerful analytics. 
          Currently on the <span className="text-white font-medium">{currentTier}</span> plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TIERS.map((tier) => (
          <div 
            key={tier.name} 
            className={`relative flex flex-col p-8 rounded-3xl bg-[#0a111a]/40 backdrop-blur-md border ${tier.popular ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-white/5 shadow-xl shadow-black/20'} overflow-hidden transition-transform hover:-translate-y-1`}
          >
            {tier.popular && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl z-20">
                Most Popular
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${tier.bg} ${tier.color}`}>
              <tier.icon size={24} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-light tracking-tighter text-white">{tier.price}</span>
              <span className="text-sm text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-400 mb-8 flex-1">{tier.description}</p>
            
            <div className="space-y-4 mb-8">
              {tier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={18} className={tier.color} />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade(tier.name)}
              disabled={loading === tier.name || currentTier === tier.name}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all border
                ${currentTier === tier.name 
                  ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed' 
                  : tier.popular 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30' 
                    : 'bg-[#182b42] border-white/10 text-white hover:bg-white/10'
                }`}
            >
              {loading === tier.name ? 'Processing...' : currentTier === tier.name ? 'Current Plan' : `Upgrade to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
