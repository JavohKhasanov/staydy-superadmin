import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Inbox, Tag, LogOut, KeyRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { auth, adminApi } from "@/lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = auth.user;
  const [pwOpen, setPwOpen] = useState(false);

  const handleLogout = () => {
    auth.clear();
    router.navigate({ to: "/login" });
  };

  const navItems = [
    { to: "/", label: "Boshqaruv paneli", icon: LayoutDashboard },
    { to: "/centers", label: "Markazlar", icon: Building2 },
    { to: "/requests", label: "So'rovlar", icon: Inbox },
    { to: "/pricing", label: "Narxlar", icon: Tag },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <img src="/staydy.png" alt="" className="h-12 w-12 object-contain" />
          <span className="text-xl font-bold text-indigo-600">Staydy</span>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1 p-3">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 px-3 py-1 text-xs">
            <div className="font-medium text-slate-900">{user?.fullName ?? "—"}</div>
            <div className="truncate text-slate-500">{user?.email}</div>
          </div>
          <button
            onClick={() => setPwOpen(true)}
            className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <KeyRound className="h-4 w-4" /> Parolni o'zgartirish
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

// ChangePasswordModal lets the platform owner rotate their own password (used to move off the
// seeded default). Self-contained: inline validation + status, no external toast dependency.
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSave = current.length > 0 && next.length >= 8 && next === confirm && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.changePassword(current, next);
      setDone(true);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Xatolik yuz berdi";
      setError(detail);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">Parolni o'zgartirish</h2>
        {done ? (
          <div className="mt-4">
            <p className="text-sm text-emerald-700">Parol o'zgartirildi.</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Yopish
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              type="password"
              placeholder="Joriy parol"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Yangi parol (kamida 8 belgi)"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Yangi parolni tasdiqlang"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {confirm.length > 0 && next !== confirm && (
              <p className="text-xs text-rose-600">Parollar mos kelmayapti</p>
            )}
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Saqlanmoqda…" : "Saqlash"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
