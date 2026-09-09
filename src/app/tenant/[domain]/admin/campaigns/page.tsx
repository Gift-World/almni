import { createClient } from '@/utils/supabase/server';
import { Plus, Mail, Activity, Calendar, MoreVertical, Play, Pause } from 'lucide-react';

export default async function AdminCampaignsPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const supabase = await createClient();

  const { data: uni } = await supabase
    .from('universities')
    .select('id')
    .eq('subdomain', domain)
    .single();
    
  const uniId = uni?.id;

  const { data: campaigns } = await supabase
    .from('campaign_automations')
    .select('*')
    .eq('university_id', uniId)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Automated Campaigns
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Build and manage triggered engagement workflows.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Stats/Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Active Automations</h3>
            <span className="text-3xl font-semibold text-slate-900">{campaigns?.filter(c => c.is_active).length || 0}</span>
         </div>
         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Emails Sent (30d)</h3>
            <span className="text-3xl font-semibold text-slate-900">0</span>
         </div>
         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Avg. Engagement</h3>
            <span className="text-3xl font-semibold text-slate-900">0%</span>
         </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
               {campaigns && campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                     <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                 <Mail className="w-4 h-4 text-indigo-600" />
                              </div>
                              <span className="font-medium text-slate-900">{campaign.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-sm text-slate-700">{campaign.trigger_type}</span>
                              <span className="text-xs text-slate-500">
                                 {JSON.stringify(campaign.trigger_conditions)}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {campaign.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                 <Play className="w-3 h-3" /> Active
                              </span>
                           ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                 <Pause className="w-3 h-3" /> Paused
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                           </button>
                        </td>
                     </tr>
                  ))
               ) : (
                  <tr>
                     <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                           <Activity className="w-8 h-8 mb-3 text-slate-300" />
                           <p className="text-sm font-medium text-slate-900">No campaigns found</p>
                           <p className="text-sm mt-1">Get started by creating your first automated campaign.</p>
                           <button className="mt-4 flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                              <Plus className="h-4 w-4" />
                              Create Campaign
                           </button>
                        </div>
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>

    </div>
  );
}
