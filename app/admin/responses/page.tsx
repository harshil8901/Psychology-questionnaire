import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResponsesManager } from "@/components/admin/ResponsesManager";

export default async function AdminResponsesPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <AdminLayout>
      <AdminShell
        title="Responses"
        description="View, search, export, and manage participant submissions"
      >
        <ResponsesManager />
      </AdminShell>
    </AdminLayout>
  );
}
