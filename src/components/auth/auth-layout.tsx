"use client";

import Link from "next/link";

/**
 * AuthLayout
 * ===================================================================
 * تخطيط صفحات المصادقة العامة (تسجيل الدخول، استعادة كلمة المرور...).
 *
 * تصميم احترافي مؤسسي بتقسيم شاشة:
 * - يمين (RTL): النموذج
 * - يسار: لوحة تعريف بالمنظومة وقيمتها (تُخفى على الجوال)
 *
 * اللوحة اليمنى تحافظ على تركيز المستخدم على الإجراء المطلوب.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* اللوحة اليمنى: النموذج */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* الشعار للجوال */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <BrandMark />
          </div>

          <div className="space-y-2 text-center sm:text-right">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </div>

      {/* اللوحة اليسرى: تعريف بالمنظومة */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground">
        <div
          className="absolute inset-0 opacity-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0%, transparent 40%)",
          }}
        />

        <div className="relative z-10">
          <BrandMark onDark />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            نظام ادارة الاهداف المؤسسية OKR
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/85">
            منصة موحّدة لتخطيط الأهداف، متابعة الإنجاز، الاعتماد متعدد المستويات،
            وتقارير الأداء المؤسسي — مع دعم كامل للغة العربية والاتجاه من اليمين
            إلى اليسار.
          </p>

          <ul className="space-y-3 text-sm text-primary-foreground/85">
            {[
              "دورات تخطيط ربعية وسنوية",
              "اعتمادات متعددة المستويات الإدارية",
              "تحديثات إنجاز دورية مع الأدلة",
              "تنبيهات ذكية وتقارير تحليلية",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span
                  className="size-1.5 shrink-0 rounded-full bg-primary-foreground/80"
                  aria-hidden="true"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </div>
      </aside>
    </div>
  );
}

function BrandMark({ onDark }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5"
      aria-label="نظام إدارة الأهداف المؤسسية"
    >
      <span
        className={`flex size-10 items-center justify-center rounded-lg shadow-sm ${
          onDark ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        >
          <circle cx="32" cy="32" r="18" />
          <circle cx="32" cy="32" r="9" />
          <circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span
        className={`flex flex-col leading-tight ${
          onDark ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        <span className="text-sm font-bold">نظام الأهداف المؤسسية</span>
        <span
          className={`text-[11px] ${
            onDark ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          منهجية OKR
        </span>
      </span>
    </Link>
  );
}
