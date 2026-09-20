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
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useInstitutionalStore } from "@/lib/data/store";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { getUserRoles, getUserPrimaryUnitName } from "@/lib/services/institutional";
import {
  ACCOUNT_STATUS_LABELS,
} from "@/lib/data/types";

/**
 * AdminPage — إدارة النظام (محمية بصلاحية system.admin)
 * ===================================================================
 * تظهر فقط لمن يحمل صلاحية system.admin.
 * تعرض لمحة عامة عن النظام مع روابط للأقسام الإدارية.
 */
export default function AdminPage() {
  return (
    <ProtectedRoute requiredPermissions={["system.admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const users = useInstitutionalStore((s) => s.users);
  const roles = useInstitutionalStore((s) => s.roles);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const assignments = useInstitutionalStore((s) => s.userOrgAssignments);

  const activeUsers = users.filter((u) => u.status === "active").length;
  const disabledUsers = users.filter((u) => u.status === "disabled").length;
  const systemRoles = roles.filter((r) => r.isSystem).length;
  const customRoles = roles.filter((r) => !r.isSystem).length;

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "إدارة النظام" },
        ]}
      />

      <PageHeader
        title="إدارة النظام"
        description="نظرة عامة على بيانات النظام والوحدات الإدارية."
        badge={
          <StatusBadge variant="info" size="sm">
            صلاحية مقيّدة — مدير النظام
          </StatusBadge>
        }
      />

      {/* بطاقات إحصائية */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat
          label="إجمالي المستخدمين"
          value={users.length}
          subValue={`${activeUsers} فعّال • ${disabledUsers} موقوف`}
          color="primary"
        />
        <AdminStat
          label="الأدوار"
          value={roles.length}
          subValue={`${systemRoles} نظامي • ${customRoles} مخصّص`}
          color="info"
        />
        <AdminStat
          label="الجهات التنظيمية"
          value={orgUnits.length}
          subValue={`${assignments.length} ارتباط تنظيمي`}
          color="success"
        />
        <AdminStat
          label="دورات OKR"
          value={cycles.length}
          subValue={`${cycles.filter((c) => c.status === "active").length} نشطة`}
          color="warning"
        />
      </div>

      {/* جدول المستخدمين الإداري */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة المستخدمين</CardTitle>
          <CardDescription>
            عرض إداري لكل المستخدمين في النظام. لإدارة كاملة، انتقل إلى صفحة المستخدمين.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الجهة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">رقم الموظف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const userRoles = getUserRoles(u, roles);
                  return (
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
                      <TableCell className="text-xs text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userRoles.slice(0, 2).map((r) => (
                            <StatusBadge key={r.id} variant="info" size="sm">
                              {r.name}
                            </StatusBadge>
                          ))}
                          {userRoles.length > 2 && (
                            <StatusBadge variant="neutral" size="sm">
                              +{userRoles.length - 2}
                            </StatusBadge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {getUserPrimaryUnitName(u, orgUnits)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={u.status === "active" ? "success" : "danger"}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminStat({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: number;
  subValue?: string;
  color: "primary" | "info" | "success" | "warning";
}) {
  const colorClass = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning-foreground",
  }[color];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className={`flex size-9 items-center justify-center rounded-md ${colorClass}`}>
          <span className="text-lg font-bold tabular-nums">{value}</span>
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subValue && (
          <p className="text-[11px] text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}
