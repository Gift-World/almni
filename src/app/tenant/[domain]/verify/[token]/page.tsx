import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default async function PublicVerificationPage({
  params,
}: {
  params: Promise<{ domain: string; token: string }>;
}) {
  const { domain, token } = await params;
  const supabase = await createClient();

  const { data: uni } = await supabase
    .from('universities')
    .select('id, name')
    .eq('subdomain', domain)
    .single();

  if (!uni) notFound();

  const { data: profile } = await supabase
    .from('alumni_profiles')
    .select(`
      first_name,
      last_name,
      is_verified
    `)
    .eq('qr_verification_token', token)
    .eq('university_id', uni.id)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Token</h1>
          <p className="text-slate-600 mb-6">This alumni verification QR code is invalid, expired, or does not belong to {uni.name}.</p>
          <Link href={`/tenant/${domain}`} className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-medium">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 text-center">
          <h1 className="text-white font-bold tracking-widest uppercase text-sm opacity-80">{uni.name}</h1>
          <h2 className="text-white text-xl mt-1">Alumni Verification</h2>
        </div>
        
        <div className="p-8 text-center space-y-6">
          {profile.is_verified ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-2">
                 <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-slate-900">
                   {profile.first_name} {profile.last_name[0]}.
                 </h3>
                 <p className="text-emerald-600 font-semibold mt-1">Verified Alumni</p>
              </div>
              <p className="text-sm text-slate-500 mt-4 border-t border-slate-100 pt-4">
                This individual is a verified alumnus/alumna of {uni.name} and is authorized for applicable campus access and benefits.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-2">
                 <XCircle className="w-10 h-10 text-amber-600" />
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-slate-900">
                   {profile.first_name} {profile.last_name[0]}.
                 </h3>
                 <p className="text-amber-600 font-semibold mt-1">Pending Verification</p>
              </div>
              <p className="text-sm text-slate-500 mt-4 border-t border-slate-100 pt-4">
                This individual's alumni status is currently pending verification by {uni.name} administration.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Secure verification provided by AlumniOS.
          </p>
        </div>
      </div>
    </div>
  );
}
