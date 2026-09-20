"use client";

import { useState, useTransition } from "react";
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
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { validateCycleDates } from "@/lib/services/institutional";
import type { CycleType } from "@/lib/data/types";

export default function NewCyclePage() {
  return (
    <ProtectedRoute requiredPermissions={["cycles.create"]}>
      <NewCycleForm />
    </ProtectedRoute>
  );
}

function NewCycleForm() {
  const router = useRouter();
  const { user } = useCurrentInstitutionalUser();
  const createCycle = useInstitutionalStore((s) => s.createCycle);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof CycleFormValues, string>>>({});

  const [values, setValues] = useState<CycleFormValues>({
    name: "",
    description: "",
    type: "quarterly",
    startDate: "",
    endDate: "",
  });

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
    if (!user) return;
    startTransition(() => {
      const created = createCycle(
        {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          type: values.type as CycleType,
          startDate: values.startDate,
          endDate: values.endDate,
        },
        user.id
      );
      toast.success(`تم إنشاء الدورة "${created.name}" بحالة مسودة.`);
      router.push(`/app/cycles/${created.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "دورات OKR", href: "/app/cycles" },
          { label: "إنشاء دورة" },
        ]}
      />
      <PageHeader
        title="إنشاء دورة OKR"
        description="أنشئ دورة تخطيط جديدة. تبدأ الدورة دائماً في حالة 'مسودة' ثم تُفعّل لاحقاً."
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        <CycleFormFields values={values} onChange={setField} errors={errors} />
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href="/app/cycles">
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ الدورة"}
          </Button>
        </div>
      </form>
    </div>
  );
}
