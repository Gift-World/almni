"use client"

import * as React from "react"
import { Plus, Briefcase, MapPin, Building, X, Clock, DollarSign, Users, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  posted: string;
  salary: string;
  applicants: number;
  description: string;
  requirements: string[];
}

export default function CareersPage() {
  const [jobs, setJobs] = React.useState<Job[]>([
    { id: 1, title: "Senior Software Engineer", company: "Google", location: "Nairobi, KE", type: "Full-time", posted: "2 days ago", salary: "$120k - $150k", applicants: 45, description: "Join the Google Cloud team in Nairobi to build next-generation infrastructure tools for the African market.", requirements: ["5+ years of Go/Python experience", "Strong system design skills", "Experience with distributed systems"] },
    { id: 2, title: "Product Marketing Manager", company: "Safaricom", location: "Remote", type: "Full-time", posted: "1 week ago", salary: "Confidential", applicants: 112, description: "Lead the go-to-market strategy for our new suite of enterprise fintech products.", requirements: ["B2B marketing experience", "Proven track record of successful launches", "Strong analytical skills"] },
    { id: 3, title: "Investment Banking Analyst", company: "Goldman Sachs", location: "London, UK", type: "Full-time", posted: "2 weeks ago", salary: "£85k + Bonus", applicants: 89, description: "Entry-level analyst position in the TMT (Technology, Media, and Telecom) group.", requirements: ["Strong financial modeling skills", "Excellent academic record", "Prior internship in finance"] },
  ]);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;
    
    setJobs([{
      id: Date.now(),
      title,
      company,
      location: "TBD",
      type: "Full-time",
      posted: "Just now",
      salary: "Not specified",
      applicants: 0,
      description: "Job description pending.",
      requirements: []
    }, ...jobs]);
    
    setTitle("");
    setCompany("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Careers Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Manage the exclusive alumni job board</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Post a Job
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">Role</th>
              <th className="px-6 py-4 font-medium text-slate-500">Company</th>
              <th className="px-6 py-4 font-medium text-slate-500">Location</th>
              <th className="px-6 py-4 font-medium text-slate-500">Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <tr 
                key={job.id} 
                onClick={() => setSelectedJob(job)}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                   <div className="flex flex-col group-hover:text-blue-600 transition-colors">
                      <span className="font-semibold">{job.title}</span>
                      <span className="text-xs text-slate-500 mt-0.5 group-hover:text-blue-500">{job.type}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-slate-700">
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                         <Building className="h-3 w-3 text-slate-500" />
                      </div>
                      {job.company}
                   </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                   <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {job.location}
                   </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{job.posted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Job View */}
      <AnimatePresence>
         {selectedJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                  className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                     <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                           <Building className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                           <h2 className="text-xl font-semibold text-slate-900 leading-tight mb-1">{selectedJob.title}</h2>
                           <p className="text-slate-600 font-medium text-sm mb-3">{selectedJob.company}</p>
                           <div className="flex flex-wrap gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded-md font-medium"><MapPin className="h-3 w-3" /> {selectedJob.location}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded-md font-medium"><Briefcase className="h-3 w-3" /> {selectedJob.type}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium"><DollarSign className="h-3 w-3" /> {selectedJob.salary}</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedJob(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-8">
                     
                     <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                           <Clock className="h-4 w-4 text-slate-400" />
                           <span>Posted {selectedJob.posted}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                           <Users className="h-4 w-4 text-slate-400" />
                           <span><strong>{selectedJob.applicants}</strong> Alumni applied</span>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h3 className="text-base font-semibold text-slate-900">About the Role</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                           {selectedJob.description}
                        </p>
                     </div>

                     {selectedJob.requirements.length > 0 && (
                        <div className="space-y-3">
                           <h3 className="text-base font-semibold text-slate-900">Requirements</h3>
                           <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 marker:text-slate-400">
                              {selectedJob.requirements.map((req, i) => (
                                 <li key={i}>{req}</li>
                              ))}
                           </ul>
                        </div>
                     )}
                     
                     <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-200 transition-colors">
                           Edit Posting
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                           Review Applicants <ExternalLink className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Post an Opportunity</h3>
                <p className="text-sm text-slate-500">Share a job opening with the alumni network.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Job Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Company Name</label>
                  <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Post Job</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
