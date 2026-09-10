import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Interface for activation key records
export interface ActivationKey {
  id: string;
  key: string;
  durationDays: number;
  createdAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  deviceId: string | null;
  activatedAt: string | null;
}

// Storage for keys with file persistence backup
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "keys.json");

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Helper to generate format: INRI-XXXX-XXXX-XXXX-XXXX
export function generateSecureKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars (avoiding O/0, I/1 confusion)
  const getRandomBlock = (length = 4) => {
    let result = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    return result;
  };

  return `INRI-${getRandomBlock(4)}-${getRandomBlock(4)}-${getRandomBlock(4)}-${getRandomBlock(4)}`;
}

let keysDatabase: ActivationKey[] = [];

function loadKeys(): ActivationKey[] {
  try {
    ensureDataDirectory();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      keysDatabase = JSON.parse(content);
    } else {
      // Keys are created strictly by the administrator via the admin dashboard
      keysDatabase = [];
      saveKeys();
    }
  } catch (err) {
    console.error("Error loading keys database:", err);
  }
  return keysDatabase;
}

function saveKeys() {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE, JSON.stringify(keysDatabase, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving keys database:", err);
  }
}

// Refresh dynamic expiration states
function updateExpiredStatuses() {
  const now = Date.now();
  let changed = false;
  for (const k of keysDatabase) {
    if (k.status === "ACTIVE" && new Date(k.expiresAt).getTime() <= now) {
      k.status = "EXPIRED";
      changed = true;
    }
  }
  if (changed) {
    saveKeys();
  }
}

// Initialize database
loadKeys();

// Admin Authentication Middleware
const ADMIN_SECRET_CODES = ["INRIHACK999", "INRIHACKS999"];
const ADMIN_BEARER_TOKEN = "inri-secret-admin-session-auth-token-999";

function isValidAdminCode(code: unknown): boolean {
  if (typeof code !== "string") return false;
  return ADMIN_SECRET_CODES.includes(code.trim().toUpperCase());
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const adminHeader = req.headers["x-admin-key"] as string | undefined;

  if (
    authHeader === `Bearer ${ADMIN_BEARER_TOKEN}` ||
    (authHeader?.startsWith("Bearer ") && isValidAdminCode(authHeader.replace("Bearer ", ""))) ||
    isValidAdminCode(adminHeader)
  ) {
    return next();
  }
  res.status(401).json({ success: false, message: "UNAUTHORIZED_ADMIN_ACCESS" });
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", app: "INRI H4X", timestamp: new Date().toISOString() });
});

// 2. Key Gateway Validation Endpoint
app.post("/api/keys/validate", (req: Request, res: Response) => {
  updateExpiredStatuses();
  const { key, deviceId } = req.body;

  if (!key || typeof key !== "string") {
    res.status(400).json({
      success: false,
      code: "INVALID_KEY",
      message: "INVALID KEY",
    });
    return;
  }

  const cleanKey = key.trim().toUpperCase();

  // Hidden admin code check from key gateway
  if (isValidAdminCode(cleanKey)) {
    res.json({
      success: true,
      isAdminRedirect: true,
      token: ADMIN_BEARER_TOKEN,
      message: "ADMIN ACCESS AUTHORIZED",
    });
    return;
  }

  const foundKey = keysDatabase.find((k) => k.key.toUpperCase() === cleanKey);

  if (!foundKey) {
    res.status(400).json({
      success: false,
      code: "INVALID_KEY",
      message: "INVALID KEY",
    });
    return;
  }

  // Check revocation
  if (foundKey.status === "REVOKED") {
    res.status(400).json({
      success: false,
      code: "REVOKED_KEY",
      message: "KEY HAS BEEN REVOKED",
    });
    return;
  }

  // Check expiration
  const now = Date.now();
  const expiryTime = new Date(foundKey.expiresAt).getTime();
  if (expiryTime <= now || foundKey.status === "EXPIRED") {
    foundKey.status = "EXPIRED";
    saveKeys();
    res.status(400).json({
      success: false,
      code: "KEY_EXPIRED",
      message: "KEY EXPIRED",
    });
    return;
  }

  // Check device binding
  if (!deviceId || typeof deviceId !== "string") {
    res.status(400).json({
      success: false,
      code: "DEVICE_REQUIRED",
      message: "DEVICE IDENTIFIER REQUIRED",
    });
    return;
  }

  if (foundKey.deviceId === null) {
    // Permanently link to this first activating device
    foundKey.deviceId = deviceId;
    foundKey.activatedAt = new Date().toISOString();
    saveKeys();
  } else if (foundKey.deviceId !== deviceId) {
    // Already bound to a different device!
    res.status(403).json({
      success: false,
      code: "KEY_ALREADY_ACTIVATED_ON_ANOTHER_DEVICE",
      message: "KEY ALREADY ACTIVATED ON ANOTHER DEVICE",
      boundDevicePrefix: foundKey.deviceId.slice(0, 8) + "...",
    });
    return;
  }

  // Calculate remaining time
  const remainingMs = Math.max(0, expiryTime - now);

  res.json({
    success: true,
    code: "ACCESS_GRANTED",
    message: "ACCESS GRANTED",
    keyData: {
      key: foundKey.key,
      status: foundKey.status,
      expiresAt: foundKey.expiresAt,
      remainingMs,
      deviceId: foundKey.deviceId,
      activatedAt: foundKey.activatedAt,
      durationDays: foundKey.durationDays,
    },
  });
});

