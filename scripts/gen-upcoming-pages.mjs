#!/usr/bin/env node
/**
 * Generate upcoming placeholder pages for Phase-1 nav items.
 * Each page is a thin wrapper around the UpcomingFeature component
 * with content derived from the navigation config.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES = [
  {
    path: "users",
    title: "المستخدمون",
    description:
      "إدارة حسابات مستخدمي النظام: إضافة، تعديل، إيقاف، تعيين الأدوار، وإعادة تعيين كلمات المرور. سيتم تفعيلها في الطور القادم.",
    features: [
      "إضافة مستخدمين جدد وتعيين أدوارهم",
      "تعديل البيانات الوظيفية والحسابية",
      "إيقاف وتفعيل الحسابات",
      "إعادة تعيين كلمات المرور",
      "تصدير قوائم المستخدمين",
    ],
  },
  {
    path: "organization",
    title: "الهيكل التنظيمي",
    description:
      "عرض وإدارة الإدارات والأقسام والفرق. يدعم لاحقاً الربط الهرمي للأهداف عبر مستويات الجهات.",
    features: [
      "عرض الشجرة التنظيمية الكاملة",
      "إنشاء وتعديل الإدارات والأقسام",
      "ربط المستخدمين بالوحدات",
      "محاذاة الأهداف عبر المستويات",
      "سجل تغييرات الهيكل التنظيمي",
    ],
  },
  {
    path: "cycles",
    title: "دورات OKR",
    description:
      "إدارة دورات التخطيط الفصلية والسنوية: إنشاء الدورات، تحديد فتراتها، تفعيلها وإغلاقها.",
    features: [
      "إنشاء دورات تخطيط ربعية وسنوية",
      "تحديد فترات الإدخال والمراجعة",
      "تفعيل وإغلاق الدورات",
      "عرض دورات مغلقة سابقاً",
      "أرشفة نتائج الدورات السابقة",
    ],
  },
  {
    path: "goals",
    title: "الأهداف والنتائج الرئيسية",
    description:
      "إنشاء ومتابعة الأهداف والنتائج الرئيسية، ربطها بالدورات والجهات، ومراجعة التقدم.",
    features: [
      "إنشاء أهداف مؤسسية طموحة",
      "إضافة نتائج رئيسية قابلة للقياس",
      "محاذاة الأهداف عبر المستويات",
      "ربط الأهداف بالدورات والجهات",
      "تتبع نسب الإنجاز التلقائي",
    ],
  },
  {
    path: "reviews",
    title: "المراجعات والاعتمادات",
    description:
      "تقديم ومراجعة طلبات اعتماد الأهداف متعددة المستويات الإدارية مع تتبّع حالة الطلب.",
    features: [
      "تقديم طلبات اعتماد الأهداف",
      "مراجعة متعددة المستويات الإدارية",
      "قبول أو رفض مع تعليقات",
      "تتبع حالة الطلبات",
      "سجل اعتمادات كامل",
    ],
  },
  {
    path: "updates",
    title: "تحديثات الإنجاز",
    description:
      "تسجيل التقدّم الدوري للنتائج الرئيسية، إرفاق الأدلة الداعمة، ومتابعة التقدّم نحو الأهداف.",
    features: [
      "تحديث قيم النتائج الرئيسية",
      "إرفاق أدلة داعمة (مستندات، صور)",
      "تعليقات وتغذية راجعة",
      "متابعة تاريخ التحديثات",
      "حساب نسب الإنجاز التلقائي",
    ],
  },
  {
    path: "alerts",
    title: "التنبيهات",
    description:
      "تذكيرات وإنذارات النظام: مواعيد التحديث، اقتراب نهاية الدورة، تأخر الاعتمادات.",
    features: [
      "تنبيهات اقتراب المواعيد",
      "إنذارات تأخر التحديثات",
      "تذكيرات الاعتمادات المعلّقة",
      "إعدادات تفضيلات التنبيهات",
      "أرشفة التنبيهات المقروءة",
    ],
  },
  {
    path: "dashboard",
    title: "لوحة المعلومات",
    description:
      "تحليلات وملخصات الأداء المؤسسي على مستوى الدورات والإدارات والأهداف.",
    features: [
      "مؤشرات الأداء الرئيسية",
      "توزيع الإنجاز عبر الإدارات",
      "حالة الأهداف والنتائج الرئيسية",
      "اتجاهات الأداء عبر الدورات",
      "تصدير اللوحات كتقارير",
    ],
  },
  {
    path: "reports",
    title: "التقارير",
    description:
      "تقارير الأداء التفصيلية والتصدير بصيغ متعددة (PDF، Excel).",
    features: [
      "تقارير الأداء على مستوى الإدارات",
      "تقارير الدورات والإنجاز",
      "تصدير PDF و Excel",
      "تخصيص نطاق التقارير",
      "جدولة التقارير الدورية",
    ],
  },
  {
    path: "search",
    title: "البحث",
    description:
      "بحث موحّد عبر الأهداف، النتائج، المستخدمين، والإدارات.",
    features: [
      "بحث موحّد عبر كل الكيانات",
      "تصفية حسب النوع والحالة",
      "بحث متقدم بصياغة دقيقة",
      "حفظ عمليات البحث المتكررة",
      "اختصارات لوحة المفاتيح",
    ],
  },
  {
    path: "settings",
    title: "الإعدادات",
    description:
      "إعدادات النظام العامة: تخصيصات العرض، الإشعارات، اللغة، والتفضيلات.",
    features: [
      "تفضيلات العرض والمظهر",
      "إعدادات الإشعارات",
      "اختصارات لوحة المفاتيح",
      "تفضيلات اللغة والمنطقة الزمنية",
      "تصدير بياناتي الشخصية",
    ],
  },
];

const BASE = path.join(__dirname, "..", "src", "app", "(app)", "app");

function pageTemplate({ path: p, title, description, features }) {
  const componentName = p.charAt(0).toUpperCase() + p.slice(1) + "Page";
  const featuresStr = features.map((f) => `        "${f}"`).join(",\n");
  return `"use client";

import { PageHeader } from "@/components/common/page-header";
import { UpcomingFeature } from "@/components/common/upcoming-feature";

export default function ${componentName}() {
  return (
    <div className="space-y-6">
      <PageHeader title="${title}" description="${description}" />
      <UpcomingFeature
        title="هذا القسم قيد التطوير"
        description="يُفعّل في الطور القادم من المشروع. البنية التحتية والتنقّل جاهزان بالفعل — ولن يتطلّب التفعيل إعادة تصميم."
        expectedFeatures={[
${featuresStr},
        ]}
      />
    </div>
  );
}
`;
}

PAGES.forEach((p) => {
  const dir = path.join(BASE, p.path);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "page.tsx");
  fs.writeFileSync(filePath, pageTemplate(p), "utf-8");
  console.log("Created:", filePath);
});

console.log("\nDone —", PAGES.length, "placeholder pages created.");
