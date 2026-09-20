import type { Permission } from "@/lib/auth/permissions-v2";
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
  KeyRound,
  Inbox,
} from "lucide-react";

/**
 * إعدادات التنقّل (Navigation Configuration) — Phase 2
 * ===================================================================
 * مصدر بيانات موحّد لقائمة التنقّل في الشريط الجانبي.
 *
 * مبادئ:
 * - التنقّل مُدار بالبيانات (data-driven) بدل التكرار في كل مكوّن.
 * - كل عنصر يحمل: مفتاحاً، مساراً، أيقونة، والصلاحيات المطلوبة لعرضه.
 * - يستخدم نظام صلاحيات دقيق (permissions-v2): users.view, cycles.view...
 */

export interface NavItem {
  key: string;
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  /** الصلاحيات المطلوبة لرؤية العنصر. البديل: requiredAnyPermission */
  requiredPermissions?: Permission[];
  /** إن توفّر أي صلاحية من هذه القائمة يُعرض العنصر */
  requiredAnyPermission?: Permission[];
}

export interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

/**
 * الأقسام الرئيسية للتنقّل.
 * فعّال بالكامل: لوحة المعلومات، المستخدمون، الأدوار، الهيكل التنظيمي،
 * دورات OKR، الأهداف، المراجعات، التحديثات، التنبيهات، التقارير
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
      },
      {
        key: "dashboard",
        label: "لوحة المعلومات",
        description: "تحليلات وملخصات الأداء المؤسسي",
        href: "/app/dashboard",
        icon: BarChart3,
        requiredPermissions: ["dashboard.view"],
      },
      {
        key: "search",
        label: "البحث والتصفية",
        href: "/app/search",
        icon: Search,
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
        requiredAnyPermission: ["cycles.view", "cycles.create"],
      },
      {
        key: "objectives",
        label: "الأهداف والنتائج الرئيسية",
        description: "إنشاء ومتابعة الأهداف والنتائج",
        href: "/app/objectives",
        icon: Target,
        requiredAnyPermission: ["goals.view"],
      },
      {
        key: "reviews",
        label: "المراجعات والاعتمادات",
        description: "مراجعة واعتماد الأهداف المُرسلة",
        href: "/app/reviews",
        icon: GitPullRequestArrow,
        requiredAnyPermission: ["goals.review", "goals.approve"],
      },
      {
        key: "updates",
        label: "تحديثات الإنجاز",
        description: "مراجعة طلبات تحديث الإنجاز",
        href: "/app/updates",
        icon: Activity,
        requiredAnyPermission: ["progress.review", "progress.update", "progress.view"],
      },
      {
        key: "my-objectives",
        label: "الأهداف المسندة إلي",
        description: "الأهداف الفردية التي سُنّدت إليك",
        href: "/app/my-objectives",
        icon: Inbox,
        requiredPermissions: ["individual_goals.view"],
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
        requiredPermissions: ["organization.view"],
      },
      {
        key: "users",
        label: "المستخدمون",
        description: "إدارة حسابات المستخدمين",
        href: "/app/users",
        icon: Users,
        requiredPermissions: ["users.view"],
      },
      {
        key: "roles",
        label: "الأدوار والصلاحيات",
        description: "إدارة الأدوار والصلاحيات",
        href: "/app/roles",
        icon: KeyRound,
        requiredPermissions: ["roles.view"],
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
        description: "تنبيهات النظام والإشعارات",
        href: "/app/alerts",
        icon: Bell,
        requiredPermissions: ["alerts.view"],
      },
      {
        key: "reports",
        label: "التقارير",
        description: "تقارير الأداء والتصدير",
        href: "/app/reports",
        icon: FileBarChart,
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
      },
      {
        key: "settings",
        label: "الإعدادات",
        href: "/app/settings",
        icon: Settings,
        requiredPermissions: ["settings.manage"],
      },
      {
        key: "admin",
        label: "إدارة النظام",
        description: "إعدادات النظام وسجلاته",
        href: "/app/admin",
        icon: ShieldCheck,
        requiredPermissions: ["system.admin"],
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
