import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Zap, Target, Clock } from "lucide-react";

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-card border-border/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-mono">PROFIT NET</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary flex items-center gap-2">
            +$1,248.50
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 12%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Session en cours (4h 12m)</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-mono">BB/100</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground flex items-center gap-2">
            8.4 BB
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">
              Stable
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Moyenne sur 5k mains</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-mono">PRÉCISION GTO</CardTitle>
          <Target className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-500 flex items-center gap-2">
            98.2%
            <span className="text-xs bg-cyan-500/20 text-cyan-500 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 0.5%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Déviations mineures</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-mono">MAINS/HEURE</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground flex items-center gap-2">
            420
            <span className="text-xs bg-purple-500/20 text-purple-500 px-1.5 py-0.5 rounded flex items-center">
              4 Tables
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Vitesse optimale</p>
        </CardContent>
      </Card>
    </div>
  );
}
