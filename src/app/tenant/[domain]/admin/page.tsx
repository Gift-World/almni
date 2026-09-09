import { 
  TrendingUp, 
  AlertCircle, 
  Calendar as CalendarIcon,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import { createClient } from '@/utils/supabase/server';

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const supabase = await createClient();
  
  // Get tenant ID
  const { data: uni } = await supabase.from('universities').select('id').eq('subdomain', domain).single();
  const uniId = uni?.id;

  // Fetch real data counts
  const { count: alumniCount } = await supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('university_id', uniId);
  const { count: eventRegistrations } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('university_id', uniId);
  
  // Calculate a fake "engaged" metric for now based on registrations / total
  const engagementRate = alumniCount && alumniCount > 0 ? Math.round(((eventRegistrations || 0) / alumniCount) * 100) : 0;
  
  const adminName = "Admin";
  const dateRange = "Last 30 days";

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Good morning, {adminName}
        </h1>
        <p className="text-slate-500 text-sm">
          {domain} Alumni Overview · {dateRange}
        </p>
      </header>

      {/* Top Metrics - No borders, large typography, strict hierarchy */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Total Alumni</span>
          <span className="text-4xl font-semibold tracking-tight text-slate-900">{alumniCount || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Engaged Alumni</span>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-semibold tracking-tight text-slate-900">{engagementRate}%</span>
             <span className="text-xs font-medium text-emerald-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 4%
             </span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Event Participation</span>
          <span className="text-4xl font-semibold tracking-tight text-slate-900">{eventRegistrations || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Donations (YTD)</span>
          <span className="text-4xl font-semibold tracking-tight text-slate-900">$2.4M</span>
        </div>
      </section>

      {/* Intelligence & Activity Sections */}
      <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
        
        {/* Left Column: Intelligence */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Insights (Simulated AI) */}
          <section className="space-y-4">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Insights
             </h3>
             <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <p className="text-slate-700 leading-relaxed">
                  Engineering alumni engagement increased <strong>18%</strong> this month, largely driven by the recent Tech Mentorship Campaign. We recommend scheduling a follow-up event for this segment.
                </p>
             </div>
          </section>

          {/* Attention Required */}
          <section className="space-y-4">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Attention Required
             </h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors group cursor-pointer">
                   <div className="flex flex-col">
                      <span className="font-medium text-rose-900">342 profiles need verification</span>
                      <span className="text-sm text-rose-700/80">Imported from Registrar sync yesterday</span>
                   </div>
                   <ArrowRight className="h-5 w-5 text-rose-400 group-hover:text-rose-600 transition-colors" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-colors group cursor-pointer">
                   <div className="flex flex-col">
                      <span className="font-medium text-amber-900">18 mentorship requests pending</span>
                      <span className="text-sm text-amber-700/80">Awaiting admin review and matching</span>
                   </div>
                   <ArrowRight className="h-5 w-5 text-amber-400 group-hover:text-amber-600 transition-colors" />
                </div>
             </div>
          </section>

        </div>

        {/* Right Column: Upcoming & Recent */}
        <div className="space-y-12">
          
          {/* Upcoming */}
          <section className="space-y-4">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Upcoming
             </h3>
             <div className="space-y-5">
                <div className="flex gap-4">
                   <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Oct</span>
                      <span className="text-base font-bold text-slate-900">12</span>
                   </div>
                   <div className="flex flex-col justify-center">
                      <span className="font-medium text-slate-900">Class of 2015 Reunion</span>
                      <span className="text-sm text-slate-500">240 RSVPs</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Nov</span>
                      <span className="text-base font-bold text-slate-900">05</span>
                   </div>
                   <div className="flex flex-col justify-center">
                      <span className="font-medium text-slate-900">Nairobi Tech Mixer</span>
                      <span className="text-sm text-slate-500">85 RSVPs</span>
                   </div>
                </div>
             </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Recent Activity
             </h3>
             <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
                
                <div className="relative pl-6">
                   <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[5px] top-1.5 border-2 border-white"></div>
                   <div className="flex flex-col">
                      <span className="text-sm text-slate-900"><strong>John Doe '18</strong> donated $500</span>
                      <span className="text-xs text-slate-500">2 hours ago</span>
                   </div>
                </div>

                <div className="relative pl-6">
                   <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[5px] top-1.5 border-2 border-white"></div>
                   <div className="flex flex-col">
                      <span className="text-sm text-slate-900"><strong>Sarah Smith '05</strong> updated employment</span>
                      <span className="text-xs text-slate-500">5 hours ago</span>
                   </div>
                </div>

                <div className="relative pl-6">
                   <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[5px] top-1.5 border-2 border-white"></div>
                   <div className="flex flex-col">
                      <span className="text-sm text-slate-900"><strong>Class of 2024</strong> segment created</span>
                      <span className="text-xs text-slate-500">Yesterday</span>
                   </div>
                </div>

             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
