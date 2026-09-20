/**
 * خدمة مراقبة التنفيذ (Phase 4 Monitoring Service)
 * ===================================================================
 * مسؤولة عن:
 * - تقييم تأخّر تحديثات KRs المباشرة (افتراضي 7 أيام)
 * - تقييم تغيّرات حالة الأداء وتوليد تنبيهات
 * - توليد التذكيرات للتنبيهات غير المقروءة (افتراضي 2 أيام)
 *
 * المبادئ:
 * - idempotent: تكرار التقييم لا يُنشئ تنبيهات مكررة لنفس الحالة.
 * - الطلبات المعلّقة/المُعادة لا تُعيد ضبط المؤقت.
 * - لا تُولّد تنبيهات للأهداف المغلقة أو الدورات المكتملة.
 * - آخر تحديث معتمد هو المرجع، أو تاريخ بداية التنفيذ إن لم يوجد.
 */

import type { Objective, KeyResult, ProgressUpdateRequest } from "@/lib/data/phase3-types";
import type { Cycle, User } from "@/lib/data/types";
import type { Alert } from "@/lib/data/phase4-types";
import {
  PHASE4_CONFIG,
  now,
  daysSince,
} from "@/lib/services/phase4-config";
import {
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculatePerformanceStatus,
  getLatestApprovedValue,
} from "@/lib/services/phase4-calculations";
import type { PerformanceStatus } from "@/lib/data/phase4-types";

/* ===================================================================
   1. تأخّر تحديث KR مباشر
   =================================================================== */

/**
 * يحسب الطابع الزمني المرجعي لآخر تحديث معتمد لـ KR.
 * - إن وُجد تحديث معتمد: تاريخ المراجعة
 * - وإلا: تاريخ بدء التنفيذ الفعلي (اعتماد الهدف أو بداية الدورة)
 */
export function getKRUpdateReferenceTimestamp(
  keyResultId: string,
  updateRequests: ProgressUpdateRequest[],
  objective: Objective,
  cycle: Cycle,
  approvalTimestamp?: string
): string {
  const approved = updateRequests.filter(
    (u) =>
      u.keyResultId === keyResultId &&
      u.status === "approved" &&
      u.reviewedAt
  );
  if (approved.length > 0) {
    // الأحدث
    const sorted = approved.sort((a, b) =>
      (b.reviewedAt ?? "") < (a.reviewedAt ?? "") ? -1 : 1
    );
    return sorted[0].reviewedAt!;
  }
  // إن لم يوجد تحديث معتمد: استخدم بداية التنفيذ الفعلي
  // - إن اعتُمد الهدف بعد بداية الدورة: تاريخ الاعتماد
  // - وإلا: بداية الدورة
  if (approvalTimestamp && new Date(approvalTimestamp) > new Date(cycle.startDate)) {
    return approvalTimestamp;
  }
  return cycle.startDate;
}

/**
 * هل KR مباشر متأخّر عن التحديث؟
 * - يجب أن يكون الهدف معتمداً والدورة نشطة وKR مباشراً.
 * - الفارق الزمني عن آخر تحديث معتمد > configured interval (افتراضي 7 أيام).
 */
export function isKROverdueForUpdate(
  kr: KeyResult,
  objective: Objective,
  cycle: Cycle,
  updateRequests: ProgressUpdateRequest[],
  approvalTimestamp?: string
): { overdue: boolean; daysOverdue: number; referenceTimestamp?: string } {
  // تحقق من الأهلية الأساسية
  if (kr.progressSource !== "direct") {
    return { overdue: false, daysOverdue: 0 };
  }
  if (objective.status !== "approved") {
    return { overdue: false, daysOverdue: 0 };
  }
  if (cycle.status !== "active") {
    return { overdue: false, daysOverdue: 0 };
  }
  if (objective.status === "closed") {
    return { overdue: false, daysOverdue: 0 };
  }

  const referenceTimestamp = getKRUpdateReferenceTimestamp(
    kr.id,
    updateRequests,
    objective,
    cycle,
    approvalTimestamp
  );
  const daysSinceUpdate = daysSince(referenceTimestamp);
  const interval = PHASE4_CONFIG.directKrUpdateIntervalDays;
  if (daysSinceUpdate > interval) {
    return {
      overdue: true,
      daysOverdue: Math.floor(daysSinceUpdate - interval),
      referenceTimestamp,
    };
  }
  return { overdue: false, daysOverdue: 0, referenceTimestamp };
}

/* ===================================================================
   2. منع تكرار التنبيهات (Idempotency)
   =================================================================== */

/**
 * هل يوجد تنبيه نشط بنفس النوع لنفس KR؟
 * يمنع توليد تنبيهات مكررة لنفس الحالة المتأخّرة.
 */
export function hasActiveOverdueAlert(
  keyResultId: string,
  alerts: Alert[]
): boolean {
  return alerts.some(
    (a) =>
      a.type === "overdue_update" &&
      a.keyResultId === keyResultId &&
      a.isActive
  );
}

/**
 * هل يوجد تنبيه حالة أداء نشط لنفس الهدف ونفس الحالة؟
 */
export function hasActivePerformanceAlert(
  objectiveId: string,
  status: PerformanceStatus,
  alerts: Alert[]
): boolean {
  const alertType = status === "delayed" ? "performance_delayed" : "performance_stalled";
  return alerts.some(
    (a) =>
      a.type === alertType &&
      a.objectiveId === objectiveId &&
      a.isActive
  );
}

