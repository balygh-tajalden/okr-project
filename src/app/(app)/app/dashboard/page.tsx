"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
} from "@/components/common/phase3-badges";
import { PerformanceStatusBadge } from "@/components/common/performance-badge";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import { calculateDashboardMetrics } from "@/lib/services/dashboard-service";
import {
  filterObjectivesByScopeAndPermissions,
} from "@/lib/services/phase3-services";
import { getAccessibleOrgUnitIds } from "@/lib/services/institutional";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Target as TargetIcon,
  Users,
  Gauge,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  PERFORMANCE_STATUS_LABELS,
  type PerformanceStatus,
} from "@/lib/data/phase4-types";
import { formatProgress } from "@/lib/services/phase4-calculations";

const PERFORMANCE_COLORS: Record<PerformanceStatus, string> = {
  advanced: "hsl(155, 55%, 45%)",
  on_track: "hsl(230, 55%, 55%)",
  delayed: "hsl(70, 72%, 45%)",
  stalled: "hsl(27, 55%, 50%)",
};

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermissions={["dashboard.view"]}>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user: currentUser, roles } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const allObjectives = usePhase3Store((s) => s.objectives);
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const allReviewEvents = usePhase3Store((s) => s.reviewEvents);
  const assignments = usePhase3Store((s) => s.assignments);
  const updateRequests = usePhase4Store((s) => s.updateRequests);

  const [cycleFilter, setCycleFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");

  // الأهداف ضمن نطاق المستخدم
  const scopedObjectives = useMemo(() => {
    if (!currentUser) return [];
    return filterObjectivesByScopeAndPermissions(
      currentUser,
      roles,
      allObjectives,
      orgUnits,
      assignments,
      users
    );
  }, [currentUser, roles, allObjectives, orgUnits, assignments, users]);

  // الجهات المتاحة للفلترة (ضمن نطاق المستخدم)
  const accessibleOrgUnitIds = useMemo(
    () => (currentUser ? getAccessibleOrgUnitIds(currentUser, orgUnits) : new Set<string>()),
    [currentUser, orgUnits]
  );

  // حساب المقاييس
  const metrics = useMemo(() => {
    if (!scopedObjectives.length) return null;
    return calculateDashboardMetrics(
      scopedObjectives,
      allKeyResults,
      updateRequests,
      allObjectives,
      cycles,
      allReviewEvents,
      {
        cycleId: cycleFilter || undefined,
        orgUnitId: orgFilter || undefined,
      }
    );
  }, [scopedObjectives, allKeyResults, updateRequests, allObjectives, cycles, allReviewEvents, cycleFilter, orgFilter]);

  const hasFilters = !!cycleFilter || !!orgFilter;

  const orgUnitName = (id: string) => orgUnits.find((u) => u.id === id)?.name ?? "—";
  const ownerName = (id: string) => users.find((u) => u.id === id)?.fullName ?? "—";
  const cycleName = (id: string) => cycles.find((c) => c.id === id)?.name ?? "—";

  // بيانات الرسم البياني
  const performanceChartData = useMemo(() => {
    if (!metrics) return [];
    return (["advanced", "on_track", "delayed", "stalled"] as PerformanceStatus[]).map((status) => ({
      name: PERFORMANCE_STATUS_LABELS[status],
      value: metrics.performanceDistribution[status],
      status,
    }));
  }, [metrics]);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "لوحة المعلومات" },
        ]}
      />

      <PageHeader
        title="لوحة المعلومات"
        description="ملخص تحليلي لأداء الأهداف ضمن نطاقك التنظيمي."
      />

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>الدورة</span>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">كل الدورات</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>الجهة</span>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">كل الجهات</option>
                {orgUnits
                  .filter((u) => accessibleOrgUnitIds.has(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCycleFilter("");
                  setOrgFilter("");
                }}
                className="text-xs"
              >
                إعادة تعيين
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!metrics || metrics.totalObjectives === 0 ? (
        <EmptyState
          icon={<TargetIcon className="size-6" />}
          title="لا توجد أهداف ضمن النطاق المحدد"
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية أو إعادة تعيينها."
              : "لا توجد أهداف معتمدة ضمن نطاقك التنظيمي حالياً."
          }
        />
      ) : (
        <>
          {/* بطاقات KPI */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<TargetIcon className="size-5" />}
              label="إجمالي الأهداف"
              value={metrics.totalObjectives}
            />
            <KpiCard
              icon={<Users className="size-5" />}
              label="المشاركون"
              value={metrics.totalParticipants}
            />
            <KpiCard
              icon={<Gauge className="size-5" />}
              label="معدل الإنجاز العام"
              value={formatProgress(metrics.averageCompletion)}
            />
            <KpiCard
              icon={<AlertTriangle className="size-5" />}
              label="تحتاج متابعة"
              value={metrics.attentionNeeded.length}
            />
          </div>

          {/* توزيع الأداء */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">توزيع حالات الأداء</CardTitle>
                <CardDescription>
                  توزيع الأهداف المعتمدة حسب حالة الأداء الحالية.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={performanceChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => `${entry.value}`}
                    >
                      {performanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        textAlign: "right",
                        direction: "rtl",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", direction: "rtl" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* الحالات التي تحتاج متابعة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warning" />
                  حالات تحتاج متابعة
                </CardTitle>
                <CardDescription>
                  الأهداف المتأخرة أو المتعثرة ضمن نطاقك.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {metrics.attentionNeeded.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    لا توجد حالات تحتاج متابعة. كل الأهداف على المسار أو متقدّمة.
                  </p>
                ) : (
                  <div className="divide-y divide-border max-h-72 overflow-y-auto">
                    {metrics.attentionNeeded.slice(0, 10).map(({ objective, status, actualProgress, expectedProgress }) => (
                      <Link
                        key={objective.id}
                        href={`/app/objectives/${objective.id}`}
                        className="flex items-start justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-sm font-medium text-foreground line-clamp-1">
                            {objective.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{orgUnitName(objective.orgUnitId)}</span>
                            <span>•</span>
                            <span>{cycleName(objective.cycleId)}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Progress value={actualProgress} className="h-1.5 flex-1" />
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {formatProgress(actualProgress)} / {formatProgress(expectedProgress)}
                            </span>
                          </div>
                        </div>
                        <PerformanceStatusBadge status={status} size="sm" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
