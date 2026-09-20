"use client";

import { useCurrentUser } from "@/lib/auth/session";
import { can, hasAnyRole, hasRole } from "@/lib/auth/permissions";
import type { Permission, Role } from "@/lib/auth/types";
import { EmptyState } from "@/components/common/empty-state";
import { Lock } from "lucide-react";

/**
 * PermissionGuard
 * ===================================================================
 * مكوّن شرطي لإخفاء/إظهار أجزاء من الواجهة حسب الصلاحيات أو الأدوار.
 *
 * - يُستخدم داخل العناصر (مثلاً: إظهار زر "حفظ" فقط لمن يملك الصلاحية).
 * - لا يعيد التوجيه (إعادة التوجيه مسؤولية ProtectedRoute).
 * - يدعم:
 *    permission="okr.goals.create"
 *    anyPermission={["okr.goals.create", "okr.goals.edit"]}
 *    allPermissions={[...]}
 *    role="system_admin"
 *    anyRole={[...]}
 *
 * استخدام:
 *   <PermissionGuard permission="okr.goals.create">
 *     <Button>إنشاء هدف</Button>
 *   </PermissionGuard>
 *
 * أو للعرض البديل:
 *   <PermissionGuard permission="okr.goals.create" fallback={<span>غير مصرّح</span>}>
 *     <Button>إنشاء هدف</Button>
 *   </PermissionGuard>
 */

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  anyPermission?: Permission[];
  allPermissions?: Permission[];
  role?: Role;
  anyRole?: Role[];
  /** ما يُعرض عند عدم توفّر الصلاحية — افتراضياً: لا شيء */
  fallback?: React.ReactNode;
  /** إن true: عرض حالة "لا تملك صلاحية" بدل إخفاء المحتوى */
  showUnauthorizedFallback?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  fallback = null,
  showUnauthorizedFallback = false,
}: PermissionGuardProps) {
  const user = useCurrentUser();

  let authorized = true;

  if (permission) authorized = authorized && can(user, permission);
  if (anyPermission) authorized = authorized && anyPermission.some((p) => can(user, p));
  if (allPermissions) authorized = authorized && allPermissions.every((p) => can(user, p));
  if (role) authorized = authorized && hasRole(user, role);
  if (anyRole) authorized = authorized && hasAnyRole(user, anyRole ?? []);

  if (authorized) return <>{children}</>;

  if (showUnauthorizedFallback) {
    return (
      <div className="rounded-md border border-dashed border-border p-4">
        <EmptyState
          icon={<Lock className="size-6" />}
          title="غير مصرّح"
          description="لا تملك الصلاحيات اللازمة للوصول إلى هذا الإجراء."
        />
      </div>
    );
  }

  return <>{fallback}</>;
}
