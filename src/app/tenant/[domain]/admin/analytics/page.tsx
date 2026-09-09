"use client"

import * as React from "react"
import { BarChart3, LineChart, PieChart, TrendingUp, Download } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Platform engagement and ROI tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Fake Chart 1 */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-semibold text-slate-900">Monthly Active Users (MAU)</h3>
               <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="h-48 flex items-end justify-between gap-2 px-2">
               {[40, 55, 45, 60, 75, 65, 80, 95, 85, 100, 110, 120].map((h, i) => (
                  <div key={i} className="w-full bg-blue-100 hover:bg-blue-200 transition-colors rounded-t-sm relative group cursor-pointer" style={{ height: `${h}%` }}>
                     <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded font-medium whitespace-nowrap transition-opacity">
                        {h * 124} users
                     </div>
                  </div>
               ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-emerald-600 font-medium">
               <TrendingUp className="h-4 w-4" />
               +24% year over year
            </div>
         </div>

         {/* Fake Chart 2 */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-semibold text-slate-900">Donations by Segment</h3>
               <PieChart className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-center justify-center h-48">
               <div className="relative h-40 w-40 rounded-full border-[16px] border-emerald-500 border-r-blue-500 border-t-amber-500 border-b-rose-500 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                     <span className="text-2xl font-bold text-slate-900">$2.4M</span>
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                  </div>
               </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center gap-4 text-xs text-slate-600">
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> High-Value</span>
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Young Alumni</span>
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Corporate</span>
            </div>
         </div>
      </div>
    </div>
  );
}
