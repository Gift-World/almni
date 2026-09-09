"use client"

import * as React from "react"
import { ArrowRight, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"

export default function MentorshipPage() {
  const [pendingRequests, setPendingRequests] = React.useState([
    { id: 1, mentee: "James Ouko", class: "2026", goal: "Career Guidance", requestedMentor: "Jane Mwangi", industry: "Tech", date: "2 days ago" },
    { id: 2, mentee: "Alice Wanjiru", class: "2025", goal: "Resume Review", requestedMentor: "Open Match", industry: "Finance", date: "3 days ago" },
  ]);

  const [activeMentorships, setActiveMentorships] = React.useState([
    { id: 3, mentor: "David Ochieng", mentee: "Brian Kimani", status: "Active (Month 2)", lastMeeting: "Oct 1" },
    { id: 4, mentor: "Michael Kiprono", mentee: "Sarah Anyango", status: "Active (Month 1)", lastMeeting: "Oct 5" },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mentor, setMentor] = React.useState("");
  const [mentee, setMentee] = React.useState("");

  const handleApprove = (id: number) => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;
    
    setActiveMentorships([{
      id: Date.now(),
      mentor: req.requestedMentor === "Open Match" ? "Matched Mentor" : req.requestedMentor,
      mentee: req.mentee,
      status: "Just Started",
      lastMeeting: "-"
    }, ...activeMentorships]);
    
    setPendingRequests(pendingRequests.filter(r => r.id !== id));
  };

  const handleDecline = (id: number) => {
    setPendingRequests(pendingRequests.filter(r => r.id !== id));
  };

  const handleManualMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor || !mentee) return;
    
    setActiveMentorships([{
      id: Date.now(),
      mentor,
      mentee,
      status: "Just Started",
      lastMeeting: "-"
    }, ...activeMentorships]);
    
    setMentor("");
    setMentee("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mentorship Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Match students and recent graduates with established alumni</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Manual Match
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <section>
               <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Pending Requests (Requires Action)</h2>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[100px]">
                  {pendingRequests.length === 0 ? (
                     <div className="p-8 text-center text-slate-500 text-sm">No pending requests right now.</div>
                  ) : (
                     <div className="divide-y divide-slate-100">
                        {pendingRequests.map(req => (
                           <div key={req.id} className="p-5 flex items-start justify-between hover:bg-slate-50/50 transition-colors">
                              <div className="flex gap-4">
                                 <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 shrink-0">
                                    {req.mentee.charAt(0)}
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <h4 className="font-medium text-slate-900">{req.mentee}</h4>
                                       <span className="text-xs text-slate-500">Class of {req.class}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">Goal: <span className="font-medium text-slate-900">{req.goal}</span></p>
                                    <p className="text-xs text-slate-500">Requested: {req.requestedMentor} • {req.date}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => handleDecline(req.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Decline">
                                    <XCircle className="h-5 w-5" />
                                 </button>
                                 <button onClick={() => handleApprove(req.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Approve Match">
                                    <CheckCircle2 className="h-5 w-5" />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </section>

            <section>
               <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Active Mentorships</h2>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                           <th className="px-6 py-4 font-medium text-slate-500">Mentor</th>
                           <th className="px-6 py-4 font-medium text-slate-500">Mentee</th>
                           <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                           <th className="px-6 py-4 font-medium text-slate-500 text-right">Last Meeting</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {activeMentorships.map(match => (
                           <tr key={match.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900">{match.mentor}</td>
                              <td className="px-6 py-4 text-slate-600">{match.mentee}</td>
                              <td className="px-6 py-4">
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                    {match.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500">{match.lastMeeting}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </section>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md">
               <h3 className="font-semibold mb-2">Mentorship Program</h3>
               <p className="text-slate-400 text-sm mb-6">Your mentorship program is currently active. 642 alumni have opted in as mentors.</p>
               <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                     <span className="text-sm text-slate-300">Available Mentors</span>
                     <span className="font-bold">642</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                     <span className="text-sm text-slate-300">Active Pairings</span>
                     <span className="font-bold text-emerald-400">{activeMentorships.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-300">Avg. Duration</span>
                     <span className="font-bold">4.2 mos</span>
                  </div>
               </div>
               <button className="w-full mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  Program Settings <ArrowRight className="h-4 w-4" />
               </button>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Manual Match</h3>
                <p className="text-sm text-slate-500">Pair an alumni mentor with a mentee directly.</p>
              </div>
              <form onSubmit={handleManualMatch} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Select Mentor</label>
                  <input type="text" required value={mentor} onChange={(e) => setMentor(e.target.value)} placeholder="Search mentors..." className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Select Mentee</label>
                  <input type="text" required value={mentee} onChange={(e) => setMentee(e.target.value)} placeholder="Search mentees..." className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Create Pair</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
