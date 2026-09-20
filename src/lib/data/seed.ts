/**
 * البيانات الأولية (Seed Data) — الطور الثاني
 * ===================================================================
 * بيانات تجريبية واقعية بالعربية تحاكي مؤسسة حكومية/كبيرة.
 *
 * المؤسسة الافتراضية: "هيئة التطوير المؤسسي"
 *
 * ملاحظة:
 * - لا تُخزَّن هنا بيانات اعتماد الدخول (تظل في lib/demo/users.ts)
 * - تُربط المستخدمون التجريبيون بمعرّفاتهم الحالية (u-001 ... u-006)
 * - تُضاف مستخدمون إضافيون لعرض سيناريوهات تعدد الأدوار والنطاقات
 */

import type {
  Role,
  OrgUnit,
  User,
  Cycle,
  UserOrgAssignment,
} from "./types";
import type { Permission } from "@/lib/auth/permissions-v2";

/** طابع زمني ثابت لسهولة التتبع */
const NOW = new Date("2025-01-15T08:00:00.000Z").toISOString();
const PAST = new Date("2024-01-15T08:00:00.000Z").toISOString();

/* =================================================================
   الأدوار (Roles) — مرجعية مركزية للصلاحيات
   ================================================================= */

export const SEED_ROLES: Role[] = [
  {
    id: "r-sys-admin",
    name: "مدير النظام",
    description: "صلاحيات إدارية كاملة على إعدادات النظام والمستخدمين والأدوار.",
    isSystem: true,
    permissions: [
      "system.admin",
      "system.audit.view",
      "users.view",
      "users.create",
      "users.update",
      "users.status.manage",
      "roles.view",
      "roles.manage",
      "organization.view",
      "organization.manage",
      "cycles.view",
      "cycles.create",
      "cycles.update",
      "cycles.activate",
      "cycles.complete",
      // Phase 3: الأهداف — كل الصلاحيات
      "goals.view",
      "goals.create",
      "goals.update",
      "goals.delete",
      "goals.submit",
      "goals.review",
      "goals.approve",
      "goals.return",
      "goals.assign",
      "keyresults.update",
      "alignment.view",
      "alignment.create",
      "individual_goals.view",
      "individual_goals.respond",
      // Phase 4: التنفيذ والمراجعة والتنبيهات
      "progress.update",
      "progress.view",
      "progress.review",
      "evidence.upload",
      "evidence.review",
      "alerts.view",
      "alerts.manage",
      "dashboard.view",
      "reports.view",
      "reports.export",
      "settings.view",
      "settings.manage",
    ],
    createdAt: PAST,
    updatedAt: PAST,
  },
  {
    id: "r-executive",
    name: "الإدارة العليا",
    description: "إطلالة استراتيجية على الأهداف والدورات والهيكل التنظيمي للجهة.",
    isSystem: true,
    permissions: [
      "organization.view",
      "organization.manage",
      "cycles.view",
      "cycles.create",
      "cycles.update",
      "cycles.activate",
      "cycles.complete",
      // Phase 3: الأهداف المؤسسية + الاعتماد
      "goals.view",
      "goals.create",
      "goals.update",
      "goals.submit",
      "goals.review",
      "goals.approve",
      "goals.return",
      "goals.assign",
      "keyresults.update",
      "alignment.view",
      "alignment.create",
      "individual_goals.view",
      "reviews.approve",
      "reviews.reject",
      // Phase 4: مراجعة التحديثات والتنبيهات
      "progress.view",
      "progress.review",
      "evidence.review",
      "alerts.view",
      "alerts.manage",
      // Phase 5 (معرّفة الآن)
      "reports.view",
      "reports.export",
      "dashboard.view",
    ],
    createdAt: PAST,
    updatedAt: PAST,
  },
  {
    id: "r-dept-manager",
    name: "مدير إدارة",
    description: "إدارة أهداف الإدارة، إنشاء الأهداف الداعمة، إسناد الأهداف الفردية، واعتماد نتائج الفرق.",
    isSystem: true,
    permissions: [
      "organization.view",
      "users.view",
      "cycles.view",
      // Phase 3: إنشاء/مراجعة/اعتماد/إسناد ضمن النطاق
      "goals.view",
      "goals.create",
      "goals.update",
      "goals.submit",
      "goals.review",
      "goals.approve",
      "goals.return",
      "goals.assign",
      "keyresults.update",
      "alignment.view",
      "alignment.create",
      "individual_goals.view",
      "reviews.request",
      "reviews.approve",
      "reviews.reject",
      // Phase 4: مراجعة التحديثات والتنبيهات
      "progress.view",
      "progress.review",
      "evidence.review",
      "alerts.view",
      "alerts.manage",
      // Phase 4
      "progress.view",
      "evidence.review",
      "alerts.view",
      "reports.view",
      "dashboard.view",
    ],
    createdAt: PAST,
    updatedAt: PAST,
  },
  {
    id: "r-team-lead",
    name: "قائد فريق",
    description: "قيادة فريق في تحقيق الأهداف المعتمدة، إنشاء الأهداف الداعمة، وإسناد المهام للأعضاء.",
    isSystem: true,
    permissions: [
      "organization.view",
      "users.view",
      "cycles.view",
      // Phase 3: إنشاء/إرسال/إسناد ضمن النطاق (لا اعتماد)
      "goals.view",
      "goals.create",
      "goals.update",
      "goals.submit",
      "goals.assign",
      "keyresults.update",
      "alignment.view",
      "alignment.create",
      "individual_goals.view",
      "reviews.request",
      // Phase 4: تحديث الإنجاز وعرضه
      "progress.update",
      "progress.view",
      "evidence.upload",
      "alerts.view",
      // Phase 4
      "progress.view",
      "alerts.view",
      "reports.view",
    ],
    createdAt: PAST,
    updatedAt: PAST,
  },
  {
    id: "r-employee",
    name: "موظف",
    description: "استقبال الأهداف الفردية المسندة، قبولها/رفضها، وتحديث الإنجاز لاحقاً.",
    isSystem: true,
    permissions: [
      "goals.view",
      "keyresults.update",
      // Phase 3: عرض الأهداف المسندة + الرد عليها
      "individual_goals.view",
      "individual_goals.respond",
      "alignment.view",
      // Phase 4: تحديث الإنجاز (للأهداف المسندة) وعرضه
      "progress.update",
      "progress.view",
      "evidence.upload",
      "alerts.view",
    ],
    createdAt: PAST,
    updatedAt: PAST,
  },
  {
    id: "r-quality-reviewer",
    name: "مراجع الجودة",
    description: "دور إضافي للمراجعة المالية/النوعية — مثال على تعدد الأدوار.",
    isSystem: false,
    permissions: [
      "reviews.approve",
      "reviews.reject",
      "progress.view",
      "progress.review",
      "evidence.review",
      "alerts.view",
      "reports.view",
    ],
    createdAt: PAST,
    updatedAt: PAST,
  },
];

