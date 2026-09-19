/**
 * أنواع الطور الثاني — المؤسسة (Phase 2 Institutional Types)
 * ===================================================================
 * نماذج البيانات لطبقة المستخدمين، الأدوار، الهيكل التنظيمي، ودورات OKR.
 *
 * مبادئ:
 * - بيانات حقيقية مرتبطة داخل طبقة البيانات (referential integrity).
 * - معرّفات مستقرة (stable IDs) لدعم السجل التاريخي لاحقاً.
 * - فصل واضح بين: الدور (Role) — ماذا يفعل المستخدم، والنطاق التنظيمي — على أي بيانات.
 *
 * ملاحظة: نستخدم سلسلة (string) لـ Role id لدعم الأدوار الافتراضية والمخصصة لاحقاً.
 */

import type { Permission } from "@/lib/auth/permissions-v2";

/** معرّف الجهة التنظيمية — مستقر وفريد */
export type OrgUnitId = string;

/** معرّف الدور — مستقر وفريد */
export type RoleId = string;

/** معرّف المستخدم — مستقر وفريد */
export type UserId = string;

/** معرّف الدورة — مستقر وفريد */
export type CycleId = string;

/** حالة الحساب: حالتان فقط (وفق المواصفات) */
export type AccountStatus = "active" | "disabled";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "فعّال",
  disabled: "موقوف",
};

/** نوع الجهة التنظيمية — مرن، يسمح بـ N مستويات */
export type OrgUnitType =
  | "institution" // المؤسسة (الجذر)
  | "sector" // قطاع
  | "branch" // فرع
  | "directorate" // إدارة عامة
  | "department" // إدارة
  | "division" // قسم
  | "unit" // وحدة
  | "team"; // فريق

export const ORG_UNIT_TYPE_LABELS: Record<OrgUnitType, string> = {
  institution: "مؤسسة",
  sector: "قطاع",
  branch: "فرع",
  directorate: "إدارة عامة",
  department: "إدارة",
  division: "قسم",
  unit: "وحدة",
  team: "فريق",
};

/**
 * نموذج الجهة التنظيمية.
 * - id مستقر، parent يمكن أن يكون null للجذر.
 * - لا تُخزَّن معلومات HR هنا (هذه مسؤولية وحدة لاحقة).
 */
export interface OrgUnit {
  id: OrgUnitId;
  name: string;
  type: OrgUnitType;
  parentId: OrgUnitId | null;
  description?: string;
  /** كود اختياري للجهة (مفيد للعرض والبحث) */
  code?: string;
  createdAt: string;
  updatedAt: string;
}

/** سجل ارتباط مستخدم بجهة تنظيمية (للحفاظ على السجل التاريخي) */
export interface UserOrgAssignment {
  id: string;
  userId: UserId;
  orgUnitId: OrgUnitId;
  validFrom: string; // ISO date
  validTo: string | null; // null = مستمر
  isCurrent: boolean;
  reason?: string; // سبب النقل (اختياري)
}

/**
 * نموذج الدور.
 * - id مستقر، قابل للإنشاء والتعديل لاحقاً.
 * - isSystem: الأدوار النظامية لا يمكن حذفها (مرجعية للأمان).
 */
export interface Role {
  id: RoleId;
  name: string; // اسم عربي قابل للعرض
  description?: string;
  permissions: Permission[];
  isSystem: boolean; // أدوار نظامية مدمجة (مدير النظام، إلخ)
  createdAt: string;
  updatedAt: string;
}

/**
 * نموذج المستخدم الكامل (Phase 2).
 * يفصل بين: البيانات التعريفية، الارتباط التنظيمي، الأدوار، حالة الحساب.
 */
export interface User {
  id: UserId;
  username: string; // فريد
  fullName: string;
  email: string;
  initials: string;
  jobTitle: string;
  employeeId: string; // رقم الموظف المؤسسي
  status: AccountStatus;
  avatarUrl?: string;
  /** معرّف الجهة التنظيمية الأساسية الحالية */
  primaryOrgUnitId: OrgUnitId | null;
  /** معرّفات الأدوار المسندة (دعم تعدد الأدوار) */
  roleIds: RoleId[];
  phone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  /** طابع زمني لتعطيل الحساب (للسجل) */
  disabledAt?: string;
}

/** نوع دورة OKR — محكوم لكن قابل للتوسعة */
export type CycleType = "monthly" | "quarterly" | "annual";

export const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
  monthly: "شهري",
  quarterly: "ربع سنوي",
  annual: "سنوي",
};

/**
 * حالة الدورة: ثلاث حالات فقط (وفق المواصفات الصارمة)
 * مسودة → نشطة → مكتملة
 */
export type CycleStatus = "draft" | "active" | "completed";

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  draft: "مسودة",
  active: "نشطة",
  completed: "مكتملة",
};

/** نموذج دورة OKR */
export interface Cycle {
  id: CycleId;
  name: string;
  description?: string;
  type: CycleType;
  status: CycleStatus;
  startDate: string; // ISO date
  endDate: string; // ISO date
  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
  /** طابع زمني لتفعيل الدورة */
  activatedAt?: string;
  /** طابع زمني لإكمال الدورة */
  completedAt?: string;
}

/** الحالة العامة للنموذج المؤسسي — مصدر الحقيقة الموحّد */
export interface InstitutionalState {
  users: User[];
  roles: Role[];
  orgUnits: OrgUnit[];
  userOrgAssignments: UserOrgAssignment[];
  cycles: Cycle[];
}
