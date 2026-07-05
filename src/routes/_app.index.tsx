import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, AlertTriangle, PauseCircle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { adminApi, extractErrorMessage, formatDateUz, PLAN_LABEL } from "@/lib/api";
import { PlanBadge, StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function KPI({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: any; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-24 animate-pulse rounded-xl bg-slate-200/60" />;
}

function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["metrics"],
    queryFn: adminApi.metrics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Boshqaruv paneli</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorBlock message={extractErrorMessage(error)} onRetry={() => refetch()} />
    );
  }

  const planData = data.centersByPlan.map((p) => ({ name: PLAN_LABEL[p.plan] ?? p.plan, count: p.count }));
  const tierData = [
    { name: "Yashil", value: data.studentsByTier.green, color: "#10b981" },
    { name: "Sariq", value: data.studentsByTier.yellow, color: "#f59e0b" },
    { name: "Qizil", value: data.studentsByTier.red, color: "#f43f5e" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Boshqaruv paneli</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPI label="Jami markazlar" value={data.totalCenters} icon={Building2} accent="bg-indigo-50 text-indigo-600" />
        <KPI label="Faol markazlar" value={data.activeCenters} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
        <KPI label="To'xtatilgan" value={data.suspendedCenters} icon={PauseCircle} accent="bg-rose-50 text-rose-600" />
        <KPI label="Jami talabalar" value={data.totalStudents} icon={Users} accent="bg-sky-50 text-sky-600" />
        <KPI label="Xavf ostida" value={data.totalAtRisk} icon={AlertTriangle} accent="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-medium text-slate-700">Markazlar tarif bo'yicha</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-medium text-slate-700">Talabalar zonalar bo'yicha</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {tierData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 text-sm font-medium text-slate-700">So'nggi qo'shilgan markazlar</div>
        {data.recentCenters.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Hali markaz yo'q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nomi</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Tarif</th>
                  <th className="px-5 py-3">Holat</th>
                  <th className="px-5 py-3">Talabalar</th>
                  <th className="px-5 py-3">Qo'shilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentCenters.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link to="/centers/$id" params={{ id: c.id }} className="font-medium text-slate-900 hover:text-indigo-600">{c.name}</Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.slug}</td>
                    <td className="px-5 py-3"><PlanBadge plan={c.plan} /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 tabular-nums">{c.studentCount}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">{formatDateUz(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <div className="text-sm font-medium text-rose-800">Ma'lumotni yuklashda xatolik</div>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
      >
        Qayta urinish
      </button>
    </div>
  );
}
