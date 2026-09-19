/**
 * محرّك حساب التقدّم المركزي (Phase 4 Calculation Engine)
 * ===================================================================
 * كل صيغ الحساب في مكان واحد قابل للاختبار وإعادة الاستخدام.
 *
 * مبادئ:
 * - القيمة الفعلية المعتمدة = آخر تحديث معتمد فقط.
 * - الطلب المعلّق/المُعاد لا يغيّر التقدّم.
 * - تُحفظ القيمة الفعلية حتى لو تجاوزت الهدف.
 * - لا تقسيم على صفر (baseline==target).
 * - حدّ 100% لكل KR عند حساب تقدّم الهدف.
 * - أوزان متساوية لكل KRs.
 * - التتالي عبر مستويات المحاذاة.
 */

import type {
  Objective,
  KeyResult,
  ProgressUpdateRequest,
} from "@/lib/data/phase3-types";
import type { ApprovedValue } from "@/lib/data/phase4-types";
import { KR_DIRECTION_LABELS } from "@/lib/data/phase3-types";
import type { KrDirection } from "@/lib/data/phase3-types";

/* ===================================================================
   1. القيمة الفعلية المعتمدة لـ KR مباشر
   =================================================================== */

/**
 * يجلب آخر قيمة معتمدة لـ KR مباشر.
 * يُرجع undefined إن لم يوجد تحديث معتمد بعد.
 */
export function getLatestApprovedValue(
  keyResultId: string,
  updateRequests: ProgressUpdateRequest[]
): ApprovedValue | undefined {
  const approved = updateRequests
    .filter(
      (u) =>
        u.keyResultId === keyResultId && u.status === "approved" && u.approvedValue
    )
    .sort((a, b) =>
      (b.reviewedAt ?? b.submittedAt) < (a.reviewedAt ?? a.submittedAt) ? -1 : 1
    );
  return approved[0]?.approvedValue;
}

/* ===================================================================
   2. حساب تقدّم KR مباشر
   =================================================================== */

/**
 * يحسب نسبة تقدّم KR مباشر (عددي أو ثنائي).
 *
 * صيغ العددي:
 * - تصاعدي (target > baseline): (current - baseline) / (target - baseline) * 100
 * - تنازلي (target < baseline): (baseline - current) / (baseline - target) * 100
 * - baseline == target: 100% إذا current==target، وإلا 0% (تجنّب القسمة على صفر)
 *
 * صيغ الثنائي:
 * - تحقق: 100%
 * - لم يتحقق: 0%
 *
 * ملاحظة:
 * - لا تُغلّف النتيجة ضمن 0-100 هنا (القيمة الفعلية تُحفظ كما هي).
 * - التغليف يحدث فقط عند حساب تقدّم الهدف (حدّ 100% لكل KR).
 */
export function calculateDirectKRProgress(
  kr: KeyResult,
  approvedValue: ApprovedValue | undefined
): { progress: number; currentValueLabel?: string } {
  // لا يوجد تحديث معتمد بعد → 0%
  if (!approvedValue) {
    return { progress: 0 };
  }

  // KR ثنائي
  if (kr.directType === "binary" || approvedValue.kind === "binary") {
    const achieved = approvedValue.binaryValue ?? false;
    return {
      progress: achieved ? 100 : 0,
      currentValueLabel: achieved ? "تحقق" : "لم يتحقق",
    };
  }

  // KR عددي
  if (kr.directType === "numeric" || approvedValue.kind === "numeric") {
    const baseline = kr.baseline ?? 0;
    const target = kr.target ?? 0;
    const current = approvedValue.numericValue ?? baseline;

    // baseline == target: حالة حدية
    if (baseline === target) {
      return {
        progress: current === target ? 100 : 0,
        currentValueLabel: String(current),
      };
    }

    const direction: KrDirection = target > baseline ? "ascending" : "descending";
    let progress: number;
    if (direction === "ascending") {
      // (current - baseline) / (target - baseline) * 100
      progress = ((current - baseline) / (target - baseline)) * 100;
    } else {
      // (baseline - current) / (baseline - target) * 100
      progress = ((baseline - current) / (baseline - target)) * 100;
    }
    return {
      progress,
      currentValueLabel: String(current),
    };
  }

  return { progress: 0 };
}

/* ===================================================================
   3. حساب تقدّم KR داعم (من الأهداف الداعمة المعتمدة)
   =================================================================== */

/**
 * يحسب تقدّم KR مصدره أهداف داعمة = المتوسط الحسابي لتقدّم الأهداف الداعمة المعتمدة فقط.
 * - لا تُحتسب الأهداف غير المعتمدة (مسودة/قيد مراجعة).
 * - إن لم توجد أهداف داعمة معتمدة → 0%.
 */
