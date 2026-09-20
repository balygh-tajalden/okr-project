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
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
} from "@/components/common/phase3-badges";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { getReviewableObjectives } from "@/lib/services/phase3-services";
import {
  OBJECTIVE_TYPE_LABELS,
  type ObjectiveType,
} from "@/lib/data/phase3-types";
import { GitPullRequestArrow, Eye, Calendar, UserCircle } from "lucide-react";

export default function ReviewsPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["goals.review", "goals.approve"]}>
      <ReviewsList />
    </ProtectedRoute>
  );
}

function ReviewsList() {
  const { user: currentUser, roles } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const objectives = usePhase3Store((s) => s.objectives);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");

  // قائمة الأهداف المؤهلة للمراجعة (مفلترة بالصلاحية والنطاق)
  const reviewable = useMemo(() => {
    if (!currentUser) return [];
    return getReviewableObjectives(
      currentUser,
      roles,
      objectives,
      orgUnits
    );
  }, [currentUser, roles, objectives, orgUnits]);

  const filtered = useMemo(() => {
    let list = [...reviewable];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.description ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((o) => o.type === (typeFilter as ObjectiveType));
    if (cycleFilter) list = list.filter((o) => o.cycleId === cycleFilter);
    return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [reviewable, search, typeFilter, cycleFilter]);

  const hasFilters = !!search || !!typeFilter || !!cycleFilter;
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setCycleFilter("");
  };

  const cycleOptions = cycles.map((c) => ({ value: c.id, label: c.name }));
  const ownerName = (id: string) => users.find((u) => u.id === id)?.fullName ?? "—";
  const orgUnitName = (id: string) => orgUnits.find((u) => u.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "المراجعات والاعتمادات" },
        ]}
      />

      <PageHeader
        title="المراجعات والاعتمادات"
        description="الأهداف المُرسلة للمراجعة ضمن نطاقك التنظيمي. راجع واعتمد أو أعد للتعديل."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث بعنوان الهدف المُرسل للمراجعة..."
        hasActiveFilters={hasFilters}
        onReset={resetFilters}
        filters={
          <>
            <FilterSelect
              label="النوع"
              value={typeFilter}
              onChange={setTypeFilter}
              options={(Object.keys(OBJECTIVE_TYPE_LABELS) as ObjectiveType[]).map((t) => ({
                value: t,
                label: OBJECTIVE_TYPE_LABELS[t],
              }))}
            />
            <FilterSelect
              label="الدورة"
              value={cycleFilter}
              onChange={setCycleFilter}
              options={cycleOptions}
            />
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<GitPullRequestArrow className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد أهداف قيد المراجعة"}
              description={
                hasFilters
                  ? "جرّب تعديل عوامل التصفية."
                  : "لا توجد أهداف مُرسلة للمراجعة ضمن نطاقك حالياً."
              }
              className="border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">المالك</TableHead>
                    <TableHead className="text-right">الجهة</TableHead>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/20">
                      <TableCell>
                        <Link
                          href={`/app/reviews/${o.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                        >
                          {o.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <ObjectiveTypeBadge type={o.type} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserCircle className="size-3" />
                          {ownerName(o.ownerId)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {orgUnitName(o.orgUnitId)}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatShort(o.startDate)} — {formatShort(o.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          size="sm"
                          variant="default"
                          className="h-8 gap-1.5"
                        >
                          <Link href={`/app/reviews/${o.id}`}>
                            <Eye className="size-3.5" />
                            مراجعة
                          </Link>
                        </Button>
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
