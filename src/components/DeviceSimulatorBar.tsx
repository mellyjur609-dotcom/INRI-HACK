import React, { useState, useEffect } from "react";
import { getCurrentDeviceId, setDeviceId, generateAndSetNewDevice, getPresetDevices } from "../utils/device";
import { Smartphone, RefreshCw, ChevronDown, ShieldAlert } from "lucide-react";

interface DeviceSimulatorBarProps {
  onDeviceChange?: (newDeviceId: string) => void;
}

export const DeviceSimulatorBar: React.FC<DeviceSimulatorBarProps> = ({ onDeviceChange }) => {
  const [currentId, setCurrentId] = useState<string>(getCurrentDeviceId());
  const [isOpen, setIsOpen] = useState(false);
  const presets = getPresetDevices();

  useEffect(() => {
    const handleDeviceChange = (e: any) => {
      setCurrentId(e.detail);
      if (onDeviceChange) onDeviceChange(e.detail);
    };
    window.addEventListener("inri-device-changed", handleDeviceChange);
    return () => window.removeEventListener("inri-device-changed", handleDeviceChange);
  }, [onDeviceChange]);

  const handleSelect = (id: string) => {
    setDeviceId(id);
    setCurrentId(id);
    setIsOpen(false);
    if (onDeviceChange) onDeviceChange(id);
  };

  const handleGenerateNew = () => {
    const newId = generateAndSetNewDevice();
    setCurrentId(newId);
    setIsOpen(false);
    if (onDeviceChange) onDeviceChange(newId);
  };

  const activePreset = presets.find((p) => p.id === currentId);

  return (
    <div className="relative z-40 w-full bg-zinc-950/90 border-b border-red-900/30 backdrop-blur-md px-3 py-1.5 text-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="text-zinc-400 font-mono tracking-wider flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">DEVICE HWID:</span>
            <span className="text-zinc-200 font-semibold">{activePreset ? activePreset.name.split(" ")[0] : currentId.slice(0, 12)}...</span>
          </span>
        </div>

        <div className="relative">
          <button
            id="device-simulator-toggle-btn"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-red-950 hover:border-red-600/50 text-zinc-300 hover:text-white transition-colors"
            title="Switch device to test device-locking enforcement"
          >
            <span className="text-[10px] uppercase tracking-wider text-red-400 font-mono font-medium">Switch HWID (Test)</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded-lg bg-zinc-900/95 border border-red-800/40 p-2 shadow-2xl backdrop-blur-xl z-50">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                Simulate Device Switch
              </div>
              <div className="space-y-1">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                      p.id === currentId
                        ? "bg-red-950/60 border border-red-600/60 text-white font-medium"
                        : "hover:bg-zinc-800/70 text-zinc-300"
                    }`}
                  >
                    <span>{p.name}</span>
                    {p.id === currentId && <span className="text-[9px] text-red-400 font-mono">ACTIVE</span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-800/80 my-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-red-400" />
                  Random Device HWID
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Use this to test the <span className="text-red-400 font-semibold">"KEY ALREADY ACTIVATED ON ANOTHER DEVICE"</span> security rule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
