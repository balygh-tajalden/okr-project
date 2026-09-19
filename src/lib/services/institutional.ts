/**
 * خدمات المنطق المؤسسي (Centralized Business Services)
 * ===================================================================
 * كل القواعد المعقدة في مكان واحد قابل للاختبار وإعادة الاستخدام:
 * - حساب الصلاحيات الفعلية (effective permissions) من تعدد الأدوار
 * - حلّ النطاق التنظيمي (organizational scope) — الجذر + كل المتحدّرين
 * - التحقق من صحة دورة الحياة للأدوار والجهات والدورات
 * - منع الحلقات في الشجرة التنظيمية
 * - منع تكرار اسم المستخدم / البريد
 * - التحقق من تواريخ الدورة
 */

import type {
  User,
  Role,
  OrgUnit,
  Cycle,
  UserId,
  RoleId,
  OrgUnitId,
  CycleId,
  CycleStatus,
  AccountStatus,
} from "@/lib/data/types";
import type { Permission } from "@/lib/auth/permissions-v2";
import { useInstitutionalStore } from "@/lib/data/store";

/* ===================================================================
   1. الصلاحيات الفعلية (Effective Permissions)
   =================================================================== */

/** يحسب صلاحيات مستخدم فعلياً كاتحاد (union) لصلاحيات أدواره */
export function getEffectivePermissions(
  user: User | null | undefined,
  roles: Role[]
): Permission[] {
  if (!user) return [];
  const set = new Set<Permission>();
  for (const roleId of user.roleIds) {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      for (const p of role.permissions) set.add(p);
    }
  }
  return Array.from(set);
}

/** هل المستخدم يملك صلاحية معيّنة (مع احترام حالة الحساب)؟ */
export function can(
  user: User | null | undefined,
  roles: Role[],
  permission: Permission
): boolean {
  if (!user || user.status !== "active") return false;
  return getEffectivePermissions(user, roles).includes(permission);
}

/** هل يملك أيًّا من الصلاحيات؟ */
export function canAny(
  user: User | null | undefined,
  roles: Role[],
  permissions: Permission[]
): boolean {
  if (!user || user.status !== "active") return false;
  const eff = getEffectivePermissions(user, roles);
  return permissions.some((p) => eff.includes(p));
}

/* ===================================================================
   2. النطاق التنظيمي (Organizational Scope)
   =================================================================== */

/**
 * يجلب جميع معرّفات الجهات المتاح للمستخدم:
 * - جهته الحالية
 * - كل الجهات المتحدّرة منها (recursive descendants)
 *
 * هذا هو النطاق الذي يُطبَّق على بيانات المستخدمين والأهداف والتقارير لاحقاً.
 */
