/**
 * بيانات الطور الثالث الأولية (Phase 3 Seed Data)
 * ===================================================================
 * بيانات تجريبية واقعية بالعربية تحاكي سلسلة OKR كاملة:
 * - هدف مؤسسي معتمد (مع KR عددي)
 * - هدف تنظيمي قيد المراجعة (مع KR إنجاز/عدم إنجاز)
 * - هدف داعم مسودة (مربوط بـ KR أعلى)
 * - هدف فردي معتمد مسند لموظف (بانتظار الرد)
 * - هدف فردي مرفوض (مع سبب)
 * - هدف مغلق (تاريخي)
 *
 * كل الارتباطات حقيقية مع Phase 2 (users, orgUnits, cycles).
 */

import type {
  Objective,
  KeyResult,
  ObjectiveReviewEvent,
  ObjectiveAssignment,
} from "./phase3-types";

const PAST = new Date("2024-12-01T08:00:00.000Z").toISOString();
const RECENT = new Date("2025-01-10T08:00:00.000Z").toISOString();
const RECENT2 = new Date("2025-01-20T08:00:00.000Z").toISOString();

/* =================================================================
   الأهداف (Objectives)
   ================================================================= */

export const SEED_OBJECTIVES: Objective[] = [
  // 1) هدف مؤسسي معتمد من الإدارة العليا — يدعمه KR عددي تصاعدي
  {
    id: "obj-001",
    title: "رفع كفاءة الخدمات الرقمية للمؤسسة",
    description:
      "تحسين تجربة المستخدم للخدمات الإلكترونية ورفع نسبة الأتمتة في العمليات الأساسية للجهة خلال دورة 2025.",
    type: "institutional",
    ownerId: "u-002", // د. خالد الشمري (الإدارة العليا)
    orgUnitId: "ou-exec-office", // مكتب الإدارة العليا
    cycleId: "c-2025-q1", // دورة نشطة
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    status: "approved",
    createdAt: PAST,
    updatedAt: RECENT,
    contributorUserIds: ["u-001", "u-003"], // عبدالله + سارة
    upstreamKeyResultId: undefined,
  },

  // 2) هدف تنظيمي قيد المراجعة — في إدارة تطوير الأنظمة (تحت قطاع تقنية المعلومات)
  {
    id: "obj-002",
    title: "تطوير منصة الخدمات الإلكترونية لإدارة القبول",
    description:
      "إطلاق النسخة الجديدة من منصة القبول الإلكتروني مع رفع نسبة الخدمات المؤتمتة إلى 80%.",
    type: "organizational",
    ownerId: "u-004", // فهد العتيبي (قائد فريق الويب)
    orgUnitId: "ou-team-web", // فريق تطبيقات الويب (تحت إدارة تطوير الأنظمة)
    cycleId: "c-2025-q1",
    startDate: "2025-01-15",
    endDate: "2025-03-15",
    status: "under_review",
    createdAt: RECENT,
    updatedAt: RECENT2,
    contributorUserIds: ["u-005", "u-008"], // نورة + حسن
    upstreamKeyResultId: "kr-001", // يدعم KR الهدف المؤسسي
  },

  // 3) هدف داعم مسودة — مرتبط بـ KR أعلى من قطاع أعلى
  {
    id: "obj-003",
    title: "تحسين أداء واجهة برمجة التطبيقات للخدمات الرقمية",
    description:
      "هدف داعم لرفع نسبة الخدمات المؤتمتة عبر تحسين زمن استجابة APIs المنصة.",
    type: "organizational",
    ownerId: "u-004",
    orgUnitId: "ou-team-web",
    cycleId: "c-2025-q1",
    startDate: "2025-02-01",
    endDate: "2025-03-20",
    status: "draft",
    createdAt: RECENT2,
    updatedAt: RECENT2,
    contributorUserIds: [],
    upstreamKeyResultId: "kr-001", // يدعم KR الهدف المؤسسي
  },

  // 4) هدف فردي معتمد مسند لموظف — بانتظار الرد
  {
    id: "obj-004",
    title: "إنجاز وحدة إعداد التقارير الشهرية",
    description:
      "هدف فردي مسند لموظف لتطوير وحدة التقارير الشهرية ضمن منصة القبول الإلكتروني.",
    type: "individual",
    ownerId: "u-004", // فهد (قائد الفريق)
    orgUnitId: "ou-team-web",
    cycleId: "c-2025-q1",
    startDate: "2025-01-20",
    endDate: "2025-03-01",
    status: "approved",
    createdAt: RECENT,
    updatedAt: RECENT2,
    contributorUserIds: [],
  },

  // 5) هدف فردي مرفوض (من الموظف) — مع سبب
  {
    id: "obj-005",
    title: "إعادة هيكلة نظام التنبيهات",
    description:
      "هدف فردي مرفوض من الموظف بسبب ضغط المهام الحالية.",
    type: "individual",
    ownerId: "u-004",
    orgUnitId: "ou-team-web",
    cycleId: "c-2025-q1",
    startDate: "2025-02-01",
    endDate: "2025-03-15",
    status: "approved", // الهدف نفسه معتمد، الإسناد مرفوض (منفصل)
    createdAt: RECENT,
    updatedAt: RECENT2,
    contributorUserIds: [],
  },

  // 6) هدف مؤسسي مغلق (دورة 2024 السنوية المكتملة)
  {
    id: "obj-006",
    title: "تحقيق التحول الرقمي للجهة لعام 2024",
    description:
      "هدف مؤسسي مغلق بعد إكمال دورة 2024 السنوية — مرجع تاريخي.",
    type: "institutional",
    ownerId: "u-002",
    orgUnitId: "ou-exec-office",
    cycleId: "c-2024-annual",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "closed",
    createdAt: "2023-11-01T08:00:00.000Z",
    updatedAt: "2025-01-05T08:00:00.000Z",
    contributorUserIds: ["u-001", "u-003", "u-004"],
  },
];

