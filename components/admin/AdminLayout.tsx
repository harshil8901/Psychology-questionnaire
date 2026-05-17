import type { ReactNode } from "react";

export function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#020308] text-white">{children}</div>;
}
