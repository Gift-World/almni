import { ReactNode } from 'react';
import { CommandPalette } from '@/components/CommandPalette';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Briefcase, 
  LineChart, 
  Settings, 
  Building2,
  HeartHandshake,
  Bell
} from 'lucide-react';

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  
  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-slate-100 flex flex-col bg-slate-50/50 hidden md:flex z-10 shrink-0">
        {/* University Identity */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-transparent mt-2">
          <div className="h-7 w-7 rounded-md bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {domain.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
             <h2 className="text-sm font-semibold text-slate-900 capitalize leading-tight">{domain}</h2>
             <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Alumni Office</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-none">
          
          {/* OVERVIEW */}
          <div>
             <a href="/admin" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md bg-slate-100 text-slate-900 transition-colors">
               <LayoutDashboard className="h-4 w-4 text-slate-500" />
               Dashboard
             </a>
          </div>

          {/* RELATIONSHIPS */}
          <div className="space-y-1">
             <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Relationships</p>
             <a href="/admin/alumni" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <Users className="h-4 w-4 text-slate-400" />
               Alumni Directory
             </a>
             <a href="/admin/segments" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <BookOpen className="h-4 w-4 text-slate-400" />
               Segments
             </a>
          </div>

          {/* ENGAGEMENT */}
          <div className="space-y-1">
             <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Engagement</p>
             <a href="/admin/events" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <Calendar className="h-4 w-4 text-slate-400" />
               Events
             </a>
             <a href="/admin/communities" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <Users className="h-4 w-4 text-slate-400" />
               Communities
             </a>
             <a href="/admin/communications" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <MessageSquare className="h-4 w-4 text-slate-400" />
               Communications
             </a>
          </div>

          {/* GROWTH */}
          <div className="space-y-1">
             <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Growth</p>
             <a href="/admin/careers" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <Briefcase className="h-4 w-4 text-slate-400" />
               Careers
             </a>
             <a href="/admin/mentorship" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <HeartHandshake className="h-4 w-4 text-slate-400" />
               Mentorship
             </a>
             <a href="/admin/fundraising" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <Building2 className="h-4 w-4 text-slate-400" />
               Fundraising
             </a>
          </div>

          {/* INSIGHTS */}
          <div className="space-y-1">
             <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Insights</p>
             <a href="/admin/analytics" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <LineChart className="h-4 w-4 text-slate-400" />
               Analytics
             </a>
          </div>

          {/* ADMINISTRATION */}
          <div className="space-y-1 pb-4">
             <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Administration</p>
             <a href="/admin/settings" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <Settings className="h-4 w-4 text-slate-400" />
               Settings
             </a>
          </div>

        </nav>
        
        {/* User Profile */}
        <div className="p-3 border-t border-slate-100">
          <button className="flex items-center gap-3 w-full px-2 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors">
            <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-300"></div>
            <div className="flex flex-col items-start flex-1">
               <span className="text-sm font-medium text-slate-900">Jane Admin</span>
               <span className="text-[10px] text-slate-500">View profile</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Top Navbar */}
        <header className="h-14 flex items-center justify-between px-6 z-0 bg-white border-b border-transparent">
          <div className="flex-1">
            <CommandPalette />
          </div>
          <div className="flex items-center gap-4">
             <button className="text-slate-400 hover:text-slate-900 transition-colors relative">
                <span className="sr-only">Notifications</span>
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
             </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6 md:p-8 xl:p-10">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
