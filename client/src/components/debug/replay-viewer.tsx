
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, SkipBack, SkipForward, 
  FastForward, Gauge, AlertTriangle, CheckCircle 
} from "lucide-react";

interface ReplayFrame {
  timestamp: number;
  screenshot: string;
  detectedState: any;
  gtoRecommendation: any;
  actionTaken: string;
  ocrResults: any;
  confidence: number;
}

interface ReplayViewerProps {
  sessionId: string;
}

export function ReplayViewer({ sessionId }: ReplayViewerProps) {
  const [frames, setFrames] = useState<ReplayFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/replay/session/${sessionId}`);
      const data = await response.json();
      setFrames(data.frames || []);
      
      const analyticsResponse = await fetch(`/api/replay/analytics/${sessionId}`);
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Erreur chargement replay:", error);
    }
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentFrame < frames.length - 1) {
      setCurrentFrame(currentFrame + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFrame > 0) {
      setCurrentFrame(currentFrame - 1);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const frame = frames[currentFrame];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Replay Viewer - Session {sessionId}</span>
            <Badge variant={isPlaying ? "default" : "secondary"}>
              {isPlaying ? "Playing" : "Paused"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Frame Viewer */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
            {frame?.screenshot ? (
              <img 
                src={`data:image/png;base64,${frame.screenshot}`}
                alt={`Frame ${currentFrame}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No frame data
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentFrame === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button size="sm" onClick={handlePlay}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleNext}
                disabled={currentFrame === frames.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 ml-4">
                <FastForward className="w-4 h-4 text-muted-foreground" />
                <select 
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  className="bg-background border border-border rounded px-2 py-1 text-sm"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
            </div>

            <Slider
              value={[currentFrame]}
              onValueChange={([value]) => setCurrentFrame(value)}
              max={frames.length - 1}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Frame {currentFrame + 1} / {frames.length}</span>
              <span>
                {frame ? new Date(frame.timestamp).toLocaleTimeString() : "--:--:--"}
              </span>
            </div>
          </div>

          {/* Frame Details */}
          {frame && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">État Détecté</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cartes héros:</span>
                    <span className="font-mono">{frame.detectedState?.heroCards?.join(" ") || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Board:</span>
                    <span className="font-mono">{frame.detectedState?.communityCards?.join(" ") || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pot:</span>
                    <span className="font-mono">${frame.detectedState?.pot || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Confiance:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{(frame.confidence * 100).toFixed(1)}%</span>
                      {frame.confidence > 0.7 ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Décision GTO</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommandé:</span>
                    <Badge variant="outline">{frame.gtoRecommendation?.bestAction || "N/A"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Action prise:</span>
                    <Badge 
                      variant={frame.actionTaken === frame.gtoRecommendation?.bestAction ? "default" : "destructive"}
                    >
                      {frame.actionTaken || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confiance GTO:</span>
                    <span className="font-mono">
                      {((frame.gtoRecommendation?.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Summary */}
          {analytics && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Analytics de Session
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-muted-foreground mb-1">Confiance Moyenne</div>
                    <div className="text-lg font-bold">
                      {(analytics.averageConfidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Frames Faible Conf.</div>
                    <div className="text-lg font-bold text-yellow-500">
                      {analytics.lowConfidenceFrames?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Déviations GTO</div>
                    <div className="text-lg font-bold text-orange-500">
                      {analytics.gtoDeviations?.length || 0}
                    </div>
                  </div>
                </div>

                {analytics.gtoDeviations?.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-muted-foreground mb-2">Déviations Détectées:</div>
                    <ScrollArea className="h-20">
                      {analytics.gtoDeviations.slice(0, 5).map((dev: any, idx: number) => (
                        <div key={idx} className="text-xs mb-1 flex justify-between">
                          <span>Frame {dev.frame}:</span>
                          <span>{dev.recommended} → {dev.actual}</span>
                          <span className="text-muted-foreground">({dev.reason})</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
