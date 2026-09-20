"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ShieldCheck,
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
 * WelcomePage — الصفحة الرئيسية
 * ===================================================================
 * - ترحيب باسم المستخدم + دوره الأساسي + وحدته التنظيمية.
 * - مؤشرات إعداد حقيقية من بيانات النظام (وليست أرقاماً ملفقة).
 * - روابط سريعة للأقسام المتاحة حسب صلاحيات المستخدم.
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
                    <StatusBadge variant="success" size="sm">
                      متاح
                    </StatusBadge>
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
