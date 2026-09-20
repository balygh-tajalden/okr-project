"use client";

import { useMemo, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonPage } from "@/components/common/skeleton-page";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  filterUsersByScope,
  getUserRoles,
  getUserPrimaryUnitName,
} from "@/lib/services/institutional";
import {
  ACCOUNT_STATUS_LABELS,
  type AccountStatus,
} from "@/lib/data/types";
import {
  Users as UsersIcon,
  UserPlus,
  Eye,
  Pencil,
  UserCheck,
  UserX,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function UsersPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["users.view"]}>
      <UsersList />
    </ProtectedRoute>
  );
}

function UsersList() {
  const { user: currentUser, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const roles = useInstitutionalStore((s) => s.roles);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const hydrated = useInstitutionalStore((s) => s.users.length > 0 || s.roles.length > 0);

  // الفلاتر
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!currentUser) return [];
    // طبّق النطاق التنظيمي في طبقة البيانات
    let list = filterUsersByScope(currentUser, users, orgUnits);

    // بحث نصي
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q)
      );
    }
    // فلترة بالدور
    if (roleFilter) {
      list = list.filter((u) => u.roleIds.includes(roleFilter));
    }
    // فلترة بالجهة
    if (orgFilter) {
      list = list.filter((u) => u.primaryOrgUnitId === orgFilter);
    }
    // فلترة بالحالة
    if (statusFilter) {
      list = list.filter((u) => u.status === (statusFilter as AccountStatus));
    }
    // ترتيب أبجدي بالاسم
    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  }, [currentUser, users, orgUnits, search, roleFilter, orgFilter, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasActiveFilters =
    !!search || !!roleFilter || !!orgFilter || !!statusFilter;

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setOrgFilter("");
    setStatusFilter("");
    setPage(1);
  };

  // خيارات الفلاتر تعتمد على البيانات الفعلية (وليست hardcoded)
  const roleOptions = roles
    .filter((r) => !r.isSystem || r.id !== "r-sys-admin" || can("system.admin"))
    .map((r) => ({ value: r.id, label: r.name }));

  const orgOptions = orgUnits
    .filter((u) => u.type !== "institution")
    .map((u) => ({ value: u.id, label: u.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "ar"));

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "المستخدمون" },
        ]}
      />

      <PageHeader
        title="المستخدمون"
        description="إدارة حسابات المستخدمين وأدوارهم وارتباطهم التنظيمي ضمن النطاق المسموح."
        actions={
          can("users.create") && (
            <Button asChild>
              <Link href="/app/users/new">
                <UserPlus className="size-4" />
                إنشاء مستخدم
              </Link>
            </Button>
          )
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="ابحث بالاسم أو اسم المستخدم أو البريد أو رقم الموظف..."
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        filters={
          <>
            <FilterSelect
              label="الدور"
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
              options={roleOptions}
            />
            <FilterSelect
              label="الجهة"
              value={orgFilter}
              onChange={(v) => {
                setOrgFilter(v);
                setPage(1);
              }}
              options={orgOptions}
            />
            <FilterSelect
              label="الحالة"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={[
                { value: "active", label: ACCOUNT_STATUS_LABELS.active },
                { value: "disabled", label: ACCOUNT_STATUS_LABELS.disabled },
              ]}
            />
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {!hydrated ? (
            <SkeletonPage cards={4} showHeader={false} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="size-6" />}
              title={hasActiveFilters ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون"}
              description={
                hasActiveFilters
                  ? "جرّب تعديل عوامل التصفية أو إعادة تعيينها."
                  : "لا يوجد مستخدمون ضمن النطاق الحالي."
              }
              className="border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">الجهة التنظيمية</TableHead>
                      <TableHead className="text-right">الدور</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">رقم الموظف</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((u) => {
                      const userRoles = getUserRoles(u, roles);
                      const unitName = getUserPrimaryUnitName(u, orgUnits);
                      return (
                        <TableRow key={u.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
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
                            {unitName}
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
                          <TableCell>
                            <StatusBadge
                              variant={u.status === "active" ? "success" : "danger"}
                              dot
                              size="sm"
                            >
                              {ACCOUNT_STATUS_LABELS[u.status]}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {u.employeeId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5"
                              >
                                <Link href={`/app/users/${u.id}`}>
                                  <Eye className="size-3.5" />
                                  عرض
                                </Link>
                              </Button>
                              {can("users.update") && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1.5"
                                >
                                  <Link href={`/app/users/${u.id}/edit`}>
                                    <Pencil className="size-3.5" />
                                    تعديل
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
