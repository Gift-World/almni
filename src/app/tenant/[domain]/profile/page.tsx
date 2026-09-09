import React from "react";
import { createClient } from "@/utils/supabase/server";
import { MapPin, Briefcase, GraduationCap, Link2, CheckCircle2, FileText, ChevronRight } from "lucide-react";

export default async function AlumniPassportPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const supabase = await createClient();
  
  // Get tenant ID
  const { data: uni } = await supabase.from('universities').select('id, name, logo_url').eq('subdomain', domain).single();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
     return <div className="p-12 text-center text-slate-500">Please log in to view your Passport.</div>;
  }

  // Fetch the authenticated user's profile for this university
  const { data: profile } = await supabase.from('alumni_profiles')
     .select('*')
     .eq('university_id', uni?.id)
     .eq('user_id', user.id)
     .single();

  if (!profile) {
     return <div className="p-12 text-center text-slate-500">Please complete your profile to view your Passport.</div>;
  }

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const initials = (profile.first_name?.[0] || "") + (profile.last_name?.[0] || "");

  const lastUpdate = new Date(profile.last_profile_update || profile.created_at);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const needsRefresh = lastUpdate < sixMonthsAgo;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Verification Banner */}
        {profile.is_verified && (
           <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between gap-4 text-white shadow-sm shadow-blue-500/20">
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5" />
                 <span className="font-medium tracking-wide">VERIFIED ALUMNI · {uni?.name}</span>
              </div>
              <a href={`/tenant/${domain}/profile/passport`} className="px-4 py-1.5 bg-white text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                 View Digital ID
              </a>
           </div>
        )}

        {needsRefresh && (
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                    <h3 className="text-amber-900 font-semibold text-sm">Please update your profile</h3>
                    <p className="text-amber-700 text-sm">It's been over 6 months since your last update. Keeping your profile current helps you stay connected.</p>
                 </div>
              </div>
              <button className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
                 Update Now
              </button>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Left Sidebar */}
           <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="h-32 bg-slate-900 relative">
                    {/* Cover image could go here */}
                 </div>
                 <div className="px-6 pb-6 relative">
                    <div className="absolute -top-12 left-6">
                       {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={fullName} className="w-24 h-24 rounded-2xl border-4 border-white shadow-sm object-cover bg-white" />
                       ) : (
                          <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-sm bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-bold">
                             {initials}
                          </div>
                       )}
                    </div>
                    
                    <div className="mt-16 space-y-1">
                       <h1 className="text-2xl font-bold text-slate-900 leading-tight">{fullName}</h1>
                       <p className="text-slate-500 text-sm font-medium">{profile.industry || "Professional"} at {profile.employer || "Company"}</p>
                    </div>

                    <div className="mt-6 space-y-3">
                       <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Class of {profile.graduation_year} • {profile.degree}</span>
                       </div>
                       <div className="flex items-center gap-3 text-slate-600 text-sm">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{profile.location || "Location not set"}</span>
                       </div>
                    </div>
                    
                    <button className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition shadow-sm">
                       Edit Passport
                    </button>
                 </div>
              </div>

              {/* Connections/Quick Stats */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                 <h3 className="font-semibold text-slate-900">Network & Impact</h3>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col">
                       <span className="text-2xl font-bold text-slate-900">{profile.impact_score || 0}</span>
                       <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Impact</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-2xl font-bold text-slate-900">42</span>
                       <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Conns</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-2xl font-bold text-slate-900">3</span>
                       <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Chpts</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Content */}
           <div className="md:col-span-2 space-y-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                 <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    About
                 </h2>
                 <p className="text-slate-600 leading-relaxed">
                    {profile.bio || "No bio provided yet. Add a short professional bio to help others in the network understand your background."}
                 </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                 <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                    Experience
                 </h2>
                 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {/* Placeholder Timeline Item */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Briefcase className="w-4 h-4" />
                       </div>
                       <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex flex-col">
                             <span className="font-semibold text-slate-900">{profile.industry || "Current Role"}</span>
                             <span className="text-sm text-blue-600 font-medium">{profile.employer || "Current Company"}</span>
                             <span className="text-xs text-slate-500 mt-2">Present</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>

        </div>
      </div>
    </div>
  );
}
