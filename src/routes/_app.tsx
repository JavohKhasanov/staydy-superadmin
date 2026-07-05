import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { auth } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !auth.access) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
