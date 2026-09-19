/**
 * نظام الصلاحيات (المرجع الموحّد) — Phase 2
 * ===================================================================
 * صلاحيات دقيقة (granular) مجمّعة حسب الوحدات.
 * كل صلاحية لها مفتاح تقني ثابت واسم عربي معروض.
 *
 * مبادئ:
 * - التحقق من الصلاحيات يعتمد على can(permission)، لا على اسم الدور.
 * - إضافة وحدة جديدة لاحقاً تتم بمجرد إضافة مجموعة هنا + قيمة في Permission.
 */

/** المجموعات الوظيفية للصلاحيات — تُعرض في واجهة إدارة الأدوار */
export type PermissionGroupKey =
  | "users"
  | "roles"
  | "organization"
  | "cycles"
  | "goals"
  | "reviews"
  | "progress"
  | "alerts"
  | "search"
  | "dashboard"
  | "reports"
  | "settings"
  | "system";

export const PERMISSION_GROUP_LABELS: Record<PermissionGroupKey, string> = {
  users: "المستخدمون",
  roles: "الأدوار والصلاحيات",
  organization: "الهيكل التنظيمي",
  cycles: "دورات OKR",
  goals: "الأهداف والنتائج",
  reviews: "المراجعات والاعتمادات",
  progress: "تحديثات الإنجاز",
  alerts: "التنبيهات",
  search: "البحث والتصفية",
  dashboard: "لوحة المعلومات",
  reports: "التقارير",
  settings: "الإعدادات",
  system: "النظام",
};

/**
 * صلاحيات النظام الكاملة.
 * - المفاتيح تقنية ثابتة (لا تُترجم).
 * - الأسماء عربية للعرض.
 * - وصف لكل صلاحية لإرشاد مدير النظام.
 */
export type Permission =
  // المستخدمون
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.status.manage"
  // الأدوار والصلاحيات
  | "roles.view"
  | "roles.manage"
  // الهيكل التنظيمي
  | "organization.view"
  | "organization.manage"
  // دورات OKR
  | "cycles.view"
  | "cycles.create"
  | "cycles.update"
  | "cycles.activate"
  | "cycles.complete"
  // الأهداف (Phase 3)
  | "goals.view"
  | "goals.create"
  | "goals.update"
  | "goals.delete"
  | "goals.submit" // إرسال الهدف للمراجعة
  | "goals.review" // فتح قائمة المراجعات
  | "goals.approve" // اعتماد الهدف
  | "goals.return" // إعادة الهدف للتعديل
  | "goals.assign" // إسناد الأهداف الفردية للموظفين
  | "keyresults.update"
  // المحاذاة (Phase 3)
  | "alignment.create"
  | "alignment.view"
  // الأهداف الفردية (Phase 3)
  | "individual_goals.view" // عرض الأهداف المسندة للموظف
  | "individual_goals.respond" // قبول/رفض الإسناد
  // المراجعات والاعتمادات (Phase 3 - يُفعّل عبر goals.review/approve/return)
  | "reviews.request"
  | "reviews.approve"
  | "reviews.reject"
  // تحديثات الإنجاز (Phase 4)
  | "progress.update"
  | "progress.view"
  | "evidence.upload"
  | "evidence.review"
  // التنبيهات (Phase 4)
  | "alerts.view"
  | "alerts.manage"
  // البحث (Phase 5)
  | "search.advanced"
  // لوحة المعلومات (Phase 5)
  | "dashboard.view"
  // التقارير (Phase 5)
  | "reports.view"
  | "reports.export"
  // الإعدادات (Phase 5)
  | "settings.view"
  | "settings.manage"
  // النظام
  | "system.admin"
  | "system.audit.view";

/** تعريف صلاحية بمفتاحها واسمها العربي ووصفها ومجموعتها */
export interface PermissionDef {
  key: Permission;
  label: string;
  description: string;
  group: PermissionGroupKey;
}

