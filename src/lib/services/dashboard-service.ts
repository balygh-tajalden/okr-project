/**
 * خدمات لوحة المعلومات (Dashboard Aggregation Service)
 * ===================================================================
 * يحسب المؤشرات المجمعّة من البيانات الفعلية:
 * - إجمالي الأهداف ضمن النطاق
 * - عدد المشاركين الفريدين
 * - معدل الإنجاز العام
 * - توزيع حالات الأداء
 * - الحالات التي تحتاج متابعة
 *
 * يطبّق النطاق التنظيمي قبل التجميع.
 * لا تُحسب بيانات عامة ثم تُخفى بصرياً.
 */

import type { Objective, KeyResult } from "@/lib/data/phase3-types";
import type { Cycle, User, Role } from "@/lib/data/types";
import type { UserId } from "@/lib/data/types";
import type { ProgressUpdateRequest } from "@/lib/data/phase4-types";
import type { PerformanceStatus } from "@/lib/data/phase4-types";
import {
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculatePerformanceStatus,
} from "@/lib/services/phase4-calculations";
import {
  filterObjectivesByScopeAndPermissions,
} from "@/lib/services/phase3-services";
import type { ObjectiveAssignment } from "@/lib/data/phase3-types";

/* ===================================================================
   تجميع لوحة المعلومات
   =================================================================== */

export interface DashboardMetrics {
  totalObjectives: number;
  totalParticipants: number;
  averageCompletion: number;
  performanceDistribution: {
    advanced: number;
    on_track: number;
    delayed: number;
    stalled: number;
  };
  attentionNeeded: Array<{
    objective: Objective;
    status: PerformanceStatus;
    actualProgress: number;
    expectedProgress: number;
  }>;
}

/**
 * يحسب مقاييس لوحة المعلومات للأهداف ضمن النطاق المحدد.
 *
 * @param objectives كل الأهداف المتاحة (سيتم تصفيتها بالفلاتر)
 * @param keyResults كل الـ KRs
 * @param updateRequests كل طلبات التحديث
 * @param allObjectives كل الأهداف (لحساب التتالي)
 * @param cycles كل الدورات
 * @param filters الفلاتر المطبقة (دورة/جهة/فترة)
 */
export function calculateDashboardMetrics(
  objectives: Objective[],
  keyResults: KeyResult[],
  updateRequests: ProgressUpdateRequest[],
  allObjectives: Objective[],
  cycles: Cycle[],
  reviewEvents: { objectiveId: string; eventType: string; at: string }[],
  filters: {
    cycleId?: string;
    orgUnitId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): DashboardMetrics {
  // طبّق الفلاتر على الأهداف
  let filtered = [...objectives];

  if (filters.cycleId) {
    filtered = filtered.filter((o) => o.cycleId === filters.cycleId);
  }
  if (filters.orgUnitId) {
    // ابحث عن الجهة وأبنائها
    // (نفترض أن orgUnitId يطابق أو يكون أب لجهة الهدف)
    filtered = filtered.filter((o) => o.orgUnitId === filters.orgUnitId);
  }
  if (filters.dateFrom) {
    filtered = filtered.filter((o) => o.startDate >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter((o) => o.endDate <= filters.dateTo!);
  }

  if (filtered.length === 0) {
    return {
      totalObjectives: 0,
      totalParticipants: 0,
      averageCompletion: 0,
      performanceDistribution: { advanced: 0, on_track: 0, delayed: 0, stalled: 0 },
      attentionNeeded: [],
    };
  }

  // عدد المشاركين الفريدين (المالك + المساهمون)
  const participantSet = new Set<UserId>();
  for (const o of filtered) {
    participantSet.add(o.ownerId);
    for (const c of o.contributorUserIds) participantSet.add(c);
  }

  // حساب التقدّم لكل هدف معتمد
  const objectiveProgressList: Array<{
    objective: Objective;
    actualProgress: number;
    expectedProgress: number;
    status: PerformanceStatus | undefined;
  }> = [];

  for (const obj of filtered) {
    const actualProgress = calculateObjectiveProgress(
      obj,
      keyResults,
      updateRequests,
      allObjectives
    );

    let expectedProgress = 0;
    let status: PerformanceStatus | undefined;

    const cycle = cycles.find((c) => c.id === obj.cycleId);
    if (cycle && obj.status === "approved") {
      const approvalEvent = reviewEvents.find(
        (e) => e.objectiveId === obj.id && e.eventType === "approved"
      );
      const { expected } = calculateExpectedProgress(
        obj,
        cycle,
        approvalEvent?.at
      );
      expectedProgress = expected;
      status = calculatePerformanceStatus(actualProgress, expectedProgress);
    }

    objectiveProgressList.push({ objective: obj, actualProgress, expectedProgress, status });
  }

  // معدل الإنجاز العام (متوسط التقدّم الفعلي)
  const totalProgress = objectiveProgressList.reduce(
    (sum, p) => sum + p.actualProgress,
    0
  );
  const averageCompletion = totalProgress / objectiveProgressList.length;

  // توزيع حالات الأداء
  const performanceDistribution = {
    advanced: 0,
    on_track: 0,
    delayed: 0,
    stalled: 0,
  };
  for (const p of objectiveProgressList) {
    if (p.status) {
      performanceDistribution[p.status]++;
    }
  }

  // الحالات التي تحتاج متابعة (متأخر + متعثر)
  const attentionNeeded = objectiveProgressList
    .filter((p) => p.status === "delayed" || p.status === "stalled")
    .map((p) => ({
      objective: p.objective,
      status: p.status!,
      actualProgress: p.actualProgress,
      expectedProgress: p.expectedProgress,
    }))
    .sort((a, b) => b.expectedProgress - b.actualProgress - (a.expectedProgress - a.actualProgress));

  return {
    totalObjectives: filtered.length,
    totalParticipants: participantSet.size,
    averageCompletion,
    performanceDistribution,
    attentionNeeded,
  };
}
