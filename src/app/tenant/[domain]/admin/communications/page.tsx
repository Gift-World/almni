"use client"

import * as React from "react"
import { Plus, Mail, Clock, Send, FileEdit, X, MousePointerClick, Eye, Users } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"

type Email = {
  id: number;
  subject: string;
  audience: string;
  status: string;
  date: string;
  openRate: string;
  clickRate: string;
  delivered: number;
  contentSnippet: string;
}

export default function CommunicationsPage() {
  const [emails, setEmails] = React.useState<Email[]>([
    { id: 1, subject: "Alumni Newsletter - Q4 2026", audience: "All Alumni", status: "Sent", date: "Yesterday", openRate: "48%", clickRate: "12%", delivered: 24500, contentSnippet: "Welcome to the final newsletter of 2026! We have some exciting updates regarding the new campus expansion..." },
    { id: 2, subject: "Invitation: Tech Networking Mixer", audience: "Recent Grads (Tech)", status: "Scheduled", date: "Tomorrow, 10:00 AM", openRate: "-", clickRate: "-", delivered: 1250, contentSnippet: "You are invited to an exclusive tech networking event featuring founders from leading startups." },
    { id: 3, subject: "Giving Tuesday Appeal", audience: "High-Value Donors", status: "Draft", date: "-", openRate: "-", clickRate: "-", delivered: 0, contentSnippet: "Your support has never been more critical. This Giving Tuesday, we ask you to consider..." },
  ]);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);
  
  const [subject, setSubject] = React.useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;
    
    setEmails([{
      id: Date.now(),
      subject: subject,
      audience: "Select Audience",
      status: "Draft",
      date: "-",
      openRate: "-",
      clickRate: "-",
      delivered: 0,
      contentSnippet: "No content yet. Click edit to begin writing."
    }, ...emails]);
    
    setSubject("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Communications</h1>
          <p className="text-slate-500 text-sm mt-1">Manage email campaigns and newsletters</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Email
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">Subject</th>
              <th className="px-6 py-4 font-medium text-slate-500">Audience</th>
              <th className="px-6 py-4 font-medium text-slate-500">Status</th>
              <th className="px-6 py-4 font-medium text-slate-500">Date</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-right">Open Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emails.map((email) => (
              <tr 
                key={email.id} 
                onClick={() => setSelectedEmail(email)}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                   <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <Mail className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                      {email.subject}
                   </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{email.audience}</td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                     email.status === 'Sent' ? 'bg-emerald-50 text-emerald-700' :
                     email.status === 'Scheduled' ? 'bg-amber-50 text-amber-700' :
                     'bg-slate-100 text-slate-700'
                   }`}>
                      {email.status === 'Sent' && <Send className="h-3 w-3 mr-1" />}
                      {email.status === 'Scheduled' && <Clock className="h-3 w-3 mr-1" />}
                      {email.status === 'Draft' && <FileEdit className="h-3 w-3 mr-1" />}
                      {email.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{email.date}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-700">{email.openRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Email View */}
      <AnimatePresence>
         {selectedEmail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEmail(null)} />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                  className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-white">
                           <Mail className="h-6 w-6" />
                        </div>
                        <div>
                           <h2 className="text-xl font-semibold text-slate-900 leading-tight mb-1">{selectedEmail.subject}</h2>
                           <div className="flex gap-2 items-center text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                                selectedEmail.status === 'Sent' ? 'bg-emerald-50 text-emerald-700' :
                                selectedEmail.status === 'Scheduled' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                 {selectedEmail.status}
                              </span>
                              <span className="text-slate-500">{selectedEmail.date}</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedEmail(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-8">
                     
                     {/* Performance Stats */}
                     {selectedEmail.status === 'Sent' && (
                        <div className="grid grid-cols-3 gap-4">
                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                              <span className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="h-5 w-5 text-slate-400" /> {selectedEmail.delivered.toLocaleString()}</span>
                              <span className="text-xs text-slate-500 font-medium mt-1">Delivered</span>
                           </div>
                           <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                              <span className="text-2xl font-bold text-emerald-700 flex items-center gap-2"><Eye className="h-5 w-5 text-emerald-500" /> {selectedEmail.openRate}</span>
                              <span className="text-xs text-emerald-600 font-medium mt-1">Open Rate</span>
                           </div>
                           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                              <span className="text-2xl font-bold text-blue-700 flex items-center gap-2"><MousePointerClick className="h-5 w-5 text-blue-500" /> {selectedEmail.clickRate}</span>
                              <span className="text-xs text-blue-600 font-medium mt-1">Click Rate</span>
                           </div>
                        </div>
                     )}

                     {/* Content Preview */}
                     <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Content Preview</h3>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                           <div className="flex justify-between items-center mb-4 text-sm text-slate-500 border-b border-slate-200 pb-2">
                              <span><strong>To:</strong> {selectedEmail.audience}</span>
                              <span><strong>From:</strong> Alumni Relations</span>
                           </div>
                           <p className="text-slate-700 font-serif leading-relaxed text-sm">
                              {selectedEmail.contentSnippet}
                           </p>
                           <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent rounded-b-xl" />
                        </div>
                     </div>
                     
                     <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                           <FileEdit className="h-4 w-4" /> {selectedEmail.status === 'Sent' ? 'Duplicate Campaign' : 'Edit Campaign'}
                        </button>
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
                <h3 className="text-lg font-semibold text-slate-900">Create Email Campaign</h3>
                <p className="text-sm text-slate-500">Draft a new newsletter or announcement.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Email Subject Line</label>
                  <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Exciting updates from your Alma Mater!" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Create Draft</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
