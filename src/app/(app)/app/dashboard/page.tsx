"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="لوحة المعلومات" description="تحليلات وملخصات الأداء المؤسسي على مستوى الدورات والإدارات والأهداف." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "مؤشرات الأداء الرئيسية",
        "توزيع الإنجاز عبر الإدارات",
        "حالة الأهداف والنتائج الرئيسية",
        "اتجاهات الأداء عبر الدورات",
        "تصدير اللوحات كتقارير",
        ]}
      />
    </div>
  );
}
