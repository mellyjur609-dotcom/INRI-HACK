export interface KeyData {
  key: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  remainingMs: number;
  deviceId: string;
  activatedAt: string;
  durationDays: number;
}

export interface AdminKeyItem {
  id: string;
  key: string;
  durationDays: number;
  createdAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  deviceId: string | null;
  activatedAt: string | null;
}

export interface AdminStats {
  total: number;
  active: number;
  bound: number;
  expired: number;
  revoked: number;
}

export interface FunctionState {
  aimNeck: boolean;
  aimChest: boolean;
  invertedWall: boolean;
  espLine: boolean;
}
