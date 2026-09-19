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
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { UpdateRequestStatusBadge } from "@/components/common/phase4-badges";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import { canReviewUpdateRequest } from "@/lib/services/phase4-authorization";
import {
  UPDATE_REQUEST_STATUS_LABELS,
  type UpdateRequestStatus,
} from "@/lib/data/phase4-types";
import {
  Activity,
  Eye,
  Calendar,
  UserCircle,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function UpdatesPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["progress.view", "progress.review", "progress.update"]}>
      <UpdatesList />
    </ProtectedRoute>
  );
}

function UpdatesList() {
  const { user: currentUser, roles, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const objectives = usePhase3Store((s) => s.objectives);
  const keyResults = usePhase3Store((s) => s.keyResults);
  const updateRequests = usePhase4Store((s) => s.updateRequests);
  const evidence = usePhase4Store((s) => s.evidence);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // فلترة الطلبات حسب النطاق والصلاحية
  const scopedRequests = useMemo(() => {
    if (!currentUser) return [];
    return updateRequests.filter((r) => {
      const objective = objectives.find((o) => o.id === r.objectiveId);
      if (!objective) return false;

      // المُرسِل يرى طلباته
      if (r.submitterUserId === currentUser.id) return true;

      // المراجع المؤهّل يرى الطلبات في نطاقه
      if (can("progress.review") || can("evidence.review")) {
        const check = canReviewUpdateRequest(
          currentUser,
          roles,
          objective,
          orgUnits,
          r.submitterUserId
        );
        if (check.canReview) return true;
      }

      // مدير النظام يرى كل الطلبات
      if (can("system.admin")) return true;

      return false;
    });
  }, [currentUser, roles, updateRequests, objectives, orgUnits, can]);

  // فلترة بالبحث والحالة
  const filtered = useMemo(() => {
    let list = [...scopedRequests];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const obj = objectives.find((o) => o.id === r.objectiveId);
        const kr = keyResults.find((k) => k.id === r.keyResultId);
        return (
          r.submitterNotes.toLowerCase().includes(q) ||
          (obj?.title ?? "").toLowerCase().includes(q) ||
          (kr?.title ?? "").toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter) {
      list = list.filter((r) => r.status === (statusFilter as UpdateRequestStatus));
    }
    return list.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  }, [scopedRequests, search, statusFilter, objectives, keyResults]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasFilters = !!search || !!statusFilter;
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? "—";
  const objectiveTitle = (id: string) => objectives.find((o) => o.id === id)?.title ?? "—";
  const krTitle = (id: string) => keyResults.find((k) => k.id === id)?.title ?? "—";

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "تحديثات الإنجاز" },
        ]}
      />

      <PageHeader
        title="تحديثات الإنجاز"
        description="طلبات تحديث التقدّم للنتائج الرئيسية — بانتظار المراجعة، معتمدة، أو مُعادة."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="ابحث بملاحظات الطلب أو عنوان الهدف أو KR..."
        hasActiveFilters={hasFilters}
        onReset={resetFilters}
        filters={
          <FilterSelect
            label="الحالة"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={(Object.keys(UPDATE_REQUEST_STATUS_LABELS) as UpdateRequestStatus[]).map((s) => ({
              value: s,
              label: UPDATE_REQUEST_STATUS_LABELS[s],
            }))}
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Activity className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد طلبات تحديث"}
              description={
                hasFilters
                  ? "جرّب تعديل عوامل التصفية."
                  : "لم تُرسل أي طلبات تحديث تقدّم بعد."
              }
              className="border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right">الهدف / KR</TableHead>
                      <TableHead className="text-right">المُرسِل</TableHead>
                      <TableHead className="text-right">تاريخ الإرسال</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">القيمة المعتمدة</TableHead>
                      <TableHead className="text-right">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {objectiveTitle(r.objectiveId)}
                            </span>
                            <span className="text-sm font-medium text-foreground line-clamp-1">
                              {krTitle(r.keyResultId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <UserCircle className="size-3" />
                            {userName(r.submitterUserId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatShort(r.submittedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <UpdateRequestStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.status === "approved" && r.approvedValue ? (
                            <span className="text-success font-medium">
                              {r.approvedValue.kind === "numeric"
                                ? r.approvedValue.numericValue
                                : r.approvedValue.binaryValue
                                  ? "تحقق"
                                  : "لم يتحقق"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5"
                          >
                            <Link href={`/app/updates/${r.id}`}>
                              <Eye className="size-3.5" />
                              {r.status === "pending_review" ? "مراجعة" : "عرض"}
                            </Link>
                          </Button>
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
