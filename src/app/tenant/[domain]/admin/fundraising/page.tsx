"use client"

import * as React from "react"
import { Plus, TrendingUp, DollarSign, Target, Users } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"

export default function FundraisingPage() {
  const [campaigns, setCampaigns] = React.useState([
    { id: 1, title: "Annual Alumni Fund 2026", goal: 1000000, raised: 750000, donors: 1240, status: "Active", daysLeft: 45 },
    { id: 2, title: "Engineering Innovation Lab", goal: 500000, raised: 480000, donors: 85, status: "Active", daysLeft: 12 },
    { id: 3, title: "Scholarship Endowment", goal: 2000000, raised: 250000, donors: 312, status: "Active", daysLeft: 120 },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [goal, setGoal] = React.useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !goal) return;
    
    setCampaigns([{
      id: Date.now(),
      title,
      goal: parseInt(goal),
      raised: 0,
      donors: 0,
      status: "Active",
      daysLeft: 90
    }, ...campaigns]);
    
    setTitle("");
    setGoal("");
    setIsModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const totalRaised = campaigns.reduce((acc, curr) => acc + curr.raised, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Fundraising</h1>
          <p className="text-slate-500 text-sm mt-1">Manage campaigns, track donations, and engage major donors</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
               <DollarSign className="h-4 w-4" />
               <span className="text-sm font-medium">Total Raised (YTD)</span>
            </div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-semibold tracking-tight text-slate-900">{formatCurrency(totalRaised)}</span>
               <span className="text-xs font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> 12% vs last year
               </span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
               <Users className="h-4 w-4" />
               <span className="text-sm font-medium">Unique Donors</span>
            </div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-semibold tracking-tight text-slate-900">3,842</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
               <Target className="h-4 w-4" />
               <span className="text-sm font-medium">Active Campaigns</span>
            </div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-semibold tracking-tight text-slate-900">{campaigns.length}</span>
            </div>
         </div>
      </div>

      <section>
         <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Active Campaigns</h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map(campaign => {
               const progress = (campaign.raised / campaign.goal) * 100;
               return (
                  <div key={campaign.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-slate-900">{campaign.title}</h3>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                           {campaign.daysLeft} days left
                        </span>
                     </div>
                     <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                           <span className="font-medium text-slate-900">{formatCurrency(campaign.raised)}</span>
                           <span className="text-slate-500">Goal: {formatCurrency(campaign.goal)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                           <span>{progress.toFixed(1)}% funded</span>
                        </div>
                     </div>
                     <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                           <Users className="h-4 w-4 text-slate-400" />
                           <span>{campaign.donors.toLocaleString()} donors</span>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">New Campaign</h3>
                <p className="text-sm text-slate-500">Start a new fundraising drive.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Campaign Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Science Wing Renovation" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Goal Amount ($)</label>
                  <input type="number" required value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 50000" min="1" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Launch Campaign</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
