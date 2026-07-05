import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { adminApi, extractErrorMessage, formatDateUz, type Plan, type Status } from "@/lib/api";
import { PlanBadge, StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/_app/centers/")({
  component: CentersPage,
});

const createSchema = z.object({
  organizationName: z.string().min(1, "Nomi majburiy"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Faqat a-z, 0-9 va '-'").min(1, "Slug majburiy"),
  plan: z.enum(["trial", "basic", "pro"]),
  adminFullName: z.string().min(1, "F.I.Sh. majburiy"),
  adminEmail: z.string().email("Email noto'g'ri"),
  adminPassword: z.string().min(8, "Kamida 8 belgi"),
});
type CreateValues = z.infer<typeof createSchema>;

function CentersPage() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<Plan | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [openCreate, setOpenCreate] = useState(false);

  const filters = { query, plan, status };
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["centers", filters],
    queryFn: () => adminApi.listCenters(filters),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Markazlar</h1>
        <button
          onClick={() => setOpenCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Yangi markaz
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nomi yoki slug bo'yicha qidirish..."
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as Plan | "")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Barcha tariflar</option>
          <option value="trial">Sinov</option>
          <option value="basic">Asosiy</option>
          <option value="pro">Pro</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status | "")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="suspended">To'xtatilgan</option>
          <option value="archived">Arxivlangan</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <div className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">{extractErrorMessage(error)}</div>
            <button onClick={() => refetch()} className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white">Qayta urinish</button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Markaz topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nomi</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Tarif</th>
                  <th className="px-5 py-3">Holat</th>
                  <th className="px-5 py-3">To'lov</th>
                  <th className="px-5 py-3 text-right">Talabalar</th>
                  <th className="px-5 py-3 text-right">Xavfda</th>
                  <th className="px-5 py-3 text-right">Foydalanuvchilar</th>
                  <th className="px-5 py-3">Qo'shilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link to="/centers/$id" params={{ id: c.id }} className="font-medium text-slate-900 hover:text-indigo-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.slug}</td>
                    <td className="px-5 py-3"><PlanBadge plan={c.plan} /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.billingStatus === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : c.billingStatus === "expired"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {c.billingStatus === "active"
                          ? "To'langan"
                          : c.billingStatus === "expired"
                            ? "Tugagan"
                            : `Sinov · ${c.trialDaysLeft}k`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.studentCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-amber-700">{c.atRiskCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.userCount}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDateUz(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openCreate && <CreateCenterDialog onClose={() => setOpenCreate(false)} />}
    </div>
  );
}

function CreateCenterDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { organizationName: "", slug: "", plan: "trial", adminFullName: "", adminEmail: "", adminPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateValues) => adminApi.createCenter(values),
    onSuccess: () => {
      toast.success("Markaz yaratildi");
      qc.invalidateQueries({ queryKey: ["centers"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      onClose();
    },
    onError: (e: any) => {
      const status = e?.response?.status;
      if (status === 409) toast.error("Bu slug yoki email band");
      else toast.error(extractErrorMessage(e));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-lg font-semibold text-slate-900">Yangi markaz qo'shish</div>
        </div>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 px-6 py-5">
          <Field label="Tashkilot nomi" error={errors.organizationName?.message}>
            <input className="input" {...register("organizationName")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" error={errors.slug?.message}>
              <input className="input" placeholder="ielts-center" {...register("slug")} />
            </Field>
            <Field label="Tarif" error={errors.plan?.message}>
              <select className="input" {...register("plan")}>
                <option value="trial">Sinov</option>
                <option value="basic">Asosiy</option>
                <option value="pro">Pro</option>
              </select>
            </Field>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 text-sm font-medium text-slate-700">Birinchi admin</div>
            <div className="space-y-3">
              <Field label="F.I.Sh." error={errors.adminFullName?.message}>
                <input className="input" {...register("adminFullName")} />
              </Field>
              <Field label="Email" error={errors.adminEmail?.message}>
                <input type="email" className="input" {...register("adminEmail")} />
              </Field>
              <Field label="Parol" error={errors.adminPassword?.message}>
                <input type="password" className="input" {...register("adminPassword")} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Bekor qilish</button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? "Saqlanmoqda..." : "Yaratish"}
            </button>
          </div>
        </form>
      </div>
      <style>{`.input{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:8px 12px;font-size:14px;outline:none}.input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgb(199 210 254 / .5)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