/** سجلّ الصلاحيات الكامل — مرجع موحّد للعرض والتحقق */
export const PERMISSION_DEFS: PermissionDef[] = [
  // المستخدمون
  { key: "users.view", label: "عرض المستخدمين", description: "الاطّلاع على قائمة المستخدمين ضمن النطاق المسموح.", group: "users" },
  { key: "users.create", label: "إنشاء مستخدم", description: "إضافة حسابات مستخدمين جديدة ضمن النطاق المسموح.", group: "users" },
  { key: "users.update", label: "تعديل مستخدم", description: "تعديل بيانات المستخدم والأدوار المسندة.", group: "users" },
  { key: "users.status.manage", label: "إدارة حالة الحساب", description: "تفعيل وإيقاف حسابات المستخدمين.", group: "users" },
  // الأدوار والصلاحيات
  { key: "roles.view", label: "عرض الأدوار", description: "الاطّلاع على الأدوار وصلاحياتها.", group: "roles" },
  { key: "roles.manage", label: "إدارة الأدوار", description: "إنشاء وتعديل الأدوار وإسناد الصلاحيات.", group: "roles" },
  // الهيكل التنظيمي
  { key: "organization.view", label: "عرض الهيكل التنظيمي", description: "تصفّح شجرة الجهات التنظيمية.", group: "organization" },
  { key: "organization.manage", label: "إدارة الهيكل التنظيمي", description: "إنشاء وتعديل الجهات التنظيمية وإعادة التسلسل.", group: "organization" },
  // دورات OKR
  { key: "cycles.view", label: "عرض الدورات", description: "الاطّلاع على دورات OKR.", group: "cycles" },
  { key: "cycles.create", label: "إنشاء دورة", description: "إنشاء دورة OKR جديدة بحالة مسودة.", group: "cycles" },
  { key: "cycles.update", label: "تعديل الدورة", description: "تعديل بيانات الدورة (وفق القيودLifecycle).", group: "cycles" },
  { key: "cycles.activate", label: "تفعيل الدورة", description: "نقل الدورة من مسودة إلى نشطة.", group: "cycles" },
  { key: "cycles.complete", label: "إكمال الدورة", description: "إغلاق دورة نشطة وإكمالها.", group: "cycles" },
  // الأهداف
  { key: "goals.view", label: "عرض الأهداف", description: "الاطّلاع على الأهداف والنتائج الرئيسية ضمن النطاق المسموح.", group: "goals" },
  { key: "goals.create", label: "إنشاء هدف", description: "إنشاء هدف جديد وربطه بدورة وجهة.", group: "goals" },
  { key: "goals.update", label: "تعديل هدف", description: "تعديل بيانات الأهداف (في حالة المسودة).", group: "goals" },
  { key: "goals.delete", label: "حذف هدف", description: "حذف الأهداف في حالة المسودة فقط.", group: "goals" },
  { key: "goals.submit", label: "إرسال للمراجعة", description: "إرسال هدف مسودة لقائمة المراجعة.", group: "goals" },
  { key: "goals.review", label: "فتح قائمة المراجعات", description: "الاطّلاع على قائمة الأهداف قيد المراجعة ضمن النطاق.", group: "goals" },
  { key: "goals.approve", label: "اعتماد الهدف", description: "اعتماد هدف قيد المراجعة (لا يمكن للمالك الاعتماد).", group: "goals" },
  { key: "goals.return", label: "إعادة الهدف للتعديل", description: "إعادة هدف قيد المراجعة لمالكه مع سبب إلزامي.", group: "goals" },
  { key: "goals.assign", label: "إسناد الأهداف الفردية", description: "إسناد هدف فردي لموظف ضمن النطاق التنظيمي.", group: "goals" },
  { key: "keyresults.update", label: "تعديل النتائج الرئيسية", description: "إضافة/تعديل/حذف النتائج الرئيسية للهدف.", group: "goals" },
  // المحاذاة
  { key: "alignment.create", label: "إنشاء محاذاة", description: "إنشاء هدف داعم وربطه بنتيجة رئيسية في الجهة الأعلى.", group: "goals" },
  { key: "alignment.view", label: "عرض المحاذاة", description: "عرض علاقات المحاذاة للأهداف والنتائج.", group: "goals" },
  // الأهداف الفردية
  { key: "individual_goals.view", label: "عرض الأهداف المسندة", description: "الاطّلاع على الأهداف الفردية المسندة للمستخدم.", group: "goals" },
  { key: "individual_goals.respond", label: "الرد على الإسناد", description: "قبول أو رفض الهدف الفردي المسند.", group: "goals" },
  // المراجعات والاعتمادات (تُفعّل عبر goals.review/approve/return — تُترك للتوافق)
  { key: "reviews.request", label: "طلب اعتماد", description: "إرسال هدف للاعتماد من الجهة العليا.", group: "reviews" },
  { key: "reviews.approve", label: "اعتماد الطلبات", description: "اعتماد أو رفض طلبات المراجعة.", group: "reviews" },
  { key: "reviews.reject", label: "رفض الطلبات", description: "رفض طلب مراجعة مع سبب.", group: "reviews" },
  // تحديثات الإنجاز
  { key: "progress.update", label: "تحديث الإنجاز", description: "تسجيل تقدّم النتائج الرئيسية.", group: "progress" },
  { key: "progress.view", label: "عرض الإنجاز", description: "الاطّلاع على تحديثات الإنجاز.", group: "progress" },
  { key: "evidence.upload", label: "رفع الأدلة", description: "إرفاق مستندات/صور داعمة للإنجاز.", group: "progress" },
  { key: "evidence.review", label: "مراجعة الأدلة", description: "مراجعة الأدلة المرفوعة وتسجيل القيمة المعتمدة.", group: "progress" },
  // التنبيهات
  { key: "alerts.view", label: "عرض التنبيهات", description: "الاطّلاع على التنبيهات والإنذارات.", group: "alerts" },
  { key: "alerts.manage", label: "إدارة التنبيهات", description: "إنشاء تنبيهات يدوية وتعديل الإعدادات.", group: "alerts" },
  // البحث
  { key: "search.advanced", label: "بحث متقدم", description: "استخدام البحث المتقدم والتصفية المتعددة.", group: "search" },
  // لوحة المعلومات
  { key: "dashboard.view", label: "عرض لوحة المعلومات", description: "الاطّلاع على التحليلات المؤسسية.", group: "dashboard" },
  // التقارير
  { key: "reports.view", label: "عرض التقارير", description: "الاطّلاع على تقارير الأداء.", group: "reports" },
  { key: "reports.export", label: "تصدير التقارير", description: "تصدير التقارير بصيغ PDF/Excel.", group: "reports" },
  // الإعدادات
  { key: "settings.view", label: "عرض الإعدادات", description: "الاطّلاع على إعدادات النظام.", group: "settings" },
  { key: "settings.manage", label: "إدارة الإعدادات", description: "تعديل إعدادات النظام العامة.", group: "settings" },
  // النظام
  { key: "system.admin", label: "إدارة النظام", description: "صلاحيات إدارية كاملة على النظام.", group: "system" },
  { key: "system.audit.view", label: "عرض سجل التدقيق", description: "الاطّلاع على سجل إجراءات النظام.", group: "system" },
];

/** خريطة الصلاحيات: مفتاح → تعريف */
export const PERMISSION_MAP: Record<Permission, PermissionDef> = PERMISSION_DEFS.reduce(
  (acc, def) => {
    acc[def.key] = def;
    return acc;
  },
  {} as Record<Permission, PermissionDef>
);

/** صلاحيات مجمّعة حسب المجموعة — لواجهة إدارة الأدوار */
export function permissionsByGroup(): Record<PermissionGroupKey, PermissionDef[]> {
  const result = {} as Record<PermissionGroupKey, PermissionDef[]>;
  for (const def of PERMISSION_DEFS) {
    if (!result[def.group]) result[def.group] = [];
    result[def.group].push(def);
  }
  return result;
}

/** جميع مفاتيح الصلاحيات */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_DEFS.map((d) => d.key);

/** هل المفتاح صلاحية معرّفة؟ */
export function isPermission(value: string): value is Permission {
  return value in PERMISSION_MAP;
}
