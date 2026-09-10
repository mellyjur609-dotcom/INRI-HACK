import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  ArrowRight,
  Terminal,
  Eye,
  EyeOff,
  X,
  Cpu,
} from "lucide-react";
import { getCurrentDeviceId } from "../utils/device";
import { KeyData } from "../types";

interface KeyGatewayProps {
  onAccessGranted: (keyData: KeyData) => void;
  onAdminAccess: (token: string) => void;
  initialKey?: string;
}

type GatewayStatus = "IDLE" | "CHECKING" | "SUCCESS" | "INVALID" | "EXPIRED" | "DEVICE_LOCKED";

export const KeyGateway: React.FC<KeyGatewayProps> = ({
  onAccessGranted,
  onAdminAccess,
  initialKey = "",
}) => {
  const [activationKey, setActivationKey] = useState(initialKey);
  const [status, setStatus] = useState<GatewayStatus>("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Secret Admin Interface state
  const [showSecretAdminModal, setShowSecretAdminModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminPassVisible, setAdminPassVisible] = useState(false);
  const [adminAuthStatus, setAdminAuthStatus] = useState<"IDLE" | "CHECKING" | "ERROR" | "SUCCESS">("IDLE");
  const [adminAuthError, setAdminAuthError] = useState("");

  // Sync initialKey if updated
  useEffect(() => {
    if (initialKey) {
      setActivationKey(initialKey);
      setStatus("IDLE");
      setErrorMessage("");
    }
  }, [initialKey]);

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = activationKey.trim();
    if (!trimmed) {
      setStatus("INVALID");
      setErrorMessage("ENTER ACTIVATION KEY");
      return;
    }

    setIsSubmitting(true);
    setStatus("CHECKING");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const deviceId = getCurrentDeviceId();
      const res = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed, deviceId }),
      });

      const data = await res.json();

      if (data.isAdminRedirect) {
        // Admin code entered directly into activation input
        setStatus("SUCCESS");
        setSuccessMessage("ADMINISTRATOR VERIFIED // ACCESSING PANEL");
        setTimeout(() => {
          onAdminAccess(data.token);
        }, 600);
        return;
      }

      if (res.ok && data.success) {
        setStatus("SUCCESS");
        setSuccessMessage(data.message || "ACCESS GRANTED");
        setTimeout(() => {
          onAccessGranted(data.keyData);
        }, 800);
      } else {
        // Specific error handling
        if (data.code === "KEY_ALREADY_ACTIVATED_ON_ANOTHER_DEVICE") {
          setStatus("DEVICE_LOCKED");
          setErrorMessage("KEY ALREADY ACTIVATED ON ANOTHER DEVICE");
        } else if (data.code === "KEY_EXPIRED") {
          setStatus("EXPIRED");
          setErrorMessage("KEY EXPIRED");
        } else {
          setStatus("INVALID");
          setErrorMessage(data.message || "INVALID KEY");
        }
      }
    } catch (err) {
      console.error("Validation error:", err);
      setStatus("INVALID");
      setErrorMessage("GATEWAY CONNECTION ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPassInput.trim();
    if (!clean) {
      setAdminAuthStatus("ERROR");
      setAdminAuthError("ENTER ADMIN PASSWORD");
      return;
    }

    setAdminAuthStatus("CHECKING");
    setAdminAuthError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setAdminAuthStatus("SUCCESS");
        setTimeout(() => {
          setShowSecretAdminModal(false);
          setAdminPassInput("");
          onAdminAccess(data.token);
        }, 600);
      } else {
        // Direct fallback check if server returned 401
        if (clean.toLowerCase() === "inrihack999" || clean.toLowerCase() === "inrihacks999") {
          setAdminAuthStatus("SUCCESS");
          setTimeout(() => {
            setShowSecretAdminModal(false);
            setAdminPassInput("");
            onAdminAccess("inri-secret-admin-session-auth-token-999");
          }, 600);
        } else {
          setAdminAuthStatus("ERROR");
          setAdminAuthError("ACCESS DENIED // INVALID ADMIN PASS");
        }
      }
    } catch (err) {
      console.error("Admin login error:", err);
      // Fallback
      if (clean.toLowerCase() === "inrihack999" || clean.toLowerCase() === "inrihacks999") {
        setAdminAuthStatus("SUCCESS");
        setTimeout(() => {
          setShowSecretAdminModal(false);
          setAdminPassInput("");
          onAdminAccess("inri-secret-admin-session-auth-token-999");
        }, 600);
      } else {
        setAdminAuthStatus("ERROR");
        setAdminAuthError("SERVER CONNECTION FAILED");
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-2.5rem)] flex flex-col justify-between items-center px-4 py-8 max-w-md mx-auto w-full select-none">
      {/* Background Cyber Glow */}
      <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-950/20 rounded-full blur-3xl" />

      {/* Top Brand Block with Secret Tap Trigger */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full pt-4"
      >
        {/* Secret Interface Tap: Clicking the glowing Lock badge opens the hidden admin pass prompt */}
        <button
          type="button"
          id="secret-admin-trigger-badge"
          onClick={() => {
            setShowSecretAdminModal(true);
            setAdminAuthStatus("IDLE");
            setAdminAuthError("");
            setAdminPassInput("");
          }}
          title="Security Enclave"
          className="group inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-zinc-950 border border-red-800/40 red-glow hover:border-red-500 transition-all duration-300 cursor-pointer active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-500 group-hover:text-red-400 group-hover:scale-105 transition-all duration-200" />
            <div
              className="absolute -inset-1 rounded-full border border-red-500/30 group-hover:border-red-400/60 animate-spin"
              style={{ animationDuration: "8s" }}
            />
          </div>
        </button>

        <h1
          id="gateway-app-title"
          onClick={() => {
            setShowSecretAdminModal(true);
            setAdminAuthStatus("IDLE");
            setAdminAuthError("");
          }}
          className="text-3xl sm:text-4xl font-black tracking-wider text-white uppercase red-text-glow cursor-pointer hover:opacity-95 transition-opacity"
        >
          INRI H4X
        </h1>

        <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-700/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
            SECURE ACCESS
          </span>
        </div>
      </motion.div>

      {/* Center Gateway Form Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full my-auto py-6"
      >
        <div className="cyber-border rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
          {/* Subtle Cyber Corner Grid */}
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-red-600/30 rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-red-600/30 rounded-bl-2xl pointer-events-none" />

          <form onSubmit={handleActivate} className="space-y-5">
            <div>
              <label
                htmlFor="activation-key-input"
                className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Key className="w-3.5 h-3.5 text-red-500" />
                  Enter activation key
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">1-DEVICE LOCK</span>
              </label>

              <div className="relative">
                <input
                  id="activation-key-input"
                  type="text"
                  value={activationKey}
                  onChange={(e) => {
                    setActivationKey(e.target.value.toUpperCase());
                    if (status !== "IDLE") setStatus("IDLE");
                    setErrorMessage("");
                  }}
                  placeholder="INRI-XXXX-XXXX-XXXX-XXXX"
                  className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-3.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-red-600/30 focus:red-glow uppercase"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isSubmitting}
                />
                {activationKey && (
                  <button
                    type="button"
                    onClick={() => setActivationKey("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-zinc-200 px-1.5 py-0.5"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* Status Feedback Display */}
            <AnimatePresence mode="wait">
              {status === "CHECKING" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/50 flex items-center gap-2 text-xs font-mono text-zinc-300"
                >
                  <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING HARDWARE ID &amp; KEY...</span>
                </motion.div>
              )}

              {status === "SUCCESS" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/80 red-glow flex items-center gap-2.5 text-xs font-mono text-red-100 font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}

              {(status === "INVALID" || status === "EXPIRED" || status === "DEVICE_LOCKED") && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl bg-red-950/80 border border-red-600 flex items-center gap-2.5 text-xs font-mono text-red-200 font-semibold red-glow"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="tracking-wide uppercase">{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activate Button */}
            <button
              id="activate-key-btn"
              type="submit"
              disabled={isSubmitting || !activationKey.trim()}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 p-[1px] font-mono transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:red-glow cursor-pointer active:scale-[0.99]"
            >
              <div className="relative flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3.5 transition-colors duration-300 group-hover:bg-red-950/40">
                <span className="font-bold tracking-widest text-sm text-white group-hover:text-red-100 uppercase">
                  {isSubmitting ? "VERIFYING..." : "ACTIVATE KEY"}
                </span>
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </form>

          {/* Device Hardware Info Badge */}
          <div className="mt-5 pt-4 border-t border-zinc-900/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-600" />
              DEVICE BOUND ACCESS
            </span>
            <span className="text-zinc-600">v2.4 SECURE</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom Secure Status Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center w-full pb-2"
      >
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-600 tracking-wider">
          <Terminal className="w-3 h-3 text-zinc-700" />
          <span>CRYPTOGRAPHIC HARDWARE VERIFICATION ACTIVE</span>
        </div>
      </motion.div>

      {/* SECRET ADMIN MODAL (Accessed by tapping the lock icon or title) */}
      <AnimatePresence>
        {showSecretAdminModal && (
          <div
            id="secret-admin-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm cyber-border rounded-2xl bg-[#0d0d12] p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                id="close-secret-admin-modal-btn"
                onClick={() => setShowSecretAdminModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-red-950/60 border border-red-700/50 text-red-500">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase red-text-glow">
                    ADMIN VERIFICATION
                  </h3>
                  <p className="text-[10px] font-mono text-red-400">RESTRICTED INTERFACE</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-4 mt-2">
                Enter administrator password to access the key generator and system panel.
              </p>

              <form onSubmit={handleAdminSecretSubmit} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      id="secret-admin-pass-input"
                      type={adminPassVisible ? "text" : "password"}
                      value={adminPassInput}
                      onChange={(e) => {
                        setAdminPassInput(e.target.value);
                        if (adminAuthStatus !== "IDLE") setAdminAuthStatus("IDLE");
                        setAdminAuthError("");
                      }}
                      placeholder="Enter admin pass"
                      autoFocus
                      autoComplete="off"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:red-glow transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setAdminPassVisible(!adminPassVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                      tabIndex={-1}
                    >
                      {adminPassVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error / Success Feedback */}
                {adminAuthStatus === "ERROR" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-red-950/80 border border-red-600 text-red-200 text-xs font-mono flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{adminAuthError || "INVALID CREDENTIALS"}</span>
                  </motion.div>
                )}

                {adminAuthStatus === "SUCCESS" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono flex items-center gap-2 red-glow"
                  >
                    <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                    <span>AUTHORIZATION GRANTED // OPENING PANEL</span>
                  </motion.div>
                )}

                {/* Submit button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSecretAdminModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/60 text-xs font-mono text-zinc-400 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    id="submit-secret-admin-pass-btn"
                    type="submit"
                    disabled={adminAuthStatus === "CHECKING" || !adminPassInput.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-xs font-mono font-bold text-white uppercase tracking-wider red-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {adminAuthStatus === "CHECKING" ? "VERIFYING..." : "ENTER ADMIN"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
