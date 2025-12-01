import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { TableVisualizer } from "@/components/poker/table-visualizer";
import { ActionLog } from "@/components/poker/action-log";
import { HumanizerPanel } from "@/components/settings/humanizer-panel";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-sans">Tableau de Bord</h1>
                <p className="text-muted-foreground">Surveillance en temps réel des opérations GTO.</p>
            </div>
            <div className="flex gap-2">
                <button className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/50 px-4 py-2 rounded font-mono text-sm transition-colors">
                    STOP URGENCE
                </button>
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all">
                    NOUVELLE TABLE
                </button>
            </div>
        </div>

        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <TableVisualizer />
            <div className="flex-1 min-h-0">
                 <ActionLog />
            </div>
          </div>
          <div className="lg:col-span-1">
            <HumanizerPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
