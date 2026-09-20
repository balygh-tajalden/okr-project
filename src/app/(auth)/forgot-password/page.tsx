import { AuthLayout } from "@/components/auth/auth-layout";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "استعادة كلمة المرور",
};

export default function ForgotPasswordPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthLayout
        title="استعادة كلمة المرور"
        subtitle="أدخل بريدك الإلكتروني أو اسم المستخدم المرتبط بحسابك للمتابعة في الاستعادة."
      >
        <ForgotPasswordForm />
      </AuthLayout>
    </RedirectIfAuthenticated>
  );
}
