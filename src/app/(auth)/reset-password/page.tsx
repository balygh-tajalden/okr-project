import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "تعيين كلمة المرور",
};

/**
 * صفحة تعيين / تغيير كلمة المرور.
 * النموذج يكتشف الحالة تلقائياً:
 * - جلسة نشطة → تغيير كلمة مرور المستخدم الحالي.
 * - بلا جلسة → تعيين كلمة مرور بعد تحديد الحساب.
 * لذلك لا نلفّ الصفحة بـ RedirectIfAuthenticated.
 */
export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="تعيين كلمة مرور جديدة"
      subtitle="أدخل كلمة المرور الجديدة وتأكيدها لإتمام العملية."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
