import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Users, AlertTriangle, UserCog, Trash2 } from "lucide-react";
import {
  adminApi,
  extractErrorMessage,
  formatDateUz,
  BILLING_LABEL,
  type Plan,
  type Status,
  type BillingStatus,
  type SetBillingRequest,
} from "@/lib/api";
import { PlanBadge, StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/_app/centers/$id")({
  component: CenterDetailPage,
});

function CenterDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<null | "toggle" | "delete">(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["center", id],
    queryFn: () => adminApi.getCenter(id),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { plan?: Plan; status?: Status }) => adminApi.updateCenter(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["center", id] });
      qc.invalidateQueries({ queryKey: ["centers"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success("Yangilandi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const billingMutation = useMutation({
    mutationFn: (body: SetBillingRequest) => adminApi.setBilling(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["center", id] });
      qc.invalidateQueries({ queryKey: ["centers"] });
      toast.success("To'lov holati yangilandi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCenter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["centers"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success("Markaz arxivlandi");
      router.navigate({ to: "/centers" });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-200/60" />;
  }
  if (isError || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <div className="text-sm text-rose-700">{extractErrorMessage(error)}</div>
        <button onClick={() => refetch()} className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white">Qayta urinish</button>
      </div>
    );
  }

  const isArchived = data.status === "archived";
  const toggleAction = data.status === "active" ? "suspended" : "active";
  const toggleLabel = data.status === "active" ? "To'xtatish" : "Faollashtirish";

  return (
    <div className="space-y-6">
      <button onClick={() => router.navigate({ to: "/centers" })} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Markazlar
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{data.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>{data.slug}</span>
            <PlanBadge plan={data.plan} />
            <StatusBadge status={data.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={data.plan}
            onChange={(e) => updateMutation.mutate({ plan: e.target.value as Plan })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="trial">Sinov</option>
            <option value="basic">Asosiy</option>
            <option value="pro">Pro</option>
          </select>
          {isArchived ? (
            <button
              onClick={() => updateMutation.mutate({ status: "active" })}
              disabled={updateMutation.isPending}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Tiklash
            </button>
          ) : (
            <>
              <button
                onClick={() => setConfirm("toggle")}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  data.status === "active"
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                }`}
              >
                {toggleLabel}
              </button>
              <button
                onClick={() => setConfirm("delete")}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                <Trash2 className="h-4 w-4" /> Arxivlash
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Talabalar" value={data.studentCount} icon={Users} accent="bg-sky-50 text-sky-600" />
        <Stat label="Xodimlar" value={data.userCount} icon={UserCog} accent="bg-indigo-50 text-indigo-600" />
        <Stat label="Xavf ostida" value={data.atRiskCount} icon={AlertTriangle} accent="bg-amber-50 text-amber-600" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Oxirgi faollik</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">{formatDateUz(data.lastActivityAt)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm font-medium text-slate-700">Talabalar zonalar bo'yicha</div>
        <div className="grid grid-cols-3 gap-4">
          <ZoneCard label="Yashil" count={data.greenCount} bar="bg-emerald-500" tint="text-emerald-700" />
          <ZoneCard label="Sariq" count={data.yellowCount} bar="bg-amber-500" tint="text-amber-700" />
          <ZoneCard label="Qizil" count={data.redCount} bar="bg-rose-500" tint="text-rose-700" />
        </div>
      </div>

      {/* Billing / subscription — manual for now; Payme/Click auto-charge is post-MVP */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">To'lov / Obuna</div>
          <BillingBadge status={data.billingStatus} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-slate-500">Sinov tugash sanasi</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {formatDateUz(data.trialEndsAt)}
              {data.billingStatus === "trial" && (
                <span
                  className={`ml-2 text-xs ${
                    data.trialDaysLeft < 0
                      ? "text-rose-600"
                      : data.trialDaysLeft <= 7
                        ? "text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {data.trialDaysLeft < 0
                    ? `(${-data.trialDaysLeft} kun o'tdi)`
                    : `(${data.trialDaysLeft} kun qoldi)`}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Sinovni uzaytirish</label>
            <input
              type="date"
              defaultValue={data.trialEndsAt ? data.trialEndsAt.slice(0, 10) : ""}
              onChange={(e) =>
                e.target.value &&
                billingMutation.mutate({ trialEndsAt: e.target.value, billingStatus: "trial" })
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => billingMutation.mutate({ billingStatus: "active" })}
            disabled={billingMutation.isPending || data.billingStatus === "active"}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            To'landi deb belgilash
          </button>
          <button
            onClick={() => billingMutation.mutate({ billingStatus: "trial" })}
            disabled={billingMutation.isPending || data.billingStatus === "trial"}
            className="rounded-md bg-sky-100 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-200 disabled:opacity-50"
          >
            Sinovga qaytarish
          </button>
          <button
            onClick={() => billingMutation.mutate({ billingStatus: "expired" })}
            disabled={billingMutation.isPending || data.billingStatus === "expired"}
            className="rounded-md bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-200 disabled:opacity-50"
          >
            Muddati tugagan
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Har yangi markaz avtomatik 1 oy bepul (sinov) oladi. Payme/Click orqali avtomatik to'lov
          keyinroq ulanadi — hozircha holatni qo'lda boshqarasiz.
        </p>
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm === "delete" ? "Markazni arxivlash" : toggleLabel}
          message={
            confirm === "delete"
              ? `"${data.name}" markazi arxivlanadi: foydalanuvchilar login qila olmaydi va u ro'yxatdan yashiriladi. Ma'lumotlar saqlanadi — keyin tiklash mumkin.`
              : `"${data.name}" markazining holati "${toggleAction === "active" ? "Faol" : "To'xtatilgan"}" ga o'zgaradi.`
          }
          confirmLabel={confirm === "delete" ? "Arxivlash" : toggleLabel}
          destructive={confirm === "delete"}
          loading={confirm === "delete" ? deleteMutation.isPending : updateMutation.isPending}
          onConfirm={() => {
            if (confirm === "delete") deleteMutation.mutate();
            else updateMutation.mutate({ status: toggleAction });
            setConfirm(null);
          }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function BillingBadge({ status }: { status: BillingStatus }) {
  const styles: Record<BillingStatus, string> = {
    trial: "bg-sky-50 text-sky-700 ring-sky-600/20",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    expired: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {BILLING_LABEL[status]}
    </span>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function ZoneCard({ label, count, bar, tint }: { label: string; count: number; bar: string; tint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className={`text-sm font-medium ${tint}`}>{label}</div>
        <div className="text-2xl font-semibold tabular-nums">{count}</div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: count > 0 ? "100%" : "0%" }} />
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, destructive, loading, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string; destructive?: boolean; loading?: boolean;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Bekor qilish</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60 ${destructive ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
