/**
 * خدمات الطور الرابع — الأهلية والتفويض (Phase 4 Authorization Services)
 * ===================================================================
 * كل قواعد الأهلية للتنفيذ في مكان واحد:
 * - أهلية الهدف للتنفيذ (Cycle نشطة + الهدف معتمد + غير مغلق)
 * - أهلية KR لاستقبال طلبات التحديث (مباشر فقط، ليس داعماً)
 * - أهلية المستخدم للإرسال (المالك أو مساهم مصرّح له + صلاحية)
 * - أهلية المستخدم للمراجعة (goals.approve + نطاق + ليس المالك/المُرسِل)
 * - أهلية إصدار التنبيه اليدوي
 */

import type {
  Objective,
  KeyResult,
} from "@/lib/data/phase3-types";
import type { Cycle, User, Role, OrgUnitId } from "@/lib/data/types";
import type { UserId } from "@/lib/data/types";
import { getEffectivePermissions, canAccessOrgUnit } from "@/lib/services/institutional";
import { isUserInAncestorOrgOf } from "@/lib/services/phase3-services";
import type { Permission } from "@/lib/auth/permissions-v2";

/* ===================================================================
   1. أهلية الهدف للتنفيذ
   =================================================================== */

/**
 * هل الهدف مؤهّل لاستقبال طلبات تحديث التقدّم؟
 *
 * القواعد:
 * - Cycle حالة = نشطة
 * - Objective حالة = معتمد (وليس مسودة/قيد مراجعة/مغلق)
 *
 * أمثلة:
 * - معتمد + نشطة → مؤهّل
 * - معتمد + مسودة → غير مؤهّل (لم تبدأ التنفيذ)
 * - مسودة + نشطة → غير مؤهّل
 * - مغلق → غير مؤهّل
 * - معتمد + مكتملة → غير مؤهّل
 */
export function isObjectiveExecutable(
  objective: Objective,
  cycle: Cycle
): { eligible: boolean; reason?: string } {
  if (objective.status !== "approved") {
    return {
      eligible: false,
      reason: objective.status === "closed"
        ? "الهدف مغلق — لا يمكن تسجيل تحديثات جديدة."
        : objective.status === "draft"
          ? "الهدف في حالة مسودة — يجب اعتماده أولاً."
          : "الهدف قيد المراجعة — لا يمكن تسجيل التحديثات حتى يُعتمد.",
    };
  }
  if (cycle.status !== "active") {
    return {
      eligible: false,
      reason: cycle.status === "completed"
        ? "الدورة مكتملة — لا يمكن تسجيل تحديثات جديدة."
        : "الدورة في حالة مسودة — لن يبدأ التنفيذ حتى تُفعّل الدورة.",
    };
  }
  return { eligible: true };
}

/* ===================================================================
   2. أهلية KR لاستقبال التحديثات
   =================================================================== */

/**
 * هل KR مؤهّل لاستقبال طلبات التحديث المباشرة؟
 * - يجب أن يكون progressSource = "direct"
 * - KRs الداعمة (progressSource = "supporting") لا تقبل تحديثات يدوية.
 */
export function isKREligibleForDirectUpdate(
  kr: KeyResult
): { eligible: boolean; reason?: string } {
  if (kr.progressSource !== "direct") {
    return {
      eligible: false,
      reason: "هذه النتيجة مصدرها الأهداف الداعمة — لا يمكن إدخال قيم تقدّم يدوية.",
    };
  }
  return { eligible: true };
}

/* ===================================================================
   3. أهلية المُرسِل
   =================================================================== */

/**
 * هل يمكن للمستخدم الإرسال لطلب تحديث على هذا الهدف/KR؟
 *
 * القواعد:
 * - المستخدم لديه صلاحية progress.update
 * - المستخدم هو المالك أو مساهم في الهدف
 * - (لا يشترط أن يكون في نطاق أعلى — هو مشارك مباشر)
 */
export function canSubmitUpdateRequest(
  user: User,
  roles: Role[],
  objective: Objective
): { canSubmit: boolean; reason?: string } {
  const permissions = getEffectivePermissions(user, roles);
  if (!permissions.includes("progress.update")) {
    return { canSubmit: false, reason: "لا تملك صلاحية تسجيل تحديثات الإنجاز." };
  }
  const isOwner = objective.ownerId === user.id;
  const isContributor = objective.contributorUserIds.includes(user.id);
  if (!isOwner && !isContributor) {
    return {
      canSubmit: false,
      reason: "فقط المالك أو المساهمون يمكنهم تسجيل تحديثات الإنجاز لهذا الهدف.",
    };
  }
  return { canSubmit: true };
}

/* ===================================================================
   4. أهلية المراجع
   =================================================================== */

