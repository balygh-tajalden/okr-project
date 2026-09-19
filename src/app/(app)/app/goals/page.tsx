"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="الأهداف والنتائج الرئيسية" description="إنشاء ومتابعة الأهداف والنتائج الرئيسية، ربطها بالدورات والجهات، ومراجعة التقدم." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "إنشاء أهداف مؤسسية طموحة",
        "إضافة نتائج رئيسية قابلة للقياس",
        "محاذاة الأهداف عبر المستويات",
        "ربط الأهداف بالدورات والجهات",
        "تتبع نسب الإنجاز التلقائي",
        ]}
      />
    </div>
  );
}
