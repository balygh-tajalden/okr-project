/**
 * خدمات الطور الثالث (Phase 3 Business Services)
 * ===================================================================
 * كل قواعد الأعمال المعقدة في مكان واحد قابل للاختبار وإعادة الاستخدام:
 * - التحقق من تواريخ الهدف ضمن فترة الدورة
 * - حساب اتجاه القياس العددي (تصاعدي/تنازلي) تلقائياً
 * - مسار الموافقة: من المراجعون المؤهلون (hierarchy-based)
 * - منع الاعتماد الذاتي
 * - أهلية المحاذاة (KR الأعلى من الجهة الأم المباشرة، نفس الدورة)
 * - أهلية الإسناد (الموظفون ضمن نطاق المدير)
 * - التحقق من جاهزية الهدف للإرسال للمراجعة
 * - فلترة الأهداف حسب النطاق التنظيمي
 */

import type {
  Objective,
  KeyResult,
  ObjectiveType,
  ObjectiveStatus,
  KrDirection,
  KrProgressSource,
  KrDirectType,
} from "@/lib/data/phase3-types";
import { OBJECTIVE_TRANSITIONS } from "@/lib/data/phase3-types";
import type {
  User,
  Role,
  OrgUnit,
  Cycle,
  UserId,
  OrgUnitId,
  CycleId,
} from "@/lib/data/types";
import type { Permission } from "@/lib/auth/permissions-v2";
import {
  getEffectivePermissions,
  getAccessibleOrgUnitIds,
  canAccessOrgUnit,
  getAncestorPath,
} from "@/lib/services/institutional";
import type { KeyResultId, ObjectiveId } from "@/lib/data/phase3-types";

/* ===================================================================
   1. التحقق من تواريخ الهدف ضمن فترة الدورة
   =================================================================== */

/**
 * يتحقق من أن تواريخ الهدف تقع ضمن فترة الدورة.
 * القواعد:
 * - objective.end > objective.start
 * - objective.start >= cycle.start
 * - objective.end <= cycle.end
 */
export function validateObjectiveDates(
  objectiveStart: string,
  objectiveEnd: string,
  cycle: Cycle
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!objectiveStart || !objectiveEnd) {
    errors.push("تاريخا البداية والنهاية مطلوبان.");
    return { valid: false, errors };
  }
  const start = new Date(objectiveStart);
  const end = new Date(objectiveEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push("صيغة التاريخ غير صحيحة.");
    return { valid: false, errors };
  }
  if (end <= start) {
    errors.push("يجب أن يكون تاريخ نهاية الهدف لاحقًا لتاريخ بدايته.");
  }
  const cycleStart = new Date(cycle.startDate);
  const cycleEnd = new Date(cycle.endDate);
  if (start < cycleStart) {
    errors.push(
      `يجب أن يبدأ الهدف ضمن فترة الدورة (لا قبل ${formatDate(cycle.startDate)}).`
    );
  }
  if (end > cycleEnd) {
    errors.push(
      `يجب أن ينتهي الهدف ضمن فترة الدورة (لا بعد ${formatDate(cycle.endDate)}).`
    );
  }
  return { valid: errors.length === 0, errors };
}

/* ===================================================================
   2. حساب اتجاه القياس العددي تلقائياً
   =================================================================== */

export function deriveDirection(baseline: number, target: number): KrDirection {
  if (target > baseline) return "ascending";
  if (target < baseline) return "descending";
  // baseline == target — حالة حدية، نُرجع ascending كافتراضي (سيُعالج لاحقاً)
  return "ascending";
}

export const KR_DIRECTION_LABELS: Record<KrDirection, string> = {
  ascending: "تصاعدي",
  descending: "تنازلي",
};

/* ===================================================================
   3. التحقق من تكوين النتيجة الرئيسية
   =================================================================== */

/**
 * هل النتيجة الرئيسية مكتملة بصورة كافية للإرسال للمراجعة؟
 * - direct/numeric: يتطلب baseline, target, unit
 * - direct/binary: لا يتطلب حقولاً عددية
 * - supporting: يتطلب upstreamKeyResultId (في الهدف الأب)
 */
