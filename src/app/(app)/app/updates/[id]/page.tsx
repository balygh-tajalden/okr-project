"use client";

import { use, useState, useTransition, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { KeyResultCard } from "@/components/common/key-result-card";
import { EvidenceList, UpdateRequestStatusBadge } from "@/components/common/phase4-badges";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store, getEvidenceForUpdateRequest } from "@/lib/data/phase4-store";
import {
  isObjectiveExecutable,
  isKREligibleForDirectUpdate,
  canSubmitUpdateRequest,
  canReviewUpdateRequest,
} from "@/lib/services/phase4-authorization";
import {
  calculateDirectKRProgress,
  getLatestApprovedValue,
  formatProgress,
  formatActualValue,
} from "@/lib/services/phase4-calculations";
import type { ApprovedValue } from "@/lib/data/phase4-types";
import {
  Calendar,
  UserCircle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Save,
  Plus,
  FileText,
  Link as LinkIcon,
  StickyNote,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

export default function UpdateRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredAnyPermission={["progress.view", "progress.review", "progress.update"]}>
      <UpdateRequestDetails requestId={id} />
    </ProtectedRoute>
  );
}

function UpdateRequestDetails({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { user: currentUser, roles, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const cycles = useInstitutionalStore((s) => s.cycles);

  const request = usePhase4Store((s) => s.updateRequests.find((r) => r.id === requestId));
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const objectives = usePhase3Store((s) => s.objectives);
  const approveUpdateRequest = usePhase4Store((s) => s.approveUpdateRequest);
  const returnUpdateRequest = usePhase4Store((s) => s.returnUpdateRequest);
  const addEvidence = usePhase4Store((s) => s.addEvidence);

  const [reviewMode, setReviewMode] = useState<null | "approve" | "return">(null);
  const [numericValue, setNumericValue] = useState<string>("");
  const [binaryValue, setBinaryValue] = useState<"achieved" | "not_achieved" | "">("");
  const [returnReason, setReturnReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // إضافة دليل
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<"note" | "file" | "link">("note");
  const [evidenceContent, setEvidenceContent] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");

  if (!request || !currentUser) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الطلب غير موجود"
            description="ربما تم حذف الطلب أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/updates">العودة إلى قائمة الطلبات</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const objective = objectives.find((o) => o.id === request.objectiveId);
  const kr = allKeyResults.find((k) => k.id === request.keyResultId);
  const cycle = objective ? cycles.find((c) => c.id === objective.cycleId) : undefined;
  const submitter = users.find((u) => u.id === request.submitterUserId);
  const reviewer = request.reviewerUserId
    ? users.find((u) => u.id === request.reviewerUserId)
    : undefined;
  const evidence = getEvidenceForUpdateRequest(request.id);

  if (!objective || !kr || !cycle) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="بيانات الطلب غير مكتملة"
            description="تعذّر العثور على الهدف أو KR أو الدورة المرتبطة."
          />
        </CardContent>
      </Card>
    );
  }

  // الصلاحيات
  const isSubmitter = request.submitterUserId === currentUser.id;
  const submitCheck = canSubmitUpdateRequest(currentUser, roles, objective);
  const reviewCheck = canReviewUpdateRequest(
    currentUser,
    roles,
    objective,
    orgUnits,
    request.submitterUserId
  );
  const canReview = reviewCheck.canReview && request.status === "pending_review";

  // القيمة الفعلية الحالية المعتمدة (لا تدخلها من الطلب المعلّق)
  const latestApproved = getLatestApprovedValue(kr.id, [
    ...usePhase4Store.getState().updateRequests,
  ]);
  const currentProgress = calculateDirectKRProgress(kr, latestApproved);

  // معالجات الموافقة/الإعادة
  const handleApprove = () => {
    let approvedValue: ApprovedValue;
    if (kr.directType === "binary") {
      if (!binaryValue) {
        toast.error("يجب تحديد ما إذا تحقق الإنجاز أم لا.");
        return;
      }
      approvedValue = { kind: "binary", binaryValue: binaryValue === "achieved" };
    } else {
      const num = Number(numericValue);
      if (numericValue === "" || isNaN(num)) {
        toast.error("يجب إدخال قيمة عددية صحيحة.");
        return;
      }
      approvedValue = { kind: "numeric", numericValue: num };
    }
    startTransition(() => {
      approveUpdateRequest(request.id, currentUser.id, approvedValue);
      toast.success("تم اعتماد التحديث بنجاح. أُعيد حساب التقدّم تلقائياً.");
      setReviewMode(null);
      setNumericValue("");
      setBinaryValue("");
    });
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      toast.error("سبب الإعادة إلزامي.");
      return;
    }
    startTransition(() => {
      returnUpdateRequest(request.id, currentUser.id, returnReason.trim());
      toast.success("تمت إعادة الطلب للمُرسِل مع تسجيل السبب.");
      setReviewMode(null);
      setReturnReason("");
    });
  };

  const handleAddEvidence = () => {
    if (!evidenceContent.trim()) {
      toast.error("محتوى الدليل مطلوب.");
      return;
    }
    startTransition(() => {
      addEvidence(
        request.id,
        evidenceType,
        evidenceContent.trim(),
        currentUser.id,
        evidenceType === "file" && evidenceFileName.trim()
          ? { fileName: evidenceFileName.trim() }
          : undefined
      );
      toast.success("تمت إضافة الدليل.");
      setShowEvidenceForm(false);
      setEvidenceContent("");
      setEvidenceFileName("");
      setEvidenceType("note");
    });
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "تحديثات الإنجاز", href: "/app/updates" },
          { label: kr.title },
        ]}
      />

      <PageHeader
        title={kr.title}
        description={`طلب تحديث تقدّم — ${objective.title}`}
        badge={<UpdateRequestStatusBadge status={request.status} size="md" />}
        actions={
          canReview && !reviewMode ? (
            <>
              <Button onClick={() => setReviewMode("approve")}>
                <CheckCircle2 className="size-4" />
                اعتماد التحديث
              </Button>
              <Button variant="outline" onClick={() => setReviewMode("return")}>
                <RotateCcw className="size-4" />
                إعادة الطلب
              </Button>
            </>
          ) : undefined
        }
      />

      {/* منع المراجعة الذاتية */}
      {!canReview && request.status === "pending_review" && reviewCheck.reason && (
        <div className="rounded-md border border-info/30 bg-info/5 p-3 text-xs text-info flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{reviewCheck.reason}</span>
        </div>
      )}

      {/* ملخص الطلب */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات الطلب</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={<UserCircle className="size-3.5" />}
            label="المُرسِل"
            value={
              submitter ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {submitter.initials}
                    </AvatarFallback>
                  </Avatar>
                  {submitter.fullName}
                </div>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<Calendar className="size-3.5" />}
            label="تاريخ الإرسال"
            value={formatDateTime(request.submittedAt)}
          />
          {reviewer && (
            <InfoRow
              icon={<UserCircle className="size-3.5" />}
              label="المراجع"
              value={reviewer.fullName}
            />
          )}
          {request.reviewedAt && (
            <InfoRow
              icon={<Calendar className="size-3.5" />}
              label="تاريخ المراجعة"
              value={formatDateTime(request.reviewedAt)}
            />
          )}
          {request.approvedValue && (
            <InfoRow
              label="القيمة المعتمدة"
              value={
                <span className="text-success font-medium">
                  {request.approvedValue.kind === "numeric"
                    ? formatActualValue(request.approvedValue.numericValue, kr.unit)
                    : request.approvedValue.binaryValue
                      ? "تحقق"
                      : "لم يتحقق"}
                </span>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* سياق KR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سياق النتيجة الرئيسية</CardTitle>
          <CardDescription>
            القيمة المرجعية والهدف والمسار الحالي — للمراجع قبل الاعتماد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <KeyResultCard kr={kr} />
          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="القيمة المرجعية" value={String(kr.baseline ?? "—")} unit={kr.unit} />
            <Metric label="القيمة المستهدفة" value={String(kr.target ?? "—")} unit={kr.unit} />
            <Metric
              label="القيمة الفعلية الحالية"
              value={latestApproved?.kind === "numeric" ? String(latestApproved.numericValue) : "—"}
              unit={kr.unit}
            />
            <Metric label="التقدّم الحالي" value={formatProgress(currentProgress.progress)} unit="%" />
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات المُرسِل */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملاحظات الإنجاز</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {request.submitterNotes || "—"}
          </p>
        </CardContent>
      </Card>

      {/* الأدلة المرفقة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">الأدلة المرفقة</CardTitle>
              <CardDescription>
                ملاحظات، ملفات، وروابط تدعم الطلب.
              </CardDescription>
            </div>
            {isSubmitter && request.status !== "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
              >
                <Plus className="size-4" />
                إضافة دليل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showEvidenceForm && (
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <Label className="text-xs">نوع الدليل</Label>
                <Select
                  value={evidenceType}
                  onValueChange={(v) => setEvidenceType(v as typeof evidenceType)}
                >
                  <SelectTrigger className="h-8 sm:col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">ملاحظة</SelectItem>
                    <SelectItem value="file">ملف</SelectItem>
                    <SelectItem value="link">رابط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {evidenceType === "file" && (
                <Input
                  placeholder="اسم الملف (مثال: تقرير-الإنجاز.pdf)"
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  className="h-9"
                />
              )}
              <Textarea
                placeholder={
                  evidenceType === "note"
                    ? "اكتب ملاحظتك هنا..."
                    : evidenceType === "file"
                      ? "وصف مختصر للملف..."
                      : "الصق الرابط هنا..."
                }
                value={evidenceContent}
                onChange={(e) => setEvidenceContent(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEvidenceForm(false);
                    setEvidenceContent("");
                    setEvidenceFileName("");
                  }}
                >
                  إلغاء
                </Button>
                <Button size="sm" onClick={handleAddEvidence}>
                  <Save className="size-3.5" />
                  إضافة
                </Button>
              </div>
            </div>
          )}
          <EvidenceList evidence={evidence} users={users} />
        </CardContent>
      </Card>

      {/* سبب الإعادة (إذا الطلب مُعاد) */}
      {request.status === "returned" && request.returnReason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">سبب إعادة الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {request.returnReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* نافذة الاعتماد */}
      {reviewMode === "approve" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">اعتماد التحديث</CardTitle>
              <CardDescription>
                أدخل القيمة الفعلية المعتمدة. سيُحسب التقدّم تلقائياً.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {kr.directType === "numeric" ? (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    القيمة الفعلية المعتمدة <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={numericValue}
                    onChange={(e) => setNumericValue(e.target.value)}
                    placeholder="مثال: 55"
                    className="tabular-nums"
                    autoFocus
                  />
                  {kr.unit && (
                    <p className="text-[11px] text-muted-foreground">
                      الوحدة: {kr.unit} • المرجعية: {kr.baseline} → الهدف: {kr.target}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    هل تحقق الإنجاز؟ <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={binaryValue}
                    onValueChange={(v) => setBinaryValue(v as "achieved" | "not_achieved")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="achieved">تحقق</SelectItem>
                      <SelectItem value="not_achieved">لم يتحقق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setReviewMode(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleApprove} disabled={isPending}>
                  <CheckCircle2 className="size-4" />
                  {isPending ? "جاري الاعتماد..." : "اعتماد"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* نافذة الإعادة مع السبب */}
      {reviewMode === "return" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">إعادة الطلب للتصحيح</CardTitle>
              <CardDescription>
                سيُعاد الطلب للمُرسِل. السبب إلزامي ولا تُسجّل قيمة فعلية.
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
                  placeholder="مثال: الأدلة المرفقة غير كافية. يرجى إرفاق..."
                  rows={3}
                  className="resize-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setReviewMode(null)}>
                  إلغاء
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReturn}
                  disabled={isPending || !returnReason.trim()}
                >
                  <RotateCcw className="size-4" />
                  {isPending ? "جاري الإعادة..." : "تأكيد الإعادة"}
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

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
        {value} {unit && <span className="text-[10px] text-muted-foreground font-normal">{unit}</span>}
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