export function calculateSupportingKRProgress(
  kr: KeyResult,
  supportingObjectives: Objective[],
  allKeyResults: KeyResult[],
  updateRequests: ProgressUpdateRequest[]
): { progress: number; contributingObjectives: Objective[] } {
  if (kr.progressSource !== "supporting") {
    return { progress: 0, contributingObjectives: [] };
  }
  // ابحث عن الأهداف الداعمة المرتبطة بهذا KR
  const linkedSupportingObjectives = supportingObjectives.filter(
    (o) => o.upstreamKeyResultId === kr.id && o.status === "approved"
  );

  if (linkedSupportingObjectives.length === 0) {
    return { progress: 0, contributingObjectives: [] };
  }

  // احسب تقدّم كل هدف داعم
  const progresses = linkedSupportingObjectives.map((o) =>
    calculateObjectiveProgress(o, allKeyResults, updateRequests, supportingObjectives)
  );

  // المتوسط الحسابي
  const sum = progresses.reduce((acc, p) => acc + p, 0);
  return {
    progress: sum / linkedSupportingObjectives.length,
    contributingObjectives: linkedSupportingObjectives,
  };
}

/* ===================================================================
   4. حساب تقدّم الهدف (Objective)
   =================================================================== */

/**
 * يحسب تقدّم الهدف = المتوسط الحسابي لتقدّم KRs (مع حدّ 100% لكل KR).
 *
 * القواعد:
 * - لكل KR: min(krProgress, 100) — لا تعويض الأداء المنخفض بأداء مرتفع في KR آخر.
 * - أوزان متساوية.
 * - KR بدون تحديث معتمد = 0%.
 */
export function calculateObjectiveProgress(
  objective: Objective,
  allKeyResults: KeyResult[],
  updateRequests: ProgressUpdateRequest[],
  allObjectives: Objective[]
): number {
  const krs = allKeyResults.filter((k) => k.objectiveId === objective.id);
  if (krs.length === 0) return 0;

  // ابحث عن الأهداف الداعمة المتاحة لتمريرها لحساب الـ KRs الداعمة
  const supportingObjectives = allObjectives.filter(
    (o) => o.upstreamKeyResultId && o.status === "approved"
  );

  let sum = 0;
  for (const kr of krs) {
    const krProgress = calculateKRProgress(
      kr,
      allKeyResults,
      updateRequests,
      supportingObjectives
    );
    // حدّ 100% لكل KR
    sum += Math.min(krProgress, 100);
  }
  return sum / krs.length;
}

/** يحسب تقدّم KR مفرد (مباشر أو داعم) */
export function calculateKRProgress(
  kr: KeyResult,
  allKeyResults: KeyResult[],
  updateRequests: ProgressUpdateRequest[],
  supportingObjectives: Objective[]
): number {
  if (kr.progressSource === "supporting") {
    return calculateSupportingKRProgress(
      kr,
      supportingObjectives,
      allKeyResults,
      updateRequests
    ).progress;
  }
  // direct
  const approvedValue = getLatestApprovedValue(kr.id, updateRequests);
  return calculateDirectKRProgress(kr, approvedValue).progress;
}

/* ===================================================================
   5. التتالي (Cascade)
   =================================================================== */

/**
 * يجلب سلسلة KRs الأعلى التي تعتمد عليها سلسلة محاذاة معيّنة.
 * مثال: objective A → upstream KR B → objective C (which contains KR B)
 *
 * للتتالي: عند اعتماد تحديث لـ KR في الهدف الأدنى،
 * ينبغي إعادة حساب:
 *   1. تقدّم KR الأدنى
 *   2. تقدّم الهدف الأدنى
 *   3. (إن كان الهدف الأدنى داعماً) تقدّم KR الأعلى المُدعَم
 *   4. تقدّم الهدف الأعلى
 *   5. (تكرار إن كان الهدف الأعلى نفسه داعماً لهدف أعلى منه)
 *
 * يُرجع قائمة الأهداف/KRs المتأثرة بالترتيب من الأدنى إلى الأعلى.
 */
export function getCascadeChain(
  startingObjective: Objective,
  allObjectives: Objective[],
  allKeyResults: KeyResult[]
): Array<{ objective: Objective; upstreamKr?: KeyResult }> {
  const chain: Array<{ objective: Objective; upstreamKr?: KeyResult }> = [
    { objective: startingObjective },
  ];

  let current = startingObjective;
  const visited = new Set<string>([current.id]);

  while (current.upstreamKeyResultId) {
    // ابحث عن KR الأعلى
    const upstreamKr = allKeyResults.find((k) => k.id === current.upstreamKeyResultId);
    if (!upstreamKr) break;
    // ابحث عن الهدف الأعلى الذي يحوي هذا KR
    const upstreamObjective = allObjectives.find(
      (o) => o.id === upstreamKr.objectiveId
    );
    if (!upstreamObjective) break;
    // حماية من الحلقات
    if (visited.has(upstreamObjective.id)) break;
    visited.add(upstreamObjective.id);
    chain.push({ objective: upstreamObjective, upstreamKr });
    current = upstreamObjective;
  }

  return chain;
}

