"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="التنبيهات" description="تذكيرات وإنذارات النظام: مواعيد التحديث، اقتراب نهاية الدورة، تأخر الاعتمادات." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "تنبيهات اقتراب المواعيد",
        "إنذارات تأخر التحديثات",
        "تذكيرات الاعتمادات المعلّقة",
        "إعدادات تفضيلات التنبيهات",
        "أرشفة التنبيهات المقروءة",
        ]}
      />
    </div>
  );
}
