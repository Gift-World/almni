'use client';

import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Search, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminVerifyPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('alumni_profiles')
        .select(`
          first_name,
          last_name,
          graduation_year,
          degree,
          is_verified,
          avatar_url
        `)
        .eq('qr_verification_token', token)
        .single();

      if (fetchError || !data) {
        setError('Invalid or expired token.');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 py-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 border border-slate-200 mb-2">
           <QrCode className="w-8 h-8 text-slate-700" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Alumni ID Verification
        </h1>
        <p className="text-slate-500">
          Scan a QR code or enter a token manually to verify an alumni's identity and campus access.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
         <form onSubmit={handleVerify} className="flex gap-3">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input
                 type="text"
                 value={token}
                 onChange={(e) => setToken(e.target.value)}
                 placeholder="Enter verification token..."
                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
               />
            </div>
            <button
               type="submit"
               disabled={loading || !token}
               className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
               {loading ? 'Verifying...' : 'Verify'}
            </button>
         </form>
      </div>

      {/* Results Area */}
      {error && (
         <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 animate-in slide-in-from-bottom-4">
            <XCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
         </div>
      )}

      {result && (
         <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center animate-in zoom-in-95 duration-300">
            {result.is_verified ? (
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
               </div>
            ) : (
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
                  <XCircle className="w-8 h-8 text-amber-600" />
               </div>
            )}
            
            <div className="space-y-1 mb-6">
               <h2 className="text-2xl font-bold text-slate-900">
                  {result.first_name} {result.last_name}
               </h2>
               <p className="text-slate-500 font-medium">
                  {result.degree && result.graduation_year 
                     ? `${result.degree} '${String(result.graduation_year).slice(-2)}` 
                     : 'Alumni'}
               </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border">
               {result.is_verified ? (
                  <>
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                     <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Verified Alumni</span>
                  </>
               ) : (
                  <>
                     <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                     <span className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Pending Verification</span>
                  </>
               )}
            </div>
            
            {result.is_verified && (
               <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center gap-4">
                  <button className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                     Check-in to Event
                  </button>
                  <button className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                     View Full Profile
                  </button>
               </div>
            )}
         </div>
      )}
    </div>
  );
}
