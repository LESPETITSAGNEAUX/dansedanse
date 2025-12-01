import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";

interface LogEntry {
  id: number;
  time: string;
  type: "info" | "action" | "warning" | "error" | "success";
  message: string;
}

export function ActionLog() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, time: "14:20:01", type: "info", message: "Connexion au client GG établie" },
    { id: 2, time: "14:20:03", type: "success", message: "Table détectée: NL500 #492" },
    { id: 3, time: "14:20:05", type: "info", message: "Lecture de main: Ah Ks" },
    { id: 4, time: "14:20:06", type: "action", message: "GTO Wizard: Raise 2.5BB (EV: +0.42)" },
    { id: 5, time: "14:20:08", type: "warning", message: "Humanizer: Délai aléatoire ajouté (1.2s)" },
    { id: 6, time: "14:20:09", type: "success", message: "Action exécutée: Raise $12.50" },
    { id: 7, time: "14:20:22", type: "info", message: "Flop: Qd Jd 2s" },
    { id: 8, time: "14:20:23", type: "action", message: "GTO Wizard: Analyse Flop..." },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const interval = setInterval(() => {
          const newLog: LogEntry = {
              id: Date.now(),
              time: new Date().toLocaleTimeString('fr-FR'),
              type: "info",
              message: "Scanning tables..."
          };
          // Just a mockup, no real updates needed for now to keep it static but feeling alive
      }, 5000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black border border-border rounded-lg overflow-hidden font-mono text-xs h-full flex flex-col shadow-inner">
      <div className="bg-secondary/50 p-2 border-b border-border flex items-center justify-between">
        <span className="text-muted-foreground">TERMINAL_LOGS</span>
        <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 opacity-90 hover:opacity-100 transition-opacity">
              <span className="text-muted-foreground select-none">[{log.time}]</span>
              <span className={
                log.type === "action" ? "text-blue-400" :
                log.type === "warning" ? "text-yellow-400" :
                log.type === "success" ? "text-green-400" :
                log.type === "error" ? "text-red-400" :
                "text-gray-300"
              }>
                {log.type === "action" && "> "}
                {log.message}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
