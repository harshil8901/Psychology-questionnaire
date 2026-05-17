import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuestionnaireManager } from "@/components/admin/QuestionnaireManager";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <AdminLayout>
      <AdminShell
        title="Questionnaires"
        description="Manage study instruments, activate versions, and preview flows"
      >
        <QuestionnaireManager />
      </AdminShell>
    </AdminLayout>
  );
}
