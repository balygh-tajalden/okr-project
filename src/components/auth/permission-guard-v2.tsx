"use client";

import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import type { Permission } from "@/lib/auth/permissions-v2";

/**
 * PermissionGuard (Phase 2)
 * ===================================================================
 * مكوّن شرطي لإخفاء/إظهار أجزاء من الواجهة حسب الصلاحيات (v2) أو الأدوار.
 *
 * - يُستخدم داخل العناصر (مثلاً: إظهار زر "حفظ" فقط لمن يملك الصلاحية).
 * - لا يعيد التوجيه (إعادة التوجيه مسؤولية ProtectedRoute).
 *
 * استخدام:
 *   <PermissionGuardV2 permission="users.create">
 *     <Button>إنشاء مستخدم</Button>
 *   </PermissionGuardV2>
 */
interface PermissionGuardV2Props {
  children: React.ReactNode;
  permission?: Permission;
  anyPermission?: Permission[];
  allPermissions?: Permission[];
  fallback?: React.ReactNode;
  showUnauthorizedFallback?: boolean;
}

export function PermissionGuardV2({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  showUnauthorizedFallback = false,
}: PermissionGuardV2Props) {
  const { user, can, canAny } = useCurrentInstitutionalUser();

  let authorized = true;
  if (permission) authorized = authorized && can(permission);
  if (anyPermission) authorized = authorized && anyPermission.some((p) => can(p));
  if (allPermissions) authorized = authorized && allPermissions.every((p) => can(p));

  if (!user) return <>{fallback}</>;
  if (authorized) return <>{children}</>;

  if (showUnauthorizedFallback) {
    return (
      <div className="rounded-md border border-dashed border-border p-4">
        <EmptyState
          icon={<Lock className="size-5" />}
          title="غير مصرّح"
          description="لا تملك الصلاحيات اللازمة للوصول إلى هذا الإجراء."
        />
      </div>
    );
  }

  return <>{fallback}</>;
}
