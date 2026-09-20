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
  getChildUnits,
  getAncestorPath,
  countUsersInUnitTree,
  filterUsersByScope,
} from "@/lib/services/institutional";
import { ORG_UNIT_TYPE_LABELS } from "@/lib/data/types";
import {
  Network,
  Pencil,
  Plus,
  Users as UsersIcon,
  Building2,
  ChevronLeft,
} from "lucide-react";

export default function OrgUnitDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["organization.view"]}>
      <OrgUnitDetails unitId={id} />
    </ProtectedRoute>
  );
}

function OrgUnitDetails({ unitId }: { unitId: string }) {
  const { can } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);

  const unit = orgUnits.find((u) => u.id === unitId);
  const ancestorPath = useMemo(
    () => (unit ? getAncestorPath(orgUnits, unit.id) : []),
    [unit, orgUnits]
  );
  const children = useMemo(
    () => (unit ? getChildUnits(orgUnits, unit.id) : []),
    [unit, orgUnits]
  );

  // المستخدمون المرتبطون مباشرةً بهذه الجهة
  const directUsers = useMemo(() => {
    if (!unit) return [];
    return users.filter((u) => u.primaryOrgUnitId === unit.id);
  }, [unit, users]);

  const totalUsersInTree = unit
    ? countUsersInUnitTree(users, orgUnits, unit.id)
    : 0;

  if (!unit) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الجهة غير موجودة"
            description="ربما تم حذف الجهة أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/organization">العودة إلى الهيكل</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const canManage = can("organization.manage");

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الهيكل التنظيمي", href: "/app/organization" },
          { label: unit.name },
        ]}
      />

      <PageHeader
        title={unit.name}
        description={unit.description || ORG_UNIT_TYPE_LABELS[unit.type]}
        badge={
          <StatusBadge variant="info" size="sm">
            {ORG_UNIT_TYPE_LABELS[unit.type]}
          </StatusBadge>
        }
        actions={
          canManage && (
            <>
              <Button asChild variant="outline">
                <Link href={`/app/organization/${unit.id}/edit`}>
                  <Pencil className="size-4" />
                  تعديل
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/app/organization/new?parentId=${unit.id}`}>
                  <Plus className="size-4" />
                  إضافة فرع
                </Link>
              </Button>
            </>
          )
        }
      />

      {/* المسار الهرمي + الإحصائيات */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground mb-1">المسار الهرمي</div>
              <Breadcrumbs
                items={ancestorPath.map((u) => ({
                  label: u.name,
                  href: `/app/organization/${u.id}`,
                }))}
              />
            </div>
            <div className="flex gap-3">
              <Stat label="مستخدمون مباشرون" value={directUsers.length} />
              <Stat label="مستخدمون في الشجرة" value={totalUsersInTree} />
              <Stat label="فروع مباشرة" value={children.length} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* الفروع المباشرة */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="size-4" />
              الفروع المباشرة
            </CardTitle>
            <CardDescription>
              الجهات التابعة مباشرةً لهذه الجهة.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {children.length === 0 ? (
              <EmptyState
                title="لا توجد جهات تابعة"
                description="لم تتم إضافة فروع لهذه الجهة بعد."
                className="border-0"
                action={
                  canManage && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/app/organization/new?parentId=${unit.id}`}>
                        <Plus className="size-4" />
                        إضافة أول فرع
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {children.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/organization/${c.id}`}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {ORG_UNIT_TYPE_LABELS[c.type]}
                          {c.code && ` • ${c.code}`}
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* المستخدمون المباشرون */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UsersIcon className="size-4" />
              المستخدمون المباشرون
            </CardTitle>
            <CardDescription>
              المستخدمون المرتبطون مباشرةً بهذه الجهة.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {directUsers.length === 0 ? (
              <EmptyState
                title="لا يوجد مستخدمون"
                description="لا يوجد مستخدمون مرتبطون مباشرةً بهذه الجهة."
                className="border-0"
              />
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {directUsers.map((u) => (
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
                      <div className="text-sm font-medium text-foreground truncate">
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-foreground tabular-nums">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
