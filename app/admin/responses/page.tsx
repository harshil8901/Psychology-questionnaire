import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResponsesManager } from "@/components/admin/ResponsesManager";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default async function AdminResponsesPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <div className="relative">
        <AdminShell
          title="Responses"
          description="View, search, export, and manage participant submissions"
        >
          <ResponsesManager />
        </AdminShell>
      </div>
    </div>
  );
}
