"use client"

import * as React from "react"
import { Plus, Search, Filter, BookOpen, MoreHorizontal, Users } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"

export default function SegmentsPage() {
  const [segments, setSegments] = React.useState([
    { id: 1, name: "High-Value Donors (NYC)", criteria: "Location: NYC, Total Given > $10k", members: 420, lastUpdated: "Today" },
    { id: 2, name: "Recent Grads (Tech)", criteria: "Class: 2020-2024, Industry: Tech", members: 1250, lastUpdated: "Yesterday" },
    { id: 3, name: "Unengaged Alumni", criteria: "No Event RSVP in 3 years", members: 8400, lastUpdated: "2 days ago" },
  ]);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newSegmentName, setNewSegmentName] = React.useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName) return;
    
    setSegments([{
      id: Date.now(),
      name: newSegmentName,
      criteria: "Custom Criteria (Draft)",
      members: 0,
      lastUpdated: "Just now"
    }, ...segments]);
    
    setNewSegmentName("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dynamic Segments</h1>
          <p className="text-slate-500 text-sm mt-1">Create rules-based lists that update automatically</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Segment
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
               <BookOpen className="h-4 w-4" />
               <span className="text-sm font-medium">Active Segments</span>
            </div>
            <span className="text-3xl font-semibold tracking-tight text-slate-900">{segments.length}</span>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Segment Name</th>
                <th className="px-6 py-4 font-medium text-slate-500">Criteria Rules</th>
                <th className="px-6 py-4 font-medium text-slate-500">Audience Size</th>
                <th className="px-6 py-4 font-medium text-slate-500">Last Updated</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.map((segment) => (
                <tr key={segment.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 font-medium text-slate-900">{segment.name}</td>
                  <td className="px-6 py-4 text-slate-500">
                     <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {segment.criteria}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 text-slate-600">
                        <Users className="h-4 w-4 text-slate-400" />
                        {segment.members.toLocaleString()}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{segment.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                     <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Create New Segment</h3>
                <p className="text-sm text-slate-500">Define a dynamic audience for targeted campaigns.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Segment Name</label>
                  <input 
                    type="text" 
                    required
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    placeholder="e.g. STEM Graduates 2020-2024"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Criteria Builder (Preview)</label>
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center text-center bg-slate-50">
                     <Filter className="h-6 w-6 text-slate-300 mb-2" />
                     <p className="text-sm text-slate-500">Visual rules engine will load here.</p>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
                  >
                    Save Segment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
