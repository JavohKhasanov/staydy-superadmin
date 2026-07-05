import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, ArrowRight } from "lucide-react";
import {
  adminApi,
  extractErrorMessage,
  formatDateUz,
  SIGNUP_STATUS_LABEL,
  type SignupRequest,
  type SignupStatus,
} from "@/lib/api";

export const Route = createFileRoute("/_app/requests/")({
  component: RequestsPage,
});

const FILTERS: { value: SignupStatus | ""; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "new", label: "Yangi" },
  { value: "contacted", label: "Bog'lanildi" },
  { value: "converted", label: "Markaz yaratildi" },
  { value: "rejected", label: "Rad etildi" },
];

const STATUS_STYLE: Record<SignupStatus, string> = {
  new: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  contacted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

function RequestsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<SignupStatus | "">("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["signup-requests"],
    queryFn: adminApi.listSignupRequests,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SignupStatus }) =>
      adminApi.setSignupStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signup-requests"] });
      toast.success("Holat yangilandi");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const all = data ?? [];
  const rows = filter ? all.filter((r) => r.status === filter) : all;
  const newCount = all.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">So'rovlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Landing sahifadan kelgan reja so'rovlari
          {newCount > 0 && (
            <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
              {newCount} yangi
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === f.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
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
      {!isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          So'rov yo'q
        </div>
      )}

      <div className="grid gap-3">
        {rows.map((r) => (
          <RequestCard
            key={r.id}
            r={r}
            pending={setStatus.isPending}
            onStatus={(status) => setStatus.mutate({ id: r.id, status })}
          />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  r,
  pending,
  onStatus,
}: {
  r: SignupRequest;
  pending: boolean;
  onStatus: (s: SignupStatus) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{r.centerName}</h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[r.status]}`}
            >
              {SIGNUP_STATUS_LABEL[r.status]}
            </span>
            {r.plan && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {r.plan}
              </span>
            )}
          </div>
          <div className="mt-1.5 text-sm text-slate-600">{r.contactName}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-indigo-600">
              <Phone className="h-3.5 w-3.5" /> {r.phone}
            </a>
            {r.email && (
              <a
                href={`mailto:${r.email}`}
                className="inline-flex items-center gap-1 hover:text-indigo-600"
              >
                <Mail className="h-3.5 w-3.5" /> {r.email}
              </a>
            )}
            <span className="text-slate-400">{formatDateUz(r.createdAt)}</span>
          </div>
          {r.message && (
            <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{r.message}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {r.status === "new" && (
          <button
            onClick={() => onStatus("contacted")}
            disabled={pending}
            className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
          >
            Bog'lanildi
          </button>
        )}
        <Link
          to="/centers"
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Markaz yaratish <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {r.status !== "converted" && (
          <button
            onClick={() => onStatus("converted")}
            disabled={pending}
            className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
          >
            Yaratildi deb belgilash
          </button>
        )}
        {r.status !== "rejected" && (
          <button
            onClick={() => onStatus("rejected")}
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            Rad etish
          </button>
        )}
      </div>
    </div>
  );
}