export function getAccessibleOrgUnitIds(
  user: User | null | undefined,
  orgUnits: OrgUnit[]
): Set<OrgUnitId> {
  if (!user || !user.primaryOrgUnitId) return new Set();
  const result = new Set<OrgUnitId>([user.primaryOrgUnitId]);
  // اجتياز عرضي للجهات المتحدّرة
  const queue: OrgUnitId[] = [user.primaryOrgUnitId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = orgUnits.filter((u) => u.parentId === current);
    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}

/** هل يمكن للمستخدم الوصول إلى بيانات جهة معيّنة؟ */
export function canAccessOrgUnit(
  user: User | null | undefined,
  orgUnits: OrgUnit[],
  orgUnitId: OrgUnitId
): boolean {
  if (!user) return false;
  // مدير النظام يصل لكل الجهات
  const roles = useInstitutionalStore.getState().roles;
  if (can(user, roles, "system.admin")) return true;
  const scope = getAccessibleOrgUnitIds(user, orgUnits);
  return scope.has(orgUnitId);
}

/** يفلتر قائمة مستخدمين بناءً على النطاق التنظيمي للمالك */
export function filterUsersByScope(
  viewer: User | null | undefined,
  users: User[],
  orgUnits: OrgUnit[]
): User[] {
  if (!viewer) return [];
  const roles = useInstitutionalStore.getState().roles;
  if (can(viewer, roles, "system.admin")) return users;
  const scope = getAccessibleOrgUnitIds(viewer, orgUnits);
  return users.filter((u) => u.primaryOrgUnitId && scope.has(u.primaryOrgUnitId));
}

/* ===================================================================
   3. صحة الشجرة التنظيمية (Hierarchy Integrity)
   =================================================================== */

/**
 * هل سيُسبّب تعيين والد لجهة ما حلقة مفرغة؟
 * - لا يمكن أن تكون الجهة والدةً لنفسها
 * - لا يمكن أن تكون الجهة والدةً لأحد أجدادها (cycle)
 */
export function wouldCreateCycle(
  orgUnits: OrgUnit[],
  unitId: OrgUnitId,
  newParentId: OrgUnitId | null
): boolean {
  if (newParentId === null) return false; // الجذر دائماً مسموح
  if (unitId === newParentId) return true; // لا يمكن أن تكون والدةً لنفسها
  // ابدأ من الوالد المقترح وتتبّع سلسلة الأجداد
  let current: OrgUnitId | null = newParentId;
  const visited = new Set<OrgUnitId>();
  while (current) {
    if (current === unitId) return true; // تم العثور على حلقة
    if (visited.has(current)) return true; // حلقة في الشجرة نفسها (سلامة عامة)
    visited.add(current);
    const unit = orgUnits.find((u) => u.id === current);
    current = unit?.parentId ?? null;
  }
  return false;
}

/** يجلب سلسلة الأجداد من الجذر إلى الجهة (متضمّنةً الجهة) */
export function getAncestorPath(
  orgUnits: OrgUnit[],
  unitId: OrgUnitId
): OrgUnit[] {
  const path: OrgUnit[] = [];
  let current: OrgUnitId | null = unitId;
  const visited = new Set<OrgUnitId>();
  while (current) {
    if (visited.has(current)) break; // حماية من الحلقات
    visited.add(current);
    const unit = orgUnits.find((u) => u.id === current);
    if (!unit) break;
    path.unshift(unit);
    current = unit.parentId;
  }
  return path;
}

/** يجلب أبناء جهة مباشرة */
export function getChildUnits(
  orgUnits: OrgUnit[],
  parentId: OrgUnitId | null
): OrgUnit[] {
  return orgUnits.filter((u) => u.parentId === parentId);
}

/** يحسب عدد المستخدمين في جهة (والمتحدّرين منها) */
export function countUsersInUnitTree(
  users: User[],
  orgUnits: OrgUnit[],
  rootUnitId: OrgUnitId
): number {
  const scope = new Set<OrgUnitId>([rootUnitId]);
  const queue: OrgUnitId[] = [rootUnitId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const u of orgUnits) {
      if (u.parentId === current && !scope.has(u.id)) {
        scope.add(u.id);
        queue.push(u.id);
      }
    }
  }
  return users.filter((u) => u.primaryOrgUnitId && scope.has(u.primaryOrgUnitId))
    .length;
}

/* ===================================================================
   4. آلة حالة الدورة (Cycle State Machine)
   =================================================================== */

/** الانتقالات المسموحة (وفق المواصفات الصارمة) */
export const CYCLE_TRANSITIONS: Record<CycleStatus, CycleStatus[]> = {
  draft: ["active"],
  active: ["completed"],
  completed: [], // لا يوجد عودة
};

/** هل الانتقال بين حالتين مسموح؟ */
export function canTransitionCycle(
  from: CycleStatus,
  to: CycleStatus
): boolean {
  return CYCLE_TRANSITIONS[from].includes(to);
}

