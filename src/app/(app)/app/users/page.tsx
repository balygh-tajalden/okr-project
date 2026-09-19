"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="المستخدمون" description="إدارة حسابات مستخدمي النظام: إضافة، تعديل، إيقاف، تعيين الأدوار، وإعادة تعيين كلمات المرور. سيتم تفعيلها في الطور القادم." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "إضافة مستخدمين جدد وتعيين أدوارهم",
        "تعديل البيانات الوظيفية والحسابية",
        "إيقاف وتفعيل الحسابات",
        "إعادة تعيين كلمات المرور",
        "تصدير قوائم المستخدمين",
        ]}
      />
    </div>
  );
}
