"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DEMO_USERS } from "@/lib/demo/users";
import {
  ROLE_LABELS,
  ACCOUNT_STATUS_LABELS,
} from "@/lib/auth/types";

/**
 * AdminPage — إدارة النظام (محمية بدور system_admin)
 * ===================================================================
 * هذه الصفحة تجريبية في الطور الأول لإثبات أن عمارة الصلاحيات تعمل:
 * - لا تُعرض في التنقّل إلا لمدير النظام.
 * - يحميها ProtectedRoute عبر requiredRoles=["system_admin"].
 * - المستخدمون الآخرون يُعاد توجيههم إلى /unauthorized.
 *
 * ملاحظة: لا تُنفّذ عمليات CRUD الفعلية هنا — ذلك في الطور الثاني.
 */
export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["system_admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="إدارة النظام"
          description="إطلالة إدارية على مستخدمي النظام (للعرض في الطور الأول — إدارة المستخدمين الكاملة في الطور القادم)."
          badge={
            <StatusBadge variant="info" size="sm">
              صلاحية مقيّدة — مدير النظام
            </StatusBadge>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">قائمة المستخدمين التجريبيين</CardTitle>
            <CardDescription>
              عرض لقائمة المستخدمين المُعتمدين في النظام للتحقق من عمل عمارة
              الصلاحيات. الإدارة الكاملة (إضافة، تعديل، إيقاف) ستكون متاحة في
              الطور القادم.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الجهة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">رقم الموظف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_USERS.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {u.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {u.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {u.username}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant="info" size="sm">
                          {ROLE_LABELS[u.role]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.organizationalUnit}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={
                            u.status === "active"
                              ? "success"
                              : u.status === "disabled"
                                ? "danger"
                                : "warning"
                          }
                          size="sm"
                          dot
                        >
                          {ACCOUNT_STATUS_LABELS[u.status]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {u.employeeId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">إمكانيات قادمة في الطور الثاني</CardTitle>
            <CardDescription>
              الإدارة الكاملة للمستخدمين ستتضمّن:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "إضافة مستخدم جديد وتعيين دور",
                "تعديل بيانات المستخدم الوظيفية",
                "إيقاف / تفعيل الحسابات",
                "إعادة تعيين كلمة المرور",
                "إدارة الصلاحيات الدقيقة",
                "ربط المستخدمين بالوحدات التنظيمية",
                "تصدير قائمة المستخدمين",
                "سجل تدقيق الإجراءات الحساسة",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-primary/40"
                    aria-hidden="true"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
