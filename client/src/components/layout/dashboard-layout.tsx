import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, Activity, Terminal, Shield, Cpu, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/" },
    { icon: Activity, label: "Tables en Direct", href: "/live" },
    { icon: Terminal, label: "Logs Système", href: "/logs" },
    { icon: Settings, label: "Configuration", href: "/settings" },
    { icon: Bug, label: "Debug", href: "/debug" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl fixed h-full z-50 hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 text-primary">
            <Shield className="w-8 h-8 animate-pulse" />
            <div>
              <h1 className="font-bold font-mono tracking-wider text-lg">GTO-BOT</h1>
              <p className="text-xs text-muted-foreground font-mono">v3.4.1-STABLE</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  <span className="font-medium tracking-wide">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-mono">STATUS: CONNECTÉ</p>
              <p className="text-xs text-primary font-mono">GGNET: ACTIF</p>
            </div>
            <Cpu className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        <div className="absolute inset-0 grid-bg z-[-1] opacity-20" />
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              {/* Mobile menu trigger would go here */}
              <LayoutDashboard className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="font-mono text-sm text-muted-foreground">
              SESSION ID: <span className="text-foreground">#8X99-ALPHA</span>
            </h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-primary font-mono">GTO WIZARD: ONLINE</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                <span className="font-bold text-xs">OP</span>
             </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto space-y-8 fade-in-50 animate-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}