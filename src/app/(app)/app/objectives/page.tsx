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
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
} from "@/components/common/phase3-badges";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import {
  filterObjectivesByScopeAndPermissions,
  getExecutionReadinessMessage,
} from "@/lib/services/phase3-services";
import {
  OBJECTIVE_TYPE_LABELS,
  OBJECTIVE_STATUS_LABELS,
  type ObjectiveType,
  type ObjectiveStatus,
} from "@/lib/data/phase3-types";
import {
  CYCLE_STATUS_LABELS,
} from "@/lib/data/types";
import {
  Plus,
  Eye,
  GitBranch,
  Target as TargetIcon,
  Calendar,
  UserCircle,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function ObjectivesPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["goals.view"]}>
      <ObjectivesList />
    </ProtectedRoute>
  );
}

function ObjectivesList() {
  const { user: currentUser, roles, can } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const objectives = usePhase3Store((s) => s.objectives);
  const keyResults = usePhase3Store((s) => s.keyResults);
  const assignments = usePhase3Store((s) => s.assignments);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");
  const [alignedOnly, setAlignedOnly] = useState(false);
  const [page, setPage] = useState(1);

  // فلترة بالصلاحيات والنطاق
  const scopedObjectives = useMemo(() => {
    if (!currentUser) return [];
    return filterObjectivesByScopeAndPermissions(
      currentUser,
      roles,
      objectives,
      orgUnits,
      assignments,
      users
    );
  }, [currentUser, roles, objectives, orgUnits, assignments, users]);

  // فلترة بالبحث والفلاتر
  const filtered = useMemo(() => {
    let list = [...scopedObjectives];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.description ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((o) => o.type === (typeFilter as ObjectiveType));
    if (statusFilter)
      list = list.filter((o) => o.status === (statusFilter as ObjectiveStatus));
    if (cycleFilter) list = list.filter((o) => o.cycleId === cycleFilter);
    if (alignedOnly) list = list.filter((o) => !!o.upstreamKeyResultId);
    return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [scopedObjectives, search, typeFilter, statusFilter, cycleFilter, alignedOnly]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasFilters = !!search || !!typeFilter || !!statusFilter || !!cycleFilter || alignedOnly;
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setCycleFilter("");
    setAlignedOnly(false);
    setPage(1);
  };

  const cycleOptions = cycles
    .filter((c) => c.status !== "completed")
    .map((c) => ({ value: c.id, label: c.name }));

  const ownerName = (id: string) => users.find((u) => u.id === id)?.fullName ?? "—";
  const orgUnitName = (id: string) => orgUnits.find((u) => u.id === id)?.name ?? "—";
  const cycleName = (id: string) => cycles.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأهداف والنتائج الرئيسية" },
        ]}
      />

      <PageHeader
        title="الأهداف والنتائج الرئيسية"
        description="إنشاء وإدارة الأهداف المؤسسية والتنظيمية والفردية، مع النتائج الرئيسية والمحاذاة."
        actions={
          can("goals.create") && (
            <Button asChild>
              <Link href="/app/objectives/new">
                <Plus className="size-4" />
                إنشاء هدف
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
        searchPlaceholder="ابحث بعنوان الهدف أو الوصف..."
        hasActiveFilters={hasFilters}
        onReset={resetFilters}
        filters={
          <>
            <FilterSelect
              label="النوع"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
              options={(Object.keys(OBJECTIVE_TYPE_LABELS) as ObjectiveType[]).map((t) => ({
                value: t,
                label: OBJECTIVE_TYPE_LABELS[t],
              }))}
            />
            <FilterSelect
              label="الحالة"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={(Object.keys(OBJECTIVE_STATUS_LABELS) as ObjectiveStatus[]).map((s) => ({
                value: s,
                label: OBJECTIVE_STATUS_LABELS[s],
              }))}
            />
            <FilterSelect
              label="الدورة"
              value={cycleFilter}
              onChange={(v) => {
                setCycleFilter(v);
                setPage(1);
              }}
              options={cycleOptions}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={alignedOnly}
                onChange={(e) => {
                  setAlignedOnly(e.target.checked);
                  setPage(1);
                }}
                className="size-3.5"
              />
              الداعمة فقط
            </label>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<TargetIcon className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد أهداف بعد"}
              description={
                hasFilters
                  ? "جرّب تعديل عوامل التصفية أو إعادة تعيينها."
                  : "أنشئ أول هدف OKR لبدء التخطيط."
              }
              className="border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الدورة</TableHead>
                      <TableHead className="text-right">الجهة</TableHead>
                      <TableHead className="text-right">المالك</TableHead>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((o) => {
                      const krs = keyResults.filter((k) => k.objectiveId === o.id);
                      return (
                        <TableRow key={o.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-start gap-1.5 min-w-0">
                              {o.upstreamKeyResultId && (
                                <GitBranch className="size-3.5 mt-0.5 text-info shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/app/objectives/${o.id}`}
                                  className="text-sm font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                                >
                                  {o.title}
                                </Link>
                                {krs.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {krs.length} نتيجة رئيسية
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ObjectiveTypeBadge type={o.type} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cycleName(o.cycleId)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {orgUnitName(o.orgUnitId)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <UserCircle className="size-3" />
                              {ownerName(o.ownerId)}
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatShort(o.startDate)} — {formatShort(o.endDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ObjectiveStatusBadge status={o.status} size="sm" />
                          </TableCell>
                          <TableCell>
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5"
                            >
                              <Link href={`/app/objectives/${o.id}`}>
                                <Eye className="size-3.5" />
                                عرض
                              </Link>
                            </Button>
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

function formatShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
