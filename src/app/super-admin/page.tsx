import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ArrowRight, Building2, Users, CreditCard, Activity, AlertCircle } from "lucide-react";

export default async function SuperAdminDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Note: We would ideally check if current user is SUPER_ADMIN here
  const { data: universities, error } = await supabase.from('universities').select('*');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-center">
          <div>
             <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
             <p className="text-slate-500">Super Admin Command Center</p>
          </div>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition">
             Onboard University
          </button>
        </header>

        {/* High-level metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
             <div className="flex items-center gap-3 text-slate-500 mb-3">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Active Tenants</span>
             </div>
             <div className="text-4xl font-bold">{universities?.length || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
             <div className="flex items-center gap-3 text-slate-500 mb-3">
                <Users className="w-5 h-5" />
                <span className="font-medium">Total Users</span>
             </div>
             <div className="text-4xl font-bold">--</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
             <div className="flex items-center gap-3 text-slate-500 mb-3">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">MRR</span>
             </div>
             <div className="text-4xl font-bold">$0</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
             <div className="flex items-center gap-3 text-slate-500 mb-3">
                <Activity className="w-5 h-5" />
                <span className="font-medium">System Health</span>
             </div>
             <div className="text-4xl font-bold text-emerald-600">99.9%</div>
          </div>
        </section>

        {/* Tenant List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Universities</h2>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                   <tr>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Name</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Subdomain</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Created</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {universities?.map((uni) => (
                      <tr key={uni.id} className="hover:bg-slate-50/50">
                         <td className="py-4 px-6 font-medium">{uni.name}</td>
                         <td className="py-4 px-6 text-slate-500">{uni.subdomain}.alumnios.com</td>
                         <td className="py-4 px-6 text-slate-500">{new Date(uni.created_at).toLocaleDateString()}</td>
                         <td className="py-4 px-6 text-right">
                            <a href={`http://${uni.subdomain}.localhost:3000/admin`} className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
                               Manage <ArrowRight className="w-4 h-4" />
                            </a>
                         </td>
                      </tr>
                   ))}
                   {(!universities || universities.length === 0) && (
                      <tr>
                         <td colSpan={4} className="py-12 text-center text-slate-500">
                            No universities found.
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </section>

      </div>
    </div>
  );
}
