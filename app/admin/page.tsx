import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default async function AdminPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <AdminDashboard />
      </div>
    </div>
  );
}
