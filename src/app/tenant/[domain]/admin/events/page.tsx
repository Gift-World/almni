"use client"

import * as React from "react"
import { Plus, Search, MapPin, Users, Calendar as CalendarIcon, Clock, Edit, X } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  event_format: string; // 'PHYSICAL', 'VIRTUAL', 'HYBRID'
  virtual_meeting_link: string | null;
  rsvps: number;
  capacity: number;
  status: string;
  image: string;
  description: string;
}

export default function EventsPage() {
  const params = useParams();
  const domain = params.domain as string;
  const supabase = createClient();

  const [events, setEvents] = React.useState<Event[]>([]);
  const [uniId, setUniId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
       const { data: uni } = await supabase.from('universities').select('id').eq('subdomain', domain).single();
       if (uni) {
         setUniId(uni.id);
         const { data: eventsData } = await supabase.from('events').select(`
            *,
            event_registrations(count)
         `).eq('university_id', uni.id);
         
         if (eventsData) {
           setEvents(eventsData.map((e: any) => {
             const startDate = new Date(e.start_time);
             return {
               id: e.id,
               title: e.title,
               date: startDate.toLocaleDateString(),
               time: startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               location: e.location || "TBD",
               type: e.type || "Event",
               event_format: e.event_type || "PHYSICAL",
               virtual_meeting_link: e.virtual_meeting_link || null,
               rsvps: e.event_registrations?.[0]?.count || 0,
               capacity: e.capacity || 100,
               status: e.status,
               image: e.cover_image_url || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
               description: e.description || "No description provided."
             };
           }));
         }
       }
    }
    fetchData();
  }, [domain, supabase]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState("Reunion");
  const [eventFormat, setEventFormat] = React.useState("PHYSICAL");
  const [virtualLink, setVirtualLink] = React.useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !uniId) return;
    
    const { data, error } = await supabase.from('events').insert([{
       university_id: uniId,
       title,
       event_type: eventFormat,
       virtual_meeting_link: eventFormat !== 'PHYSICAL' ? virtualLink : null,
       start_time: new Date().toISOString(),
       end_time: new Date().toISOString(),
       status: 'Draft',
       description: 'Draft event pending details.'
    }]);
    
    setTitle("");
    setVirtualLink("");
    setEventFormat("PHYSICAL");
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Events</h1>
          <p className="text-slate-500 text-sm mt-1">Manage upcoming reunions, webinars, and meetups</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        </div>
      </header>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
         <div className="flex gap-6">
            <button className="text-sm font-medium text-slate-900 border-b-2 border-slate-900 pb-4 -mb-[17px]">Upcoming ({events.length})</button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-4 -mb-[17px]">Past Events (48)</button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-4 -mb-[17px]">Drafts (2)</button>
         </div>
         <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search events..." className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all" />
         </div>
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {events.map(event => (
            <div 
              key={event.id} 
              onClick={() => setSelectedEvent(event)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all flex flex-col"
            >
               <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                     <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                       event.status === 'Draft' ? 'bg-white text-slate-900' : 'bg-blue-500 text-white'
                     }`}>
                        {event.status === 'Draft' ? 'DRAFT' : event.event_format}
                     </span>
                  </div>
               </div>
               
               <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                     {event.title}
                  </h3>
                  
                  <div className="space-y-2 mt-4">
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{event.date}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{event.time}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                     </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span><strong className="text-slate-900">{event.rsvps}</strong> / {event.capacity} registered</span>
                     </div>
                  </div>
               </div>
            </div>
         ))}

         {/* Add New Event Placeholder */}
         <div onClick={() => setIsCreateModalOpen(true)} className="bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer min-h-[350px]">
            <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-3 text-slate-600">
               <Plus className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-slate-900">Create New Event</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-[200px]">Plan a reunion, webinar, or networking mixer.</p>
         </div>
      </div>

      {/* Detailed Event View Modal */}
      <AnimatePresence>
         {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                  className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="relative h-64 w-full shrink-0">
                     <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                     <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors">
                        <X className="h-5 w-5" />
                     </button>
                     <div className="absolute bottom-6 left-6 right-6">
                        <span className="inline-flex px-2.5 py-1 bg-blue-500 text-white text-xs font-bold tracking-wider uppercase rounded-md mb-3">
                           {selectedEvent.type}
                        </span>
                        <h2 className="text-3xl font-bold text-white leading-tight">{selectedEvent.title}</h2>
                     </div>
                  </div>

                  <div className="p-6 overflow-y-auto">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                           <div>
                              <h3 className="text-lg font-semibold text-slate-900 mb-2">About this event</h3>
                              <p className="text-slate-600 leading-relaxed text-sm">
                                 {selectedEvent.description}
                              </p>
                           </div>
                           
                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                 <h4 className="font-semibold text-slate-900 text-sm">Registration Progress</h4>
                                 <span className="text-sm font-medium text-slate-600">{selectedEvent.rsvps} / {selectedEvent.capacity}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${(selectedEvent.rsvps / selectedEvent.capacity) * 100}%` }} />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-4 text-sm text-slate-600">
                              <div className="flex items-start gap-3">
                                 <CalendarIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                                 <div>
                                    <p className="font-medium text-slate-900">{selectedEvent.date}</p>
                                    <p>{selectedEvent.time}</p>
                                 </div>
                              </div>
                              <div className="flex items-start gap-3">
                                 <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                                 <div>
                                    <p className="font-medium text-slate-900">Location</p>
                                    <p>{selectedEvent.location}</p>
                                 </div>
                              </div>
                           </div>

                           <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                              <Edit className="h-4 w-4" /> Edit Details
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
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Create Event</h3>
                <p className="text-sm text-slate-500">Start planning a new alumni gathering.</p>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Event Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class of 2024 Mixer" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Event Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300">
                     <option value="Reunion">Reunion</option>
                     <option value="Networking">Networking</option>
                     <option value="Webinar">Webinar</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Event Format</label>
                  <select value={eventFormat} onChange={(e) => setEventFormat(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300">
                     <option value="PHYSICAL">Physical (In-Person)</option>
                     <option value="VIRTUAL">Virtual (Online)</option>
                     <option value="HYBRID">Hybrid (Both)</option>
                  </select>
                </div>
                {eventFormat !== 'PHYSICAL' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Virtual Meeting Link</label>
                    <input type="url" value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://zoom.us/j/..." className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                  </div>
                )}
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
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
