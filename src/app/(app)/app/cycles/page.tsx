"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function CyclesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="دورات OKR" description="إدارة دورات التخطيط الفصلية والسنوية: إنشاء الدورات، تحديد فتراتها، تفعيلها وإغلاقها." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "إنشاء دورات تخطيط ربعية وسنوية",
        "تحديد فترات الإدخال والمراجعة",
        "تفعيل وإغلاق الدورات",
        "عرض دورات مغلقة سابقاً",
        "أرشفة نتائج الدورات السابقة",
        ]}
      />
    </div>
  );
}
