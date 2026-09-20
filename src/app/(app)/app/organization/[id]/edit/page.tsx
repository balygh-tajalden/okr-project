"use client";

import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  OrgUnitFormFields,
  type OrgUnitFormValues,
} from "@/components/forms/org-unit-form-fields";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { useInstitutionalStore } from "@/lib/data/store";
import { wouldCreateCycle } from "@/lib/services/institutional";
import type { OrgUnitType } from "@/lib/data/types";

export default function EditOrgUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["organization.manage"]}>
      <EditOrgUnitForm unitId={id} />
    </ProtectedRoute>
  );
}

function EditOrgUnitForm({ unitId }: { unitId: string }) {
  const router = useRouter();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const updateOrgUnit = useInstitutionalStore((s) => s.updateOrgUnit);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof OrgUnitFormValues, string>>>({});

  const unit = orgUnits.find((u) => u.id === unitId);

  const [values, setValues] = useState<OrgUnitFormValues>(() => {
    if (unit) {
      return {
        name: unit.name,
        type: unit.type,
        parentId: unit.parentId ?? "",
        code: unit.code ?? "",
        description: unit.description ?? "",
      };
    }
    return { name: "", type: "department", parentId: "", code: "", description: "" };
  });

  if (!unit) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الجهة غير موجودة"
            description="ربما تم حذف الجهة أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/organization">العودة إلى الهيكل</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const setField = (patch: Partial<OrgUnitFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  function validate(): boolean {
    const e: Partial<Record<keyof OrgUnitFormValues, string>> = {};
    if (!values.name.trim()) e.name = "اسم الجهة مطلوب.";
    if (!values.type) e.type = "نوع الجهة مطلوب.";

    // التحقق من الحلقات عند تغيير الوالد
    if (values.parentId) {
      if (wouldCreateCycle(orgUnits, unit.id, values.parentId)) {
        e.parentId =
          "لا يمكن تعيين هذه الجهة كوالدة لأنها ستشكّل حلقة في الشجرة. اختر جهة أم خارج سلسلة أبناء هذه الجهة.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      updateOrgUnit(unit.id, {
        name: values.name.trim(),
        type: values.type as OrgUnitType,
        parentId: values.parentId || null,
        code: values.code.trim() || undefined,
        description: values.description.trim() || undefined,
      });
      toast.success("تم حفظ التعديلات بنجاح.");
      router.push(`/app/organization/${unit.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الهيكل التنظيمي", href: "/app/organization" },
          { label: unit.name, href: `/app/organization/${unit.id}` },
          { label: "تعديل" },
        ]}
      />
      <PageHeader
        title={`تعديل: ${unit.name}`}
        description="عدّل بيانات الجهة وموقعها في الهيكل."
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        <OrgUnitFormFields
          values={values}
          onChange={setField}
          errors={errors}
          orgUnits={orgUnits}
          selfId={unit.id}
        />
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href={`/app/organization/${unit.id}`}>
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
