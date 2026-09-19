"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function UpdatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="تحديثات الإنجاز" description="تسجيل التقدّم الدوري للنتائج الرئيسية، إرفاق الأدلة الداعمة، ومتابعة التقدّم نحو الأهداف." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "تحديث قيم النتائج الرئيسية",
        "إرفاق أدلة داعمة (مستندات، صور)",
        "تعليقات وتغذية راجعة",
        "متابعة تاريخ التحديثات",
        "حساب نسب الإنجاز التلقائي",
        ]}
      />
    </div>
  );
}
