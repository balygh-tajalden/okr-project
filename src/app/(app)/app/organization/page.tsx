"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { TreeView, buildTree } from "@/components/tree/tree-view";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  countUsersInUnitTree,
  getChildUnits,
  filterUsersByScope,
} from "@/lib/services/institutional";
import {
  ORG_UNIT_TYPE_LABELS,
  type OrgUnit,
} from "@/lib/data/types";
import {
  Network,
  Plus,
  Eye,
  Pencil,
  ChevronLeft,
} from "lucide-react";

export default function OrganizationPage() {
  return (
    <ProtectedRoute requiredPermissions={["organization.view"]}>
      <OrganizationView />
    </ProtectedRoute>
  );
}

function OrganizationView() {
  const { can } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes, rootIds } = useMemo(
    () => buildTree(orgUnits.map((u) => ({ ...u }))),
    [orgUnits]
  );

  const selected = selectedId
    ? orgUnits.find((u) => u.id === selectedId)
    : null;
  const selectedChildren = selected ? getChildUnits(orgUnits, selected.id) : [];
  const selectedUserCount = selected
    ? countUsersInUnitTree(users, orgUnits, selected.id)
    : 0;

  const canManage = can("organization.manage");

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الهيكل التنظيمي" },
        ]}
      />

      <PageHeader
        title="الهيكل التنظيمي"
        description="شجرة الجهات التنظيمية — الإدارات، الأقسام، والفرق. حدّد أي جهة لعرض تفاصيلها."
        actions={
          canManage && (
            <Button asChild>
              <Link href="/app/organization/new">
                <Plus className="size-4" />
                إنشاء جهة
              </Link>
            </Button>
          )
        }
      />

      {orgUnits.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<Network className="size-6" />}
              title="لا توجد جهات تنظيمية"
              description="لم يتم إنشاء أي جهة بعد."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* الشجرة — تميل لشريط أكبر على سطح المكتب */}
          <Card className="lg:col-span-3">
            <CardContent className="p-3">
              <TreeView
                nodes={nodes}
                rootIds={rootIds}
                selectedId={selectedId}
                onSelect={setSelectedId}
                defaultExpandAll
                renderNode={(node, { isExpanded }) => (
                  <OrgUnitNodeView
                    unit={node.data}
                    childrenCount={node.childrenIds.length}
                    userCount={countUsersInUnitTree(users, orgUnits, node.id)}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* لوحة التفاصيل المختصرة */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              {!selected ? (
                <EmptyState
                  icon={<Network className="size-6" />}
                  title="اختر جهة"
                  description="انقر على أي جهة في الشجرة لعرض تفاصيلها."
                  className="border-0"
                />
              ) : (
                <SelectedUnitPanel
                  unit={selected}
                  unitChildren={selectedChildren}
                  userCount={selectedUserCount}
                  canManage={canManage}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function OrgUnitNodeView({
  unit,
  childrenCount,
  userCount,
}: {
  unit: OrgUnit;
  childrenCount: number;
  userCount: number;
}) {
  return (
    <div className="flex-1 flex items-center justify-between gap-2 py-1.5 pr-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
          {ORG_UNIT_TYPE_LABELS[unit.type]}
        </span>
        <span className="text-sm font-medium text-foreground truncate">
          {unit.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {userCount > 0 && (
          <Badge variant="outline" className="text-[10px] tabular-nums h-4 px-1">
            {userCount} مستخدم
          </Badge>
        )}
        {childrenCount > 0 && (
          <Badge variant="secondary" className="text-[10px] tabular-nums h-4 px-1">
            {childrenCount} فرع
          </Badge>
        )}
      </div>
    </div>
  );
}

function SelectedUnitPanel({
  unit,
  unitChildren,
  userCount,
  canManage,
}: {
  unit: OrgUnit;
  unitChildren: OrgUnit[];
  userCount: number;
  canManage: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {ORG_UNIT_TYPE_LABELS[unit.type]}
          </span>
          {unit.code && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {unit.code}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-foreground">{unit.name}</h3>
        {unit.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {unit.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md border border-border p-2.5">
          <div className="text-lg font-semibold text-foreground tabular-nums">
            {userCount}
          </div>
          <div className="text-[10px] text-muted-foreground">مستخدم</div>
        </div>
        <div className="rounded-md border border-border p-2.5">
          <div className="text-lg font-semibold text-foreground tabular-nums">
            {unitChildren.length}
          </div>
          <div className="text-[10px] text-muted-foreground">جهة تابعة</div>
        </div>
      </div>

      {unitChildren.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">الجهات التابعة</div>
          <div className="flex flex-wrap gap-1">
            {unitChildren.slice(0, 8).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5"
              >
                {c.name}
              </span>
            ))}
            {unitChildren.length > 8 && (
              <span className="text-[11px] text-muted-foreground">
                +{unitChildren.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button asChild size="sm" variant="default">
          <Link href={`/app/organization/${unit.id}`}>
            <Eye className="size-3.5" />
            عرض التفاصيل
          </Link>
        </Button>
        {canManage && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/app/organization/${unit.id}/edit`}>
              <Pencil className="size-3.5" />
              تعديل
            </Link>
          </Button>
        )}
        {canManage && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/app/organization/new?parentId=${unit.id}`}>
              <Plus className="size-3.5" />
              إضافة فرع
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
