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
  Sparkles,
  Target,
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
  const { can } = useCurrentInstitutionalUser();
  const cycles = useInstitutionalStore((s) => s.cycles);
  const setCycleStatus = useInstitutionalStore((s) => s.setCycleStatus);
  const [confirm, setConfirm] = useState<null | CycleStatus>(null);

  const cycle = cycles.find((c) => c.id === cycleId);
  const creator = cycle ? getUserById(cycle.createdBy) : undefined;

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

      {/* قسم الأهداف — placeholder للطور الثالث */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="size-4" />
            الأهداف
          </CardTitle>
          <CardDescription>
            الأهداف المرتبطة بهذه الدورة — ستُضاف في الطور الثالث.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="لم تتم إضافة أهداف إلى هذه الدورة بعد"
            description="في الطور القادم (Phase 3) ستتمكن من إنشاء أهداف ونتائج رئيسية مرتبطة بهذه الدورة، مع التحقق التلقائي من وقوعها ضمن فترتها الزمنية."
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* مؤشرات تقدّم الدورة — placeholder للطور الرابع */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تقدّم الدورة</CardTitle>
          <CardDescription>
            مؤشرات الإنجاز والإحصائيات — ستُفعّل عند بدء تنفيذ الأهداف.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <PlaceholderStat label="عدد الأهداف" value="—" />
          <PlaceholderStat label="متوسط الإنجاز" value="—" />
          <PlaceholderStat label="الأهداف المكتملة" value="—" />
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
        variant={confirm === "active" ? "default" : "outline"}
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

function PlaceholderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-center">
      <div className="text-2xl font-bold text-muted-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
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
