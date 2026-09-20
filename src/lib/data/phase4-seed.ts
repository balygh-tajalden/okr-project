/**
 * بيانات الطور الرابع الأولية (Phase 4 Seed Data)
 * ===================================================================
 * بيانات تجريبية تحاكي سيناريوهات التنفيذ الكاملة:
 * - طلبات تحديث: معلّق / معتمد / مُعاد
 * - أدلة متنوّعة (ملاحظات، روابط)
 * - تنبيهات: تأخّر، أداء متأخر، تنبيه يدوي
 * - حالات قراءة متنوّعة
 */

import type {
  ProgressUpdateRequest,
  Evidence,
  Alert,
  AlertReadState,
  AlertFeedback,
} from "./phase4-types";

const PAST = new Date("2024-12-15T08:00:00.000Z").toISOString();
const JAN15 = new Date("2025-01-15T08:00:00.000Z").toISOString();
const JAN20 = new Date("2025-01-20T08:00:00.000Z").toISOString();
const JAN25 = new Date("2025-01-25T08:00:00.000Z").toISOString();
const FEB01 = new Date("2025-02-01T08:00:00.000Z").toISOString();
const FEB10 = new Date("2025-02-10T08:00:00.000Z").toISOString();
const FEB20 = new Date("2025-02-20T08:00:00.000Z").toISOString();
const MAR01 = new Date("2025-03-01T08:00:00.000Z").toISOString();

/* ===================================================================
   طلبات تحديث التقدّم (Progress Update Requests)
   =================================================================== */

export const SEED_UPDATE_REQUESTS: ProgressUpdateRequest[] = [
  // 1) KR-001 (obj-001 معتمد، تصاعدي 20→80%): تحديث معتمد بقيمة 50
  {
    id: "ur-001",
    objectiveId: "obj-001",
    keyResultId: "kr-001",
    submitterUserId: "u-002", // المالك
    submittedAt: JAN20,
    submitterNotes:
      "تم إنجاز المرحلة الأولى من أتمتة الخدمات. نسبة الخدمات المؤتمتة بلغت 50% حتى تاريخه.",
    status: "approved",
    reviewerUserId: "u-001", // مدير النظام
    reviewedAt: JAN25,
    approvedValue: { kind: "numeric", numericValue: 50 },
  },
  // 2) KR-002 (obj-001 معتمد، تنازلي 5→2s): تحديث معتمد بقيمة 3 (50% تقدّم)
  {
    id: "ur-002",
    objectiveId: "obj-001",
    keyResultId: "kr-002",
    submitterUserId: "u-002",
    submittedAt: FEB01,
    submitterNotes: "متوسط زمن الاستجابة انخفض إلى 3 ثوانٍ بعد تحسين الخوادم.",
    status: "approved",
    reviewerUserId: "u-001",
    reviewedAt: FEB10,
    approvedValue: { kind: "numeric", numericValue: 3 },
  },
  // 3) KR-001: طلب معلّق جديد بقيمة مقترحة 60
  {
    id: "ur-003",
    objectiveId: "obj-001",
    keyResultId: "kr-001",
    submitterUserId: "u-002",
    submittedAt: FEB20,
    submitterNotes:
      "تقدّم إضافي في الأتمتة. الطلب بانتظار المراجعة لتسجيل القيمة المعتمدة.",
    status: "pending_review",
  },
  // 4) KR-003 (obj-002 تحت المراجعة، binary): طلب معتمد "تحقق"
  {
    id: "ur-004",
    objectiveId: "obj-002",
    keyResultId: "kr-003",
    submitterUserId: "u-004", // فهد العتيبي
    submittedAt: JAN25,
    submitterNotes: "تم إطلاق النسخة التجريبية بنجاح لشريحة محدودة من المستخدمين.",
    status: "approved",
    reviewerUserId: "u-002", // د. خالد
    reviewedAt: FEB01,
    approvedValue: { kind: "binary", binaryValue: true },
  },
  // 5) KR-006 (obj-004 معتمد، تصاعدي 0→5 أنواع): طلب معتمد بقيمة 3
  {
    id: "ur-005",
    objectiveId: "obj-004",
    keyResultId: "kr-006",
    submitterUserId: "u-005", // نورة
    submittedAt: FEB10,
    submitterNotes: "تم تسليم 3 أنواع تقارير شهرية حتى الآن: المالية، الإدارية، الإحصائية.",
    status: "approved",
    reviewerUserId: "u-004", // فهد
    reviewedAt: FEB20,
    approvedValue: { kind: "numeric", numericValue: 3 },
  },
  // 6) KR-006: طلب مُعاد مع سبب
  {
    id: "ur-006",
    objectiveId: "obj-004",
    keyResultId: "kr-006",
    submitterUserId: "u-005",
    submittedAt: JAN25,
    submitterNotes: "تم تسليم نوعي تقارير حتى الآن.",
    status: "returned",
    reviewerUserId: "u-004",
    reviewedAt: FEB01,
    returnReason:
      "الأدلة المرفقة غير كافية. يرجى إرفاق روابط مباشرة للتقارير المُنجزة قبل إعادة الإرسال.",
  },
  // 7) KR-007 (obj-006 مغلق): تحديث تاريخي معتمد بقيمة 70 (هدف الدورة السابقة)
  {
    id: "ur-007",
    objectiveId: "obj-006",
    keyResultId: "kr-007",
    submitterUserId: "u-002",
    submittedAt: new Date("2024-12-15T08:00:00.000Z").toISOString(),
    submitterNotes: "تقرير نهاية الدورة: تحقيق 70% من الخدمات رقمية بالكامل.",
    status: "approved",
    reviewerUserId: "u-001",
    reviewedAt: new Date("2024-12-20T08:00:00.000Z").toISOString(),
    approvedValue: { kind: "numeric", numericValue: 70 },
  },
];

