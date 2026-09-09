export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="bg-white rounded-2xl p-10 md:p-16 shadow-sm border text-center space-y-6">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 capitalize">
          Welcome to the {domain} Alumni Network
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Reconnect with classmates, expand your professional network, and stay updated on the latest news and events from your alma mater.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Join the Network
          </button>
          <button className="px-6 py-3 bg-white text-slate-700 border rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Browse Directory
          </button>
        </div>
      </section>

      {/* Feature grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Mentorship', desc: 'Find or become a mentor to guide the next generation.' },
          { title: 'Upcoming Events', desc: 'Join reunions, webinars, and regional meetups.' },
          { title: 'Give Back', desc: 'Support university initiatives and student scholarships.' },
        ].map((feature) => (
          <div key={feature.title} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-slate-600 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