/* =================================================================
   الهيكل التنظيمي (Organizational Structure)
   ملاحظة: معرّفات مستقرة (ou-*) و stable لاستخدامها لاحقاً في السجل التاريخي.
   ================================================================= */

export const SEED_ORG_UNITS: OrgUnit[] = [
  // الجذر
  { id: "ou-root", name: "هيئة التطوير المؤسسي", type: "institution", parentId: null, code: "HQ", description: "الجهة الأم", createdAt: PAST, updatedAt: PAST },

  // قطاعات
  { id: "ou-sec-it", name: "قطاع تقنية المعلومات", type: "sector", parentId: "ou-root", code: "IT", createdAt: PAST, updatedAt: PAST },
  { id: "ou-sec-admin", name: "قطاع الشؤون الإدارية", type: "sector", parentId: "ou-root", code: "ADM", createdAt: PAST, updatedAt: PAST },
  { id: "ou-sec-strategy", name: "قطاع التخطيط والاستراتيجية", type: "sector", parentId: "ou-root", code: "STR", createdAt: PAST, updatedAt: PAST },

  // قطاع تقنية المعلومات
  { id: "ou-dept-apps", name: "إدارة تطوير الأنظمة", type: "department", parentId: "ou-sec-it", code: "IT-DEV", createdAt: PAST, updatedAt: PAST },
  { id: "ou-dept-infra", name: "إدارة البنية التحتية", type: "department", parentId: "ou-sec-it", code: "IT-INF", createdAt: PAST, updatedAt: PAST },
  { id: "ou-team-web", name: "فريق تطبيقات الويب", type: "team", parentId: "ou-dept-apps", code: "IT-DEV-WEB", createdAt: PAST, updatedAt: PAST },
  { id: "ou-team-mobile", name: "فريق تطبيقات الجوال", type: "team", parentId: "ou-dept-apps", code: "IT-DEV-MOB", createdAt: PAST, updatedAt: PAST },

  // قطاع الشؤون الإدارية
  { id: "ou-dept-hr", name: "إدارة الموارد البشرية", type: "department", parentId: "ou-sec-admin", code: "ADM-HR", createdAt: PAST, updatedAt: PAST },
  { id: "ou-dept-services", name: "إدارة الخدمات", type: "department", parentId: "ou-sec-admin", code: "ADM-SVC", createdAt: PAST, updatedAt: PAST },

  // قطاع التخطيط والاستراتيجية
  { id: "ou-dept-planning", name: "إدارة تخطيط الموارد والأداء", type: "department", parentId: "ou-sec-strategy", code: "STR-PLN", createdAt: PAST, updatedAt: PAST },
  { id: "ou-dept-pmo", name: "إدارة مكتب المشاريع", type: "department", parentId: "ou-sec-strategy", code: "STR-PMO", createdAt: PAST, updatedAt: PAST },

  // الإدارة العليا (مستقلة مباشرة من الجذر)
  { id: "ou-exec-office", name: "مكتب الإدارة العليا", type: "directorate", parentId: "ou-root", code: "EXEC", createdAt: PAST, updatedAt: PAST },
];

