"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { PermissionGuardV2 } from "@/components/auth/permission-guard-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
  AssignmentResponseBadge,
} from "@/components/common/phase3-badges";
import { KeyResultCard } from "@/components/common/key-result-card";
import { ReviewHistoryTimeline } from "@/components/common/review-history-timeline";
import { AlignmentPath } from "@/components/common/alignment-path";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  usePhase3Store,
  getKeyResultsForObjective,
  getReviewEventsForObjective,
  getSupportingObjectivesForKR,
  getAssignmentForObjective,
} from "@/lib/data/phase3-store";
import {
  canApproveObjective,
  getExecutionReadinessMessage,
  validateObjectiveForSubmission,
  getAssignableEmployees,
} from "@/lib/services/phase3-services";
import {
  OBJECTIVE_STATUS_LABELS,
  type KeyResult,
} from "@/lib/data/phase3-types";
import {
  Send,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Calendar,
  UserCircle,
  Building2,
  Repeat,
  Plus,
  Trash2,
  Inbox,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useState as useReactState } from "react";

export default function ObjectiveDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredAnyPermission={["goals.view"]}>
      <ObjectiveDetails objectiveId={id} />
    </ProtectedRoute>
  );
}

function ObjectiveDetails({ objectiveId }: { objectiveId: string }) {
  const router = useRouter();
  const { user: currentUser, roles, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const cycles = useInstitutionalStore((s) => s.cycles);

  const objective = usePhase3Store((s) => s.objectives.find((o) => o.id === objectiveId));
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const setObjectiveStatus = usePhase3Store((s) => s.setObjectiveStatus);
  const addReviewEvent = usePhase3Store((s) => s.addReviewEvent);
  const createAssignment = usePhase3Store((s) => s.createAssignment);

  const [confirmAction, setConfirmAction] = useState<
    null | "submit" | "approve" | "return"
  >(null);
  const [returnReason, setReturnReason] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  if (!objective || !currentUser) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الهدف غير موجود"
            description="ربما تم حذف الهدف أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/objectives">العودة إلى قائمة الأهداف</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const owner = users.find((u) => u.id === objective.ownerId);
  const orgUnit = orgUnits.find((u) => u.id === objective.orgUnitId);
  const cycle = cycles.find((c) => c.id === objective.cycleId);
  const krs = allKeyResults.filter((k) => k.objectiveId === objective.id);
  const reviewEvents = getReviewEventsForObjective(objective.id);
  const assignment = getAssignmentForObjective(objective.id);
  const contributors = objective.contributorUserIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u);

  // KR أعلى (إذا كان الهدف داعماً)
  const upstreamKR = objective.upstreamKeyResultId
    ? allKeyResults.find((k) => k.id === objective.upstreamKeyResultId)
    : undefined;
  const upstreamObjective = upstreamKR
    ? usePhase3Store.getState().objectives.find((o) => o.id === upstreamKR.objectiveId)
    : undefined;
  const upstreamOrgUnit = upstreamObjective
    ? orgUnits.find((u) => u.id === upstreamObjective.orgUnitId)
    : undefined;

  // الأهداف الداعمة المرتبطة بـ KRs هذا الهدف
  const supportingObjectives = krs.flatMap((kr) =>
    getSupportingObjectivesForKR(kr.id).map((o) => ({ objective: o, kr }))
  );

  // الصلاحيات
  const isOwner = objective.ownerId === currentUser.id;
  const canEdit = can("goals.update") && objective.status === "draft" && (isOwner || can("system.admin"));
  const canDelete = can("goals.delete") && objective.status === "draft" && (isOwner || can("system.admin"));
  const canSubmit = can("goals.submit") && objective.status === "draft" && (isOwner || can("system.admin"));
  const approveCheck = canApproveObjective(currentUser, roles, objective, orgUnits);
  const canApprove = objective.status === "under_review" && approveCheck.canApprove;
  const canReturn = objective.status === "under_review" && approveCheck.canApprove;
  const canAssign = objective.status === "approved" && objective.type === "individual" && can("goals.assign") && (isOwner || can("system.admin"));

  const executionMsg = cycle ? getExecutionReadinessMessage(objective, cycle) : null;

  // التحقق من جاهزية الإرسال
  const submissionCheck = cycle
    ? validateObjectiveForSubmission(objective, cycle, allKeyResults)
    : { valid: false, errors: ["الدورة غير موجودة."] };

  const handleAction = () => {
    if (confirmAction === "submit") {
      if (!submissionCheck.valid) {
        toast.error("لا يمكن إرسال الهدف للمراجعة:", {
          description: submissionCheck.errors.join("\n"),
        });
        setConfirmAction(null);
        return;
      }
      setObjectiveStatus(objective.id, "under_review");
      addReviewEvent({
        objectiveId: objective.id,
        eventType: "submitted",
        actorUserId: currentUser.id,
      });
      toast.success("تم إرسال الهدف للمراجعة.");
    } else if (confirmAction === "approve") {
      setObjectiveStatus(objective.id, "approved");
      addReviewEvent({
        objectiveId: objective.id,
        eventType: "approved",
        actorUserId: currentUser.id,
      });
      toast.success("تم اعتماد الهدف بنجاح.");
    } else if (confirmAction === "return") {
      if (!returnReason.trim()) {
        toast.error("سبب الإعادة للتعديل مطلوب.");
        return;
      }
      setObjectiveStatus(objective.id, "draft");
      addReviewEvent({
        objectiveId: objective.id,
        eventType: "returned",
        actorUserId: currentUser.id,
        reason: returnReason.trim(),
      });
      toast.success("تمت إعادة الهدف للمالك للتعديل.");
      setReturnReason("");
    }
    setConfirmAction(null);
  };

  const handleAssign = () => {
    if (!selectedEmployee) {
      toast.error("اختر موظفاً للإسناد.");
      return;
    }
    createAssignment(objective.id, currentUser.id, selectedEmployee);
    toast.success("تم إسناد الهدف للموظف بنجاح.");
    setShowAssignDialog(false);
    setSelectedEmployee("");
  };

  // الموظفون القابلون للإسناد (ضمن نطاق المدير)
  const assignableEmployees = getAssignableEmployees(currentUser, users, orgUnits);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأهداف", href: "/app/objectives" },
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
          </div>
        }
        actions={
          <>
            {canEdit && (
              <Button asChild variant="outline">
                <Link href={`/app/objectives/${objective.id}/edit`}>
                  <Pencil className="size-4" />
                  تعديل
                </Link>
              </Button>
            )}
            {canSubmit && (
              <Button onClick={() => setConfirmAction("submit")}>
                <Send className="size-4" />
                إرسال للمراجعة
              </Button>
            )}
            {canApprove && (
              <Button onClick={() => setConfirmAction("approve")}>
                <CheckCircle2 className="size-4" />
                اعتماد
              </Button>
            )}
            {canReturn && (
              <Button variant="outline" onClick={() => setConfirmAction("return")}>
                <RotateCcw className="size-4" />
                إعادة للتعديل
              </Button>
            )}
            {canAssign && !assignment && (
              <Button onClick={() => setShowAssignDialog(true)}>
                <Plus className="size-4" />
                إسناد لموظف
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (confirm("هل أنت متأكد من حذف هذا الهدف؟ لا يمكن التراجع.")) {
                    usePhase3Store.getState().deleteObjective(objective.id);
                    toast.success("تم حذف الهدف.");
                    router.push("/app/objectives");
                  }
                }}
              >
                <Trash2 className="size-4" />
                حذف
              </Button>
            )}
          </>
        }
      />

      {/* منع الاعتماد الذاتي — رسالة تفسيرية */}
      {objective.status === "under_review" && !approveCheck.canApprove && approveCheck.reason && (
        <div className="rounded-md border border-info/30 bg-info/5 p-3 text-xs text-info flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>{approveCheck.reason}</span>
        </div>
      )}

      {/* رسالة جاهزية التنفيذ */}
      {executionMsg && (
        <div className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-foreground flex items-start gap-2">
          <Sparkles className="size-4 mt-0.5 text-success shrink-0" />
          <span>{executionMsg}</span>
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
            label="المالك"
            value={owner?.fullName ?? "—"}
          />
          <InfoRow
            icon={<Building2 className="size-3.5" />}
            label="الجهة"
            value={orgUnit?.name ?? "—"}
          />
          <InfoRow
            icon={<Repeat className="size-3.5" />}
            label="الدورة"
            value={cycle?.name ?? "—"}
          />
          <InfoRow
            icon={<Calendar className="size-3.5" />}
            label="تاريخ البداية"
            value={formatDate(objective.startDate)}
          />
          <InfoRow
            icon={<Calendar className="size-3.5" />}
            label="تاريخ النهاية"
            value={formatDate(objective.endDate)}
          />
          <InfoRow label="الحالة" value={<ObjectiveStatusBadge status={objective.status} size="sm" />} />
        </CardContent>
      </Card>

      {/* المحاذاة */}
      {objective.upstreamKeyResultId && upstreamKR && upstreamObjective && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المحاذاة</CardTitle>
            <CardDescription>علاقة الهدف الداعم بالهدف الأعلى.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlignmentPath
              upstreamObjective={upstreamObjective}
              upstreamKeyResult={upstreamKR}
              supportingObjective={objective}
              upstreamOrgUnit={upstreamOrgUnit}
              supportingOrgUnit={orgUnit}
              cycleName={cycle?.name}
            />
          </CardContent>
        </Card>
      )}

      {/* النتائج الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            النتائج الرئيسية ({krs.length})
          </CardTitle>
          <CardDescription>
            نتائج الهدف وطرق قياسها. اعتماد الهدف يعني اعتماد كل نتائجه.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {krs.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-6" />}
              title="لا توجد نتائج رئيسية"
              description={canEdit ? "أضف نتيجة رئيسية واحدة على الأقل قبل الإرسال للمراجعة." : "لم تتم إضافة نتائج رئيسية بعد."}
              className="border-0"
            />
          ) : (
            <div className="grid gap-3">
              {krs.map((kr) => (
                <KeyResultCard key={kr.id} kr={kr} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* الأهداف الداعمة المرتبطة */}
      {supportingObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الأهداف الداعمة المرتبطة</CardTitle>
            <CardDescription>
              أهداف أخرى تدعم نتائج هذا الهدف.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {supportingObjectives.map(({ objective: sup, kr }) => (
                <Link
                  key={sup.id}
                  href={`/app/objectives/${sup.id}`}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground line-clamp-1">
                      {sup.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      يدعم: {kr.title}
                    </div>
                  </div>
                  <ObjectiveStatusBadge status={sup.status} size="sm" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* المساهمون */}
      {contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المساهمون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {contributors.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-card p-2"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {u.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs font-medium text-foreground">{u.fullName}</div>
                    <div className="text-[10px] text-muted-foreground">{u.jobTitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الإسناد الفردي */}
      {assignment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الإسناد الفردي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const assigner = users.find((u) => u.id === assignment.assignerUserId);
              const assignee = users.find((u) => u.id === assignment.assigneeUserId);
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="المُسند" value={assigner?.fullName ?? "—"} />
                  <InfoRow label="المستلم" value={assignee?.fullName ?? "—"} />
                  <InfoRow
                    label="تاريخ الإسناد"
                    value={formatDate(assignment.assignedAt)}
                  />
                  <InfoRow
                    label="حالة الاستجابة"
                    value={<AssignmentResponseBadge response={assignment.response} size="sm" />}
                  />
                  {assignment.response === "rejected" && assignment.rejectReason && (
                    <div className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <div className="text-xs text-muted-foreground mb-1">سبب الرفض:</div>
                      <div className="text-sm text-foreground">{assignment.rejectReason}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* سجل المراجعات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل المراجعات</CardTitle>
          <CardDescription>تاريخ أحداث المراجعة والإسناد.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewHistoryTimeline events={reviewEvents} users={users} />
        </CardContent>
      </Card>

      {/* نوافذ التأكيد */}
      <ConfirmDialog
        open={confirmAction === "submit"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="إرسال الهدف للمراجعة"
        description={
          submissionCheck.valid
            ? `سيتم إرسال "${objective.title}" للمراجعة. لن تتمكن من تعديل البيانات حتى يرد المراجع. هل تريد المتابعة؟`
            : "لا يمكن إرسال الهدف للمراجعة — راجع الأخطاء أدناه."
        }
        confirmLabel={submissionCheck.valid ? "إرسال" : "غير مكتمل"}
        onConfirm={() => handleAction()}
      />
      {!submissionCheck.valid && confirmAction === "submit" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
          {submissionCheck.errors.map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="اعتماد الهدف"
        description={`سيتم اعتماد "${objective.title}". يشمل الاعتماد كل النتائج الرئيسية المرتبطة. لا يمكن التراجع. هل تريد المتابعة؟`}
        confirmLabel="اعتماد"
        onConfirm={() => handleAction()}
      />

      {/* نافذة الإعادة مع حقل السبب */}
      {confirmAction === "return" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">إعادة الهدف للتعديل</CardTitle>
              <CardDescription>
                سيُعاد "{objective.title}" لمالكه كمسودة. السبب إلزامي.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  سبب الإعادة <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="مثال: النتائج الرئيسية تحتاج لمؤشرات قياس أدق..."
                  rows={3}
                  className="resize-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setConfirmAction(null); setReturnReason(""); }}>
                  إلغاء
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAction}
                  disabled={!returnReason.trim()}
                >
                  <RotateCcw className="size-4" />
                  إعادة للتعديل
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* نافذة الإسناد */}
      {showAssignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">إسناد الهدف لموظف</CardTitle>
              <CardDescription>
                اختر موظفاً ضمن نطاقك التنظيمي لإسناد "{objective.title}" إليه.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignableEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا يوجد موظفون ضمن نطاقك التنظيمي قابلون للإسناد.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {assignableEmployees.map((u) => (
                    <label
                      key={u.id}
                      className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                        selectedEmployee === u.id ? "bg-primary/5 border-primary/30" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignee"
                        checked={selectedEmployee === u.id}
                        onChange={() => setSelectedEmployee(u.id)}
                        className="size-3.5"
                      />
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {u.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground">{u.fullName}</div>
                        <div className="text-[10px] text-muted-foreground">{u.jobTitle}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setShowAssignDialog(false); setSelectedEmployee(""); }}>
                  إلغاء
                </Button>
                <Button onClick={handleAssign} disabled={!selectedEmployee}>
                  <Inbox className="size-4" />
                  إسناد الهدف
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
