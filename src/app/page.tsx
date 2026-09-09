"use client"

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, GraduationCap, Users, Globe, LayoutDashboard, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 overflow-hidden font-sans">
      
      {/* Dynamic Background Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 opacity-50"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.1), transparent 40%)`
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AlumniConnect</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#customers" className="hover:text-white transition-colors">Customers</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</a>
            <a href="/tenant/moi/admin" className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2">
              View Demo <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center justify-center min-h-screen text-center z-10">
        <motion.div style={{ opacity, y: y2 }} className="max-w-4xl flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            <span>Introducing the future of alumni relations</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60"
          >
            Your network,<br />supercharged.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl font-light"
          >
            AlumniConnect is the intelligent platform for universities to cultivate lifelong relationships, boost fundraising, and power global mentorship networks.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
          >
            <a href="/tenant/moi/admin" className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 w-full sm:w-auto">
              Explore Platform <ArrowRight className="h-5 w-5" />
            </a>
            <a href="#features" className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold flex items-center justify-center transition-all border border-white/10 w-full sm:w-auto">
              Watch Video
            </a>
          </motion.div>
        </motion.div>

        {/* Abstract Interface Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5, type: "spring" }}
          className="w-full max-w-6xl mt-24 relative rounded-2xl border border-white/10 bg-[#111] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
          <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-[#0d0d0d]">
             <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-800" />
                <div className="w-3 h-3 rounded-full bg-slate-800" />
                <div className="w-3 h-3 rounded-full bg-slate-800" />
             </div>
             <div className="flex-1 text-center text-xs text-slate-500 font-medium">alumniconnect.app / admin</div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
             <div className="h-40 rounded-xl bg-white/5 border border-white/5" />
             <div className="h-40 rounded-xl bg-white/5 border border-white/5" />
             <div className="h-40 rounded-xl bg-white/5 border border-white/5" />
             <div className="md:col-span-2 h-64 rounded-xl bg-white/5 border border-white/5" />
             <div className="h-64 rounded-xl bg-white/5 border border-white/5" />
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-black relative z-10 border-t border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="mb-20">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Everything you need to <br/><span className="text-blue-500">engage your alumni.</span></h2>
               <p className="text-slate-400 text-lg max-w-xl">We replaced fragmented spreadsheets and outdated CRMs with a unified platform designed for the modern university.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                  { icon: LayoutDashboard, title: "Dynamic Directory", desc: "A self-updating database powered by AI that keeps alumni records accurate as they change jobs." },
                  { icon: Users, title: "Mentorship Matching", desc: "Algorithmic matching pairs students with the perfect alumni mentors based on career goals." },
                  { icon: Globe, title: "Global Chapters", desc: "Empower regional leaders to manage their own communities, events, and communications." }
               ].map((feature, i) => (
                  <motion.div 
                     key={i}
                     whileHover={{ y: -5 }}
                     className="p-8 rounded-2xl bg-[#111] border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer"
                  >
                     <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors">
                        <feature.icon className="h-6 w-6 text-slate-300 group-hover:text-blue-400" />
                     </div>
                     <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                     <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-32 px-6 relative overflow-hidden z-10 border-t border-white/5">
         <div className="absolute inset-0 bg-blue-600/10 blur-[100px] z-0" />
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to transform your alumni network?</h2>
            <a href="/tenant/moi/admin" className="inline-flex h-14 px-8 bg-white hover:bg-slate-200 text-black rounded-full font-semibold items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95">
              Start your free trial <ArrowRight className="h-5 w-5" />
            </a>
         </div>
      </footer>

    </div>
  );
}
