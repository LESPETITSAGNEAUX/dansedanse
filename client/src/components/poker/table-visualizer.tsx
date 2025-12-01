import { motion } from "framer-motion";
import tableBg from "@assets/generated_images/futuristic_digital_poker_table_top-down_view.png";
import { Badge } from "@/components/ui/badge";

export function TableVisualizer() {
  const seats = [
    { id: 1, x: "50%", y: "85%", name: "HERO", chips: "$1,250", cards: ["Ah", "Ks"], active: true },
    { id: 2, x: "20%", y: "70%", name: "Villain 1", chips: "$840", cards: ["??", "??"], active: false },
    { id: 3, x: "15%", y: "40%", name: "Villain 2", chips: "$2,100", cards: ["??", "??"], active: false },
    { id: 4, x: "50%", y: "15%", name: "Villain 3", chips: "$500", cards: ["??", "??"], active: false },
    { id: 5, x: "85%", y: "40%", name: "Villain 4", chips: "$1,500", cards: ["??", "??"], active: false },
    { id: 6, x: "80%", y: "70%", name: "Villain 5", chips: "$900", cards: ["??", "??"], active: false },
  ];

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-2xl bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${tableBg})` }}
      />
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur border border-primary/30 p-2 rounded font-mono text-xs text-primary">
          TABLE: NL500 #492
          <br/>
          POT: $125.00
        </div>
        
        {/* Community Cards */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2">
          {["Qd", "Jd", "2s"].map((card, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.2 }}
               className="w-10 h-14 bg-white rounded shadow-lg flex items-center justify-center text-black font-bold border border-gray-300"
             >
               {card}
             </motion.div>
          ))}
          <div className="w-10 h-14 border-2 border-dashed border-white/20 rounded flex items-center justify-center text-white/20 text-xs">
            Turn
          </div>
           <div className="w-10 h-14 border-2 border-dashed border-white/20 rounded flex items-center justify-center text-white/20 text-xs">
            Riv
          </div>
        </div>
      </div>

      {/* Seats */}
      {seats.map((seat) => (
        <div
          key={seat.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
          style={{ left: seat.x, top: seat.y }}
        >
          <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black/80 backdrop-blur ${seat.active ? 'border-primary shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-white/10'}`}>
            <span className="text-xs font-bold text-white/80">{seat.name}</span>
            {seat.active && (
                <span className="absolute -bottom-1 w-2 h-2 bg-primary rounded-full animate-ping" />
            )}
          </div>
          <div className="bg-black/80 backdrop-blur border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-white">
            {seat.chips}
          </div>
          {seat.active && (
            <div className="flex gap-1">
               <div className="w-8 h-10 bg-white rounded text-black text-xs font-bold flex items-center justify-center border border-gray-400">A<span className="text-red-500">♥</span></div>
               <div className="w-8 h-10 bg-white rounded text-black text-xs font-bold flex items-center justify-center border border-gray-400">K<span className="text-black">♠</span></div>
            </div>
          )}
        </div>
      ))}

      {/* Action Suggestion Overlay */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute right-4 top-20 w-48 bg-black/80 backdrop-blur border border-cyan-500/30 p-3 rounded-lg"
      >
        <h4 className="text-xs font-bold text-cyan-500 font-mono mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3" /> GTO RECOMMENDATION
        </h4>
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-white">
                <span>CHECK</span>
                <span className="text-gray-400">12%</span>
            </div>
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-500 w-[12%]" />
            </div>

            <div className="flex justify-between text-xs text-white">
                <span>BET 33%</span>
                <span className="text-primary font-bold">65%</span>
            </div>
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%] shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </div>

             <div className="flex justify-between text-xs text-white">
                <span>BET 75%</span>
                <span className="text-gray-400">23%</span>
            </div>
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-500 w-[23%]" />
            </div>
        </div>
      </motion.div>
    </div>
  );
}

import { Zap } from "lucide-react";
