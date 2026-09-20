"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  PERMISSION_GROUP_LABELS,
  permissionsByGroup,
  type PermissionGroupKey,
} from "@/lib/auth/permissions-v2";
import { Pencil, ShieldCheck, KeyRound, Users as UsersIcon } from "lucide-react";

export default function RoleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["roles.view"]}>
      <RoleDetails roleId={id} />
    </ProtectedRoute>
  );
}

function RoleDetails({ roleId }: { roleId: string }) {
  const { can } = useCurrentInstitutionalUser();
  const roles = useInstitutionalStore((s) => s.roles);
  const users = useInstitutionalStore((s) => s.users);

  const role = roles.find((r) => r.id === roleId);
  const usersWithRole = useMemo(
    () => (role ? users.filter((u) => u.roleIds.includes(role.id)) : []),
    [role, users]
  );

  const grouped = useMemo(() => permissionsByGroup(), []);
  const permSet = useMemo(
    () => new Set(role?.permissions ?? []),
    [role?.permissions]
  );

  if (!role) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الدور غير موجود"
            description="ربما تم حذف الدور أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/roles">العودة إلى قائمة الأدوار</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأدوار والصلاحيات", href: "/app/roles" },
          { label: role.name },
        ]}
      />

      <PageHeader
        title={role.name}
        description={role.description || "—"}
        badge={
          <StatusBadge variant={role.isSystem ? "info" : "neutral"} size="sm">
            {role.isSystem ? "دور نظامي" : "دور مخصّص"}
          </StatusBadge>
        }
        actions={
          can("roles.manage") && (
            <Button asChild variant="outline">
              <Link href={`/app/roles/${role.id}/edit`}>
                <Pencil className="size-4" />
                تعديل
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* العمود الأيسر: معلومات الدور */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="size-4" />
              معلومات الدور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="اسم الدور" value={role.name} />
            <Separator />
            <InfoRow
              label="النوع"
              value={
                <StatusBadge variant={role.isSystem ? "info" : "neutral"} size="sm">
                  {role.isSystem ? "نظامي" : "مخصّص"}
                </StatusBadge>
              }
            />
            <Separator />
            <InfoRow
              label="عدد الصلاحيات"
              value={
                <Badge variant="secondary" className="tabular-nums">
                  {role.permissions.length}
                </Badge>
              }
            />
            <Separator />
            <InfoRow
              label="المستخدمون المسند إليهم"
              value={
                <Badge variant="outline" className="tabular-nums">
                  {usersWithRole.length}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {/* العمود الأيمن: الصلاحيات */}
        <Card className="lg:col-span-2 order-1 lg:order-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4" />
              الصلاحيات المُسندة
            </CardTitle>
            <CardDescription>
              الصلاحيات الممنوحة لكل مستخدم يحمل هذا الدور.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {role.permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد صلاحيات.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([groupKey, perms]) => {
                  const active = perms.filter((p) => permSet.has(p.key));
                  if (active.length === 0) return null;
                  return (
                    <div key={groupKey}>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        {PERMISSION_GROUP_LABELS[groupKey as PermissionGroupKey]}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {active.map((p) => (
                          <span
                            key={p.key}
                            className="inline-flex items-center rounded-md bg-primary/5 border border-primary/15 px-2 py-0.5 text-[11px] text-primary"
                            title={p.description}
                          >
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* المستخدمون الذين يحملون هذا الدور */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersIcon className="size-4" />
            المستخدمون المسند إليهم
          </CardTitle>
          <CardDescription>
            قائمة المستخدمين الذين يحملون هذا الدور ضمن نطاق وصولك.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {usersWithRole.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">
              لا يوجد مستخدمون مسند إليهم هذا الدور.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {usersWithRole.map((u) => (
                <Link
                  key={u.id}
                  href={`/app/users/${u.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {u.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {u.fullName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {u.jobTitle}
                    </div>
                  </div>
                  <StatusBadge
                    variant={u.status === "active" ? "success" : "danger"}
                    size="sm"
                  >
                    {u.status === "active" ? "فعّال" : "موقوف"}
                  </StatusBadge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-left">{value}</span>
    </div>
  );
}
