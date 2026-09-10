import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KeyGateway } from "./components/KeyGateway";
import { MainDashboard } from "./components/MainDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { DeviceSimulatorBar } from "./components/DeviceSimulatorBar";
import { KeyData } from "./types";
import { getCurrentDeviceId } from "./utils/device";

type AppView = "GATEWAY" | "MAIN" | "ADMIN";

export default function App() {
  const [view, setView] = useState<AppView>("GATEWAY");
  const [keyData, setKeyData] = useState<KeyData | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [initialGatewayKey, setInitialGatewayKey] = useState<string>("");

  // Validate session against current device on boot
  useEffect(() => {
    const savedKey = localStorage.getItem("inri_active_key");
    if (savedKey) {
      const deviceId = getCurrentDeviceId();
      fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: savedKey, deviceId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.keyData) {
            setKeyData(data.keyData);
            setView("MAIN");
          } else {
            localStorage.removeItem("inri_active_key");
          }
        })
        .catch(() => {
          localStorage.removeItem("inri_active_key");
        });
    }
  }, []);

  // When device is switched in the simulator toolbar, re-verify key binding
  const handleDeviceChange = async (newDeviceId: string) => {
    if (view === "MAIN" && keyData) {
      try {
        const res = await fetch("/api/keys/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: keyData.key, deviceId: newDeviceId }),
        });
        const data = await res.json();
        if (!data.success) {
          // Device mismatch! Exit to gateway
          alert(`Device HWID changed to ${newDeviceId.slice(0, 16)}...\n${data.message || "KEY ALREADY ACTIVATED ON ANOTHER DEVICE"}`);
          setKeyData(null);
          localStorage.removeItem("inri_active_key");
          setView("GATEWAY");
        }
      } catch (err) {
        console.error("Device check error:", err);
      }
    }
  };

  const handleAccessGranted = (newKeyData: KeyData) => {
    setKeyData(newKeyData);
    localStorage.setItem("inri_active_key", newKeyData.key);
    setView("MAIN");
  };

  const handleAdminAccess = (token: string) => {
    setAdminToken(token);
    setView("ADMIN");
  };

  const handleLogout = () => {
    localStorage.removeItem("inri_active_key");
    setKeyData(null);
    setView("GATEWAY");
  };

  const handleExitAdmin = () => {
    setAdminToken(null);
    setView("GATEWAY");
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Cyber Grid Lines */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Device Switcher Header Toolbar (Allows instant testing of 1-device lock) */}
      <DeviceSimulatorBar onDeviceChange={handleDeviceChange} />

      {/* Mobile-First Container Frame */}
      <main className="flex-1 w-full flex flex-col items-center justify-start relative z-10">
        <AnimatePresence mode="wait">
          {view === "GATEWAY" && (
            <motion.div
              key="gateway"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <KeyGateway
                initialKey={initialGatewayKey}
                onAccessGranted={handleAccessGranted}
                onAdminAccess={handleAdminAccess}
              />
            </motion.div>
          )}

          {view === "MAIN" && keyData && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <MainDashboard keyData={keyData} onLogout={handleLogout} />
            </motion.div>
          )}

          {view === "ADMIN" && adminToken && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <AdminDashboard
                adminToken={adminToken}
                onExit={handleExitAdmin}
                onUseKeyInGateway={(keyStr) => {
                  setInitialGatewayKey(keyStr);
                  handleExitAdmin();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
