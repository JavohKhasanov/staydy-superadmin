import axios, { AxiosError, type AxiosRequestConfig } from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://multi.goport.uz/api/v1";

const ACCESS_KEY = "ssa_access_token";
const REFRESH_KEY = "ssa_refresh_token";
const USER_KEY = "ssa_user";

export type Role = "super_admin" | "center_admin" | string;
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
export interface AuthResponse {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: User;
}

export const auth = {
  get access() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  get user(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  set(session: AuthResponse) {
    localStorage.setItem(ACCESS_KEY, session.accessToken);
    localStorage.setItem(REFRESH_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "ngrok-skip-browser-warning": "true" },
});

api.interceptors.request.use((config) => {
  const token = auth.access;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  (config.headers as Record<string, string>)["ngrok-skip-browser-warning"] = "true";
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = auth.refresh;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "ngrok-skip-browser-warning": "true" } },
    );
    auth.set(data);
    return data.accessToken;
  } catch {
    auth.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/refresh") && !original.url?.includes("/admin/login")) {
      original._retry = true;
      refreshing = refreshing ?? doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ProblemDetails | undefined;
    return data?.detail || data?.title || err.message || "Noma'lum xatolik";
  }
  if (err instanceof Error) return err.message;
  return "Noma'lum xatolik";
}

// ---- Domain types ----
export type Plan = "trial" | "basic" | "pro";
export type Status = "active" | "suspended" | "archived";
export type BillingStatus = "trial" | "active" | "expired";

export interface CenterSummary {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: Status;
  billingStatus: BillingStatus;
  trialEndsAt?: string;
  trialDaysLeft: number;
  studentCount: number;
  userCount: number;
  atRiskCount: number;
  createdAt: string;
}
export interface CenterDetail extends CenterSummary {
  greenCount: number;
  yellowCount: number;
  redCount: number;
  lastActivityAt?: string;
}
export interface MetricsResponse {
  totalCenters: number;
  activeCenters: number;
  suspendedCenters: number;
  totalStudents: number;
  totalAtRisk: number;
  centersByPlan: { plan: Plan; count: number }[];
  studentsByTier: { green: number; yellow: number; red: number };
  recentCenters: CenterSummary[];
}

export interface CreateCenterRequest {
  organizationName: string;
  slug: string;
  plan?: Plan;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}
export interface UpdateCenterRequest {
  plan?: Plan;
  status?: Status;
}
export interface SetBillingRequest {
  plan?: Plan;
  billingStatus?: BillingStatus;
  trialEndsAt?: string; // YYYY-MM-DD
}

export type SignupStatus = "new" | "contacted" | "converted" | "rejected";
export interface SignupRequest {
  id: string;
  centerName: string;
  contactName: string;
  phone: string;
  email?: string;
  plan?: string;
  message?: string;
  status: SignupStatus;
  createdAt: string;
}

// ---- Endpoints ----
export const adminApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/admin/login", { email, password }).then((r) => r.data),
  metrics: () => api.get<MetricsResponse>("/admin/metrics").then((r) => r.data),
  listCenters: (params: { query?: string; plan?: Plan | ""; status?: Status | "" }) =>
    api
      .get<CenterSummary[]>("/admin/centers", {
        params: {
          query: params.query || undefined,
          plan: params.plan || undefined,
          status: params.status || undefined,
        },
      })
      .then((r) => r.data),
  getCenter: (id: string) =>
    api.get<CenterDetail>(`/admin/centers/${id}`).then((r) => r.data),
  createCenter: (body: CreateCenterRequest) =>
    api.post<{ center: CenterDetail; admin: User }>("/admin/centers", body).then((r) => r.data),
  updateCenter: (id: string, body: UpdateCenterRequest) =>
    api.patch<CenterSummary>(`/admin/centers/${id}`, body).then((r) => r.data),
  setBilling: (id: string, body: SetBillingRequest) =>
    api.patch<CenterDetail>(`/admin/centers/${id}/billing`, body).then((r) => r.data),
  deleteCenter: (id: string) => api.delete(`/admin/centers/${id}`).then(() => undefined),
  listSignupRequests: () =>
    api.get<SignupRequest[]>("/admin/signup-requests").then((r) => r.data),
  setSignupStatus: (id: string, status: SignupStatus) =>
    api.patch<SignupRequest>(`/admin/signup-requests/${id}`, { status }).then((r) => r.data),
};

export const PLAN_LABEL: Record<Plan, string> = {
  trial: "Sinov",
  basic: "Asosiy",
  pro: "Pro",
};
export const STATUS_LABEL: Record<Status, string> = {
  active: "Faol",
  suspended: "To'xtatilgan",
  archived: "Arxivlangan",
};
export const BILLING_LABEL: Record<BillingStatus, string> = {
  trial: "Sinov (bepul)",
  active: "To'langan",
  expired: "Muddati tugagan",
};
export const SIGNUP_STATUS_LABEL: Record<SignupStatus, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  converted: "Markaz yaratildi",
  rejected: "Rad etildi",
};

export function formatDateUz(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}