/**
 * هل يمكن للمستخدم مراجعة واعتماد طلب تحديث؟
 *
 * القواعد:
 * - المستخدم لديه صلاحية progress.review أو progress.approve
 * - المستخدم ليس المُرسِل (لا اعتماد ذاتي للتحديثات)
 * - المستخدم في جهة أم لجهة الهدف (نطاق أعلى)
 * - الهدف في حالة معتمد ودورة نشطة
 */
export function canReviewUpdateRequest(
  user: User,
  roles: Role[],
  objective: Objective,
  orgUnits: { id: OrgUnitId; parentId: OrgUnitId | null; name: string }[],
  submitterUserId: UserId
): { canReview: boolean; reason?: string } {
  const permissions = getEffectivePermissions(user, roles);
  if (
    !permissions.includes("progress.review") &&
    !permissions.includes("evidence.review")
  ) {
    return { canReview: false, reason: "لا تملك صلاحية مراجعة تحديثات الإنجاز." };
  }
  if (user.id === submitterUserId) {
    return {
      canReview: false,
      reason: "لا يمكنك مراجعة طلب التحديث الذي أرسلته بنفسك.",
    };
  }
  if (user.id === objective.ownerId) {
    return {
      canReview: false,
      reason: "لا يمكنك اعتماد تحديث على هدفك الخاص — يجب أن يعتمده مراجع آخر.",
    };
  }
  // التحقق من النطاق: المستخدم في جهة أم لجهة الهدف
  // مدير النظام يتجاوز فحص النطاق
  if (
    !permissions.includes("system.admin" as Permission) &&
    !isUserInAncestorOrgOf(user, orgUnits as any, objective.orgUnitId)
  ) {
    return {
      canReview: false,
      reason: "خارج نطاقك التنظيمي — الهدف يخص جهة لا تملك عليها صلاحية مراجعة.",
    };
  }
  return { canReview: true };
}

/* ===================================================================
   5. أهلية إصدار تنبيه يدوي
   =================================================================== */

/**
 * هل يمكن للمدير إصدار تنبيه يدوي على هدف؟
 *
 * القواعد:
 * - صلاحية alerts.manage
 * - في نطاق الجهة (مدير أعلى أو في نفس الجهة)
 */
export function canIssueManualAlert(
  user: User,
  roles: Role[],
  objective: Objective,
  orgUnits: { id: OrgUnitId; parentId: OrgUnitId | null; name: string }[]
): { canIssue: boolean; reason?: string } {
  const permissions = getEffectivePermissions(user, roles);
  if (!permissions.includes("alerts.manage")) {
    return { canIssue: false, reason: "لا تملك صلاحية إصدار التنبيهات اليدوية." };
  }
  // مدير النظام يتجاوز فحص النطاق
  if (
    !permissions.includes("system.admin" as Permission) &&
    !isUserInAncestorOrgOf(user, orgUnits as any, objective.orgUnitId)
  ) {
    return {
      canIssue: false,
      reason: "خارج نطاقك التنظيمي — لا يمكن إصدار تنبيهات على أهداف خارج جهتك.",
    };
  }
  return { canIssue: true };
}

/* ===================================================================
   6. أهلية إغلاق الهدف
   =================================================================== */

/**
 * هل يمكن للمستخدم إغلاق الهدف يدوياً؟
 *
 * القواعد:
 * - صلاحية objectives.close (سنُعرّفها لاحقاً)
 * - المستخدم مالك أو في جهة أم
 */
export function canCloseObjective(
  user: User,
  roles: Role[],
  objective: Objective,
  orgUnits: { id: OrgUnitId; parentId: OrgUnitId | null; name: string }[]
): { canClose: boolean; reason?: string } {
  const permissions = getEffectivePermissions(user, roles);
  // مدير النظام أو من يملك صلاحية explicit
  if (
    !permissions.includes("system.admin" as Permission) &&
    !permissions.includes("goals.approve" as Permission)
  ) {
    return { canClose: false, reason: "لا تملك صلاحية إغلاق الأهداف." };
  }
  // المالك يمكنه إغلاق هدفه (هذا إجراء تنفيذي وليس اعتماداً)
  if (objective.ownerId === user.id) {
    return { canClose: true };
  }
  // غير المالك: يجب أن يكون في جهة أم (أو مدير نظام)
  if (
    !permissions.includes("system.admin" as Permission) &&
    !isUserInAncestorOrgOf(user, orgUnits as any, objective.orgUnitId)
  ) {
    return {
      canClose: false,
      reason: "خارج نطاقك التنظيمي — لا يمكن إغلاق أهداف خارج جهتك.",
    };
  }
  return { canClose: true };
}
