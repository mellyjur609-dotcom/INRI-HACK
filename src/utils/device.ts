/**
 * Device Identifier Utility
 * Generates and stores a unique persistent Hardware/Device ID in localStorage.
 * Provides a testing switcher so the user can easily test the "Key already activated on another device" logic.
 */

const STORAGE_KEY = "inri_device_id";
const PRESET_DEVICES = [
  { id: "DEV-IPHONE-15-PRO-984F", name: "iPhone 15 Pro (Simulated A)" },
  { id: "DEV-GALAXY-S24-U-3721", name: "Galaxy S24 Ultra (Simulated B)" },
  { id: "DEV-PIXEL-9-PRO-410A", name: "Pixel 9 Pro (Simulated C)" },
];

function generateRandomDeviceId(): string {
  const chars = "0123456789ABCDEF";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DEV-HW-${suffix}`;
}

export function getCurrentDeviceId(): string {
  let devId = localStorage.getItem(STORAGE_KEY);
  if (!devId) {
    devId = PRESET_DEVICES[0].id;
    localStorage.setItem(STORAGE_KEY, devId);
  }
  return devId;
}

export function setDeviceId(newId: string): void {
  localStorage.setItem(STORAGE_KEY, newId);
  window.dispatchEvent(new CustomEvent("inri-device-changed", { detail: newId }));
}

export function generateAndSetNewDevice(): string {
  const newId = generateRandomDeviceId();
  setDeviceId(newId);
  return newId;
}

export function getPresetDevices() {
  return PRESET_DEVICES;
}
