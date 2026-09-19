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
import { StatusBadge, OkrStatusBadges } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  CYCLE_TYPE_LABELS,
  CYCLE_STATUS_LABELS,
  type CycleStatus,
  type CycleType,
} from "@/lib/data/types";
import {
  Repeat,
  Plus,
  Eye,
  Pencil,
  PlayCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function CyclesPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["cycles.view", "cycles.create"]}>
      <CyclesList />
    </ProtectedRoute>
  );
}

function CyclesList() {
  const { can } = useCurrentInstitutionalUser();
  const cycles = useInstitutionalStore((s) => s.cycles);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...cycles];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((c) => c.type === (typeFilter as CycleType));
    if (statusFilter)
      list = list.filter((c) => c.status === (statusFilter as CycleStatus));
    return list.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [cycles, search, typeFilter, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasFilters = !!search || !!typeFilter || !!statusFilter;
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الئيسية", href: "/app" },
          { label: "دورات OKR" },
        ]}
      />

      <PageHeader
        title="دورات OKR"
        description="إدارة دورات التخطيط الفصلية والسنوية التي تحكم الأهداف."
        actions={
          can("cycles.create") && (
            <Button asChild>
              <Link href="/app/cycles/new">
                <Plus className="size-4" />
                إنشاء دورة
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
        searchPlaceholder="ابحث باسم الدورة أو الوصف..."
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
              options={(Object.keys(CYCLE_TYPE_LABELS) as CycleType[]).map((t) => ({
                value: t,
                label: CYCLE_TYPE_LABELS[t],
              }))}
            />
            <FilterSelect
              label="الحالة"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={(Object.keys(CYCLE_STATUS_LABELS) as CycleStatus[]).map((s) => ({
                value: s,
                label: CYCLE_STATUS_LABELS[s],
              }))}
            />
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Repeat className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة" : "لم يتم إنشاء دورات بعد"}
              description={
                hasFilters
                  ? "جرّب تعديل عوامل التصفية."
                  : "أنشئ أول دورة OKR لبدء التخطيط."
              }
              className="border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right">اسم الدورة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {c.name}
                            </span>
                            {c.description && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {c.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CYCLE_TYPE_LABELS[c.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            {formatDate(c.startDate)} — {formatDate(c.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <CycleStatusBadge status={c.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5"
                            >
                              <Link href={`/app/cycles/${c.id}`}>
                                <Eye className="size-3.5" />
                                عرض
                              </Link>
                            </Button>
                            {can("cycles.update") && c.status === "draft" && (
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5"
                              >
                                <Link href={`/app/cycles/${c.id}/edit`}>
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

export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  if (status === "draft") return <OkrStatusBadges.Pending size="sm" />;
  if (status === "active") return <OkrStatusBadges.InProgress size="sm" />;
  return <OkrStatusBadges.Completed size="sm" />;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
