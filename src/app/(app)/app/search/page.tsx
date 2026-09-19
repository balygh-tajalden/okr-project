"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="البحث" description="بحث موحّد عبر الأهداف، النتائج، المستخدمين، والإدارات." />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
        "بحث موحّد عبر كل الكيانات",
        "تصفية حسب النوع والحالة",
        "بحث متقدم بصياغة دقيقة",
        "حفظ عمليات البحث المتكررة",
        "اختصارات لوحة المفاتيح",
        ]}
      />
    </div>
  );
}
