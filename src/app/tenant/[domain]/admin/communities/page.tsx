"use client"

import * as React from "react"
import { Plus, Users, MapPin, Globe, X, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"

type Community = {
  id: number;
  name: string;
  type: string;
  members: number;
  location: string;
  status: string;
  image: string;
  description: string;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = React.useState<Community[]>([
    { id: 1, name: "New York Alumni Chapter", type: "Regional", members: 1240, location: "New York, NY", status: "Active", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800", description: "The official alumni chapter for graduates living in the greater New York City area." },
    { id: 2, name: "Women in Tech", type: "Interest Group", members: 850, location: "Global", status: "Active", image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800", description: "A network supporting female alumni in the technology and engineering sectors." },
    { id: 3, name: "London Chapter", type: "Regional", members: 320, location: "London, UK", status: "Active", image: "https://images.unsplash.com/photo-1513635269975-5969336cd101?auto=format&fit=crop&q=80&w=800", description: "Connecting alumni across the United Kingdom for networking and social events." },
  ]);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCommunity, setSelectedCommunity] = React.useState<Community | null>(null);
  
  const [newName, setNewName] = React.useState("");
  const [newType, setNewType] = React.useState("Regional");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    setCommunities([{
      id: Date.now(),
      name: newName,
      type: newType,
      members: 1,
      location: "TBD",
      status: "Active",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
      description: "A newly created community group."
    }, ...communities]);
    
    setNewName("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Communities</h1>
          <p className="text-slate-500 text-sm mt-1">Manage regional chapters and special interest groups</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Community
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {communities.map(community => (
            <div 
              key={community.id} 
              onClick={() => setSelectedCommunity(community)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            >
               <div className="h-32 w-full relative bg-slate-100 overflow-hidden">
                  <img src={community.image} alt={community.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md p-2 rounded-lg text-white shadow-sm border border-white/20">
                     {community.type === 'Regional' ? <MapPin className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  </div>
               </div>
               
               <div className="p-5 flex flex-col flex-1 relative">
                  <div className="absolute -top-4 right-5">
                     <span className="px-2.5 py-1 bg-white shadow-sm border border-slate-200 text-slate-600 text-[10px] uppercase font-bold tracking-wider rounded-full">
                        {community.type}
                     </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-slate-900 mb-1 leading-tight pt-1">{community.name}</h3>
                  <p className="text-sm text-slate-500 mb-6">{community.location}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                     <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span><strong>{community.members.toLocaleString()}</strong> members</span>
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Detailed Community View */}
      <AnimatePresence>
         {selectedCommunity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedCommunity(null)} />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                  className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="relative h-48 w-full shrink-0">
                     <img src={selectedCommunity.image} alt={selectedCommunity.name} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                     <button onClick={() => setSelectedCommunity(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors">
                        <X className="h-5 w-5" />
                     </button>
                     <div className="absolute bottom-6 left-6">
                        <h2 className="text-3xl font-bold text-white leading-tight mb-2">{selectedCommunity.name}</h2>
                        <div className="flex items-center gap-4 text-white/80 text-sm">
                           <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedCommunity.location}</span>
                           <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {selectedCommunity.members} Members</span>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 overflow-y-auto">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                           <div>
                              <h3 className="text-lg font-semibold text-slate-900 mb-2">About</h3>
                              <p className="text-slate-600 leading-relaxed text-sm">
                                 {selectedCommunity.description}
                              </p>
                           </div>
                           
                           <div className="space-y-3">
                              <h3 className="text-lg font-semibold text-slate-900 mb-2">Recent Activity</h3>
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                                 <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0"><Calendar className="h-5 w-5" /></div>
                                 <div>
                                    <p className="font-medium text-slate-900 text-sm">Upcoming Event</p>
                                    <p className="text-slate-500 text-sm">Fall Networking Mixer is scheduled for next week.</p>
                                 </div>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                                 <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0"><MessageSquare className="h-5 w-5" /></div>
                                 <div>
                                    <p className="font-medium text-slate-900 text-sm">New Discussion</p>
                                    <p className="text-slate-500 text-sm">"Hiring trends in 2026" by Sarah Smith.</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-900 text-sm mb-3">Community Admin</h4>
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600">JD</div>
                                 <div>
                                    <p className="text-sm font-medium text-slate-900">John Doe</p>
                                    <p className="text-xs text-slate-500">President</p>
                                 </div>
                              </div>
                           </div>
                           <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors">
                              Message Admin
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Create Community</h3>
                <p className="text-sm text-slate-500">Launch a new chapter or group.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Community Name</label>
                  <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Finance Alumni Network" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Type</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300">
                     <option value="Regional">Regional Chapter</option>
                     <option value="Interest Group">Interest Group</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Launch Community</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
