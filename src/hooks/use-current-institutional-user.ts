"use client";

import { useMemo } from "react";
import { useAuthSession } from "@/lib/auth/session";
import { useInstitutionalStore } from "@/lib/data/store";
import { getEffectivePermissions, getUserRoles } from "@/lib/services/institutional";
import type { User as Phase2User } from "@/lib/data/types";
import type { Permission } from "@/lib/auth/permissions-v2";
import { can as canImpl, canAny as canAnyImpl } from "@/lib/services/institutional";
import { ROLE_LABELS as PHASE1_ROLE_LABELS } from "@/lib/auth/types";

/**
 * Hook موحّد لربط الجلسة (Phase 1) بالبيانات المؤسسية الكاملة (Phase 2)
 * ===================================================================
 * - يوفر مستخدم Phase 2 الحالي، أدواره، صلاحياته الفعلية
 * - يوفّر دوال can/canAny التي تعمل على permissions-v2
 * - يبسّط الاستخدام في مكوّنات Phase 2 دون تكرار المنطق
 */
export function useCurrentInstitutionalUser() {
  const session = useAuthSession((s) => s.session);
  const users = useInstitutionalStore((s) => s.users);
  const roles = useInstitutionalStore((s) => s.roles);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);

  return useMemo(() => {
    if (!session) {
      return {
        user: null as Phase2User | null,
        roles: [] as typeof roles,
        effectivePermissions: [] as Permission[],
        can: () => false,
        canAny: () => false,
      };
    }
    // ابحث عن المستخدم في بيانات Phase 2 باستخدام معرّف Phase 1
    const user = users.find((u) => u.id === session.user.id) ?? null;
    if (!user) {
      return {
        user: null,
        roles,
        effectivePermissions: [],
        can: () => false,
        canAny: () => false,
      };
    }
    const userRoles = getUserRoles(user, roles);
    const effectivePermissions = getEffectivePermissions(user, roles);
    return {
      user,
      roles: userRoles,
      effectivePermissions,
      can: (p: Permission) => canImpl(user, roles, p),
      canAny: (ps: Permission[]) => canAnyImpl(user, roles, ps),
    };
  }, [session, users, roles, orgUnits]);
}

/** تسمية الدور بالعربية (للعرض) — تستخدم اسم الدور من Phase 2 أو تصنيف Phase 1 الاحتياطي */
export function getRoleDisplayName(roleId: string | undefined, roles: { id: string; name: string }[]): string {
  if (!roleId) return "—";
  const role = roles.find((r) => r.id === roleId);
  return role?.name ?? roleId;
}