// 3. Admin Authentication Endpoint
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { code } = req.body;
  if (isValidAdminCode(code)) {
    res.json({
      success: true,
      token: ADMIN_BEARER_TOKEN,
      message: "ADMIN AUTHENTICATED",
    });
    return;
  }
  res.status(401).json({
    success: false,
    message: "INVALID ADMIN ACCESS CODE",
  });
});

// 4. Admin - List all keys
app.get("/api/admin/keys", requireAdminAuth, (_req: Request, res: Response) => {
  updateExpiredStatuses();
  const sorted = [...keysDatabase].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({
    success: true,
    keys: sorted,
    stats: {
      total: sorted.length,
      active: sorted.filter((k) => k.status === "ACTIVE").length,
      bound: sorted.filter((k) => k.deviceId !== null).length,
      expired: sorted.filter((k) => k.status === "EXPIRED").length,
      revoked: sorted.filter((k) => k.status === "REVOKED").length,
    },
  });
});

// 5. Admin - Generate Keys
app.post("/api/admin/keys/generate", requireAdminAuth, (req: Request, res: Response) => {
  const { durationDays, count = 1 } = req.body;
  const days = Number(durationDays);

  if (isNaN(days) || days <= 0) {
    res.status(400).json({ success: false, message: "INVALID_DURATION" });
    return;
  }

  const generatedCount = Math.min(Math.max(1, Number(count) || 1), 50); // limit per request
  const newKeys: ActivationKey[] = [];
  const now = Date.now();
  const expiryTime = now + days * 24 * 60 * 60 * 1000;

  for (let i = 0; i < generatedCount; i++) {
    const keyString = generateSecureKey();
    const newRecord: ActivationKey = {
      id: "key-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex"),
      key: keyString,
      durationDays: days,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiryTime).toISOString(),
      status: "ACTIVE",
      deviceId: null,
      activatedAt: null,
    };
    newKeys.push(newRecord);
    keysDatabase.push(newRecord);
  }

  saveKeys();

  res.json({
    success: true,
    message: `Generated ${newKeys.length} key(s)`,
    keys: newKeys,
  });
});

// 6. Admin - Revoke Key
app.post("/api/admin/keys/revoke", requireAdminAuth, (req: Request, res: Response) => {
  const { key } = req.body;
  if (!key) {
    res.status(400).json({ success: false, message: "KEY_REQUIRED" });
    return;
  }

  const found = keysDatabase.find((k) => k.key.toUpperCase() === key.trim().toUpperCase());
  if (!found) {
    res.status(404).json({ success: false, message: "KEY_NOT_FOUND" });
    return;
  }

  found.status = "REVOKED";
  saveKeys();

  res.json({
    success: true,
    message: "Key revoked successfully",
    key: found,
  });
});

// 7. Admin - Unbind Device (Helpful for reset & multi-device testing)
app.post("/api/admin/keys/unbind", requireAdminAuth, (req: Request, res: Response) => {
  const { key } = req.body;
  const found = keysDatabase.find((k) => k.key.toUpperCase() === key.trim().toUpperCase());
  if (!found) {
    res.status(404).json({ success: false, message: "KEY_NOT_FOUND" });
    return;
  }

  found.deviceId = null;
  found.activatedAt = null;
  saveKeys();

  res.json({
    success: true,
    message: "Device unlinked successfully",
    key: found,
  });
});

// 8. Admin - Delete Key
app.delete("/api/admin/keys/:id", requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = keysDatabase.findIndex((k) => k.id === id || k.key === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "KEY_NOT_FOUND" });
    return;
  }

  const [removed] = keysDatabase.splice(idx, 1);
  saveKeys();

  res.json({
    success: true,
    message: "Key deleted",
    key: removed,
  });
});

// ==========================================
// VITE & STATIC SERVING SETUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[INRI H4X] Secure Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
