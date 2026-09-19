"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="التقارير" description="تقارير الأداء التفصيلية والتصدير بصيغ متعددة (PDF، Excel)." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "تقارير الأداء على مستوى الإدارات",
        "تقارير الدورات والإنجاز",
        "تصدير PDF و Excel",
        "تخصيص نطاق التقارير",
        "جدولة التقارير الدورية",
        ]}
      />
    </div>
  );
}
