/**
 * إعدادات الطور الرابع المركزية (Phase 4 Configuration)
 * ===================================================================
 * مرجع موحّد لكل القيم القابلة للضبط لاحقاً في الطور الخامس.
 * لا تُكتب هذه القيم مبعثرة في المكوّنات — تُقرأ من هنا فقط.
 */

/**
 * إعدادات التنفيذ والمراقبة.
 * القيم الافتراضية مأخوذة من المواصفات (Phase 4).
 */
export const PHASE4_CONFIG = {
  /** فترة التحديث المسموحة لـ KR المباشر قبل إصدار تنبيه تأخّر */
  directKrUpdateIntervalDays: 7,

  /** حدّ الفرق بين التقدّم الفعلي والمتوقّع لتمييز "متأخر" عن "متعثر" (نقطة مئوية) */
  delayedStalledThresholdPoints: 25,

  /** فترة التذكير بالتنبيهات غير المقروءة */
  unreadReminderDays: 2,
} as const;

/**
 * الساعة القابلة للحقن — لدعم الاختبارات الزمنية الحتمية.
 * في الإنتاج: new Date()
 * في الاختبار: يمكن استبدالها بقيمة ثابتة.
 *
 * الاستخدام:
 *   import { now } from "@/lib/services/phase4-config";
 *   const currentTime = now();
 */

// متغير داخلي للساعة — يمكن تعديله في الاختبارات
let injectedNow: (() => Date) | null = null;

/** يُرجع الوقت الحالي (مع احترام الساعة المحقونة) */
export function now(): Date {
  return injectedNow ? injectedNow() : new Date();
}

/** يُرجع الطابع الزمني ISO للوقت الحالي */
export function nowIso(): string {
  return now().toISOString();
}

/** حقن ساعة مخصّصة — للاختبارات الحتمية */
export function injectClock(clockFn: (() => Date) | null): void {
  injectedNow = clockFn;
}

/**
 * أدوات حساب الوقت المركزية.
 * كل الحسابات الزمنية تمرّ من هنا لضمان الاتساق.
 */

/** الفرق بالأيام بين تاريخين (قد يكون سالباً) */
export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return (end - start) / (1000 * 60 * 60 * 24);
}

/** الفرق بالأيام منذ تاريخ معيّن حتى الآن */
export function daysSince(iso: string): number {
  return daysBetween(iso, nowIso());
}

/** هل انتهى تاريخ معيّن بالنسبة للوقت الحالي؟ */
export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < now().getTime();
}

/** أضف أياماً إلى تاريخ */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** تنسيق التاريخ بالعربية */
export function formatDateAr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** تنسيق التاريخ والوقت بالعربية */
export function formatDateTimeAr(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** تنسيق قصير للعرض */
export function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
