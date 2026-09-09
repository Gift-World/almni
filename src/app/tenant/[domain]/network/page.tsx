import React from "react";
import { createClient } from "@/utils/supabase/server";
import { Search, MapPin, Briefcase } from "lucide-react";

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const supabase = await createClient();
  
  // Get tenant ID
  const { data: uni } = await supabase.from('universities').select('id, name').eq('subdomain', domain).single();
  
  // Fetch profiles
  const { data: profiles } = await supabase.from('alumni_profiles').select('*').eq('university_id', uni?.id).limit(50);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alumni Directory</h1>
              <p className="text-slate-500 mt-2">Connect with {profiles?.length || 0} registered alumni from {uni?.name}</p>
           </div>
           
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Search by name, company, or location..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {profiles?.map(profile => {
              const fullName = `${profile.first_name} ${profile.last_name}`;
              const initials = (profile.first_name?.[0] || "") + (profile.last_name?.[0] || "");
              
              return (
                 <div key={profile.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow group">
                    <div className="flex flex-col items-center text-center space-y-4">
                       {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={fullName} className="w-20 h-20 rounded-full object-cover border border-slate-100 shadow-sm" />
                       ) : (
                          <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold border border-blue-100 shadow-sm">
                             {initials}
                          </div>
                       )}
                       
                       <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{fullName}</h3>
                          <p className="text-sm text-slate-500 font-medium">Class of {profile.graduation_year}</p>
                       </div>
                       
                       <div className="w-full pt-4 space-y-2 border-t border-slate-100">
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                             <Briefcase className="w-3.5 h-3.5 shrink-0" />
                             <span className="truncate">{profile.industry || "Professional"} at {profile.employer || "Company"}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                             <MapPin className="w-3.5 h-3.5 shrink-0" />
                             <span className="truncate">{profile.location || "Location not set"}</span>
                          </div>
                       </div>
                       
                       <button className="w-full mt-2 py-2 bg-slate-50 text-slate-900 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors border border-slate-200">
                          View Profile
                       </button>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
