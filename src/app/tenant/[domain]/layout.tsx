import { ReactNode } from 'react';

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  
  // Here we would normally fetch the university details from Supabase using the domain
  // and pass the branding colors/logo down, perhaps applying a CSS variable theme.
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
            {domain.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-semibold text-slate-800 capitalize">{domain} AlumniConnect</h1>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="/" className="hover:text-blue-600 transition-colors">Directory</a>
          <a href="/events" className="hover:text-blue-600 transition-colors">Events</a>
          <a href="/giving" className="hover:text-blue-600 transition-colors">Giving</a>
          <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Sign In</a>
        </nav>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} {domain} Alumni Association. Powered by AlumniConnect.</p>
      </footer>
    </div>
  );
}