/* ===================================================================
   6. التقدّم المتوقّع (Expected Progress)
   =================================================================== */

/**
 * يحسب التقدّم المتوقّع بناءً على الزمن المنقضي خلال فترة التنفيذ.
 *
 * القواعد:
 * - البداية الفعلية:
 *   • إن اعتُمد الهدف قبل أو في بداية الدورة → بداية الدورة.
 *   • إن اعتُمد بعد بداية الدورة → تاريخ الاعتماد.
 * - النهاية الفعلية: إغلاق الهدف أو نهاية الدورة (أيهما أسبق).
 * - خلال الفترة: تقدّم خطّي من 0% إلى 100%.
 * - قبل البداية الفعلية: 0%.
 * - بعد النهاية الفعلية: 100%.
 */
export function calculateExpectedProgress(
  objective: Objective,
  cycle: { startDate: string; endDate: string; status: "draft" | "active" | "completed" },
  approvalTimestamp?: string,
  closureTimestamp?: string,
  currentTime: Date = new Date()
): { expected: number; effectiveStart: string; effectiveEnd: string } {
  const cycleStart = cycle.startDate;
  const cycleEnd = cycle.endDate;

  // البداية الفعلية
  let effectiveStart: string;
  if (approvalTimestamp && new Date(approvalTimestamp) > new Date(cycleStart)) {
    effectiveStart = approvalTimestamp;
  } else {
    effectiveStart = cycleStart;
  }

  // النهاية الفعلية: الإغلاق أو نهاية الدورة (أيهما أسبق)
  let effectiveEnd: string;
  if (closureTimestamp && new Date(closureTimestamp) < new Date(cycleEnd)) {
    effectiveEnd = closureTimestamp;
  } else {
    effectiveEnd = cycleEnd;
  }

  // قبل البداية الفعلية → 0%
  if (currentTime < new Date(effectiveStart)) {
    return { expected: 0, effectiveStart, effectiveEnd };
  }
  // بعد أو عند النهاية الفعلية → 100%
  if (currentTime >= new Date(effectiveEnd)) {
    return { expected: 100, effectiveStart, effectiveEnd };
  }

  // خلال الفترة: خطّي
  const elapsedMs = currentTime.getTime() - new Date(effectiveStart).getTime();
  const durationMs = new Date(effectiveEnd).getTime() - new Date(effectiveStart).getTime();
  if (durationMs <= 0) {
    return { expected: 0, effectiveStart, effectiveEnd };
  }
  const expected = (elapsedMs / durationMs) * 100;
  return { expected: Math.max(0, Math.min(100, expected)), effectiveStart, effectiveEnd };
}

/* ===================================================================
   7. حالة الأداء (Performance Status)
   =================================================================== */

import type { PerformanceStatus } from "@/lib/data/phase4-types";
import { PHASE4_CONFIG } from "./phase4-config";

/**
 * يحدّد حالة الأداء بناءً على التقدّم الفعلي والمتوقّع.
 *
 * القواعد:
 * - actual > expected → متقدّم (advanced)
 * - actual == expected (بعد التقريب) → على المسار (on_track)
 * - actual < expected والفرق ≤ الحد → متأخر (delayed)
 * - actual < expected والفرق > الحد → متعثر (stalled)
 *
 * الحد يُقرأ من مخزن الإعدادات (قابل للتعديل من واجهة الإعدادات).
 */
export function calculatePerformanceStatus(
  actualProgress: number,
  expectedProgress: number,
  threshold?: number
): PerformanceStatus {
  // استخدم الحد الممرّر، أو اقرأ من مخزن الإعدادات
  const effectiveThreshold = threshold ?? PHASE4_CONFIG.delayedStalledThresholdPoints;

  // التقريب لأقرب نقطة مئوية صحيحة للتمييز بين متقدّم وعلى المسار
  const roundedActual = Math.round(actualProgress);
  const roundedExpected = Math.round(expectedProgress);

  if (roundedActual > roundedExpected) return "advanced";
  if (roundedActual === roundedExpected) return "on_track";

  // actual < expected
  const diff = roundedExpected - roundedActual;
  if (diff <= effectiveThreshold) return "delayed";
  return "stalled";
}

/* ===================================================================
   8. أدوات العرض
   =================================================================== */

/** تنسيق نسبة مئوية مع حدّ رقمين عشريين */
export function formatProgress(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** تنسيق قيمة فعلية مع الوحدة */
export function formatActualValue(
  value: number | undefined,
  unit: string | undefined
): string {
  if (value === undefined) return "—";
  return unit ? `${value} ${unit}` : String(value);
}

/** يُرجع اتجاه القياس بالعربية */
export function getDirectionLabel(direction?: KrDirection): string {
  if (!direction) return "—";
  return KR_DIRECTION_LABELS[direction];
}
