"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  KeyResultCard,
} from "@/components/common/key-result-card";
import {
  KrProgressSourceBadge,
} from "@/components/common/phase3-badges";
import {
  OBJECTIVE_TYPE_LABELS,
  KR_PROGRESS_SOURCE_LABELS,
  KR_DIRECT_TYPE_LABELS,
  type ObjectiveType,
  type KeyResult,
  type KrProgressSource,
  type KrDirectType,
} from "@/lib/data/phase3-types";
import type { Cycle, OrgUnit, User } from "@/lib/data/types";
import { deriveDirection } from "@/lib/services/phase3-services";
import { toast } from "sonner";

/**
 * نموذج إنشاء/تعديل الهدف مع محرر النتائج الرئيسية الديناميكي
 * ===================================================================
 * - بيانات الهدف (العنوان، الوصف، النوع، الدورة، الجهة، المالك، التواريخ، المساهمون)
 * - محرر النتائج الرئيسية (إضافة/تعديل/حذف، مع تكوين القياس حسب المصدر)
 * - اختيار المحاذاة (إذا كان الهدف داعماً)
 */

export interface ObjectiveFormValues {
  title: string;
  description: string;
  type: ObjectiveType;
  ownerId: string;
  orgUnitId: string;
  cycleId: string;
  startDate: string;
  endDate: string;
  contributorUserIds: string[];
  upstreamKeyResultId?: string;
  keyResults: KeyResultDraft[];
}

export interface KeyResultDraft {
  id?: string; // للنتائج الموجودة مسبقاً عند التعديل
  title: string;
  description?: string;
  progressSource: KrProgressSource;
  directType?: KrDirectType;
  unit?: string;
  baseline?: number;
  target?: number;
  upstreamKeyResultId?: string;
}

interface ObjectiveFormFieldsProps {
  values: ObjectiveFormValues;
  onChange: (patch: Partial<ObjectiveFormValues>) => void;
  errors: Record<string, string | string[]>;
  cycles: Cycle[];
  orgUnits: OrgUnit[];
  users: User[];
  /** الجهات المتاحة (مفلترة بالنطاق) */
  availableOrgUnitIds?: Set<string>;
  /** المستخدمون المتاحون (مفلتر بالنطاق) */
  availableUserIds?: Set<string>;
  /** خيارات KR العليا للمحاذاة (إن وُجدت) */
  upstreamKROptions?: Array<{ kr: KeyResult; objectiveTitle: string }>;
  mode: "create" | "edit";
  /** هل حالة الهدف تسمح بالتعديل */
  canEditKRs: boolean;
  /** دورة الهدف الحالية (للتحقق من التواريخ ضمن فترتها) */
  selectedCycle?: Cycle;
}

