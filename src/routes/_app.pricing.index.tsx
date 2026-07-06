import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Star, EyeOff } from "lucide-react";
import { adminApi, extractErrorMessage } from "@/lib/api";
import type { PricingPlan, PlanBody } from "@/lib/api";

export const Route = createFileRoute("/_app/pricing/")({
  component: PricingPage,
});

type FormState = {
  planKey: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  featuresText: string;
  highlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

function planToForm(p: PricingPlan): FormState {
  return {
    planKey: p.planKey,
    name: p.name,
    price: p.price,
    period: p.period,
    tagline: p.tagline,
    featuresText: p.features.join("\n"),
    highlighted: p.highlighted,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

function emptyForm(nextOrder: number): FormState {
  return {
    planKey: "",
    name: "",
    price: "",
    period: "oy",
    tagline: "",
    featuresText: "",
    highlighted: false,
    isActive: true,
    sortOrder: nextOrder,
  };
}

function formToBody(f: FormState): PlanBody {
  return {
    planKey: f.planKey.trim(),
    name: f.name.trim(),
    price: f.price.trim(),
    period: f.period.trim(),
    tagline: f.tagline.trim(),
    features: f.featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    highlighted: f.highlighted,
    isActive: f.isActive,
    sortOrder: f.sortOrder,
  };
}

function PricingPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PricingPlan | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["plans"],
    queryFn: adminApi.listPlans,
  });

  const plans = data ?? [];
  const nextOrder = plans.reduce((m, p) => Math.max(m, p.sortOrder), 0) + 1;

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: PlanBody }) =>
      id ? adminApi.updatePlan(id, body) : adminApi.createPlan(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      setEditing(null);
      setCreating(false);
      toast.success("Saqlandi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("O'chirildi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Narxlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            staydy.uz bosh sahifasidagi tarif rejalari. Bu yerdagi o'zgarishlar darhol saytda
            ko'rinadi.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Yangi tarif
        </button>
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-slate-200/60" />}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm text-rose-700">{extractErrorMessage(error)}</div>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white"
          >
            Qayta urinish
          </button>
        </div>
      )}
      {!isLoading && !isError && plans.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Tarif yo'q. "Yangi tarif" tugmasi bilan qo'shing.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            onEdit={() => setEditing(p)}
            onDelete={() => {
              if (confirm(`"${p.name}" tarifini o'chirishni tasdiqlaysizmi?`)) remove.mutate(p.id);
            }}
            deleting={remove.isPending}
          />
        ))}
      </div>

      {(editing || creating) && (
        <PlanEditor
          initial={editing ? planToForm(editing) : emptyForm(nextOrder)}
          title={editing ? `${editing.name} — tahrirlash` : "Yangi tarif"}
          pending={save.isPending}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={(f) => save.mutate({ id: editing?.id ?? null, body: formToBody(f) })}
        />
      )}
    </div>
  );
}

function PlanCard({
  plan,
  onEdit,
  onDelete,
  deleting,
}: {
  plan: PricingPlan;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-white p-5 shadow-sm ${
        plan.highlighted ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
            {plan.highlighted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                <Star className="h-3 w-3" /> Ommabop
              </span>
            )}
            {!plan.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                <EyeOff className="h-3 w-3" /> Yashirin
              </span>
            )}
          </div>
          {plan.tagline && <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>}
        </div>
        <span className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-slate-400">
          #{plan.sortOrder}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1">
        <span className="text-2xl font-bold text-slate-900">{plan.price || "—"}</span>
        {plan.period && <span className="pb-1 text-sm text-slate-500">/{plan.period}</span>}
      </div>

      <ul className="mt-4 flex-1 space-y-1.5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Pencil className="h-3.5 w-3.5" /> Tahrirlash
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> O'chirish
        </button>
      </div>
    </div>
  );
}

function PlanEditor({
  initial,
  title,
  pending,
  onCancel,
  onSubmit,
}: {
  initial: FormState;
  title: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (f: FormState) => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.name.trim()) {
      toast.error("Nom kiritilishi shart");
      return;
    }
    onSubmit(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onCancel} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom">
              <input
                value={f.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Asosiy"
                className={inputCls}
              />
            </Field>
            <Field label="Kalit (planKey)" hint="trial / basic / pro">
              <input
                value={f.planKey}
                onChange={(e) => set("planKey", e.target.value)}
                placeholder="basic"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Narx">
              <input
                value={f.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="299 000 so'm"
                className={inputCls}
              />
            </Field>
            <Field label="Davr" hint="oy / yil / bo'sh">
              <input
                value={f.period}
                onChange={(e) => set("period", e.target.value)}
                placeholder="oy"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Izoh (tagline)">
            <input
              value={f.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Kichik va o'rta markazlar"
              className={inputCls}
            />
          </Field>

          <Field label="Imkoniyatlar" hint="Har bir qatorga bittadan">
            <textarea
              value={f.featuresText}
              onChange={(e) => set("featuresText", e.target.value)}
              rows={5}
              placeholder={"CRM + Moliya\nDavomat + EWS\nTelegram bot"}
              className={`${inputCls} resize-y`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tartib">
              <input
                type="number"
                value={f.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={f.highlighted}
                  onChange={(e) => set("highlighted", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                "Ommabop" deb belgilash
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={f.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Saytda ko'rsatish
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Bekor qilish
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
