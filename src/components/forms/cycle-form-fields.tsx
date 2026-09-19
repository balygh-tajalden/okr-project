"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CYCLE_TYPE_LABELS,
  type CycleType,
} from "@/lib/data/types";
import { AlertCircle, Calendar } from "lucide-react";

export interface CycleFormValues {
  name: string;
  description: string;
  type: CycleType;
  startDate: string;
  endDate: string;
}

interface CycleFormFieldsProps {
  values: CycleFormValues;
  onChange: (patch: Partial<CycleFormValues>) => void;
  errors: Partial<Record<keyof CycleFormValues, string>>;
  /** الحقول القابلة للتعديل (يتم تعطيل الباقي) */
  editableFields?: Array<keyof CycleFormValues>;
  /** هل الدورة مكتملة (تعطيل كل الحقول تقريباً) */
  readOnly?: boolean;
}

export function CycleFormFields({
  values,
  onChange,
  errors,
  editableFields,
  readOnly,
}: CycleFormFieldsProps) {
  const isFieldEditable = (field: keyof CycleFormValues): boolean => {
    if (readOnly) return false;
    if (!editableFields) return true;
    return editableFields.includes(field);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">معلومات الدورة</CardTitle>
        <CardDescription>
          بيانات دورة OKR. تُنشأ دائماً في حالة "مسودة" ثم تُفعّل لاحقاً.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm font-medium">
            اسم الدورة <span className="text-destructive">*</span>
          </Label>
          <Input
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="مثال: دورة Q1 2025 الربع سنوية"
            disabled={!isFieldEditable("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm font-medium">الوصف</Label>
          <Textarea
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="وصف موجز للدورة وأهدافها..."
            rows={2}
            className="resize-none"
            disabled={!isFieldEditable("description")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            النوع <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.type}
            onValueChange={(v) => onChange({ type: v as CycleType })}
            disabled={!isFieldEditable("type")}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CYCLE_TYPE_LABELS) as CycleType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {CYCLE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              {errors.type}
            </p>
          )}
        </div>

        <div className="space-y-1.5" />

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            تاريخ البداية <span className="text-destructive">*</span>
          </Label>
          <Input
            type="date"
            value={values.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            disabled={!isFieldEditable("startDate")}
          />
          {errors.startDate && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              {errors.startDate}
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
            disabled={!isFieldEditable("endDate")}
          />
          {errors.endDate && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              {errors.endDate}
            </p>
          )}
        </div>

        {errors.endDate && (
          <div className="sm:col-span-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-2">
            {errors.endDate}
          </div>
        )}

        {!isFieldEditable("name") && !isFieldEditable("type") && (
          <div className="sm:col-span-2 text-xs text-warning-foreground bg-warning/10 border border-warning/30 rounded-md p-2">
            ⚠ الدورة نشطة — يمكن تعديل الوصف فقط لتجنّب إبطال سياق التنفيذ.
          </div>
        )}
        {readOnly && (
          <div className="sm:col-span-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-2">
            الدورة مكتملة — بياناتها للقراءة فقط (مرجع تاريخي).
          </div>
        )}
      </CardContent>
    </Card>
  );
}
