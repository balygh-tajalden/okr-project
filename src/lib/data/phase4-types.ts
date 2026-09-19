/**
 * أنواع الطور الرابع — التنفيذ والتقدّم والتنبيهات (Phase 4 Types)
 * ===================================================================
 * نماذج طلبات تحديث التقدّم، الأدلة، التنبيهات، حالة القراءة، والملاحظات.
 *
 * مبادئ:
 * - لا تكرار لبيانات Phase 2/3 — مراجع فقط بالمعرّفات المستقرة.
 * - فصل صارم بين:
 *   • حالة الطلب (pending_review/approved/returned)
 *   • دورة حياة الهدف (draft/under_review/approved/closed)
 *   • حالة الأداء (advanced/on_track/delayed/stalled)
 * - القيمة الفعلية المعتمدة لا يدخلها المُرسِل — فقط المراجع.
 */

import type { UserId, ObjectiveId } from "@/lib/data/phase3-types";
import type { KeyResultId } from "@/lib/data/phase3-types";

/** معرّف طلب التحديث */
export type UpdateRequestId = string;

/** معرّف التنبيه */
export type AlertId = string;

/**
 * حالة طلب التحديث — مستقلة عن دورة حياة الهدف.
 * - pending_review: بانتظار المراجعة
 * - approved: تم الاعتماد (تُحدّث القيمة الفعلية)
 * - returned: تمت الإعادة للتصحيح (مع سبب إلزامي)
 */
export type UpdateRequestStatus = "pending_review" | "approved" | "returned";

export const UPDATE_REQUEST_STATUS_LABELS: Record<UpdateRequestStatus, string> = {
  pending_review: "بانتظار المراجعة",
  approved: "تم الاعتماد",
  returned: "تمت الإعادة",
};

/**
 * نوع الدليل — متنوّع لدعم سيناريوهات الإنجاز المختلفة.
 */
export type EvidenceType = "note" | "file" | "link";

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  note: "ملاحظة",
  file: "ملف",
  link: "رابط",
};

/**
 * نموذج الدليل — مرتبط بطلب تحديث محدّد.
 * للملفات: نحفظ الاسم/النوع/الحجم فقط (prototype-safe) — لا نخزّن المحتوى فعلياً.
 */
export interface Evidence {
  id: string;
  updateRequestId: UpdateRequestId;
  type: EvidenceType;
  // محتوى الدليل:
  // - note: نص الملاحظة
  // - file: اسم الملف (العرض فقط — لا تخزين فعلي للمحتوى)
  // - link: الرابط الكامل
  content: string;
  // بيانات الملف (للنوع file فقط)
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  // المُرفِع
  uploadedBy: UserId;
  uploadedAt: string;
}

/**
 * القيمة المعتمدة في طلب التحديث.
 * - numeric: قيمة عددية (للـ KR العددي)
 * - binary: تحقق/لم يتحقق (للـ KR الثنائي)
 */
export interface ApprovedValue {
  kind: "numeric" | "binary";
  numericValue?: number; // للنوع numeric
  binaryValue?: boolean; // للنوع binary: true=تحقق, false=لم يتحقق
}

/**
 * نموذج طلب تحديث التقدّم.
 *
 * القاعدة الحرجة:
 * - المُرسِل لا يدخل القيمة الفعلية.
 * - المراجع وحده يُدخل القيمة المعتمدة عند الموافقة.
 * - الطلب المُعلّق لا يغيّر التقدّم.
 * - الطلب المُعاد لا يغيّر القيمة الفعلية.
 */
export interface ProgressUpdateRequest {
  id: UpdateRequestId;
  objectiveId: ObjectiveId;
  keyResultId: KeyResultId;
  // المُرسِل (المالك أو مساهم مصرّح له)
  submitterUserId: UserId;
  submittedAt: string;
  // ملاحظات المُرسِل (نص حر)
  submitterNotes: string;
  // حالة المراجعة
  status: UpdateRequestStatus;
  // بيانات المراجع (تُملأ عند الاعتماد/الإعادة)
  reviewerUserId?: UserId;
  reviewedAt?: string;
  // القيمة المعتمدة (تُملأ فقط عند الاعتماد)
  approvedValue?: ApprovedValue;
  // سبب الإعادة (إلزامي عند status=returned)
  returnReason?: string;
}

/* ===================================================================
   التنبيهات (Alerts)
   =================================================================== */

/**
 * نوع التنبيه — تلقائي أو يدوي، بأسباب مختلفة.
 */
export type AlertType =
  | "overdue_update" // تأخّر تحديث KR مباشر
  | "performance_delayed" // حالة الأداء تغيّرت إلى "متأخر"
  | "performance_stalled" // حالة الأداء تغيّرت إلى "متعثر"
  | "manual"; // تنبيه يدوي من مدير

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  overdue_update: "تأخّر تحديث الإنجاز",
  performance_delayed: "تأخّر الأداء",
  performance_stalled: "تعرّض الأداء",
  manual: "تنبيه يدوي",
};

/** مصدر التنبيه — نظامي أو يدوي */
export type AlertSource = "system" | "manual";

/**
 * نموذج التنبيه.
 * - متصل بهدف أو KR (أو كليهما).
 * - لكل مستلم حالة قراءة مستقلة (لا تتأثر بحالة مستلم آخر).
 * - يدعم الملاحظات اللاحقة (feedback) من المستلمين المعنيين.
 */
export interface Alert {
  id: AlertId;
  type: AlertType;
  source: AlertSource;
  // السياق: الهدف و/أو KR المرتبط
  objectiveId?: ObjectiveId;
  keyResultId?: KeyResultId;
  // العنوان والرسالة
  title: string;
  message: string;
  // السبب (إلزامي للتنبيه اليدوي)
  reason?: string;
  // المُرسِل (للتنبيه اليدوي — من أصدر التنبيه)
  senderUserId?: UserId;
  // المستلمون (قائمة معرّفات المستخدمين)
  recipientUserIds: UserId[];
  // طابع زمني للإنشاء
  createdAt: string;
  // طابع زمني لآخر تذكير (للمتابعة)
  lastReminderAt?: string;
  // هل توقّفت التنبيهات التلقائية لهذا العنصر؟ (للأهداف المغلقة/الدورات المكتملة)
  isActive: boolean;
}

/**
 * حالة قراءة التنبيه لكل مستلم — منفصلة عن كيان التنبيه.
 */
export interface AlertReadState {
  id: string;
  alertId: AlertId;
  userId: UserId;
  isRead: boolean;
  readAt?: string;
  // تذكيرات مسجّلة لهذا المستلم
  lastReminderAt?: string;
}

/**
 * ملاحظة متابعة على تنبيه — لا تحوّل التنبيهات إلى نظام دردشة.
 */
export interface AlertFeedback {
  id: string;
  alertId: AlertId;
  userId: UserId;
  note: string;
  createdAt: string;
}

/**
 * حالة الأداء — مفهوم مستقل عن دورة حياة الهدف.
 */
export type PerformanceStatus = "advanced" | "on_track" | "delayed" | "stalled";

export const PERFORMANCE_STATUS_LABELS: Record<PerformanceStatus, string> = {
  advanced: "متقدّم",
  on_track: "على المسار",
  delayed: "متأخر",
  stalled: "متعثر",
};

/** الحالة الكاملة للطور الرابع */
export interface Phase4State {
  updateRequests: ProgressUpdateRequest[];
  evidence: Evidence[];
  alerts: Alert[];
  alertReadStates: AlertReadState[];
  alertFeedback: AlertFeedback[];
}
