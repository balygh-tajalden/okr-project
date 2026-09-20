/**
 * أنواع الطور الثالث — الأهداف والنتائج الرئيسية (Phase 3 Types)
 * ===================================================================
 * نماذج الأهداف، النتائج الرئيسية، سجل المراجعات، وإسناد الأهداف الفردية.
 *
 * مبادئ:
 * - الأهداف مرتبطة ببيانات Phase 2 الحقيقية (Cycle, OrgUnit, User) عبر المعرّفات.
 * - لا تكرار للبيانات داخل الهدف — مراجع فقط.
 * - كل هدف له دورة واحدة بالضبط، وجهة تنظيمية واحدة، ومالك واحد.
 * - النتائج الرئيسية تنتمي للهدف (وحدة واحدة للإنشاء/المراجعة/الاعتماد).
 * - سجل المراجعات والإسناد منفصل عن دورة حياة الهدف.
 */

import type { UserId, OrgUnitId, CycleId } from "@/lib/data/types";

export type ObjectiveId = string;
export type KeyResultId = string;

/**
 * نوع/سياق الهدف — يميّز مسار الموافقة والإسناد.
 * - institutional: هدف مؤسسي (يُعتمد من الإدارة العليا)
 * - organizational: هدف تنظيمي (يُعتمد من الجهة الأعلى مباشرة في الهرم)
 * - individual: هدف فردي (يُسند لموظف من مديره المباشر)
 */
export type ObjectiveType = "institutional" | "organizational" | "individual";

export const OBJECTIVE_TYPE_LABELS: Record<ObjectiveType, string> = {
  institutional: "هدف مؤسسي",
  organizational: "هدف تنظيمي",
  individual: "هدف فردي",
};

/**
 * دورة حياة الهدف — أربع حالات فقط (وفق المواصفات الصارمة)
 * مسودة → قيد المراجعة → معتمد → مغلق
 */
export type ObjectiveStatus = "draft" | "under_review" | "approved" | "closed";

export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  draft: "مسودة",
  under_review: "قيد المراجعة",
  approved: "معتمد",
  closed: "مغلق",
};

/** الانتقالات المسموحة (state machine) */
export const OBJECTIVE_TRANSITIONS: Record<ObjectiveStatus, ObjectiveStatus[]> = {
  draft: ["under_review"],
  under_review: ["approved", "draft"], // اعتماد أو إعادة للتعديل
  approved: ["closed"], // إغلاق يدوي لاحق (في Phase 4 سيكون آلياً)
  closed: [],
};

/**
 * مصدر تقدّم النتيجة الرئيسية — مصدر واحد فقط لكل KR.
 * - direct: قياس مباشر (عددي أو إنجاز/عدم إنجاز)
 * - supporting: من الأهداف الداعمة (لا يدخل قيم يدوية)
 */
export type KrProgressSource = "direct" | "supporting";

export const KR_PROGRESS_SOURCE_LABELS: Record<KrProgressSource, string> = {
  direct: "قياس مباشر",
  supporting: "أهداف داعمة",
};

/**
 * نوع القياس المباشر (إن كان progressSource = direct).
 * - numeric: عددي (له baseline, target, unit)
 * - binary: إنجاز / عدم إنجاز (لا حقول عددية)
 */
export type KrDirectType = "numeric" | "binary";

export const KR_DIRECT_TYPE_LABELS: Record<KrDirectType, string> = {
  numeric: "عددي",
  binary: "إنجاز / عدم إنجاز",
};

/** اتجاه القياس العددي — يُشتق تلقائياً من baseline و target */
export type KrDirection = "ascending" | "descending";

export const KR_DIRECTION_LABELS: Record<KrDirection, string> = {
  ascending: "تصاعدي",
  descending: "تنازلي",
};

/**
 * النتيجة الرئيسية (Key Result).
 * - منتج "واحد" مع الهدف (لا دورة حياة منفصلة)
 * - progressSource محدد بدقة (إلزامي عند الإرسال للمراجعة)
 * - إذا كان supporting: upstreamKeyResultId يربط بالهدف الداعم الأعلى
 */
export interface KeyResult {
  id: KeyResultId;
  objectiveId: ObjectiveId;
  title: string;
  description?: string;
  progressSource: KrProgressSource;
  // حقول القياس المباشر (إذا progressSource = direct)
  directType?: KrDirectType;
  unit?: string;
  baseline?: number;
  target?: number;
  direction?: KrDirection; // مشتق تلقائياً
  // حقول المحاذاة (إذا progressSource = supporting)
  upstreamKeyResultId?: KeyResultId; // KR الأعلى المُدعَم
  createdAt: string;
  updatedAt: string;
}

/**
 * سجلّ مراجعات الهدف — يحفظ كل أحداث المراجعة والاعتماد والإعادة.
 */
export interface ObjectiveReviewEvent {
  id: string;
  objectiveId: ObjectiveId;
  eventType: "submitted" | "approved" | "returned" | "assigned" | "accepted" | "rejected";
  actorUserId: UserId; // من قام بالإجراء (المالك، المراجع، الموظف)
  at: string; // ISO timestamp
  reason?: string; // سبب الإعادة أو الرفض (إلزامي للإعادة والرفض)
  targetUserId?: UserId; // في حالة الإسناد: الموظف المستلم
}

/** حالة الاستجابة على إسناد هدف فردي */
export type AssignmentResponse = "pending" | "accepted" | "rejected";

export const ASSIGNMENT_RESPONSE_LABELS: Record<AssignmentResponse, string> = {
  pending: "بانتظار الرد",
  accepted: "مقبول",
  rejected: "مرفوض",
};

/**
 * إسناد هدف فردي لموظف.
 * منفصل عن دورة حياة الهدف — حالة الإسناد لها دورتها الخاصة.
 */
export interface ObjectiveAssignment {
  id: string;
  objectiveId: ObjectiveId;
  assignerUserId: UserId; // المدير الذي أسند
  assigneeUserId: UserId; // الموظف المستلم
  response: AssignmentResponse;
  assignedAt: string;
  respondedAt?: string;
  rejectReason?: string; // إلزامي عند الرفض
}

/**
 * النموذج الكامل للهدف (Objective).
 * يربط بـ Cycle, OrgUnit, Owner من Phase 2.
 */
export interface Objective {
  id: ObjectiveId;
  title: string;
  description?: string;
  type: ObjectiveType;
  ownerId: UserId; // مالك واحد فقط
  orgUnitId: OrgUnitId; // الجهة التنظيمية المرتبطة
  cycleId: CycleId; // دورة واحدة بالضبط
  startDate: string; // ISO date — يجب أن تقع ضمن فترة الدورة
  endDate: string; // ISO date — يجب أن تقع ضمن فترة الدورة
  status: ObjectiveStatus;
  createdAt: string;
  updatedAt: string;
  /** المساهمون (مستخدمون إضافيون) — لا يملكون صلاحيات المالك */
  contributorUserIds: UserId[];
  /** معرّف KR الأعلى المُدعَم (فقط إذا كان الهدف داعماً) */
  upstreamKeyResultId?: KeyResultId;
}

/** الحالة الكاملة للطور الثالث */
export interface Phase3State {
  objectives: Objective[];
  keyResults: KeyResult[];
  reviewEvents: ObjectiveReviewEvent[];
  assignments: ObjectiveAssignment[];
}
