"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ORG_UNIT_TYPE_LABELS,
  type OrgUnit,
  type Role,
  type AccountStatus,
} from "@/lib/data/types";
import { ACCOUNT_STATUS_LABELS } from "@/lib/data/types";
import { AlertCircle } from "lucide-react";

/**
 * حقول نموذج المستخدم — مشتركة بين إنشاء وتعديل مستخدم
 * ===================================================================
 * - يقبل قيماً وonChange موحّد
 * - يدعم التحقق من تفرّد اسم المستخدم والبريد (عبر isUsernameTaken / isEmailTaken)
 * - يعرض رسائل خطأ عربية واضحة
 */
export interface UserFormValues {
  fullName: string;
  username: string;
  email: string;
  jobTitle: string;
  employeeId: string;
  primaryOrgUnitId: string;
  roleIds: string[];
  status: AccountStatus;
  phone: string;
  bio: string;
}

interface UserFormFieldsProps {
  values: UserFormValues;
  onChange: (patch: Partial<UserFormValues>) => void;
  errors: Partial<Record<keyof UserFormValues, string>>;
  orgUnits: OrgUnit[];
  roles: Role[];
  /** خيارات الجهات المتاحة (مفلترة بالنطاق) — للعرض فقط */
  availableOrgUnitIds?: Set<string>;
  /** الوضع: إنشاء أم تعديل */
  mode: "create" | "edit";
}

export function UserFormFields({
  values,
  onChange,
  errors,
  orgUnits,
  roles,
  availableOrgUnitIds,
  mode,
}: UserFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* معلومات الحساب */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات الحساب</CardTitle>
          <CardDescription>
            البيانات الأساسية للحساب — تُستخدم في الدخول والتعريف.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الكامل" required error={errors.fullName}>
            <Input
              value={values.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="مثال: عبدالله بن سعد المنصور"
            />
          </Field>
          <Field label="اسم المستخدم" required error={errors.username}>
            <Input
              value={values.username}
              onChange={(e) => onChange({ username: e.target.value })}
              placeholder="a.almansour"
              dir="ltr"
              className="text-right"
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground">
              أحرف لاتينية، أرقام، نقطة، شرطة، شرطة سفلية. 3 أحرف على الأقل.
            </p>
          </Field>
          <Field label="البريد الإلكتروني" required error={errors.email}>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="name@example.org"
              dir="ltr"
              className="text-right"
              autoComplete="off"
            />
          </Field>
          <Field label="رقم الموظف" required error={errors.employeeId}>
            <Input
              value={values.employeeId}
              onChange={(e) => onChange({ employeeId: e.target.value })}
              placeholder="EMP-1001"
            />
          </Field>
          <Field label="المسمى الوظيفي">
            <Input
              value={values.jobTitle}
              onChange={(e) => onChange({ jobTitle: e.target.value })}
              placeholder="مثال: محلل أعمال أول"
            />
          </Field>
          <Field
            label="حالة الحساب"
            required
            error={errors.status}
            help={
              mode === "edit"
                ? "يمكن تفعيل/إيقاف الحساب من هنا أو من صفحة التفاصيل."
                : undefined
            }
          >
            <Select
              value={values.status}
              onValueChange={(v) => onChange({ status: v as AccountStatus })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {ACCOUNT_STATUS_LABELS.active}
                </SelectItem>
                <SelectItem value="disabled">
                  {ACCOUNT_STATUS_LABELS.disabled}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* الارتباط التنظيمي */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الارتباط التنظيمي</CardTitle>
          <CardDescription>
            الجهة التنظيمية الأساسية للمستخدم — تحدّد نطاق وصوله للبيانات.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="الجهة التنظيمية الأساسية" required error={errors.primaryOrgUnitId}>
            <OrgUnitSelect
              value={values.primaryOrgUnitId}
              onChange={(v) => onChange({ primaryOrgUnitId: v })}
              orgUnits={orgUnits}
              availableIds={availableOrgUnitIds}
            />
          </Field>
        </CardContent>
      </Card>

      {/* الأدوار */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الأدوار</CardTitle>
          <CardDescription>
            يمكن إسناد أكثر من دور — تُحسب الصلاحيات الفعلية كاتحاد لصلاحيات الأدوار المسندة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد أدوار متاحة.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((r) => {
                const checked = values.roleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-start gap-2.5 rounded-md border border-border p-2.5 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        if (c) {
                          onChange({ roleIds: [...values.roleIds, r.id] });
                        } else {
                          onChange({
                            roleIds: values.roleIds.filter((id) => id !== r.id),
                          });
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {r.name}
                        </span>
                        {r.isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            نظامي
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {errors.roleIds && (
            <p className="text-xs text-destructive">{errors.roleIds}</p>
          )}
        </CardContent>
      </Card>

      {/* معلومات تواصل إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات إضافية</CardTitle>
          <CardDescription>اختياري — تظهر لزملائك في العمل المشترك.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="رقم الجوال">
            <Input
              value={values.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="05XXXXXXXX"
              inputMode="tel"
            />
          </Field>
          <Field label="نبذة مختصرة">
            <Textarea
              value={values.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              placeholder="مثال: محلل أعمال أول مهتم بتحسين تجربة المستخدم..."
              rows={2}
              maxLength={140}
              className="resize-none"
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

/** حقل بتصنيف ورسالة خطأ */
function Field({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
      {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/** منسّق اختيار جهة تنظيمية (يعرض التسلسل الهرمي) */
function OrgUnitSelect({
  value,
  onChange,
  orgUnits,
  availableIds,
}: {
  value: string;
  onChange: (v: string) => void;
  orgUnits: OrgUnit[];
  availableIds?: Set<string>;
}) {
  const filtered = availableIds
    ? orgUnits.filter((u) => availableIds.has(u.id))
    : orgUnits;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="اختر الجهة التنظيمية" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {filtered.map((u) => {
          const depth = getDepth(u, orgUnits);
          return (
            <SelectItem key={u.id} value={u.id}>
              <span style={{ display: "inline-block", width: `${depth * 12}px` }} />
              {ORG_UNIT_TYPE_LABELS[u.type]}: {u.name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
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
    if (depth > 10) break; // حماية من الحلقات
  }
  return depth;
}
