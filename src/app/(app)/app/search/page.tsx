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
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
} from "@/components/common/phase3-badges";
import { PerformanceStatusBadge } from "@/components/common/performance-badge";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import { filterObjectivesByScopeAndPermissions } from "@/lib/services/phase3-services";
import {
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculatePerformanceStatus,
  calculateKRProgress,
  formatProgress,
  getLatestApprovedValue,
} from "@/lib/services/phase4-calculations";
import {
  OBJECTIVE_STATUS_LABELS,
  OBJECTIVE_TYPE_LABELS,
  KR_PROGRESS_SOURCE_LABELS,
  type ObjectiveStatus,
  type ObjectiveType,
  type KrProgressSource,
} from "@/lib/data/phase3-types";
import type { PerformanceStatus } from "@/lib/data/phase4-types";
import {
  Search as SearchIcon,
  Target as TargetIcon,
  Eye,
  Calendar,
  UserCircle,
} from "lucide-react";

const PAGE_SIZE = 10;

type EntityType = "objectives" | "key_results";

export default function SearchPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["goals.view"]}>
      <SearchView />
    </ProtectedRoute>
  );
}

function SearchView() {
  const { user: currentUser, roles } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const allObjectives = usePhase3Store((s) => s.objectives);
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const allReviewEvents = usePhase3Store((s) => s.reviewEvents);
  const assignments = usePhase3Store((s) => s.assignments);
  const updateRequests = usePhase4Store((s) => s.updateRequests);

  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("objectives");
  const [cycleFilter, setCycleFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [krSourceFilter, setKrSourceFilter] = useState("");
  const [page, setPage] = useState(1);

  // الأهداف ضمن النطاق
  const scopedObjectives = useMemo(() => {
    if (!currentUser) return [];
    return filterObjectivesByScopeAndPermissions(
      currentUser,
      roles,
      allObjectives,
      orgUnits,
      assignments,
      users
    );
  }, [currentUser, roles, allObjectives, orgUnits, assignments, users]);

  // KRs ضمن النطاق (للأهداف المرئية)
  const scopedKRIds = useMemo(() => {
    const objIds = new Set(scopedObjectives.map((o) => o.id));
    return allKeyResults.filter((k) => objIds.has(k.objectiveId));
  }, [scopedObjectives, allKeyResults]);

  // فلترة بالبحث والفلاتر
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (entityType === "objectives") {
      let list = [...scopedObjectives];
      if (q) {
        list = list.filter(
          (o) =>
            o.title.toLowerCase().includes(q) ||
            (o.description ?? "").toLowerCase().includes(q)
        );
      }
      if (cycleFilter) list = list.filter((o) => o.cycleId === cycleFilter);
      if (orgFilter) list = list.filter((o) => o.orgUnitId === orgFilter);
      if (statusFilter) list = list.filter((o) => o.status === (statusFilter as ObjectiveStatus));
      if (ownerFilter) list = list.filter((o) => o.ownerId === ownerFilter);
      if (performanceFilter) {
        list = list.filter((o) => {
          if (o.status !== "approved") return false;
          const actual = calculateObjectiveProgress(o, allKeyResults, updateRequests, allObjectives);
          const cycle = cycles.find((c) => c.id === o.cycleId);
          if (!cycle) return false;
          const approval = allReviewEvents.find(
            (e) => e.objectiveId === o.id && e.eventType === "approved"
          )?.at;
          const { expected } = calculateExpectedProgress(o, cycle, approval);
          const status = calculatePerformanceStatus(actual, expected);
          return status === performanceFilter;
        });
      }
      return list.map((o) => ({ type: "objective" as const, data: o }));
    } else {
      // key_results
      let list = [...scopedKRIds];
      if (q) {
        list = list.filter(
          (k) =>
            k.title.toLowerCase().includes(q) ||
            (k.description ?? "").toLowerCase().includes(q)
        );
      }
      if (krSourceFilter) list = list.filter((k) => k.progressSource === (krSourceFilter as KrProgressSource));
      // فلترة بالدورة/الجهة عبر الهدف الأب
      if (cycleFilter || orgFilter || statusFilter || performanceFilter || ownerFilter) {
        list = list.filter((k) => {
          const obj = scopedObjectives.find((o) => o.id === k.objectiveId);
          if (!obj) return false;
          if (cycleFilter && obj.cycleId !== cycleFilter) return false;
          if (orgFilter && obj.orgUnitId !== orgFilter) return false;
          if (statusFilter && obj.status !== statusFilter) return false;
          if (ownerFilter && obj.ownerId !== ownerFilter) return false;
          if (performanceFilter) {
            if (obj.status !== "approved") return false;
            const actual = calculateObjectiveProgress(obj, allKeyResults, updateRequests, allObjectives);
            const cycle = cycles.find((c) => c.id === obj.cycleId);
            if (!cycle) return false;
            const approval = allReviewEvents.find(
              (e) => e.objectiveId === obj.id && e.eventType === "approved"
            )?.at;
            const { expected } = calculateExpectedProgress(obj, cycle, approval);
            const status = calculatePerformanceStatus(actual, expected);
            if (status !== performanceFilter) return false;
          }
          return true;
        });
      }
      return list.map((k) => ({ type: "key_result" as const, data: k }));
    }
  }, [
    entityType, search, scopedObjectives, scopedKRIds, cycleFilter, orgFilter,
    statusFilter, performanceFilter, ownerFilter, krSourceFilter,
    allKeyResults, updateRequests, allObjectives, cycles, allReviewEvents,
  ]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasFilters = !!search || !!cycleFilter || !!orgFilter || !!statusFilter || !!performanceFilter || !!ownerFilter || !!krSourceFilter;

  const resetFilters = () => {
    setSearch("");
    setCycleFilter("");
    setOrgFilter("");
    setStatusFilter("");
    setPerformanceFilter("");
    setOwnerFilter("");
    setKrSourceFilter("");
    setPage(1);
  };

  const orgUnitName = (id: string) => orgUnits.find((u) => u.id === id)?.name ?? "—";
  const ownerName = (id: string) => users.find((u) => u.id === id)?.fullName ?? "—";
  const cycleName = (id: string) => cycles.find((c) => c.id === id)?.name ?? "—";
  const objectiveTitle = (id: string) => allObjectives.find((o) => o.id === id)?.title ?? "—";

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "البحث والتصفية" },
        ]}
      />

      <PageHeader
        title="البحث والتصفية"
        description="ابحث في الأهداف والنتائج الرئيسية ضمن نطاقك مع فلاتر متقدمة."
      />

      {/* اختيار نوع الكيان */}
      <div className="flex items-center gap-2">
        <Button
          variant={entityType === "objectives" ? "default" : "outline"}
          size="sm"
          onClick={() => { setEntityType("objectives"); setPage(1); }}
        >
          الأهداف
        </Button>
        <Button
          variant={entityType === "key_results" ? "default" : "outline"}
          size="sm"
          onClick={() => { setEntityType("key_results"); setPage(1); }}
        >
          النتائج الرئيسية
        </Button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={
          entityType === "objectives"
            ? "ابحث بعنوان الهدف أو الوصف..."
            : "ابحث بعنوان النتيجة أو الوصف..."
        }
        hasActiveFilters={hasFilters}
        onReset={resetFilters}
        filters={
          <>
            <FilterSelect
              label="الدورة"
              value={cycleFilter}
              onChange={(v) => { setCycleFilter(v); setPage(1); }}
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FilterSelect
              label="الجهة"
              value={orgFilter}
              onChange={(v) => { setOrgFilter(v); setPage(1); }}
              options={orgUnits.map((u) => ({ value: u.id, label: u.name }))}
            />
            {entityType === "objectives" && (
              <>
                <FilterSelect
                  label="الحالة"
                  value={statusFilter}
                  onChange={(v) => { setStatusFilter(v); setPage(1); }}
                  options={(Object.keys(OBJECTIVE_STATUS_LABELS) as ObjectiveStatus[]).map((s) => ({
                    value: s,
                    label: OBJECTIVE_STATUS_LABELS[s],
                  }))}
                />
                <FilterSelect
                  label="الأداء"
                  value={performanceFilter}
                  onChange={(v) => { setPerformanceFilter(v); setPage(1); }}
                  options={[
                    { value: "advanced", label: "متقدّم" },
                    { value: "on_track", label: "على المسار" },
                    { value: "delayed", label: "متأخر" },
                    { value: "stalled", label: "متعثر" },
                  ]}
                />
                <FilterSelect
                  label="المالك"
                  value={ownerFilter}
                  onChange={(v) => { setOwnerFilter(v); setPage(1); }}
                  options={users.map((u) => ({ value: u.id, label: u.fullName }))}
                />
              </>
            )}
            {entityType === "key_results" && (
              <FilterSelect
                label="مصدر التقدّم"
                value={krSourceFilter}
                onChange={(v) => { setKrSourceFilter(v); setPage(1); }}
                options={(Object.keys(KR_PROGRESS_SOURCE_LABELS) as KrProgressSource[]).map((s) => ({
                  value: s,
                  label: KR_PROGRESS_SOURCE_LABELS[s],
                }))}
              />
            )}
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة لمعايير البحث" : "لا توجد بيانات"}
              description={hasFilters ? "جرّب تعديل عوامل التصفية أو إعادة تعيينها." : "لم يتم العثور على بيانات."}
              className="border-0"
            />
          ) : (
            <>
              <div className="divide-y divide-border">
                {paged.map((item, idx) => {
                  if (item.type === "objective") {
                    const o = item.data;
                    const actual = calculateObjectiveProgress(o, allKeyResults, updateRequests, allObjectives);
                    let perfStatus: PerformanceStatus | undefined;
                    if (o.status === "approved") {
                      const cycle = cycles.find((c) => c.id === o.cycleId);
                      if (cycle) {
                        const approval = allReviewEvents.find(
                          (e) => e.objectiveId === o.id && e.eventType === "approved"
                        )?.at;
                        const { expected } = calculateExpectedProgress(o, cycle, approval);
                        perfStatus = calculatePerformanceStatus(actual, expected);
                      }
                    }
                    return (
                      <Link
                        key={`obj-${idx}`}
                        href={`/app/objectives/${o.id}`}
                        className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <TargetIcon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground line-clamp-1">
                              {o.title}
                            </span>
                            <ObjectiveTypeBadge type={o.type} size="sm" />
                            <ObjectiveStatusBadge status={o.status} size="sm" />
                            {perfStatus && <PerformanceStatusBadge status={perfStatus} size="sm" />}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                            <span>{cycleName(o.cycleId)}</span>
                            <span>•</span>
                            <span>{orgUnitName(o.orgUnitId)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <UserCircle className="size-3" />
                              {ownerName(o.ownerId)}
                            </span>
                            <span>•</span>
                            <span>التقدّم: {formatProgress(actual)}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  } else {
                    const kr = item.data;
                    const approved = getLatestApprovedValue(kr.id, updateRequests);
                    const progress = calculateKRProgress(kr, allKeyResults, updateRequests, allObjectives.filter(o => o.status === "approved"));
                    return (
                      <Link
                        key={`kr-${idx}`}
                        href={`/app/objectives/${kr.objectiveId}`}
                        className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                          <TargetIcon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground line-clamp-1">
                              {kr.title}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {KR_PROGRESS_SOURCE_LABELS[kr.progressSource]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                            <span>الهدف: {objectiveTitle(kr.objectiveId)}</span>
                            <span>•</span>
                            <span>التقدّم: {formatProgress(progress)}</span>
                            {approved && (
                              <>
                                <span>•</span>
                                <span>
                                  القيمة:{" "}
                                  {approved.kind === "numeric"
                                    ? approved.numericValue
                                    : approved.binaryValue
                                      ? "تحقق"
                                      : "لم يتحقق"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  }
                })}
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
