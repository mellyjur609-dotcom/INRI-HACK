import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AdminKeyItem, AdminStats } from "../types";
import {
  ShieldAlert,
  Key,
  PlusCircle,
  Search,
  Copy,
  Check,
  Ban,
  Trash2,
  Clock,
  Smartphone,
  Calendar,
  LogOut,
  RefreshCw,
  Sparkles,
  Link2Off,
  Filter,
} from "lucide-react";

interface AdminDashboardProps {
  adminToken: string;
  onExit: () => void;
  onUseKeyInGateway?: (keyString: string) => void;
}

const PRESET_DURATIONS = [
  { label: "1 Day", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminToken,
  onExit,
  onUseKeyInGateway,
}) => {
  const [keys, setKeys] = useState<AdminKeyItem[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    active: 0,
    bound: 0,
    expired: 0,
    revoked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Generation controls
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDays, setCustomDays] = useState<number>(45);
  const [generateQuantity, setGenerateQuantity] = useState<number>(1);
  const [newlyGenerated, setNewlyGenerated] = useState<AdminKeyItem[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "REVOKED">("ALL");

  // Copy indicator state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/keys", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [adminToken]);

  const handleGenerateKey = async () => {
    const daysToUse = isCustomDuration ? customDays : selectedDuration;
    if (!daysToUse || daysToUse <= 0) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/admin/keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          durationDays: daysToUse,
          count: generateQuantity,
        }),
      });

      const data = await res.json();
      if (data.success && data.keys) {
        setNewlyGenerated(data.keys);
        fetchKeys();
      }
    } catch (err) {
      console.error("Key generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyString: string) => {
    if (!confirm(`Revoke key ${keyString}? The device will be blocked.`)) return;

    try {
      const res = await fetch("/api/admin/keys/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ key: keyString }),
      });
      const data = await res.json();
      if (data.success) {
        fetchKeys();
      }
    } catch (err) {
      console.error("Revoke error:", err);
    }
  };

  const handleUnbindDevice = async (keyString: string) => {
    try {
      const res = await fetch("/api/admin/keys/unbind", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ key: keyString }),
      });
      const data = await res.json();
      if (data.success) {
        fetchKeys();
      }
    } catch (err) {
      console.error("Unbind error:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const calculateRemaining = (expiresAt: string, status: string) => {
    if (status === "REVOKED") return "REVOKED";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0 || status === "EXPIRED") return "EXPIRED";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${mins}m`;
  };

  // Filter keys
  const filteredKeys = keys.filter((item) => {
    const matchesSearch =
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.deviceId && item.deviceId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && item.status === "ACTIVE") ||
      (statusFilter === "EXPIRED" && item.status === "EXPIRED") ||
      (statusFilter === "REVOKED" && item.status === "REVOKED");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-[calc(100vh-2.5rem)] pb-16 px-4 max-w-2xl mx-auto w-full">
      {/* Top Admin Header */}
      <header className="pt-4 pb-5 flex items-center justify-between border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase red-text-glow">
              ADMIN DASHBOARD
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-600/50 text-[10px] font-mono text-red-300 font-bold">
              SUPERUSER
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">INRI H4X KEY ARCHITECTURE &amp; LICENSING</p>
        </div>

        <button
          id="exit-admin-btn"
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/50 border border-zinc-800 hover:border-red-700/60 text-xs font-mono text-zinc-300 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span>EXIT ADMIN</span>
        </button>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
        <div className="cyber-border rounded-xl p-3 bg-zinc-950/80">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Total Keys</span>
          <span className="text-xl font-black text-white font-mono">{stats.total}</span>
        </div>
        <div className="cyber-border rounded-xl p-3 bg-zinc-950/80">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Active Keys</span>
          <span className="text-xl font-black text-green-400 font-mono">{stats.active}</span>
        </div>
        <div className="cyber-border rounded-xl p-3 bg-zinc-950/80">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Bound Devices</span>
          <span className="text-xl font-black text-red-400 font-mono">{stats.bound}</span>
        </div>
        <div className="cyber-border rounded-xl p-3 bg-zinc-950/80">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Expired/Revoked</span>
          <span className="text-xl font-black text-zinc-400 font-mono">{stats.expired + stats.revoked}</span>
        </div>
      </section>

      {/* SECTION 1: GENERATE KEY */}
      <section className="mt-6 cyber-border rounded-2xl p-5 bg-zinc-950/90 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-200 font-bold">
              1. GENERATE KEY
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">CRYPTOGRAPHIC RANDOM KEYS</span>
        </div>

        {/* Duration Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
            Select Key Duration:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_DURATIONS.map((dur) => (
              <button
                key={dur.days}
                type="button"
                onClick={() => {
                  setSelectedDuration(dur.days);
                  setIsCustomDuration(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  !isCustomDuration && selectedDuration === dur.days
                    ? "bg-red-600 text-white red-glow border border-red-500"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-red-900 hover:text-white"
                }`}
              >
                {dur.label}
              </button>
            ))}

            {/* Custom Duration Button */}
            <button
              type="button"
              onClick={() => setIsCustomDuration(true)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                isCustomDuration
                  ? "bg-red-600 text-white red-glow border border-red-500"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-red-900 hover:text-white"
              }`}
            >
              Custom duration
            </button>
          </div>

          {/* Custom Duration Input Field */}
          {isCustomDuration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-2 flex items-center gap-3"
            >
              <span className="text-xs font-mono text-zinc-300">Days:</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-xs font-mono text-zinc-400">
                ({(customDays * 24).toLocaleString()} hours validity)
              </span>
            </motion.div>
          )}

          {/* Batch quantity */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Generate Quantity:</span>
            <div className="flex gap-1.5">
              {[1, 3, 5, 10].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setGenerateQuantity(qty)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    generateQuantity === qty
                      ? "bg-red-950 text-red-300 border border-red-700"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {qty}x
                </button>
              ))}
            </div>
          </div>

          {/* Generate Key button */}
          <button
            id="generate-key-submit-btn"
            type="button"
            onClick={handleGenerateKey}
            disabled={generating}
            className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono font-bold text-sm tracking-wider uppercase red-glow transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {generating ? "GENERATING SECURE KEY..." : "GENERATE KEY"}
          </button>
        </div>

        {/* Newly Generated Keys Banner */}
        <AnimatePresence>
          {newlyGenerated.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-600/50 red-glow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-red-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  Newly Generated Key ({newlyGenerated.length}):
                </span>
                <button
                  type="button"
                  onClick={() => setNewlyGenerated([])}
                  className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
                >
                  DISMISS
                </button>
              </div>

              <div className="space-y-2">
                {newlyGenerated.map((k) => (
                  <div
                    key={k.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-mono text-white font-bold tracking-wider block">
                        {k.key}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Duration: {k.durationDays} Days • Unbound
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(k.key)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200"
                        title="Copy generated key"
                      >
                        {copiedKey === k.key ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-red-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onUseKeyInGateway && (
                        <button
                          type="button"
                          onClick={() => onUseKeyInGateway(k.key)}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-xs font-mono text-white font-semibold"
                          title="Activate in Gateway"
                        >
                          Test In Gateway
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 2: KEY MANAGEMENT */}
      <section className="mt-6 cyber-border rounded-2xl p-5 bg-zinc-950/90">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-200 font-bold">
              2. KEY MANAGEMENT
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchKeys}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="admin-search-keys-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keys by code or hardware device ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-zinc-400 text-[10px] uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(["ALL", "ACTIVE", "EXPIRED", "REVOKED"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? "bg-red-950 text-red-300 border border-red-600/70 font-bold"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Key List Items */}
        <div className="space-y-3">
          {filteredKeys.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-zinc-400">
              {loading ? "Loading key registry..." : "No keys found matching query."}
            </div>
          ) : (
            filteredKeys.map((item) => {
              const remaining = calculateRemaining(item.expiresAt, item.status);
              const isRevoked = item.status === "REVOKED";
              const isExpired = item.status === "EXPIRED" || remaining === "EXPIRED";

              return (
                <div
                  key={item.id}
                  className="cyber-border rounded-xl p-3.5 bg-zinc-900/60 hover:bg-zinc-900/90 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white tracking-wider">
                        {item.key}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.key)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Copy generated key button"
                      >
                        {copiedKey === item.key ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isRevoked
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : isExpired
                            ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            : "bg-green-950/60 text-green-400 border border-green-800/60"
                        }`}
                      >
                        {isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE"}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {item.durationDays}D LICENSE
                      </span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-2.5 text-zinc-400">
                    <div>
                      <span className="block text-zinc-400">Created:</span>
                      <span className="text-zinc-200">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-zinc-400">Expiry Date:</span>
                      <span className="text-zinc-200">
                        {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-zinc-400">Remaining Time:</span>
                      <span className={isExpired || isRevoked ? "text-red-400" : "text-green-400 font-bold"}>
                        {remaining}
                      </span>
                    </div>
                    <div>
                      <span className="block text-zinc-400">Device ID:</span>
                      <span className="text-zinc-200 truncate block" title={item.deviceId || "Unbound"}>
                        {item.deviceId ? item.deviceId.slice(0, 10) + "..." : "UNBOUND"}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-zinc-400">
                      {item.deviceId ? (
                        <span className="text-red-400">Bound to: {item.deviceId.slice(0, 16)}</span>
                      ) : (
                        <span className="text-zinc-400">Ready for 1st device activation</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Unbind Device Button (handy for testing multi-device flows) */}
                      {item.deviceId && !isRevoked && (
                        <button
                          type="button"
                          onClick={() => handleUnbindDevice(item.key)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition-colors"
                          title="Unbind hardware ID for testing"
                        >
                          <Link2Off className="w-3 h-3 text-red-400" />
                          <span>Unbind</span>
                        </button>
                      )}

                      {/* Revoke button */}
                      {!isRevoked && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(item.key)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-700/60 text-red-200 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                        >
                          <Ban className="w-3 h-3 text-red-400" />
                          <span>Revoke Key</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
