"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useInstitutionalStore } from "@/lib/data/store";
import { wouldCreateCycle } from "@/lib/services/institutional";
import type { OrgUnitType } from "@/lib/data/types";

export default function NewOrgUnitPage() {
  return (
    <ProtectedRoute requiredPermissions={["organization.manage"]}>
      <Suspense fallback={<div className="p-6">جاري التحميل...</div>}>
        <NewOrgUnitForm />
      </Suspense>
    </ProtectedRoute>
  );
}

function NewOrgUnitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const createOrgUnit = useInstitutionalStore((s) => s.createOrgUnit);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof OrgUnitFormValues, string>>>({});

  const presetParentId = searchParams.get("parentId") ?? "";

  const [values, setValues] = useState<OrgUnitFormValues>({
    name: "",
    type: "department",
    parentId: presetParentId,
    code: "",
    description: "",
  });

  const setField = (patch: Partial<OrgUnitFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  function validate(): boolean {
    const e: Partial<Record<keyof OrgUnitFormValues, string>> = {};
    if (!values.name.trim()) e.name = "اسم الجهة مطلوب.";
    if (!values.type) e.type = "نوع الجهة مطلوب.";
    // التحقق من الحلقات: parentId فارغ = جذر (مسموح)
    // لا حاجة لفحص الحلقات عند الإنشاء لأن الوحدة لا توجد بعد.
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
      const created = createOrgUnit({
        name: values.name.trim(),
        type: values.type as OrgUnitType,
        parentId: values.parentId || null,
        code: values.code.trim() || undefined,
        description: values.description.trim() || undefined,
      });
      toast.success(`تم إنشاء الجهة "${created.name}" بنجاح.`);
      router.push(`/app/organization/${created.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الهيكل التنظيمي", href: "/app/organization" },
          { label: "إنشاء جهة" },
        ]}
      />
      <PageHeader
        title="إنشاء جهة تنظيمية"
        description="أنشئ جهة جديدة في الهيكل التنظيمي واربطها بجهة أم."
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        <OrgUnitFormFields
          values={values}
          onChange={setField}
          errors={errors}
          orgUnits={orgUnits}
        />
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href="/app/organization">
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ الجهة"}
          </Button>
        </div>
      </form>
    </div>
  );
}