/* ===================================================================
   الأدلة (Evidence)
   =================================================================== */

export const SEED_EVIDENCE: Evidence[] = [
  // لطلب ur-001 (ملاحظة + رابط)
  {
    id: "ev-001",
    updateRequestId: "ur-001",
    type: "note",
    content: "تقرير مرحلي يُظهر تقدّم أتمتة الخدمات بنسبة 50%.",
    uploadedBy: "u-002",
    uploadedAt: JAN20,
  },
  {
    id: "ev-002",
    updateRequestId: "ur-001",
    type: "link",
    content: "https://reports.org.dev/q1-2025/automation-progress",
    uploadedBy: "u-002",
    uploadedAt: JAN20,
  },
  // لطلب ur-002 (ملاحظة + ملف)
  {
    id: "ev-003",
    updateRequestId: "ur-002",
    type: "note",
    content: "تقرير قياس الأداء لشهر يناير — متوسط زمن الاستجابة 3 ثوانٍ.",
    uploadedBy: "u-002",
    uploadedAt: FEB01,
  },
  {
    id: "ev-004",
    updateRequestId: "ur-002",
    type: "file",
    content: "تقرير قياس الأداء - يناير 2025.pdf",
    fileName: "تقرير قياس الأداء - يناير 2025.pdf",
    fileType: "application/pdf",
    fileSize: 245760,
    uploadedBy: "u-002",
    uploadedAt: FEB01,
  },
  // لطلب ur-003 (ملاحظة)
  {
    id: "ev-005",
    updateRequestId: "ur-003",
    type: "note",
    content: "تحديث مرحلي — بانتظار الاعتماد لتسجيل القيمة الجديدة.",
    uploadedBy: "u-002",
    uploadedAt: FEB20,
  },
  // لطلب ur-004 (ملاحظة + رابط للنسخة التجريبية)
  {
    id: "ev-006",
    updateRequestId: "ur-004",
    type: "link",
    content: "https://beta.admission.org.dev",
    uploadedBy: "u-004",
    uploadedAt: JAN25,
  },
  // لطلب ur-005 (ملاحظة + ملف)
  {
    id: "ev-007",
    updateRequestId: "ur-005",
    type: "file",
    content: "تقرير التقارير الشهرية المُنجزة.pdf",
    fileName: "تقرير التقارير الشهرية المُنجزة.pdf",
    fileType: "application/pdf",
    fileSize: 184320,
    uploadedBy: "u-005",
    uploadedAt: FEB10,
  },
];

