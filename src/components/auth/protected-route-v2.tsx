"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthSession } from "@/lib/auth/session";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  can as canSvc,
  canAny as canAnySvc,
} from "@/lib/services/institutional";
import type { Permission } from "@/lib/auth/permissions-v2";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProtectedRoute (Phase 2)
 * ===================================================================
 * يحمي صفحة/مساراً يتطلب جلسة نشطة وصلاحيات معينة.
 *
 * - إن لم تكن الجلسة متاحة بعد الترطيب → يُعيد التوجيه إلى /login
 *   مع تمرير المسار الأصلي للعودة إليه لاحقاً.
 * - إن كان الحساب موقوفاً → يُعيد التوجيه إلى /login مع رسالة مناسبة.
 * - دعم اختياري:
 *    requiredPermissions (كلها مطلوبة)
 *    requiredAnyPermission (أي واحدة منها)
 *
 * ملاحظة: لا تُعرض المحتوى حتى تكتمل عمليات التحقق لتفادي وميض الواجهة.
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredAnyPermission?: Permission[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
  requiredAnyPermission,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthSession((s) => s.session);
  const hydrated = useAuthSession((s) => s.hydrated);
  const users = useInstitutionalStore((s) => s.users);
  const roles = useInstitutionalStore((s) => s.roles);

  // ابحث عن المستخدم في بيانات Phase 2 باستخدام معرّف Phase 1
  const currentUser = session
    ? users.find((u) => u.id === session.user.id) ?? null
    : null;

  useEffect(() => {
    if (!hydrated) return;

    if (!session || !currentUser || currentUser.status !== "active") {
      const params = new URLSearchParams({
        redirect: pathname,
      });
      if (currentUser && currentUser.status === "disabled") {
        params.set("reason", "account_disabled");
      }
      router.replace(`/login?${params.toString()}`);
      return;
    }

    if (requiredPermissions) {
      const hasAll = requiredPermissions.every((p) => canSvc(currentUser, roles, p));
      if (!hasAll) {
        router.replace("/unauthorized");
        return;
      }
    }

    if (requiredAnyPermission) {
      if (!canAnySvc(currentUser, roles, requiredAnyPermission)) {
        router.replace("/unauthorized");
        return;
      }
    }
  }, [
    hydrated,
    session,
    currentUser,
    pathname,
    router,
    requiredPermissions,
    requiredAnyPermission,
    roles,
  ]);

  // أثناء الترطيب أو التحقق: أظهر هيكل تحميل بدل وميض المحتوى
  if (!hydrated || !session || !currentUser) {
    return <ProtectedRouteSkeleton />;
  }

  // إذا كان مطلوباً صلاحيات/أدوار ولم تتوفر، لا تعرض المحتوى
  // (سيتم التوجيه في الـ effect).
  if (
    requiredPermissions &&
    !requiredPermissions.every((p) => canSvc(currentUser, roles, p))
  ) {
    return <ProtectedRouteSkeleton />;
  }
  if (
    requiredAnyPermission &&
    !canAnySvc(currentUser, roles, requiredAnyPermission)
  ) {
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
