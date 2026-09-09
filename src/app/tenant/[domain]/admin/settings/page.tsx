"use client"

import * as React from "react"
import { Save, Shield, CreditCard, Users, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Settings saved successfully.");
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage university branding, billing, and team access.</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
         
         {/* Settings Nav */}
         <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium bg-slate-100 text-slate-900 rounded-md">
               <ImageIcon className="h-4 w-4 text-slate-500" /> Branding
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors">
               <Users className="h-4 w-4 text-slate-400" /> Team Access
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors">
               <Shield className="h-4 w-4 text-slate-400" /> Security
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors">
               <CreditCard className="h-4 w-4 text-slate-400" /> Billing
            </button>
         </div>

         {/* Settings Content */}
         <div className="flex-1 p-6 space-y-6">
            <div>
               <h3 className="text-lg font-semibold text-slate-900 mb-4">University Branding</h3>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-900">Tenant Name</label>
                     <input type="text" defaultValue="Moi University" className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-900">Support Email</label>
                     <input type="email" defaultValue="alumni@moiuni.edu" className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
                  </div>
                  <div className="space-y-2 pt-2">
                     <label className="text-sm font-medium text-slate-900">Brand Color</label>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-600 border border-slate-200"></div>
                        <input type="text" defaultValue="#2563EB" className="w-24 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
               >
                 {isSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
