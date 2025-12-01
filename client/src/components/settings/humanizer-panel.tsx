import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MousePointer2, Clock, EyeOff } from "lucide-react";

export function HumanizerPanel() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="text-lg font-mono flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          CONFIGURATION HUMANIZER
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Délai de Réflexion (Random)</Label>
              <p className="text-xs text-muted-foreground">Simule un temps de réflexion humain</p>
            </div>
            <span className="font-mono text-primary">1.5s - 4.2s</span>
          </div>
          <Slider defaultValue={[33]} max={100} step={1} className="w-full" />
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                 <MousePointer2 className="w-4 h-4" /> Mouvements de Souris (Bézier)
              </Label>
              <p className="text-xs text-muted-foreground">Courbes non-linéaires pour le curseur</p>
            </div>
            <Switch checked={true} />
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                 <EyeOff className="w-4 h-4" /> Miss-click Occasionnel
              </Label>
              <p className="text-xs text-muted-foreground">0.01% de chance d'erreur</p>
            </div>
            <Switch checked={false} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 text-xs font-mono">
            <Clock className="w-3 h-3 inline mr-2" />
            MODE FURTIF ACTIVÉ: Le bot évitera les actions instantanées aux timings suspects (ex: 0ms sur check/fold).
        </div>
      </CardContent>
    </Card>
  );
}
