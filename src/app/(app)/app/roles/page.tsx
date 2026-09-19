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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar } from "@/components/data-table/filter-bar";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useInstitutionalStore } from "@/lib/data/store";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { Eye, Pencil, KeyRound, Plus, ShieldCheck } from "lucide-react";

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
  const { can } = useCurrentInstitutionalUser();
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");

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

  // عدّ المستخدمين لكل دور
  const usersPerRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      for (const rId of u.roleIds) {
        map.set(rId, (map.get(rId) ?? 0) + 1);
      }
    }
    return map;
  }, [users]);

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
            <Button asChild>
              <Link href="/app/roles/new">
                <Plus className="size-4" />
                إنشاء دور
              </Link>
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
              description={
                hasFilters
                  ? "جرّب تعديل عوامل التصفية."
                  : "لم يتم إنشاء أي أدوار بعد."
              }
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
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5"
                            >
                              <Link href={`/app/roles/${r.id}/edit`}>
                                <Pencil className="size-3.5" />
                                تعديل
                              </Link>
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
    </div>
  );
}
