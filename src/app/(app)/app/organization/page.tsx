"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="الهيكل التنظيمي" description="عرض وإدارة الإدارات والأقسام والفرق. يدعم لاحقاً الربط الهرمي للأهداف عبر مستويات الجهات." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "عرض الشجرة التنظيمية الكاملة",
        "إنشاء وتعديل الإدارات والأقسام",
        "ربط المستخدمين بالوحدات",
        "محاذاة الأهداف عبر المستويات",
        "سجل تغييرات الهيكل التنظيمي",
        ]}
      />
    </div>
  );
}