/* ===================================================================
   3. توليد تنبيهات تأخّر التحديث
   =================================================================== */

/**
 * يقيم جميع KRs المباشرة المؤهّلة ويُرجع قائمة بتنبيهات تأخّر جديدة يجب توليدها.
 * - يستبعد KRs التي لديها تنبيه نشط بالفعل (idempotent).
 * - يستبعد KRs في أهداف مغلقة أو دورات مكتملة.
 */
export function evaluateOverdueAlerts(
  objectives: Objective[],
  keyResults: KeyResult[],
  cycles: Cycle[],
  updateRequests: ProgressUpdateRequest[],
  existingAlerts: Alert[],
  approvalTimestamps: Record<string, string> // objectiveId → approval timestamp
): Array<{
  objective: Objective;
  kr: KeyResult;
  daysOverdue: number;
  referenceTimestamp: string;
}> {
  const newOverdueItems: Array<{
    objective: Objective;
    kr: KeyResult;
    daysOverdue: number;
    referenceTimestamp: string;
  }> = [];

  for (const objective of objectives) {
    if (objective.status !== "approved") continue;
    const cycle = cycles.find((c) => c.id === objective.cycleId);
    if (!cycle || cycle.status !== "active") continue;

    const approvalTs = approvalTimestamps[objective.id];
    const objKRs = keyResults.filter(
      (k) => k.objectiveId === objective.id && k.progressSource === "direct"
    );

    for (const kr of objKRs) {
      // تجنّب التكرار
      if (hasActiveOverdueAlert(kr.id, existingAlerts)) continue;

      const result = isKROverdueForUpdate(
        kr,
        objective,
        cycle,
        updateRequests,
        approvalTs
      );
      if (result.overdue && result.referenceTimestamp) {
        newOverdueItems.push({
          objective,
          kr,
          daysOverdue: result.daysOverdue,
          referenceTimestamp: result.referenceTimestamp,
        });
      }
    }
  }

  return newOverdueItems;
}

/* ===================================================================
   4. تقييم حالة الأداء وتوليد التنبيهات
   =================================================================== */

/**
 * يقيم حالة أداء كل هدف معتمد ويُرجع قائمة بتنبيهات الأداء الجديدة.
 * - يولّد تنبيهاً فقط عند الانتقال إلى delayed أو stalled (وليس advanced/on_track).
 * - يستبعد الأهداف التي لديها تنبيه نشط بنفس الحالة.
 */
export function evaluatePerformanceAlerts(
  objectives: Objective[],
  keyResults: KeyResult[],
  cycles: Cycle[],
  updateRequests: ProgressUpdateRequest[],
  existingAlerts: Alert[],
  allObjectives: Objective[],
  approvalTimestamps: Record<string, string>,
  currentTime: Date = now()
): Array<{
  objective: Objective;
  status: PerformanceStatus;
  actualProgress: number;
  expectedProgress: number;
}> {
  const newAlerts: Array<{
    objective: Objective;
    status: PerformanceStatus;
    actualProgress: number;
    expectedProgress: number;
  }> = [];

  for (const objective of objectives) {
    if (objective.status !== "approved") continue;
    const cycle = cycles.find((c) => c.id === objective.cycleId);
    if (!cycle || cycle.status !== "active") continue;

    const actualProgress = calculateObjectiveProgress(
      objective,
      keyResults,
      updateRequests,
      allObjectives
    );
    const approvalTs = approvalTimestamps[objective.id];
    const { expected: expectedProgress } = calculateExpectedProgress(
      objective,
      cycle,
      approvalTs,
      undefined,
      currentTime
    );
    const status = calculatePerformanceStatus(actualProgress, expectedProgress);

    if (status === "delayed" || status === "stalled") {
      // تجنّب التكرار
      if (hasActivePerformanceAlert(objective.id, status, existingAlerts)) continue;
      newAlerts.push({ objective, status, actualProgress, expectedProgress });
    }
  }

  return newAlerts;
}

/* ===================================================================
   5. تذكيرات التنبيهات غير المقروءة
   =================================================================== */

/**
 * يُحدّد أي التنبيهات تحتاج إلى تذكير.
 * - تنبيه غير مقروء لفترة تتجاوز فترة التذكير (افتراضي 2 أيام).
 * - لا يُعدّ المقروء تذكيراً.
 * - لا يولّد تذكيرات للتنبيهات غير النشطة.
 */
export function evaluateUnreadReminders(
  alerts: Alert[],
  alertReadStates: { alertId: string; userId: string; isRead: boolean; lastReminderAt?: string }[],
  currentTime: Date = now()
): Array<{ alertId: string; userId: string }> {
  const reminders: Array<{ alertId: string; userId: string }> = [];
  const reminderInterval = PHASE4_CONFIG.unreadReminderDays;

  for (const alert of alerts) {
    if (!alert.isActive) continue;
    for (const recipientId of alert.recipientUserIds) {
      const state = alertReadStates.find(
        (s) => s.alertId === alert.id && s.userId === recipientId
      );
      if (!state || state.isRead) continue;
      // آخر تذكير أو تاريخ الإنشاء
      const reference = state.lastReminderAt ?? alert.createdAt;
      const days = daysSince(reference);
      if (days >= reminderInterval) {
        reminders.push({ alertId: alert.id, userId: recipientId });
      }
    }
  }
  return reminders;
}
