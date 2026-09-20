import type { User as InstitutionalUser } from "@/lib/data/types";
import type { User as AuthUser, Role } from "./types";
import { useInstitutionalStore } from "@/lib/data/store";
import { useCredentialsStore } from "./credentials-store";
import { useAuthSession } from "./session";

/**
 * خدمة المصادقة (Auth Service) — طبقة المنطق
 * ===================================================================
 * كل منطق المصادقة في مكان واحد موحّد.
 * تستدعيها واجهات الدخول / استعادة كلمة المرور / إعادة التعيين فقط.
 *
 * ملاحظة معمارية (نموذج أولي):
 * - التحقق يتم على بيانات المستخدمين في المخزن المؤسسي المحلي
 *   وكلمات المرور في مخزن بيانات الاعتماد — دون خادم.
 * - عند الربط بخادم حقيقي: استبدل هذه الدوال بنداءات fetch إلى نقاط
 *   نهاية API دون الحاجة لإعادة تصميم واجهات الاستدعاء.
 */

export type LoginFailureReason =
  | "invalid_credentials"
  | "account_disabled"
  | "account_pending_password";

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  failureReason?: LoginFailureReason;
}

/** محاكاة زمن استجابة الخادم لتجربة واجهة واقعية */
const SIMULATED_LATENCY_MS = 650;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** خريطة أدوار النظام النظامية ← تصنيف المصادقة العام */
const SYSTEM_ROLE_ID_MAP: Record<string, Role> = {
  "r-sys-admin": "system_admin",
  "r-executive": "executive",
  "r-dept-manager": "department_manager",
  "r-team-lead": "team_lead",
  "r-employee": "employee",
};

/** يشتق تصنيف الدور العام من أول دور مسند للمستخدم */
function deriveAuthRole(user: InstitutionalUser): Role {
  const { roles } = useInstitutionalStore.getState();
  for (const roleId of user.roleIds) {
    const mapped = SYSTEM_ROLE_ID_MAP[roleId];
    if (mapped) return mapped;
  }
  // أدوار مخصصة: اشتق التصنيف من اسم الدور
  for (const roleId of user.roleIds) {
    const name = roles.find((r) => r.id === roleId)?.name ?? "";
    if (name.includes("مدير النظام")) return "system_admin";
    if (name.includes("تنفيذي") || name.includes("عليا")) return "executive";
    if (name.includes("قائد")) return "team_lead";
    if (name.includes("مدير")) return "department_manager";
  }
  return "employee";
}

/** يحوّل مستخدم المخزن المؤسسي إلى نموذج جلسة المصادقة */
function toAuthUser(user: InstitutionalUser): AuthUser {
  const { orgUnits } = useInstitutionalStore.getState();
  const unitName = user.primaryOrgUnitId
    ? orgUnits.find((u) => u.id === user.primaryOrgUnitId)?.name
    : undefined;
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    initials: user.initials || user.fullName.trim().slice(0, 2),
    role: deriveAuthRole(user),
    organizationalUnit: unitName ?? "—",
    jobTitle: user.jobTitle,
    status: user.status,
    employeeId: user.employeeId,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * التحقق من بيانات الدخول.
 * - يبحث في مستخدمي المخزن المؤسسي باسم المستخدم أو البريد الإلكتروني.
 * - يتحقق من كلمة المرور عبر مخزن بيانات الاعتماد.
 * - يفصل بوضوح بين: بيانات خاطئة، حساب موقوف، حساب ينتظر كلمة المرور.
 */
export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<LoginResult> {
  await delay(SIMULATED_LATENCY_MS);

  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed || !password) {
    return { success: false, failureReason: "invalid_credentials" };
  }

  const { users } = useInstitutionalStore.getState();
  const institutionalUser = users.find(
    (u) =>
      u.username.toLowerCase() === trimmed ||
      u.email.toLowerCase() === trimmed
  );
  if (!institutionalUser) {
    return { success: false, failureReason: "invalid_credentials" };
  }

  const passwordOk = useCredentialsStore
    .getState()
    .verify(institutionalUser.id, password);
  if (!passwordOk) {
    return { success: false, failureReason: "invalid_credentials" };
  }

  if (institutionalUser.status === "disabled") {
    return { success: false, failureReason: "account_disabled" };
  }

  return { success: true, user: toAuthUser(institutionalUser) };
}

/**
 * طلب استعادة كلمة المرور (نموذج أولي — دون بريد فعلي).
 * - يتحقق من وجود الحساب داخلياً لتوجيه الخطوة التالية،
 *   ولا يكشف نتيجة التحقق للواجهة (أفضل ممارسة أمنية).
 * - إعادة التعيين الفعلية تتم عبر resetPassword بعد وصول المستخدم
 *   لصفحة التعيين.
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
}> {
  await delay(SIMULATED_LATENCY_MS);
  const trimmed = email.trim();
  return { success: trimmed.length > 0 && trimmed.includes("@") };
}

/**
 * إعادة تعيين / تعيين كلمة المرور — يحفظ كلمة المرور فعلياً.
 *
 * الحالتان المدعومتان:
 * - identifier محدد (اسم مستخدم أو بريد): مسار "نسيت كلمة المرور".
 * - identifier = null: تغيير كلمة مرور المستخدم الحالي (جلسة نشطة).
 */
export async function resetPassword(
  identifier: string | null,
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

  // تحديد المستخدم المستهدف
  let target: InstitutionalUser | undefined;
  if (identifier) {
    const trimmed = identifier.trim().toLowerCase();
    const { users } = useInstitutionalStore.getState();
    target = users.find(
      (u) =>
        u.username.toLowerCase() === trimmed ||
        u.email.toLowerCase() === trimmed
    );
    if (!target) {
      return { success: false, error: "لا يوجد حساب بهذا الاسم أو البريد." };
    }
  } else {
    const session = useAuthSession.getState().session;
    if (!session) {
      return { success: false, error: "انتهت الجلسة. يرجى تسجيل الدخول من جديد." };
    }
    const { users } = useInstitutionalStore.getState();
    target = users.find((u) => u.id === session.user.id);
  }

  if (!target) {
    return { success: false, error: "تعذّر العثور على الحساب المطلوب." };
  }

  useCredentialsStore.getState().setPassword(target.id, newPassword);
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
export const ACCOUNT_STATUS_LABELS = {
  active: "نشط",
  disabled: "موقوف",
  pending_password: "بانتظار تعيين كلمة المرور",
} as const;
