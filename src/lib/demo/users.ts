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
 * كلمة المرور لجميع الحسابات التالية: Demo@2025
 * (انظر DEMO_PASSWORD أدناه — مرجع موحّد)
 */

export const DEMO_PASSWORD = "Demo@2025";

/** المستخدمون التجريبيون — كل دور يمثّل فئة وظيفية حقيقية */
export const DEMO_USERS: User[] = [
  {
    id: "u-001",
    username: "a.almansour",
    fullName: "عبدالله بن سعد المنصور",
    email: "a.almansour@org.dev",
    initials: "عم",
    role: "system_admin",
    organizationalUnit: "الإدارة العامة لتقنية المعلومات",
    jobTitle: "مدير النظام",
    status: "active",
    employeeId: "EMP-1001",
  },
  {
    id: "u-002",
    username: "k.alshammari",
    fullName: "د. خالد بن ناصر الشمري",
    email: "k.alshammari@org.dev",
    initials: "خش",
    role: "executive",
    organizationalUnit: "مكتب الإدارة العليا",
    jobTitle: "وكيل الهيئة المساعد",
    status: "active",
    employeeId: "EMP-1002",
  },
  {
    id: "u-003",
    username: "s.aldosari",
    fullName: "م. سارة بنت محمد الدوسري",
    email: "s.aldosari@org.dev",
    initials: "سد",
    role: "department_manager",
    organizationalUnit: "إدارة تخطيط الموارد والأداء",
    jobTitle: "مدير إدارة تخطيط الموارد",
    status: "active",
    employeeId: "EMP-1003",
  },
  {
    id: "u-004",
    username: "f.alotaibi",
    fullName: "فهد بن عبدالعزيز العتيبي",
    email: "f.alotaibi@org.dev",
    initials: "فع",
    role: "team_lead",
    organizationalUnit: "إدارة تطوير الخدمات الرقمية",
    jobTitle: "قائد فريق تجربة المستخدم",
    status: "active",
    employeeId: "EMP-1004",
  },
  {
    id: "u-005",
    username: "n.alqahtani",
    fullName: "نورة بنت سعد القحطاني",
    email: "n.alqahtani@org.dev",
    initials: "نق",
    role: "employee",
    organizationalUnit: "إدارة تطوير الخدمات الرقمية",
    jobTitle: "محلل أعمال أول",
    status: "active",
    employeeId: "EMP-1005",
  },
  {
    id: "u-006",
    username: "m.alharbi",
    fullName: "ماجد بن عمران الحربي",
    email: "m.alharbi@org.dev",
    initials: "مح",
    role: "employee",
    organizationalUnit: "إدارة الموارد البشرية",
    jobTitle: "أخصائي تطوير الموارد البشرية",
    status: "disabled",
    employeeId: "EMP-1006",
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
