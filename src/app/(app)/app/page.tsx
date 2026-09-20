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
import { StatusBadge } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import {
  filterObjectivesByScopeAndPermissions,
  getReviewableObjectives,
} from "@/lib/services/phase3-services";
import { getUserPrimaryUnitName, getUserRoles } from "@/lib/services/institutional";
import {
  Repeat,
  Target as TargetIcon,
  GitPullRequestArrow as GitPullRequestArrowIcon,
  Activity,
  BarChart3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users as UsersIcon,
  Network,
  KeyRound,
  Inbox as InboxIcon,
} from "lucide-react";
import {
  NAV_SECTIONS,
  type NavItem,
} from "@/lib/nav/navigation";
import { can as canSvc, canAny as canAnySvc } from "@/lib/services/institutional";

/**
 * WelcomePage — الصفحة الرئيسية (الطور الثاني)
 * ===================================================================
 * - ترحيب باسم المستخدم + دوره الأساسي + وحدته التنظيمية.
 * - مؤشرات إعداد حقيقية من بيانات Phase 2 (وليست KPIs ملفقة).
 * - روابط سريعة للأقسام الفعّالة والقادمة.
 */
export default function WelcomePage() {
  const { user, roles } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const objectives = usePhase3Store((s) => s.objectives);
  const assignments = usePhase3Store((s) => s.assignments);

  if (!user) return null;

  const firstName = user.fullName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12 ? "صباح الخير" : "مساء الخير";

  const primaryUnitName = getUserPrimaryUnitName(user, orgUnits);
  const userRoles = getUserRoles(user, roles);
  const primaryRoleName = userRoles[0]?.name ?? "—";
  const primaryRoleDesc = userRoles[0]?.description ?? "";

  // مؤشرات حقيقية من بيانات Phase 2 و 3
  const scopedObjectives = filterObjectivesByScopeAndPermissions(
    user,
    roles,
    objectives,
    orgUnits,
    assignments,
    users
  );
  const reviewable = getReviewableObjectives(user, roles, objectives, orgUnits);
  const myAssignments = assignments.filter((a) => a.assigneeUserId === user.id);
  const pendingAssignments = myAssignments.filter((a) => a.response === "pending").length;

  const stats = {
    users: users.length,
    orgUnits: orgUnits.length,
    roles: roles.length,
    cycles: cycles.length,
    activeCycles: cycles.filter((c) => c.status === "active").length,
    objectives: scopedObjectives.length,
    pendingReviews: reviewable.length,
    pendingAssignments,
  };

  // الروابط السريعة: عرض الوحدات الفعّالة المسموح بها
  const quickLinks = NAV_SECTIONS.flatMap((s) => s.items).filter((item) => {
    if (item.key === "home" || item.key === "profile") return false;
    if (item.requiredPermissions) {
      return item.requiredPermissions.every((p) => canSvc(user, roles, p));
    }
    if (item.requiredAnyPermission) {
      return canAnySvc(user, roles, item.requiredAnyPermission);
    }
    return false;
  });

  return (
    <div className="space-y-7">
      <Breadcrumbs
        items={[{ label: "الرئيسية" }]}
      />

      <PageHeader
        title={`${greeting}، ${firstName}`}
        description={`مرحباً بك في نظام إدارة الأهداف المؤسسية. جهتك الحالية: ${primaryUnitName} • دورك الأساسي: ${primaryRoleName}.`}
        badge={
          userRoles.length > 1 ? (
            <StatusBadge variant="info" size="sm">
              {userRoles.length} أدوار مسندة
            </StatusBadge>
          ) : undefined
        }
      />

      {/* بطاقة الترحيب */}
      <Card className="overflow-hidden border-border bg-gradient-to-l from-primary/5 via-background to-background">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  منصة إدارة الأهداف وفق منهجية OKR
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                يتيح لك النظام تحديد أهداف مؤسسية طموحة، ربطها بنتائج رئيسية
                قابلة للقياس، متابعة الإنجاز، وتفعيل الاعتمادات متعددة المستويات
                — مع دعم كامل للغة العربية واتجاه RTL.
              </p>
              {primaryRoleDesc && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {primaryRoleDesc}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="default" size="sm">
                  <Link href="/app/cycles">
                    عرض دورات OKR
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/profile">عرض ملفي الشخصي</Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm min-w-[220px]">
              <div className="rounded-lg border border-border bg-background/80 p-4 space-y-2">
                <p className="text-xs text-muted-foreground">جلسة حالية</p>
                <div className="space-y-1.5">
                  <Row label="الاسم:" value={user.fullName} />
                  <Row label="الدور:" value={primaryRoleName} />
                  <Row label="الجهة:" value={primaryUnitName} small />
                  <Row
                    label="الحالة:"
                    value={
                      <StatusBadge variant="success" dot size="sm">
                        فعّال
                      </StatusBadge>
                    }
                  />
                  {userRoles.length > 1 && (
                    <Row
                      label="أدوار إضافية:"
                      value={`+${userRoles.length - 1} دور`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مؤشرات النظام الحقيقية */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            حالة المؤسسة
          </h3>
          <StatusBadge variant="info" size="sm">
            مؤشرات فعلية من بيانات النظام
          </StatusBadge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<UsersIcon className="size-5" />}
            label="إجمالي المستخدمين"
            value={stats.users}
            href="/app/users"
            canAccess={canSvc(user, roles, "users.view")}
          />
          <StatCard
            icon={<Network className="size-5" />}
            label="الجهات التنظيمية"
            value={stats.orgUnits}
            href="/app/organization"
            canAccess={canSvc(user, roles, "organization.view")}
          />
          <StatCard
            icon={<KeyRound className="size-5" />}
            label="الأدوار المُعرّفة"
            value={stats.roles}
            href="/app/roles"
            canAccess={canSvc(user, roles, "roles.view")}
          />
          <StatCard
            icon={<Repeat className="size-5" />}
            label="الدورات النشطة"
            value={stats.activeCycles}
            subValue={`/ ${stats.cycles} إجمالاً`}
            href="/app/cycles"
            canAccess={canSvc(user, roles, "cycles.view")}
          />
        </div>

        {/* صفا Phase 3 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<TargetIcon className="size-5" />}
            label="الأهداف ضمن نطاقي"
            value={stats.objectives}
            href="/app/objectives"
            canAccess={canSvc(user, roles, "goals.view")}
          />
          <StatCard
            icon={<GitPullRequestArrowIcon className="size-5" />}
            label="بانتظار المراجعة"
            value={stats.pendingReviews}
            href="/app/reviews"
            canAccess={canSvc(user, roles, "goals.review") || canSvc(user, roles, "goals.approve")}
          />
          {canSvc(user, roles, "individual_goals.view") && (
            <StatCard
              icon={<InboxIcon className="size-5" />}
              label="بانتظار ردي على الأهداف"
              value={stats.pendingAssignments}
              href="/app/my-objectives"
              canAccess={canSvc(user, roles, "individual_goals.view")}
            />
          )}
        </div>
      </section>

      {/* الوصول السريع */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">الوصول السريع</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                لا توجد أقسام متاحة لك حالياً. تواصل مع مدير النظام لمراجعة صلاحياتك.
              </CardContent>
            </Card>
          ) : (
            quickLinks.map((item) => {
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
                      <StatusBadge variant="outline" size="sm">
                        قريباً
                      </StatusBadge>
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
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* ميزات الطور الثاني المتاحة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إمكانيات الطور الثاني المتاحة</CardTitle>
          <CardDescription>
            ما يمكنك القيام به الآن في النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            "إدارة المستخدمين وأدوارهم وارتباطهم التنظيمي",
            "إدارة الأدوار والصلاحيات الدقيقة مع تعدد الأدوار",
            "إدارة الهيكل التنظيمي الهرمي (N مستويات)",
            "إدارة دورات OKR مع آلة حالة صارمة",
            "حماية المسارات بناءً على الصلاحيات والنطاق التنظيمي",
            "السجل التنظيمي التاريخي للمستخدمين",
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

function Row({
  label,
  value,
  small,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={`font-medium text-foreground ${small ? "text-xs" : "text-sm"}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  href,
  canAccess,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  href: string;
  canAccess: boolean;
}) {
  const content = (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${
        canAccess ? "hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer" : "opacity-70"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        {canAccess ? (
          <StatusBadge variant="success" size="sm" dot>
            متاح
          </StatusBadge>
        ) : (
          <StatusBadge variant="neutral" size="sm">
            مقيد
          </StatusBadge>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-muted-foreground">{subValue}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return canAccess ? <Link href={href}>{content}</Link> : content;
}