export function validateKeyResultForSubmission(kr: KeyResult): string[] {
  const errors: string[] = [];
  if (!kr.title.trim()) errors.push("عنوان النتيجة الرئيسية مطلوب.");
  if (kr.progressSource === "direct") {
    if (!kr.directType) errors.push("نوع القياس المباشر مطلوب.");
    if (kr.directType === "numeric") {
      if (kr.baseline == null) errors.push("القيمة المرجعية مطلوبة للقياس العددي.");
      if (kr.target == null) errors.push("القيمة المستهدفة مطلوبة للقياس العددي.");
      if (!kr.unit?.trim()) errors.push("وحدة القياس مطلوبة للقياس العددي.");
    }
  } else if (kr.progressSource === "supporting") {
    // upstreamKeyResultId مطلوب على مستوى الهدف الأب، لا على KR
    // هنا فقط نتحقق أن لا توجد حقول قياس مباشر متضاربة
    if (kr.directType || kr.baseline != null || kr.target != null || kr.unit) {
      errors.push(
        "لا يمكن وجود حقول قياس مباشر عندما يكون مصدر التقدم هو الأهداف الداعمة."
      );
    }
  } else {
    errors.push("مصدر التقدم مطلوب (قياس مباشر أو أهداف داعمة).");
  }
  return errors;
}

/* ===================================================================
   4. التحقق من جاهزية الهدف للإرسال للمراجعة
   =================================================================== */

/**
 * يجمع كل شروط الإرسال للمراجعة في مكان واحد.
 * القواعد:
 * - الحالة الحالية = draft
 * - دورة غير مكتملة
 * - مالك محدد
 * - جهة تنظيمية محددة
 * - تواريخ صالحة ضمن الدورة
 * - KR واحد على الأقل
 * - كل KR صالح للإرسال
 */
