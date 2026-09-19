"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth/session";
import { Loader2 } from "lucide-react";

/**
 * الصفحة الجذرية:
 * - إن كان المستخدم مسجّلاً → /app
 * - وإلا → /login
 *
 * تتم على العميل لأن الجلسة مخزّنة محلياً (prototype).
 */
export default function RootPage() {
  const router = useRouter();
  const session = useAuthSession((s) => s.session);
  const hydrated = useAuthSession((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(session ? "/app" : "/login");
  }, [hydrated, session, router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      aria-live="polite"
      aria-busy={!hydrated}
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">جاري التحميل...</p>
      </div>
    </div>
  );
}
