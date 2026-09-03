const KEY = "gm_admin_device_id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export async function reportLoginDevice() {
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;
  try {
    await fetch("/api/user/login-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        deviceName: "Admin panel",
      }),
    });
  } catch {
    // non-blocking
  }
}
