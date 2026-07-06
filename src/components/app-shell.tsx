import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Inbox, Tag, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { auth } from "@/lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = auth.user;

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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <img src="/staydy.png" alt="" className="h-12 w-12 object-contain" />
          <span className="text-xl font-bold text-indigo-600">Staydy</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
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
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
