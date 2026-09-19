import {
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
  type User,
} from "./types";

/**
 * طبقة التفويض (Authorization Layer)
 * ===================================================================
 * دوال مساعدة للتحقق من الأدوار والصلاحيات.
 *
 * القاعدة الذهبية:
 * - لا يُسمح أبداً بالتحقق من المستخدم باسمه أو بريده (مثل: user.name === "admin")
 * - يجب أن تستند جميع قرارات الوصول إلى role أو permission.
 *
 * استخدم:
 *   import { can, hasRole, hasAnyRole } from "@/lib/auth/permissions";
 *
 * مثال:
 *   if (can(user, "system.users.manage")) { ... }
 *   if (hasRole(user, "system_admin")) { ... }
 */

/** جميع صلاحيات المستخدم (الدور الأساسي + الأدوار الإضافية) */
export function getUserPermissions(user: User | null | undefined): Permission[] {
  if (!user) return [];

  const roleSet = new Set<Permission>([
    ...ROLE_PERMISSIONS[user.role],
    ...(user.additionalRoles ?? []).flatMap((r) => ROLE_PERMISSIONS[r]),
  ]);

  return Array.from(roleSet);
}

/** تحقق هل يمتلك المستخدم صلاحية معيّنة */
export function can(
  user: User | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.status !== "active") return false;
  return getUserPermissions(user).includes(permission);
}

/** تحقق هل يمتلك المستخدم أيًّا من الصلاحيات المطلوبة */
export function canAny(
  user: User | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.status !== "active") return false;
  const userPerms = getUserPermissions(user);
  return permissions.some((p) => userPerms.includes(p));
}

/** تحقق هل يمتلك المستخدم جميع الصلاحيات المطلوبة */
export function canAll(
  user: User | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.status !== "active") return false;
  const userPerms = new Set(getUserPermissions(user));
  return permissions.every((p) => userPerms.has(p));
}

/** تحقق هل يحمل المستخدم دوراً معيّناً (رئيسياً أو إضافياً) */
export function hasRole(
  user: User | null | undefined,
  role: Role
): boolean {
  if (!user) return false;
  if (user.role === role) return true;
  return user.additionalRoles?.includes(role) ?? false;
}

/** تحقق هل يحمل المستخدم أيًّا من الأدوار المطلوبة */
export function hasAnyRole(
  user: User | null | undefined,
  roles: Role[]
): boolean {
  if (!user) return false;
  if (roles.includes(user.role)) return true;
  return user.additionalRoles?.some((r) => roles.includes(r)) ?? false;
}

/** هل المستخدم نشط؟ */
export function isActiveUser(user: User | null | undefined): boolean {
  return !!user && user.status === "active";
}
