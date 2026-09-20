"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth/session";

/**
 * RedirectIfAuthenticated
 * ===================================================================
 * يُستخدم في صفحات المصادقة العامة (login, forgot-password, reset-password).
 * - إن كان المستخدم مسجّلاً بالفعل → يُعيد التوجيه إلى /app.
 * - يتجنّب وميض الواجهة بعرض هيكل تحميل قصير أثناء التحقق.
 */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useAuthSession((s) => s.session);
  const hydrated = useAuthSession((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/app");
    }
  }, [hydrated, session, router]);

  // أثناء التحقق: لا تعرض شيئاً حتى لا يحدث وميض
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  // إن كان مسجّلاً: لا تعرض المحتوى (سيُعيد التوجيه)
  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  return <>{children}</>;
}
