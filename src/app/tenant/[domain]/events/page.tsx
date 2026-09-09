'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Calendar, MapPin, Users, Video } from 'lucide-react';

type Event = {
  id: string;
  title: string;
  start_time: string;
  location: string;
  event_type: string;
  virtual_meeting_link: string | null;
  capacity: number;
  description: string;
};

export default function EventsPage() {
  const params = useParams();
  const domain = params.domain as string;
  const supabase = createClient();
  
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [registering, setRegistering] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchEvents() {
      const { data: uni } = await supabase.from('universities').select('id').eq('subdomain', domain).single();
      if (uni) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('university_id', uni.id)
          .eq('status', 'PUBLISHED')
          .order('start_time', { ascending: true });
        
        if (data) setEvents(data);
      }
      setLoading(false);
    }
    fetchEvents();
  }, [domain, supabase]);

  const handleRegister = async (eventId: string, mode: string) => {
    setRegistering(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login first.");
      setRegistering(null);
      return;
    }

    const { data: uni } = await supabase.from('universities').select('id').eq('subdomain', domain).single();
    if (!uni) return;

    await supabase.from('event_registrations').insert([{
      event_id: eventId,
      user_id: user.id,
      university_id: uni.id,
      attendance_mode: mode
    }]);

    alert("Successfully registered!");
    setRegistering(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upcoming Events</h1>
          <p className="text-slate-500 mt-2">Discover and register for reunions, webinars, and networking events.</p>
        </header>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            No upcoming events at this time.
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-6">
                 
                 <div className="flex-1 space-y-4">
                    <div>
                       <div className="flex gap-2 mb-2">
                          <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold tracking-wider uppercase rounded-md">
                             {event.event_type}
                          </span>
                       </div>
                       <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
                       <p className="text-slate-600 mt-2 text-sm leading-relaxed">{event.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                       <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(event.start_time).toLocaleDateString()}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>Capacity: {event.capacity}</span>
                       </div>
                       {event.event_type !== 'VIRTUAL' && (
                          <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-slate-400" />
                             <span>{event.location || 'TBD'}</span>
                          </div>
                       )}
                       {event.event_type !== 'PHYSICAL' && (
                          <div className="flex items-center gap-2">
                             <Video className="w-4 h-4 text-slate-400" />
                             <span>Online</span>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="w-full md:w-48 shrink-0 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    {event.event_type === 'PHYSICAL' || event.event_type === 'HYBRID' ? (
                       <button 
                          onClick={() => handleRegister(event.id, 'PHYSICAL')}
                          disabled={registering === event.id}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                       >
                          Register (In-Person)
                       </button>
                    ) : null}
                    
                    {event.event_type === 'VIRTUAL' || event.event_type === 'HYBRID' ? (
                       <button 
                          onClick={() => handleRegister(event.id, 'VIRTUAL')}
                          disabled={registering === event.id}
                          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                       >
                          Register (Virtual)
                       </button>
                    ) : null}
                 </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
