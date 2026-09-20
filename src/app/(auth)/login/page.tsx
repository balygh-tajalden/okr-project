import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthLayout
        title="تسجيل الدخول"
        subtitle="أدخل بياناتك للوصول إلى نظام إدارة الأهداف المؤسسية."
      >
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </AuthLayout>
    </RedirectIfAuthenticated>
  );
}
