import { createFileRoute } from "@tanstack/react-router";
import { Brain, MapPin, Sparkles, TrendingUp, Building2, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/nexus")({
  component: NexusDashboard,
});

function NexusDashboard() {
  return (
    <div className="container mx-auto py-8 max-w-6xl animate-fade-in space-y-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              The Nexus
            </h1>
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              <Sparkles className="w-3 h-3 mr-1" /> AI Active
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Welcome to your neural copilot. We've scanned the global network and found high-value opportunities for you today.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <MapPin className="w-4 h-4" /> Global Embassies
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 gap-2 shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-4 h-4" /> Venture Syndicate
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Proactive Matches */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Brain className="w-5 h-5 text-purple-500" />
            <h2 className="text-2xl font-semibold tracking-tight">Neural Matchmaker</h2>
          </div>

          <div className="space-y-6">
            {/* Match Card 1 */}
            <div className="relative group overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150" 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-sm"
                    />
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        Sarah Jenkins <Badge variant="secondary" className="text-xs">Class of '16</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3" /> Senior PM at Stripe
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Relocated to Dubai (2 weeks ago)
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                    98% Match
                  </Badge>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-xl text-sm mb-4 border border-border/50">
                  <span className="font-medium flex items-center gap-2 text-indigo-600 mb-1">
                    <Sparkles className="w-4 h-4" /> Why you're matched:
                  </span>
                  Sarah just moved to Dubai. Her team at Stripe is expanding their Fintech API product in the MENA region. Given your background in UAE payment gateways, the AI suggests an immediate synergy.
                </div>

                <div className="flex gap-3">
                  <Button className="w-full gap-2">
                    <Zap className="w-4 h-4" /> Send Intro (Drafted by AI)
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Match Card 2 */}
            <div className="relative group overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <img 
                      src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150" 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-sm"
                    />
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        David Chen <Badge variant="secondary" className="text-xs">Class of '09</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" /> Partner at Sequoia Capital
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> San Francisco, CA
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                    94% Match
                  </Badge>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-xl text-sm mb-4 border border-border/50">
                  <span className="font-medium flex items-center gap-2 text-indigo-600 mb-1">
                    <Sparkles className="w-4 h-4" /> Why you're matched:
                  </span>
                  You recently indicated you are raising a Seed round for your AI startup. David leads early-stage AI investments at Sequoia and recently engaged with another alum's LLM project. We've found a warm intro path via a mutual connection (James).
                </div>

                <div className="flex gap-3">
                  <Button className="w-full gap-2">
                    <Zap className="w-4 h-4" /> Request Warm Intro
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Radar & Insights */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold tracking-tight">On Your Radar</h2>
          </div>
          
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Flash Masterclass Starting Soon</h3>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
                LIVE
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Scaling to $100M ARR with 5 Engineers</p>
                <p className="text-xs text-muted-foreground mt-1">Hosted by CTO of Vercel</p>
              </div>
            </div>
            <Button variant="secondary" className="w-full text-xs">Join Session</Button>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Local Embassy Pulse (Dubai)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> Alumni in City</span>
                <span className="font-bold">432</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Building2 className="w-4 h-4" /> In Your Industry</span>
                <span className="font-bold">89</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Briefcase className="w-4 h-4" /> Active Hiring Roles</span>
                <span className="font-bold text-indigo-600">12</span>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs">View Dubai Guide</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
