"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge, OkrStatusBadges } from "@/components/common/status-badge";
import { useCurrentUser } from "@/lib/auth/session";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/auth/types";
import {
  Repeat,
  Target,
  GitPullRequestArrow,
  Activity,
  BarChart3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  NAV_SECTIONS,
  type NavItem,
} from "@/lib/nav/navigation";
import { can, hasAnyRole } from "@/lib/auth/permissions";

/**
 * WelcomePage — الصفحة الرئيسية للطور الأول
 * ===================================================================
 * - ترحيب باسم المستخدم + دوره + وحدته التنظيمية.
 * - مقدمة موجزة عن النظام ومنهجية OKR.
 * - روابط سريعة للأقسام الرئيسية (بما فيها القادمة).
 * - مؤشرات إعداد الطور الأول (وليست تحليلات أعمال ملفقة).
 *
 * ملاحظة: لا توجد KPIs ملفقة. الأرقام هنا مؤشرات إعداد فقط.
 */
export default function WelcomePage() {
  const user = useCurrentUser();

  if (!user) return null;

  const firstName = user.fullName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "صباح الخير"
      : hour >= 12 && hour < 18
        ? "مساء الخير"
        : "مساء الخير";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}، ${firstName}`}
        description={`مرحباً بك في نظام إدارة الأهداف المؤسسية. صلاحياتك الحالية: ${ROLE_LABELS[user.role]} — ${user.organizationalUnit}.`}
        badge={
          <StatusBadge variant="success" dot size="md">
            الطور الأول — التأسيس والمصادقة
          </StatusBadge>
        }
      />

      {/* بطاقة الترحيب الرئيسية */}
      <Card className="overflow-hidden border-border bg-gradient-to-l from-primary/5 via-background to-background">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  مرحباً بك في منصة إدارة الأهداف وفق منهجية OKR
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                يتيح لك النظام تحديد أهداف مؤسسية طموحة، ربطها بنتائج رئيسية
                قابلة للقياس، متابعة الإنجاز على مستوى الفرق والإدارات، وتفعيل
                الاعتمادات متعددة المستويات. يدعم النظام دورات تخطيط ربعية
                وسنوية، إرفاق الأدلة، والتنبيهات الذكية لضمان تحقيق الاتساق
                الاستراتيجي.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {ROLE_DESCRIPTIONS[user.role]}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="default" size="sm">
                  <Link href="/app/goals">
                    استعراض الأهداف
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/profile">عرض ملفي الشخصي</Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="rounded-lg border border-border bg-background/80 p-4 space-y-2 min-w-[200px]">
                <p className="text-xs text-muted-foreground">جلسة حالية</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">الاسم:</span>
                    <span className="font-medium text-foreground">{user.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">الدور:</span>
                    <span className="font-medium text-foreground">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">الجهة:</span>
                    <span className="font-medium text-foreground text-xs">
                      {user.organizationalUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">الحالة:</span>
                    <StatusBadge variant="success" dot size="sm">نشط</StatusBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مؤشرات إعداد الطور الأول (وليست تحليلات أعمال ملفقة) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            حالة النظام
          </h3>
          <StatusBadge variant="info" size="sm">
            مؤشرات إعداد — الطور الأول
          </StatusBadge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SetupIndicator
            icon={<ShieldCheck className="size-5" />}
            label="المصادقة والصلاحيات"
            value="مفعّل"
            description="تسجيل دخول، أدوار، صلاحيات دقيقة"
          />
          <SetupIndicator
            icon={<Target className="size-5" />}
            label="هيكل الأهداف"
            value="جاهز"
            description="البنية قائمة، الفعّالية في الطور الثاني"
          />
          <SetupIndicator
            icon={<Repeat className="size-5" />}
            label="دورات OKR"
            value="قريباً"
            description="إدارة الدورات التخطيطية"
          />
          <SetupIndicator
            icon={<BarChart3 className="size-5" />}
            label="لوحة المعلومات"
            value="قريباً"
            description="التحليلات المؤسسية"
          />
        </div>
      </section>

      {/* روابط سريعة للأقسام */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">
          الوصول السريع
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {getQuickLinksForUser(user).map((item) => {
            const Icon = item.icon;
            const isUpcoming = item.status === "upcoming";
            return (
              <Link
                key={item.key}
                href={item.href}
                className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="size-5" />
                  </div>
                  {isUpcoming ? (
                    <OkrStatusBadges.Upcoming size="sm" />
                  ) : (
                    <StatusBadge variant="success" size="sm">
                      متاح
                    </StatusBadge>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {item.label}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* بطاقة ميزات الطور الأول المكتملة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ميزات الطور الأول المتاحة</CardTitle>
          <CardDescription>
            ما يمكنك القيام به الآن في النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            "تسجيل الدخول الآمن مع دعم الأدوار والصلاحيات",
            "التنقّل المؤسسي الكامل عبر شريط جانبي قابل للطي",
            "عرض الملف الشخصي وتفاصيل الحساب",
            "حماية المسارات غير المصرّح بها",
            "تجربة استخدام متجاوبة على الجوال",
            "إدارة النظام لمدير النظام (صلاحية محدودة)",
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** بطاقة مؤشر إعداد */
function SetupIndicator({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  const isReady = value === "مفعّل" || value === "جاهز";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <StatusBadge variant={isReady ? "success" : "info"} size="sm" dot={isReady}>
          {value}
        </StatusBadge>
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

/** اختصارات سريعة مرئية للمستخدم حسب دوره */
function getQuickLinksForUser(user: ReturnType<typeof useCurrentUser>): NavItem[] {
  if (!user) return [];
  const items = NAV_SECTIONS.flatMap((s) => s.items);
  return items.filter((item) => {
    if (item.key === "profile" || item.key === "home") return false;
    if (item.requiredRoles && !hasAnyRole(user, item.requiredRoles)) return false;
    if (item.requiredPermissions) {
      return item.requiredPermissions.some((p) => can(user, p));
    }
    return true;
  });
}
