"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { FormDialog } from "@/components/common/form-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { TreeView, buildTree } from "@/components/tree/tree-view";
import { OrgUnitTypeIcon } from "@/components/common/org-unit-type-icon";
import { OrgUnitFormFields } from "@/components/forms/org-unit-form-fields";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  countUsersInUnitTree,
  getChildUnits,
  getAncestorPath,
} from "@/lib/services/institutional";
import { wouldCreateCycle } from "@/lib/services/institutional";
import {
  ORG_UNIT_TYPE_LABELS,
  type OrgUnit,
  type OrgUnitType,
} from "@/lib/data/types";
import {
  Network,
  Plus,
  Eye,
  Pencil,
  Building2,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

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
  const createOrgUnit = useInstitutionalStore((s) => s.createOrgUnit);
  const updateOrgUnit = useInstitutionalStore((s) => s.updateOrgUnit);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string>("");
  const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null);

  // Form values for create
  const [createValues, setCreateValues] = useState({
    name: "",
    type: "department" as OrgUnitType,
    parentId: "",
    code: "",
    description: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Form values for edit
  const [editValues, setEditValues] = useState({
    name: "",
    type: "department" as OrgUnitType,
    parentId: "",
    code: "",
    description: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

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
  const selectedAncestors = selected
    ? getAncestorPath(orgUnits, selected.id)
    : [];
  const selectedDirectUsers = selected
    ? users.filter((u) => u.primaryOrgUnitId === selected.id)
    : [];

  const canManage = can("organization.manage");

  // Create handlers
  const openCreateModal = (parentId?: string) => {
    setCreateParentId(parentId ?? "");
    setCreateValues({
      name: "",
      type: "department",
      parentId: parentId ?? "",
      code: "",
      description: "",
    });
    setCreateErrors({});
    setCreateModalOpen(true);
  };

  const handleCreate = () => {
    const e: Record<string, string> = {};
    if (!createValues.name.trim()) e.name = "اسم الجهة مطلوب.";
    if (createValues.parentId && wouldCreateCycle(orgUnits, "temp", createValues.parentId)) {
      // لا حاجة لفحص الحلقة عند الإنشاء (الوحدة لا توجد بعد)
    }
    setCreateErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      const created = createOrgUnit({
        name: createValues.name.trim(),
        type: createValues.type,
        parentId: createValues.parentId || null,
        code: createValues.code.trim() || undefined,
        description: createValues.description.trim() || undefined,
      });
      toast.success(`تم إنشاء الجهة "${created.name}" بنجاح.`);
      setCreateModalOpen(false);
      setSelectedId(created.id);
    });
  };

  // Edit handlers
  const openEditModal = (unit: OrgUnit) => {
    setEditingUnit(unit);
    setEditValues({
      name: unit.name,
      type: unit.type,
      parentId: unit.parentId ?? "",
      code: unit.code ?? "",
      description: unit.description ?? "",
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEdit = () => {
    if (!editingUnit) return;
    const e: Record<string, string> = {};
    if (!editValues.name.trim()) e.name = "اسم الجهة مطلوب.";
    if (editValues.parentId && wouldCreateCycle(orgUnits, editingUnit.id, editValues.parentId)) {
      e.parentId =
        "لا يمكن تعيين هذه الجهة كوالدة لأنها ستشكّل حلقة في الشجرة.";
    }
    setEditErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      updateOrgUnit(editingUnit.id, {
        name: editValues.name.trim(),
        type: editValues.type,
        parentId: editValues.parentId || null,
        code: editValues.code.trim() || undefined,
        description: editValues.description.trim() || undefined,
      });
      toast.success("تم حفظ التعديلات بنجاح.");
      setEditModalOpen(false);
    });
  };

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
        description="شجرة الجهات التنظيمية. انقر على أي جهة لعرض تفاصيلها وأبنائها."
        actions={
          canManage && (
            <Button onClick={() => openCreateModal()}>
              <Plus className="size-4" />
              إنشاء جهة
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
          {/* الشجرة */}
          <Card className="lg:col-span-3">
            <CardContent className="p-3">
              <TreeView
                nodes={nodes}
                rootIds={rootIds}
                selectedId={selectedId}
                onSelect={setSelectedId}
                defaultExpandAll
                renderNode={(node) => (
                  <OrgUnitNodeView
                    unit={node.data}
                    childrenCount={node.childrenIds.length}
                    userCount={countUsersInUnitTree(users, orgUnits, node.id)}
                    isSelected={selectedId === node.id}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* لوحة التفاصيل */}
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
                  ancestors={selectedAncestors}
                  directUsers={selectedDirectUsers}
                  canManage={canManage}
                  onEdit={() => openEditModal(selected)}
                  onAddChild={() => openCreateModal(selected.id)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: إنشاء جهة */}
      <FormDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="إنشاء جهة تنظيمية"
        description="أنشئ جهة جديدة واربطها بجهة أم."
        submitLabel="حفظ الجهة"
        onSubmit={handleCreate}
        isSubmitting={isPending}
      >
        <OrgUnitFormFields
          values={createValues}
          onChange={(patch) => setCreateValues((v) => ({ ...v, ...patch }))}
          errors={createErrors}
          orgUnits={orgUnits}
        />
      </FormDialog>

      {/* Modal: تعديل جهة */}
      {editingUnit && (
        <FormDialog
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title={`تعديل: ${editingUnit.name}`}
          description="عدّل بيانات الجهة وموقعها في الهيكل."
          submitLabel="حفظ التعديلات"
          onSubmit={handleEdit}
          isSubmitting={isPending}
        >
          <OrgUnitFormFields
            values={editValues}
            onChange={(patch) => setEditValues((v) => ({ ...v, ...patch }))}
            errors={editErrors}
            orgUnits={orgUnits}
            selfId={editingUnit.id}
          />
        </FormDialog>
      )}
    </div>
  );
}

function OrgUnitNodeView({
  unit,
  childrenCount,
  userCount,
  isSelected,
}: {
  unit: OrgUnit;
  childrenCount: number;
  userCount: number;
  isSelected: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <OrgUnitTypeIcon type={unit.type} size="sm" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {unit.name}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {ORG_UNIT_TYPE_LABELS[unit.type]}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {userCount > 0 && (
          <Badge variant="outline" className="text-[10px] tabular-nums h-4 px-1">
            {userCount}
          </Badge>
        )}
        {childrenCount > 0 && (
          <Badge variant="secondary" className="text-[10px] tabular-nums h-4 px-1">
            {childrenCount}
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
  ancestors,
  directUsers,
  canManage,
  onEdit,
  onAddChild,
}: {
  unit: OrgUnit;
  unitChildren: OrgUnit[];
  userCount: number;
  ancestors: OrgUnit[];
  directUsers: { id: string; fullName: string; initials: string; jobTitle: string; status: string }[];
  canManage: boolean;
  onEdit: () => void;
  onAddChild: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header with icon + type + name */}
      <div className="flex items-start gap-3">
        <OrgUnitTypeIcon type={unit.type} size="lg" />
        <div className="space-y-1 min-w-0">
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
      </div>

      {/* Ancestor path */}
      {ancestors.length > 1 && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
          {ancestors.slice(0, -1).map((a, i) => (
            <span key={a.id} className="flex items-center gap-1">
              {a.name}
              {i < ancestors.length - 2 && <span className="text-border">←</span>}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border p-2.5 flex items-center gap-2">
          <UsersIcon className="size-4 text-muted-foreground" />
          <div>
            <div className="text-lg font-semibold text-foreground tabular-nums">
              {userCount}
            </div>
            <div className="text-[10px] text-muted-foreground">مستخدم في الشجرة</div>
          </div>
        </div>
        <div className="rounded-md border border-border p-2.5 flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <div>
            <div className="text-lg font-semibold text-foreground tabular-nums">
              {unitChildren.length}
            </div>
            <div className="text-[10px] text-muted-foreground">جهة تابعة</div>
          </div>
        </div>
      </div>

      {/* Children */}
      {unitChildren.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">الجهات التابعة</div>
          <div className="space-y-1">
            {unitChildren.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 text-xs text-foreground bg-muted/30 rounded px-2 py-1.5"
              >
                <OrgUnitTypeIcon type={c.type} size="sm" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {ORG_UNIT_TYPE_LABELS[c.type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct users */}
      {directUsers.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">المستخدمون المباشرون</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {directUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1.5"
              >
                <span className="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                  {u.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground truncate">{u.fullName}</div>
                  <div className="text-[10px] text-muted-foreground">{u.jobTitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <Button asChild size="sm" variant="default">
          <Link href={`/app/organization/${unit.id}`}>
            <Eye className="size-3.5" />
            عرض التفاصيل
          </Link>
        </Button>
        {canManage && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="size-3.5" />
            تعديل
          </Button>
        )}
        {canManage && (
          <Button size="sm" variant="ghost" onClick={onAddChild}>
            <Plus className="size-3.5" />
            إضافة فرع
          </Button>
        )}
      </div>
    </div>
  );
}
