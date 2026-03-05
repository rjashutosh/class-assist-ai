const API = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? data.message ?? "Request failed");
  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (body: { email: string; password: string; name: string; role: string; accountId?: string }) =>
    api<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => api<any>("/me"),
};

export const intentApi = {
  extract: (transcript: string) =>
    api<any>("/intent/extract", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    }),
};

export const voiceApi = {
  process: (transcript: string) =>
    api<{ success: boolean; intent?: string; data?: unknown }>("/voice/process", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    }),
};

export const executeApi = {
  execute: (body: Record<string, unknown>) =>
    api<{ success: boolean; class?: any; student?: any; cancelled?: string; remindersSent?: number }>("/execute", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const studentsApi = {
  list: () => api<any[]>("/students"),
  create: (body: { name: string; email?: string; phone?: string }) =>
    api<any>("/students", { method: "POST", body: JSON.stringify(body) }),
};

export const classesApi = {
  list: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api<any[]>(`/classes${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api<any>(`/classes/${id}`),
};

export const subscriptionApi = {
  limits: () =>
    api<{ canCreateClass: boolean; limit?: number; count?: number; tier: string }>("/subscription/limits"),
};

export const adminApi = {
  createAccount: (subscriptionTier: "BASIC" | "PRO") =>
    api<any>("/admin/accounts", {
      method: "POST",
      body: JSON.stringify({ subscriptionTier }),
    }),
  createUser: (body: { email: string; password: string; name: string; role: "TEACHER" | "MANAGER"; accountId: string }) =>
    api<any>("/admin/users", { method: "POST", body: JSON.stringify(body) }),
  accounts: () => api<any[]>("/admin/accounts"),
  usage: () => api<any[]>("/admin/usage"),
  analytics: () =>
    api<{
      totalAccounts: number;
      activeSubscriptions: number;
      monthlyRevenue: number;
      voiceCommandsUsage: number;
      classesCreatedThisMonth: number;
      classesPerAccount: { accountId: string; count: number }[];
    }>("/admin/analytics"),
};

export const notificationsApi = {
  list: () => api<any[]>("/notifications"),
};
