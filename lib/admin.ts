import { hasAdminSession } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function isAdmin(): Promise<boolean> {
  if (await hasAdminSession()) return true;

  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}