export function validateObjectiveForSubmission(
  objective: Objective,
  cycle: Cycle,
  keyResults: KeyResult[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (objective.status !== "draft") {
    errors.push("يجب أن يكون الهدف في حالة مسودة لإرساله للمراجعة.");
  }
  if (cycle.status === "completed") {
    errors.push("لا يمكن إرسال أهداف جديدة في دورة مكتملة.");
  }
  if (!objective.ownerId) errors.push("يجب تحديد مالك الهدف.");
  if (!objective.orgUnitId) errors.push("يجب تحديد الجهة التنظيمية.");
  if (!objective.cycleId) errors.push("يجب تحديد دورة الهدف.");

  // التحقق من التواريخ ضمن الدورة
  const dateResult = validateObjectiveDates(objective.startDate, objective.endDate, cycle);
  errors.push(...dateResult.errors);

  // التحقق من وجود KR واحد على الأقل
  const objKRs = keyResults.filter((k) => k.objectiveId === objective.id);
  if (objKRs.length === 0) {
    errors.push("يجب إضافة نتيجة رئيسية واحدة على الأقل.");
  } else {
    // التحقق من صحة كل KR
    for (const kr of objKRs) {
      const krErrors = validateKeyResultForSubmission(kr);
      errors.push(...krErrors);
    }
  }

  // التحقق من المحاذاة (إذا كان الهدف داعماً)
  if (objective.upstreamKeyResultId) {
    const upstreamKR = keyResults.find((k) => k.id === objective.upstreamKeyResultId);
    if (!upstreamKR) {
      errors.push("النتيجة الرئيسية العليا المُدعَمة غير موجودة.");
    }
  }

  return { valid: errors.length === 0, errors: dedupe(errors) };
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

/* ===================================================================
   5. آلة حالة الهدف
   =================================================================== */

export function canTransitionObjective(from: ObjectiveStatus, to: ObjectiveStatus): boolean {
  return OBJECTIVE_TRANSITIONS[from].includes(to);
}

/* ===================================================================
   6. منع الاعتماد الذاتي (Self-Approval Prevention)
   =================================================================== */

/**
 * هل يمكن للمستخدم اعتماد هذا الهدف؟
 * القواعد الإلزامية:
 * 1) المستخدم لديه صلاحية goals.approve
 * 2) المستخدم ليس مالك الهدف (لا اعتماد ذاتي)
 * 3) المستخدم ضمن نطاق الجهة الأعلى المباشرة (للأهداف التنظيمية والداعمة)
 *    أو الإدارة العليا (للأهداف المؤسسية)
 */
export function canApproveObjective(
  user: User,
  roles: Role[],
  objective: Objective,
  orgUnits: OrgUnit[]
): { canApprove: boolean; reason?: string } {
  const permissions = getEffectivePermissions(user, roles);
  if (!permissions.includes("goals.approve")) {
    return { canApprove: false, reason: "لا تملك صلاحية اعتماد الأهداف." };
  }
  if (objective.ownerId === user.id) {
    return {
      canApprove: false,
      reason: "لا يمكنك اعتماد هدفك الخاص — يجب أن يعتمده مراجع آخر.",
    };
  }
  // التحقق من النطاق التنظيمي
  // للهدف المؤسسي: مراجع من الإدارة العليا (له صلاحية + نطاق يغطي جهة الهدف)
  // للهدف التنظيمي/الداعم: مراجع من الجهة الأم المباشرة لجهة الهدف
  if (!canAccessOrgUnit(user, orgUnits, objective.orgUnitId)) {
    // تحقق إضافي: قد يكون المستخدم في جهة أم تغطي جهة الهدف
    // canAccessOrgUnit يتحقق من نطاق المستخدم (الجهة الحالية + المتحدّرين)
    // لكن الهدف في جهة ما — يجب أن تكون جهة المستخدم هي الأم أو في السلسلة الأعلى
    if (!isUserInAncestorOrgOf(user, orgUnits, objective.orgUnitId)) {
      return {
        canApprove: false,
        reason: "خارج نطاقك التنظيمي — الهدف يخص جهة لا تملك عليها صلاحية مراجعة.",
      };
    }
  }
  return { canApprove: true };
}

/**
 * هل المستخدم في جهة أم (أو سلف) لجهة الهدف؟
 * هذا يعني أن نطاق مستخدم المراجع يغطي جهة الهدف (لأنها متحدّرة منه).
 */
export function isUserInAncestorOrgOf(
  user: User,
  orgUnits: OrgUnit[],
  targetOrgUnitId: OrgUnitId
): boolean {
  if (!user.primaryOrgUnitId) return false;
  // احصل على مسار الأجداد للجهة الهدف
  const ancestors = getAncestorPath(orgUnits, targetOrgUnitId);
  // هل المستخدم في إحدى الجهات الأجداد؟
  return ancestors.some((u) => u.id === user.primaryOrgUnitId);
}

/* ===================================================================
   7. المراجعون المؤهلون (Eligible Approvers)
   =================================================================== */

/**
 * يجلب قائمة المراجعين المؤهلين لاعتماد هدف معيّن.
 * يستخدم:
 * - الصلاحيات (goals.approve)
 * - النطاق التنظيمي (يجب أن يكون في جهة أم لجهة الهدف)
 * - استبعاد المالك (منع الاعتماد الذاتي)
 */
export function getEligibleApprovers(
  objective: Objective,
  users: User[],
  roles: Role[],
  orgUnits: OrgUnit[]
): User[] {
  return users.filter((u) => {
    if (u.status !== "active") return false;
    if (u.id === objective.ownerId) return false; // منع الاعتماد الذاتي
    const permissions = getEffectivePermissions(u, roles);
    if (!permissions.includes("goals.approve")) return false;
    // يجب أن يكون في جهة أم لجهة الهدف (أو في نفس الجهة في حالة الهدف المؤسسي)
    return isUserInAncestorOrgOf(u, orgUnits, objective.orgUnitId);
  });
}

/* ===================================================================
   8. أهلية المحاذاة (Alignment Eligibility)
   =================================================================== */

/**
 * يجلب قائمة النتائج الرئيسية العليا المتاحة للمحاذاة.
 * القواعد:
 * - نفس الدورة (لا محاذاة عبر الدورات)
 * - الهدف الأعلى في الجهة الأم المباشرة لجهة الهدف الحالي
 * - الهدف الأعلى ليس بالضرورة معتمد (يمكن أن يكون مسودة/قيد المراجعة)
 */
export function getEligibleUpstreamKeyResults(
  currentOrgUnitId: OrgUnitId | null,
  currentCycleId: CycleId | undefined,
  orgUnits: OrgUnit[],
  objectives: Objective[],
  keyResults: KeyResult[]
): Array<{ kr: KeyResult; objective: Objective }> {
  if (!currentOrgUnitId || !currentCycleId) return [];
  // ابحث عن الجهة الأم المباشرة
  const currentUnit = orgUnits.find((u) => u.id === currentOrgUnitId);
  if (!currentUnit || !currentUnit.parentId) return [];
  const parentUnitId = currentUnit.parentId;

  // ابحث عن الأهداف في الجهة الأم ضمن نفس الدورة
  const upstreamObjectives = objectives.filter(
    (o) => o.orgUnitId === parentUnitId && o.cycleId === currentCycleId
  );
  if (upstreamObjectives.length === 0) return [];

  // اجلب كل النتائج الرئيسية لهذه الأهداف
  const result: Array<{ kr: KeyResult; objective: Objective }> = [];
  for (const obj of upstreamObjectives) {
    const krs = keyResults.filter((k) => k.objectiveId === obj.id);
    for (const kr of krs) {
      result.push({ kr, objective: obj });
    }
  }
  return result;
}

/* ===================================================================
   9. أهلية الإسناد (Assignable Employees)
   =================================================================== */

/**
 * يجلب قائمة الموظفين القابلين للإسناد ضمن نطاق المدير.
 * القواعد:
 * - الحساب نشط
 * - ضمن النطاق التنظيمي للمدير (جهته + المتحدّرون)
 * - استبعاد المدير نفسه
 */
export function getAssignableEmployees(
  manager: User,
  users: User[],
  orgUnits: OrgUnit[]
): User[] {
  const scope = getAccessibleOrgUnitIds(manager, orgUnits);
  return users.filter(
    (u) =>
      u.status === "active" &&
      u.id !== manager.id &&
      u.primaryOrgUnitId &&
      scope.has(u.primaryOrgUnitId)
  );
}

/* ===================================================================
   10. فلترة الأهداف حسب النطاق والصلاحيات
   =================================================================== */

/**
 * يفلتر قائمة الأهداف لما يُسمح للمستخدم برؤيته.
 * القواعد:
 * - مدير النظام: يرى كل الأهداف
 * - المستخدم يرى:
 *   - أهداف يملكها أو هو مساهم فيها
 *   - أهدافاً في جهته أو متحدّرة منها (نطاقه التنظيمي)
 *   - أهدافاً مُسندة إليه (كموظف)
 *   - أهدافاً في قائمة مراجعته (قيد المراجعة + هو مؤهل للاعتماد)
 */
export function filterObjectivesByScopeAndPermissions(
  viewer: User,
  roles: Role[],
  objectives: Objective[],
  orgUnits: OrgUnit[],
  assignments: { objectiveId: string; assigneeUserId: string }[],
  users: User[]
): Objective[] {
  const permissions = getEffectivePermissions(viewer, roles);
  if (permissions.includes("system.admin")) return objectives;
  if (!permissions.includes("goals.view")) return [];

  const scope = getAccessibleOrgUnitIds(viewer, orgUnits);
  const myAssignments = assignments
    .filter((a) => a.assigneeUserId === viewer.id)
    .map((a) => a.objectiveId);

  return objectives.filter((o) => {
    // أهداف يملكها
    if (o.ownerId === viewer.id) return true;
    // أهداف هو مساهم فيها
    if (o.contributorUserIds.includes(viewer.id)) return true;
    // أهداف مُسندة إليه
    if (myAssignments.includes(o.id)) return true;
    // أهداف في نطاقه التنظيمي
    if (o.orgUnitId && scope.has(o.orgUnitId)) return true;
    // أهداف قيد المراجعة وهو مؤهل لاعتمادها
    if (o.status === "under_review" && permissions.includes("goals.approve")) {
      const canApprove = canApproveObjective(viewer, roles, o, orgUnits);
      if (canApprove.canApprove) return true;
    }
    return false;
  });
}

/* ===================================================================
   11. قائمة المراجعات للمستخدم
   =================================================================== */

/**
 * يجلب قائمة الأهداف قيد المراجعة المتاحة لمستخدم لمراجعتها.
 * - حالة under_review
 * - ليس مالكها
 * - لديه صلاحية goals.review أو goals.approve
 * - ضمن نطاقه التنظيمي (سلسلة أجداد الجهة)
 */
export function getReviewableObjectives(
  reviewer: User,
  roles: Role[],
  objectives: Objective[],
  orgUnits: OrgUnit[]
): Objective[] {
  const permissions = getEffectivePermissions(reviewer, roles);
  if (!permissions.includes("goals.review") && !permissions.includes("goals.approve")) {
    return [];
  }
  return objectives.filter((o) => {
    if (o.status !== "under_review") return false;
    if (o.ownerId === reviewer.id) return false; // لا يراجع هدفه
    // يجب أن يكون المراجع في جهة أم لجهة الهدف
    return isUserInAncestorOrgOf(reviewer, orgUnits, o.orgUnitId);
  });
}

/* ===================================================================
   12. حالة التنفيذ النسبية (للعرض فقط — لا تقدّم فعلي في Phase 3)
   =================================================================== */

/**
 * يُرجع رسالة توضيحية لحالة تنفيذ الهدف بناءً على الدورة.
 * - معتمد + دورة مكتملة: "الدورة مكتملة — مرجع تاريخي"
 * - معتمد + دورة نشطة: "الهدف معتمد ومؤهل للتنفيذ"
 * - معتمد + دورة مسودة: "تم اعتماد الهدف، وسيبدأ التنفيذ عند تفعيل الدورة"
 * - قيد المراجعة/مسودة: لا رسالة تنفيذ
 */
export function getExecutionReadinessMessage(
  objective: Objective,
  cycle: Cycle
): string | null {
  if (objective.status === "approved") {
    if (cycle.status === "completed")
      return "الدورة مكتملة — الهدف للقراءة فقط كمرجع تاريخي.";
    if (cycle.status === "active") return "الهدف معتمد ومؤهل للتنفيذ.";
    if (cycle.status === "draft")
      return "تم اعتماد الهدف، وسيبدأ التنفيذ عند تفعيل الدورة.";
  }
  if (objective.status === "closed") {
    return "الهدف مغلق — للقراءة فقط.";
  }
  return null;
}

/* ===================================================================
   13. أدوات مساعدة
   =================================================================== */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
