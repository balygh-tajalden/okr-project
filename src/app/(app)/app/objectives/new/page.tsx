"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveFormFields,
  type ObjectiveFormValues,
  type KeyResultDraft,
} from "@/components/forms/objective-form-fields";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import {
  validateObjectiveDates,
  getEligibleUpstreamKeyResults,
  deriveDirection,
} from "@/lib/services/phase3-services";
import { getAccessibleOrgUnitIds } from "@/lib/services/institutional";
import type { ObjectiveType, KrProgressSource } from "@/lib/data/phase3-types";

export default function NewObjectivePage() {
  return (
    <ProtectedRoute requiredPermissions={["goals.create"]}>
      <NewObjectiveForm />
    </ProtectedRoute>
  );
}

function NewObjectiveForm() {
  const router = useRouter();
  const { user: currentUser } = useCurrentInstitutionalUser();
  const cycles = useInstitutionalStore((s) => s.cycles);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const objectives = usePhase3Store((s) => s.objectives);
  const keyResults = usePhase3Store((s) => s.keyResults);
  const createObjective = usePhase3Store((s) => s.createObjective);
  const createKeyResult = usePhase3Store((s) => s.createKeyResult);

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});

  const [values, setValues] = useState<ObjectiveFormValues>({
    title: "",
    description: "",
    type: "organizational",
    ownerId: currentUser?.id ?? "",
    orgUnitId: currentUser?.primaryOrgUnitId ?? "",
    cycleId: "",
    startDate: "",
    endDate: "",
    contributorUserIds: [],
    upstreamKeyResultId: undefined,
    keyResults: [],
  });

  const setField = (patch: Partial<ObjectiveFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  // الجهات والمستخدمون المتاحون (ضمن نطاق المستخدم الحالي)
  const availableOrgUnitIds = useMemo(
    () => (currentUser ? getAccessibleOrgUnitIds(currentUser, orgUnits) : new Set<string>()),
    [currentUser, orgUnits]
  );

  // الدورة المختارة حالياً (للتحقق من التواريخ)
  const selectedCycle = useMemo(
    () => cycles.find((c) => c.id === values.cycleId),
    [cycles, values.cycleId]
  );

  // خيارات KR العليا للمحاذاة
  const upstreamKROptions = useMemo(() => {
    if (!values.orgUnitId || !values.cycleId) return [];
    return getEligibleUpstreamKeyResults(
      values.orgUnitId,
      values.cycleId,
      orgUnits,
      objectives,
      keyResults
    );
  }, [values.orgUnitId, values.cycleId, orgUnits, objectives, keyResults]);

  function validate(): boolean {
    const e: Record<string, string | string[]> = {};
    if (!values.title.trim()) e.title = "عنوان الهدف مطلوب.";
    if (!values.type) e.type = "نوع الهدف مطلوب.";
    if (!values.ownerId) e.ownerId = "مالك الهدف مطلوب.";
    if (!values.orgUnitId) e.orgUnitId = "الجهة التنظيمية مطلوبة.";
    if (!values.cycleId) e.cycleId = "دورة الهدف مطلوبة.";
    if (!values.startDate) e.startDate = "تاريخ البداية مطلوب.";
    if (!values.endDate) e.endDate = "تاريخ النهاية مطلوب.";

    // التحقق من التواريخ ضمن الدورة
    if (selectedCycle && values.startDate && values.endDate) {
      const dateResult = validateObjectiveDates(values.startDate, values.endDate, selectedCycle);
      if (!dateResult.valid) e.dates = dateResult.errors;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent, asDraft: boolean = true) {
    e.preventDefault();
    if (!validate()) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    if (!currentUser) return;
    startTransition(() => {
      // إنشاء الهدف أولاً
      const objective = createObjective({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        type: values.type as ObjectiveType,
        ownerId: values.ownerId,
        orgUnitId: values.orgUnitId,
        cycleId: values.cycleId,
        startDate: values.startDate,
        endDate: values.endDate,
        contributorUserIds: values.contributorUserIds,
        upstreamKeyResultId: values.upstreamKeyResultId,
      });

      // إنشاء النتائج الرئيسية المرتبطة
      for (const kr of values.keyResults) {
        createKeyResult({
          objectiveId: objective.id,
          title: kr.title.trim(),
          description: kr.description?.trim() || undefined,
          progressSource: kr.progressSource as KrProgressSource,
          directType: kr.directType,
          unit: kr.unit,
          baseline: kr.baseline,
          target: kr.target,
          direction:
            kr.progressSource === "direct" &&
            kr.directType === "numeric" &&
            kr.baseline != null &&
            kr.target != null
              ? deriveDirection(kr.baseline, kr.target)
              : undefined,
          upstreamKeyResultId: kr.upstreamKeyResultId,
        });
      }

      toast.success(`تم إنشاء الهدف "${objective.title}" بحالة مسودة.`);
      router.push(`/app/objectives/${objective.id}`);
    });
  }

  // إذا لم توجد دورات نشطة أو مسودة، أظهر تنبيهاً
  const availableCycles = cycles.filter((c) => c.status !== "completed");

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأهداف", href: "/app/objectives" },
          { label: "إنشاء هدف" },
        ]}
      />
      <PageHeader
        title="إنشاء هدف"
        description="أنشئ هدفاً جديداً مع نتائجه الرئيسية. يبدأ الهدف دائماً في حالة مسودة."
      />

      {availableCycles.length === 0 ? (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-4 text-sm text-warning-foreground">
          لا توجد دورات OKR متاحة للإنشاء فيها. يجب أن تكون هناك دورة في حالة مسودة أو نشطة.
        </div>
      ) : null}

      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-5">
        <ObjectiveFormFields
          values={values}
          onChange={setField}
          errors={errors}
          cycles={availableCycles}
          orgUnits={orgUnits}
          users={users}
          availableOrgUnitIds={availableOrgUnitIds}
          availableUserIds={availableOrgUnitIds.size > 0 ? undefined : undefined}
          upstreamKROptions={upstreamKROptions.map((opt) => ({
            kr: opt.kr,
            objectiveTitle: opt.objective.title,
          }))}
          mode="create"
          canEditKRs={true}
          selectedCycle={selectedCycle}
        />

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href="/app/objectives">
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ كمسودة"}
          </Button>
        </div>
      </form>
    </div>
  );
}