/** تسميات الإجراءات حسب الحالة */
export function getCycleActionsFor(
  status: CycleStatus
): Array<{ to: CycleStatus; label: string; permission: Permission }> {
  const actions: Array<{ to: CycleStatus; label: string; permission: Permission }> = [];
  if (status === "draft") {
    actions.push({ to: "active", label: "تفعيل الدورة", permission: "cycles.activate" });
  }
  if (status === "active") {
    actions.push({ to: "completed", label: "إكمال الدورة", permission: "cycles.complete" });
  }
  return actions;
}

/** هل يمكن تعديل الدورة بحالتها؟ */
export function canEditCycle(status: CycleStatus): boolean {
  // مسودة: تعديل كامل | نشطة: تعديل محدود (مثلاً الوصف فقط) | مكتملة: للقراءة فقط
  return status !== "completed";
}

/** الحقول القابلة للتعديل حسب الحالة */
export function getCycleEditableFields(
  status: CycleStatus
): Array<"name" | "description" | "type" | "startDate" | "endDate"> {
  if (status === "draft") {
    return ["name", "description", "type", "startDate", "endDate"];
  }
  if (status === "active") {
    // في النشطة: نسمح بتعديل الوصف فقط (تجنّب إبطال سياق التنفيذ)
    return ["description"];
  }
  return [];
}

/* ===================================================================
   5. التحقق من تواريخ الدورة
   =================================================================== */

/** هل تواريخ الدورة صحيحة؟ (تاريخ النهاية يجب أن يكون لاحقاً للبداية) */
export function validateCycleDates(
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: false, error: "تاريخ البداية وتاريخ النهاية مطلوبان." };
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "صيغة التاريخ غير صحيحة." };
  }
  if (end <= start) {
    return {
      valid: false,
      error: "يجب أن يكون تاريخ نهاية الدورة لاحقًا لتاريخ البداية.",
    };
  }
  return { valid: true };
}

/** هل انتهت الدورة زمنياً (تاريخ النهاية أصغر من اليوم)؟ */
export function isCycleEndDatePassed(cycle: Cycle): boolean {
  const end = new Date(cycle.endDate);
  const now = new Date();
  return end < now;
}

/* ===================================================================
   6. التحقق من تفرّد اسم المستخدم والبريد
   =================================================================== */

export function validateUsername(
  username: string,
  isTaken: (u: string) => boolean,
  excludeId?: UserId
): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { valid: false, error: "اسم المستخدم مطلوب." };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل." };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "اسم المستخدم يجب أن يحتوي على أحرف لاتينية أو أرقام أو نقطة/شرطة/شرطة سفلية فقط.",
    };
  }
  if (isTaken(trimmed)) {
    return { valid: false, error: "اسم المستخدم مستخدم بالفعل." };
  }
  return { valid: true };
}

export function validateEmail(
  email: string,
  isTaken: (e: string) => boolean
): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: "البريد الإلكتروني مطلوب." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: "صيغة البريد الإلكتروني غير صحيحة." };
  }
  if (isTaken(trimmed)) {
    return { valid: false, error: "البريد الإلكتروني مستخدم بالفعل." };
  }
  return { valid: true };
}

/* ===================================================================
   7. أدوات مساعدة للعرض
   =================================================================== */

/** يحسب الأدوار المسندة لمستخدم */
export function getUserRoles(user: User, roles: Role[]): Role[] {
  return user.roleIds
    .map((id) => roles.find((r) => r.id === id))
    .filter((r): r is Role => !!r);
}

/** جلب اسم الجهة الرئيسية لمستخدم */
export function getUserPrimaryUnitName(
  user: User,
  orgUnits: OrgUnit[]
): string {
  const unit = orgUnits.find((u) => u.id === user.primaryOrgUnitId);
  return unit?.name ?? "—";
}

/** هل المستخدم مدير نظام؟ (يستعمل للعرض فقط، لا للتحقق من الصلاحيات) */
export function isSystemAdmin(user: User, roles: Role[]): boolean {
  return getUserRoles(user, roles).some((r) => r.id === "r-sys-admin");
}