/* =================================================================
   النتائج الرئيسية (Key Results)
   ================================================================= */

export const SEED_KEY_RESULTS: KeyResult[] = [
  // KR للهدف المؤسسي obj-001: عددي تصاعدي
  {
    id: "kr-001",
    objectiveId: "obj-001",
    title: "رفع نسبة الخدمات المؤتمتة إلى 80%",
    description: "نسبة الخدمات الإلكترونية المؤتمتة بالكامل من إجمالي الخدمات.",
    progressSource: "direct",
    directType: "numeric",
    unit: "%",
    baseline: 20,
    target: 80,
    direction: "ascending",
    createdAt: PAST,
    updatedAt: PAST,
  },
  // KR ثاني للهدف المؤسسي: عددي تنازلي (خفض زمن الاستجابة)
  {
    id: "kr-002",
    objectiveId: "obj-001",
    title: "خفض متوسط زمن الاستجابة إلى أقل من ثانيتين",
    description: "متوسط زمن استجابة واجهات برمجة التطبيقات.",
    progressSource: "direct",
    directType: "numeric",
    unit: "ثانية",
    baseline: 5,
    target: 2,
    direction: "descending",
    createdAt: PAST,
    updatedAt: PAST,
  },
  // KR للهدف التنظيمي obj-002: إنجاز/عدم إنجاز
  {
    id: "kr-003",
    objectiveId: "obj-002",
    title: "إطلاق النسخة التجريبية من منصة القبول",
    description: "إطلاق النسخة التجريبية من منصة القبول الإلكتروني للمستخدمين.",
    progressSource: "direct",
    directType: "binary",
    createdAt: RECENT,
    updatedAt: RECENT,
  },
  // KR للهدف obj-002: مصدره أهداف داعمة (لا يدخل قيم يدوية)
  {
    id: "kr-004",
    objectiveId: "obj-002",
    title: "تحقيق نسبة اعتماد 90% من المستخدمين للمنصة",
    description: "يتم احتساب التقدم من الأهداف الداعمة المرتبطة بهذه النتيجة.",
    progressSource: "supporting",
    createdAt: RECENT,
    updatedAt: RECENT,
  },
  // KR للهدف الداعم obj-003: عددي تنازلي
  {
    id: "kr-005",
    objectiveId: "obj-003",
    title: "خفض زمن استجابة APIs إلى 800 ميلي ثانية",
    description: "متوسط زمن استجابة واجهات APIs الحاسمة.",
    progressSource: "direct",
    directType: "numeric",
    unit: "ms",
    baseline: 1500,
    target: 800,
    direction: "descending",
    createdAt: RECENT2,
    updatedAt: RECENT2,
  },
  // KR للهدف الفردي obj-004
  {
    id: "kr-006",
    objectiveId: "obj-004",
    title: "تسليم وحدة التقارير الشهرية مع 5 أنواع تقارير",
    description: "تطوير وتسليم وحدة التقارير الشهرية بخمسة أنواع على الأقل.",
    progressSource: "direct",
    directType: "numeric",
    unit: "نوع",
    baseline: 0,
    target: 5,
    direction: "ascending",
    createdAt: RECENT,
    updatedAt: RECENT,
  },
  // KR للهدف المغلق obj-006
  {
    id: "kr-007",
    objectiveId: "obj-006",
    title: "تحقيق 70% من الخدمات رقمية بالكامل",
    description: "نسبة الخدمات الرقمية المنجزة (هدف 2024 مغلق).",
    progressSource: "direct",
    directType: "numeric",
    unit: "%",
    baseline: 10,
    target: 70,
    direction: "ascending",
    createdAt: "2023-11-01T08:00:00.000Z",
    updatedAt: "2024-12-15T08:00:00.000Z",
  },
];

