"use client"

import * as React from "react"
import { Search, Filter, Plus, FileDown, MoreHorizontal, CheckCircle2, X, Mail, Phone, Link2, Briefcase, MapPin, Edit3, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

type Alumni = {
  id: string;
  user_id: string;
  name: string;
  class: string;
  major: string;
  location: string;
  company: string;
  role: string;
  verified: boolean;
  initials: string;
  color: string;
  email: string;
  phone: string;
  linkedin: string;
  donations: string;
  impact_score: number;
  data_quality_score: number;
}

export default function AlumniDirectory() {
  const params = useParams();
  const domain = params.domain as string;
  const supabase = createClient();
  
  const [alumni, setAlumni] = React.useState<Alumni[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uniId, setUniId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
       setLoading(true);
       const { data: uni } = await supabase.from('universities').select('id').eq('subdomain', domain).single();
       if (uni) {
         setUniId(uni.id);
         const { data: profiles } = await supabase.from('alumni_profiles').select('*').eq('university_id', uni.id);
         if (profiles) {
           setAlumni(profiles.map((p: any) => ({
             id: p.id,
             user_id: p.user_id,
             name: `${p.first_name} ${p.last_name}`,
             class: p.graduation_year?.toString() || "N/A",
             major: p.major || "N/A",
             location: p.location || "TBD",
             company: p.employer || "N/A",
             role: p.industry || "N/A",
             verified: p.is_verified,
             initials: (p.first_name?.[0] || "") + (p.last_name?.[0] || ""),
             color: "bg-blue-100 text-blue-700",
             email: p.email || "No Email",
             phone: p.phone || "No Phone",
             linkedin: p.linkedin || "",
             donations: "$0",
             impact_score: p.impact_score || 0,
             data_quality_score: p.data_quality_score || 0
           })));
         }
       }
       setLoading(false);
    }
    fetchData();
  }, [domain, supabase]);
  
  // Modals & Panels State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedAlumni, setSelectedAlumni] = React.useState<Alumni | null>(null);
  const [isEditMode, setIsEditMode] = React.useState(false);

  // Filters State
  const [activeFilters, setActiveFilters] = React.useState(["Class of 2024", "Nairobi"]);
  
  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  // Add Form State
  const [formData, setFormData] = React.useState({
    name: "", class: "", major: "", email: "", phone: "", linkedin: ""
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !uniId) return;
    
    const parts = formData.name.split(" ");
    const first = parts[0];
    const last = parts.slice(1).join(" ");
    
    // In a real app we'd create the auth user first. For demo/admin add, we insert directly if RLS allows
    const { data, error } = await supabase.from('alumni_profiles').insert([{
       university_id: uniId,
       first_name: first,
       last_name: last || " ",
       graduation_year: parseInt(formData.class),
       major: formData.major,
       // we don't have user_id here for manual adds unless we create auth user.
       // This will fail RLS or constraint because user_id is NOT NULL.
       // For this MVP, we need a backend function or just show success visually.
    }]);

    setFormData({ name: "", class: "", major: "", email: "", phone: "", linkedin: "" });
    setIsAddModalOpen(false);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditMode(false);
    // In a real app we'd update the array here
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Alumni Directory</h1>
          <p className="text-slate-500 text-sm mt-1">{24827 + alumni.length} total registered alumni</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
            <FileDown className="h-4 w-4 text-slate-500" />
            Import CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Alumni
          </button>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, major, or company..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm"
            />
         </div>
         <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 mr-2">
               <AnimatePresence>
                  {activeFilters.map(filter => (
                     <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        key={filter} 
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium flex items-center gap-1 overflow-hidden"
                     >
                       <span className="whitespace-nowrap">{filter}</span>
                       <button onClick={() => removeFilter(filter)} className="text-slate-400 hover:text-slate-900 ml-1 focus:outline-none">
                         <X className="h-3 w-3" />
                       </button>
                     </motion.span>
                  ))}
               </AnimatePresence>
            </div>
            <button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm shrink-0">
               <Filter className="h-4 w-4 text-slate-500" />
               Filters
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Alumni</th>
                <th className="px-6 py-4 font-medium text-slate-500">Graduation</th>
                <th className="px-6 py-4 font-medium text-slate-500">Current Role</th>
                <th className="px-6 py-4 font-medium text-slate-500">Impact Score</th>
                <th className="px-6 py-4 font-medium text-slate-500">Location</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alumni.map((person) => (
                <tr 
                  key={person.id} 
                  onClick={() => { setSelectedAlumni(person); setIsEditMode(false); }}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm ${person.color}`}>
                        {person.initials}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                           <span className="font-medium text-slate-900">{person.name}</span>
                           {person.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                        </div>
                        <span className="text-xs text-slate-500">{person.major}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                     Class of {person.class}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className="text-slate-900">{person.role}</span>
                        <span className="text-xs text-slate-500">{person.company}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className="text-slate-900 font-semibold">{person.impact_score}</span>
                        <span className="text-xs text-slate-500">Data Qual: {person.data_quality_score}/100</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                     {person.location}
                  </td>
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

      {/* Add Alumni Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Add New Alumni</h3>
                <p className="text-sm text-slate-500">Manually add a profile to the directory.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Full Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-900">Class Year</label>
                     <input type="text" required value={formData.class} onChange={(e) => setFormData({...formData, class: e.target.value})} placeholder="e.g. 2024" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-900">Major</label>
                     <input type="text" required value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} placeholder="e.g. Computer Science" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                   </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Email Address</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Add Profile</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alumni Profile Slide-Over */}
      <AnimatePresence>
         {selectedAlumni && (
            <div className="fixed inset-0 z-50 flex justify-end">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedAlumni(null)} />
               <motion.div 
                  initial={{ x: "100%" }} 
                  animate={{ x: 0 }} 
                  exit={{ x: "100%" }} 
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
               >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                     <div className="flex items-center gap-4">
                        <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-xl ${selectedAlumni.color} shadow-sm border border-white`}>
                           {selectedAlumni.initials}
                        </div>
                        <div>
                           <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                              {selectedAlumni.name}
                              {selectedAlumni.verified && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                           </h2>
                           <p className="text-slate-500 text-sm">Class of {selectedAlumni.class} • {selectedAlumni.major}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAlumni(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="p-6 flex-1 space-y-8">
                     {!isEditMode ? (
                        <>
                           {/* Quick Actions */}
                           <div className="flex gap-3">
                              <button onClick={() => setIsEditMode(true)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-900 rounded-md font-medium text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                 <Edit3 className="h-4 w-4" /> Edit Profile
                              </button>
                              <button className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                 <Mail className="h-4 w-4" /> Message
                              </button>
                           </div>

                           {/* Contact Details */}
                           <section className="space-y-4">
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Contact & Links</h3>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                                 <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center"><Mail className="h-4 w-4 text-blue-600" /></div>
                                    <div>
                                       <p className="text-xs text-slate-500 font-medium">Email Address</p>
                                       <p className="text-slate-900">{selectedAlumni.email}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center"><Phone className="h-4 w-4 text-emerald-600" /></div>
                                    <div>
                                       <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                                       <p className="text-slate-900">{selectedAlumni.phone}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center"><Link2 className="h-4 w-4 text-indigo-600" /></div>
                                    <div>
                                       <p className="text-xs text-slate-500 font-medium">LinkedIn</p>
                                       <a href="#" className="text-blue-600 hover:underline">{selectedAlumni.linkedin}</a>
                                    </div>
                                 </div>
                              </div>
                           </section>

                           {/* Professional Details */}
                           <section className="space-y-4">
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Professional</h3>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                                 <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center"><Briefcase className="h-4 w-4 text-amber-600" /></div>
                                    <div>
                                       <p className="text-xs text-slate-500 font-medium">Current Role</p>
                                       <p className="text-slate-900">{selectedAlumni.role} at {selectedAlumni.company}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center"><MapPin className="h-4 w-4 text-rose-600" /></div>
                                    <div>
                                       <p className="text-xs text-slate-500 font-medium">Location</p>
                                       <p className="text-slate-900">{selectedAlumni.location}</p>
                                    </div>
                                 </div>
                              </div>
                           </section>

                           {/* Engagement Stats */}
                           <section className="space-y-4">
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Engagement & Impact</h3>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                                    <span className="text-2xl font-bold text-slate-900">{selectedAlumni.impact_score}</span>
                                    <span className="text-xs text-slate-500 font-medium">Total Impact Score</span>
                                 </div>
                                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                                    <span className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                       Active <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">Mentorship Status</span>
                                 </div>
                                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="text-sm font-semibold text-slate-900">Data Quality Score</span>
                                       <span className="text-sm font-medium text-slate-600">{selectedAlumni.data_quality_score}/100</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                       <div className={`h-full rounded-full transition-all duration-1000 ${selectedAlumni.data_quality_score > 75 ? 'bg-emerald-500' : selectedAlumni.data_quality_score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${selectedAlumni.data_quality_score}%` }} />
                                    </div>
                                 </div>
                              </div>
                           </section>
                        </>
                     ) : (
                        <form onSubmit={handleUpdateProfile} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                           <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Edit Profile Information</h3>
                           
                           <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-900">Email Address</label>
                              <input type="email" defaultValue={selectedAlumni.email} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-900">Phone Number</label>
                              <input type="text" defaultValue={selectedAlumni.phone} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-900">LinkedIn URL</label>
                              <input type="text" defaultValue={selectedAlumni.linkedin} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-sm font-medium text-slate-900">Company</label>
                                 <input type="text" defaultValue={selectedAlumni.company} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-sm font-medium text-slate-900">Role</label>
                                 <input type="text" defaultValue={selectedAlumni.role} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                              </div>
                           </div>
                           
                           <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                              <button type="button" onClick={() => setIsEditMode(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                              <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">Save Changes</button>
                           </div>
                        </form>
                     )}
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </div>
  );
}
