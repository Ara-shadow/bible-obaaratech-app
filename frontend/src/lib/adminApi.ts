const API = import.meta.env.VITE_API_URL || "";

export async function adminFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    throw new Error("AUTH_REQUIRED");
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

export async function adminLogout() {
  await adminFetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/admin/login";
}
