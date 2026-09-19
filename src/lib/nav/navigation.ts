import type { Permission, Role } from "@/lib/auth/types";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Network,
  Repeat,
  Target,
  GitPullRequestArrow,
  Activity,
  Bell,
  Search,
  BarChart3,
  FileBarChart,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

/**
 * إعدادات التنقّل (Navigation Configuration)
 * ===================================================================
 * مصدر بيانات موحّد لقائمة التنقّل في الشريط الجانبي.
 *
 * مبادئ:
 * - التنقّل مُدار بالبيانات (data-driven) بدل التكرار في كل مكوّن.
 * - كل عنصر يحمل: مفتاحاً، مساراً، أيقونة، حالة (متاح/قادم)،
 *   والصلاحيات/الأدوار المطلوبة لعرضه.
 *
 * - العناصر القادمة (status = "upcoming") تُعرض مع شارة "قريباً"
 *   وتُسلك إلى صفحة مكان مؤقتة دون منطق أعمال فعلي.
 */

export type NavItemStatus = "active" | "upcoming";

export interface NavItem {
  key: string;
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  status: NavItemStatus;
  /** الصلاحيات المطلوبة لرؤية العنصر — إن لم تُحدد فالعنصر عام */
  requiredPermissions?: Permission[];
  /** الأدوار المسموح لها برؤية العنصر — بديل عن الصلاحيات */
  requiredRoles?: Role[];
}

export interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

/**
 * الأقسام الرئيسية للتنقّل.
 *
 * ملاحظة: الأقسام القادمة (تحديثات الإنجاز، التقارير، إلخ) تشير إلى صفحات
 * placeholder ولن تحتوي على منطق أعمال في هذا الطور.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    key: "main",
    label: "الرئيسية",
    items: [
      {
        key: "home",
        label: "الرئيسية",
        href: "/app",
        icon: LayoutDashboard,
        status: "active",
      },
      {
        key: "dashboard",
        label: "لوحة المعلومات",
        description: "تحليلات وملخصات الأداء المؤسسي",
        href: "/app/dashboard",
        icon: BarChart3,
        status: "upcoming",
        requiredPermissions: ["dashboard.view"],
      },
      {
        key: "search",
        label: "البحث",
        href: "/app/search",
        icon: Search,
        status: "upcoming",
      },
    ],
  },
  {
    key: "okr",
    label: "الأهداف والنتائج",
    items: [
      {
        key: "cycles",
        label: "دورات OKR",
        description: "إدارة دورات التخطيط الفصلية والسنوية",
        href: "/app/cycles",
        icon: Repeat,
        status: "upcoming",
        requiredPermissions: ["okr.cycles.view"],
      },
      {
        key: "goals",
        label: "الأهداف والنتائج الرئيسية",
        description: "إنشاء ومتابعة الأهداف والنتائج",
        href: "/app/goals",
        icon: Target,
        status: "upcoming",
        requiredPermissions: ["okr.goals.view"],
      },
      {
        key: "reviews",
        label: "المراجعات والاعتمادات",
        description: "طلب ومراجعة اعتماد الأهداف",
        href: "/app/reviews",
        icon: GitPullRequestArrow,
        status: "upcoming",
        requiredPermissions: ["okr.review.request", "okr.review.approve"],
      },
      {
        key: "updates",
        label: "تحديثات الإنجاز",
        description: "تسجيل التقدّم وإرفاق الأدلة",
        href: "/app/updates",
        icon: Activity,
        status: "upcoming",
        requiredPermissions: ["okr.progress.view"],
      },
    ],
  },
  {
    key: "organization",
    label: "المؤسسة",
    items: [
      {
        key: "structure",
        label: "الهيكل التنظيمي",
        description: "الإدارات والأقسام والفرق",
        href: "/app/organization",
        icon: Network,
        status: "upcoming",
        requiredPermissions: ["org.structure.view"],
      },
      {
        key: "users",
        label: "المستخدمون",
        description: "إدارة حسابات المستخدمين",
        href: "/app/users",
        icon: Users,
        status: "upcoming",
        requiredPermissions: ["system.users.manage"],
      },
    ],
  },
  {
    key: "insights",
    label: "التنبيهات والتقارير",
    items: [
      {
        key: "alerts",
        label: "التنبيهات",
        description: "تذكيرات وإنذارات النظام",
        href: "/app/alerts",
        icon: Bell,
        status: "upcoming",
        requiredPermissions: ["alerts.view"],
      },
      {
        key: "reports",
        label: "التقارير",
        description: "تقارير الأداء والتصدير",
        href: "/app/reports",
        icon: FileBarChart,
        status: "upcoming",
        requiredPermissions: ["reports.view"],
      },
    ],
  },
  {
    key: "account",
    label: "الحساب",
    items: [
      {
        key: "profile",
        label: "ملفي الشخصي",
        href: "/app/profile",
        icon: UserIcon,
        status: "active",
      },
      {
        key: "settings",
        label: "الإعدادات",
        href: "/app/settings",
        icon: Settings,
        status: "upcoming",
      },
      {
        key: "admin",
        label: "إدارة النظام",
        description: "إعدادات النظام وسجلاته",
        href: "/app/admin",
        icon: ShieldCheck,
        status: "active",
        requiredRoles: ["system_admin"],
      },
    ],
  },
];

/** قائمة مسطّحة بكل العناصر — مفيدة للبحث والوصول السريع */
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** يجد عنصر تنقّل بواسطة المسار */
export function findNavItemByHref(href: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.href === href);
}
