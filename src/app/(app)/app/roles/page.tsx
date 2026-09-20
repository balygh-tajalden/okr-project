"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar } from "@/components/data-table/filter-bar";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { FormDialog } from "@/components/common/form-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { RoleFormFields, type RoleFormValues } from "@/components/forms/role-form-fields";
import { useInstitutionalStore } from "@/lib/data/store";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import type { Role } from "@/lib/data/types";
import { Eye, Pencil, KeyRound, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function RolesPage() {
  return (
    <ProtectedRoute requiredPermissions={["roles.view"]}>
      <RolesList />
    </ProtectedRoute>
  );
}

function RolesList() {
  const roles = useInstitutionalStore((s) => s.roles);
  const users = useInstitutionalStore((s) => s.users);
  const createRole = useInstitutionalStore((s) => s.createRole);
  const updateRole = useInstitutionalStore((s) => s.updateRole);
  const { can } = useCurrentInstitutionalUser();
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [createValues, setCreateValues] = useState<RoleFormValues>({
    name: "",
    description: "",
    permissions: [],
  });
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});
  const [editValues, setEditValues] = useState<RoleFormValues>({
    name: "",
    description: "",
    permissions: [],
  });
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});

  const filtered = useMemo(() => {
    let list = [...roles];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
      );
    }
    if (systemFilter === "system") list = list.filter((r) => r.isSystem);
    if (systemFilter === "custom") list = list.filter((r) => !r.isSystem);
    return list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [roles, search, systemFilter]);

  const hasFilters = !!search || !!systemFilter;

  const usersPerRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      for (const rId of u.roleIds) {
        map.set(rId, (map.get(rId) ?? 0) + 1);
      }
    }
    return map;
  }, [users]);

  // Create handlers
  const openCreateModal = () => {
    setCreateValues({ name: "", description: "", permissions: [] });
    setCreateErrors({});
    setCreateModalOpen(true);
  };

  const handleCreate = () => {
    const e: Partial<Record<keyof RoleFormValues, string>> = {};
    if (!createValues.name.trim()) e.name = "اسم الدور مطلوب.";
    if (roles.some((r) => r.name === createValues.name.trim()))
      e.name = "يوجد دور بنفس الاسم. اختر اسماً آخر.";
    if (createValues.permissions.length === 0)
      e.permissions = "يجب اختيار صلاحية واحدة على الأقل.";
    setCreateErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      const created = createRole({
        name: createValues.name.trim(),
        description: createValues.description.trim() || undefined,
        permissions: createValues.permissions,
      });
      toast.success(`تم إنشاء الدور "${created.name}" بنجاح.`);
      setCreateModalOpen(false);
    });
  };

  // Edit handlers
  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setEditValues({
      name: role.name,
      description: role.description ?? "",
      permissions: [...role.permissions],
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEdit = () => {
    if (!editingRole) return;
    const e: Partial<Record<keyof RoleFormValues, string>> = {};
    if (!editValues.name.trim()) e.name = "اسم الدور مطلوب.";
    if (roles.some((r) => r.id !== editingRole.id && r.name === editValues.name.trim()))
      e.name = "يوجد دور آخر بنفس الاسم. اختر اسماً آخر.";
    if (editValues.permissions.length === 0)
      e.permissions = "يجب اختيار صلاحية واحدة على الأقل.";
    setEditErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      updateRole(editingRole.id, {
        name: editValues.name.trim(),
        description: editValues.description.trim() || undefined,
        permissions: editValues.permissions,
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
          { label: "الأدوار والصلاحيات" },
        ]}
      />

      <PageHeader
        title="الأدوار والصلاحيات"
        description="إدارة الأدوار المؤسسية والصلاحيات المُسندة إليها."
        actions={
          can("roles.manage") && (
            <Button onClick={openCreateModal}>
              <Plus className="size-4" />
              إنشاء دور
            </Button>
          )
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الدور أو الوصف..."
        hasActiveFilters={hasFilters}
        onReset={() => {
          setSearch("");
          setSystemFilter("");
        }}
        filters={
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>النوع</span>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">الكل</option>
              <option value="system">نظامي</option>
              <option value="custom">مخصّص</option>
            </select>
          </label>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد أدوار"}
              description={hasFilters ? "جرّب تعديل عوامل التصفية." : "لم يتم إنشاء أي أدوار بعد."}
              className="border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">اسم الدور</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الصلاحيات</TableHead>
                    <TableHead className="text-right">المستخدمون</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {r.isSystem ? (
                              <ShieldCheck className="size-4" />
                            ) : (
                              <KeyRound className="size-4" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {r.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">
                        <div className="line-clamp-2">{r.description ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={r.isSystem ? "info" : "neutral"}
                          size="sm"
                        >
                          {r.isSystem ? "نظامي" : "مخصّص"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="tabular-nums">
                          {r.permissions.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="tabular-nums">
                          {usersPerRole.get(r.id) ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5"
                          >
                            <Link href={`/app/roles/${r.id}`}>
                              <Eye className="size-3.5" />
                              عرض
                            </Link>
                          </Button>
                          {can("roles.manage") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5"
                              onClick={() => openEditModal(r)}
                            >
                              <Pencil className="size-3.5" />
                              تعديل
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: إنشاء دور */}
      <FormDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="إنشاء دور"
        description="أنشئ دوراً جديداً واختر الصلاحيات المُسندة إليه."
        submitLabel="حفظ الدور"
        onSubmit={handleCreate}
        isSubmitting={isPending}
        size="lg"
      >
        <RoleFormFields
          values={createValues}
          onChange={(patch) => setCreateValues((v) => ({ ...v, ...patch }))}
          errors={createErrors}
        />
      </FormDialog>

      {/* Modal: تعديل دور */}
      {editingRole && (
        <FormDialog
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title={`تعديل: ${editingRole.name}`}
          description="عدّل اسم الدور ووصفه وصلاحياته."
          submitLabel="حفظ التعديلات"
          onSubmit={handleEdit}
          isSubmitting={isPending}
          size="lg"
        >
          <RoleFormFields
            values={editValues}
            onChange={(patch) => setEditValues((v) => ({ ...v, ...patch }))}
            errors={editErrors}
            isSystem={editingRole.isSystem}
          />
        </FormDialog>
      )}
    </div>
  );
}