/* ===================================================================
   التنبيهات (Alerts)
   =================================================================== */

export const SEED_ALERTS: Alert[] = [
  // 1) تنبيه تأخّر تحديث تلقائي لـ KR-002 (اخر تحديث معتمد FEB10 = منذ > 7 أيام من تاريخ اليوم الافتراضي)
  {
    id: "al-001",
    type: "overdue_update",
    source: "system",
    objectiveId: "obj-001",
    keyResultId: "kr-002",
    title: "تأخّر تحديث الإنجاز",
    message:
      "لم يتم تسجيل تحديث معتمد لنتيجة 'خفض متوسط زمن الاستجابة' منذ أكثر من 7 أيام. يرجى تحديث الإنجاز في أقرب وقت.",
    createdAt: FEB20,
    recipientUserIds: ["u-002"], // المالك
    isActive: true,
  },
  // 2) تنبيه أداء متأخر تلقائي (يُستخدم لاحقاً عند تنشيط المراقبة)
  {
    id: "al-002",
    type: "performance_delayed",
    source: "system",
    objectiveId: "obj-002",
    keyResultId: "kr-004",
    title: "تأخّر في الأداء",
    message: "تقدّم الهدف 'تطوير منصة الخدمات الإلكترونية' أقل من المتوقّع بفارق ضمن الحد المسموح.",
    createdAt: FEB20,
    recipientUserIds: ["u-004"], // المالك
    isActive: true,
  },
  // 3) تنبيه يدوي من مدير لموظف
  {
    id: "al-003",
    type: "manual",
    source: "manual",
    objectiveId: "obj-004",
    keyResultId: "kr-006",
    title: "متابعة عاجلة لتسليم التقارير",
    message:
      "أرجو التأكد من تسليم نوعي التقارير المتبقين ضمن الجدول الزمني المحدّد قبل نهاية فبراير.",
    reason: "ضغط في الجدول الزمني ومخاوف من تأخّر التسليم.",
    senderUserId: "u-004", // فهد (قائد الفريق)
    createdAt: FEB10,
    recipientUserIds: ["u-005"], // نورة
    isActive: true,
  },
];

/* ===================================================================
   حالة القراءة (Alert Read States)
   =================================================================== */

export const SEED_ALERT_READ_STATES: AlertReadState[] = [
  // al-001: غير مقروء للمستلم
  {
    id: "ars-001",
    alertId: "al-001",
    userId: "u-002",
    isRead: false,
  },
  // al-002: غير مقروء
  {
    id: "ars-002",
    alertId: "al-002",
    userId: "u-004",
    isRead: false,
  },
  // al-003: مقروء من نورة (في FEB15)
  {
    id: "ars-003",
    alertId: "al-003",
    userId: "u-005",
    isRead: true,
    readAt: new Date("2025-02-12T08:00:00.000Z").toISOString(),
  },
];

/* ===================================================================
   ملاحظات المتابعة (Alert Feedback)
   =================================================================== */

export const SEED_ALERT_FEEDBACK: AlertFeedback[] = [
  // ملاحظة من نورة على al-003
  {
    id: "af-001",
    alertId: "al-003",
    userId: "u-005",
    note: "تم البدء في إعداد تقرير الإحصائية وسأرسله قبل الموعد.",
    createdAt: new Date("2025-02-13T10:00:00.000Z").toISOString(),
  },
];

/** البيانات الكاملة للطور الرابع */
export const SEED_PHASE4_DATA = {
  updateRequests: SEED_UPDATE_REQUESTS,
  evidence: SEED_EVIDENCE,
  alerts: SEED_ALERTS,
  alertReadStates: SEED_ALERT_READ_STATES,
  alertFeedback: SEED_ALERT_FEEDBACK,
};
