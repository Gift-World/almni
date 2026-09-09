import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default async function AlumniPassportPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const supabase = await createClient();

  const { data: uni } = await supabase
    .from('universities')
    .select('*')
    .eq('subdomain', domain)
    .single();

  if (!uni) notFound();

  // In a real app we'd get the authenticated user
  // For demo, we'll fetch a sample verified profile from this uni
  const { data: profile } = await supabase
    .from('alumni_profiles')
    .select('*')
    .eq('university_id', uni.id)
    .eq('is_verified', true)
    .limit(1)
    .single();

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
        <p className="text-slate-500">You need a verified profile to access your Alumni Passport.</p>
      </div>
    );
  }

  const qrData = profile.qr_verification_token;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500 py-8">
      
      <div className="flex items-center justify-between">
         <Link href={`/tenant/${domain}/profile`} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Profile
         </Link>
      </div>

      <div className="text-center space-y-2">
         <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Digital Alumni ID</h1>
         <p className="text-slate-500 text-sm">Present this QR code at campus facilities or alumni events for verified access.</p>
      </div>

      {/* ID Card */}
      <div className="relative bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
         {/* Card Header (University Branding) */}
         <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex justify-between items-center">
            <span className="font-bold text-white tracking-wide">{uni.name}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
         </div>
         
         {/* Card Body */}
         <div className="p-6 pb-8 space-y-8">
            <div className="flex items-start gap-4">
               <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                  {profile.avatar_url ? (
                     <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                        {profile.first_name[0]}{profile.last_name[0]}
                     </div>
                  )}
               </div>
               <div className="flex flex-col pt-1">
                  <h2 className="text-xl font-bold text-white">{profile.first_name} {profile.last_name}</h2>
                  <p className="text-slate-300 font-medium">Alumni</p>
                  <div className="mt-2 flex flex-col gap-0.5 text-sm text-slate-400">
                     <span>Class of {profile.graduation_year}</span>
                     <span>{profile.degree} in {profile.major}</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-3 mx-4">
               <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
               <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{profile.alumni_id}</p>
            </div>
         </div>
      </div>

      <div className="flex gap-3">
         <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Save to Phone
         </button>
      </div>

    </div>
  );
}
