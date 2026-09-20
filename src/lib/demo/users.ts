import type { User, DemoCredentials, Role } from "@/lib/auth/types";

/**
 * بيانات تجريبية واقعية للمستخدمين (Demo Users Seed)
 * ===================================================================
 * هذه البيانات تجريبية للأغراض التطويرية فقط (prototype).
 * تستخدم محتوى عربياً واقعياً يحاكي بيئة حكومية/مؤسسية كبيرة
 * بدلاً من النصوص العشوائية أو "Test User".
 *
 * المؤسسة الافتراضية: "هيئة التطوير المؤسسي"
 *
 * كلمة المرور لجميع الحسابات التالية: Demo@2026
 * (انظر DEMO_PASSWORD أدناه — مرجع موحّد)
 */

export const DEMO_PASSWORD = "Demo@2026";

/** المستخدمون التجريبيون — كل دور يمثّل فئة وظيفية حقيقية */
export const DEMO_USERS: User[] = [
  {
    id: "u-001",
    username: "ahmed",
    fullName: "أحمد",
    email: "ahmed@example.com",
    initials: "أح",
    role: "system_admin",
    organizationalUnit: "الإدارة العامة لتقنية المعلومات",
    jobTitle: "مدير النظام",
    status: "active",
    employeeId: "EMP-1001",
  },
  {
    id: "u-002",
    username: "mohammed",
    fullName: "محمد",
    email: "mohammed@example.com",
    initials: "مح",
    role: "executive",
    organizationalUnit: "مكتب الإدارة العليا",
    jobTitle: "وكيل الهيئة المساعد",
    status: "active",
    employeeId: "EMP-1002",
  },
  {
    id: "u-003",
    username: "khaled",
    fullName: "خالد",
    email: "khaled@example.com",
    initials: "خا",
    role: "department_manager",
    organizationalUnit: "إدارة تخطيط الموارد والأداء",
    jobTitle: "مدير إدارة تخطيط الموارد",
    status: "active",
    employeeId: "EMP-1003",
  },
  {
    id: "u-004",
    username: "ali",
    fullName: "علي",
    email: "ali@example.com",
    initials: "عل",
    role: "team_lead",
    organizationalUnit: "إدارة تطوير الخدمات الرقمية",
    jobTitle: "قائد فريق تجربة المستخدم",
    status: "active",
    employeeId: "EMP-1004",
  },
  {
    id: "u-005",
    username: "yousef",
    fullName: "يوسف",
    email: "yousef@example.com",
    initials: "يو",
    role: "employee",
    organizationalUnit: "إدارة تطوير الخدمات الرقمية",
    jobTitle: "محلل أعمال أول",
    status: "active",
    employeeId: "EMP-1005",
  },
  {
    id: "u-006",
    username: "salem",
    fullName: "سالم",
    email: "salem@example.com",
    initials: "سا",
    role: "employee",
    organizationalUnit: "إدارة الموارد البشرية",
    jobTitle: "أخصائي تطوير الموارد البشرية",
    status: "disabled",
    employeeId: "EMP-1006",
  },
  // === مستخدمو الطور الثاني (لإظهار سيناريوهات النطاق وتعدد الأدوار) ===
  {
    id: "u-007",
    username: "fatima",
    fullName: "فاطمة",
    email: "fatima@example.com",
    initials: "فا",
    role: "department_manager",
    organizationalUnit: "إدارة الموارد البشرية",
    jobTitle: "مدير إدارة الموارد البشرية",
    status: "active",
    employeeId: "EMP-1007",
  },
  {
    id: "u-008",
    username: "omar",
    fullName: "عمر",
    email: "omar@example.com",
    initials: "عم",
    role: "employee",
    organizationalUnit: "فريق تطبيقات الجوال",
    jobTitle: "مطوّر تطبيقات أول",
    status: "active",
    employeeId: "EMP-1008",
  },
  {
    id: "u-009",
    username: "hassan",
    fullName: "حسن",
    email: "hassan@example.com",
    initials: "حس",
    role: "team_lead",
    organizationalUnit: "إدارة مكتب المشاريع",
    jobTitle: "قائد فريق مكتب المشاريع",
    status: "active",
    employeeId: "EMP-1009",
  },
];

/**
 * خريطة بيانات الاعتماد — مفتاح واحد موحّد لكل بيانات الدخول التجريبية.
 * يجب على المطورين الرجوع لهذا الملف فقط لتعديل بيانات الدخول.
 */
export const DEMO_CREDENTIALS: DemoCredentials[] = DEMO_USERS.map((u) => ({
  username: u.username,
  password: DEMO_PASSWORD,
  userId: u.id,
}));

/** بيانات اعتماد مختصرة للعرض في وثائق المطور (اختياري) */
export const DEMO_CREDENTIALS_SUMMARY: Array<{
  role: Role;
  username: string;
  password: string;
  fullName: string;
}> = DEMO_USERS.map((u) => ({
  role: u.role,
  username: u.username,
  password: DEMO_PASSWORD,
  fullName: u.fullName,
}));

/** يجد مستخدم تجريبي باسم المستخدم أو البريد الإلكتروني */
export function findDemoUser(identifier: string): User | undefined {
  const normalized = identifier.trim().toLowerCase();
  return DEMO_USERS.find(
    (u) =>
      u.username.toLowerCase() === normalized ||
      u.email.toLowerCase() === normalized
  );
}

/** يجد مستخدم تجريبي بالمعرف */
export function findDemoUserById(id: string): User | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}