export function ObjectiveFormFields({
  values,
  onChange,
  errors,
  cycles,
  orgUnits,
  users,
  availableOrgUnitIds,
  availableUserIds,
  upstreamKROptions,
  mode,
  canEditKRs,
  selectedCycle,
}: ObjectiveFormFieldsProps) {
  const [krEditing, setKrEditing] = useState<number | null>(null);

  // تحديث KR محدّد
  const updateKR = (index: number, patch: Partial<KeyResultDraft>) => {
    const newKRs = [...values.keyResults];
    newKRs[index] = { ...newKRs[index], ...patch };
    // إذا تغيّر baseline أو target، أعد حساب الاتجاه
    if (
      patch.baseline !== undefined ||
      patch.target !== undefined
    ) {
      const kr = newKRs[index];
      if (kr.progressSource === "direct" && kr.directType === "numeric" && kr.baseline != null && kr.target != null) {
        // الاتجاه يُحفظ ضمنياً في baseline/target — لا حاجة لتخزينه في Draft
      }
    }
    onChange({ keyResults: newKRs });
  };

  const addKR = () => {
    const newKR: KeyResultDraft = {
      title: "",
      description: "",
      progressSource: "direct",
      directType: "numeric",
      unit: "",
      baseline: 0,
      target: 0,
    };
    onChange({ keyResults: [...values.keyResults, newKR] });
    setKrEditing(values.keyResults.length); // افتح المحرر للـ KR الجديد
  };

  const removeKR = (index: number) => {
    onChange({ keyResults: values.keyResults.filter((_, i) => i !== index) });
  };

  const isFieldError = (key: string): boolean => !!errors[key];

  return (
    <div className="space-y-6">
      {/* ============ بيانات الهدف ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بيانات الهدف</CardTitle>
          <CardDescription>المعلومات الأساسية للهدف وارتباطاته المؤسسية.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm font-medium">
              عنوان الهدف <span className="text-destructive">*</span>
            </Label>
            <Input
              value={values.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="مثال: رفع كفاءة الخدمات الرقمية للمؤسسة"
            />
            {isFieldError("title") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.title as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm font-medium">الوصف</Label>
            <Textarea
              value={values.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="وصف موجز للهدف وسياقه..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              نوع الهدف <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.type}
              onValueChange={(v) => onChange({ type: v as ObjectiveType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(OBJECTIVE_TYPE_LABELS) as ObjectiveType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {OBJECTIVE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              المؤسسي: يُعتمد من الإدارة العليا • التنظيمي: من الجهة الأم المباشرة • الفردي: يُسند لموظف
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              دورة OKR <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.cycleId}
              onValueChange={(v) => onChange({ cycleId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الدورة" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    disabled={c.status === "completed"}
                  >
                    {c.name} ({c.startDate} ← {c.endDate})
                    {c.status === "completed" && " — مكتملة"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFieldError("cycleId") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.cycleId as string}
              </p>
            )}
            {selectedCycle && (
              <p className="text-[11px] text-muted-foreground">
                فترة الدورة: {selectedCycle.startDate} — {selectedCycle.endDate}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              الجهة التنظيمية <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.orgUnitId}
              onValueChange={(v) => onChange({ orgUnitId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الجهة" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {orgUnits
                  .filter((u) => !availableOrgUnitIds || availableOrgUnitIds.has(u.id))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {isFieldError("orgUnitId") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.orgUnitId as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              المالك <span className="text-destructive">*</span>
            </Label>
            <Select
              value={values.ownerId}
              onValueChange={(v) => onChange({ ownerId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المالك" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {users
                  .filter((u) => !availableUserIds || availableUserIds.has(u.id))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {isFieldError("ownerId") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.ownerId as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              تاريخ البداية <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={values.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
            {isFieldError("startDate") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.startDate as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              تاريخ النهاية <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={values.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
            {isFieldError("endDate") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.endDate as string}
              </p>
            )}
          </div>

          {/* التواريخ ضمن الدورة */}
          {Array.isArray(errors.dates) && errors.dates.length > 0 && (
            <div className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              {errors.dates.map((e, i) => (
                <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-3" />
                  {e}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ المحاذاة (إذا كانت متاحة) ============ */}
      {upstreamKROptions && upstreamKROptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المحاذاة (هدف داعم)</CardTitle>
            <CardDescription>
              إن كان الهدف داعماً لنتيجة رئيسية أعلى في الجهة الأم المباشرة (نفس الدورة).
              اتركه فارغاً إذا لم يكن داعماً.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={values.upstreamKeyResultId ?? "none"}
              onValueChange={(v) =>
                onChange({ upstreamKeyResultId: v === "none" ? undefined : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="بدون محاذاة" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">بدون محاذاة (هدف مستقل)</SelectItem>
                {upstreamKROptions.map(({ kr, objectiveTitle }) => (
                  <SelectItem key={kr.id} value={kr.id}>
                    {kr.title} — من هدف: {objectiveTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {values.upstreamKeyResultId && (
              <p className="mt-2 text-[11px] text-info flex items-center gap-1">
                <AlertCircle className="size-3" />
                سيُعتبر هذا الهدف هدفاً داعماً عند الحفظ.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============ المساهمون ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المساهمون</CardTitle>
          <CardDescription>
            مستخدمون إضافيون يشاركون في تنفيذ الهدف (لا يملكون صلاحية المالك).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد مستخدمون متاحون.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {users
                .filter((u) => u.id !== values.ownerId)
                .filter((u) => !availableUserIds || availableUserIds.has(u.id))
                .map((u) => {
                  const checked = values.contributorUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                        checked ? "bg-primary/5 border-primary/30" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          if (c) {
                            onChange({
                              contributorUserIds: [...values.contributorUserIds, u.id],
                            });
                          } else {
                            onChange({
                              contributorUserIds: values.contributorUserIds.filter((id) => id !== u.id),
                            });
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {u.jobTitle}
                        </div>
                      </div>
                    </label>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ النتائج الرئيسية ============ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                النتائج الرئيسية{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  ({values.keyResults.length})
                </span>
              </CardTitle>
              <CardDescription>
                على الأقل نتيجة واحدة قبل الإرسال للمراجعة.
              </CardDescription>
            </div>
            {canEditKRs && (
              <Button type="button" variant="outline" size="sm" onClick={addKR}>
                <Plus className="size-4" />
                إضافة نتيجة
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.isArray(errors.keyResults) && errors.keyResults.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              {errors.keyResults.map((e, i) => (
                <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-3" />
                  {e}
                </p>
              ))}
            </div>
          )}
          {values.keyResults.length === 0 ? (
            <div className="text-center py-8 rounded-md border border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-2">
                لا توجد نتائج رئيسية بعد.
              </p>
              {canEditKRs && (
                <Button type="button" variant="outline" size="sm" onClick={addKR}>
                  <Plus className="size-4" />
                  أضف أول نتيجة رئيسية
                </Button>
              )}
            </div>
          ) : (
            values.keyResults.map((kr, idx) => (
              <div key={idx} className="space-y-2">
                {krEditing === idx ? (
                  <KeyResultEditor
                    draft={kr}
                    onChange={(patch) => updateKR(idx, patch)}
                    onClose={() => setKrEditing(null)}
                  />
                ) : (
                  <div className="relative">
                    <KeyResultCard
                      kr={convertDraftToKR(kr, "temp-" + idx)}
                      canEdit={canEditKRs}
                      onEdit={() => setKrEditing(idx)}
                      onDelete={() => removeKR(idx)}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** محرر نتيجة رئيسية (inline) */
function KeyResultEditor({
  draft,
  onChange,
  onClose,
}: {
  draft: KeyResultDraft;
  onChange: (patch: Partial<KeyResultDraft>) => void;
  onClose: () => void;
}) {
  const direction =
    draft.progressSource === "direct" &&
    draft.directType === "numeric" &&
    draft.baseline != null &&
    draft.target != null
      ? deriveDirection(draft.baseline, draft.target)
      : "ascending";

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-primary">تعديل النتيجة الرئيسية</span>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              <Save className="size-3.5" />
              تم
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            عنوان النتيجة <span className="text-destructive">*</span>
          </Label>
          <Input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="مثال: رفع نسبة الخدمات المؤتمتة إلى 80%"
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">الوصف</Label>
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="وصف موجز..."
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              مصدر التقدّم <span className="text-destructive">*</span>
            </Label>
            <Select
              value={draft.progressSource}
              onValueChange={(v) => {
                const patch: Partial<KeyResultDraft> = { progressSource: v as KrProgressSource };
                if (v === "direct" && !draft.directType) patch.directType = "numeric";
                if (v === "supporting") {
                  // أزل حقول القياس المباشر
                  patch.directType = undefined;
                  patch.unit = undefined;
                  patch.baseline = undefined;
                  patch.target = undefined;
                }
                onChange(patch);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KR_PROGRESS_SOURCE_LABELS) as KrProgressSource[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {KR_PROGRESS_SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {draft.progressSource === "direct" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                نوع القياس <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.directType ?? "numeric"}
                onValueChange={(v) => {
                  const patch: Partial<KeyResultDraft> = { directType: v as KrDirectType };
                  if (v === "binary") {
                    patch.unit = undefined;
                    patch.baseline = undefined;
                    patch.target = undefined;
                  }
                  onChange(patch);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KR_DIRECT_TYPE_LABELS) as KrDirectType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {KR_DIRECT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* حقول القياس العددي */}
        {draft.progressSource === "direct" && draft.directType === "numeric" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">الوحدة</Label>
              <Input
                value={draft.unit ?? ""}
                onChange={(e) => onChange({ unit: e.target.value })}
                placeholder="%، ريال، ساعة..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">القيمة المرجعية (baseline)</Label>
              <Input
                type="number"
                value={draft.baseline ?? 0}
                onChange={(e) => onChange({ baseline: Number(e.target.value) })}
                className="h-9 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">القيمة المستهدفة (target)</Label>
              <Input
                type="number"
                value={draft.target ?? 0}
                onChange={(e) => onChange({ target: Number(e.target.value) })}
                className="h-9 tabular-nums"
              />
            </div>
            <div className="sm:col-span-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
              {direction === "descending" ? (
                <TrendingDown className="size-3.5 text-info" />
              ) : (
                <TrendingUp className="size-3.5 text-success" />
              )}
              الاتجاه المشتق تلقائياً:{" "}
              <span className="font-medium text-foreground">
                {direction === "ascending" ? "تصاعدي" : "تنازلي"}
              </span>
            </div>
          </div>
        )}

        {/* رسالة للأهداف الداعمة */}
        {draft.progressSource === "supporting" && (
          <div className="rounded-md border border-info/30 bg-info/5 p-3 text-xs text-foreground">
            <span className="text-muted-foreground">ملاحظة: </span>
            يتم احتساب تقدّم هذه النتيجة من الأهداف الداعمة المرتبطة بها لاحقاً. لا يمكن إدخال قيم تقدّم يدوية هنا.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** يحوّل Draft إلى KR وهمي للعرض فقط */
function convertDraftToKR(draft: KeyResultDraft, tempId: string): KeyResult {
  const direction =
    draft.progressSource === "direct" &&
    draft.directType === "numeric" &&
    draft.baseline != null &&
    draft.target != null
      ? deriveDirection(draft.baseline, draft.target)
      : "ascending";
  return {
    id: draft.id ?? tempId,
    objectiveId: "draft",
    title: draft.title || "نتيجة بدون عنوان",
    description: draft.description,
    progressSource: draft.progressSource,
    directType: draft.directType,
    unit: draft.unit,
    baseline: draft.baseline,
    target: draft.target,
    direction,
    upstreamKeyResultId: draft.upstreamKeyResultId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
