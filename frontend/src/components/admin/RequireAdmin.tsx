import { useEffect, useState, type ReactNode } from "react";
import { adminFetch } from "../../lib/adminApi";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const [state,setState]=useState<"checking"|"ok"|"no">("checking");
  useEffect(()=>{ adminFetch("/api/admin/me").then(()=>setState("ok")).catch(()=>setState("no")); },[]);
  if(state==="checking") return <main className="admin-shell"><div className="loading-card">Checking session…</div></main>;
  if(state==="no"){ window.location.href="/admin/login"; return null; }
  return <>{children}</>;
}
