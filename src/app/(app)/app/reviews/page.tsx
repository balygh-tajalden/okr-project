"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="المراجعات والاعتمادات" description="تقديم ومراجعة طلبات اعتماد الأهداف متعددة المستويات الإدارية مع تتبّع حالة الطلب." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "تقديم طلبات اعتماد الأهداف",
        "مراجعة متعددة المستويات الإدارية",
        "قبول أو رفض مع تعليقات",
        "تتبع حالة الطلبات",
        "سجل اعتمادات كامل",
        ]}
      />
    </div>
  );
}
