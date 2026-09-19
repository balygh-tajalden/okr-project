/**
 * أنواع المصادقة والصلاحيات (Auth & Authorization Types)
 * ===================================================================
 * الأساس النوعي لطبقة المصادقة والصلاحيات في النظام.
 * يدعم: الأدوار، الصلاحيات، النطاق التنظيمي.
 *
 * Architecture note:
 * - الأدوار (roles) تمثّل فئة المستخدم المؤسسية.
 * - الصلاحيات (permissions) تمثّل إجراءات دقيقة قابلة للمراجعة لاحقاً.
 * - النطاق التنظيمي (orgScope) يمكّن لاحقاً من تقييد الوصول حسب جهة.
 */

/** الأدوار المؤسسية الأساسية في النظام */
export type Role =
  | "system_admin" // مدير النظام
  | "executive" // الإدارة العليا
  | "department_manager" // مدير إدارة
  | "team_lead" // قائد فريق
  | "employee"; // موظف

/** تسميات الأدوار بالعربية — مرجع مركزي لضمان الاتساق */
export const ROLE_LABELS: Record<Role, string> = {
  system_admin: "مدير النظام",
  executive: "الإدارة العليا",
  department_manager: "مدير إدارة",
  team_lead: "قائد فريق",
  employee: "موظف",
};

/** وصف موجز لكل دور — يستخدم في صفحة الملف الشخصي والشاشات الإدارية */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  system_admin:
    "صلاحيات إدارة النظام الكاملة: المستخدمون، الإعدادات، الصلاحيات، وسجلات النظام.",
  executive:
    "إطلالة استراتيجية على جميع دورات الأهداف المؤسسية والاعتمادات على المستوى التنفيذي.",
  department_manager:
    "إدارة أهداف الإدارة، اعتماد نتائج الفرق، ومتابعة تقدّم الإنجاز على مستوى الإدارة.",
  team_lead:
    "قيادة فريق في تحقيق الأهداف المعتمدة، إسناد المهام، ومراجعة التحديثات الدورية.",
  employee:
    "تحديث إنجاز النتائج الرئيسية المسندة، إرفاق الأدلة، ومتابعة التقدم نحو الأهداف.",
};

/**
 * صلاحيات النظام (granular permissions).
 * مصممة لتغطية احتياجات الأطوار القادمة (الاعتمادات، التحديثات، الأدلة...).
 */
export type Permission =
  // إدارة النظام
  | "system.admin"
  | "system.users.manage"
  | "system.settings.manage"
  | "system.audit.view"
  // الهيكل التنظيمي
  | "org.structure.view"
  | "org.structure.manage"
  // دورات OKR
  | "okr.cycles.view"
  | "okr.cycles.manage"
  // الأهداف والنتائج
  | "okr.goals.create"
  | "okr.goals.view"
  | "okr.goals.edit"
  | "okr.goals.delete"
  | "okr.keyresults.update"
  // المراجعات والاعتمادات
  | "okr.review.request"
  | "okr.review.approve"
  | "okr.review.reject"
  // التحديثات والأدلة
  | "okr.progress.update"
  | "okr.progress.view"
  | "okr.evidence.upload"
  | "okr.evidence.review"
  // التنبيهات
  | "alerts.view"
  | "alerts.manage"
  // التقارير ولوحة المعلومات
  | "reports.view"
  | "reports.export"
  | "dashboard.view";

/** خريطة الصلاحيات الافتراضية لكل دور — مرجع موحّد للمراجعة */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  system_admin: [
    "system.admin",
    "system.users.manage",
    "system.settings.manage",
    "system.audit.view",
    "org.structure.view",
    "org.structure.manage",
    "okr.cycles.view",
    "okr.cycles.manage",
    "okr.goals.create",
    "okr.goals.view",
    "okr.goals.edit",
    "okr.goals.delete",
    "okr.keyresults.update",
    "okr.review.request",
    "okr.review.approve",
    "okr.review.reject",
    "okr.progress.update",
    "okr.progress.view",
    "okr.evidence.upload",
    "okr.evidence.review",
    "alerts.view",
    "alerts.manage",
    "reports.view",
    "reports.export",
    "dashboard.view",
  ],
  executive: [
    "org.structure.view",
    "okr.cycles.view",
    "okr.goals.view",
    "okr.review.approve",
    "okr.review.reject",
    "okr.progress.view",
    "okr.evidence.review",
    "alerts.view",
    "reports.view",
    "reports.export",
    "dashboard.view",
  ],
  department_manager: [
    "org.structure.view",
    "okr.cycles.view",
    "okr.goals.create",
    "okr.goals.view",
    "okr.goals.edit",
    "okr.review.approve",
    "okr.review.reject",
    "okr.progress.view",
    "okr.evidence.review",
    "alerts.view",
    "reports.view",
    "dashboard.view",
  ],
  team_lead: [
    "org.structure.view",
    "okr.cycles.view",
    "okr.goals.create",
    "okr.goals.view",
    "okr.goals.edit",
    "okr.review.request",
    "okr.progress.view",
    "alerts.view",
    "reports.view",
    "dashboard.view",
  ],
  employee: [
    "okr.goals.view",
    "okr.keyresults.update",
    "okr.progress.update",
    "okr.progress.view",
    "okr.evidence.upload",
    "alerts.view",
  ],
};

/** حالة الحساب */
export type AccountStatus = "active" | "disabled" | "pending_password";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "نشط",
  disabled: "موقوف",
  pending_password: "بانتظار تعيين كلمة المرور",
};

/**
 * نموذج المستخدم في النظام.
 * - يفصل بين البيانات التعريفية (الاسم، البريد) والبيانات الأمنية (كلمة المرور).
 * - يحمل role و rolesArray لدعم تعدد الأدوار مستقبلاً دون إعادة تصميم.
 */
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  /** الحرف الأول من كل اسم عربي لاستخدامه في الأفاتار عند غياب الصورة */
  initials: string;
  role: Role;
  /** أدوار إضافية للمراجعة (تُترك فارغة افتراضياً في الطور الأول) */
  additionalRoles?: Role[];
  organizationalUnit: string;
  jobTitle: string;
  status: AccountStatus;
  /** رقم الموظف المؤسسي */
  employeeId: string;
  avatarUrl?: string;
}

/** بيانات اعتماد الدخول — تُخزَّن في مكان واحد موحّد لراحة التطوير */
export interface DemoCredentials {
  username: string;
  password: string;
  userId: string;
}

/** جلسة المستخدم الحالية */
export interface Session {
  user: User;
  /** طابع زمني لبداية الجلسة (لانتهاء الصلاحية لاحقاً) */
  startedAt: number;
}

/** مفتاح التخزين المحلي للجلسة — مرجع موحّد */
export const SESSION_STORAGE_KEY = "okr.session.v1";
