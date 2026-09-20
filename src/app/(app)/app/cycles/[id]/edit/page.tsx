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
  CycleFormFields,
  type CycleFormValues,
} from "@/components/forms/cycle-form-fields";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  validateCycleDates,
  getCycleEditableFields,
  canEditCycle,
} from "@/lib/services/institutional";
import type { CycleType } from "@/lib/data/types";

export default function EditCyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["cycles.update"]}>
      <EditCycleForm cycleId={id} />
    </ProtectedRoute>
  );
}

function EditCycleForm({ cycleId }: { cycleId: string }) {
  const router = useRouter();
  const cycles = useInstitutionalStore((s) => s.cycles);
  const updateCycle = useInstitutionalStore((s) => s.updateCycle);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof CycleFormValues, string>>>({});

  const cycle = cycles.find((c) => c.id === cycleId);

  const [values, setValues] = useState<CycleFormValues>(() => {
    if (cycle) {
      return {
        name: cycle.name,
        description: cycle.description ?? "",
        type: cycle.type,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      };
    }
    return {
      name: "",
      description: "",
      type: "quarterly",
      startDate: "",
      endDate: "",
    };
  });

  if (!cycle) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الدورة غير موجودة"
            description="ربما تم حذف الدورة أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/cycles">العودة إلى قائمة الدورات</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // إذا كانت الدورة مكتملة — لا يسمح بالتعديل إطلاقاً
  if (!canEditCycle(cycle.status)) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الدورة مكتملة"
            description="لا يمكن تعديل دورة مكتملة — بياناتها للقراءة فقط كمرجع تاريخي."
            action={
              <Button asChild variant="outline">
                <Link href={`/app/cycles/${cycle.id}`}>عرض الدورة</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const editableFields = getCycleEditableFields(cycle.status);
  // معرّف ثابت بعد فحص الوجود — يضمن عدم فقدان التخصيص داخل العمليات
  const currentCycleId = cycle.id;

  const setField = (patch: Partial<CycleFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  function validate(): boolean {
    const e: Partial<Record<keyof CycleFormValues, string>> = {};
    if (!values.name.trim()) e.name = "اسم الدورة مطلوب.";
    if (!values.type) e.type = "نوع الدورة مطلوب.";
    if (!values.startDate) e.startDate = "تاريخ البداية مطلوب.";
    if (!values.endDate) e.endDate = "تاريخ النهاية مطلوب.";
    if (values.startDate && values.endDate) {
      const dateResult = validateCycleDates(values.startDate, values.endDate);
      if (!dateResult.valid) e.endDate = dateResult.error;
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
      // فقط الحقول القابلة للتعديل تُحدّث
      const patch: Partial<CycleFormValues> = {};
      for (const field of editableFields) {
        // @ts-expect-error — indexing with keyof
        patch[field] = values[field];
      }
      updateCycle(currentCycleId, patch as any);
      toast.success("تم حفظ التعديلات بنجاح.");
      router.push(`/app/cycles/${currentCycleId}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "دورات OKR", href: "/app/cycles" },
          { label: cycle.name, href: `/app/cycles/${cycle.id}` },
          { label: "تعديل" },
        ]}
      />
      <PageHeader
        title={`تعديل: ${cycle.name}`}
        description="عدّل بيانات الدورة. الحقول المقيدة تُعرض مع شرح."
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        <CycleFormFields
          values={values}
          onChange={setField}
          errors={errors}
          editableFields={editableFields}
        />
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href={`/app/cycles/${cycle.id}`}>
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
