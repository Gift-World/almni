"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';

export default function TenantRegisterPage() {
  const params = useParams();
  const domain = params.domain as string;
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uniId, setUniId] = useState<string | null>(null);

  useEffect(() => {
    async function getUni() {
      const { data } = await supabase.from('universities').select('id').eq('subdomain', domain).single();
      if (data) setUniId(data.id);
    }
    getUni();
  }, [domain, supabase]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniId) {
       setError("Invalid university domain.");
       return;
    }
    setLoading(true);
    setError(null);

    // Pass university_id in metadata so the Postgres Trigger can assign the role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          university_id: uniId,
          role: 'ALUMNI'
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Now insert the alumni profile since auth trigger only handles user_roles
    if (authData.user) {
        const { error: profileError } = await supabase.from('alumni_profiles').insert([{
            user_id: authData.user.id,
            university_id: uniId,
            first_name: firstName,
            last_name: lastName
        }]);
        
        if (profileError) {
            console.error("Profile creation error:", profileError);
        }
    }

    router.push(`/tenant/${domain}/login`);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900">Join the network</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
             Alumni registration for {domain}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div className="flex gap-4">
                <div className="w-1/2">
                  <label htmlFor="first-name" className="sr-only">First Name</label>
                  <input id="first-name" name="firstName" type="text" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="w-1/2">
                  <label htmlFor="last-name" className="sr-only">Last Name</label>
                  <input id="last-name" name="lastName" type="text" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
          
          <div className="text-center mt-4">
             <a href={`/tenant/${domain}/login`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Already have an account? Sign in
             </a>
          </div>
        </form>
      </div>
    </div>
  );
}
