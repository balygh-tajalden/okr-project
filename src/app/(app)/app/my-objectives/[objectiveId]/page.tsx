"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
  AssignmentResponseBadge,
} from "@/components/common/phase3-badges";
import { KeyResultCard } from "@/components/common/key-result-card";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  usePhase3Store,
  getAssignmentForObjective,
  getReviewEventsForObjective,
} from "@/lib/data/phase3-store";
import { ReviewHistoryTimeline } from "@/components/common/review-history-timeline";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  UserCircle,
  Building2,
  Repeat,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function MyObjectiveDetailsPage({
  params,
}: {
  params: Promise<{ objectiveId: string }>;
}) {
  const { objectiveId } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["individual_goals.view"]}>
      <MyObjectiveDetails objectiveId={objectiveId} />
    </ProtectedRoute>
  );
}

function MyObjectiveDetails({ objectiveId }: { objectiveId: string }) {
  const { user: currentUser, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const cycles = useInstitutionalStore((s) => s.cycles);

  const objective = usePhase3Store((s) => s.objectives.find((o) => o.id === objectiveId));
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const respondToAssignment = usePhase3Store((s) => s.respondToAssignment);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!objective || !currentUser) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الهدف غير موجود"
            description="ربما تم حذف الهدف أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/my-objectives">العودة إلى الأهداف المسندة</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const assignment = getAssignmentForObjective(objective.id);
  const reviewEvents = getReviewEventsForObjective(objective.id);

  // التحقق من أن المستخدم هو المستلم
  if (!assignment || assignment.assigneeUserId !== currentUser.id) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="غير مصرّح"
            description="هذا الهدف غير مُسند إليك. لا يمكنك عرضه من هنا."
            action={
              <Button asChild variant="outline">
                <Link href="/app/my-objectives">العودة إلى الأهداف المسندة</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const owner = users.find((u) => u.id === objective.ownerId);
  const assigner = users.find((u) => u.id === assignment.assignerUserId);
  const orgUnit = orgUnits.find((u) => u.id === objective.orgUnitId);
  const cycle = cycles.find((c) => c.id === objective.cycleId);
  const krs = allKeyResults.filter((k) => k.objectiveId === objective.id);

  const canRespond =
    can("individual_goals.respond") && assignment.response === "pending";

  const handleAccept = () => {
    respondToAssignment(assignment.id, "accepted", undefined, currentUser.id);
    toast.success("تم قبول الهدف بنجاح.");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("سبب الرفض إلزامي.");
      return;
    }
    respondToAssignment(assignment.id, "rejected", rejectReason.trim(), currentUser.id);
    toast.success("تم رفض الهدف مع تسجيل السبب.");
    setShowRejectForm(false);
    setRejectReason("");
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأهداف المسندة إلي", href: "/app/my-objectives" },
          { label: objective.title },
        ]}
      />

      <PageHeader
        title={objective.title}
        description={objective.description || "—"}
        badge={
          <div className="flex items-center gap-2">
            <ObjectiveTypeBadge type={objective.type} />
            <ObjectiveStatusBadge status={objective.status} />
            <AssignmentResponseBadge response={assignment.response} />
          </div>
        }
        actions={
          canRespond ? (
            <>
              <Button onClick={handleAccept}>
                <CheckCircle2 className="size-4" />
                قبول الهدف
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <XCircle className="size-4" />
                رفض الهدف
              </Button>
            </>
          ) : undefined
        }
      />

      {/* حالة الاستجابة */}
      {assignment.response !== "pending" && (
        <div
          className={`rounded-md border p-3 text-sm flex items-start gap-2 ${
            assignment.response === "accepted"
              ? "border-success/30 bg-success/5 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-foreground"
          }`}
        >
          {assignment.response === "accepted" ? (
            <CheckCircle2 className="size-4 mt-0.5 text-success shrink-0" />
          ) : (
            <AlertTriangle className="size-4 mt-0.5 text-destructive shrink-0" />
          )}
          <div>
            {assignment.response === "accepted" ? (
              <span>تم قبول الهدف في {formatDate(assignment.respondedAt ?? "")}.</span>
            ) : (
              <div className="space-y-1">
                <div>تم رفض الهدف في {formatDate(assignment.respondedAt ?? "")}.</div>
                <div className="text-xs">
                  <span className="text-muted-foreground">سبب الرفض: </span>
                  {assignment.rejectReason}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ملخص الهدف */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملخص الهدف</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={<UserCircle className="size-3.5" />}
            label="المُسند"
            value={
              assigner ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {assigner.initials}
                    </AvatarFallback>
                  </Avatar>
                  {assigner.fullName}
                </div>
              ) : (
                "—"
              )
            }
          />
          <InfoRow icon={<Building2 className="size-3.5" />} label="الجهة" value={orgUnit?.name ?? "—"} />
          <InfoRow icon={<Repeat className="size-3.5" />} label="الدورة" value={cycle?.name ?? "—"} />
          <InfoRow icon={<Calendar className="size-3.5" />} label="البداية" value={formatDate(objective.startDate)} />
          <InfoRow icon={<Calendar className="size-3.5" />} label="النهاية" value={formatDate(objective.endDate)} />
          <InfoRow icon={<UserCircle className="size-3.5" />} label="مالك الهدف" value={owner?.fullName ?? "—"} />
        </CardContent>
      </Card>

      {/* النتائج الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            النتائج الرئيسية ({krs.length})
          </CardTitle>
          <CardDescription>
            راجع النتائج المتوقعة منك قبل الرد على الإسناد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {krs.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد نتائج رئيسية.</p>
          ) : (
            <div className="grid gap-3">
              {krs.map((kr) => (
                <KeyResultCard key={kr.id} kr={kr} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* سجل المراجعات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل الأحداث</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewHistoryTimeline events={reviewEvents} users={users} />
        </CardContent>
      </Card>

      {/* نافذة الرفض مع حقل السبب */}
      {showRejectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">رفض الهدف</CardTitle>
              <CardDescription>
                سيُسجّل رفضك لـ "{objective.title}". سبب الرفض إلزامي ويُعرض للمدير المُسند.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  سبب الرفض <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: لدي التزامات أخرى خلال هذه الفترة..."
                  rows={3}
                  className="resize-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setShowRejectForm(false); setRejectReason(""); }}>
                  إلغاء
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <XCircle className="size-4" />
                  تأكيد الرفض
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