/* =================================================================
   المستخدمون (Users)
   ملاحظة: نُعيد استخدام المعرّفات من Phase 1 (u-001 ... u-006)
   ونضيف مستخدمين إضافيين لإظهار سيناريوهات النطاق وتعدد الأدوار.
   ================================================================= */

export const SEED_USERS: User[] = [
  // مدير النظام
  {
    id: "u-001",
    username: "ahmed",
    fullName: "أحمد",
    email: "ahmed@example.com",
    initials: "أح",
    jobTitle: "مدير النظام",
    employeeId: "EMP-1001",
    status: "active",
    primaryOrgUnitId: "ou-sec-it",
    roleIds: ["r-sys-admin"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // الإدارة العليا
  {
    id: "u-002",
    username: "mohammed",
    fullName: "محمد",
    email: "mohammed@example.com",
    initials: "مح",
    jobTitle: "وكيل الهيئة المساعد",
    employeeId: "EMP-1002",
    status: "active",
    primaryOrgUnitId: "ou-exec-office",
    roleIds: ["r-executive"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // مدير إدارة (تخطيط الموارد والأداء)
  {
    id: "u-003",
    username: "khaled",
    fullName: "خالد",
    email: "khaled@example.com",
    initials: "خا",
    jobTitle: "مدير إدارة تخطيط الموارد",
    employeeId: "EMP-1003",
    status: "active",
    primaryOrgUnitId: "ou-dept-planning",
    roleIds: ["r-dept-manager"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // قائد فريق (تطبيقات الويب)
  {
    id: "u-004",
    username: "ali",
    fullName: "علي",
    email: "ali@example.com",
    initials: "عل",
    jobTitle: "قائد فريق تجربة المستخدم",
    employeeId: "EMP-1004",
    status: "active",
    primaryOrgUnitId: "ou-team-web",
    roleIds: ["r-team-lead"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // موظف (تطبيقات الويب)
  {
    id: "u-005",
    username: "yousef",
    fullName: "يوسف",
    email: "yousef@example.com",
    initials: "يو",
    jobTitle: "محلل أعمال أول",
    employeeId: "EMP-1005",
    status: "active",
    primaryOrgUnitId: "ou-team-web",
    roleIds: ["r-employee"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // موظف موقوف
  {
    id: "u-006",
    username: "salem",
    fullName: "سالم",
    email: "salem@example.com",
    initials: "سا",
    jobTitle: "أخصائي تطوير الموارد البشرية",
    employeeId: "EMP-1006",
    status: "disabled",
    primaryOrgUnitId: "ou-dept-hr",
    roleIds: ["r-employee"],
    createdAt: PAST,
    updatedAt: NOW,
    disabledAt: NOW,
  },

  // مدير إدارة (الموارد البشرية)
  {
    id: "u-007",
    username: "fatima",
    fullName: "فاطمة",
    email: "fatima@example.com",
    initials: "فا",
    jobTitle: "مدير إدارة الموارد البشرية",
    employeeId: "EMP-1007",
    status: "active",
    primaryOrgUnitId: "ou-dept-hr",
    roleIds: ["r-dept-manager"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // موظف بمهام متعددة — مثال تعدد الأدوار
  {
    id: "u-008",
    username: "omar",
    fullName: "عمر",
    email: "omar@example.com",
    initials: "عم",
    jobTitle: "مطوّر تطبيقات أول",
    employeeId: "EMP-1008",
    status: "active",
    primaryOrgUnitId: "ou-team-mobile",
    roleIds: ["r-employee", "r-quality-reviewer"],
    createdAt: PAST,
    updatedAt: PAST,
  },

  // قائد فريق (المشاريع)
  {
    id: "u-009",
    username: "hassan",
    fullName: "حسن",
    email: "hassan@example.com",
    initials: "حس",
    jobTitle: "قائد فريق مكتب المشاريع",
    employeeId: "EMP-1009",
    status: "active",
    primaryOrgUnitId: "ou-dept-pmo",
    roleIds: ["r-team-lead"],
    createdAt: PAST,
    updatedAt: PAST,
  },
];

/* =================================================================
   سجل الارتباطات التنظيمية (UserOrgAssignments)
   - يحافظ على السجل التاريخي عند نقل المستخدم بين الجهات
   ================================================================= */

export const SEED_USER_ORG_ASSIGNMENTS: UserOrgAssignment[] = [
  // كل مستخدم له ارتباط حالي
  ...SEED_USERS.map((u, i) => ({
    id: `asg-${i + 1}`,
    userId: u.id,
    orgUnitId: u.primaryOrgUnitId ?? "ou-root",
    validFrom: PAST,
    validTo: null,
    isCurrent: true,
    reason: "تعيين ابتدائي",
  })),
  // مثال على سجل تاريخي: حركات تنقل سابقة لبعض المستخدمين
  {
    id: "asg-hist-1",
    userId: "u-005", // نورة
    orgUnitId: "ou-team-mobile",
    validFrom: "2023-01-01T00:00:00.000Z",
    validTo: "2024-06-30T00:00:00.000Z",
    isCurrent: false,
    reason: "نقل من فريق تطبيقات الجوال إلى فريق تطبيقات الويب",
  },
];

/* =================================================================
   دورات OKR (Cycles) — تحاكي الحالات الثلاث
   ================================================================= */

export const SEED_CYCLES: Cycle[] = [
  // دورة مكتملة (2024 سنوي)
  {
    id: "c-2024-annual",
    name: "دورة 2024 السنوية",
    description: "الدورة السنوية للهيئة لعام 2024 — مكتملة.",
    type: "annual",
    status: "completed",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    createdBy: "u-002",
    createdAt: "2023-11-01T08:00:00.000Z",
    updatedAt: "2025-01-05T08:00:00.000Z",
    activatedAt: "2024-01-01T00:00:00.000Z",
    completedAt: "2025-01-05T08:00:00.000Z",
  },
  // دورة نشطة (Q1 2025 ربع سنوي)
  {
    id: "c-2025-q1",
    name: "دورة Q1 2025 الربع سنوية",
    description: "الدورة الربع سنوية الأولى لعام 2025 — نشطة حالياً.",
    type: "quarterly",
    status: "active",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    createdBy: "u-002",
    createdAt: "2024-12-01T08:00:00.000Z",
    updatedAt: "2025-01-01T08:00:00.000Z",
    activatedAt: "2025-01-01T00:00:00.000Z",
  },
  // دورة مسودة (Q2 2025)
  {
    id: "c-2025-q2",
    name: "دورة Q2 2025 الربع سنوية",
    description: "الدورة الربع سنوية الثانية — قيد التخطيط.",
    type: "quarterly",
    status: "draft",
    startDate: "2025-04-01",
    endDate: "2025-06-30",
    createdBy: "u-002",
    createdAt: "2025-02-15T08:00:00.000Z",
    updatedAt: "2025-02-15T08:00:00.000Z",
  },
  // دورة مسودة (شهري فبراير)
  {
    id: "c-2025-02-monthly",
    name: "دورة فبراير 2025 الشهرية",
    description: "دورة شهرية تجريبية — مسودة.",
    type: "monthly",
    status: "draft",
    startDate: "2025-02-01",
    endDate: "2025-02-28",
    createdBy: "u-003",
    createdAt: "2025-01-20T08:00:00.000Z",
    updatedAt: "2025-01-20T08:00:00.000Z",
  },
];

/** بيانات أولية مجمّعة */
export const SEED_DATA = {
  roles: SEED_ROLES,
  orgUnits: SEED_ORG_UNITS,
  users: SEED_USERS,
  userOrgAssignments: SEED_USER_ORG_ASSIGNMENTS,
  cycles: SEED_CYCLES,
};

/** كلمة المرور المشتركة للحسابات التجريبية (مرجع موحّد) */
export const DEMO_PASSWORD = "Demo@2025";

/** بنية بيانات الاعتماد للربط مع Phase 1 auth service */
export const DEMO_CREDENTIALS = SEED_USERS.map((u) => ({
  username: u.username,
  password: DEMO_PASSWORD,
  userId: u.id,
}));

/** ملخص الحسابات التجريبية للعرض في واجهة الدخول */
export const DEMO_CREDENTIALS_SUMMARY = SEED_USERS.map((u) => ({
  username: u.username,
  password: DEMO_PASSWORD,
  fullName: u.fullName,
  roleName: SEED_ROLES.find((r) => r.id === u.roleIds[0])?.name ?? "—",
}));
