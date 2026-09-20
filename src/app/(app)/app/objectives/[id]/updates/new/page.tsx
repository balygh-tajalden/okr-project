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
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { KeyResultCard } from "@/components/common/key-result-card";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import {
  isObjectiveExecutable,
  isKREligibleForDirectUpdate,
  canSubmitUpdateRequest,
} from "@/lib/services/phase4-authorization";
import {
  getLatestApprovedValue,
  calculateDirectKRProgress,
  formatProgress,
  formatActualValue,
} from "@/lib/services/phase4-calculations";
import {
  AlertTriangle,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { EvidenceType } from "@/lib/data/phase4-types";

export default function NewUpdateRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["progress.update"]}>
      <NewUpdateRequestForm objectiveId={id} />
    </ProtectedRoute>
  );
}

function NewUpdateRequestForm({ objectiveId }: { objectiveId: string }) {
  const router = useRouter();
  const { user: currentUser, roles, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);

  const objective = usePhase3Store((s) => s.objectives.find((o) => o.id === objectiveId));
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const allUpdateRequests = usePhase4Store((s) => s.updateRequests);
  const createUpdateRequest = usePhase4Store((s) => s.createUpdateRequest);
  const addEvidence = usePhase4Store((s) => s.addEvidence);

  const [isPending, startTransition] = useTransition();
  const [selectedKRId, setSelectedKRId] = useState<string>("");
  const [submitterNotes, setSubmitterNotes] = useState("");
  const [evidenceItems, setEvidenceItems] = useState<
    Array<{ type: EvidenceType; content: string; fileName?: string }>
  >([]);

  if (!objective || !currentUser) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الهدف غير موجود"
            description="ربما تم حذف الهدف أو أن الرابط غير صحيح."
          />
        </CardContent>
      </Card>
    );
  }

  const cycle = cycles.find((c) => c.id === objective.cycleId);
  if (!cycle) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState title="الدورة غير موجودة" />
        </CardContent>
      </Card>
    );
  }

  // التحقق من الأهلية
  const execCheck = isObjectiveExecutable(objective, cycle);
  const submitCheck = canSubmitUpdateRequest(currentUser, roles, objective);

  // KRs المباشرة فقط (التي تقبل تحديثات يدوية)
  const directKRs = allKeyResults.filter(
    (k) => k.objectiveId === objective.id && k.progressSource === "direct"
  );

  const selectedKR = allKeyResults.find((k) => k.id === selectedKRId);
  const latestApproved = selectedKR
    ? getLatestApprovedValue(selectedKR.id, allUpdateRequests)
    : undefined;
  const currentProgress = selectedKR
    ? calculateDirectKRProgress(selectedKR, latestApproved)
    : { progress: 0 };

  const addEvidenceItem = () => {
    setEvidenceItems([
      ...evidenceItems,
      { type: "note", content: "", fileName: undefined },
    ]);
  };

  const removeEvidenceItem = (index: number) => {
    setEvidenceItems(evidenceItems.filter((_, i) => i !== index));
  };

  const updateEvidenceItem = (index: number, patch: Partial<typeof evidenceItems[0]>) => {
    setEvidenceItems(
      evidenceItems.map((e, i) => (i === index ? { ...e, ...patch } : e))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKRId) {
      toast.error("يجب اختيار نتيجة رئيسية.");
      return;
    }
    if (!submitterNotes.trim()) {
      toast.error("ملاحظات الإنجاز مطلوبة.");
      return;
    }
    if (!execCheck.eligible) {
      toast.error(execCheck.reason ?? "الهدف غير مؤهّل للتنفيذ.");
      return;
    }
    if (!submitCheck.canSubmit) {
      toast.error(submitCheck.reason ?? "لا يمكنك تسجيل تحديث لهذا الهدف.");
      return;
    }
    startTransition(() => {
      const req = createUpdateRequest({
        objectiveId: objective.id,
        keyResultId: selectedKRId,
        submitterUserId: currentUser.id,
        submitterNotes: submitterNotes.trim(),
      });
      // أضف الأدلة
      for (const item of evidenceItems) {
        if (!item.content.trim()) continue;
        addEvidence(
          req.id,
          item.type,
          item.content.trim(),
          currentUser.id,
          item.type === "file" && item.fileName?.trim()
            ? { fileName: item.fileName.trim() }
            : undefined
        );
      }
      toast.success("تم إرسال طلب التحديث بنجاح — بانتظار المراجعة.");
      router.push(`/app/updates/${req.id}`);
    });
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأهداف", href: "/app/objectives" },
          { label: objective.title, href: `/app/objectives/${objective.id}` },
          { label: "تسجيل تحديث إنجاز" },
        ]}
      />

      <PageHeader
        title="تسجيل تحديث إنجاز"
        description={`الهدف: ${objective.title}`}
      />

      {/* تنبيهات الأهلية */}
      {!execCheck.eligible && execCheck.reason && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>{execCheck.reason}</span>
        </div>
      )}
      {!submitCheck.canSubmit && submitCheck.reason && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>{submitCheck.reason}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* اختيار KR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اختر النتيجة الرئيسية</CardTitle>
            <CardDescription>
              يمكنك تسجيل التحديث للنتائج المباشرة فقط. النتائج الداعمة يُحتسب تقدّمها تلقائياً.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {directKRs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد نتائج رئيسية مباشرة في هذا الهدف.
              </p>
            ) : (
              <div className="space-y-2">
                {directKRs.map((kr) => {
                  const krCheck = isKREligibleForDirectUpdate(kr);
                  const isSelected = selectedKRId === kr.id;
                  return (
                    <label
                      key={kr.id}
                      className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="kr"
                        checked={isSelected}
                        onChange={() => setSelectedKRId(kr.id)}
                        className="size-4 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <KeyResultCard kr={kr} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* سياق KR المختار */}
        {selectedKR && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">السياق الحالي</CardTitle>
              <CardDescription>
                القيمة الفعلية الحالية محسوبة من آخر تحديث معتمد — لا يدخلها المُرسِل.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="المرجعية" value={String(selectedKR.baseline ?? "—")} unit={selectedKR.unit} />
                <Metric label="الهدف" value={String(selectedKR.target ?? "—")} unit={selectedKR.unit} />
                <Metric
                  label="القيمة الحالية المعتمدة"
                  value={
                    latestApproved?.kind === "numeric"
                      ? String(latestApproved.numericValue)
                      : latestApproved?.kind === "binary"
                        ? latestApproved.binaryValue
                          ? "تحقق"
                          : "لم يتحقق"
                        : "—"
                  }
                  unit={selectedKR.unit}
                />
                <Metric label="التقدّم الحالي" value={formatProgress(currentProgress.progress)} unit="%" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ملاحظات الإنجاز */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              ملاحظات الإنجاز <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>
              اشرح ما تم إنجازه. القيمة الفعلية يُدخلها المراجع لاحقاً — لا تُدخلها أنت.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={submitterNotes}
              onChange={(e) => setSubmitterNotes(e.target.value)}
              placeholder="مثال: تم إنجاز المرحلة الأولى من أتمتة الخدمات. نسبة الإنجاز 50%..."
              rows={4}
              className="resize-none"
              required
            />
          </CardContent>
        </Card>

        {/* الأدلة */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">الأدلة (اختياري)</CardTitle>
                <CardDescription>
                  أرفق ملاحظات أو ملفات أو روابط تدعم تحديثك.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEvidenceItem}
              >
                <Plus className="size-4" />
                إضافة دليل
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidenceItems.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                لا توجد أدلة مرفقة. يمكنك إضافتها أو المتابعة بدونها.
              </p>
            ) : (
              evidenceItems.map((item, idx) => (
                <div key={idx} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      دليل #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => removeEvidenceItem(idx)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Label className="text-xs">النوع</Label>
                    <select
                      value={item.type}
                      onChange={(e) =>
                        updateEvidenceItem(idx, { type: e.target.value as EvidenceType })
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs sm:col-span-2"
                    >
                      <option value="note">ملاحظة</option>
                      <option value="file">ملف</option>
                      <option value="link">رابط</option>
                    </select>
                  </div>
                  {item.type === "file" && (
                    <Input
                      placeholder="اسم الملف (مثال: تقرير.pdf)"
                      value={item.fileName ?? ""}
                      onChange={(e) =>
                        updateEvidenceItem(idx, { fileName: e.target.value })
                      }
                      className="h-9"
                    />
                  )}
                  <Textarea
                    placeholder={
                      item.type === "note"
                        ? "اكتب ملاحظتك..."
                        : item.type === "file"
                          ? "وصف مختصر للملف..."
                          : "الصق الرابط هنا..."
                    }
                    value={item.content}
                    onChange={(e) =>
                      updateEvidenceItem(idx, { content: e.target.value })
                    }
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href={`/app/objectives/${objective.id}`}>إلغاء</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending || !execCheck.eligible || !submitCheck.canSubmit || !selectedKRId}
          >
            <Save className="size-4" />
            {isPending ? "جاري الإرسال..." : "إرسال الطلب للمراجعة"}
          </Button>
        </div>
      </form>
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
