"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthSession } from "@/lib/auth/session";
import { isActiveUser } from "@/lib/auth/permissions";
import type { Permission, Role } from "@/lib/auth/types";
import { can, hasAnyRole } from "@/lib/auth/permissions";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProtectedRoute
 * ===================================================================
 * يحمي صفحة/مساراً يتطلب جلسة نشطة.
 *
 * - إن لم تكن الجلسة متاحة بعد الترطيب → يُعيد التوجيه إلى /login
 *   مع تمرير المسار الأصلي للعودة إليه لاحقاً.
 * - إن كان الحساب موقوفاً → يُعيد التوجيه إلى /login مع رسالة مناسبة.
 *
 * دعم اختياري:
 * - requiredPermissions: يجب أن يملك المستخدم كل هذه الصلاحيات.
 * - requiredRoles: أو أيًّا من هذه الأدوار.
 *
 * ملاحظة: لا تُعرض المحتوى حتى تكتمل عمليات التحقق لتفادي وميض الواجهة.
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: Role[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthSession((s) => s.session);
  const hydrated = useAuthSession((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!session || !isActiveUser(session.user)) {
      const params = new URLSearchParams({
        redirect: pathname,
      });
      if (session && session.user.status === "disabled") {
        params.set("reason", "account_disabled");
      }
      router.replace(`/login?${params.toString()}`);
      return;
    }

    if (requiredPermissions) {
      const hasAll = requiredPermissions.every((p) => can(session.user, p));
      if (!hasAll) {
        router.replace("/unauthorized");
        return;
      }
    }

    if (requiredRoles) {
      if (!hasAnyRole(session.user, requiredRoles)) {
        router.replace("/unauthorized");
        return;
      }
    }
  }, [hydrated, session, pathname, router, requiredPermissions, requiredRoles]);

  // أثناء الترطيب أو التحقق: أظهر هيكل تحميل بدل وميض المحتوى
  if (!hydrated || !session) {
    return <ProtectedRouteSkeleton />;
  }

  // إذا كان مطلوباً صلاحيات/أدوار ولم تتوفر، لا تعرض المحتوى
  // (سيتم التوجيه في الـ effect).
  if (requiredPermissions && !requiredPermissions.every((p) => can(session.user, p))) {
    return <ProtectedRouteSkeleton />;
  }
  if (requiredRoles && !hasAnyRole(session.user, requiredRoles)) {
    return <ProtectedRouteSkeleton />;
  }

  return <>{children}</>;
}

function ProtectedRouteSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
