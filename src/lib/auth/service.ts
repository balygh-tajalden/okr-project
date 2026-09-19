import { findDemoUser, DEMO_PASSWORD } from "@/lib/demo/users";
import type { User, AccountStatus } from "./types";

/**
 * خدمة المصادقة (Auth Service) — طبقة المنطق
 * ===================================================================
 * كل منطق المصادقة في مكان واحد موحّد.
 * تستدعيها واجهات الدخول / استعادة كلمة المرور / إعادة التعيين فقط.
 *
 * ملاحظة: هذا تطوير نموذجي (prototype) — يحاكي الاستجابات دون خادم.
 * عند الربط لاحقاً: استبدل هذه الدوال بنداءات fetch إلى نقاط نهاية API
 * دون الحاجة لإعادة تصميم واجهات الاستدعاء.
 */

export type LoginFailureReason =
  | "invalid_credentials"
  | "account_disabled"
  | "account_pending_password";

export interface LoginResult {
  success: boolean;
  user?: User;
  failureReason?: LoginFailureReason;
}

/** محاكاة زمن استجابة الخادم لتجربة واجهة واقعية */
const SIMULATED_LATENCY_MS = 650;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * التحقق من بيانات الدخول.
 * - يبحث في المستخدمين التجريبيين باسم المستخدم أو البريد الإلكتروني.
 * - يفصل بوضوح بين: بيانات خاطئة، حساب موقوف، حساب ينتظر كلمة المرور.
 */
export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<LoginResult> {
  await delay(SIMULATED_LATENCY_MS);

  const trimmed = identifier.trim();
  if (!trimmed || !password) {
    return { success: false, failureReason: "invalid_credentials" };
  }

  const user = findDemoUser(trimmed);
  if (!user || password !== DEMO_PASSWORD) {
    return { success: false, failureReason: "invalid_credentials" };
  }

  if (user.status === "disabled") {
    return { success: false, failureReason: "account_disabled" };
  }

  if (user.status === "pending_password") {
    return { success: false, failureReason: "account_pending_password" };
  }

  return { success: true, user };
}

/**
 * طلب استعادة كلمة المرور.
 * - لا يكشف ما إذا كان البريد موجوداً (أفضل ممارسة أمنية).
 * - ينجح دائماً من منظور الواجهة.
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
}> {
  await delay(SIMULATED_LATENCY_MS);
  // لا نتحقق من وجود البريد — نُرجع نجاحاً عاماً لتجنّب تسريب المعلومات.
  const trimmed = email.trim();
  return { success: trimmed.length > 0 && trimmed.includes("@") };
}

/**
 * إعادة تعيين / تعيين كلمة المرور.
 * - يدعم الحالتين: إعادة التعيين، وتعيين كلمة المرور لأول مرة.
 */
export async function resetPassword(
  _token: string | null,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  await delay(SIMULATED_LATENCY_MS);

  if (newPassword.length < 8) {
    return { success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "كلمتا المرور غير متطابقتين." };
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
    return {
      success: false,
      error: "كلمة المرور يجب أن تحتوي على أحرف لاتينية كبيرة وصغيرة.",
    };
  }
  if (!/\d/.test(newPassword)) {
    return {
      success: false,
      error: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.",
    };
  }
  return { success: true };
}

/** ترجمة أسباب فشل الدخول إلى رسائل عربية واضحة */
export function getLoginFailureMessage(reason: LoginFailureReason): string {
  switch (reason) {
    case "invalid_credentials":
      return "اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المراجعة وإعادة المحاولة.";
    case "account_disabled":
      return "تم إيقاف هذا الحساب. يرجى التواصل مع مدير النظام لإعادة التفعيل.";
    case "account_pending_password":
      return "يتطلب هذا الحساب تعيين كلمة مرور جديدة قبل الدخول.";
  }
}

/** تسميات حالة الحساب — مستوردة لإعادة الاستخدام في واجهات مختلفة */
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "نشط",
  disabled: "موقوف",
  pending_password: "بانتظار تعيين كلمة المرور",
};
