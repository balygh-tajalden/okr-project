"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, CheckCheck } from "lucide-react";
import {
  PERMISSION_DEFS,
  permissionsByGroup,
  PERMISSION_GROUP_LABELS,
  type Permission,
  type PermissionGroupKey,
} from "@/lib/auth/permissions-v2";

export interface RoleFormValues {
  name: string;
  description: string;
  permissions: Permission[];
}

interface RoleFormFieldsProps {
  values: RoleFormValues;
  onChange: (patch: Partial<RoleFormValues>) => void;
  errors: Partial<Record<keyof RoleFormValues, string>>;
  /** هل الدور نظامي (يمنع تعديل الصلاحيات تجنّب الإتلاف) */
  isSystem?: boolean;
}

export function RoleFormFields({
  values,
  onChange,
  errors,
  isSystem,
}: RoleFormFieldsProps) {
  const grouped = useMemo(() => permissionsByGroup(), []);
  const permSet = useMemo(() => new Set(values.permissions), [values.permissions]);

  const togglePermission = (perm: Permission) => {
    if (permSet.has(perm)) {
      onChange({ permissions: values.permissions.filter((p) => p !== perm) });
    } else {
      onChange({ permissions: [...values.permissions, perm] });
    }
  };

  const toggleGroup = (group: PermissionGroupKey) => {
    const groupPerms = grouped[group].map((p) => p.key);
    const allSelected = groupPerms.every((p) => permSet.has(p));
    if (allSelected) {
      // أزل صلاحيات هذه المجموعة
      onChange({
        permissions: values.permissions.filter((p) => !groupPerms.includes(p)),
      });
    } else {
      // أضف صلاحيات هذه المجموعة
      const newSet = new Set(values.permissions);
      for (const p of groupPerms) newSet.add(p);
      onChange({ permissions: Array.from(newSet) });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات الدور</CardTitle>
          <CardDescription>
            اسم الدور ووصفه. استخدم أسماء واضحة بالعربية.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              اسم الدور <span className="text-destructive">*</span>
            </Label>
            <Input
              value={values.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="مثال: مراجع الجودة"
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
              placeholder="وصف موجز لمسؤوليات الدور..."
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCheck className="size-4" />
            الصلاحيات
          </CardTitle>
          <CardDescription>
            اختر الصلاحيات المُسندة لهذا الدور. الصلاحيات الفعلية لأي مستخدم = اتحاد صلاحيات
            أدواره المسندة.
            {isSystem && (
              <span className="block mt-1 text-xs text-warning-foreground bg-warning/10 border border-warning/30 rounded px-2 py-1">
                ⚠ هذا دور نظامي. التعديل على صلاحياته قد يؤثر على إدارة النظام.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.permissions && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              {errors.permissions}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              الصلاحيات المحددة:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {values.permissions.length}
              </span>{" "}
              من {PERMISSION_DEFS.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({
                  permissions:
                    values.permissions.length === PERMISSION_DEFS.length
                      ? []
                      : PERMISSION_DEFS.map((p) => p.key),
                })
              }
            >
              {values.permissions.length === PERMISSION_DEFS.length
                ? "إلغاء تحديد الكل"
                : "تحديد الكل"}
            </Button>
          </div>

          {Object.entries(grouped).map(([groupKey, perms]) => {
            const groupPerms = perms.map((p) => p.key);
            const selectedCount = groupPerms.filter((p) => permSet.has(p)).length;
            const allSelected = selectedCount === groupPerms.length;
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <div
                key={groupKey}
                className="rounded-md border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleGroup(groupKey as PermissionGroupKey)}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {PERMISSION_GROUP_LABELS[groupKey as PermissionGroupKey]}
                    </span>
                    {someSelected && (
                      <span className="text-[10px] text-muted-foreground">
                        ({selectedCount}/{groupPerms.length})
                      </span>
                    )}
                  </label>
                </div>
                <div className="grid gap-1.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {perms.map((p) => {
                    const checked = permSet.has(p.key);
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-2 rounded p-1.5 cursor-pointer transition-colors ${
                          checked
                            ? "bg-primary/5"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePermission(p.key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground">
                            {p.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground line-clamp-2">
                            {p.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
