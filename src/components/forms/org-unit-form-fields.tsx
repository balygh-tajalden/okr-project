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
  ORG_UNIT_TYPE_LABELS,
  type OrgUnit,
  type OrgUnitType,
} from "@/lib/data/types";
import { AlertCircle } from "lucide-react";

export interface OrgUnitFormValues {
  name: string;
  type: OrgUnitType;
  parentId: string; // "" = لا أحد (جذر)
  code: string;
  description: string;
}

interface OrgUnitFormFieldsProps {
  values: OrgUnitFormValues;
  onChange: (patch: Partial<OrgUnitFormValues>) => void;
  errors: Partial<Record<keyof OrgUnitFormValues, string>>;
  orgUnits: OrgUnit[];
  /** معرّف الوحدة قيد التعديل (لمنع الأجداد من الظهور كآباء — تجنّب الحلقات) */
  selfId?: string;
}

export function OrgUnitFormFields({
  values,
  onChange,
  errors,
  orgUnits,
  selfId,
}: OrgUnitFormFieldsProps) {
  // رتّب الوحدات هرمياً للعرض
  const sorted = useMemoSorted(orgUnits, selfId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">معلومات الجهة</CardTitle>
        <CardDescription>
          البيانات الأساسية للجهة التنظيمية وموقعها في الهيكل.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم الجهة" required error={errors.name}>
          <Input
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="مثال: إدارة تطوير الأنظمة"
          />
        </Field>
        <Field label="نوع الجهة" required error={errors.type}>
          <Select
            value={values.type}
            onValueChange={(v) => onChange({ type: v as OrgUnitType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORG_UNIT_TYPE_LABELS) as OrgUnitType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ORG_UNIT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الجهة الأم" required={false} error={errors.parentId}>
          <Select
            value={values.parentId || "none"}
            onValueChange={(v) =>
              onChange({ parentId: v === "none" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="بدون (جذر)" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="none">بدون (جذر)</SelectItem>
              {sorted.map((u) => {
                const depth = getDepth(u, orgUnits);
                return (
                  <SelectItem key={u.id} value={u.id}>
                    <span
                      style={{ display: "inline-block", width: `${depth * 12}px` }}
                    />
                    {ORG_UNIT_TYPE_LABELS[u.type]}: {u.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            يتم التحقق تلقائياً من عدم تكوّن حلقات في الشجرة.
          </p>
        </Field>
        <Field label="رمز الجهة" error={errors.code}>
          <Input
            value={values.code}
            onChange={(e) => onChange({ code: e.target.value })}
            placeholder="مثال: IT-DEV"
            dir="ltr"
            className="text-right"
          />
        </Field>
        <Field label="الوصف" className="sm:col-span-2">
          <Textarea
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="وصف موجز لمسؤوليات هذه الجهة..."
            rows={2}
            className="resize-none"
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function getDepth(unit: OrgUnit, all: OrgUnit[]): number {
  let depth = 0;
  let current = unit;
  while (current.parentId) {
    depth++;
    const parent = all.find((u) => u.id === current.parentId);
    if (!parent) break;
    current = parent;
    if (depth > 10) break;
  }
  return depth;
}

/** useMemoSorted — يرتّب الوحدات هرمياً مع استبعاد الذرية في وضع التعديل */
import { useMemo } from "react";
function useMemoSorted(orgUnits: OrgUnit[], selfId?: string): OrgUnit[] {
  return useMemo(() => {
    if (!selfId) return orgUnits;
    // استبعد الذات والذريّة من خيارات الوالد (لتجنّب الحلقة)
    const forbidden = new Set<string>([selfId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const u of orgUnits) {
        if (u.parentId && forbidden.has(u.parentId) && !forbidden.has(u.id)) {
          forbidden.add(u.id);
          changed = true;
        }
      }
    }
    return orgUnits.filter((u) => !forbidden.has(u.id));
  }, [orgUnits, selfId]);
}
