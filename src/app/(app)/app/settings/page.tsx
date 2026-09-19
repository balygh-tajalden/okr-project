"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="إعدادات النظام العامة: تخصيصات العرض، الإشعارات، اللغة، والتفضيلات." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "تفضيلات العرض والمظهر",
        "إعدادات الإشعارات",
        "اختصارات لوحة المفاتيح",
        "تفضيلات اللغة والمنطقة الزمنية",
        "تصدير بياناتي الشخصية",
        ]}
      />
    </div>
  );
}