/* =================================================================
   سجل المراجعات (Review Events)
   ================================================================= */

export const SEED_REVIEW_EVENTS: ObjectiveReviewEvent[] = [
  // obj-001: إنشاء + إرسال + اعتماد
  {
    id: "rev-001",
    objectiveId: "obj-001",
    eventType: "submitted",
    actorUserId: "u-002",
    at: PAST,
  },
  {
    id: "rev-002",
    objectiveId: "obj-001",
    eventType: "approved",
    actorUserId: "u-001", // مدير النظام (له صلاحية الإدارة العليا في النموذج التجريبي)
    at: RECENT,
  },
  // obj-002: إرسال فقط (تحت المراجعة)
  {
    id: "rev-003",
    objectiveId: "obj-002",
    eventType: "submitted",
    actorUserId: "u-004",
    at: RECENT2,
  },
  // obj-004: إنشاء + إرسال + اعتماد + إسناد
  {
    id: "rev-004",
    objectiveId: "obj-004",
    eventType: "submitted",
    actorUserId: "u-004",
    at: RECENT,
  },
  {
    id: "rev-005",
    objectiveId: "obj-004",
    eventType: "approved",
    actorUserId: "u-002", // أعلى مستوى
    at: RECENT2,
  },
  {
    id: "rev-006",
    objectiveId: "obj-004",
    eventType: "assigned",
    actorUserId: "u-004", // المدير المُسند
    targetUserId: "u-005", // نورة (الموظف)
    at: RECENT2,
  },
  // obj-005: إسناد + رفض من الموظف
  {
    id: "rev-007",
    objectiveId: "obj-005",
    eventType: "submitted",
    actorUserId: "u-004",
    at: RECENT,
  },
  {
    id: "rev-008",
    objectiveId: "obj-005",
    eventType: "approved",
    actorUserId: "u-002",
    at: RECENT2,
  },
  {
    id: "rev-009",
    objectiveId: "obj-005",
    eventType: "assigned",
    actorUserId: "u-004",
    targetUserId: "u-008", // حسن
    at: RECENT2,
  },
  {
    id: "rev-010",
    objectiveId: "obj-005",
    eventType: "rejected",
    actorUserId: "u-008",
    at: RECENT2,
    reason: "لدي التزامات أخرى ضمن نفس الفترة لا تسمح باستيعاب هذا الهدف.",
  },
];

/* =================================================================
   إسنادات الأهداف الفردية (Assignments)
   ================================================================= */

export const SEED_ASSIGNMENTS: ObjectiveAssignment[] = [
  // obj-004: بانتظار الرد من نورة (u-005)
  {
    id: "asg-001",
    objectiveId: "obj-004",
    assignerUserId: "u-004", // فهد (قائد الفريق)
    assigneeUserId: "u-005", // نورة (موظف)
    response: "pending",
    assignedAt: RECENT2,
  },
  // obj-005: مرفوض من حسن (u-008)
  {
    id: "asg-002",
    objectiveId: "obj-005",
    assignerUserId: "u-004",
    assigneeUserId: "u-008",
    response: "rejected",
    assignedAt: RECENT2,
    respondedAt: RECENT2,
    rejectReason: "لدي التزامات أخرى ضمن نفس الفترة لا تسمح باستيعاب هذا الهدف.",
  },
];

/** البيانات الكاملة للطور الثالث */
export const SEED_PHASE3_DATA = {
  objectives: SEED_OBJECTIVES,
  keyResults: SEED_KEY_RESULTS,
  reviewEvents: SEED_REVIEW_EVENTS,
  assignments: SEED_ASSIGNMENTS,
};
