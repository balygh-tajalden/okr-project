"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge, OkrStatusBadges } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import { filterObjectivesByScopeAndPermissions } from "@/lib/services/phase3-services";
import {
  calculateObjectiveProgress,
  formatProgress,
} from "@/lib/services/phase4-calculations";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
} from "@/components/common/phase3-badges";
import { Progress } from "@/components/ui/progress";
import {
  getCycleActionsFor,
  canTransitionCycle,
  isCycleEndDatePassed,
  validateCycleDates,
  getCycleEditableFields,
} from "@/lib/services/institutional";
import {
  CYCLE_TYPE_LABELS,
  CYCLE_STATUS_LABELS,
  type CycleStatus,
} from "@/lib/data/types";
import { getUserById } from "@/lib/data/store";
import {
  Pencil,
  PlayCircle,
  CheckCircle2,
  Calendar,
  Clock,
  UserCircle,
  Target,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function CycleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredAnyPermission={["cycles.view", "cycles.create"]}>
      <CycleDetails cycleId={id} />
    </ProtectedRoute>
  );
}

function CycleDetails({ cycleId }: { cycleId: string }) {
  const { user, roles, can } = useCurrentInstitutionalUser();
  const cycles = useInstitutionalStore((s) => s.cycles);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const setCycleStatus = useInstitutionalStore((s) => s.setCycleStatus);
  const allObjectives = usePhase3Store((s) => s.objectives);
  const keyResults = usePhase3Store((s) => s.keyResults);
  const assignments = usePhase3Store((s) => s.assignments);
  const updateRequests = usePhase4Store((s) => s.updateRequests);
  const [confirm, setConfirm] = useState<null | CycleStatus>(null);

  const cycle = cycles.find((c) => c.id === cycleId);
  const creator = cycle ? getUserById(cycle.createdBy) : undefined;

  // أهداف الدورة ضمن نطاق صلاحيات المستخدم، مع نسبة إنجازها المعتمدة
  const cycleObjectives = useMemo(() => {
    if (!user) return [];
    const scoped = filterObjectivesByScopeAndPermissions(
      user,
      roles,
      allObjectives,
      orgUnits,
      assignments,
      users
    );
    return scoped
      .filter((o) => o.cycleId === cycleId)
      .map((o) => ({
        objective: o,
        progress: calculateObjectiveProgress(
          o,
          keyResults,
          updateRequests,
          allObjectives
        ),
      }));
  }, [
    user,
    roles,
    allObjectives,
    orgUnits,
    assignments,
    users,
    cycleId,
    keyResults,
    updateRequests,
  ]);

  if (!cycle) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الدورة غير موجودة"
            description="ربما تم حذف الدورة أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/cycles">العودة إلى قائمة الدورات</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const actions = getCycleActionsFor(cycle.status).filter((a) =>
    can(a.permission)
  );

  const endDatePassed = isCycleEndDatePassed(cycle);

  const avgProgress = cycleObjectives.length
    ? cycleObjectives.reduce((s, x) => s + x.progress, 0) /
      cycleObjectives.length
    : 0;
  const completedCount = cycleObjectives.filter((x) => x.progress >= 100).length;

  const handleConfirmAction = () => {
    if (!confirm) return;
    if (!canTransitionCycle(cycle.status, confirm)) {
      toast.error("هذا الانتقال غير مسموح في دورة حياة الدورة.");
      setConfirm(null);
      return;
    }
    setCycleStatus(cycle.id, confirm);
    toast.success(
      confirm === "active"
        ? "تم تفعيل الدورة بنجاح."
        : "تم إكمال الدورة بنجاح."
    );
    setConfirm(null);
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "دورات OKR", href: "/app/cycles" },
          { label: cycle.name },
        ]}
      />

      <PageHeader
        title={cycle.name}
        description={cycle.description || "—"}
        badge={<CycleStatusBadge status={cycle.status} />}
        actions={
          <>
            {can("cycles.update") && cycle.status !== "completed" && (
              <Button asChild variant="outline">
                <Link href={`/app/cycles/${cycle.id}/edit`}>
                  <Pencil className="size-4" />
                  تعديل
                </Link>
              </Button>
            )}
            {actions.map((a) => (
              <Button
                key={a.to}
                variant={a.to === "completed" ? "outline" : "default"}
                onClick={() => setConfirm(a.to)}
              >
                {a.to === "active" ? (
                  <PlayCircle className="size-4" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {a.label}
              </Button>
            ))}
          </>
        }
      />

      {/* تنبيه اقتراب نهاية الدورة */}
      {cycle.status === "active" && endDatePassed && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground flex items-start gap-2">
          <Clock className="mt-0.5 size-4 text-warning" />
          <div>
            <span className="font-medium">انتهت فترة الدورة زمنياً.</span>{" "}
            يمكن إكمالها يدوياً عبر زر "إكمال الدورة" أعلاه.
          </div>
        </div>
      )}

      {/* بطاقة معلومات الدورة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات الدورة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={<Calendar className="size-3.5" />}
            label="تاريخ البداية"
            value={formatDate(cycle.startDate)}
          />
          <InfoRow
            icon={<Calendar className="size-3.5" />}
            label="تاريخ النهاية"
            value={formatDate(cycle.endDate)}
          />
          <InfoRow
            icon={<Clock className="size-3.5" />}
            label="المدة"
            value={`${daysBetween(cycle.startDate, cycle.endDate)} يوماً`}
          />
          <InfoRow label="النوع" value={
            <Badge variant="outline" className="text-xs">
              {CYCLE_TYPE_LABELS[cycle.type]}
            </Badge>
          } />
          <InfoRow label="الحالة" value={<CycleStatusBadge status={cycle.status} />} />
          {creator && (
            <InfoRow
              icon={<UserCircle className="size-3.5" />}
              label="أنشأها"
              value={creator.fullName}
            />
          )}
          {cycle.activatedAt && (
            <InfoRow
              label="تاريخ التفعيل"
              value={formatDate(cycle.activatedAt)}
            />
          )}
          {cycle.completedAt && (
            <InfoRow
              label="تاريخ الإكمال"
              value={formatDate(cycle.completedAt)}
            />
          )}
        </CardContent>
      </Card>

      {/* مخطط دورة الحياة (state machine visualization) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">دورة الحياة</CardTitle>
          <CardDescription>
            المراحل المسموحة للانتقال بينها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CycleLifeFlow currentStatus={cycle.status} />
        </CardContent>
      </Card>

      {/* أهداف الدورة */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4" />
                الأهداف
              </CardTitle>
              <CardDescription>
                الأهداف المرتبطة بهذه الدورة
                {cycleObjectives.length > 0 && ` (${cycleObjectives.length})`}
              </CardDescription>
            </div>
            {can("goals.create") && cycle.status === "active" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/app/objectives/new">
                  <Plus className="size-4" />
                  إنشاء هدف
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cycleObjectives.length === 0 ? (
            <EmptyState
              icon={<Target className="size-6" />}
              title="لا توجد أهداف مرتبطة بهذه الدورة بعد"
              description="عند إنشاء أهداف وربطها بهذه الدورة ستظهر هنا مع نتائجها الرئيسية ومؤشرات تقدّمها."
              action={
                can("goals.create") ? (
                  <Button asChild size="sm">
                    <Link href="/app/objectives/new">
                      <Plus className="size-4" />
                      إنشاء هدف
                    </Link>
                  </Button>
                ) : undefined
              }
              className="border-0"
            />
          ) : (
            <div className="divide-y divide-border">
              {cycleObjectives.map(({ objective: o, progress }) => {
                const owner = getUserById(o.ownerId);
                return (
                  <Link
                    key={o.id}
                    href={`/app/objectives/${o.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {o.title}
                        </span>
                        <ObjectiveTypeBadge type={o.type} size="sm" />
                        <ObjectiveStatusBadge status={o.status} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {owner?.fullName ?? "—"}
                      </p>
                    </div>
                    <div className="flex w-32 shrink-0 items-center gap-2">
                      <Progress
                        value={Math.min(progress, 100)}
                        className="h-2"
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatProgress(progress)}
                      </span>
                    </div>
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* مؤشرات تقدّم الدورة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تقدّم الدورة</CardTitle>
          <CardDescription>
            مؤشرات الإنجاز محسوبة من تحديثات الإنجاز المعتمدة لأهداف هذه
            الدورة.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <ProgressStat
            label="عدد الأهداف"
            value={String(cycleObjectives.length)}
          />
          <ProgressStat
            label="متوسط الإنجاز"
            value={formatProgress(avgProgress)}
          />
          <ProgressStat
            label="الأهداف المكتملة"
            value={`${completedCount} / ${cycleObjectives.length}`}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          confirm === "active" ? "تفعيل الدورة" : "إكمال الدورة"
        }
        description={
          confirm === "active"
            ? `سيتم تفعيل دورة "${cycle.name}". بعد التفعيل، يمكن إنشاء أهداف وبدء التنفيذ، لكن لن يمكن تعديل الفترة الزمنية. هل تريد المتابعة؟`
            : `سيتم إكمال دورة "${cycle.name}". بعد الإكمال، تصبح الدورة للقراءة فقط (مرجع تاريخي). لا يمكن العودة إلى حالة "نشطة". هل تريد المتابعة؟`
        }
        confirmLabel={confirm === "active" ? "تفعيل" : "إكمال"}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

function CycleStatusBadge({ status }: { status: CycleStatus }) {
  if (status === "draft") return <OkrStatusBadges.Pending />;
  if (status === "active") return <OkrStatusBadges.InProgress />;
  return <OkrStatusBadges.Completed />;
}

function CycleLifeFlow({ currentStatus }: { currentStatus: CycleStatus }) {
  const states: CycleStatus[] = ["draft", "active", "completed"];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {states.map((s, i) => {
        const isCurrent = s === currentStatus;
        const isPast =
          states.indexOf(currentStatus) > i ||
          (currentStatus === "completed" && s === "active");
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                isCurrent
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : isPast
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              <span>{CYCLE_STATUS_LABELS[s]}</span>
            </div>
            {i < states.length - 1 && (
              <span className="text-muted-foreground text-lg">←</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-4 text-center">
      <div className="text-2xl font-bold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}
