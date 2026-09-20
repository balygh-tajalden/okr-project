import { AuthLayout } from "@/components/auth/auth-layout";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "تعيين كلمة المرور",
};

export default function ResetPasswordPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthLayout
        title="تعيين كلمة مرور جديدة"
        subtitle="أدخل كلمة المرور الجديدة وتأكيدها لإتمام العملية."
      >
        <ResetPasswordForm mode="reset" />
      </AuthLayout>
    </RedirectIfAuthenticated>
  );
}
