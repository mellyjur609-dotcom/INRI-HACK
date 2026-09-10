import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { KeyData, FunctionState } from "../types";
import {
  Crosshair,
  Target,
  Layers,
  Activity,
  LogOut,
  Clock,
  Smartphone,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  Scan,
} from "lucide-react";

interface MainDashboardProps {
  keyData: KeyData;
  onLogout: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ keyData, onLogout }) => {
  // Four function toggle states
  const [functions, setFunctions] = useState<FunctionState>({
    aimNeck: false,
    aimChest: false,
    invertedWall: false,
    espLine: false,
  });

  // Countdown timer calculation
  const [remainingTimeText, setRemainingTimeText] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const expiry = new Date(keyData.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setRemainingTimeText("EXPIRED");
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTimeText(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [keyData.expiresAt]);

  const toggleFunction = (func: keyof FunctionState) => {
    setFunctions((prev) => ({
      ...prev,
      [func]: !prev[func],
    }));
  };

  const formattedExpiry = new Date(keyData.expiresAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-[calc(100vh-2.5rem)] pb-12 px-4 max-w-lg mx-auto w-full">
      {/* Top Application Header */}
      <header className="pt-4 pb-5 flex items-center justify-between border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-wider text-white uppercase red-text-glow">
              INRI H4X
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-600/50 red-glow">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-red-300 uppercase">
                STATUS: ACTIVE
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">V4.2.0 KERNEL ENGINE</p>
        </div>

        <button
          id="logout-session-btn"
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-red-950/50 border border-zinc-800 hover:border-red-700/60 text-xs font-mono text-zinc-300 hover:text-red-300 transition-colors cursor-pointer"
          title="Disconnect session"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">DISCONNECT</span>
        </button>
      </header>

      {/* User Key Information Card */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 cyber-border rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span className="font-bold">AUTHENTICATED KEY INFO</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {keyData.key.slice(0, 9)}••••••••
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase block mb-0.5">Key Status</span>
            <div className="flex items-center gap-1.5 text-zinc-100 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {isExpired ? "EXPIRED" : keyData.status}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase block mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" />
              Remaining Time
            </span>
            <div className="text-red-400 font-bold tracking-tight text-[11px] truncate">
              {remainingTimeText || "Calculating..."}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase block mb-0.5">Expiry Date</span>
            <div className="text-zinc-200 text-[10px] sm:text-[11px] font-medium leading-tight">
              {formattedExpiry}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase block mb-0.5 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-red-500" />
              Device Status
            </span>
            <div className="text-zinc-300 font-medium text-[10px] truncate" title={keyData.deviceId}>
              LOCKED (1-DEVICE)
            </div>
          </div>
        </div>
      </motion.section>

      {/* FUNCTION CONTROLS HEADER */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
            TACTICAL ENGINE CONTROLS
          </h2>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">4 MODULES READY</span>
      </div>

      {/* FOUR LARGE FUTURISTIC FUNCTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* CARD 1: AIM NECK */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`cyber-border rounded-2xl p-4 transition-all duration-300 ${
            functions.aimNeck ? "cyber-card-active bg-red-950/20" : "bg-zinc-950/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  functions.aimNeck
                    ? "bg-red-600 text-white red-glow"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">AIM NECK</h3>
                <span className="text-[10px] font-mono text-zinc-400">Cervical Target Lock</span>
              </div>
            </div>

            {/* Animated Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  functions.aimNeck ? "bg-red-500 animate-ping" : "bg-zinc-600"
                }`}
              />
              <span className={functions.aimNeck ? "text-red-400 font-bold" : "text-zinc-400"}>
                {functions.aimNeck ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Toggle Subsystem</span>
            <button
              id="toggle-aim-neck-btn"
              type="button"
              onClick={() => toggleFunction("aimNeck")}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                functions.aimNeck
                  ? "bg-red-600 text-white red-glow hover:bg-red-500"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-600/50 hover:text-white"
              }`}
            >
              {functions.aimNeck ? "Disable" : "Enable"}
            </button>
          </div>
        </motion.div>

        {/* CARD 2: AIM CHEST */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`cyber-border rounded-2xl p-4 transition-all duration-300 ${
            functions.aimChest ? "cyber-card-active bg-red-950/20" : "bg-zinc-950/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  functions.aimChest
                    ? "bg-red-600 text-white red-glow"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">AIM CHEST</h3>
                <span className="text-[10px] font-mono text-zinc-400">Torso Mass Vector</span>
              </div>
            </div>

            {/* Animated Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  functions.aimChest ? "bg-red-500 animate-ping" : "bg-zinc-600"
                }`}
              />
              <span className={functions.aimChest ? "text-red-400 font-bold" : "text-zinc-400"}>
                {functions.aimChest ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Toggle Subsystem</span>
            <button
              id="toggle-aim-chest-btn"
              type="button"
              onClick={() => toggleFunction("aimChest")}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                functions.aimChest
                  ? "bg-red-600 text-white red-glow hover:bg-red-500"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-600/50 hover:text-white"
              }`}
            >
              {functions.aimChest ? "Disable" : "Enable"}
            </button>
          </div>
        </motion.div>

        {/* CARD 3: INVERTED WALL */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`cyber-border rounded-2xl p-4 transition-all duration-300 ${
            functions.invertedWall ? "cyber-card-active bg-red-950/20" : "bg-zinc-950/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  functions.invertedWall
                    ? "bg-red-600 text-white red-glow"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">INVERTED WALL</h3>
                <span className="text-[10px] font-mono text-zinc-400">Geometry Pass Overlay</span>
              </div>
            </div>

            {/* Animated Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  functions.invertedWall ? "bg-red-500 animate-ping" : "bg-zinc-600"
                }`}
              />
              <span className={functions.invertedWall ? "text-red-400 font-bold" : "text-zinc-400"}>
                {functions.invertedWall ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Toggle Subsystem</span>
            <button
              id="toggle-inverted-wall-btn"
              type="button"
              onClick={() => toggleFunction("invertedWall")}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                functions.invertedWall
                  ? "bg-red-600 text-white red-glow hover:bg-red-500"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-600/50 hover:text-white"
              }`}
            >
              {functions.invertedWall ? "Disable" : "Enable"}
            </button>
          </div>
        </motion.div>

        {/* CARD 4: ESP LINE */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`cyber-border rounded-2xl p-4 transition-all duration-300 ${
            functions.espLine ? "cyber-card-active bg-red-950/20" : "bg-zinc-950/70 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  functions.espLine
                    ? "bg-red-600 text-white red-glow"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">ESP LINE</h3>
                <span className="text-[10px] font-mono text-zinc-400">Trajectory Ray Trace</span>
              </div>
            </div>

            {/* Animated Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  functions.espLine ? "bg-red-500 animate-ping" : "bg-zinc-600"
                }`}
              />
              <span className={functions.espLine ? "text-red-400 font-bold" : "text-zinc-400"}>
                {functions.espLine ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Toggle Subsystem</span>
            <button
              id="toggle-esp-line-btn"
              type="button"
              onClick={() => toggleFunction("espLine")}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                functions.espLine
                  ? "bg-red-600 text-white red-glow hover:bg-red-500"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-red-600/50 hover:text-white"
              }`}
            >
              {functions.espLine ? "Disable" : "Enable"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* SIMULATED HUD RADAR TELEMETRY DISPLAY */}
      <section className="mt-6 cyber-border rounded-2xl p-4 bg-zinc-950/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <Scan className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">HUD SIMULATOR RADAR</span>
          </div>
          <span className="text-[10px] font-mono text-red-400">
            ACTIVE: {[functions.aimNeck, functions.aimChest, functions.invertedWall, functions.espLine].filter(Boolean).length}/4
          </span>
        </div>

        <div className="relative h-44 w-full rounded-xl bg-black/90 border border-red-950 overflow-hidden flex items-center justify-center">
          {/* Radar Circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-36 h-36 rounded-full border border-red-900/30" />
            <div className="w-24 h-24 rounded-full border border-red-900/40" />
            <div className="w-12 h-12 rounded-full border border-red-800/50" />
            <div className="absolute w-full h-[1px] bg-red-900/25" />
            <div className="absolute h-full w-[1px] bg-red-900/25" />
          </div>

          {/* Sweeping Radar Line */}
          <div
            className="absolute top-1/2 left-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent to-red-500 origin-left animate-spin"
            style={{ animationDuration: "3s" }}
          />

          {/* Dynamic Visual Feedback based on Functions */}
          {functions.aimNeck && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-10 left-28 flex flex-col items-center pointer-events-none"
            >
              <div className="w-5 h-5 rounded-full border border-red-500 bg-red-600/30 flex items-center justify-center red-glow">
                <span className="w-1 h-1 rounded-full bg-red-400" />
              </div>
              <span className="text-[9px] font-mono text-red-400 bg-black/80 px-1 rounded mt-0.5">
                NECK_LOCK
              </span>
            </motion.div>
          )}

          {functions.aimChest && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="absolute bottom-12 right-24 flex flex-col items-center pointer-events-none"
            >
              <div className="w-6 h-6 border border-red-400 bg-red-600/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-red-500" />
              </div>
              <span className="text-[9px] font-mono text-red-300 bg-black/80 px-1 rounded mt-0.5">
                CHEST_LOCK
              </span>
            </motion.div>
          )}

          {functions.espLine && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="50%"
                y1="100%"
                x2="35%"
                y2="30%"
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <line
                x1="50%"
                y1="100%"
                x2="70%"
                y2="45%"
                stroke="#DC2626"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </svg>
          )}

          {functions.invertedWall && (
            <div className="absolute inset-x-8 inset-y-6 border border-dashed border-red-600/40 rounded pointer-events-none flex items-center justify-center">
              <span className="text-[9px] font-mono text-red-400/70 tracking-widest uppercase">
                [GRID MATRIX INVERSION ACTIVE]
              </span>
            </div>
          )}

          {/* Central crosshair */}
          <div className="relative z-10 w-3 h-3 border border-red-500 flex items-center justify-center">
            <span className="w-1 h-1 bg-red-400 rounded-full" />
          </div>
        </div>

        {/* Prototype Interface Disclaimer */}
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>
            Prototype Interface: These controls demonstrate responsive UI states and hardware key authorization. They do not modify, inject, or interfere with external client environments.
          </span>
        </div>
      </section>
    </div>
  );
};
