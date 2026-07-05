import { PLAN_LABEL, STATUS_LABEL, type Plan, type Status } from "@/lib/api";
import { cn } from "@/lib/utils";

export function PlanBadge({ plan }: { plan: Plan }) {
  const styles: Record<Plan, string> = {
    trial: "bg-slate-100 text-slate-700 ring-slate-200",
    basic: "bg-sky-50 text-sky-700 ring-sky-200",
    pro: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", styles[plan])}>
      {PLAN_LABEL[plan] ?? plan}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    suspended: "bg-rose-50 text-rose-700 ring-rose-200",
    archived: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", styles[status])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
